import argparse
import datetime as dt
import os
import shutil
import sqlite3
import struct
from pathlib import Path


def parse_dbf(path: Path):
    with path.open("rb") as f:
        hdr = f.read(32)
        if len(hdr) < 32:
            raise ValueError(f"Arquivo DBF inválido: {path}")
        nrec = struct.unpack("<I", hdr[4:8])[0]
        hlen = struct.unpack("<H", hdr[8:10])[0]
        rlen = struct.unpack("<H", hdr[10:12])[0]

        fields = []
        while True:
            b = f.read(32)
            if not b or b[0] == 0x0D:
                break
            name = b[0:11].split(b"\x00", 1)[0].decode("latin-1", "ignore")
            ftype = chr(b[11])
            flen = b[16]
            fdec = b[17]
            fields.append((name, ftype, flen, fdec))

        f.seek(hlen)
        rows = []
        for _ in range(nrec):
            rec = f.read(rlen)
            if not rec:
                break
            if rec[0:1] == b"*":
                continue
            pos = 1
            row = {}
            for name, ftype, flen, fdec in fields:
                raw = rec[pos : pos + flen]
                pos += flen
                txt = raw.decode("latin-1", "ignore").strip()

                if ftype == "D":
                    if len(txt) == 8 and txt.isdigit():
                        row[name] = f"{txt[0:4]}-{txt[4:6]}-{txt[6:8]}"
                    else:
                        row[name] = ""
                elif ftype == "N":
                    if not txt:
                        row[name] = None
                    else:
                        txt = txt.replace(",", ".")
                        row[name] = float(txt) if fdec > 0 else int(float(txt))
                elif ftype == "L":
                    row[name] = txt.upper() in ("T", "Y")
                else:
                    row[name] = txt
            rows.append(row)
        return rows


def norm_code(v):
    v = (v or "").strip()
    if not v:
        return ""
    stripped = v.lstrip("0")
    return stripped if stripped else "0"


def bool_dizimista(v):
    if isinstance(v, bool):
        return v
    return str(v).strip().upper() in ("T", "Y", "1", "S")


def best_phone(row):
    ddd = (row.get("DDD") or "").strip()
    celular = (row.get("CELULAR") or row.get("FONE") or "").strip()
    telefone = (row.get("TELEFONE") or "").strip()
    chosen = celular if celular else telefone
    if ddd and chosen and not chosen.startswith("("):
        return f"({ddd}) {chosen}"
    return chosen


def best_address(row):
    parts = [
        (row.get("ENDERECO") or "").strip(),
        (row.get("BAIRRO") or "").strip(),
        " - ".join(
            p for p in [(row.get("CIDADE") or "").strip(), (row.get("ESTADO") or "").strip()] if p
        ),
        (row.get("CEP") or "").strip(),
    ]
    return ", ".join(p for p in parts if p)


def choose_parq_record(current, candidate):
    if current is None:
        return candidate
    ano_c = current.get("ANO") if isinstance(current.get("ANO"), int) else -1
    ano_n = candidate.get("ANO") if isinstance(candidate.get("ANO"), int) else -1
    if ano_n > ano_c:
        return candidate
    if ano_n == ano_c and len((candidate.get("NOME") or "").strip()) > len((current.get("NOME") or "").strip()):
        return candidate
    return current


def migrate(source_dir: Path, db_path: Path, replace: bool = True):
    parq_path = source_dir / "PARQANOS.DBF"
    diz_path = source_dir / "DIZIMOS.DBF"

    if not parq_path.exists() or not diz_path.exists():
        raise FileNotFoundError("Não encontrei PARQANOS.DBF e DIZIMOS.DBF no diretório informado.")

    parq_rows = parse_dbf(parq_path)
    diz_rows = parse_dbf(diz_path)

    by_code = {}
    for row in parq_rows:
        code = norm_code(row.get("CODIGO"))
        if not code:
            continue
        by_code[code] = choose_parq_record(by_code.get(code), row)

    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON")
    cur = conn.cursor()

    if replace:
        cur.execute("BEGIN")
        cur.execute("DELETE FROM devolucoes")
        cur.execute("DELETE FROM dizimistas")
        conn.commit()

    code_to_new_id = {}
    imported_dizimistas = 0

    for code, row in by_code.items():
        if not bool_dizimista(row.get("DIZIMISTA")):
            continue
        nome = (row.get("NOME") or "").strip()
        if not nome:
            continue
        nascimento = row.get("ANIVER") or ""
        endereco = best_address(row)
        telefone = best_phone(row)
        cur.execute(
            """
            INSERT INTO dizimistas (nome, telefone, nascimento, endereco)
            VALUES (?, ?, ?, ?)
            """,
            (nome, telefone, nascimento, endereco),
        )
        code_to_new_id[code] = cur.lastrowid
        imported_dizimistas += 1

    imported_devolucoes = 0
    skipped_empty_code = 0
    skipped_no_member = 0
    skipped_no_date = 0

    for row in diz_rows:
        code = norm_code(row.get("CODIGO"))
        if not code:
            skipped_empty_code += 1
            continue
        diz_id = code_to_new_id.get(code)
        if not diz_id:
            skipped_no_member += 1
            continue

        data = row.get("DATA") or ""
        referencia_date = row.get("REFERENCIA") or ""
        if not data:
            skipped_no_date += 1
            continue
        referencia = referencia_date[:7] if referencia_date else data[:7]
        valor = row.get("VALOR")
        if valor is None:
            continue

        cur.execute("SELECT nome FROM dizimistas WHERE id = ?", (diz_id,))
        diz_nome = cur.fetchone()[0]

        cur.execute(
            """
            INSERT INTO devolucoes (dizimista_id, dizimista_nome, valor, data, referencia, observacao)
            VALUES (?, ?, ?, ?, ?, '')
            """,
            (diz_id, diz_nome, float(valor), data, referencia),
        )
        imported_devolucoes += 1

    conn.commit()
    conn.close()

    return {
        "parq_rows": len(parq_rows),
        "diz_rows": len(diz_rows),
        "imported_dizimistas": imported_dizimistas,
        "imported_devolucoes": imported_devolucoes,
        "skipped_empty_code": skipped_empty_code,
        "skipped_no_member": skipped_no_member,
        "skipped_no_date": skipped_no_date,
    }


def main():
    default_source = Path(r"C:\Users\adeil\Downloads\Meg programa\Meg programa")
    default_db = Path.home() / "Documents" / "Sistema de Gestao Paroquial - SGP" / "data" / "sgp.sqlite"

    parser = argparse.ArgumentParser(description="Migra dados de dízimo do sistema MEG (DBF) para o SGP (SQLite).")
    parser.add_argument("--source", type=Path, default=default_source, help="Pasta com os arquivos DBF do MEG.")
    parser.add_argument("--db", type=Path, default=default_db, help="Caminho do banco SQLite do SGP.")
    parser.add_argument("--append", action="store_true", help="Não limpa dados atuais; apenas adiciona.")
    parser.add_argument("--no-backup", action="store_true", help="Não cria backup do SQLite antes de migrar.")
    args = parser.parse_args()

    if not args.source.exists():
        raise FileNotFoundError(f"Pasta de origem não encontrada: {args.source}")
    if not args.db.exists():
        raise FileNotFoundError(f"Banco SGP não encontrado: {args.db}")

    if not args.no_backup:
        ts = dt.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup = args.db.with_suffix(f".before_meg_migration_{ts}.bak")
        shutil.copy2(args.db, backup)
        print(f"Backup criado: {backup}")

    stats = migrate(args.source, args.db, replace=(not args.append))
    print("Migração concluída:")
    for k, v in stats.items():
        print(f"- {k}: {v}")


if __name__ == "__main__":
    main()
