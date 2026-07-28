// ========================
// CONFIGURAÇÃO INICIAL
// ========================
const SHEET_USUARIOS    = "Usuarios";
const SHEET_COMBATES    = "Combates";
const SHEET_HABILIDADES = "Habilidades";
const SHEET_RITUAIS     = "Rituais";
const SHEET_INVENTARIO  = "Inventario";
const SHEET_ROLAGENS    = "Rolagens";
const SHEET_FICHAS      = "Fichas";
const SHEET_CARTEIRA    = "Carteira"; // Nova aba para carteira

// ========================
// GET: retorna dados da aba especificada
// ========================
function doGet(e) {
  const nomeAba = e.parameter.sheet;
  if (!nomeAba) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "erro", mensagem: "Parâmetro 'sheet' não informado." })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    const aba = planilha.getSheetByName(nomeAba);
    if (!aba) {
      return ContentService.createTextOutput(
        JSON.stringify({ status: "erro", mensagem: "Aba não encontrada." })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const dados = aba.getDataRange().getValues();
    const cabecalho = dados[0];
    const json = [];

    for (let i = 1; i < dados.length; i++) {
      const linha = {};
      for (let j = 0; j < cabecalho.length; j++) {
        linha[cabecalho[j]] = dados[i][j];
      }
      json.push(linha);
    }

    return ContentService
      .createTextOutput(JSON.stringify(json))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "erro", mensagem: err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// ========================
// POST: manipula login, criação e edição
// ========================
function doPost(e) {
  try {
    const acao = e.parameter.acao;

    if (acao === "login") return loginUsuario(e.parameter.usuario, e.parameter.senha);
    if (acao === "criarFichaComUsuario") return criarFichaComUsuario(e);
    if (acao === "salvarFicha") return salvarFicha(e);
    if (acao === "salvarAtaque") return salvarAtaque(e);
    if (acao === "deletarAtaque") return deletarAtaque(e);
    if (acao === "salvarHabilidade") return salvarHabilidade(e);
    if (acao === "deletarHabilidade") return deletarHabilidade(e);
    if (acao === "salvarRitual") return salvarRitual(e);
    if (acao === "deletarRitual") return deletarRitual(e);
    if (acao === "salvarInventario") return salvarInventario(e);
    if (acao === "deletarInventario") return deletarInventario(e);
    if (acao === "salvarRolagem") return salvarRolagem(e);

    // Novas ações para Carteira
    if (acao === "salvarCarteira") return salvarCarteira(e);
    if (acao === "deletarCarteira") return deletarCarteira(e);

    // ✅ Trata requisições JSON de upload (sem acao)
    if (e.postData && e.postData.type === "application/json") {
      return tratarUploadImagemBase64(e);
    }

    return respostaErro("Ação inválida.");
  } catch (err) {
    return respostaErro("Erro no processamento: " + err.message);
  }
}

// ========================
// SALVAR ROLAGEM
// ========================
function salvarRolagem(e) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ROLAGENS);
  const novaLinha = [
    e.parameter["ID da Ficha"],
    e.parameter.Horario,
    e.parameter["Nome do Personagem"],
    e.parameter.Tipo,
    e.parameter.Nome,
    e.parameter.Valor,
    e.parameter["Tipo de Sucesso"]
  ];
  aba.appendRow(novaLinha);
  return ContentService.createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========================
// SALVAR RITUAL (corrigido)
// ========================
function salvarRitual(e) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName(SHEET_RITUAIS);
  if (!aba) return respostaErro("Aba 'Rituais' não encontrada.");

  const dados = aba.getDataRange().getValues();
  const cabecalho = dados[0];
  const idxFicha = cabecalho.indexOf("ID da Ficha");
  const idxNome = cabecalho.indexOf("Nome do Ritual");
  const idFicha = String(e.parameter["ID da Ficha"]).trim();
  const nomeRitual = String(e.parameter["Nome do Ritual"]).trim();

  let linhaExistente = -1;
  for (let i = 1; i < dados.length; i++) {
    const linha = dados[i];
    if (
      String(linha[idxFicha]).trim() === idFicha &&
      String(linha[idxNome]).trim() === nomeRitual
    ) {
      linhaExistente = i;
      break;
    }
  }

  const novaLinha = cabecalho.map(campo => e.parameter[campo] || "");

  if (linhaExistente > -1) {
    aba.getRange(linhaExistente + 1, 1, 1, novaLinha.length).setValues([novaLinha]);
  } else {
    aba.appendRow(novaLinha);
  }

  return respostaSucesso({ mensagem: "Ritual salvo com sucesso!" });
}

// ========================
// DELETAR RITUAL (corrigido)
// ========================
function deletarRitual(e) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName(SHEET_RITUAIS);
  if (!aba) return respostaErro("Aba 'Rituais' não encontrada.");

  const dados = aba.getDataRange().getValues();
  const cabecalho = dados[0];
  const idxFicha = cabecalho.indexOf("ID da Ficha");
  const idxNome  = cabecalho.indexOf("Nome do Ritual");
  const idFicha  = String(e.parameter["ID da Ficha"]).trim();
  const nomeRitual = String(e.parameter["Nome do Ritual"]).trim();

  const novasLinhas = dados.filter((row, i) => {
    if (i === 0) return true;
    return !(
      String(row[idxFicha]).trim() === idFicha &&
      String(row[idxNome]).trim() === nomeRitual
    );
  });

  if (novasLinhas.length === dados.length)
    return respostaErro("Ritual não encontrado para deletar.");

  aba.clearContents();
  aba.getRange(1, 1, novasLinhas.length, novasLinhas[0].length).setValues(novasLinhas);
  return respostaSucesso({ mensagem: "Ritual deletado com sucesso!" });
}

// ========================
// SALVAR CARTEIRA (corrigido com "Descrição")
// ========================
function salvarCarteira(e) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName(SHEET_CARTEIRA);
  if (!aba) return respostaErro("Aba 'Carteira' não encontrada.");

  const novaLinha = [
    e.parameter["ID da Ficha"] || "",
    e.parameter["Tipo de Movimento"] || "",
    Number(e.parameter.Valor) || 0,
    e.parameter["Descrição"] || "", // <- Corrigido para bater com a planilha
    new Date().toLocaleString("pt-BR") // <- Data/Hora automática correta
  ];

  aba.appendRow(novaLinha);

  return respostaSucesso({ mensagem: "Movimentação registrada com sucesso!" });
}


// ========================
// DELETAR CARTEIRA
// ========================
function deletarCarteira(e) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName(SHEET_CARTEIRA);
  if (!aba) return respostaErro("Aba 'Carteira' não encontrada.");

  const dados = aba.getDataRange().getValues();
  const cabecalho = dados[0];
  const idxFicha     = cabecalho.indexOf("ID da Ficha");
  const idxDescricao = cabecalho.indexOf("Descrição");

  const idFicha    = String(e.parameter["ID da Ficha"]).trim();
  const descricao  = String(e.parameter["Descrição"]).trim();

  const novas = dados.filter((linha, i) => {
    if (i === 0) return true;
    return !(
      String(linha[idxFicha]).trim() === idFicha &&
      String(linha[idxDescricao]).trim() === descricao
    );
  });

  aba.clearContents();
  aba.getRange(1, 1, novas.length, novas[0].length).setValues(novas);
  return respostaSucesso({ mensagem: "Movimentação removida da carteira." });
}

// ========================
// LOGIN
// ========================
function loginUsuario(usuario, senha) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName(SHEET_USUARIOS);
  const linhas = aba.getDataRange().getValues();

  const cabecalho = linhas[0];
  const idxUsuario = cabecalho.indexOf("usuario");
  const idxSenha   = cabecalho.indexOf("senha");
  const idxNome    = cabecalho.indexOf("nome");
  const idxTipo    = cabecalho.indexOf("tipo");

  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i];
    if (
      String(linha[idxUsuario]).trim().toLowerCase() === String(usuario).trim().toLowerCase() &&
      String(linha[idxSenha]).trim() === String(senha).trim()
    ) {
      return respostaSucesso({
        usuario: {
          nome:    linha[idxNome],
          tipo:    linha[idxTipo],
          usuario: linha[idxUsuario]
        }
      });
    }
  }

  return respostaErro("Usuário ou senha inválidos.");
}

// ========================
// CRIAR FICHA + USUÁRIO
// ========================
function criarFichaComUsuario(e) {
  const planilha    = SpreadsheetApp.getActiveSpreadsheet();
  const abaFichas   = planilha.getSheetByName(SHEET_FICHAS);
  const abaUsuarios = planilha.getSheetByName(SHEET_USUARIOS);
  if (!abaFichas || !abaUsuarios)
    return respostaErro("Aba 'Fichas' ou 'Usuarios' não encontrada.");

  const usuario    = e.parameter.jogador?.trim().toLowerCase();
  const nome       = e.parameter.jogador?.trim();
  const personagem = e.parameter.personagem?.trim();
  if (!usuario || !personagem)
    return respostaErro("Dados incompletos.");

  const novaFicha = [
    new Date().getTime(),
    personagem,
    "",
    usuario,
    "", "", "", "", "", "", "", "", "", "", "", "",
    "", "", "", "", "", "", "", "Normal", "",
    new Date().toLocaleDateString("pt-BR"),
    new Date().toLocaleDateString("pt-BR")
  ];
  abaFichas.appendRow(novaFicha);

  const usuarios = abaUsuarios.getDataRange().getValues();
  const cabecalho= usuarios[0];
  const idxUser  = cabecalho.indexOf("usuario");
  const existe   = usuarios.some((row, i) => i > 0 && String(row[idxUser]).toLowerCase() === usuario);
  if (!existe) {
    abaUsuarios.appendRow([nome, usuario, "1234", "jogador"]);
  }

  return respostaSucesso({ mensagem: "Ficha e usuário criados com sucesso!" });
}

// ========================
// SALVAR FICHA
// ========================
function salvarFicha(e) {
  const aba    = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_FICHAS);
  const id     = e.parameter.ID;
  if (!id) return respostaErro("ID da ficha não informado.");

  const dados     = aba.getDataRange().getValues();
  const cabecalho = dados[0];
  const idxID     = cabecalho.indexOf("ID");

  for (let i = 1; i < dados.length; i++) {
    if (String(dados[i][idxID]) === id) {
      for (let j = 0; j < cabecalho.length; j++) {
        const campo = cabecalho[j];
        if (e.parameter[campo] !== undefined) {
          aba.getRange(i + 1, j + 1).setValue(e.parameter[campo]);
        }
      }
      // Atualiza data de modificação (última coluna)
      aba.getRange(i + 1, cabecalho.length).setValue(new Date().toLocaleDateString("pt-BR"));
      return respostaSucesso({ mensagem: "Ficha salva com sucesso!" });
    }
  }
  return respostaErro("Ficha com este ID não encontrada.");
}

// ========================
// SALVAR ATAQUE
// ========================
function salvarAtaque(e) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_COMBATES);
  if (!aba) return respostaErro("Aba 'Combates' não encontrada.");

  const cabecalho = aba.getDataRange().getValues()[0];
  const novaLinha = cabecalho.map(col => e.parameter[col] || "");
  aba.appendRow(novaLinha);
  return respostaSucesso({ mensagem: "Ataque salvo com sucesso!" });
}

// ========================
// DELETAR ATAQUE
// ========================
function deletarAtaque(e) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_COMBATES);
  if (!aba) return respostaErro("Aba 'Combates' não encontrada.");

  const dados     = aba.getDataRange().getValues();
  const cabecalho = dados[0];
  const idxFicha  = cabecalho.indexOf("ID da Ficha");
  const idxNome   = cabecalho.indexOf("Nome Ataque");

  const novas = dados.filter((row, i) =>
    i === 0 ||
    !(
      String(row[idxFicha]) === String(e.parameter["ID da Ficha"]) &&
      String(row[idxNome]) === String(e.parameter["Nome Ataque"])
    )
  );
  aba.clearContents();
  aba.getRange(1, 1, novas.length, novas[0].length).setValues(novas);
  return respostaSucesso({ mensagem: "Ataque deletado com sucesso!" });
}

// ========================
// SALVAR HABILIDADE
// ========================
function salvarHabilidade(e) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName(SHEET_HABILIDADES);
  if (!aba) return respostaErro("Aba 'Habilidades' não encontrada.");

  const dados = aba.getDataRange().getValues();
  const cabecalho = dados[0];
  const idxFicha = cabecalho.indexOf("ID da Ficha");
  const idxNome  = cabecalho.indexOf("Nome");

  const idFicha       = String(e.parameter["ID da Ficha"]).trim();
  const nomeHabilidade = String(e.parameter["Nome"]).trim();

  let linhaExistente = -1;
  for (let i = 1; i < dados.length; i++) {
    const linha = dados[i];
    if (
      String(linha[idxFicha]).trim() === idFicha &&
      String(linha[idxNome]).trim() === nomeHabilidade
    ) {
      linhaExistente = i;
      break;
    }
  }

  const novaLinha = cabecalho.map(campo => e.parameter[campo] || "");

  if (linhaExistente > -1) {
    aba.getRange(linhaExistente + 1, 1, 1, novaLinha.length).setValues([novaLinha]);
  } else {
    aba.appendRow(novaLinha);
  }

  return respostaSucesso({ mensagem: "Habilidade salva com sucesso!" });
}

// ========================
// DELETAR HABILIDADE
// ========================
function deletarHabilidade(e) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_HABILIDADES);
  if (!aba) return respostaErro("Aba 'Habilidades' não encontrada.");

  const dados = aba.getDataRange().getValues();
  const cabecalho = dados[0];
  const idxFicha = cabecalho.indexOf("ID da Ficha");
  const idxNome  = cabecalho.indexOf("Nome");

  const idFicha        = String(e.parameter["ID da Ficha"]).trim();
  const nomeHabilidade = String(e.parameter["Nome"]).trim();

  const novas = dados.filter((row, i) => {
    if (i === 0) return true;
    return !(
      String(row[idxFicha]).trim() === idFicha &&
      String(row[idxNome]).trim() === nomeHabilidade
    );
  });

  aba.clearContents();
  aba.getRange(1, 1, novas.length, novas[0].length).setValues(novas);
  return respostaSucesso({ mensagem: "Habilidade deletada com sucesso!" });
}

// ========================
// SALVAR INVENTÁRIO
// ========================
function salvarInventario(e) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName(SHEET_INVENTARIO);
  if (!aba) return respostaErro("Aba 'Inventario' não encontrada.");

  const dados = aba.getDataRange().getValues();
  const cabecalho = dados[0];
  const idxFicha = cabecalho.indexOf("ID da Ficha");
  const idxItem  = cabecalho.indexOf("Item");
  const idFicha  = String(e.parameter["ID da Ficha"]).trim();
  const nomeItem = String(e.parameter["Item"]).trim();

  let linhaExistente = -1;
  for (let i = 1; i < dados.length; i++) {
    const linha = dados[i];
    if (
      String(linha[idxFicha]).trim() === idFicha &&
      String(linha[idxItem]).trim().toLowerCase() === nomeItem.toLowerCase()
    ) {
      linhaExistente = i;
      break;
    }
  }

  const novaLinha = cabecalho.map(campo => e.parameter[campo] || "");

  if (linhaExistente > -1) {
    aba.getRange(linhaExistente + 1, 1, 1, novaLinha.length).setValues([novaLinha]);
  } else {
    aba.appendRow(novaLinha);
  }

  return respostaSucesso({ mensagem: "Item salvo com sucesso!" });
}

// ========================
// DELETAR INVENTÁRIO
// ========================
function deletarInventario(e) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName(SHEET_INVENTARIO);
  if (!aba) return respostaErro("Aba 'Inventario' não encontrada.");

  const dados = aba.getDataRange().getValues();
  const cabecalho = dados[0];
  const idxFicha = cabecalho.indexOf("ID da Ficha");
  const idxItem  = cabecalho.indexOf("Item");
  const idFicha  = String(e.parameter["ID da Ficha"]).trim();
  const item     = String(e.parameter["Item"]).trim();

  const novas = dados.filter((linha, i) => {
    if (i === 0) return true;
    return !(String(linha[idxFicha]).trim() === idFicha && String(linha[idxItem]).trim() === item);
  });

  aba.clearContents();
  aba.getRange(1, 1, novas.length, novas[0].length).setValues(novas);
  return respostaSucesso({ mensagem: "Item deletado com sucesso!" });
}

// ========================
// TRATAR UPLOAD DE IMAGEM EM BASE64
// ========================
function tratarUploadImagemBase64(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const fileName = params.fileName;
    const base64Data = params.base64;
    const contentType = params.contentType || "image/png";

    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, fileName);

    // ID da pasta 'Site-Redencao' no Google Drive (substitua se necessário)
    const folderId = "17oLiv941IcKPIxdA1R35ZrPV8cif-qiL";
    const folder = DriveApp.getFolderById(folderId);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const url = `https://drive.google.com/uc?export=view&id=${file.getId()}`;

    const resposta = ContentService.createTextOutput(JSON.stringify({
      status: "success",
      url: url
    })).setMimeType(ContentService.MimeType.JSON);

    // Adiciona cabeçalhos CORS para permitir requisições externas
    return resposta.setHeaders({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type"
    });
  } catch (err) {
    const resposta = ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.message
    })).setMimeType(ContentService.MimeType.JSON);

    return resposta.setHeaders({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type"
    });
  }
}

// ========================
// RESPOSTAS
// ========================
function respostaSucesso(dados) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: "sucesso", ...dados })
  ).setMimeType(ContentService.MimeType.JSON);
}

function respostaErro(mensagem) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: "erro", mensagem })
  ).setMimeType(ContentService.MimeType.JSON);
}
