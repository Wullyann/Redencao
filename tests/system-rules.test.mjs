import test from "node:test";
import assert from "node:assert/strict";
import { ATTRIBUTE_BASE, ATRIBUTOS, categorize, skillValueFromSheet } from "../src/utils/systemRules.js";

test("todos os seis atributos usam base 5", () => {
  assert.equal(ATTRIBUTE_BASE, 5);
  assert.deepEqual(ATRIBUTOS, ["AGI", "FOR", "INT", "PRE", "VIG", "SOR"]);
});

test("escala de sucesso segue os limiares informados", () => {
  assert.equal(categorize(1, 0, 19), "Desastre");
  assert.equal(categorize(1, 0, 20), "Fracasso");
  assert.equal(categorize(20, 0, 5), "Fracasso");
  assert.equal(categorize(16, 5, 5), "Sucesso");
  assert.equal(categorize(19, 5, 5), "Sucesso Bom");
  assert.equal(categorize(20, 5, 5), "Sucesso Extremo");
  assert.equal(categorize(20, 17, 5), "Sucesso Perfeito");
});

test("valor de perícia mantém fórmula atual do sistema", () => {
  const ficha = { AGI: 10, SOR: 5, Bonus_Acrobacia: 4, "Bonus_extra_Acrobacia": 1 };
  assert.equal(skillValueFromSheet(ficha, "Acrobacia"), 8);
});
