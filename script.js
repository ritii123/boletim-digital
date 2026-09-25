// =========================================================
// DADOS FICTÍCIOS DO 8º ANO (dados brutos, ainda sem tratar)
// =========================================================
// Estes valores vêm em formatos diferentes de propósito,
// para testarmos a função normalizarNota().
const disciplinas = [
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

const MEDIA_MINIMA = 6.0;

// =========================================================
// FUNÇÃO: normalizarNota(valor)
// =========================================================
// Converte qualquer formato de nota para a escala 0 a 10.
// Retorna null quando a nota ainda não foi lançada ou é inválida.
function normalizarNota(valor) {
  // Nota ausente ou inválida de cara
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Se for texto, troca vírgula por ponto antes de converter
  let numero;
  if (typeof valor === "string") {
    numero = parseFloat(valor.replace(",", "."));
  } else {
    numero = valor;
  }

  // Se não virou número válido, é inválido
  if (isNaN(numero)) {
    return null;
  }

  // Regras de conversão
  if (numero >= 0 && numero <= 10) {
    return numero;           // já está na escala certa
  } else if (numero > 10 && numero <= 100) {
    return numero / 10;      // 82 vira 8.2 | 100 vira 10
  } else {
    return null;             // fora das regras = inválido
  }
}

// =========================================================
// FUNÇÃO: calcularMedia(notas)
// =========================================================
// Recebe uma lista de notas já normalizadas e calcula a média
// usando SOMENTE as notas válidas (não transforma ausente em zero).
function calcularMedia(notas) {
  const validas = notas.filter(function (n) {
    return n !== null;
  });

  if (validas.length === 0) {
    return null; // nenhuma nota disponível
  }

  let soma = 0;
  validas.forEach(function (n) {
    soma += n;
  });

  return soma / validas.length;
}

// =========================================================
// FUNÇÃO: somarFaltas(listaDeFaltas)
// =========================================================
function somarFaltas(listaDeFaltas) {
  let total = 0;
  listaDeFaltas.forEach(function (f) {
    total += f;
  });
  return total;
}

// =========================================================
// FUNÇÃO: definirSituacao(media)
// =========================================================
function definirSituacao(media) {
  if (media === null) {
    return { texto: "Nota ainda não disponível", classe: "badge-sem-nota" };
  }
  if (media >= MEDIA_MINIMA) {
    return { texto: "Bom desempenho", classe: "badge-bom" };
  }
  return { texto: "Atenção", classe: "badge-atencao" };
}

// =========================================================
// FORMATAÇÃO DE NOTA PARA EXIBIÇÃO
// =========================================================
// Mostra "—" quando for null, senão mostra com 1 casa decimal.
function formatarNota(nota) {
  if (nota === null) return "—";
  return nota.toFixed(1).replace(".", ",");
}

// =========================================================
// MONTAGEM DOS CARDS DE RESUMO
// =========================================================
function montarCards(listaProcessada) {
  const container = document.getElementById("cards");

  // Média geral = média das médias de cada disciplina
  const mediasValidas = listaProcessada
    .map(function (d) { return d.media; })
    .filter(function (m) { return m !== null; });

  let mediaGeral = null;
  if (mediasValidas.length > 0) {
    let soma = 0;
    mediasValidas.forEach(function (m) { soma += m; });
    mediaGeral = soma / mediasValidas.length;
  }

  // Total de faltas do boletim inteiro
  let totalFaltas = 0;
  listaProcessada.forEach(function (d) {
    totalFaltas += d.faltas;
  });

  // Disciplinas com bom desempenho / em atenção
  const bomDesempenho = listaProcessada.filter(function (d) {
    return d.media !== null && d.media >= MEDIA_MINIMA;
  }).length;

  const atencao = listaProcessada.filter(function (d) {
    return d.media !== null && d.media < MEDIA_MINIMA;
  }).length;

  // Frequência FICTÍCIA — apenas demonstrativa nesta versão.
  // No futuro, esse valor será calculado de outra forma.
  const frequenciaDemo = 92;

  const cards = [
    { titulo: "Média geral", valor: mediaGeral === null ? "—" : mediaGeral.toFixed(1).replace(".", ",") },
    { titulo: "Total de faltas", valor: totalFaltas },
    { titulo: "Bom desempenho", valor: bomDesempenho + " disciplinas" },
    { titulo: "Precisam de atenção", valor: atencao + " disciplinas" },
    { titulo: "Frequência", valor: frequenciaDemo + "%" }
  ];

  cards.forEach(function (card) {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML =
      '<div class="card-titulo">' + card.titulo + '</div>' +
      '<div class="card-valor">' + card.valor + '</div>';
    container.appendChild(div);
  });
}

// =========================================================
// MONTAGEM DA TABELA
// =========================================================
function montarTabela(listaProcessada) {
  const corpo = document.getElementById("corpo-tabela");

  listaProcessada.forEach(function (d) {
    const situacao = definirSituacao(d.media);

    const linha = document.createElement("tr");
    linha.innerHTML =
      "<td>" + d.disciplina + "</td>" +
      "<td>" + formatarNota(d.tri1) + "</td>" +
      "<td>" + formatarNota(d.tri2) + "</td>" +
      "<td>" + formatarNota(d.tri3) + "</td>" +
      "<td>" + formatarNota(d.media) + "</td>" +
      "<td>" + d.faltas + "</td>" +
      '<td><span class="badge ' + situacao.classe + '">' + situacao.texto + "</span></td>";

    corpo.appendChild(linha);
  });
}

// =========================================================
// FUNÇÃO PRINCIPAL — roda quando a página carrega
// =========================================================
function iniciar() {
  // Processa cada disciplina: normaliza notas, calcula média e faltas
  const listaProcessada = disciplinas.map(function (d) {
    const n1 = normalizarNota(d.tri1);
    const n2 = normalizarNota(d.tri2);
    const n3 = normalizarNota(d.tri3);

    return {
      disciplina: d.disciplina,
      tri1: n1,
      tri2: n2,
      tri3: n3,
      media: calcularMedia([n1, n2, n3]),
      faltas: somarFaltas(d.faltas)
    };
  });

  montarCards(listaProcessada);
  montarTabela(listaProcessada);
}

// Espera o HTML carregar antes de rodar tudo
document.addEventListener("DOMContentLoaded", iniciar);