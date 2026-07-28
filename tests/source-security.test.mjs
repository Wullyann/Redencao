import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const backend = fs.readFileSync(new URL("../apps-script/Code.js", import.meta.url), "utf8");
const board = fs.readFileSync(new URL("../src/pages/InvestigationBoard.jsx", import.meta.url), "utf8");
const sheet = fs.readFileSync(new URL("../src/pages/FichaJogador.jsx", import.meta.url), "utf8");
const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("jogadores não conseguem reclassificar metadados secretos de cartões", () => {
  assert.match(backend, /Jogadores nunca podem alterar metadados de segurança/);
  assert.match(backend, /const official = existing/);
  assert.match(backend, /existing \? normalizarVisibilidade_\(existing\.Visibilidade/);
  assert.match(backend, /existing \? verdadeiro_\(existing\.Bloqueado\)/);
  assert.match(backend, /existing \? stringifyJsonArray_\(existing\["Jogadores Visíveis JSON"\]\)/);
});

test("edição de conexão existente é restrita ao criador ou mestre", () => {
  assert.match(backend, /Você não pode editar esta conexão/);
  assert.match(backend, /existing && session\.tipo !== "mestre"/);
});

test("upload ligado a cartão valida investigação e visibilidade", () => {
  assert.match(backend, /Cartão do arquivo não encontrado ou não autorizado/);
  assert.match(backend, /String\(object\["Investigação ID"\]\) !== investigationId/);
  assert.match(backend, /!podeVerEntidade_\(object, session\)/);
});

test("fontes principais não contêm regressões já corrigidas", () => {
  assert.equal((sheet.match(/const category =/g) || []).length, 1);
  assert.doesNotMatch(board, /\{\s*investigacaoId\s*,/);
  assert.match(board, /investigacaoId:\s*investigationId/);
});


test("rotas administrativas exigem sessão de mestre", () => {
  assert.match(app, /function RequireMaster/);
  assert.match(app, /path="\/escudo" element={<RequireMaster>/);
  assert.match(app, /path="\/criar-ficha" element={<RequireMaster>/);
  assert.match(app, /path="\/fichas" element={<RequireMaster>/);
});


test("imagens da investigação são lidas por endpoint autenticado", () => {
  assert.match(backend, /case "obterArquivoInvestigacao"/);
  assert.match(backend, /function obterArquivoInvestigacao_/);
  assert.match(backend, /!podeVerEntidade_\(objeto, session\)/);
  assert.match(board, /acao: "obterArquivoInvestigacao"/);
  assert.match(board, /response\.dataUrl/);
});

test("sincronização não sobrescreve posição otimista com leitura antiga", () => {
  assert.match(board, /positionGuardsRef/);
  assert.match(board, /Descarta respostas de sincronizações antigas/);
  assert.match(board, /Mantém a posição otimista/);
  assert.match(board, /interaction\.latest/);
});
