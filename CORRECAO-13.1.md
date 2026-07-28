# Correção 13.1 — Quadro de Investigação

## O que foi corrigido

1. **Imagens que eram enviadas ao Drive, mas não apareciam no mural**
   - O navegador não depende mais do endereço público de miniatura do Google Drive.
   - O frontend solicita a imagem ao Apps Script usando o token da sessão.
   - O Apps Script valida a visibilidade do cartão e devolve a imagem em base64.
   - Anexos antigos são vinculados novamente aos cartões quando o instalador é executado.

2. **Cartão voltando por um instante à posição anterior**
   - Respostas antigas de sincronização são descartadas.
   - A posição local fica protegida enquanto a gravação está em andamento.
   - A versão salva pelo servidor é usada para confirmar a nova posição.
   - O mesmo tratamento vale para redimensionamento.

## Arquivos alterados

- `apps-script/Code.js`
- `src/pages/InvestigationBoard.jsx`
- `src/pages/InvestigationBoard.css`
- testes e documentação

## Aplicação

1. Copie o conteúdo do projeto para a pasta atual, preservando `.git` e `.env.local`.
2. Substitua todo o conteúdo do `Code.gs` pelo conteúdo de `apps-script/Code.js`.
3. Salve o Apps Script.
4. Execute `configurarAtualizacao13()` novamente.
5. Em **Implantar → Gerenciar implantações**, edite a implantação, escolha **Nova versão** e implante.
6. Reinicie o Vite ou faça um novo deploy na Vercel.
7. Recarregue o navegador com `Ctrl + F5` e entre novamente.

Não é necessário apagar imagens nem cartões já criados.
