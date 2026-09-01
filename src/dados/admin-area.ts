import { COMUNIDADES, PUBLICACOES } from "./comunidade";
import { capaSemeada } from "./comunidade-capas";
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
  /**
   * A capa, quando a coisa tem uma NA TELA DELA. Caminho local, nunca externo.
   *
   * ELA NÃO É INVENTADA AQUI. A loja tem foto em todos os 18 itens, e a lista mostra a
   * mesma. As comunidades têm UMA capa semeada, a oficial, e as outras 22 não têm capa em
   * lugar nenhum do produto: `comunidade-capas.ts` declara que escolher uma foto para
   * representar coletivos e instituições reais é a linha que este produto não cruza, a
   * mesma razão de não autorar elenco. A lista respeita isso e mostra o que a tela delas
   * mostra: o selo de UF e a descrição.
   */
  imagem?: string;
  alt?: string;
  /** O selo de estado, como no cartão do marketplace de comunidades. */
  selo?: string;
  /**
   * A classe e as linguagens, para a capa gerada quando não há foto.
   *
   * NÃO É PLACEHOLDER. `capa-sem-imagem.tsx` é a aparência DOMINANTE do produto: 1.019 das
   * 7.810 entidades têm imagem local, e cerca de 78% dos cartões do app caem nela. Campo de
   * cor da linguagem, o `\` do manual como textura, e o nome da classe. A lista do admin
   * usa a mesma, porque é a capa que a tela da coisa mostra.
   */
  classe?: string;
  linguagens?: string[];
  /** A linha sob o nome, quando a tela da coisa também a mostra. */
  descricao?: string;
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

/**
 * Onde cada classe vive no app público.
 *
 * INSTITUIÇÃO NÃO MORA EM `/artista/`. `(app)/artista/[slug]` emite
 * `slugsPorTipo("pessoa") + slugsPorTipo("coletivo")`, e mais nada: são 792 endereços, 575
 * pessoas e 217 coletivos. As 246 instituições e os 113 espaços estão em `/produtor/`. A
 * linha errada mandava as 246 linhas de instituição para 404, e o defeito era silencioso
 * porque o link só quebra quando alguém clica.
 */
const ROTA_DA_CLASSE: Record<string, string> = {
  pessoa: "/artista/",
  coletivo: "/artista/",
  instituicao: "/produtor/",
  evento: "/evento/",
  espaco: "/produtor/",
};

/** O teto por lista. O corte é DECLARADO na tela, nunca silencioso. */
export const TETO_DA_LISTA = 300;

export function linhasDe(coisa: Coisa): { linhas: Linha[]; total: number } {
  if (coisa === "comunidades") {
    // A LINHA MOSTRA O QUE O CARTÃO DELA MOSTRA. No marketplace o cartão é selo de UF,
    // nome, descrição e assinantes; só a comunidade oficial tem capa, e as outras 22 não
    // têm em lugar nenhum do produto, por decisão declarada em `comunidade-capas.ts`.
    const linhas = COMUNIDADES.map((c) => {
      const capa = capaSemeada(c.id);
      return {
        id: c.id,
        titulo: c.nome,
        contexto: `${c.assinantes.toLocaleString("pt-BR")} pessoas`,
        rota: `/comunidade/${c.id}/`,
        imagem: capa?.imagem,
        alt: capa?.imagemAlt,
        selo: c.uf,
        descricao: capa?.chamada || c.descricao,
        classe: c.natureza,
        linguagens: [...c.linguagens],
      };
    });
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
      imagem: r.imagem,
      alt: r.imagemAlt,
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

/**
 * Uma cobertura do acervo, de 0 a 100.
 *
 * O DETALHE NAO E ENFEITE: «68%» sozinho nao diz de quantos, e a casa exige denominador.
 */
export interface Medida {
  id: string;
  porcento: number;
  rotulo: string;
  detalhe: string;
}

export interface PainelDaPlataforma {
  numeros: Numero[];
  /** De onde veio cada coisa do acervo. */
  procedencia: Fatia[];
  /** As classes com mais peso, para a barra. */
  porClasse: { rotulo: string; valor: number }[];
  /** O quanto o acervo cobre cada coisa. Toda medida traz o denominador. */
  cobertura: Medida[];
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

/**
 * O nome de cada classe da ontologia, no plural.
 *
 * ELE NÃO SAI DE `cidade.ts` nem de `filtros.ts`, que já têm mapas parecidos, porque os
 * dois são parciais e nenhum cobre as quatorze: falta `ocorrencia`, `midia`, `termo` e
 * `temporada`, que são justamente as que o acervo tem mais. Importar um mapa que devolve a
 * chave crua em metade dos casos seria pior que declarar as quatorze aqui.
 */
const PLURAL_DA_CLASSE: Record<string, string> = {
  pessoa: "Pessoas",
  coletivo: "Coletivos",
  instituicao: "Instituições",
  espaco: "Espaços",
  obra: "Obras",
  termo: "Termos",
  programa: "Programas",
  evento: "Eventos",
  temporada: "Temporadas",
  ocorrencia: "Ocorrências",
  conteudo: "Conteúdos",
  midia: "Mídias",
  publicacao: "Publicações",
  formacao: "Formações",
};

export function oPainel(): PainelDaPlataforma {
  const c = contagens();
  const totalDeNos = META.totais.entidades;
  const totalDeArestas = META.totais.arestas;
  const comunidades = COMUNIDADES.length;
  const publicacoes = PUBLICACOES.length + PUBLICACOES_DO_ACERVO.length;
  const ficha = META.fichaDeAcessibilidade;
  const declaram = typeof ficha?.declaram === "number" ? ficha.declaram : 0;
  const comImagem = META.cobertura.entidadesComImagemLocal;

  const numeros: Numero[] = [
    { id: "entidades", rotulo: "Entidades no acervo", valor: comSeparador(totalDeNos), de: "" },
    { id: "ligacoes", rotulo: "Ligações", valor: comSeparador(totalDeArestas), de: "" },
    { id: "eventos", rotulo: "Eventos", valor: comSeparador(c.porClasse.evento ?? 0), de: "" },
    { id: "pessoas", rotulo: "Pessoas", valor: comSeparador(c.porClasse.pessoa ?? 0), de: "" },
    { id: "comunidades", rotulo: "Comunidades", valor: comSeparador(comunidades), de: "" },
    { id: "publicacoes", rotulo: "Publicações", valor: comSeparador(publicacoes), de: "" },
  ];
  // SEIS, E NAO OITO. Os dois que sairam eram «472 de 7.810» e «5.912 de 7.810»: parte de um
  // todo, que e exatamente o que um medidor mostra melhor que um numero solto. Eles nao
  // sumiram, desceram para a faixa de cobertura, com o denominador que a casa exige. O que
  // fica aqui e contagem pura, e seis caixas iguais fecham a grade sem sobra.

  const procedencia: Fatia[] = Object.entries(META.porProcedencia).map(([k, v]) => ({
    rotulo: ROTULO_DA_PROCEDENCIA_CURTO[k] ?? k,
    valor: v as number,
    cor: COR_DA_PROCEDENCIA[k] ?? "var(--cor-tinta-3)",
  }));

  // CINCO, E NÃO AS QUATORZE. Cinco barras cabem sem apertar em 370px, e o corte está
  // declarado na tela. O RÓTULO É O DA CASA, e não a chave: «midia» e «ocorrencia» são
  // nomes de campo, e um painel que mostra nome de campo está mostrando o banco em vez do
  // acervo.
  const porClasse = Object.entries(c.porClasse)
    .map(([k, v]) => ({ rotulo: PLURAL_DA_CLASSE[k] ?? k, valor: v as number }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  return {
    numeros,
    procedencia,
    porClasse,
    // TRES MEDIDAS, E AS TRES VARIAM. A anterior media `imagens / imagens`, que da 100%
    // por construcao: um medidor cheio que nao podia esvaziar nao media nada.
    cobertura: [
      {
        id: "acessibilidade",
        porcento: porcento(declaram, totalDeNos),
        rotulo: "Declaram acessibilidade",
        detalhe: `${comSeparador(declaram)} de ${comSeparador(totalDeNos)}`,
      },
      {
        id: "imagem",
        porcento: porcento(comImagem, totalDeNos),
        rotulo: "Têm imagem própria",
        detalhe: `${comSeparador(comImagem)} de ${comSeparador(totalDeNos)}`,
      },
      {
        id: "coordenada",
        porcento: porcento(META.cobertura.coordenadas.comCoordenada, totalDeNos),
        rotulo: "Têm lugar no mapa",
        detalhe: `${comSeparador(META.cobertura.coordenadas.comCoordenada)} de ${comSeparador(totalDeNos)}`,
      },
    ],
    desertos: montarDesertos(),
    viewBox: LIMITES.viewBox,
    contorno: CONTORNO_DO_BRASIL.d,
    rotuloContorno: CONTORNO_DO_BRASIL.rotulo,
  };
}
