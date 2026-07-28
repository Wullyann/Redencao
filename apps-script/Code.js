/**
 * REDENÇÃO — Backend Google Apps Script — Atualização 13
 *
 * Implantação recomendada:
 * - Executar como: proprietário do script
 * - Quem tem acesso: qualquer pessoa
 * - O aplicativo exige autenticação própria por token de sessão.
 */

const REDENCAO_CONFIG = Object.freeze({
  SPREADSHEET_ID: "1ZI131N6hpL74byL_m-WMGpHczPBkIAojNaBnY14TOF4",
  ROOT_FOLDER_ID: "17oLiv941IcKPIxdA1R35ZrPV8cif-qiL",
  SESSION_HOURS: 24,
  UPDATE_VERSION: "13",
  ATTRIBUTES: ["AGI", "FOR", "INT", "PRE", "VIG", "SOR"],
  ATTRIBUTE_BASE: 5,
  MAX_IMAGE_BYTES: 8 * 1024 * 1024,
  MAX_PDF_BYTES: 15 * 1024 * 1024,
  ALLOWED_MIME: [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
    "application/pdf",
  ],
});

const SHEETS = Object.freeze({
  USUARIOS: "Usuarios",
  FICHAS: "Fichas",
  COMBATES: "Combates",
  HABILIDADES: "Habilidades",
  RITUAIS: "Rituais",
  INVENTARIO: "Inventario",
  ROLAGENS: "Rolagens",
  CARTEIRA: "Carteira",
  AMEACAS: "Ameacas",
  HISTORICO_NEX: "Historico_NEX",
  PENDENCIAS_NEX: "Pendencias_NEX",
  TESTES_OCULTOS: "Testes_Ocultos",
  INVESTIGACOES: "Investigacoes",
  INVESTIGACAO_OBJETOS: "Investigacao_Objetos",
  INVESTIGACAO_CONEXOES: "Investigacao_Conexoes",
  INVESTIGACAO_COMENTARIOS: "Investigacao_Comentarios",
  INVESTIGACAO_ARQUIVOS: "Investigacao_Arquivos",
  INVESTIGACAO_HISTORICO: "Investigacao_Historico",
  INVESTIGACAO_PERMISSOES: "Investigacao_Permissoes",
  SESSOES: "Sessoes",
});

const HEADERS = Object.freeze({
  [SHEETS.AMEACAS]: [
    "ID", "Nome", "Imagem", "VD", "Tipo", "Elemento", "Descritores", "Tamanho",
    "Descrição Pública", "Notas Secretas", "AGI", "FOR", "INT", "PRE", "VIG", "SOR",
    "Iniciativa", "Percepção", "Defesa", "Fortitude", "Reflexos", "Vontade",
    "PV Máximo", "Estado Machucado", "Deslocamento", "RD Geral", "Resistências",
    "Imunidades", "Vulnerabilidades", "Sentidos Especiais", "Perícias",
    "Habilidades Passivas", "Presença DT", "Presença Dano Mental", "Presença Imunidade NEX",
    "Enigma Descrição", "Enigma Pistas", "Enigma Estado", "Enigma Efeitos Removidos",
    "Ações JSON", "Arquivado", "Excluído", "Criado Em", "Atualizado Em", "Criado Por",
  ],
  [SHEETS.HISTORICO_NEX]: [
    "ID", "ID da Ficha", "Nome do Personagem", "NEX Anterior", "NEX Novo", "Mestre", "Data",
  ],
  [SHEETS.PENDENCIAS_NEX]: [
    "ID", "ID da Ficha", "Nome do Personagem", "NEX Anterior", "NEX Novo", "Status",
    "Criada Em", "Concluída Em", "Concluída Por", "Observação",
  ],
  [SHEETS.TESTES_OCULTOS]: [
    "ID", "Lote ID", "Data", "Mestre", "ID da Ficha", "Personagem", "Tipo", "Nome",
    "Atributo Base", "Valor da Perícia", "SOR", "d20", "Categoria", "Dano", "Detalhes",
  ],
  [SHEETS.INVESTIGACOES]: [
    "ID", "Nome", "Descrição", "Arquivada", "Criado Por", "Criado Em", "Atualizado Em",
  ],
  [SHEETS.INVESTIGACAO_OBJETOS]: [
    "ID", "Investigação ID", "Tipo", "Título", "Conteúdo", "X", "Y", "Largura", "Altura",
    "Importante", "Bloqueado", "Oficial do Mestre", "Visibilidade", "Jogadores Visíveis JSON",
    "Arquivo ID", "Arquivado", "Excluído", "Versão", "Criado Por", "Criado Em",
    "Atualizado Por", "Atualizado Em",
  ],
  [SHEETS.INVESTIGACAO_CONEXOES]: [
    "ID", "Investigação ID", "Origem ID", "Destino ID", "Texto", "Estilo", "Visibilidade",
    "Jogadores Visíveis JSON", "Excluído", "Versão", "Criado Por", "Criado Em",
    "Atualizado Por", "Atualizado Em",
  ],
  [SHEETS.INVESTIGACAO_COMENTARIOS]: [
    "ID", "Investigação ID", "Objeto ID", "Comentário", "Autor", "Tipo do Autor", "Data", "Excluído",
  ],
  [SHEETS.INVESTIGACAO_ARQUIVOS]: [
    "ID", "Investigação ID", "Objeto ID", "Drive File ID", "Nome", "MIME", "URL", "Miniatura URL",
    "Tamanho", "Enviado Por", "Data", "Excluído",
  ],
  [SHEETS.INVESTIGACAO_HISTORICO]: [
    "ID", "Investigação ID", "Objeto ID", "Entidade", "Ação", "Resumo", "Autor", "Data", "Snapshot JSON",
  ],
  [SHEETS.INVESTIGACAO_PERMISSOES]: [
    "ID", "Investigação ID", "Usuário", "Papel", "Pode Editar", "Pode Comentar", "Criado Em",
  ],
  [SHEETS.SESSOES]: [
    "Token", "Usuário", "Nome", "Tipo", "Criada Em", "Expira Em", "Último Uso", "Ativa",
  ],
});

const PERICIAS = Object.freeze({
  "Acrobacia": "AGI", "Adestramento": "PRE", "Artes": "PRE", "Atletismo": "FOR",
  "Atualidades": "INT", "Ciências": "INT", "Crime": "AGI", "Diplomacia": "PRE",
  "Enganação": "PRE", "Fortitude": "VIG", "Furtividade": "AGI", "Iniciativa": "AGI",
  "Intimidação": "PRE", "Intuição": "PRE", "Investigação": "INT", "Luta": "FOR",
  "Medicina": "INT", "Ocultismo": "INT", "Percepção": "PRE", "Pilotagem": "AGI",
  "Pontaria": "AGI", "Profissão": "INT", "Reflexos": "AGI", "Religião": "INT",
  "Sobrevivência": "VIG", "Tática": "INT", "Tecnologia": "INT", "Vontade": "PRE",
});

const SECRET_SHEETS = Object.freeze([
  SHEETS.USUARIOS,
  SHEETS.AMEACAS,
  SHEETS.HISTORICO_NEX,
  SHEETS.TESTES_OCULTOS,
  SHEETS.INVESTIGACAO_HISTORICO,
  SHEETS.SESSOES,
]);

// -----------------------------------------------------------------------------
// Entradas HTTP
// -----------------------------------------------------------------------------

function doGet(e) {
  try {
    const params = normalizarParametros_(e);
    const action = String(params.acao || "").trim();

    if (action === "portrait") return respostaSucesso_(obterPortraitPublico_(params));

    const session = validarSessao_(params.token);

    if (params.sheet) {
      return respostaJson_(lerAbaLegadaSegura_(String(params.sheet), session));
    }

    switch (action) {
      case "sessao":
        return respostaSucesso_({ usuario: usuarioPublico_(session), expiraEm: session.expiraEm });
      case "listarFichas":
        return respostaSucesso_({ fichas: listarFichasPermitidas_(session) });
      case "listarRolagens":
        return respostaSucesso_({ rolagens: filtrarPorFichasDoUsuario_(lerObjetos_(SHEETS.ROLAGENS), session) });
      case "listarPendenciasNex":
        return respostaSucesso_({ pendencias: listarPendenciasPermitidas_(session) });
      case "listarAmeacas":
        exigirMestre_(session);
        return respostaSucesso_({ ameacas: listarAmeacas_(params) });
      case "listarTestesOcultos":
        exigirMestre_(session);
        return respostaSucesso_({ testes: listarTestesOcultos_(params) });
      case "listarInvestigacoes":
        return respostaSucesso_({ investigacoes: listarInvestigacoesPermitidas_(session) });
      case "obterInvestigacao":
        return respostaSucesso_(obterInvestigacao_(params, session));
      case "obterArquivoInvestigacao":
        return respostaSucesso_(obterArquivoInvestigacao_(params, session));
      default:
        return respostaErro_("Ação GET inválida.");
    }
  } catch (error) {
    return respostaErro_(mensagemErro_(error));
  }
}

function doPost(e) {
  try {
    const params = normalizarParametros_(e);
    const action = String(params.acao || "").trim();

    if (action === "login") return loginUsuario_(params.usuario, params.senha);
    if (!action) return respostaErro_("Ação não informada.");

    const session = validarSessao_(params.token);

    switch (action) {
      case "logout": return encerrarSessao_(session);
      case "criarFichaComUsuario": exigirMestre_(session); return criarFichaComUsuario_(params, session);
      case "salvarFicha": return salvarFicha_(params, session);
      case "salvarAtaque": return salvarRegistroFiltrado_(SHEETS.COMBATES, params, session, ["ID da Ficha", "Nome Ataque"]);
      case "deletarAtaque": return deletarRegistroFiltrado_(SHEETS.COMBATES, params, session, ["ID da Ficha", "Nome Ataque"]);
      case "salvarHabilidade": return salvarHabilidadeCompativel_(params, session);
      case "deletarHabilidade": return deletarHabilidadeCompativel_(params, session);
      case "salvarRitual": return salvarRegistroFiltrado_(SHEETS.RITUAIS, params, session, ["ID da Ficha", "Nome do Ritual"]);
      case "deletarRitual": return deletarRegistroFiltrado_(SHEETS.RITUAIS, params, session, ["ID da Ficha", "Nome do Ritual"]);
      case "salvarInventario": return salvarRegistroFiltrado_(SHEETS.INVENTARIO, params, session, ["ID da Ficha", "Item"]);
      case "deletarInventario": return deletarRegistroFiltrado_(SHEETS.INVENTARIO, params, session, ["ID da Ficha", "Item"]);
      case "salvarRolagem": return salvarRolagem_(params, session);
      case "salvarCarteira": return salvarCarteira_(params, session);
      case "deletarCarteira": return deletarRegistroFiltrado_(SHEETS.CARTEIRA, params, session, ["ID da Ficha", "Descrição"]);
      case "alterarNex": exigirMestre_(session); return alterarNex_(params, session);
      case "concluirPendenciaNex": return concluirPendenciaNex_(params, session);
      case "realizarTestesOcultos": exigirMestre_(session); return realizarTestesOcultos_(params, session);
      case "salvarAmeaca": exigirMestre_(session); return salvarAmeaca_(params, session);
      case "duplicarAmeaca": exigirMestre_(session); return duplicarAmeaca_(params, session);
      case "arquivarAmeaca": exigirMestre_(session); return alterarEstadoAmeaca_(params, session, "Arquivado");
      case "excluirAmeaca": exigirMestre_(session); return alterarEstadoAmeaca_(params, session, "Excluído");
      case "restaurarAmeaca": exigirMestre_(session); return restaurarAmeaca_(params, session);
      case "rolarAtaqueAmeaca": exigirMestre_(session); return rolarAtaqueAmeaca_(params, session);
      case "salvarInvestigacao": exigirMestre_(session); return salvarInvestigacao_(params, session);
      case "salvarObjetoInvestigacao": return salvarObjetoInvestigacao_(params, session);
      case "moverObjetoInvestigacao": return moverObjetoInvestigacao_(params, session);
      case "lixeiraObjetoInvestigacao": return lixeiraObjetoInvestigacao_(params, session);
      case "restaurarObjetoInvestigacao": exigirMestre_(session); return restaurarObjetoInvestigacao_(params, session);
      case "excluirDefinitivoObjetoInvestigacao": exigirMestre_(session); return excluirDefinitivoObjetoInvestigacao_(params, session);
      case "salvarConexaoInvestigacao": return salvarConexaoInvestigacao_(params, session);
      case "excluirConexaoInvestigacao": return excluirConexaoInvestigacao_(params, session);
      case "salvarComentarioInvestigacao": return salvarComentarioInvestigacao_(params, session);
      case "uploadInvestigacaoArquivo": return uploadInvestigacaoArquivo_(params, session);
      case "uploadImagemPersonagem": return uploadImagemPersonagem_(params, session);
      case "registrarTokenPortrait": return registrarTokenPortrait_(params, session);
      default:
        return respostaErro_("Ação inválida.");
    }
  } catch (error) {
    return respostaErro_(mensagemErro_(error));
  }
}

// -----------------------------------------------------------------------------
// Instalação e migração
// -----------------------------------------------------------------------------

function configurarAtualizacao13() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const spreadsheet = getSpreadsheet_();
    const props = PropertiesService.getScriptProperties();

    if (!props.getProperty("UPDATE13_BACKUP_ID")) {
      const backup = criarBackupPlanilha_(spreadsheet);
      props.setProperty("UPDATE13_BACKUP_ID", backup.getId());
      props.setProperty("UPDATE13_BACKUP_DATE", agoraIso_());
    }

    Object.keys(HEADERS).forEach((sheetName) => garantirAbaCabecalhos_(sheetName, HEADERS[sheetName]));

    garantirColunas_(SHEETS.FICHAS, REDENCAO_CONFIG.ATTRIBUTES.concat([
      "RD", "Observação da RD", "Pendência de Progressão", "Token Portrait",
    ]));

    const folders = garantirSubpastas_();
    props.setProperty("UPDATE13_FOLDER_INVESTIGACOES", folders.investigacoes.getId());
    props.setProperty("UPDATE13_FOLDER_AMEACAS", folders.ameacas.getId());
    props.setProperty("UPDATE13_FOLDER_BACKUPS", folders.backups.getId());
    props.setProperty("UPDATE13_FOLDER_PERSONAGENS", folders.personagens.getId());
    props.setProperty("UPDATE13_VERSION", REDENCAO_CONFIG.UPDATE_VERSION);

    const migration = migrarAtributosZerados_();
    const investigation = garantirInvestigacaoPrincipal_();
    const urlsArquivosCorrigidas = corrigirUrlsArquivosInvestigacao_();
    const arquivosVinculados = vincularArquivosAosObjetos_();
    limparSessoesExpiradas_();

    return {
      status: "sucesso",
      mensagem: "Atualização 13 configurada com segurança.",
      backupId: props.getProperty("UPDATE13_BACKUP_ID"),
      fichasMigradas: migration.migradas,
      fichasPreservadas: migration.preservadas,
      investigacaoPrincipalId: investigation.ID,
      urlsArquivosCorrigidas,
      arquivosVinculados,
      pastas: {
        investigacoes: folders.investigacoes.getId(),
        ameacas: folders.ameacas.getId(),
        backups: folders.backups.getId(),
        personagens: folders.personagens.getId(),
      },
    };
  } finally {
    lock.releaseLock();
  }
}

function criarBackupPlanilha_(spreadsheet) {
  const root = DriveApp.getFolderById(REDENCAO_CONFIG.ROOT_FOLDER_ID);
  const backups = getOrCreateFolder_(root, "Backups_Atualizacao13");
  const source = DriveApp.getFileById(spreadsheet.getId());
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "America/Sao_Paulo", "yyyy-MM-dd_HH-mm-ss");
  return source.makeCopy("Redencao_Backup_Pre_Atualizacao13_" + timestamp, backups);
}

function garantirSubpastas_() {
  const root = DriveApp.getFolderById(REDENCAO_CONFIG.ROOT_FOLDER_ID);
  return {
    investigacoes: getOrCreateFolder_(root, "Investigacoes"),
    ameacas: getOrCreateFolder_(root, "Ameacas"),
    backups: getOrCreateFolder_(root, "Backups_Atualizacao13"),
    personagens: getOrCreateFolder_(root, "Personagens"),
  };
}

function garantirInvestigacaoPrincipal_() {
  const existing = lerObjetos_(SHEETS.INVESTIGACOES).find((row) => !verdadeiro_(row.Arquivada));
  if (existing) return existing;
  const row = {
    ID: novoId_("INV"),
    Nome: "Investigação Principal",
    Descrição: "Mural compartilhado da campanha Redenção.",
    Arquivada: false,
    "Criado Por": "sistema",
    "Criado Em": agoraIso_(),
    "Atualizado Em": agoraIso_(),
  };
  appendObject_(SHEETS.INVESTIGACOES, row);
  return row;
}

function migrarAtributosZerados_() {
  const sheet = getRequiredSheet_(SHEETS.FICHAS);
  const values = sheet.getDataRange().getValues();
  if (!values.length) return { migradas: 0, preservadas: 0 };
  const header = values[0].map(String);
  const indexes = REDENCAO_CONFIG.ATTRIBUTES.map((name) => header.indexOf(name));
  if (indexes.some((idx) => idx < 0)) throw new Error("A aba Fichas não possui todos os seis atributos.");

  let migrated = 0;
  let preserved = 0;
  for (let row = 1; row < values.length; row += 1) {
    const allBlankOrZero = indexes.every((idx) => {
      const value = values[row][idx];
      return value === "" || value === null || Number(value) === 0;
    });
    if (allBlankOrZero) {
      // Altera somente as seis células de atributo. Assim, fórmulas e demais
      // colunas da ficha não são regravadas como valores durante a migração.
      indexes.forEach((idx) => sheet.getRange(row + 1, idx + 1).setValue(REDENCAO_CONFIG.ATTRIBUTE_BASE));
      migrated += 1;
    } else {
      preserved += 1;
    }
  }
  return { migradas: migrated, preservadas: preserved };
}

// -----------------------------------------------------------------------------
// Sessão e segurança
// -----------------------------------------------------------------------------

function loginUsuario_(usuario, senha) {
  const normalizedUser = normalizarUsuario_(usuario);
  const rows = lerObjetos_(SHEETS.USUARIOS);
  const found = rows.find((row) =>
    normalizarUsuario_(row.usuario) === normalizedUser && String(row.senha || "").trim() === String(senha || "").trim()
  );
  if (!found) return respostaErro_("Usuário ou senha inválidos.");

  const now = new Date();
  const expires = new Date(now.getTime() + REDENCAO_CONFIG.SESSION_HOURS * 60 * 60 * 1000);
  const token = Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "");
  appendObject_(SHEETS.SESSOES, {
    Token: token,
    "Usuário": found.usuario,
    Nome: found.nome,
    Tipo: String(found.tipo || "jogador").toLowerCase(),
    "Criada Em": now.toISOString(),
    "Expira Em": expires.toISOString(),
    "Último Uso": now.toISOString(),
    Ativa: true,
  });

  return respostaSucesso_({
    token,
    expiraEm: expires.toISOString(),
    usuario: {
      nome: found.nome,
      tipo: String(found.tipo || "jogador").toLowerCase(),
      usuario: found.usuario,
    },
  });
}

function validarSessao_(token) {
  const safeToken = String(token || "").trim();
  if (!safeToken) throw new Error("Sessão ausente. Saia e entre novamente.");

  const sheet = getRequiredSheet_(SHEETS.SESSOES);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) throw new Error("Sessão inválida. Saia e entre novamente.");
  const header = data[0].map(String);
  const idx = indexMap_(header);
  const now = new Date();

  for (let i = data.length - 1; i >= 1; i -= 1) {
    if (String(data[i][idx.Token]) !== safeToken) continue;
    const active = verdadeiro_(data[i][idx.Ativa]);
    const expires = new Date(data[i][idx["Expira Em"]]);
    if (!active || !expires.getTime() || expires <= now) {
      if (active) sheet.getRange(i + 1, idx.Ativa + 1).setValue(false);
      throw new Error("Sessão expirada. Saia e entre novamente.");
    }
    sheet.getRange(i + 1, idx["Último Uso"] + 1).setValue(now.toISOString());
    return {
      token: safeToken,
      usuario: data[i][idx["Usuário"]],
      nome: data[i][idx.Nome],
      tipo: String(data[i][idx.Tipo] || "jogador").toLowerCase(),
      expiraEm: expires.toISOString(),
      row: i + 1,
    };
  }
  throw new Error("Sessão inválida. Saia e entre novamente.");
}

function encerrarSessao_(session) {
  const sheet = getRequiredSheet_(SHEETS.SESSOES);
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const idx = indexMap_(header);
  sheet.getRange(session.row, idx.Ativa + 1).setValue(false);
  return respostaSucesso_({ mensagem: "Sessão encerrada." });
}

function limparSessoesExpiradas_() {
  const sheet = getRequiredSheet_(SHEETS.SESSOES);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return;
  const header = values[0].map(String);
  const idx = indexMap_(header);
  const now = Date.now();
  for (let i = 1; i < values.length; i += 1) {
    const expires = new Date(values[i][idx["Expira Em"]]).getTime();
    if (!expires || expires < now) values[i][idx.Ativa] = false;
  }
  sheet.getRange(2, 1, values.length - 1, header.length).setValues(values.slice(1));
}

function exigirMestre_(session) {
  if (String(session.tipo).toLowerCase() !== "mestre") throw new Error("Ação permitida somente ao mestre.");
}

function usuarioPublico_(session) {
  return { usuario: session.usuario, nome: session.nome, tipo: session.tipo };
}

function idsFichasPermitidas_(session) {
  const fichas = lerObjetos_(SHEETS.FICHAS);
  if (session.tipo === "mestre") return fichas.map((f) => String(f.ID));
  const user = normalizarUsuario_(session.usuario);
  return fichas
    .filter((f) => normalizarUsuario_(f["Login do Jogador"]) === user)
    .map((f) => String(f.ID));
}

function exigirAcessoFicha_(fichaId, session) {
  const id = String(fichaId || "");
  if (!id || !idsFichasPermitidas_(session).includes(id)) {
    throw new Error("Você não tem acesso a esta ficha.");
  }
}

// -----------------------------------------------------------------------------
// Compatibilidade segura com as funções atuais
// -----------------------------------------------------------------------------

function lerAbaLegadaSegura_(sheetName, session) {
  if (SECRET_SHEETS.includes(sheetName)) throw new Error("Esta aba não pode ser consultada pelo endpoint genérico.");
  const allowed = [
    SHEETS.FICHAS, SHEETS.COMBATES, SHEETS.HABILIDADES, SHEETS.RITUAIS,
    SHEETS.INVENTARIO, SHEETS.ROLAGENS, SHEETS.CARTEIRA,
  ];
  if (!allowed.includes(sheetName)) throw new Error("Aba não autorizada.");

  const rows = lerObjetos_(sheetName);
  if (sheetName === SHEETS.FICHAS) return listarFichasPermitidas_(session);
  return filtrarPorFichasDoUsuario_(rows, session);
}

function listarFichasPermitidas_(session) {
  const rows = lerObjetos_(SHEETS.FICHAS);
  if (session.tipo === "mestre") return rows;
  const user = normalizarUsuario_(session.usuario);
  return rows.filter((row) => normalizarUsuario_(row["Login do Jogador"]) === user);
}

function filtrarPorFichasDoUsuario_(rows, session) {
  if (session.tipo === "mestre") return rows;
  const ids = idsFichasPermitidas_(session).map(String);
  return rows.filter((row) => {
    const rowId = String(row["ID original da Ficha"] || row["ID da Ficha"] || row.ID || "");
    return ids.some((id) => rowId === id || (rowId.startsWith(id) && /^\d{3}$/.test(rowId.slice(id.length))));
  });
}

function criarFichaComUsuario_(params, session) {
  const personagem = String(params.personagem || "").trim();
  const jogador = String(params.jogador || "").trim();
  if (!personagem || !jogador) return respostaErro_("Dados incompletos.");

  const id = String(Date.now());
  const row = {
    ID: id,
    "Nome do Personagem": personagem,
    "Login do Jogador": normalizarUsuario_(jogador),
    Classe: params.Classe || "Combatente",
    NEX: Number(params.NEX) || 5,
    AGI: 5, FOR: 5, INT: 5, PRE: 5, VIG: 5, SOR: 5,
    RD: 0,
    "Observação da RD": "",
    "Pendência de Progressão": "",
    "Data de Criação": dataPtBr_(),
    "Última Modificação": dataPtBr_(),
  };
  appendObjectFlexible_(SHEETS.FICHAS, row);

  const users = lerObjetos_(SHEETS.USUARIOS);
  const normalized = normalizarUsuario_(jogador);
  if (!users.some((u) => normalizarUsuario_(u.usuario) === normalized)) {
    appendObjectFlexible_(SHEETS.USUARIOS, {
      nome: jogador,
      usuario: normalized,
      senha: String(params.senhaInicial || "1234"),
      tipo: "jogador",
    });
  }

  return respostaSucesso_({ mensagem: "Ficha e usuário criados com atributos base 5.", id });
}

function salvarFicha_(params, session) {
  const id = String(params.ID || "").trim();
  if (!id) return respostaErro_("ID da ficha não informado.");
  exigirAcessoFicha_(id, session);

  const masterOnly = new Set(["Login do Jogador", "NEX"]);
  const updates = {};
  Object.keys(params).forEach((key) => {
    if (["acao", "token"].includes(key)) return;
    if (key === "ID") return;
    if (masterOnly.has(key) && session.tipo !== "mestre") return;
    if (key === "Pendência de Progressão") return;
    updates[key] = params[key];
  });
  updates["Última Modificação"] = dataPtBr_();
  atualizarPorId_(SHEETS.FICHAS, "ID", id, updates);
  return respostaSucesso_({ mensagem: "Ficha salva com sucesso." });
}

function salvarRegistroFiltrado_(sheetName, params, session, keys) {
  const fichaId = String(params["ID original da Ficha"] || params["ID da Ficha"] || "");
  exigirAcessoFicha_(fichaId, session);
  upsertFlexible_(sheetName, params, keys);
  return respostaSucesso_({ mensagem: "Registro salvo com sucesso." });
}

function deletarRegistroFiltrado_(sheetName, params, session, keys) {
  const fichaId = String(params["ID original da Ficha"] || params["ID da Ficha"] || "");
  exigirAcessoFicha_(fichaId, session);
  deleteRowsByKeys_(sheetName, params, keys);
  return respostaSucesso_({ mensagem: "Registro removido." });
}

function salvarHabilidadeCompativel_(params, session) {
  const copy = Object.assign({}, params);
  if (!copy["Nome da Habilidade"] && copy.Nome) copy["Nome da Habilidade"] = copy.Nome;
  return salvarRegistroFiltrado_(SHEETS.HABILIDADES, copy, session, ["ID da Ficha", "Nome da Habilidade"]);
}

function deletarHabilidadeCompativel_(params, session) {
  const copy = Object.assign({}, params);
  if (!copy["Nome da Habilidade"] && copy.Nome) copy["Nome da Habilidade"] = copy.Nome;
  return deletarRegistroFiltrado_(SHEETS.HABILIDADES, copy, session, ["ID da Ficha", "Nome da Habilidade"]);
}

function salvarRolagem_(params, session) {
  const fichaId = String(params["ID da Ficha"] || "");
  exigirAcessoFicha_(fichaId, session);
  appendObjectFlexible_(SHEETS.ROLAGENS, {
    "ID da Ficha": fichaId,
    Horario: params.Horario || params["Horário"] || new Date().toLocaleTimeString("pt-BR"),
    "Nome do Personagem": params["Nome do Personagem"] || "",
    Tipo: params.Tipo || "",
    Nome: params.Nome || "",
    Valor: params.Valor || "",
    "Tipo de Sucesso": params["Tipo de Sucesso"] || "",
  });
  return respostaSucesso_({ mensagem: "Rolagem salva." });
}

function salvarCarteira_(params, session) {
  const fichaId = String(params["ID da Ficha"] || "");
  exigirAcessoFicha_(fichaId, session);
  appendObjectFlexible_(SHEETS.CARTEIRA, {
    "ID da Ficha": fichaId,
    "Tipo de Movimento": params["Tipo de Movimento"] || "",
    Valor: Number(params.Valor) || 0,
    "Descrição": params["Descrição"] || "",
    "Data/Hora": dataHoraPtBr_(),
  });
  return respostaSucesso_({ mensagem: "Movimentação registrada." });
}

// -----------------------------------------------------------------------------
// NEX e pendências
// -----------------------------------------------------------------------------

function alterarNex_(params, session) {
  const fichaId = String(params.fichaId || params.ID || "");
  const novo = Number(params.nexNovo);
  if (!Number.isFinite(novo) || novo < 0 || novo > 100) throw new Error("NEX deve ficar entre 0 e 100.");

  const ficha = buscarPorId_(SHEETS.FICHAS, "ID", fichaId);
  if (!ficha) throw new Error("Ficha não encontrada.");
  const anterior = Number(ficha.NEX) || 0;
  if (anterior === novo) return respostaSucesso_({ mensagem: "O NEX já possui esse valor." });

  const pendingId = novoId_("PNEX");
  const now = agoraIso_();
  const pendingText = `Pendente: revisar progressão de NEX ${anterior}% → ${novo}%`;

  atualizarPorId_(SHEETS.FICHAS, "ID", fichaId, {
    NEX: novo,
    "Pendência de Progressão": pendingText,
    "Última Modificação": dataPtBr_(),
  });
  appendObject_(SHEETS.HISTORICO_NEX, {
    ID: novoId_("HNEX"),
    "ID da Ficha": fichaId,
    "Nome do Personagem": ficha["Nome do Personagem"] || "",
    "NEX Anterior": anterior,
    "NEX Novo": novo,
    Mestre: session.nome || session.usuario,
    Data: now,
  });
  appendObject_(SHEETS.PENDENCIAS_NEX, {
    ID: pendingId,
    "ID da Ficha": fichaId,
    "Nome do Personagem": ficha["Nome do Personagem"] || "",
    "NEX Anterior": anterior,
    "NEX Novo": novo,
    Status: "Pendente",
    "Criada Em": now,
    "Concluída Em": "",
    "Concluída Por": "",
    "Observação": params.observacao || "",
  });

  return respostaSucesso_({ mensagem: "NEX alterado sem recuperar recursos.", pendenciaId: pendingId, nexAnterior: anterior, nexNovo: novo });
}

function listarPendenciasPermitidas_(session) {
  const rows = lerObjetos_(SHEETS.PENDENCIAS_NEX).filter((row) => String(row.Status) !== "Excluída");
  if (session.tipo === "mestre") return rows;
  const ids = new Set(idsFichasPermitidas_(session));
  return rows.filter((row) => ids.has(String(row["ID da Ficha"])));
}

function concluirPendenciaNex_(params, session) {
  const pendingId = String(params.pendenciaId || params.ID || "");
  const pending = buscarPorId_(SHEETS.PENDENCIAS_NEX, "ID", pendingId);
  if (!pending) throw new Error("Pendência não encontrada.");
  exigirAcessoFicha_(pending["ID da Ficha"], session);

  atualizarPorId_(SHEETS.PENDENCIAS_NEX, "ID", pendingId, {
    Status: "Concluída",
    "Concluída Em": agoraIso_(),
    "Concluída Por": session.nome || session.usuario,
    "Observação": params.observacao !== undefined ? params.observacao : pending["Observação"],
  });

  const stillOpen = lerObjetos_(SHEETS.PENDENCIAS_NEX).filter((row) =>
    String(row["ID da Ficha"]) === String(pending["ID da Ficha"]) && String(row.Status) === "Pendente"
  );
  atualizarPorId_(SHEETS.FICHAS, "ID", String(pending["ID da Ficha"]), {
    "Pendência de Progressão": stillOpen.length ? `Existem ${stillOpen.length} pendência(s) de progressão.` : "",
  });
  return respostaSucesso_({ mensagem: "Pendência concluída." });
}

// -----------------------------------------------------------------------------
// Testes ocultos
// -----------------------------------------------------------------------------

function realizarTestesOcultos_(params, session) {
  const targetIds = parseJsonArray_(params.fichaIds);
  const all = verdadeiro_(params.todos);
  const type = String(params.tipo || "atributo").toLowerCase();
  const name = String(params.nome || "").trim();
  if (!name) throw new Error("Selecione um atributo ou perícia.");

  const sheets = listarFichasPermitidas_(session);
  const selected = all ? sheets : sheets.filter((f) => targetIds.map(String).includes(String(f.ID)));
  if (!selected.length) throw new Error("Nenhuma ficha selecionada.");

  const batchId = novoId_("LOTE");
  const now = agoraIso_();
  const results = selected.map((ficha) => {
    let value;
    let baseAttr;
    if (type === "atributo") {
      if (!REDENCAO_CONFIG.ATTRIBUTES.includes(name)) throw new Error("Atributo inválido.");
      value = Number(ficha[name]) || 0;
      baseAttr = name;
    } else {
      baseAttr = String(ficha[`Bonus_atributo_${name}`] || PERICIAS[name] || "INT");
      const attrValue = Number(ficha[baseAttr]) || 0;
      const sor = Number(ficha.SOR) || 0;
      value = Math.floor((attrValue + sor) * 0.2)
        + (Number(ficha[`Bonus_${name}`]) || 0)
        + (Number(ficha[`Bonus_extra_${name}`]) || 0);
    }
    const roll = randomD20_();
    const sor = Number(ficha.SOR) || 0;
    const category = categorize_(roll, value, sor);
    const result = {
      id: novoId_("TO"),
      fichaId: String(ficha.ID),
      personagem: ficha["Nome do Personagem"] || "Sem nome",
      tipo: type === "atributo" ? "Atributo" : "Perícia",
      nome: name,
      atributoBase: baseAttr,
      valor: value,
      sor,
      d20: roll,
      categoria: category,
    };
    appendObject_(SHEETS.TESTES_OCULTOS, {
      ID: result.id,
      "Lote ID": batchId,
      Data: now,
      Mestre: session.nome || session.usuario,
      "ID da Ficha": result.fichaId,
      Personagem: result.personagem,
      Tipo: result.tipo,
      Nome: result.nome,
      "Atributo Base": result.atributoBase,
      "Valor da Perícia": result.valor,
      SOR: result.sor,
      d20: result.d20,
      Categoria: result.categoria,
      Dano: "",
      Detalhes: "Teste oculto; não publicado em Rolagens.",
    });
    return result;
  });

  return respostaSucesso_({ loteId: batchId, resultados: results });
}

function listarTestesOcultos_(params) {
  let rows = lerObjetos_(SHEETS.TESTES_OCULTOS);
  const limit = Math.min(Math.max(Number(params.limite) || 100, 1), 500);
  if (params.fichaId) rows = rows.filter((row) => String(row["ID da Ficha"]) === String(params.fichaId));
  return rows.slice(-limit).reverse();
}

function categorize_(roll, skill, sor) {
  if (roll === 1 && sor < 20) return "Desastre";
  const thP = 21 - Math.floor(skill / 17);
  const thE = 21 - Math.floor(skill / 5);
  const thB = 21 - Math.floor(skill / 2);
  const thN = 21 - skill;
  if (skill > 15 && roll >= thP) return "Sucesso Perfeito";
  if (roll >= thE) return "Sucesso Extremo";
  if (roll >= thB) return "Sucesso Bom";
  if (roll >= thN) return "Sucesso";
  return "Fracasso";
}

// -----------------------------------------------------------------------------
// Ameaças
// -----------------------------------------------------------------------------

function listarAmeacas_(params) {
  let rows = lerObjetos_(SHEETS.AMEACAS);
  const includeDeleted = verdadeiro_(params.incluirExcluidas);
  const includeArchived = verdadeiro_(params.incluirArquivadas);
  if (!includeDeleted) rows = rows.filter((row) => !verdadeiro_(row["Excluído"]));
  if (!includeArchived) rows = rows.filter((row) => !verdadeiro_(row.Arquivado));
  const search = normalizarTexto_(params.busca);
  if (search) {
    rows = rows.filter((row) => normalizarTexto_([row.Nome, row.Tipo, row.Elemento, row.Descritores, row["Descrição Pública"]].join(" ")).includes(search));
  }
  return rows.map(normalizarAmeacaSaida_);
}

function salvarAmeaca_(params, session) {
  const data = parseJsonObject_(params.ameaca || params.dados || params);
  const now = agoraIso_();
  const id = String(data.ID || data.id || novoId_("AME"));
  const existing = buscarPorId_(SHEETS.AMEACAS, "ID", id);
  const row = normalizarAmeacaEntrada_(data);
  row.ID = id;
  row["Atualizado Em"] = now;
  if (!existing) {
    row["Criado Em"] = now;
    row["Criado Por"] = session.nome || session.usuario;
    row.Arquivado = false;
    row["Excluído"] = false;
    appendObject_(SHEETS.AMEACAS, row);
  } else {
    atualizarPorId_(SHEETS.AMEACAS, "ID", id, row);
  }
  return respostaSucesso_({ mensagem: "Ameaça salva.", ameaca: normalizarAmeacaSaida_(buscarPorId_(SHEETS.AMEACAS, "ID", id)) });
}

function duplicarAmeaca_(params, session) {
  const original = buscarPorId_(SHEETS.AMEACAS, "ID", String(params.id || params.ID || ""));
  if (!original) throw new Error("Ameaça não encontrada.");
  const copy = Object.assign({}, original, {
    ID: novoId_("AME"),
    Nome: `${original.Nome || "Ameaça"} (Cópia)`,
    Arquivado: false,
    "Excluído": false,
    "Criado Em": agoraIso_(),
    "Atualizado Em": agoraIso_(),
    "Criado Por": session.nome || session.usuario,
  });
  appendObject_(SHEETS.AMEACAS, copy);
  return respostaSucesso_({ mensagem: "Ameaça duplicada.", ameaca: normalizarAmeacaSaida_(copy) });
}

function alterarEstadoAmeaca_(params, session, field) {
  const id = String(params.id || params.ID || "");
  if (!buscarPorId_(SHEETS.AMEACAS, "ID", id)) throw new Error("Ameaça não encontrada.");
  const value = params.valor === undefined ? true : verdadeiro_(params.valor);
  atualizarPorId_(SHEETS.AMEACAS, "ID", id, { [field]: value, "Atualizado Em": agoraIso_() });
  return respostaSucesso_({ mensagem: field === "Arquivado" ? "Estado de arquivamento atualizado." : "Ameaça enviada à lixeira." });
}

function restaurarAmeaca_(params) {
  const id = String(params.id || params.ID || "");
  atualizarPorId_(SHEETS.AMEACAS, "ID", id, { "Excluído": false, Arquivado: false, "Atualizado Em": agoraIso_() });
  return respostaSucesso_({ mensagem: "Ameaça restaurada." });
}

function rolarAtaqueAmeaca_(params, session) {
  const threat = buscarPorId_(SHEETS.AMEACAS, "ID", String(params.ameacaId || ""));
  if (!threat || verdadeiro_(threat["Excluído"])) throw new Error("Ameaça não encontrada.");
  const actions = parseJsonArray_(threat["Ações JSON"]);
  const action = actions.find((item) => String(item.id || item.ID || item.nome) === String(params.acaoId || params.nomeAcao || ""));
  if (!action) throw new Error("Ação da ameaça não encontrada.");

  const skill = Number(action.valorPericia ?? action.pericia ?? 0) || 0;
  const sor = Number(threat.SOR) || 0;
  const d20 = randomD20_();
  const category = categorize_(d20, skill, sor);
  const damage = verdadeiro_(params.rolarDano) ? rollDamageExpression_(action.dano || "") : null;
  const result = {
    ameaca: threat.Nome,
    acao: action.nome,
    d20,
    valorPericia: skill,
    categoria: category,
    dano: damage,
    tipoDano: action.tipoDano || "",
    critico: action.critico || "",
    efeitos: action.efeitos || "",
  };
  appendObject_(SHEETS.TESTES_OCULTOS, {
    ID: novoId_("TA"), "Lote ID": "", Data: agoraIso_(), Mestre: session.nome || session.usuario,
    "ID da Ficha": "", Personagem: threat.Nome, Tipo: "Ataque de Ameaça", Nome: action.nome,
    "Atributo Base": "", "Valor da Perícia": skill, SOR: sor, d20, Categoria: category,
    Dano: damage ? damage.total : "", Detalhes: JSON.stringify(result),
  });
  return respostaSucesso_({ resultado: result });
}

function normalizarAmeacaEntrada_(data) {
  const map = {
    Nome: data.Nome ?? data.nome ?? "",
    Imagem: data.Imagem ?? data.imagem ?? "",
    VD: data.VD ?? data.vd ?? "",
    Tipo: data.Tipo ?? data.tipo ?? "",
    Elemento: data.Elemento ?? data.elemento ?? "",
    Descritores: data.Descritores ?? data.descritores ?? "",
    Tamanho: data.Tamanho ?? data.tamanho ?? "",
    "Descrição Pública": data["Descrição Pública"] ?? data.descricaoPublica ?? "",
    "Notas Secretas": data["Notas Secretas"] ?? data.notasSecretas ?? "",
  };
  ["AGI", "FOR", "INT", "PRE", "VIG", "SOR", "Iniciativa", "Percepção", "Defesa", "Fortitude", "Reflexos", "Vontade"].forEach((key) => {
    map[key] = data[key] ?? data[key.toLowerCase()] ?? "";
  });
  Object.assign(map, {
    "PV Máximo": data["PV Máximo"] ?? data.pvMaximo ?? "",
    "Estado Machucado": data["Estado Machucado"] ?? data.estadoMachucado ?? "",
    "Deslocamento": data.Deslocamento ?? data.deslocamento ?? "",
    "RD Geral": data["RD Geral"] ?? data.rdGeral ?? "",
    "Resistências": data["Resistências"] ?? data.resistencias ?? "",
    "Imunidades": data.Imunidades ?? data.imunidades ?? "",
    "Vulnerabilidades": data.Vulnerabilidades ?? data.vulnerabilidades ?? "",
    "Sentidos Especiais": data["Sentidos Especiais"] ?? data.sentidosEspeciais ?? "",
    "Perícias": typeof (data["Perícias"] ?? data.pericias) === "object" ? JSON.stringify(data["Perícias"] ?? data.pericias) : (data["Perícias"] ?? data.pericias ?? ""),
    "Habilidades Passivas": data["Habilidades Passivas"] ?? data.habilidadesPassivas ?? "",
    "Presença DT": data["Presença DT"] ?? data.presencaDt ?? "",
    "Presença Dano Mental": data["Presença Dano Mental"] ?? data.presencaDanoMental ?? "",
    "Presença Imunidade NEX": data["Presença Imunidade NEX"] ?? data.presencaImunidadeNex ?? "",
    "Enigma Descrição": data["Enigma Descrição"] ?? data.enigmaDescricao ?? "",
    "Enigma Pistas": data["Enigma Pistas"] ?? data.enigmaPistas ?? "",
    "Enigma Estado": data["Enigma Estado"] ?? data.enigmaEstado ?? "Ativo",
    "Enigma Efeitos Removidos": data["Enigma Efeitos Removidos"] ?? data.enigmaEfeitosRemovidos ?? "",
    "Ações JSON": JSON.stringify(data.acoes || parseJsonArray_(data["Ações JSON"])),
    Arquivado: verdadeiro_(data.Arquivado ?? data.arquivado),
    "Excluído": verdadeiro_(data["Excluído"] ?? data.excluido),
  });
  return map;
}

function normalizarAmeacaSaida_(row) {
  const out = Object.assign({}, row);
  out.acoes = parseJsonArray_(row["Ações JSON"]);
  return out;
}

// -----------------------------------------------------------------------------
// Investigação
// -----------------------------------------------------------------------------

function listarInvestigacoesPermitidas_(session) {
  return lerObjetos_(SHEETS.INVESTIGACOES).filter((row) => !verdadeiro_(row.Arquivada) || session.tipo === "mestre");
}

function salvarInvestigacao_(params, session) {
  const data = parseJsonObject_(params.investigacao || params);
  const id = String(data.ID || data.id || novoId_("INV"));
  const existing = buscarPorId_(SHEETS.INVESTIGACOES, "ID", id);
  const updates = {
    Nome: data.Nome || data.nome || "Investigação sem nome",
    "Descrição": data["Descrição"] ?? data.descricao ?? "",
    Arquivada: verdadeiro_(data.Arquivada ?? data.arquivada),
    "Atualizado Em": agoraIso_(),
  };
  if (existing) atualizarPorId_(SHEETS.INVESTIGACOES, "ID", id, updates);
  else appendObject_(SHEETS.INVESTIGACOES, Object.assign({ ID: id, "Criado Por": session.nome || session.usuario, "Criado Em": agoraIso_() }, updates));
  return respostaSucesso_({ mensagem: "Investigação salva.", id });
}

function obterInvestigacao_(params, session) {
  const investigationId = String(params.investigacaoId || params.id || "");
  const investigation = buscarPorId_(SHEETS.INVESTIGACOES, "ID", investigationId);
  if (!investigation) throw new Error("Investigação não encontrada.");

  const includeTrash = session.tipo === "mestre" && verdadeiro_(params.incluirLixeira);
  const objects = lerObjetos_(SHEETS.INVESTIGACAO_OBJETOS)
    .filter((row) => String(row["Investigação ID"]) === investigationId)
    .filter((row) => includeTrash || !verdadeiro_(row["Excluído"]))
    .filter((row) => podeVerEntidade_(row, session));
  const visibleIds = new Set(objects.map((row) => String(row.ID)));
  const connections = lerObjetos_(SHEETS.INVESTIGACAO_CONEXOES)
    .filter((row) => String(row["Investigação ID"]) === investigationId && !verdadeiro_(row["Excluído"]))
    .filter((row) => visibleIds.has(String(row["Origem ID"])) && visibleIds.has(String(row["Destino ID"])))
    .filter((row) => podeVerEntidade_(row, session));
  const comments = lerObjetos_(SHEETS.INVESTIGACAO_COMENTARIOS)
    .filter((row) => String(row["Investigação ID"]) === investigationId && !verdadeiro_(row["Excluído"]))
    .filter((row) => visibleIds.has(String(row["Objeto ID"])));
  const referencedFileIds = new Set(objects.map((row) => String(row["Arquivo ID"] || "")).filter(Boolean));
  const files = lerObjetos_(SHEETS.INVESTIGACAO_ARQUIVOS)
    .filter((row) => String(row["Investigação ID"]) === investigationId && !verdadeiro_(row["Excluído"]))
    .filter((row) => visibleIds.has(String(row["Objeto ID"])) || referencedFileIds.has(String(row.ID)));
  const history = session.tipo === "mestre"
    ? lerObjetos_(SHEETS.INVESTIGACAO_HISTORICO).filter((row) => String(row["Investigação ID"]) === investigationId).slice(-250).reverse()
    : [];

  return {
    investigacao: investigation,
    objetos: objects,
    conexoes: connections,
    comentarios: comments,
    arquivos: files,
    historico: history,
    servidorEm: agoraIso_(),
  };
}

function salvarObjetoInvestigacao_(params, session) {
  const data = parseJsonObject_(params.objeto || params.dados || params);
  const investigationId = String(data["Investigação ID"] || data.investigacaoId || "");
  if (!buscarPorId_(SHEETS.INVESTIGACOES, "ID", investigationId)) throw new Error("Investigação não encontrada.");

  const id = String(data.ID || data.id || novoId_("OBJ"));
  const existing = buscarPorId_(SHEETS.INVESTIGACAO_OBJETOS, "ID", id);
  if (existing) exigirEdicaoObjeto_(existing, session, false);

  const isMaster = session.tipo === "mestre";
  const official = existing
    ? verdadeiro_(existing["Oficial do Mestre"])
    : isMaster && verdadeiro_(data.oficialMestre ?? true);
  // Jogadores nunca podem alterar metadados de segurança de um cartão existente.
  // Isso impede que uma edição autorizada revele um cartão secreto para toda a mesa.
  const visibility = isMaster
    ? normalizarVisibilidade_(data.Visibilidade || data.visibilidade || existing?.Visibilidade || "público")
    : existing ? normalizarVisibilidade_(existing.Visibilidade || "público") : "público";
  const locked = isMaster
    ? verdadeiro_(data.Bloqueado ?? data.bloqueado ?? (official ? true : false))
    : existing ? verdadeiro_(existing.Bloqueado) : false;
  const players = isMaster
    ? stringifyJsonArray_(data["Jogadores Visíveis JSON"] || data.jogadoresVisiveis || existing?.["Jogadores Visíveis JSON"])
    : existing ? stringifyJsonArray_(existing["Jogadores Visíveis JSON"]) : "[]";
  const arquivoId = String(data["Arquivo ID"] ?? data.arquivoId ?? existing?.["Arquivo ID"] ?? "").trim();
  let arquivoVinculado = null;
  if (arquivoId) {
    arquivoVinculado = buscarPorId_(SHEETS.INVESTIGACAO_ARQUIVOS, "ID", arquivoId);
    if (!arquivoVinculado
      || verdadeiro_(arquivoVinculado["Excluído"])
      || String(arquivoVinculado["Investigação ID"]) !== investigationId) {
      throw new Error("Arquivo do cartão não encontrado.");
    }
    if (!isMaster) {
      const uploader = normalizarUsuario_(arquivoVinculado["Enviado Por"]);
      const owners = [normalizarUsuario_(session.usuario), normalizarUsuario_(session.nome)];
      const alreadyAttached = String(arquivoVinculado["Objeto ID"] || "") === id;
      if (!alreadyAttached && !owners.includes(uploader)) throw new Error("Você não pode anexar este arquivo.");
    }
  }

  const now = agoraIso_();
  const currentVersion = Number(existing?.["Versão"]) || 0;
  const row = {
    "Investigação ID": investigationId,
    Tipo: data.Tipo || data.tipo || "Nota livre",
    "Título": data["Título"] ?? data.titulo ?? "Sem título",
    "Conteúdo": data["Conteúdo"] ?? data.conteudo ?? "",
    X: numeroOu_(data.X ?? data.x, existing?.X, 120),
    Y: numeroOu_(data.Y ?? data.y, existing?.Y, 120),
    Largura: Math.max(220, numeroOu_(data.Largura ?? data.largura, existing?.Largura, 320)),
    Altura: Math.max(150, numeroOu_(data.Altura ?? data.altura, existing?.Altura, 220)),
    Importante: verdadeiro_(data.Importante ?? data.importante),
    Bloqueado: locked,
    "Oficial do Mestre": official,
    Visibilidade: visibility,
    "Jogadores Visíveis JSON": players,
    "Arquivo ID": arquivoId,
    Arquivado: verdadeiro_(data.Arquivado ?? data.arquivado),
    "Excluído": existing ? verdadeiro_(existing["Excluído"]) : false,
    "Versão": currentVersion + 1,
    "Atualizado Por": session.nome || session.usuario,
    "Atualizado Em": now,
  };

  if (existing) {
    atualizarPorId_(SHEETS.INVESTIGACAO_OBJETOS, "ID", id, row);
    registrarHistoricoInvestigacao_(investigationId, id, "Objeto", "Editado", `${row.Tipo}: ${row["Título"]}`, session, row);
  } else {
    Object.assign(row, { ID: id, "Criado Por": session.nome || session.usuario, "Criado Em": now });
    appendObject_(SHEETS.INVESTIGACAO_OBJETOS, row);
    registrarHistoricoInvestigacao_(investigationId, id, "Objeto", "Criado", `${row.Tipo}: ${row["Título"]}`, session, row);
  }
  if (arquivoVinculado && String(arquivoVinculado["Objeto ID"] || "") !== id) {
    atualizarPorId_(SHEETS.INVESTIGACAO_ARQUIVOS, "ID", arquivoVinculado.ID, { "Objeto ID": id });
  }
  return respostaSucesso_({ mensagem: "Cartão salvo.", objeto: buscarPorId_(SHEETS.INVESTIGACAO_OBJETOS, "ID", id) });
}

function moverObjetoInvestigacao_(params, session) {
  const id = String(params.id || params.ID || "");
  const object = buscarPorId_(SHEETS.INVESTIGACAO_OBJETOS, "ID", id);
  if (!object) throw new Error("Cartão não encontrado.");
  exigirEdicaoObjeto_(object, session, true);
  const updates = {
    X: numeroOu_(params.x, object.X, 0),
    Y: numeroOu_(params.y, object.Y, 0),
    Largura: Math.max(220, numeroOu_(params.largura, object.Largura, 320)),
    Altura: Math.max(150, numeroOu_(params.altura, object.Altura, 220)),
    "Versão": (Number(object["Versão"]) || 0) + 1,
    "Atualizado Por": session.nome || session.usuario,
    "Atualizado Em": agoraIso_(),
  };
  atualizarPorId_(SHEETS.INVESTIGACAO_OBJETOS, "ID", id, updates);
  registrarHistoricoInvestigacao_(object["Investigação ID"], id, "Objeto", "Movido/redimensionado", object["Título"], session, updates);
  return respostaSucesso_({ objeto: Object.assign({}, object, updates) });
}

function lixeiraObjetoInvestigacao_(params, session) {
  const id = String(params.id || params.ID || "");
  const object = buscarPorId_(SHEETS.INVESTIGACAO_OBJETOS, "ID", id);
  if (!object) throw new Error("Cartão não encontrado.");
  const isCreator = normalizarUsuario_(object["Criado Por"]) === normalizarUsuario_(session.nome)
    || normalizarUsuario_(object["Criado Por"]) === normalizarUsuario_(session.usuario);
  if (session.tipo !== "mestre" && !isCreator) throw new Error("Jogadores só podem enviar seus próprios cartões à lixeira.");
  atualizarPorId_(SHEETS.INVESTIGACAO_OBJETOS, "ID", id, { "Excluído": true, "Atualizado Por": session.nome || session.usuario, "Atualizado Em": agoraIso_() });
  registrarHistoricoInvestigacao_(object["Investigação ID"], id, "Objeto", "Enviado à lixeira", object["Título"], session, object);
  return respostaSucesso_({ mensagem: "Cartão enviado à lixeira." });
}

function restaurarObjetoInvestigacao_(params, session) {
  const id = String(params.id || params.ID || "");
  const object = buscarPorId_(SHEETS.INVESTIGACAO_OBJETOS, "ID", id);
  if (!object) throw new Error("Cartão não encontrado.");
  atualizarPorId_(SHEETS.INVESTIGACAO_OBJETOS, "ID", id, { "Excluído": false, "Atualizado Por": session.nome || session.usuario, "Atualizado Em": agoraIso_() });
  registrarHistoricoInvestigacao_(object["Investigação ID"], id, "Objeto", "Restaurado", object["Título"], session, object);
  return respostaSucesso_({ mensagem: "Cartão restaurado." });
}

function excluirDefinitivoObjetoInvestigacao_(params, session) {
  const id = String(params.id || params.ID || "");
  const object = buscarPorId_(SHEETS.INVESTIGACAO_OBJETOS, "ID", id);
  if (!object) throw new Error("Cartão não encontrado.");
  deleteRowsByKeys_(SHEETS.INVESTIGACAO_OBJETOS, { ID: id }, ["ID"]);
  deleteRowsByKeys_(SHEETS.INVESTIGACAO_CONEXOES, { "Origem ID": id }, ["Origem ID"]);
  deleteRowsByKeys_(SHEETS.INVESTIGACAO_CONEXOES, { "Destino ID": id }, ["Destino ID"]);
  registrarHistoricoInvestigacao_(object["Investigação ID"], id, "Objeto", "Excluído definitivamente", object["Título"], session, object);
  return respostaSucesso_({ mensagem: "Cartão excluído definitivamente." });
}

function salvarConexaoInvestigacao_(params, session) {
  const data = parseJsonObject_(params.conexao || params);
  const origin = buscarPorId_(SHEETS.INVESTIGACAO_OBJETOS, "ID", String(data.origemId || data["Origem ID"] || ""));
  const target = buscarPorId_(SHEETS.INVESTIGACAO_OBJETOS, "ID", String(data.destinoId || data["Destino ID"] || ""));
  if (!origin || !target || String(origin["Investigação ID"]) !== String(target["Investigação ID"])) throw new Error("Cartões de conexão inválidos.");
  if (!podeVerEntidade_(origin, session) || !podeVerEntidade_(target, session)) throw new Error("Conexão não autorizada.");

  const id = String(data.ID || data.id || novoId_("CON"));
  const existing = buscarPorId_(SHEETS.INVESTIGACAO_CONEXOES, "ID", id);
  if (existing && session.tipo !== "mestre") {
    const creator = normalizarUsuario_(existing["Criado Por"]);
    if (creator !== normalizarUsuario_(session.nome) && creator !== normalizarUsuario_(session.usuario)) {
      throw new Error("Você não pode editar esta conexão.");
    }
  }
  const now = agoraIso_();
  const row = {
    "Investigação ID": origin["Investigação ID"],
    "Origem ID": origin.ID,
    "Destino ID": target.ID,
    Texto: data.Texto ?? data.texto ?? "",
    Estilo: String(data.Estilo || data.estilo || "contínua").toLowerCase() === "tracejada" ? "tracejada" : "contínua",
    Visibilidade: session.tipo === "mestre" ? normalizarVisibilidade_(data.Visibilidade || data.visibilidade || "público") : "público",
    "Jogadores Visíveis JSON": session.tipo === "mestre" ? stringifyJsonArray_(data.jogadoresVisiveis) : "[]",
    "Excluído": false,
    "Versão": (Number(existing?.["Versão"]) || 0) + 1,
    "Atualizado Por": session.nome || session.usuario,
    "Atualizado Em": now,
  };
  if (existing) atualizarPorId_(SHEETS.INVESTIGACAO_CONEXOES, "ID", id, row);
  else appendObject_(SHEETS.INVESTIGACAO_CONEXOES, Object.assign({ ID: id, "Criado Por": session.nome || session.usuario, "Criado Em": now }, row));
  registrarHistoricoInvestigacao_(origin["Investigação ID"], id, "Conexão", existing ? "Editada" : "Criada", `${origin["Título"]} → ${target["Título"]}`, session, row);
  return respostaSucesso_({ conexao: buscarPorId_(SHEETS.INVESTIGACAO_CONEXOES, "ID", id) });
}

function excluirConexaoInvestigacao_(params, session) {
  const id = String(params.id || params.ID || "");
  const connection = buscarPorId_(SHEETS.INVESTIGACAO_CONEXOES, "ID", id);
  if (!connection) throw new Error("Conexão não encontrada.");
  const creator = normalizarUsuario_(connection["Criado Por"]);
  if (session.tipo !== "mestre" && creator !== normalizarUsuario_(session.nome) && creator !== normalizarUsuario_(session.usuario)) {
    throw new Error("Você não pode excluir esta conexão.");
  }
  atualizarPorId_(SHEETS.INVESTIGACAO_CONEXOES, "ID", id, { "Excluído": true, "Atualizado Por": session.nome || session.usuario, "Atualizado Em": agoraIso_() });
  return respostaSucesso_({ mensagem: "Conexão removida." });
}

function salvarComentarioInvestigacao_(params, session) {
  const object = buscarPorId_(SHEETS.INVESTIGACAO_OBJETOS, "ID", String(params.objetoId || ""));
  if (!object || !podeVerEntidade_(object, session)) throw new Error("Cartão não encontrado ou não autorizado.");
  const comment = String(params.comentario || "").trim();
  if (!comment) throw new Error("Comentário vazio.");
  const row = {
    ID: novoId_("COM"),
    "Investigação ID": object["Investigação ID"],
    "Objeto ID": object.ID,
    Comentário: comment,
    Autor: session.nome || session.usuario,
    "Tipo do Autor": session.tipo,
    Data: agoraIso_(),
    "Excluído": false,
  };
  appendObject_(SHEETS.INVESTIGACAO_COMENTARIOS, row);
  registrarHistoricoInvestigacao_(object["Investigação ID"], object.ID, "Comentário", "Criado", comment.slice(0, 120), session, row);
  return respostaSucesso_({ comentario: row });
}

function uploadInvestigacaoArquivo_(params, session) {
  const investigationId = String(params.investigacaoId || "");
  if (!buscarPorId_(SHEETS.INVESTIGACOES, "ID", investigationId)) throw new Error("Investigação não encontrada.");
  const objectId = String(params.objetoId || "");
  if (objectId) {
    const object = buscarPorId_(SHEETS.INVESTIGACAO_OBJETOS, "ID", objectId);
    if (!object || String(object["Investigação ID"]) !== investigationId || !podeVerEntidade_(object, session)) {
      throw new Error("Cartão do arquivo não encontrado ou não autorizado.");
    }
  }
  const mime = String(params.contentType || params.mime || "").toLowerCase();
  if (!REDENCAO_CONFIG.ALLOWED_MIME.includes(mime)) throw new Error("Formato não permitido. Use PNG, JPG, JPEG, WEBP, GIF ou PDF.");
  const raw = String(params.base64 || "").replace(/^data:[^;]+;base64,/, "");
  if (!raw) throw new Error("Arquivo vazio.");
  const bytes = Utilities.base64Decode(raw);
  const max = mime === "application/pdf" ? REDENCAO_CONFIG.MAX_PDF_BYTES : REDENCAO_CONFIG.MAX_IMAGE_BYTES;
  if (bytes.length > max) throw new Error(`Arquivo excede o limite de ${Math.round(max / 1024 / 1024)} MB.`);

  const folderId = PropertiesService.getScriptProperties().getProperty("UPDATE13_FOLDER_INVESTIGACOES");
  const folder = folderId ? DriveApp.getFolderById(folderId) : garantirSubpastas_().investigacoes;
  const safeName = sanitizarNomeArquivo_(params.fileName || params.nome || "arquivo");
  const file = folder.createFile(Utilities.newBlob(bytes, mime, safeName));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const links = criarLinksDrive_(file.getId());
  const fileRow = {
    ID: novoId_("ARQ"),
    "Investigação ID": investigationId,
    "Objeto ID": objectId,
    "Drive File ID": file.getId(),
    Nome: safeName,
    MIME: mime,
    URL: links.visualizar,
    "Miniatura URL": mime === "application/pdf" ? "" : links.miniatura,
    Tamanho: bytes.length,
    "Enviado Por": session.nome || session.usuario,
    Data: agoraIso_(),
    "Excluído": false,
  };
  appendObject_(SHEETS.INVESTIGACAO_ARQUIVOS, fileRow);
  return respostaSucesso_({ arquivo: fileRow });
}

function obterArquivoInvestigacao_(params, session) {
  const arquivoId = String(params.arquivoId || params.id || "").trim();
  const arquivo = buscarPorId_(SHEETS.INVESTIGACAO_ARQUIVOS, "ID", arquivoId);
  if (!arquivo || verdadeiro_(arquivo["Excluído"])) throw new Error("Arquivo não encontrado.");

  const mime = String(arquivo.MIME || "").toLowerCase();
  if (!mime.startsWith("image/")) throw new Error("Este anexo não é uma imagem.");

  const objetoId = String(arquivo["Objeto ID"] || "").trim();
  const objeto = objetoId
    ? buscarPorId_(SHEETS.INVESTIGACAO_OBJETOS, "ID", objetoId)
    : lerObjetos_(SHEETS.INVESTIGACAO_OBJETOS).find((item) =>
      String(item["Investigação ID"]) === String(arquivo["Investigação ID"])
      && String(item["Arquivo ID"] || "") === String(arquivo.ID)
    );

  if (objeto) {
    if (String(objeto["Investigação ID"]) !== String(arquivo["Investigação ID"])
      || !podeVerEntidade_(objeto, session)) {
      throw new Error("Imagem não autorizada.");
    }
  } else if (session.tipo !== "mestre") {
    const uploader = normalizarUsuario_(arquivo["Enviado Por"]);
    const owners = [normalizarUsuario_(session.usuario), normalizarUsuario_(session.nome)];
    if (!owners.includes(uploader)) throw new Error("Imagem ainda não vinculada a um cartão.");
  }

  const driveFileId = String(arquivo["Drive File ID"] || "").trim();
  if (!driveFileId) throw new Error("Arquivo sem referência no Drive.");
  const blob = DriveApp.getFileById(driveFileId).getBlob();
  const bytes = blob.getBytes();
  if (bytes.length > REDENCAO_CONFIG.MAX_IMAGE_BYTES) throw new Error("Imagem excede o limite permitido.");

  const contentType = String(blob.getContentType() || mime || "image/png");
  return {
    arquivoId: arquivo.ID,
    nome: arquivo.Nome || blob.getName(),
    mime: contentType,
    dataUrl: `data:${contentType};base64,${Utilities.base64Encode(bytes)}`,
  };
}

function criarLinksDrive_(fileId) {
  const id = String(fileId || "").trim();
  return {
    visualizar: `https://drive.google.com/file/d/${id}/view`,
    miniatura: `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w2000`,
  };
}

function corrigirUrlsArquivosInvestigacao_() {
  const sheet = getRequiredSheet_(SHEETS.INVESTIGACAO_ARQUIVOS);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return 0;
  const header = values[0].map(String);
  const idx = indexMap_(header);
  let corrigidas = 0;

  for (let row = 1; row < values.length; row += 1) {
    const driveFileId = String(values[row][idx["Drive File ID"]] || "").trim();
    if (!driveFileId) continue;
    const mime = String(values[row][idx.MIME] || "").toLowerCase();
    const links = criarLinksDrive_(driveFileId);
    values[row][idx.URL] = links.visualizar;
    values[row][idx["Miniatura URL"]] = mime === "application/pdf" ? "" : links.miniatura;
    corrigidas += 1;
  }

  sheet.getRange(2, 1, values.length - 1, header.length).setValues(values.slice(1));
  return corrigidas;
}

function vincularArquivosAosObjetos_() {
  const objetos = lerObjetos_(SHEETS.INVESTIGACAO_OBJETOS)
    .filter((objeto) => String(objeto["Arquivo ID"] || "").trim());
  let vinculados = 0;
  objetos.forEach((objeto) => {
    const arquivo = buscarPorId_(SHEETS.INVESTIGACAO_ARQUIVOS, "ID", String(objeto["Arquivo ID"]));
    if (!arquivo || String(arquivo["Objeto ID"] || "") === String(objeto.ID)) return;
    atualizarPorId_(SHEETS.INVESTIGACAO_ARQUIVOS, "ID", arquivo.ID, { "Objeto ID": objeto.ID });
    vinculados += 1;
  });
  return vinculados;
}

function exigirEdicaoObjeto_(object, session, movementOnly) {
  if (verdadeiro_(object["Excluído"])) throw new Error("Cartão está na lixeira.");
  if (session.tipo === "mestre") return;
  if (!podeVerEntidade_(object, session)) throw new Error("Cartão não autorizado.");
  if (verdadeiro_(object["Oficial do Mestre"]) && verdadeiro_(object.Bloqueado)) {
    throw new Error("Cartão oficial bloqueado pelo mestre.");
  }
  // Cartões de jogadores são colaborativos: todos podem editar e mover.
  if (movementOnly || !verdadeiro_(object["Oficial do Mestre"])) return;
}

function podeVerEntidade_(row, session) {
  if (session.tipo === "mestre") return true;
  const visibility = normalizarVisibilidade_(row.Visibilidade || "público");
  if (visibility === "público") return true;
  if (visibility === "somente mestre") return false;
  const users = parseJsonArray_(row["Jogadores Visíveis JSON"]).map(normalizarUsuario_);
  return users.includes(normalizarUsuario_(session.usuario));
}

function registrarHistoricoInvestigacao_(investigationId, objectId, entity, action, summary, session, snapshot) {
  appendObject_(SHEETS.INVESTIGACAO_HISTORICO, {
    ID: novoId_("HINV"),
    "Investigação ID": investigationId,
    "Objeto ID": objectId,
    Entidade: entity,
    "Ação": action,
    Resumo: summary,
    Autor: session.nome || session.usuario,
    Data: agoraIso_(),
    "Snapshot JSON": JSON.stringify(snapshot || {}),
  });
}

// -----------------------------------------------------------------------------
// Imagens de personagem
// -----------------------------------------------------------------------------

function uploadImagemPersonagem_(params, session) {
  const contentType = String(params.contentType || "image/png").toLowerCase();
  const allowed = ["image/png", "image/jpeg", "image/webp"];
  if (!allowed.includes(contentType)) throw new Error("Formato de imagem não permitido.");
  const base64 = String(params.base64 || "");
  if (!base64) throw new Error("Imagem não informada.");
  const bytes = Utilities.base64Decode(base64);
  if (bytes.length > 8 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 8 MB.");

  const root = DriveApp.getFolderById(REDENCAO_CONFIG.ROOT_FOLDER_ID);
  const folder = getOrCreateFolder_(root, "Personagens");
  const name = sanitizarNomeArquivo_(params.fileName || `personagem_${session.usuario}.png`);
  const file = folder.createFile(Utilities.newBlob(bytes, contentType, name));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return respostaSucesso_({
    url: `https://drive.google.com/uc?export=view&id=${file.getId()}`,
    fileId: file.getId(),
  });
}

// -----------------------------------------------------------------------------
// Portrait/OBS
// -----------------------------------------------------------------------------

function registrarTokenPortrait_(params, session) {
  const fichaId = String(params.fichaId || params.ID || "");
  exigirAcessoFicha_(fichaId, session);
  const token = String(params.portraitToken || "").replace(/[^a-zA-Z0-9_-]/g, "");
  if (token.length < 20) throw new Error("Token do Portrait inválido.");
  atualizarPorId_(SHEETS.FICHAS, "ID", fichaId, { "Token Portrait": token });
  return respostaSucesso_({ mensagem: "Portrait autorizado." });
}

function obterPortraitPublico_(params) {
  const fichaId = String(params.id || params.fichaId || "");
  const token = String(params.portraitToken || params.token || "").replace(/[^a-zA-Z0-9_-]/g, "");
  const ficha = buscarPorId_(SHEETS.FICHAS, "ID", fichaId);
  if (!ficha || !token || String(ficha["Token Portrait"] || "") !== token) throw new Error("Portrait não autorizado.");
  const publicFields = [
    "ID", "Nome do Personagem", "Imagem do Personagem", "PV Atual", "PV Máx.",
    "PE Atual", "PE Máx.", "Sanidade Atual", "Sanidade Máx.",
  ];
  const result = {};
  publicFields.forEach((key) => { result[key] = ficha[key] ?? ""; });
  const rolls = lerObjetos_(SHEETS.ROLAGENS)
    .filter((row) => String(row["ID da Ficha"]) === fichaId)
    .slice(-10);
  return { ficha: result, rolagens: rolls };
}

// -----------------------------------------------------------------------------
// Utilidades de dados
// -----------------------------------------------------------------------------

function getSpreadsheet_() {
  return SpreadsheetApp.openById(REDENCAO_CONFIG.SPREADSHEET_ID);
}

function getRequiredSheet_(name) {
  const sheet = getSpreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error(`Aba '${name}' não encontrada. Execute configurarAtualizacao13().`);
  return sheet;
}

function garantirAbaCabecalhos_(name, headers) {
  const spreadsheet = getSpreadsheet_();
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  garantirColunas_(name, headers);
  if (sheet.getFrozenRows() < 1) sheet.setFrozenRows(1);
  return sheet;
}

function garantirColunas_(sheetName, headers) {
  const sheet = getSpreadsheet_().getSheetByName(sheetName);
  if (!sheet) throw new Error(`Aba '${sheetName}' não encontrada.`);
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  let current = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map((value) => String(value || "").trim());
  if (sheet.getLastRow() === 0 || current.every((value) => !value)) current = [];
  const missing = headers.filter((header) => !current.includes(header));
  if (!current.length) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else if (missing.length) {
    sheet.getRange(1, current.length + 1, 1, missing.length).setValues([missing]);
  }
}

function lerObjetos_(sheetName) {
  const sheet = getRequiredSheet_(sheetName);
  const data = sheet.getDataRange().getValues();
  if (!data.length) return [];
  const header = data[0].map((value) => String(value || "").trim());
  return data.slice(1)
    .filter((row) => row.some((value) => value !== "" && value !== null))
    .map((row) => {
      const object = {};
      header.forEach((key, index) => {
        if (key) object[key] = serializarValor_(row[index]);
      });
      return object;
    });
}

function appendObject_(sheetName, object) {
  const sheet = getRequiredSheet_(sheetName);
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const row = header.map((key) => object[key] === undefined ? "" : object[key]);
  sheet.appendRow(row);
}

function appendObjectFlexible_(sheetName, object) {
  garantirColunas_(sheetName, Object.keys(object));
  appendObject_(sheetName, object);
}

function atualizarPorId_(sheetName, idColumn, id, updates) {
  garantirColunas_(sheetName, Object.keys(updates));
  const sheet = getRequiredSheet_(sheetName);
  const data = sheet.getDataRange().getValues();
  const header = data[0].map(String);
  const idx = indexMap_(header);
  if (idx[idColumn] === undefined) throw new Error(`Coluna '${idColumn}' ausente em ${sheetName}.`);
  for (let i = 1; i < data.length; i += 1) {
    if (String(data[i][idx[idColumn]]) !== String(id)) continue;
    Object.keys(updates).forEach((key) => {
      if (idx[key] !== undefined) sheet.getRange(i + 1, idx[key] + 1).setValue(updates[key]);
    });
    return i + 1;
  }
  throw new Error(`Registro '${id}' não encontrado em ${sheetName}.`);
}

function buscarPorId_(sheetName, idColumn, id) {
  return lerObjetos_(sheetName).find((row) => String(row[idColumn]) === String(id)) || null;
}

function upsertFlexible_(sheetName, params, keys) {
  const data = Object.assign({}, params);
  delete data.acao;
  delete data.token;
  garantirColunas_(sheetName, Object.keys(data));
  const sheet = getRequiredSheet_(sheetName);
  const values = sheet.getDataRange().getValues();
  const header = values[0].map(String);
  const idx = indexMap_(header);
  let rowIndex = -1;
  for (let i = 1; i < values.length; i += 1) {
    if (keys.every((key) => String(values[i][idx[key]]) === String(data[key]))) {
      rowIndex = i + 1;
      break;
    }
  }
  const row = header.map((key) => data[key] === undefined ? "" : data[key]);
  if (rowIndex > 0) sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  else sheet.appendRow(row);
}

function deleteRowsByKeys_(sheetName, params, keys) {
  const sheet = getRequiredSheet_(sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return;
  const header = values[0].map(String);
  const idx = indexMap_(header);
  const kept = [values[0]];
  for (let i = 1; i < values.length; i += 1) {
    const match = keys.every((key) => idx[key] !== undefined && String(values[i][idx[key]]) === String(params[key]));
    if (!match) kept.push(values[i]);
  }
  sheet.clearContents();
  sheet.getRange(1, 1, kept.length, kept[0].length).setValues(kept);
}

function indexMap_(header) {
  const map = {};
  header.forEach((name, index) => { map[String(name)] = index; });
  return map;
}

function getOrCreateFolder_(parent, name) {
  const iterator = parent.getFoldersByName(name);
  return iterator.hasNext() ? iterator.next() : parent.createFolder(name);
}

function normalizarParametros_(e) {
  const output = Object.assign({}, e && e.parameter ? e.parameter : {});
  if (e && e.postData && e.postData.contents) {
    const content = String(e.postData.contents || "").trim();
    if (content && (content.startsWith("{") || content.startsWith("["))) {
      try {
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) Object.assign(output, parsed);
      } catch (error) {
        // URLSearchParams já fica disponível em e.parameter.
      }
    }
  }
  return output;
}

function parseJsonObject_(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try { return JSON.parse(String(value)); } catch (error) { return {}; }
}

function parseJsonArray_(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return String(value).split(",").map((item) => item.trim()).filter(Boolean);
  }
}

function stringifyJsonArray_(value) {
  return JSON.stringify(parseJsonArray_(value));
}

function verdadeiro_(value) {
  if (value === true || value === 1) return true;
  return ["true", "1", "sim", "yes", "x"].includes(String(value || "").trim().toLowerCase());
}

function serializarValor_(value) {
  if (value instanceof Date) return value.toISOString();
  return value;
}

function numeroOu_(value, fallback, defaultValue) {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) return parsed;
  const second = Number(fallback);
  return Number.isFinite(second) ? second : defaultValue;
}

function normalizarUsuario_(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizarTexto_(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function normalizarVisibilidade_(value) {
  const normalized = normalizarTexto_(value);
  if (normalized.includes("mestre")) return "somente mestre";
  if (normalized.includes("selecion")) return "jogadores selecionados";
  return "público";
}

function sanitizarNomeArquivo_(value) {
  return String(value || "arquivo").replace(/[\\/:*?"<>|]+/g, "_").slice(0, 160);
}

function novoId_(prefix) {
  return `${prefix}_${Date.now()}_${Utilities.getUuid().replace(/-/g, "").slice(0, 12)}`;
}

function randomD20_() {
  return Math.floor(Math.random() * 20) + 1;
}

function rollDamageExpression_(expression) {
  const safe = String(expression || "").toLowerCase().replace(/\s+/g, "");
  if (!safe) return { expressao: "", total: 0, detalhes: [] };
  if (!/^[0-9d+\-]+$/.test(safe)) return { expressao: safe, total: null, detalhes: ["Expressão não suportada automaticamente."] };
  const terms = safe.match(/[+-]?[^+-]+/g) || [];
  let total = 0;
  const details = [];
  terms.forEach((term) => {
    const sign = term.startsWith("-") ? -1 : 1;
    const clean = term.replace(/^[+-]/, "");
    if (clean.includes("d")) {
      const parts = clean.split("d");
      const quantity = Math.min(Math.max(Number(parts[0]) || 1, 1), 100);
      const faces = Math.min(Math.max(Number(parts[1]) || 0, 2), 1000);
      const rolls = [];
      for (let i = 0; i < quantity; i += 1) rolls.push(Math.floor(Math.random() * faces) + 1);
      const subtotal = rolls.reduce((sum, value) => sum + value, 0) * sign;
      total += subtotal;
      details.push(`${sign < 0 ? "-" : ""}${quantity}d${faces}[${rolls.join(",")}]`);
    } else {
      const value = Number(clean) * sign;
      total += value;
      details.push(String(value));
    }
  });
  return { expressao: safe, total, detalhes: details };
}

function agoraIso_() {
  return new Date().toISOString();
}

function dataPtBr_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "America/Sao_Paulo", "dd/MM/yyyy");
}

function dataHoraPtBr_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "America/Sao_Paulo", "dd/MM/yyyy HH:mm:ss");
}

function mensagemErro_(error) {
  return error && error.message ? error.message : String(error || "Erro desconhecido.");
}

function respostaSucesso_(data) {
  return respostaJson_(Object.assign({ status: "sucesso" }, data || {}));
}

function respostaErro_(message) {
  return respostaJson_({ status: "erro", mensagem: String(message || "Erro desconhecido.") });
}

function respostaJson_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
