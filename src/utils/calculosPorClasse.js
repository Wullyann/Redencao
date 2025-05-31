// src/utils/calculosPorClasse.js

// Nível: NEX dividido por 5, arredondado para baixo, máximo 20
export function getNivel(nex) {
  const nivel = Math.floor((Number(nex) || 0) / 5);
  return Math.min(nivel, 20);
}

// Limite de bônus por perícia conforme nível
export function getLimiteBonusPorNivel(nivel) {
  if (nivel <= 6)    return 12;
  if (nivel <= 13)   return 15;
  if (nivel <= 17)   return 18;
  // Níveis 18+ sem limite
  return Infinity;
}

// Pontos de perícia totais por classe, com distribuição gradual:
// pontos = baseInicial + ganhoPorNivel × (nível – 1)
export function getPontosPericiaTotal(classe, int, nivel) {
  let baseInicial;

  switch (classe) {
    case "Combatente":
      baseInicial = 35 + 2 * int;
      break;
    case "Especialista":
      baseInicial = 78 + 2 * int;
      break;
    case "Ocultista":
      baseInicial = 49 + 2 * int;
      break;
    default:
      return 0;
  }

  // Ganho fixo a cada nível acima de 1
  const ganhoPorNivel = Math.floor(baseInicial / 7);
  const etapas = Math.max(0, nivel - 1);
  return baseInicial + ganhoPorNivel * etapas;
}

// Vida (PV): usa nível mínimo 1 para não subtrair progressão
export function getPV(classe, vig, nivel) {
  const level = Math.max(1, nivel);
  const bonusVig = Math.floor(vig / 4);

  let pvInicial, pvPorNivel;
  switch (classe) {
    case "Combatente":
      pvInicial  = 20 + bonusVig;
      pvPorNivel = 4 + bonusVig;
      break;
    case "Especialista":
      pvInicial  = 16 + bonusVig;
      pvPorNivel = 3 + bonusVig;
      break;
    case "Ocultista":
      pvInicial  = 12 + bonusVig;
      pvPorNivel = 2 + bonusVig;
      break;
    default:
      return 0;
  }

  return pvInicial + (level - 1) * pvPorNivel;
}

// Pontos de Esforço (PE): nível mínimo 1
export function getPE(classe, pre, nivel) {
  const level = Math.max(1, nivel);
  const bonusPre = Math.floor(pre / 4);

  let peInicial, pePorNivel;
  switch (classe) {
    case "Combatente":
      peInicial  = 2 + bonusPre;
      pePorNivel = 2 + bonusPre;
      break;
    case "Especialista":
      peInicial  = 3 + bonusPre;
      pePorNivel = 3 + bonusPre;
      break;
    case "Ocultista":
      peInicial  = 4 + bonusPre;
      pePorNivel = 4 + bonusPre;
      break;
    default:
      return 0;
  }

  return peInicial + (level - 1) * pePorNivel;
}

// Sanidade (SAN): nível mínimo 1
export function getSAN(classe, nivel) {
  const level = Math.max(1, nivel);

  let sanInicial, sanPorNivel;
  switch (classe) {
    case "Combatente":
      sanInicial  = 12;
      sanPorNivel = 3;
      break;
    case "Especialista":
      sanInicial  = 16;
      sanPorNivel = 4;
      break;
    case "Ocultista":
      sanInicial  = 20;
      sanPorNivel = 5;
      break;
    default:
      return 0;
  }

  return sanInicial + (level - 1) * sanPorNivel;
}
