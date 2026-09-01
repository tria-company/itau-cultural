import { Grafismo } from "@/componentes/grafismo";
import {
  Produtor,
  type EventoDoProdutor,
  type NumerosDosProdutores,
  type PessoaLigada,
  type ProdutorExibivel,
} from "@/componentes/produtor";
import { ocorrenciasDe, porSlug, slugsPorTipo, temporadasDe, vizinhos } from "@/dados/grafo";
import { rotaDaEntidade, vinculosDe, type GrupoVinculo } from "@/dados/ponte";
import type { Entidade } from "@/dados/tipos";
import { limitarSlugs } from "@/dados/limite-paginas";

/**
 * Página do produtor — APPX-05, `docs/telas.md` tela 24.
 *
 * Produtor cobre instituição e espaço: as duas atuam como quem realiza, e separá-las em
 * duas rotas obrigaria a tela chamadora a saber de qual classe o agente é antes de montar
 * o link. Reserva para classe vazia, como nas irmãs. Hoje não é emitido.
 *
 * TODA A TRAVESSIA ACONTECE AQUI, NO BUILD (D-47, DP-F). `produtor.tsx` recebe um DTO de
 * primitivos e não alcança `@/dados/grafo` nem transitivamente; e nada aqui varre array
 * cru — território, realização, linguagem e conteúdo editorial saem das funções públicas
 * de `grafo.ts` e dos grupos de `ponte.ts`.
 *
 * O TETO DE EXIBIÇÃO É DECLARADO, NÃO SILENCIOSO. São 359 páginas exportadas, e uma
 * instituição chega a dezenas de eventos realizados e a 21 pessoas a dois saltos.
 * Renderizar tudo engordaria 359 páginas de uma vez; cortar sem dizer faria a tela mentir
 * por omissão. Mostramos o teto e dizemos o total, que é o mesmo tratamento que
 * `BlocoPonte` dá desde a fase 2 (T-02-17).
 */

/** Reserva para classe vazia. Hoje não é emitida — 246 instituições + 113 espaços = 359. */
export function generateStaticParams() {
  const slugs = [...slugsPorTipo("instituicao"), ...slugsPorTipo("espaco")];
  const cortados = limitarSlugs(slugs);
  return (cortados.length ? cortados : ["sem-entidade"]).map((slug) => ({ slug }));
}

/** Teto de itens por bloco. O mesmo `LIMITE_PADRAO` que `ponte.ts` usa desde a fase 2. */
const LIMITE = 12;

// ---------------------------------------------------------------------------
// Travessia — escrita uma vez e usada pelas duas leituras: a página e os números
// ---------------------------------------------------------------------------

/**
 * Os eventos deste produtor, por DUAS arestas diferentes, que não são a mesma coisa e não
 * podem ser somadas em silêncio:
 *
 *   - `realiza` SAINDO daqui — 527 arestas, 127 instituições. Quem realiza é a instituição.
 *   - `situado_em` CHEGANDO aqui — 101 arestas, 87 espaços. O espaço não realiza: ele
 *     acolhe o que outros realizam, e no acervo carregado nenhum dos 113 espaços tem uma
 *     única aresta `realiza`.
 *
 * A tela nomeia as duas separadamente pela mesma razão que a ponte nomeia o papel: dizer
 * que um espaço «realiza» o que apenas acontece nele seria afirmar uma relação que o grafo
 * não tem.
 */
function eventosDoProdutor(id: string): { evento: Entidade; via: "realiza" | "acolhe" }[] {
  const vistos = new Set<string>();
  const saida: { evento: Entidade; via: "realiza" | "acolhe" }[] = [];

  for (const { aresta, entidade } of vizinhos(id, "realiza")) {
    if (aresta.de !== id || entidade.classe !== "evento" || vistos.has(entidade.id)) continue;
    vistos.add(entidade.id);
    saida.push({ evento: entidade, via: "realiza" });
  }
  for (const { aresta, entidade } of vizinhos(id, "situado_em")) {
    if (aresta.para !== id || entidade.classe !== "evento" || vistos.has(entidade.id)) continue;
    vistos.add(entidade.id);
    saida.push({ evento: entidade, via: "acolhe" });
  }

  saida.sort((a, b) => a.evento.titulo.localeCompare(b.evento.titulo, "pt-BR"));
  return saida;
}

/**
 * As pessoas a DOIS SALTOS. Produtor não tem aresta `atua_em` — nenhuma das 359 entradas
 * tem —, então gente só é alcançável atravessando os eventos. O papel vem da aresta
 * `atua_em`, e o evento do meio do caminho viaja junto: é ele que faz a linha ser um
 * vínculo nomeado em vez de um link solto (D-40, D-41).
 */
function pessoasLigadas(id: string): PessoaLigada[] {
  const vistas = new Map<string, PessoaLigada>();

  for (const { evento, via } of eventosDoProdutor(id)) {
    for (const { aresta, entidade } of vizinhos(evento.id, "atua_em")) {
      if (aresta.para !== evento.id) continue;
      if (entidade.classe !== "pessoa" && entidade.classe !== "coletivo") continue;
      if (vistas.has(entidade.id)) continue;
      vistas.set(entidade.id, {
        id: entidade.id,
        titulo: entidade.titulo,
        classe: entidade.classe,
        rota: rotaDaEntidade(entidade.classe, entidade.slug),
        papel: aresta.papel?.trim() || null,
        via,
        evento: evento.titulo,
        eventoRota: rotaDaEntidade("evento", evento.slug),
      });
    }
  }

  return [...vistas.values()].sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
}

function temTerritorio(id: string): boolean {
  return vizinhos(id, "situado_em").some(
    ({ aresta, entidade }) => aresta.de === id && entidade.classe === "territorio",
  );
}

function linguagensDe(id: string): number {
  return vizinhos(id, "pertence_a").filter(
    ({ aresta, entidade }) => aresta.de === id && entidade.classe === "linguagem",
  ).length;
}

function editorialQueApontaPara(id: string): number {
  let n = 0;
  for (const relacao of ["fala_sobre", "aprofunda", "contextualiza"] as const) {
    n += vizinhos(id, relacao).filter(({ aresta }) => aresta.para === id).length;
  }
  return n;
}

// ---------------------------------------------------------------------------
// Os denominadores — medidos uma vez por execução do build
// ---------------------------------------------------------------------------

/**
 * Os números que as frases de ausência declaram. **Medidos contra o grafo, nunca
 * digitados à mão**: uma frase que diz «246 dos 359» com um literal é uma afirmação que
 * envelhece em silêncio na primeira regeneração do acervo, e a tela passa a mentir sem
 * que nada quebre. Aqui ela quebra: se o acervo mudar, o número na tela muda junto.
 *
 * Memoizado no módulo — o cálculo é uma varredura dos 359 e as 359 páginas o pedem.
 */
let numerosMemo: NumerosDosProdutores | null = null;

function numerosDosProdutores(): NumerosDosProdutores {
  if (numerosMemo) return numerosMemo;

  const instituicoes = slugsPorTipo("instituicao");
  const espacos = slugsPorTipo("espaco");

  const numeros: NumerosDosProdutores = {
    total: instituicoes.length + espacos.length,
    instituicoes: instituicoes.length,
    espacos: espacos.length,
    comTerritorio: 0,
    comLinguagem: 0,
    comRealiza: 0,
    comAcolhe: 0,
    comPessoas: 0,
    comEditorial: 0,
    comEventoDatado: 0,
    comVerbete: 0,
    arestasRealiza: 0,
    arestasAcolhe: 0,
    arestasLinguagem: 0,
    arestasTerritorio: 0,
  };

  for (const slug of [...instituicoes, ...espacos]) {
    const entidade = porSlug("instituicao", slug) ?? porSlug("espaco", slug);
    if (!entidade) continue;

    const territorios = vizinhos(entidade.id, "situado_em").filter(
      ({ aresta, entidade: v }) => aresta.de === entidade.id && v.classe === "territorio",
    ).length;
    if (territorios) numeros.comTerritorio += 1;
    numeros.arestasTerritorio += territorios;

    const linguagens = linguagensDe(entidade.id);
    if (linguagens) numeros.comLinguagem += 1;
    numeros.arestasLinguagem += linguagens;

    const eventos = eventosDoProdutor(entidade.id);
    const realiza = eventos.filter((e) => e.via === "realiza").length;
    const acolhe = eventos.length - realiza;
    if (realiza) numeros.comRealiza += 1;
    if (acolhe) numeros.comAcolhe += 1;
    numeros.arestasRealiza += realiza;
    numeros.arestasAcolhe += acolhe;

    if (eventos.some(({ evento }) => ocorrenciasDe(evento.id).length > 0)) {
      numeros.comEventoDatado += 1;
    }
    if (pessoasLigadas(entidade.id).length) numeros.comPessoas += 1;
    if (editorialQueApontaPara(entidade.id)) numeros.comEditorial += 1;
    if (entidade.resumo?.trim()) numeros.comVerbete += 1;
  }

  numerosMemo = numeros;
  return numeros;
}

// ---------------------------------------------------------------------------

function indexar(grupos: GrupoVinculo[]): Map<string, GrupoVinculo> {
  return new Map(grupos.map((g) => [g.chave, g]));
}

/** A data que a temporada do evento declara, transcrita como a fonte a escreveu. */
function dataDeclaradaDe(eventoId: string): string | null {
  for (const temporada of temporadasDe(eventoId)) {
    const extra = temporada.extra as { dataDeclarada?: string | null } | undefined;
    if (extra?.dataDeclarada) return extra.dataDeclarada;
  }
  return null;
}

function paraEvento(evento: Entidade): EventoDoProdutor {
  return {
    id: evento.id,
    titulo: evento.titulo,
    rota: rotaDaEntidade("evento", evento.slug),
    datado: ocorrenciasDe(evento.id).length > 0,
    dataDeclarada: dataDeclaradaDe(evento.id),
  };
}

export default async function PaginaProdutor({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entidade = porSlug("instituicao", slug) ?? porSlug("espaco", slug);
  const numeros = numerosDosProdutores();

  // Entidade ausente não lança: sob `output: "export"` uma exceção aqui derrubaria o
  // build inteiro por causa de um slug, e nesta fase a ausência não é erro de programa.
  if (!entidade) {
    return (
      <div className="flex flex-col gap-5 p-5 desk:p-8">
        <header className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2">
            <Grafismo
              variacao="barra"
              className="h-5 w-auto shrink-0 text-acao-tinta"
            />
            <h1 className="text-2xl leading-tight font-bold desk:text-3xl">
              Página do produtor ou instituição
            </h1>
          </div>
          <p className="max-w-prose text-sm text-tinta-2">
            A rota existe e responde; nenhuma das {numeros.instituicoes} instituições nem
            dos {numeros.espacos} espaços do acervo corresponde a este endereço.
          </p>
        </header>
      </div>
    );
  }

  const grupos = indexar(vinculosDe(entidade.id));
  const territorio = grupos.get("onde");
  const editorial = ["fala-sobre", "aprofunda", "contextualiza"]
    .map((chave) => grupos.get(chave))
    .filter((g): g is GrupoVinculo => Boolean(g));

  const eventos = eventosDoProdutor(entidade.id);
  const realiza = eventos.filter((e) => e.via === "realiza");
  const acolhe = eventos.filter((e) => e.via === "acolhe");
  const pessoas = pessoasLigadas(entidade.id);

  const produtor: ProdutorExibivel = {
    id: entidade.id,
    slug: entidade.slug,
    titulo: entidade.titulo,
    classe: entidade.classe,
    procedencia: entidade.procedencia,
    resumo: entidade.resumo,
    fonte: entidade.fonte,
    imagem: entidade.imagem,
    creditoImagem: entidade.creditoImagem,
    linguagens: entidade.linguagens,
    territorio: territorio && territorio.total > 0 ? territorio : undefined,
    editorial,
    realiza: realiza.slice(0, LIMITE).map(({ evento }) => paraEvento(evento)),
    realizaTotal: realiza.length,
    acolhe: acolhe.slice(0, LIMITE).map(({ evento }) => paraEvento(evento)),
    acolheTotal: acolhe.length,
    pessoas: pessoas.slice(0, LIMITE),
    pessoasTotal: pessoas.length,
    datados: eventos.filter(({ evento }) => ocorrenciasDe(evento.id).length > 0).length,
  };

  return <Produtor produtor={produtor} numeros={numeros} />;
}
