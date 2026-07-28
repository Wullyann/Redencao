# Redenção — Atualização 13

Sistema de fichas e ferramentas de campanha em React + Vite, com backend em Google Apps Script, Google Planilhas e Google Drive.

## Desenvolvimento

```bash
cp .env.example .env.local
npm install
npm test
npm run build
npm run dev
```

Configure `VITE_APPS_SCRIPT_URL` com a URL `/exec` da implantação atual do Apps Script.

## Instalação completa

Leia [`INSTALACAO-ATUALIZACAO-13.md`](./INSTALACAO-ATUALIZACAO-13.md) antes de substituir o backend ou publicar na Vercel.

## Backend

O arquivo completo está em `apps-script/Code.js`. Execute `configurarAtualizacao13()` uma vez após colar e salvar o código. A função pode ser repetida com segurança.
