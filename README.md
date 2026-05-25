# Sistema de Gestão Paroquial (SGP)

Aplicativo desktop em Electron para gestão paroquial com banco local SQLite.

## Módulos atuais

- Dizimistas
- Agenda de Salas/Ambientes

## Funcionalidades principais

- Cadastro, edição e exclusão de dizimistas
- Registro de devoluções de dízimo
- Aniversariantes por período (padrão semanal)
- Relatórios financeiros com paginação
- Cadastro de ambientes e agenda de eventos
- Configuração da paróquia (nome, localização, brasão)

## Tecnologias

- Electron
- HTML/CSS/JavaScript
- SQLite (`node:sqlite`)

## Estrutura

```text
src/
  main/
    main.js
    preload.js
    database/
      schema.sql
      database.js
  renderer/
    index.html
    assets/
    css/
    js/
tools/
  migrate_meg_dizimo.py
```

## Requisitos

- Node.js LTS
- npm
- Windows 10/11 (build do instalador)

## Desenvolvimento

```bash
npm install
npm start
```

## Banco de dados

O banco é criado automaticamente em:

```text
%USERPROFILE%\Documents\Sistema de Gestao Paroquial - SGP\data\sgp.sqlite
```

## Build

Gerar pasta executável:

```bash
npm run dist
```

Gerar instalador `.exe`:

```bash
npm run dist:installer
```

Arquivos de saída:

```text
dist/
```

## Como adicionar um novo módulo

1. Criar a interface do módulo em `src/renderer/index.html` (nova seção `tab-content`).
2. Criar scripts em `src/renderer/js/features/`.
3. Registrar navegação em `src/renderer/js/core/navigation.js`.
4. Se precisar de persistência, criar tabela em `src/main/database/schema.sql`.
5. Implementar operações SQL em `src/main/database/database.js`.
6. Expor handlers IPC em `src/main/main.js` e funções no `preload.js`.

## Versionamento

- Não versionar `node_modules`, `dist` e bancos locais (`*.sqlite`, `*.db`).
- Versionar apenas código-fonte e ativos do aplicativo.
