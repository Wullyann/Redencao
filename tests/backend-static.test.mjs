import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../apps-script/Code.js", import.meta.url), "utf8");

test("instalador e backup lógico estão presentes", () => {
  assert.match(source, /function configurarAtualizacao13\(\)/);
  assert.match(source, /makeCopy\(/);
  assert.match(source, /UPDATE13_BACKUP_ID/);
  assert.match(source, /migrarAtributosZerados_/);
  assert.match(source, /UPDATE13_FOLDER_PERSONAGENS/);
});

test("migração de atributos não regrava fórmulas das fichas", () => {
  const start = source.indexOf("function migrarAtributosZerados_");
  const end = source.indexOf("// -----------------------------------------------------------------------------", start);
  const migration = source.slice(start, end);
  assert.match(migration, /Altera somente as seis células de atributo/);
  assert.doesNotMatch(migration, /setValues\(values\.slice/);
});

test("endpoint genérico possui lista permitida e bloqueio secreto", () => {
  assert.match(source, /function lerAbaLegadaSegura_/);
  assert.match(source, /SECRET_SHEETS\.includes\(sheetName\)/);
  assert.doesNotMatch(source, /getSheetByName\(nomeAba\)[\s\S]{0,300}getDataRange\(\)\.getValues\(\)/);
});

test("ações críticas exigem mestre e usam histórico separado", () => {
  assert.match(source, /case "alterarNex": exigirMestre_/);
  assert.match(source, /case "realizarTestesOcultos": exigirMestre_/);
  assert.match(source, /case "salvarAmeaca": exigirMestre_/);
  assert.match(source, /SHEETS\.TESTES_OCULTOS/);
  assert.match(source, /SHEETS\.HISTORICO_NEX/);
});

test("escala secreta é idêntica à especificação", () => {
  assert.match(source, /if \(roll === 1 && sor < 20\) return "Desastre"/);
  assert.match(source, /const thP = 21 - Math\.floor\(skill \/ 17\)/);
  assert.match(source, /if \(skill > 15 && roll >= thP\) return "Sucesso Perfeito"/);
});
