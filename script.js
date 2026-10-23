// Configuração fixa do estudante (não editável pela página)
const CONFIG_ALUNO = {
  turma: "8A",
  numeroChamada: 33,
  apiUrl: "https://boletim-api.profbt.com.br"
};

// Dados fictícios locais padrão do 8º Ano (usados em caso de novo registro ou sem dados remotos)
const dadosLocaisPadrao = [
  { disciplina: "Língua Portuguesa", tri1: 82, tri2: "7,8", tri3: 85, faltas: [2, 1, 1] },
  { disciplina: "Matemática", tri1: 52, tri2: "5,8", tri3: null, faltas: [3, 2, 1] },
  { disciplina: "Ciências", tri1: "8,1", tri2: 76, tri3: 8.0, faltas: [1, 2, 0] },
  { disciplina: "História", tri1: 7.0, tri2: 84, tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Geografia", tri1: 68, tri2: 7.3, tri3: "7,9", faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa", tri1: 86, tri2: "8,1", tri3: 8.7, faltas: [1, 0, 0] },
  { disciplina: "Arte", tri1: 9.0, tri2: 92, tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Educação Física", tri1: 95, tri2: 9.0, tri3: "9,4", faltas: [0, 1, 0] },
  { disciplina: "Educação Digital", tri1: 88, tri2: 9.1, tri3: 93, faltas: [1, 0, 1] },
  { disciplina: "Educação Financeira", tri1: 74, tri2: "7,8", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Estudo Orientado", tri1: 8.0, tri2: 83, tri3: "8,5", faltas: [0, 1, 0] },
  { disciplina: "Redação e Leitura", tri1: 62, tri2: "6,8", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico", tri1: 48, tri2: 5.6, tri3: "6,0", faltas: [2, 2, 1] },
  { disciplina: "Literatura Arte e Movimento", tri1: "7,7", tri2: 80, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Práticas Experimentais", tri1: 58, tri2: "6,2", tri3: 6.4, faltas: [1, 1, 1] }
];

// Estado da aplicação mantido somente em memória
let dadosBoletim = [];
let pinSessao = "";
let modoEdicao = false;

// Função para normalizar notas recebidas dos dados antigos/API (0-10, 0-100, textos com vírgula)
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  let notaNum = typeof valor === "string" ? parseFloat(valor.replace(",", ".")) : Number(valor);

  if (isNaN(notaNum)) {
    return null;
  }

  if (notaNum >= 0 && notaNum <= 10) {
    return notaNum;
  }

  if (notaNum > 10 && notaNum <= 100) {
    return notaNum / 10;
  }

  return null;
}

// Validação estrita para o input manual do estudante no modo edição (somente 0 a 10 ou vazio)
function validarEntradaNotaManual(valorTexto) {
  if (valorTexto === null || valorTexto === undefined) return { valida: true, valor: null };
  const str = String(valorTexto).trim().replace(",", ".");
  if (str === "") return { valida: true, valor: null };

  const num = Number(str);
  if (isNaN(num) || num < 0 || num > 10) {
    return { valida: false, valor: null };
  }
  return { valida: true, valor: num };
}

// Validação estrita para faltas manuais (somente inteiro >= 0)
function validarEntradaFaltaManual(valorTexto) {
  if (valorTexto === null || valorTexto === undefined) return { valida: false, valor: null };
  const str = String(valorTexto).trim();
  if (str === "") return { valida: false, valor: null };

  const num = Number(str);
  if (isNaN(num) || !Number.isInteger(num) || num < 0) {
    return { valida: false, valor: null };
  }
  return { valida: true, valor: num };
}

// Elementos do DOM
const areaLogin = document.getElementById("area-login");
const campoPin = document.getElementById("campo-pin");
const btnEntrar = document.getElementById("btn-entrar");
const msgLogin = document.getElementById("msg-login");

const conteudoBoletim = document.getElementById("conteudo-boletim");
const btnAlternarEdicao = document.getElementById("btn-alternar-edicao");
const btnSalvar = document.getElementById("btn-salvar");
const msgBoletim = document.getElementById("msg-boletim");

// Evento de Login
btnEntrar.addEventListener("click", autenticarEAbrirBoletim);

async function autenticarEAbrirBoletim() {
  const pinDigitado = campoPin.value.trim();
  if (!pinDigitado) {
    exibirMensagem(msgLogin, "Por favor, informe seu PIN.", "erro");
    return;
  }

  exibirMensagem(msgLogin, "Conectando...", "");
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
      exibirMensagem(msgLogin, "Turma, chamada ou PIN inválidos.", "erro");
      btnEntrar.disabled = false;
      return;
    }

    if (resposta.status === 429) {
      exibirMensagem(msgLogin, "Muitas tentativas. Aguarde um minuto e tente novamente.", "erro");
      btnEntrar.disabled = false;
      return;
    }

    if (!resposta.ok) {
      exibirMensagem(msgLogin, "Não foi possível conectar ao servidor. Tente novamente.", "erro");
      btnEntrar.disabled = false;
      return;
    }

    const resultado = await resposta.json();

    // Guarda o PIN em memória e limpa o campo
    pinSessao = pinDigitado;
    campoPin.value = "";
    areaLogin.style.display = "none";
    conteudoBoletim.style.display = "block";

    // Tratamento das disciplinas recebidas da API
    if (resultado.dados && Array.isArray(resultado.dados.disciplinas) && resultado.dados.disciplinas.length > 0) {
      dadosBoletim = resultado.dados.disciplinas;
    } else {
      // Se novo ou sem dados, utiliza os dados fictícios locais
      dadosBoletim = JSON.parse(JSON.stringify(dadosLocaisPadrao));
    }

    renderizarBoletim();
  } catch (erro) {
    exibirMensagem(msgLogin, "Não foi possível conectar ao servidor. Tente novamente.", "erro");
    btnEntrar.disabled = false;
  }
}

// Renderização principal do boletim
function renderizarBoletim() {
  const corpoTabela = document.getElementById("tabela-boletim");
  corpoTabela.innerHTML = "";

  let somaMedias = 0;
  let disciplinasComMedia = 0;
  let totalFaltasGeral = 0;
  let qtdBomDesempenho = 0;
  let qtdAtencao = 0;

  dadosBoletim.forEach((item, index) => {
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    let arrFaltas = Array.isArray(item.faltas) ? item.faltas : [0, 0, 0];
    const totalFaltasDisc = arrFaltas.reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0);
    totalFaltasGeral += totalFaltasDisc;

    const notasValidas = [n1, n2, n3].filter((n) => n !== null);
    let media = null;
    let situacao = "Nota ainda não disponível";
    let classeSituacao = "status-indisponivel";

    if (notasValidas.length > 0) {
      media = notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length;
      somaMedias += media;
      disciplinasComMedia++;

      if (media >= 6.0) {
        situacao = "Bom desempenho";
        classeSituacao = "status-bom";
        qtdBomDesempenho++;
      } else {
        situacao = "Atenção";
        classeSituacao = "status-atencao";
        qtdAtencao++;
      }
    }

    const tr = document.createElement("tr");

    // Coluna Disciplina com segurança DOM
    const tdDisc = document.createElement("td");
    const strongDisc = document.createElement("strong");
    strongDisc.textContent = item.disciplina;
    tdDisc.appendChild(strongDisc);
    tr.appendChild(tdDisc);

    if (modoEdicao) {
      // Inputs para notas no modo de edição
      const val1 = item.tri1 !== null && item.tri1 !== undefined ? item.tri1 : "";
      const val2 = item.tri2 !== null && item.tri2 !== undefined ? item.tri2 : "";
      const val3 = item.tri3 !== null && item.tri3 !== undefined ? item.tri3 : "";

      tr.appendChild(criarTdInput(`n1-${index}`, val1));
      tr.appendChild(criarTdInput(`n2-${index}`, val2));
      tr.appendChild(criarTdInput(`n3-${index}`, val3));

      // Média calculada (somente leitura)
      const tdMedia = document.createElement("td");
      tdMedia.innerHTML = `<strong>${media !== null ? media.toFixed(1).replace(".", ",") : "—"}</strong>`;
      tr.appendChild(tdMedia);

      // Inputs para faltas no modo de edição
      const f1 = arrFaltas[0] !== undefined ? arrFaltas[0] : 0;
      const f2 = arrFaltas[1] !== undefined ? arrFaltas[1] : 0;
      const f3 = arrFaltas[2] !== undefined ? arrFaltas[2] : 0;

      const tdFaltasEdit = document.createElement("td");
      tdFaltasEdit.innerHTML = `
        <input type="text" id="f1-${index}" class="input-tabela" value="${f1}" title="1º Tri Faltas">
        <input type="text" id="f2-${index}" class="input-tabela" value="${f2}" title="2º Tri Faltas">
        <input type="text" id="f3-${index}" class="input-tabela" value="${f3}" title="3º Tri Faltas">
      `;
      tr.appendChild(tdFaltasEdit);
    } else {
      // Exibição padrão das notas formatadas
      const fmt1 = n1 !== null ? n1.toFixed(1).replace(".", ",") : "—";
      const fmt2 = n2 !== null ? n2.toFixed(1).replace(".", ",") : "—";
      const fmt3 = n3 !== null ? n3.toFixed(1).replace(".", ",") : "—";
      const fmtMedia = media !== null ? media.toFixed(1).replace(".", ",") : "—";

      tr.innerHTML += `
        <td>${fmt1}</td>
        <td>${fmt2}</td>
        <td>${fmt3}</td>
        <td><strong>${fmtMedia}</strong></td>
        <td>${totalFaltasDisc}</td>
      `;
    }

    // Coluna Situação
    const tdSit = document.createElement("td");
    tdSit.className = classeSituacao;
    tdSit.textContent = situacao;
    tr.appendChild(tdSit);

    corpoTabela.appendChild(tr);
  });

  // Atualização dos Cards de Resumo
  const mediaGeral = disciplinasComMedia > 0 ? (somaMedias / disciplinasComMedia).toFixed(1).replace(".", ",") : "—";

  document.getElementById("card-media-geral").textContent = mediaGeral;
  document.getElementById("card-total-faltas").textContent = totalFaltasGeral;
  document.getElementById("card-bom-desempenho").textContent = qtdBomDesempenho;
  document.getElementById("card-atencao").textContent = qtdAtencao;

  // NOTA: A frequência abaixo é apenas demonstrativa (92%) e não calculada a partir das faltas reais nesta fase do projeto.
  document.getElementById("card-frequencia").textContent = "92%";
}

function criarTdInput(id, valor) {
  const td = document.createElement("td");
  const input = document.createElement("input");
  input.type = "text";
  input.id = id;
  input.className = "input-tabela";
  input.value = valor;
  td.appendChild(input);
  return td;
}

// Botão Alternar Edição
btnAlternarEdicao.addEventListener("click", () => {
  modoEdicao = !modoEdicao;
  if (modoEdicao) {
    btnAlternarEdicao.textContent = "Cancelar edição";
    btnSalvar.style.display = "inline-block";
    exibirMensagem(msgBoletim, "Modo de edição ativado.", "");
  } else {
    btnAlternarEdicao.textContent = "Alterar dados";
    btnSalvar.style.display = "none";
    exibirMensagem(msgBoletim, "", "");
  }
  renderizarBoletim();
});

// Botão Salvar
btnSalvar.addEventListener("click", async () => {
  let existemErros = false;
  const novasDisciplinas = [];

  // Coleta e validação dos dados linha por linha
  for (let i = 0; i < dadosBoletim.length; i++) {
    const elN1 = document.getElementById(`n1-${i}`);
    const elN2 = document.getElementById(`n2-${i}`);
    const elN3 = document.getElementById(`n3-${i}`);
    const elF1 = document.getElementById(`f1-${i}`);
    const elF2 = document.getElementById(`f2-${i}`);
    const elF3 = document.getElementById(`f3-${i}`);

    [elN1, elN2, elN3, elF1, elF2, elF3].forEach((el) => el && el.classList.remove("invalido"));

    const vN1 = validarEntradaNotaManual(elN1.value);
    const vN2 = validarEntradaNotaManual(elN2.value);
    const vN3 = validarEntradaNotaManual(elN3.value);

    const vF1 = validarEntradaFaltaManual(elF1.value);
    const vF2 = validarEntradaFaltaManual(elF2.value);
    const vF3 = validarEntradaFaltaManual(elF3.value);

    if (!vN1.valida) { elN1.classList.add("invalido"); existemErros = true; }
    if (!vN2.valida) { elN2.classList.add("invalido"); existemErros = true; }
    if (!vN3.valida) { elN3.classList.add("invalido"); existemErros = true; }

    if (!vF1.valida) { elF1.classList.add("invalido"); existemErros = true; }
    if (!vF2.valida) { elF2.classList.add("invalido"); existemErros = true; }
    if (!vF3.valida) { elF3.classList.add("invalido"); existemErros = true; }

    if (!existemErros) {
      novasDisciplinas.push({
        disciplina: dadosBoletim[i].disciplina,
        tri1: vN1.valor,
        tri2: vN2.valor,
        tri3: vN3.valor,
        faltas: [vF1.valor, vF2.valor, vF3.valor]
      });
    }
  }

  if (existemErros) {
    exibirMensagem(msgBoletim, "Por favor, corrija os campos destacados em vermelho (Notas: 0 a 10 | Faltas: números inteiros >= 0).", "erro");
    return;
  }

  exibirMensagem(msgBoletim, "Salvando...", "");
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
          disciplinas: novasDisciplinas
        }
      })
    });

    if (!resposta.ok) {
      exibirMensagem(msgBoletim, "Falha ao salvar dados no servidor. Tente novamente.", "erro");
      btnSalvar.disabled = false;
      return;
    }

    dadosBoletim = novasDisciplinas;
    modoEdicao = false;
    btnAlternarEdicao.textContent = "Alterar dados";
    btnSalvar.style.display = "none";
    btnSalvar.disabled = false;

    exibirMensagem(msgBoletim, "Dados salvos com sucesso.", "sucesso");
    renderizarBoletim();
  } catch (erro) {
    exibirMensagem(msgBoletim, "Não foi possível conectar ao servidor para salvar.", "erro");
    btnSalvar.disabled = false;
  }
});

// Helper para exibir mensagens de status
function exibirMensagem(elemento, texto, tipo) {
  elemento.textContent = texto;
  elemento.className = "mensagem-status " + tipo;
}
