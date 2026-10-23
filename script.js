// Dados fictícios padronizados do 8º Ano
const dadosBoletim = [
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

// Função obrigatória para normalizar notas para a escala de 0 a 10
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null; // Nota ainda não lançada
  }

  // Converte texto com vírgula para número decimal com ponto
  let notaNum = typeof valor === "string" ? parseFloat(valor.replace(",", ".")) : Number(valor);

  if (isNaN(notaNum)) {
    return null; // Caso o valor seja inválido
  }

  // Regra para valores de 0 a 10
  if (notaNum >= 0 && notaNum <= 10) {
    return notaNum;
  }

  // Regra para valores maiores que 10 e menores/iguais a 100 (ex: 82 vira 8.2)
  if (notaNum > 10 && notaNum <= 100) {
    return notaNum / 10;
  }

  return null; // Fora das regras
}

// Função principal que atualiza toda a página via DOM
function renderizarBoletim() {
  const corpoTabela = document.getElementById("tabela-boletim");
  corpoTabela.innerHTML = "";

  let somaMedias = 0;
  let disciplinasComMedia = 0;
  let totalFaltasGeral = 0;
  let qtdBomDesempenho = 0;
  let qtdAtencao = 0;

  // Itera sobre cada disciplina usando forEach
  dadosBoletim.forEach((item) => {
    // Normalização das notas
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    // Soma das faltas do ano
    const totalFaltasDisc = item.faltas.reduce((a, b) => a + b, 0);
    totalFaltasGeral += totalFaltasDisc;

    // Cálculo da média utilizando apenas notas disponíveis
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

    // Formatação visual dos textos das notas
    const fmt1 = n1 !== null ? n1.toFixed(1).replace(".", ",") : "—";
    const fmt2 = n2 !== null ? n2.toFixed(1).replace(".", ",") : "—";
    const fmt3 = n3 !== null ? n3.toFixed(1).replace(".", ",") : "—";
    const fmtMedia = media !== null ? media.toFixed(1).replace(".", ",") : "—";

    // Criação da linha da tabela em HTML
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${item.disciplina}</strong></td>
      <td>${fmt1}</td>
      <td>${fmt2}</td>
      <td>${fmt3}</td>
      <td><strong>${fmtMedia}</strong></td>
      <td>${totalFaltasDisc}</td>
      <td class="${classeSituacao}">${situacao}</td>
    `;
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

// Executa a função ao carregar o script
renderizarBoletim();
