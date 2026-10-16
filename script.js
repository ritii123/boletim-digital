const CONFIG_ALUNO = {
  turma: "8A",
  numeroChamada: 33,
  apiUrl: "https://boletim-api.profbt.com.br"
};

const DISCIPLINAS_PADRAO = [
  { nome: "Língua Portuguesa", tri1: 8.5, tri2: 7.5, tri3: null, faltas1: 1, faltas2: 0, faltas3: 0 },
  { nome: "Matemática", tri1: 7.0, tri2: 8.0, tri3: null, faltas1: 2, faltas2: 1, faltas3: 0 },
  { nome: "História", tri1: 9.0, tri2: 8.5, tri3: null, faltas1: 0, faltas2: 0, faltas3: 0 },
  { nome: "Geografia", tri1: 8.0, tri2: 7.0, tri3: null, faltas1: 1, faltas2: 2, faltas3: 0 },
  { nome: "Ciências", tri1: 7.5, tri2: 9.0, tri3: null, faltas1: 0, faltas2: 0, faltas3: 0 },
  { nome: "Inglês", tri1: 9.5, tri2: 9.0, tri3: null, faltas1: 0, faltas2: 0, faltas3: 0 },
  { nome: "Arte", tri1: 10.0, tri2: 9.5, tri3: null, faltas1: 0, faltas2: 0, faltas3: 0 },
  { nome: "Educação Física", tri1: 9.0, tri2: 9.0, tri3: null, faltas1: 0, faltas2: 0, faltas3: 0 }
];

let dadosBoletim = null;
let pinSessao = "";

document.addEventListener("DOMContentLoaded", () => {
  const formAcesso = document.getElementById("form-acesso");
  const btnAlterarDados = document.getElementById("botao-alterar-dados");
  const formEditor = document.getElementById("form-editor");
  const btnCancelarEdicao = document.getElementById("botao-cancelar-edicao");

  if (formAcesso) {
    formAcesso.addEventListener("submit", tratarAcesso);
  }

  if (btnAlterarDados) {
    btnAlterarDados.addEventListener("click", abrirEditor);
  }

  if (formEditor) {
    formEditor.addEventListener("submit", salvarEdicao);
  }

  if (btnCancelarEdicao) {
    btnCancelarEdicao.addEventListener("click", fecharEditor);
  }
});

function normalizarNotaAntiga(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  if (typeof valor === "string") {
    valor = valor.replace(",", ".");
  }
  let num = Number(valor);
  if (isNaN(num)) return null;
  if (num > 10 && num <= 100) {
    num = num / 10;
  }
  return num;
}

function normalizarFaltaAntiga(valor) {
  if (valor === null || valor === undefined || valor === "") return 0;
  const num = parseInt(valor, 10);
  return isNaN(num) || num < 0 ? 0 : num;
}

function processarDadosIniciais(dadosEntrada) {
  if (!dadosEntrada || !Array.isArray(dadosEntrada.disciplinas) || dadosEntrada.disciplinas.length === 0) {
    return DISCIPLINAS_PADRAO.map(d => ({
      nome: d.nome,
      tri1: d.tri1,
      tri2: d.tri2,
      tri3: d.tri3,
      faltas1: d.faltas1,
      faltas2: d.faltas2,
      faltas3: d.faltas3
    }));
  }

  return dadosEntrada.disciplinas.map(item => {
    return {
      nome: String(item.nome || "Disciplina"),
      tri1: normalizarNotaAntiga(item.tri1),
      tri2: normalizarNotaAntiga(item.tri2),
      tri3: normalizarNotaAntiga(item.tri3),
      faltas1: normalizarFaltaAntiga(item.faltas1),
      faltas2: normalizarFaltaAntiga(item.faltas2),
      faltas3: normalizarFaltaAntiga(item.faltas3)
    };
  });
}

function calcularMediaDisciplina(d) {
  const notas = [d.tri1, d.tri2, d.tri3].filter(n => n !== null && typeof n === "number" && !isNaN(n));
  if (notas.length === 0) return null;
  const soma = notas.reduce((acc, val) => acc + val, 0);
  return soma / notas.length;
}

function calcularTotalFaltasDisciplina(d) {
  return (d.faltas1 || 0) + (d.faltas2 || 0) + (d.faltas3 || 0);
}

async function tratarAcesso(event) {
  event.preventDefault();
  const campoPin = document.getElementById("campo-pin");
  const mensagemAcesso = document.getElementById("mensagem-acesso");
  const btnEntrar = document.getElementById("botao-entrar");

  const pinDigitado = campoPin.value.trim();
  if (!pinDigitado) return;

  mensagemAcesso.textContent = "Conectando...";
  btnEntrar.disabled = true;

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/abrir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinDigitado
      })
    });

    if (resposta.status === 401) {
      mensagemAcesso.textContent = "Turma, chamada ou PIN inválidos.";
      btnEntrar.disabled = false;
      return;
    }

    if (resposta.status === 429) {
      mensagemAcesso.textContent = "Muitas tentativas. Aguarde um minuto e tente novamente.";
      btnEntrar.disabled = false;
      return;
    }

    if (!resposta.ok) {
      mensagemAcesso.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
      btnEntrar.disabled = false;
      return;
    }

    const resultado = await resposta.json();
    pinSessao = pinDigitado;
    campoPin.value = "";

    dadosBoletim = processarDadosIniciais(resultado.dados);

    document.getElementById("area-acesso").hidden = true;
    document.getElementById("area-boletim").hidden = false;

    renderizarTudo();
  } catch (erro) {
    mensagemAcesso.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
    btnEntrar.disabled = false;
  }
}

function renderizarTudo() {
  renderizarCards();
  renderizarTabela();
}

function renderizarCards() {
  const conteinerCards = document.getElementById("cards");
  if (!conteinerCards) return;
  conteinerCards.innerHTML = "";

  let somaMedias = 0;
  let qtdDisciplinasComMedia = 0;
  let totalFaltasGeral = 0;

  dadosBoletim.forEach(d => {
    const media = calcularMediaDisciplina(d);
    if (media !== null) {
      somaMedias += media;
      qtdDisciplinasComMedia++;
    }
    totalFaltasGeral += calcularTotalFaltasDisciplina(d);
  });

  const mediaGeral = qtdDisciplinasComMedia > 0 ? (somaMedias / qtdDisciplinasComMedia).toFixed(1).replace(".", ",") : "--";

  const cardMedia = document.createElement("div");
  cardMedia.className = "card";
  const titMedia = document.createElement("div");
  titMedia.className = "card-titulo";
  titMedia.textContent = "Média Geral";
  const valMedia = document.createElement("div");
  valMedia.className = "card-valor";
  valMedia.textContent = mediaGeral;
  cardMedia.appendChild(titMedia);
  cardMedia.appendChild(valMedia);

  const cardFaltas = document.createElement("div");
  cardFaltas.className = "card";
  const titFaltas = document.createElement("div");
  titFaltas.className = "card-titulo";
  titFaltas.textContent = "Total de Faltas";
  const valFaltas = document.createElement("div");
  valFaltas.className = "card-valor";
  valFaltas.textContent = String(totalFaltasGeral);
  cardFaltas.appendChild(titFaltas);
  cardFaltas.appendChild(valFaltas);

  const cardDisciplinas = document.createElement("div");
  cardDisciplinas.className = "card";
  const titDisc = document.createElement("div");
  titDisc.className = "card-titulo";
  titDisc.textContent = "Disciplinas";
  const valDisc = document.createElement("div");
  valDisc.className = "card-valor";
  valDisc.textContent = String(dadosBoletim.length);
  cardDisciplinas.appendChild(titDisc);
  cardDisciplinas.appendChild(valDisc);

  conteinerCards.appendChild(cardMedia);
  conteinerCards.appendChild(cardFaltas);
  conteinerCards.appendChild(cardDisciplinas);
}

function renderizarTabela() {
  const corpoTabela = document.getElementById("corpo-tabela");
  if (!corpoTabela) return;
  corpoTabela.innerHTML = "";

  dadosBoletim.forEach(d => {
    const tr = document.createElement("tr");

    const tdNome = document.createElement("td");
    tdNome.textContent = d.nome;
    tr.appendChild(tdNome);

    const tdTri1 = document.createElement("td");
    tdTri1.textContent = d.tri1 !== null ? d.tri1.toFixed(1).replace(".", ",") : "--";
    tr.appendChild(tdTri1);

    const tdTri2 = document.createElement("td");
    tdTri2.textContent = d.tri2 !== null ? d.tri2.toFixed(1).replace(".", ",") : "--";
    tr.appendChild(tdTri2);

    const tdTri3 = document.createElement("td");
    tdTri3.textContent = d.tri3 !== null ? d.tri3.toFixed(1).replace(".", ",") : "--";
    tr.appendChild(tdTri3);

    const media = calcularMediaDisciplina(d);
    const tdMedia = document.createElement("td");
    tdMedia.textContent = media !== null ? media.toFixed(1).replace(".", ",") : "--";
    tr.appendChild(tdMedia);

    const totalFaltas = calcularTotalFaltasDisciplina(d);
    const tdFaltas = document.createElement("td");
    tdFaltas.textContent = String(totalFaltas);
    tr.appendChild(tdFaltas);

    const tdSituacao = document.createElement("td");
    const badge = document.createElement("span");

    if (media === null) {
      badge.className = "badge badge-sem-nota";
      badge.textContent = "Em andamento";
    } else if (media >= 6.0) {
      badge.className = "badge badge-bom";
      badge.textContent = "Aprovado";
    } else {
      badge.className = "badge badge-atencao";
      badge.textContent = "Atenção";
    }

    tdSituacao.appendChild(badge);
    tr.appendChild(tdSituacao);

    corpoTabela.appendChild(tr);
  });
}

function abrirEditor() {
  const listaEditor = document.getElementById("lista-editor");
  const mensagemEditor = document.getElementById("mensagem-editor");
  if (!listaEditor) return;

  listaEditor.innerHTML = "";
  if (mensagemEditor) mensagemEditor.textContent = "";

  dadosBoletim.forEach((d, idx) => {
    const bloc = document.createElement("div");
    bloc.className = "editor-disciplina";

    const h3 = document.createElement("h3");
    h3.textContent = d.nome;
    bloc.appendChild(h3);

    const grade = document.createElement("div");
    grade.className = "editor-grade";

    grade.appendChild(criarCampoEditor(`t1_${idx}`, "Nota 1º Tri", d.tri1 !== null ? String(d.tri1).replace(".", ",") : "", "text"));
    grade.appendChild(criarCampoEditor(`t2_${idx}`, "Nota 2º Tri", d.tri2 !== null ? String(d.tri2).replace(".", ",") : "", "text"));
    grade.appendChild(criarCampoEditor(`t3_${idx}`, "Nota 3º Tri", d.tri3 !== null ? String(d.tri3).replace(".", ",") : "", "text"));

    grade.appendChild(criarCampoEditor(`f1_${idx}`, "Faltas 1º Tri", String(d.faltas1 ?? 0), "text"));
    grade.appendChild(criarCampoEditor(`f2_${idx}`, "Faltas 2º Tri", String(d.faltas2 ?? 0), "text"));
    grade.appendChild(criarCampoEditor(`f3_${idx}`, "Faltas 3º Tri", String(d.faltas3 ?? 0), "text"));

    bloc.appendChild(grade);
    listaEditor.appendChild(bloc);
  });

  document.getElementById("area-editor").hidden = false;
}

function criarCampoEditor(id, labelTexto, valorInicial, tipo) {
  const container = document.createElement("div");
  container.className = "campo-editor";

  const lbl = document.createElement("label");
  lbl.htmlFor = id;
  lbl.textContent = labelTexto;

  const inp = document.createElement("input");
  inp.type = tipo;
  inp.id = id;
  inp.value = valorInicial;
  inp.setAttribute("aria-invalid", "false");

  const erroSpan = document.createElement("span");
  erroSpan.className = "erro-campo";
  erroSpan.id = `erro_${id}`;

  container.appendChild(lbl);
  container.appendChild(inp);
  container.appendChild(erroSpan);

  return container;
}

function fecharEditor() {
  document.getElementById("area-editor").hidden = true;
  const mensagemEditor = document.getElementById("mensagem-editor");
  if (mensagemEditor) mensagemEditor.textContent = "";
}

function validarNotaDigitada(texto) {
  const str = texto.trim();
  if (str === "") return { valido: true, valor: null };
  const limpo = str.replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(limpo)) {
    return { valido: false, erro: "Digite um valor de 0 a 10." };
  }
  const num = Number(limpo);
  if (isNaN(num) || num < 0 || num > 10) {
    return { valido: false, erro: "A nota deve ser entre 0 e 10." };
  }
  return { valido: true, valor: num };
}

function validarFaltaDigitada(texto) {
  const str = texto.trim();
  if (str === "" || !/^\d+$/.test(str)) {
    return { valido: false, erro: "Digite um número inteiro (0 ou mais)." };
  }
  const num = parseInt(str, 10);
  if (isNaN(num) || num < 0) {
    return { valido: false, erro: "O número deve ser 0 ou maior." };
  }
  return { valido: true, valor: num };
}

async function salvarEdicao(event) {
  event.preventDefault();

  const mensagemEditor = document.getElementById("mensagem-editor");
  const btnSalvar = document.getElementById("botao-salvar-alteracoes");
  if (mensagemEditor) mensagemEditor.textContent = "";

  let temErro = false;
  const novosDadosDisciplinas = [];

  for (let i = 0; i < dadosBoletim.length; i++) {
    const discOriginal = dadosBoletim[i];
    const itemAtualizado = { nome: discOriginal.nome };

    const t1Inp = document.getElementById(`t1_${i}`);
    const t2Inp = document.getElementById(`t2_${i}`);
    const t3Inp = document.getElementById(`t3_${i}`);
    const f1Inp = document.getElementById(`f1_${i}`);
    const f2Inp = document.getElementById(`f2_${i}`);
    const f3Inp = document.getElementById(`f3_${i}`);

    const resT1 = validarNotaDigitada(t1Inp.value);
    marcarCampo(t1Inp, `erro_t1_${i}`, resT1);

    const resT2 = validarNotaDigitada(t2Inp.value);
    marcarCampo(t2Inp, `erro_t2_${i}`, resT2);

    const resT3 = validarNotaDigitada(t3Inp.value);
    marcarCampo(t3Inp, `erro_t3_${i}`, resT3);

    const resF1 = validarFaltaDigitada(f1Inp.value);
    marcarCampo(f1Inp, `erro_f1_${i}`, resF1);

    const resF2 = validarFaltaDigitada(f2Inp.value);
    marcarCampo(f2Inp, `erro_f2_${i}`, resF2);

    const resF3 = validarFaltaDigitada(f3Inp.value);
    marcarCampo(f3Inp, `erro_f3_${i}`, resF3);

    if (!resT1.valido || !resT2.valido || !resT3.valido || !resF1.valido || !resF2.valido || !resF3.valido) {
      temErro = true;
    } else {
      itemAtualizado.tri1 = resT1.valor;
      itemAtualizado.tri2 = resT2.valor;
      itemAtualizado.tri3 = resT3.valor;
      itemAtualizado.faltas1 = resF1.valor;
      itemAtualizado.faltas2 = resF2.valor;
      itemAtualizado.faltas3 = resF3.valor;
      novosDadosDisciplinas.push(itemAtualizado);
    }
  }

  if (temErro) {
    if (mensagemEditor) mensagemEditor.textContent = "Corrija os campos destacados antes de salvar.";
    return;
  }

  if (mensagemEditor) mensagemEditor.textContent = "Salvando...";
  btnSalvar.disabled = true;

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinSessao,
        dados: {
          disciplinas: novosDadosDisciplinas
        }
      })
    });

    if (!resposta.ok) {
      if (mensagemEditor) mensagemEditor.textContent = "Não foi possível salvar as alterações. Tente novamente.";
      btnSalvar.disabled = false;
      return;
    }

    dadosBoletim = novosDadosDisciplinas;
    renderizarTudo();
    fecharEditor();

    const mensagemBoletim = document.getElementById("mensagem-boletim");
    if (mensagemBoletim) mensagemBoletim.textContent = "Dados salvos com sucesso.";
  } catch (erro) {
    if (mensagemEditor) mensagemEditor.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
  } finally {
    btnSalvar.disabled = false;
  }
}

function marcarCampo(inputEl, idErro, resultado) {
  const spanErro = document.getElementById(idErro);
  if (resultado.valido) {
    inputEl.setAttribute("aria-invalid", "false");
    if (spanErro) spanErro.textContent = "";
  } else {
    inputEl.setAttribute("aria-invalid", "true");
    if (spanErro) spanErro.textContent = resultado.erro;
  }
}