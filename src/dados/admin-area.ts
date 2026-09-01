import { COMUNIDADES, PUBLICACOES } from "./comunidade";
import { PUBLICACOES_DO_ACERVO } from "./comunidade-feed";
import { contagens, porSlug, slugsPorTipo } from "./grafo";
import { montarDesertos, CONTORNO_DO_BRASIL } from "./observatorio";
import { LIMITES } from "./geo";
import META from "./gerado/meta.json";
import { RECOMPENSAS } from "./recompensas";

/**
 * admin-area.ts, o que existe na plataforma para o administrador administrar.
 *
 * MÓDULO DE BUILD. Ele atravessa o grafo, e por isso nenhum arquivo de cliente pode
 * importá-lo por valor. O que chega ao navegador é a lista já achatada em primitivos, pela
 * página de servidor.
 *
 * A CONTAGEM É MEDIDA, nunca escrita à mão. Se o acervo mudar, a área muda junto.
 */

export const COISAS = [
  "pessoas",
  "coletivos",
  "instituicoes",
  "eventos",
  "espacos",
  "comunidades",
  "publicacoes",
  "loja",
] as const;
export type Coisa = (typeof COISAS)[number];

export interface Linha {
  id: string;
  titulo: string;
  /** A segunda coluna: de quem é, ou onde está. */
  contexto: string;
  /** A rota pública, quando existe, para o administrador abrir o item. */
  rota: string;
}

export interface DescricaoDaCoisa {
  coisa: Coisa;
  rotulo: string;
  /** O tipo de alvo que a tira de controles usa. */
  tipo: "pessoa" | "comunidade" | "evento" | "publicacao";
  /** O que a segunda coluna da lista mostra. */
  colunaDois: string;
  quantos: number;
}

const CONFIG: Record<
  Coisa,
  { rotulo: string; tipo: DescricaoDaCoisa["tipo"]; colunaDois: string }
> = {
  pessoas: { rotulo: "Pessoas", tipo: "pessoa", colunaDois: "Linguagens" },
  coletivos: { rotulo: "Coletivos", tipo: "pessoa", colunaDois: "Linguagens" },
  instituicoes: { rotulo: "Instituições", tipo: "pessoa", colunaDois: "Linguagens" },
  eventos: { rotulo: "Eventos", tipo: "evento", colunaDois: "Linguagens" },
  espacos: { rotulo: "Espaços", tipo: "evento", colunaDois: "Cidade" },
  comunidades: { rotulo: "Comunidades", tipo: "comunidade", colunaDois: "Pessoas" },
  publicacoes: { rotulo: "Publicações", tipo: "publicacao", colunaDois: "Comunidade" },
  loja: { rotulo: "Loja", tipo: "publicacao", colunaDois: "Custo" },
};

/** As classes do grafo que cada coisa recorta. */
const CLASSE: Partial<Record<Coisa, string>> = {
  pessoas: "pessoa",
  coletivos: "coletivo",
  instituicoes: "instituicao",
  eventos: "evento",
  espacos: "espaco",
};

const ROTA_DA_CLASSE: Record<string, string> = {
  pessoa: "/artista/",
  coletivo: "/artista/",
  instituicao: "/artista/",
  evento: "/evento/",
  espaco: "",
};

/** O teto por lista. O corte é DECLARADO na tela, nunca silencioso. */
export const TETO_DA_LISTA = 300;

export function linhasDe(coisa: Coisa): { linhas: Linha[]; total: number } {
  if (coisa === "comunidades") {
    const linhas = COMUNIDADES.map((c) => ({
      id: c.id,
      titulo: c.nome,
      contexto: `${c.assinantes.toLocaleString("pt-BR")} pessoas`,
      rota: `/comunidade/${c.id}/`,
    }));
    return { linhas, total: linhas.length };
  }

  if (coisa === "publicacoes") {
    const nomeDa = new Map(COMUNIDADES.map((c) => [c.id, c.nome]));
    const todas = [...PUBLICACOES, ...PUBLICACOES_DO_ACERVO];
    const linhas = todas.map((p) => ({
      id: p.id,
      titulo: p.titulo,
      contexto: nomeDa.get(p.comunidadeId) ?? p.comunidadeId,
      rota: `/comunidade/publicacao/${p.id}/`,
    }));
    return { linhas: linhas.slice(0, TETO_DA_LISTA), total: linhas.length };
  }

  if (coisa === "loja") {
    const linhas = RECOMPENSAS.map((r) => ({
      id: r.id,
      titulo: r.titulo,
      contexto: `${r.custo} fichas`,
      rota: "/meu/carteira/",
    }));
    return { linhas, total: linhas.length };
  }

  const classe = CLASSE[coisa];
  if (!classe) return { linhas: [], total: 0 };

  const slugs = slugsPorTipo(classe as Parameters<typeof slugsPorTipo>[0]);
  const prefixo = ROTA_DA_CLASSE[classe] ?? "";
  const linhas: Linha[] = [];
  for (const slug of slugs.slice(0, TETO_DA_LISTA)) {
    const e = porSlug(classe as Parameters<typeof porSlug>[0], slug);
    if (!e) continue;
    linhas.push({
      id: e.slug,
      titulo: e.titulo,
      contexto: e.linguagens.slice(0, 2).join(", "),
      rota: prefixo ? `${prefixo}${e.slug}/` : "",
    });
  }
  return { linhas, total: slugs.length };
}

export function descreverCoisa(coisa: Coisa): DescricaoDaCoisa {
  const c = CONFIG[coisa];
  const classe = CLASSE[coisa];
  const quantos = classe
    ? (contagens().porClasse[classe as keyof ReturnType<typeof contagens>["porClasse"]] ?? 0)
    : linhasDe(coisa).total;
  return { coisa, rotulo: c.rotulo, tipo: c.tipo, colunaDois: c.colunaDois, quantos };
}

export function aArea(): DescricaoDaCoisa[] {
  return COISAS.map(descreverCoisa);
}


// ---------------------------------------------------------------------------
// O painel da plataforma: como o produto está, e onde ele chega
// ---------------------------------------------------------------------------

export interface Numero {
  id: string;
  rotulo: string;
  valor: string;
  /** O denominador, quando o número é parte de um todo. Nunca omitido quando existe. */
  de: string;
}

export interface Fatia {
  rotulo: string;
  valor: number;
  cor: string;
}

export interface PainelDaPlataforma {
  numeros: Numero[];
  /** De onde veio cada coisa do acervo. */
  procedencia: Fatia[];
  /** As classes com mais peso, para a barra. */
  porClasse: { rotulo: string; valor: number }[];
  /** Quanto do acervo declara acessibilidade, medido. */
  acessibilidade: { porcento: number; rotulo: string };
  /** Quanto tem imagem própria. */
  imagem: { porcento: number; rotulo: string };
  desertos: ReturnType<typeof montarDesertos>;
  viewBox: string;
  contorno: string;
  rotuloContorno: string;
}

const COR_DA_PROCEDENCIA: Record<string, string> = {
  ic: "var(--ic-azul)",
  derivado: "var(--ic-verde-agua)",
  autorado: "var(--ic-laranja)",
};

const ROTULO_DA_PROCEDENCIA_CURTO: Record<string, string> = {
  ic: "Itaú Cultural",
  derivado: "derivado",
  autorado: "autorado",
};

function comSeparador(n: number): string {
  return n.toLocaleString("pt-BR");
}

function porcento(parte: number, todo: number): number {
  return todo === 0 ? 0 : Math.round((parte / todo) * 100);
}

export function oPainel(): PainelDaPlataforma {
  const c = contagens();
  const totalDeNos = META.totais.entidades;
  const totalDeArestas = META.totais.arestas;
  const comunidades = COMUNIDADES.length;
  const publicacoes = PUBLICACOES.length + PUBLICACOES_DO_ACERVO.length;
  const ficha = META.fichaDeAcessibilidade;
  const declaram = typeof ficha?.declaram === "number" ? ficha.declaram : 0;
  const imagens = META.cobertura.imagens.presentes;
  const comImagem = META.cobertura.entidadesComImagemLocal;

  const numeros: Numero[] = [
    { id: "entidades", rotulo: "Entidades no acervo", valor: comSeparador(totalDeNos), de: "" },
    { id: "ligacoes", rotulo: "Ligações", valor: comSeparador(totalDeArestas), de: "" },
    { id: "eventos", rotulo: "Eventos", valor: comSeparador(c.porClasse.evento ?? 0), de: "" },
    { id: "pessoas", rotulo: "Pessoas", valor: comSeparador(c.porClasse.pessoa ?? 0), de: "" },
    { id: "comunidades", rotulo: "Comunidades", valor: comSeparador(comunidades), de: "" },
    { id: "publicacoes", rotulo: "Publicações", valor: comSeparador(publicacoes), de: "" },
    {
      id: "coordenada",
      rotulo: "Com lugar no mapa",
      valor: comSeparador(META.cobertura.coordenadas.comCoordenada),
      de: comSeparador(totalDeNos),
    },
    {
      id: "imagem",
      rotulo: "Com imagem",
      valor: comSeparador(comImagem),
      de: comSeparador(totalDeNos),
    },
  ];

  const procedencia: Fatia[] = Object.entries(META.porProcedencia).map(([k, v]) => ({
    rotulo: ROTULO_DA_PROCEDENCIA_CURTO[k] ?? k,
    valor: v as number,
    cor: COR_DA_PROCEDENCIA[k] ?? "var(--cor-tinta-3)",
  }));

  // CINCO, E NÃO OITO. Medido em 390px: com oito barras cada rótulo fica com 31px e as
  // palavras transbordam a barra. O corte está declarado na tela.
  const porClasse = Object.entries(c.porClasse)
    .map(([k, v]) => ({ rotulo: k, valor: v as number }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  return {
    numeros,
    procedencia,
    porClasse,
    acessibilidade: {
      porcento: porcento(declaram, totalDeNos),
      rotulo: `${comSeparador(declaram)} de ${comSeparador(totalDeNos)} declaram acessibilidade`,
    },
    imagem: {
      porcento: porcento(imagens, imagens),
      rotulo: `${comSeparador(imagens)} imagens no disco, nenhuma faltando`,
    },
    desertos: montarDesertos(),
    viewBox: LIMITES.viewBox,
    contorno: CONTORNO_DO_BRASIL.d,
    rotuloContorno: CONTORNO_DO_BRASIL.rotulo,
  };
}
