export const ATRIBUTOS = ["AGI", "FOR", "INT", "PRE", "VIG", "SOR"];
export const ATTRIBUTE_BASE = 5;

export const PERICIAS = [
  ["Acrobacia", "AGI"], ["Adestramento", "PRE"], ["Artes", "PRE"],
  ["Atletismo", "FOR"], ["Atualidades", "INT"], ["Ciências", "INT"],
  ["Crime", "AGI"], ["Diplomacia", "PRE"], ["Enganação", "PRE"],
  ["Fortitude", "VIG"], ["Furtividade", "AGI"], ["Iniciativa", "AGI"],
  ["Intimidação", "PRE"], ["Intuição", "PRE"], ["Investigação", "INT"],
  ["Luta", "FOR"], ["Medicina", "INT"], ["Ocultismo", "INT"],
  ["Percepção", "PRE"], ["Pilotagem", "AGI"], ["Pontaria", "AGI"],
  ["Profissão", "INT"], ["Reflexos", "AGI"], ["Religião", "INT"],
  ["Sobrevivência", "VIG"], ["Tática", "INT"], ["Tecnologia", "INT"],
  ["Vontade", "PRE"],
].map(([nome, atributoPadrao]) => ({ nome, atributoPadrao }));

export function categorize(roll, skill, sor) {
  if (Number(roll) === 1 && Number(sor) < 20) return "Desastre";
  const value = Number(skill) || 0;
  const thP = 21 - Math.floor(value / 17);
  const thE = 21 - Math.floor(value / 5);
  const thB = 21 - Math.floor(value / 2);
  const thN = 21 - value;
  if (value > 15 && roll >= thP) return "Sucesso Perfeito";
  if (roll >= thE) return "Sucesso Extremo";
  if (roll >= thB) return "Sucesso Bom";
  if (roll >= thN) return "Sucesso";
  return "Fracasso";
}

export function skillValueFromSheet(ficha, skillName) {
  const definition = PERICIAS.find((item) => item.nome === skillName);
  const defaultAttribute = definition?.atributoPadrao || "INT";
  const selectedAttribute = ficha?.[`Bonus_atributo_${skillName}`] || defaultAttribute;
  const attribute = Number(ficha?.[selectedAttribute]) || 0;
  const sor = Number(ficha?.SOR) || 0;
  const base = Math.floor((attribute + sor) * 0.2);
  const training = Number(ficha?.[`Bonus_${skillName}`]) || 0;
  const extra = Number(ficha?.[`Bonus_extra_${skillName}`]) || 0;
  return base + training + extra;
}
