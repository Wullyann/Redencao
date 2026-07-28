# Redenção — Instalação da Atualização 13

Este pacote contém o frontend React/Vite atualizado, o código completo do Google Apps Script e um backup lógico dos dois arquivos recebidos antes da alteração.

## 1. Faça uma cópia externa antes de publicar

A função `configurarAtualizacao13()` cria automaticamente uma cópia integral da planilha dentro de `Backups_Atualizacao13` na pasta do Drive configurada. Mesmo assim, mantenha o ZIP anterior guardado até validar a campanha.

## 2. Atualize o Google Apps Script

1. Abra a planilha do Redenção.
2. Acesse **Extensões > Apps Script**.
3. No editor, abra `Code.gs`.
4. Apague o conteúdo antigo e cole todo o conteúdo de `apps-script/Code.js` deste pacote.
5. Em **Configurações do projeto**, confira o fuso horário `America/Sao_Paulo`.
6. Salve o projeto.

Os IDs já estão configurados no início do arquivo:

- Planilha: `1ZI131N6hpL74byL_m-WMGpHczPBkIAojNaBnY14TOF4`
- Pasta principal do Drive: `17oLiv941IcKPIxdA1R35ZrPV8cif-qiL`

## 3. Execute o instalador da planilha

1. No seletor de funções do Apps Script, escolha `configurarAtualizacao13`.
2. Clique em **Executar**.
3. Na primeira execução, aceite as autorizações solicitadas para Planilhas e Drive.
4. Aguarde o retorno com `status: "sucesso"` no registro de execução.
5. Confira se foram criadas as abas:
   - `Ameacas`
   - `Historico_NEX`
   - `Pendencias_NEX`
   - `Testes_Ocultos`
   - `Investigacoes`
   - `Investigacao_Objetos`
   - `Investigacao_Conexoes`
   - `Investigacao_Comentarios`
   - `Investigacao_Arquivos`
   - `Investigacao_Historico`
   - `Investigacao_Permissoes`
   - `Sessoes`
6. Confira na aba `Fichas` as colunas `RD`, `Observação da RD`, `Pendência de Progressão` e `Token Portrait`.
7. Confira na pasta principal do Drive as subpastas `Investigacoes`, `Ameacas`, `Personagens` e `Backups_Atualizacao13`.

A função é idempotente: pode ser executada novamente sem duplicar colunas, recriar abas ou apagar dados. O backup automático é criado apenas uma vez para esta atualização. A migração altera para 5 somente fichas em que os seis atributos estavam vazios ou zerados; qualquer ficha com pelo menos um atributo configurado é preservada integralmente. A rotina escreve apenas nas seis células de atributo necessárias, sem regravar as demais colunas ou transformar fórmulas em valores.

## 4. Crie uma nova implantação do Apps Script

Não reutilize apenas o código da implantação antiga, pois o frontend precisa apontar para a nova versão publicada.

1. No Apps Script, clique em **Implantar > Nova implantação**.
2. Em **Tipo**, escolha **Aplicativo da Web**.
3. Descrição: `Redenção Atualização 13`.
4. **Executar como:** você/proprietário do script.
5. **Quem pode acessar:** qualquer pessoa.
6. Clique em **Implantar** e autorize, se solicitado.
7. Copie a URL terminada em `/exec`.

A opção “qualquer pessoa” deixa o endpoint HTTP alcançável, mas os dados continuam protegidos pelo login próprio e pelo token de sessão. As rotas secretas validam o papel de mestre no servidor.

## 5. Configure o frontend

Na raiz do projeto, crie um arquivo `.env.local` usando `.env.example` como modelo:

```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/SEU_DEPLOYMENT_ID/exec
```

Substitua a URL pela URL `/exec` copiada na etapa anterior.

Depois execute:

```bash
npm install
npm test
npm run build
npm run dev
```

O site local será exibido pelo Vite. Entre com uma conta de mestre e valide, nesta ordem:

1. ficha e módulos antigos;
2. RD e observação;
3. mudança de NEX e pendência;
4. teste oculto;
5. criação e rolagem de ameaça;
6. quadro de investigação, upload, comentário, conexão e visibilidade;
7. link Portrait/OBS.

## 6. Envie ao GitHub

Dentro da pasta do projeto:

```bash
git status
git add .
git commit -m "Atualização 13 do sistema Redenção"
git push origin main
```

Caso sua branch principal tenha outro nome, troque `main` pelo nome correto.

## 7. Configure a Vercel

1. Abra o projeto na Vercel.
2. Acesse **Settings > Environment Variables**.
3. Crie ou atualize:
   - Nome: `VITE_APPS_SCRIPT_URL`
   - Valor: URL `/exec` da nova implantação.
   - Ambientes: Production, Preview e Development.
4. Salve.
5. Faça um novo deploy pelo push do GitHub ou em **Deployments > Redeploy**.

O arquivo `vercel.json` continua presente para preservar o roteamento SPA.

## 8. Saia e entre novamente

Todas as sessões antigas são incompatíveis com a Atualização 13. Depois de publicar backend e frontend, todos os usuários precisam:

1. sair do sistema;
2. abrir o site novamente;
3. entrar com usuário e senha.

Isso cria o token de sessão necessário para todas as operações. Links antigos do Portrait/OBS também devem ser abertos novamente a partir da ficha para registrar o token próprio do Portrait.

## Segurança implementada

- O parâmetro genérico `sheet` aceita somente abas legadas permitidas e filtra os registros pela ficha do usuário.
- Abas secretas não podem ser consultadas digitando o nome da aba.
- Ameaças, histórico de NEX, testes ocultos, sessões e histórico administrativo não são enviados a jogadores.
- Ações de mestre validam o papel no backend, não apenas na interface.
- Cartões secretos da investigação são filtrados no servidor antes da resposta.
- Testes ocultos nunca são gravados na aba pública `Rolagens`.
- RD, ataques de ameaças e rolagens de dano não alteram Vida automaticamente.

## Estrutura importante do pacote

- `apps-script/Code.js`: backend completo para substituir o código atual.
- `apps-script/appsscript.json`: manifesto de referência.
- `src/`: frontend atualizado.
- `tests/`: testes de regras e verificações estruturais de segurança.
- `backup-pre-atualizacao13/`: cópias lógicas dos arquivos recebidos.
- `.env.example`: variável necessária para apontar à nova implantação.


## Aplicar a correção 13.1

Depois de substituir o frontend e o `Code.gs`, execute novamente `configurarAtualizacao13()`. A função é idempotente e também corrige os links dos anexos já existentes. Em seguida publique uma nova versão da implantação do Aplicativo da Web e reinicie o Vite/Vercel.
