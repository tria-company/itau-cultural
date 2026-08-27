/**
 * panorama-produtor.ts, o retrato macro do que este perfil publica.
 *
 * UM CÁLCULO SÓ, LIDO POR TODAS AS TELAS. O painel de início mostra o saldo de pontos, a
 * loja mostra o mesmo saldo, e a tela de pauta mostra a fatia dela: três telas somando as
 * mesmas coisas por conta própria divergiriam no primeiro ajuste de regra, e a divergência
 * apareceria como dois números diferentes para o mesmo acervo, na mesma sessão.
 *
 * TUDO SAI DO ESTADO, NADA É GUARDADO. Os pontos, a qualidade da ficha e as contagens de
 * situação são recalculados a cada render a partir dos registros; guardar qualquer um
 * criaria uma segunda verdade que envelhece sozinha.
 *
 * O QUE É AUTORADO CONTINUA DECLARADO: alcance, ingressos, salvos e comentários vêm de
 * `desempenho-produtor.ts`, que diz na própria tela que são números da demonstração. O que
 * NÃO é autorado é a qualidade: crédito, descrição alternativa, acessibilidade e resumo
 * são lidos do registro de verdade, e é por isso que eles medem o trabalho de quem publica.
 */

import { comentariosDe, desempenhoDe, heroiDe } from "@/dados/desempenho-produtor";
import { DESCRICAO_DA_PAUTA } from "@/dados/tipos-produtor";
import type { Registro, RegistroDeAgenda } from "@/dados/tipos-produtor";

/** Uma regra de ponto: o que ela premia, quanto vale, e como se confere. */
export interface RegraDePonto {
  id: string;
  rotulo: string;
  /** O rótulo curto, para a barra de qualidade do painel. */
  curto: string;
  valor: number;
  vale: (r: Registro) => boolean;
}

/**
 * As regras premiam CUIDADO, não volume. Um placar de volume premiaria exatamente o
 * comportamento que enche a vitrine de cartão sem resumo, que é a lacuna que o mapa do
 * produto mede.
 */
export const REGRAS_DE_PONTO: RegraDePonto[] = [
  { id: "publicado", rotulo: "registro no ar", curto: "no ar", valor: 20, vale: () => true },
  {
    id: "credito",
    rotulo: "foto com crédito de quem a fez",
    curto: "crédito",
    valor: 10,
    vale: (r) => (r.imagem?.credito ?? "").trim() !== "",
  },
  {
    id: "alt",
    rotulo: "imagem com descrição para quem não vê",
    curto: "descrição",
    valor: 10,
    vale: (r) => (r.imagem?.alt ?? "").trim() !== "",
  },
  {
    id: "acessibilidade",
    rotulo: "ficha de acessibilidade resolvida",
    curto: "acessibilidade",
    valor: 15,
    vale: (r) => r.declaraAcessibilidade,
  },
  {
    id: "resumo",
    rotulo: "resumo escrito para a vitrine",
    curto: "resumo",
    valor: 5,
    vale: (r) => (r.resumo ?? "").trim().length >= 20,
  },
];

/** A cada 250 pontos, um nível. É o único número redondo, e ele é declarado na tela. */
export const PONTOS_POR_NIVEL = 250;

export interface RecompensaDaLoja {
  id: string;
  rotulo: string;
  descricao: string;
  custo: number;
}

export const LOJA_DE_PONTOS: RecompensaDaLoja[] = [
  {
    id: "destaque",
    rotulo: "Destaque na vitrine",
    descricao: "Sete dias em posição de topo em Descobrir.",
    custo: 120,
  },
  {
    id: "selo",
    rotulo: "Selo de ficha completa",
    descricao: "A marca que diz que nada foi declarado em silêncio.",
    custo: 200,
  },
  {
    id: "mentoria",
    rotulo: "Sessão de curadoria",
    descricao: "Uma hora com a equipe editorial sobre a sua programação.",
    custo: 320,
  },
  {
    id: "impulso",
    rotulo: "Impulso na busca",
    descricao: "Prioridade de ordenação por trinta dias.",
    custo: 480,
  },
];

export interface FatiaDaRegra {
  regra: RegraDePonto;
  quantos: number;
  pontos: number;
  /** 0 a 100, sobre os publicados. */
  porcento: number;
}

export interface Panorama {
  /** Todos, publicados e em edição. */
  total: number;
  publicados: number;
  rascunhos: number;
  devolvidos: number;
  pendencias: number;
  /** A série somada de todos os publicados, dia a dia. */
  serie: number[];
  alcance: number;
  ingressos: number;
  /** Em centavos, dos eventos pagos. */
  receita: number;
  salvos: number;
  comentarios: number;
  /** Sessões declaradas nos eventos publicados. */
  sessoes: number;
  /** Termos distintos usados por tudo que está publicado. */
  linguagensUsadas: number;
  temasUsados: number;
  /** Pontos ganhos e o nível a que eles chegam. */
  pontosGanhos: number;
  nivel: number;
  noNivel: number;
  porRegra: FatiaDaRegra[];
  /** Alcance por pauta, do maior para o menor. */
  porPauta: { pauta: string; rotulo: string; valor: number; publicados: number }[];
}

export function panoramaDe(registros: Registro[], dataDeReferencia: string): Panorama {
  const publicados = registros.filter((r) => r.situacao === "publicado");
  const serie: number[] = [];
  let alcance = 0;
  let ingressos = 0;
  let receita = 0;
  let salvos = 0;
  let comentarios = 0;
  let sessoes = 0;
  const linguagens = new Set<string>();
  const temas = new Set<string>();
  const porPauta = new Map<string, { valor: number; publicados: number }>();

  for (const r of publicados) {
    const d = desempenhoDe(r, dataDeReferencia);
    d.serie.forEach((v, i) => {
      serie[i] = (serie[i] ?? 0) + v;
    });
    const heroi = heroiDe(d);
    alcance += heroi.valor;
    salvos += Math.round(heroi.valor * 0.09);
    comentarios += comentariosDe(r.id).length;
    if (d.familia === "evento") {
      ingressos += d.ingressos;
      receita += d.receita ?? 0;
    }
    if (r.pauta === "agenda") sessoes += (r as RegistroDeAgenda).sessoes?.length ?? 0;
    for (const l of r.linguagens ?? []) linguagens.add(l);
    for (const t of r.temas ?? []) temas.add(t);
    const atual = porPauta.get(r.pauta) ?? { valor: 0, publicados: 0 };
    porPauta.set(r.pauta, { valor: atual.valor + heroi.valor, publicados: atual.publicados + 1 });
  }

  const porRegra = REGRAS_DE_PONTO.map((regra) => {
    const quantos = publicados.filter((r) => regra.vale(r)).length;
    return {
      regra,
      quantos,
      pontos: quantos * regra.valor,
      porcento: publicados.length === 0 ? 0 : Math.round((quantos / publicados.length) * 100),
    };
  });
  const pontosGanhos = porRegra.reduce((n, p) => n + p.pontos, 0);

  return {
    total: registros.length,
    publicados: publicados.length,
    rascunhos: registros.filter((r) => r.situacao === "rascunho").length,
    devolvidos: registros.filter((r) => r.situacao === "devolvido").length,
    pendencias: registros.reduce((n, r) => n + (r.pendencias?.length ?? 0), 0),
    serie: serie.length > 0 ? serie : [0],
    alcance,
    ingressos,
    receita,
    salvos,
    comentarios,
    sessoes,
    linguagensUsadas: linguagens.size,
    temasUsados: temas.size,
    pontosGanhos,
    nivel: Math.floor(pontosGanhos / PONTOS_POR_NIVEL) + 1,
    noNivel: pontosGanhos % PONTOS_POR_NIVEL,
    porRegra,
    porPauta: [...porPauta.entries()]
      .map(([pauta, v]) => ({
        pauta,
        rotulo: DESCRICAO_DA_PAUTA[pauta as Registro["pauta"]].rotulo,
        valor: v.valor,
        publicados: v.publicados,
      }))
      .sort((a, b) => b.valor - a.valor),
  };
}
