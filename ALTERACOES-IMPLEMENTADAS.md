# Alterações implementadas — Redenção Atualização 13

## Ficha

- AGI, FOR, INT, PRE, VIG e SOR iniciam em 5.
- Distribuição de atributos recalculada sobre base 5.
- Migração segura apenas para fichas com os seis atributos vazios ou zerados.
- RD geral numérica e Observação da RD junto aos status superiores.
- RD não reduz dano e Vida permanece manual.
- Pendência de progressão visível e concluível pelo jogador.

## Escudo do Mestre

- Alteração de NEX com histórico de valor anterior, novo valor, mestre e data.
- Sem recuperação automática de PV, PE ou Sanidade.
- Testes ocultos por todos ou personagens específicos, usando atributo ou perícia.
- Resultados e histórico exclusivos do mestre, sem gravação em `Rolagens`.
- CRUD de ameaças com duplicação, busca, arquivo e exclusão lógica.
- Ações e ataques de ameaças com categoria de sucesso e dano apenas informativo.
- Administração das investigações restrita ao mestre.

## Quadro de investigação

- Modos Quadro e Lista, zoom, movimentação, cartões arrastáveis e redimensionáveis.
- Persistência separada por objeto e sincronização a cada quatro segundos.
- PNG, JPG/JPEG, WEBP, GIF, PDF e colagem de imagens com Ctrl+V.
- Pesquisa, filtros, comentários, histórico, lixeira, restauração, importância e bloqueio.
- Conexões com seta, texto, linha contínua ou tracejada.
- Visibilidade pública, somente mestre ou jogadores selecionados.
- Dados secretos filtrados no servidor antes da resposta.
- Cartões oficiais bloqueados permitem comentário e conexão, sem edição por jogadores.

## Segurança

- Token de sessão criado no login e validado no backend.
- Rotas secretas exigem mestre no servidor.
- Abas secretas bloqueadas no endpoint genérico.
- Abas legadas permitidas são filtradas pelas fichas do usuário.
- Portrait/OBS usa token próprio e recebe apenas campos públicos necessários.
- Rotas administrativas do React exigem sessão de mestre.

## Compatibilidade preservada

- Portrait/OBS.
- Histórico de dano e status manuais.
- Habilidades, rituais, inventário, carteira, combates e rolagens.
- Visual escuro e dourado.


## Correção 13.1 — imagens e sincronização do mural

- Imagens do mural agora são lidas por um endpoint autenticado do Apps Script e exibidas por `data:` URL, sem depender do hotlink público do Google Drive.
- A permissão de cada cartão é revalidada antes de o backend devolver os bytes da imagem.
- Links diretos antigos são normalizados ao executar `configurarAtualizacao13()` novamente.
- Movimentação e redimensionamento usam proteção otimista por versão, impedindo o cartão de voltar temporariamente à posição antiga durante a sincronização.
- Respostas GET fora de ordem são descartadas.
