import { DATA_DE_REFERENCIA, parDeDemonstracao } from "@/dados/alerta";
import { enquadramento } from "@/dados/cidade";
import { DISPOSICOES, PESO_NUNCA_VI, PESO_SURPRESA, disposicaoPorId } from "@/dados/disposicoes";
import { idParaParam } from "@/dados/explicacao";
import { PRECOMPUTO } from "@/dados/feeds";
import { FRASE_DO_CENARIO_5, montarVizinhancaDeSemelhanca, traduzir } from "@/dados/frase";
import { ocorrenciasDe, porSlug, slugsPorTipo, vizinhos } from "@/dados/grafo";
import { consultar, montarIndice } from "@/dados/indice";
import { PERSONAS, personaPorId } from "@/dados/personas";
import { trilhaCompletaPorSlug } from "@/dados/trilha";
import type { Entidade } from "@/dados/tipos";

/**
 * roteiro.ts — os cinco cenários do RFP como DADO, para a rota `/roteiro` (D-76, D-77,
 * STUD-03, STUD-04).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * O QUE ESTE MÓDULO É, E O QUE ELE DELIBERADAMENTE NÃO É
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Ele descreve o PERCURSO: qual tela vem depois de qual, com a rota literal de cada passo,
 * o que provar em cada uma, o que o acervo sustenta ali e o que ele não sustenta. Ele NÃO
 * reproduz o conteúdo das telas — quem mostra o grupo de duplicatas é `/studio/duplicatas/`,
 * quem mostra a trilha é `/trilha/…`. O roteiro conduz até elas. É o app com um guia, não
 * um slide (D-76).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * OS NÚMEROS SÃO DERIVADOS DO GRAFO SEMPRE QUE PODEM SER (D-77)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * A declaração do que o acervo NÃO sustenta é o argumento da proposta, e um número digitado
 * à mão nela é a forma mais fácil de a tela parecer honesta sem ser: na primeira regeração
 * do grafo ela passaria a afirmar em voz alta, na frente da banca, um número que o acervo
 * não sustenta mais. Por isso `NUMEROS` inteiro sai de `grafo.ts` e dos módulos das fases
 * 1–3, no build.
 *
 * ONDE O NÚMERO NÃO PODE SER DERIVADO AQUI. Os do Cenário 3 vêm de `duplicatas.ts` e os do
 * Cenário 4 de `ocorrencias-studio.ts`, e esses dois módulos estão sendo escritos na MESMA
 * onda que este arquivo. Importá-los faria deles dependência de build deste plano e
 * serializaria três executores que são disjuntos por construção. A saída é `CONSTANTES_DA_ONDA`:
 * constante medida com o arquivo de origem NOMEADO ao lado, nunca número solto. O plano
 * 04-05 confere que os dois lados batem. **Acoplar no build, desacoplar na verificação.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A SEMEADURA VEM DA FONTE, E QUEBRA ALTO (T-04-20)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Persona sai de `personas.ts`, disposição sai de `DISPOSICOES`, e as duas sessões do
 * Cenário 4 saem de `parDeDemonstracao()` em `alerta.ts`. Nenhuma delas é string digitada
 * aqui. Se alguma deixar de casar, `romper()` derruba o BUILD com o nome do que refazer —
 * em vez de o roteiro abrir, ao vivo, com a persona errada e ninguém entender por quê.
 *
 * DP-F: este módulo alcança `grafo.ts` (23 MB de JSON) e roda no BUILD. Nenhum arquivo
 * `"use client"` pode importá-lo por valor — só `import type`. A página de servidor monta o
 * DTO, que é só primitivo, e o gate transitivo da fase 3 mede isso.
 */

// ---------------------------------------------------------------------------
// Falha alta e nomeada — o mesmo molde de `alerta.ts`
// ---------------------------------------------------------------------------

/**
 * Quantos cenários vêm do RFP, e quantos são nossos.
 *
 * OS CINCO DO RFP SÃO EXIGÊNCIA DO CLIENTE, e o número é fixo: um sexto entrando naquele
 * grupo seria um cenário inventado passando por pedido da banca. O sexto é NOSSO — ele
 * responde a pergunta que vem depois dos cinco, sobre quem alimenta a plataforma —, e por
 * isso é contado à parte.
 *
 * As duas constantes existem separadas para a guarda poder dizer QUAL grupo divergiu. Um
 * total só («seis») deixaria de acusar o caso que importa: cinco viraram quatro e alguém
 * acrescentou dois nossos para fechar a conta.
 */
const CENARIOS_DO_RFP = 5;
const CENARIOS_NOSSOS = 1;

function romper(detalhe: string): never {
  throw new Error(
    `roteiro.ts: ${detalhe}. O roteiro é o percurso que a banca vai percorrer; ele quebra ` +
      `alto em vez de abrir com o estado errado. Refaça a constante em src/dados/roteiro.ts.`,
  );
}

/** Milhar com ponto, à mão. `toLocaleString` divergiria entre o build e o navegador. */
export function milhar(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// ---------------------------------------------------------------------------
// Os números, medidos sobre o grafo no build
// ---------------------------------------------------------------------------

export interface NumerosDoRoteiro {
  /** Eventos do acervo. */
  eventos: number;
  /** Sessões datadas. */
  ocorrencias: number;
  /** Delas, quantas declaram espaço. */
  ocorrenciasComEspaco: number;
  /** Eventos que declaram ingresso — `gratuito: false` em alguma sessão. */
  eventosComIngressoDeclarado: number;
  /** Eventos cuja chave de identidade traz o componente do agente realizador. */
  eventosComAgenteNaChave: number;
  /** Eventos cuja chave de identidade traz o componente da obra. */
  eventosComObraNaChave: number;
  /** Eventos com ao menos uma sessão a partir de `DATA_DE_REFERENCIA`. */
  eventosComSessaoFutura: number;
  /** Eventos situados em algum território. */
  eventosComTerritorio: number;
  /** Eventos com as DUAS coisas ao mesmo tempo. É o número do Cenário 2. */
  eventosComFuturaETerritorio: number;
  /** Arestas `duplicata_suspeita` autoradas no grafo. */
  arestasDeDuplicataSuspeita: number;
  passosDaTrilha: number;
  /** Das ligações da trilha do Cenário 1, quantas são `autorado`. */
  ligacoesAutoradasDaTrilha: number;
  /** Arestas `semelhante_a` que saem das âncoras de «Bienal». */
  arestasDeSemelhancaDaBienal: number;
  ancorasDeBienal: number;
  /** Vizinhos de semelhança que a busca POR TEXTO alcança. */
  semelhancasAlcancaveis: number;
  /** Os que ela não alcança. É o número do Cenário 5. */
  semelhancasForaDoAlcance: number;
  /** Registros do acervo de Belém, e quantos trazem a data que a fonte escreveu. */
  acervoDeBelem: number;
  acervoDeBelemComData: number;
  /** Sessões futuras do evento do par do Cenário 4. */
  sessoesFuturasDoPar: number;
  dataDeReferencia: string;
}

const TERRITORIO_DO_CENARIO_2 = "territorio:derivado:belem-para";
const TRILHA_DO_CENARIO_1 = "do-rap-ao-teatro-documentario";

/**
 * Os 300 eventos, resolvidos por slug.
 *
 * Mesma porta que `duplicatas.ts` usa, e pelo mesmo motivo: `grafo.ts` não expõe «todas as
 * entidades» de propósito (D-16, D-47), e `slugsPorTipo` + `porSlug` é a saída que ele abre
 * para a pergunta que é genuinamente sobre o conjunto inteiro de uma classe.
 */
function eventos(): Entidade[] {
  const lista: Entidade[] = [];
  for (const slug of slugsPorTipo("evento")) {
    const e = porSlug("evento", slug);
    if (e) lista.push(e);
  }
  return lista.sort((a, b) => a.id.localeCompare(b.id));
}

let numerosMemo: NumerosDoRoteiro | null = null;

export function numerosDoRoteiro(): NumerosDoRoteiro {
  if (numerosMemo) return numerosMemo;

  const lista = eventos();
  if (lista.length === 0) romper("o grafo não devolveu nenhum evento");

  let ocorrencias = 0;
  let ocorrenciasComEspaco = 0;
  let eventosComIngressoDeclarado = 0;
  let eventosComAgenteNaChave = 0;
  let eventosComObraNaChave = 0;
  let eventosComSessaoFutura = 0;
  let eventosComTerritorio = 0;
  let eventosComFuturaETerritorio = 0;
  let arestasDeDuplicataSuspeita = 0;

  for (const evento of lista) {
    const sessoes = ocorrenciasDe(evento.id);
    ocorrencias += sessoes.length;

    let declaraIngresso = false;
    let temFutura = false;
    for (const sessao of sessoes) {
      if (sessao.espacoId) ocorrenciasComEspaco += 1;
      if (sessao.gratuito === false) declaraIngresso = true;
      if (sessao.inicio.slice(0, 10) >= DATA_DE_REFERENCIA) temFutura = true;
    }
    if (declaraIngresso) eventosComIngressoDeclarado += 1;

    // D-22: a chave é `evento|<título normalizado>|<agente>|<obra>`. Os dois últimos
    // componentes são o critério de identidade da ontologia, e o acervo não os traz.
    const componentes = (evento.chaveIdentidade ?? "").split("|");
    if (componentes[2]?.trim()) eventosComAgenteNaChave += 1;
    if (componentes[3]?.trim()) eventosComObraNaChave += 1;

    const territorios = vizinhos(evento.id, "situado_em").filter((v) => v.aresta.de === evento.id);
    if (territorios.length) eventosComTerritorio += 1;
    if (temFutura) eventosComSessaoFutura += 1;
    if (temFutura && territorios.length) eventosComFuturaETerritorio += 1;

    arestasDeDuplicataSuspeita += vizinhos(evento.id, "duplicata_suspeita").filter(
      (v) => v.aresta.de === evento.id,
    ).length;
  }

  const trilha = trilhaCompletaPorSlug(TRILHA_DO_CENARIO_1);
  if (!trilha) romper(`a trilha «${TRILHA_DO_CENARIO_1}» do cenário 1 não existe mais no acervo`);

  const indice = montarIndice({ slugsPorTipo, porSlug, vizinhos });
  const traducao = traduzir(FRASE_DO_CENARIO_5, indice);
  const semelhanca = traducao.criterios.find((c) => c.regra === "semelhanca");
  if (!semelhanca) {
    romper(
      `a frase do cenário 5 («${FRASE_DO_CENARIO_5}») deixou de acionar a regra de ` +
        `semelhança, e sem ela o número de arestas fora de alcance não existe`,
    );
  }
  const vizinhanca = montarVizinhancaDeSemelhanca(
    { slugsPorTipo, porSlug, vizinhos },
    semelhanca.valor,
    indice,
  );

  const belem = enquadramento(TERRITORIO_DO_CENARIO_2);
  const par = parDeDemonstracao();

  numerosMemo = {
    eventos: lista.length,
    ocorrencias,
    ocorrenciasComEspaco,
    eventosComIngressoDeclarado,
    eventosComAgenteNaChave,
    eventosComObraNaChave,
    eventosComSessaoFutura,
    eventosComTerritorio,
    eventosComFuturaETerritorio,
    arestasDeDuplicataSuspeita,
    passosDaTrilha: trilha.passos.length,
    ligacoesAutoradasDaTrilha: trilha.ligacoesAutoradas,
    arestasDeSemelhancaDaBienal: vizinhanca.arestas,
    ancorasDeBienal: vizinhanca.ancoras,
    semelhancasAlcancaveis: vizinhanca.alcancaveis,
    semelhancasForaDoAlcance: vizinhanca.foraDoAlcance,
    acervoDeBelem: belem.total,
    acervoDeBelemComData: belem.comData,
    sessoesFuturasDoPar: par.sessoesFuturasDoEvento,
    dataDeReferencia: DATA_DE_REFERENCIA,
  };
  return numerosMemo;
}

// ---------------------------------------------------------------------------
// As constantes da onda — medidas, com o arquivo de origem NOMEADO
// ---------------------------------------------------------------------------

export interface ConstanteDaOnda {
  chave: string;
  valor: number;
  /** Como o número é escrito na tela. `0.65` não é `0,65`, e a tela fala português. */
  texto: string;
  /** O arquivo e a função que calculam este número. 04-05 confere contra eles. */
  origem: string;
}

/**
 * Os números dos Cenários 3 e 4 que este módulo NÃO deriva.
 *
 * Cada um é medição registrada em `04-01-SUMMARY.md`, com o arquivo que a calcula nomeado
 * ao lado. Este plano não importa `duplicatas.ts` nem `ocorrencias-studio.ts` de propósito:
 * eles estão sendo escritos na mesma onda, e um `import` os tornaria dependência de build
 * daqui. 04-05 confere que estes valores batem com o que aqueles módulos calculam.
 */
export const CONSTANTES_DA_ONDA: readonly ConstanteDaOnda[] = [
  {
    chave: "gruposPorChave",
    valor: 33,
    texto: "33",
    origem: "src/dados/duplicatas.ts · numerosDaDeduplicacao().gruposPorChave",
  },
  {
    chave: "gruposPorChaveEncenados",
    valor: 27,
    texto: "27",
    origem: "src/dados/duplicatas.ts · numerosDaDeduplicacao().gruposPorChaveEncenados",
  },
  {
    chave: "gruposPorChaveDoAcervo",
    valor: 6,
    texto: "6",
    origem: "src/dados/duplicatas.ts · numerosDaDeduplicacao().gruposPorChaveDoAcervo",
  },
  {
    chave: "paresProbabilisticos",
    valor: 51,
    texto: "51",
    origem: "src/dados/duplicatas.ts · numerosDaDeduplicacao().paresProbabilisticos",
  },
  {
    chave: "paresProbabilisticosNaoEncenados",
    valor: 38,
    texto: "38",
    origem: "src/dados/duplicatas.ts · numerosDaDeduplicacao().paresProbabilisticosNaoEncenados",
  },
  {
    chave: "limiarProbabilistico",
    valor: 0.65,
    texto: "0,65",
    origem: "src/dados/duplicatas.ts · LIMIAR_PROBABILISTICO",
  },
  {
    chave: "registrosEncenados",
    valor: 80,
    texto: "80",
    origem: "src/dados/duplicatas.ts · numerosDaDeduplicacao().registrosEncenados",
  },
  {
    chave: "ocorrenciasEncenadas",
    valor: 1304,
    texto: "1.304",
    origem: "src/dados/duplicatas.ts · numerosDaDeduplicacao().ocorrenciasEncenadas",
  },
];

const PORCHAVE = new Map(CONSTANTES_DA_ONDA.map((c) => [c.chave, c]));

function daOnda(chave: string): string {
  const constante = PORCHAVE.get(chave);
  if (!constante) romper(`a constante da onda «${chave}» não está declarada`);
  return constante.texto;
}

// ---------------------------------------------------------------------------
// DTO — só primitivo atravessa a fronteira
// ---------------------------------------------------------------------------

export type VisaoDoCenario = "mobile" | "web";

/** Como se chega a este passo quando o clique falha. */
export type ComoChegar = "digitando" | "pelo-botao";

export interface PassoDoRoteiro {
  ordem: number;
  /** A tela, pelo nome que quem apresenta usa em voz alta. */
  tela: string;
  /** A rota LITERAL. É o contrato: o botão é conveniência, isto aqui é o caminho. */
  rota: string;
  comoChegar: ComoChegar;
  /** O que provar NESTA tela. Uma frase, no imperativo do que se aponta. */
  provar: string;
}

export interface SemeaduraDoCenario {
  visao: VisaoDoCenario;
  personaId: string | null;
  personaNome: string | null;
  /** Ids de disposição. `null` quando o cenário não mexe nas disposições. */
  disposicoes: string[] | null;
  disposicoesRotulos: string[];
  /** Ids de ocorrência a deixar salvos. Só o Cenário 4 usa. */
  ocorrenciasSalvas: string[];
  /** A linha que a tela mostra ANTES do clique: o que exatamente vai mudar. */
  descricao: string;
}

export interface LimiteDoAcervo {
  /** O texto que vai ser lido em voz alta. Produto, nunca comentário. */
  texto: string;
  /** Os números medidos que ele cita, para a tela poder destacá-los. */
  numeros: string[];
  /** De onde cada número veio — derivação do grafo ou constante da onda. */
  origem: string;
}

export interface Cenario {
  numero: number;
  titulo: string;
  /** A pergunta do RFP que este cenário responde. */
  pergunta: string;
  visao: VisaoDoCenario;
  visaoRotulo: string;
  passos: PassoDoRoteiro[];
  /** O que o acervo sustenta, em frases curtas com número. */
  sustenta: string[];
  naoSustenta: LimiteDoAcervo;
  semeadura: SemeaduraDoCenario;
}

export interface RoteiroDTO {
  total: number;
  cenarios: Cenario[];
  numeros: NumerosDoRoteiro;
  constantesDaOnda: readonly ConstanteDaOnda[];
  /** A linha de fecho: os cinco se resolvem com o mesmo núcleo. */
  fecho: string;
  /** O limite do próprio roteiro. Ele não é slide e não substitui as telas. */
  limiteDoRoteiro: string;
}

// ---------------------------------------------------------------------------
// A semeadura, resolvida contra a fonte
// ---------------------------------------------------------------------------

/** Confere o id contra `personas.ts` e devolve o nome. Id que não casa derruba o build. */
function persona(id: string): { id: string; nome: string } {
  const encontrada = personaPorId(id);
  if (!encontrada) {
    romper(
      `a persona «${id}» não existe em src/dados/personas.ts (as que existem: ` +
        `${PERSONAS.map((p) => p.id).join(", ")}). Sem ela o cenário abriria com a ` +
        `persona errada na frente da banca — personaIdValido cairia na primeira em silêncio`,
    );
  }
  return { id: encontrada.id, nome: encontrada.nome };
}

/** Confere cada disposição contra `DISPOSICOES` e devolve os rótulos. */
function disposicoes(ids: string[]): { ids: string[]; rotulos: string[] } {
  const rotulos = ids.map((id) => {
    const d = disposicaoPorId(id);
    if (!d) {
      romper(
        `a disposição «${id}» não existe em src/dados/disposicoes.ts (as que existem: ` +
          `${DISPOSICOES.map((x) => x.id).join(", ")})`,
      );
    }
    return d.rotulo;
  });
  return { ids, rotulos };
}

/**
 * O primeiro cartão do feed de Maria com as disposições que o Cenário 1 semeia.
 *
 * É o MESMO precômputo que `/descobrir` renderiza e que `generateStaticParams` da rota de
 * explicação enumera — recalcular com outra chamada deixaria a rota escrita no roteiro
 * divergir do que o feed produz, e link morto ao vivo é pior do que passo a menos.
 */
function cartaoDeAbertura(personaId: string, ids: string[]): { param: string; titulo: string } {
  const ordem = PRECOMPUTO.ordemDisposicoes;
  let mascara = 0;
  for (const id of ids) {
    const i = ordem.indexOf(id);
    if (i < 0) romper(`a disposição «${id}» não está na ordem canônica do precômputo de feeds`);
    mascara |= 1 << i;
  }
  const combinacao = PRECOMPUTO.porPersona[personaId]?.[mascara];
  if (!combinacao) romper(`o precômputo não tem a combinação ${mascara} da persona «${personaId}»`);
  const cartao = PRECOMPUTO.listas[combinacao.lista]?.[0];
  if (!cartao) {
    romper(
      `o feed de «${personaId}» com ${ids.join(" + ")} devolveu lista vazia, e o cenário 1 ` +
        `depende de um cartão para a tela de explicação existir`,
    );
  }
  return { param: idParaParam(cartao), titulo: cartao.titulo };
}

/**
 * O evento em que a trilha do Cenário 1 TERMINA, com a rota que a própria trilha escreve.
 *
 * Derivado e não digitado pelo mesmo motivo que todo o resto: a trilha termina numa
 * montagem real e datada, e escrever o slug à mão aqui deixaria o roteiro apontar para um
 * evento que a trilha não leva mais — link morto na frente da banca, no último passo do
 * primeiro cenário.
 */
function destinoDaTrilha(): { rota: string; titulo: string } {
  const trilha = trilhaCompletaPorSlug(TRILHA_DO_CENARIO_1);
  if (!trilha) romper(`a trilha «${TRILHA_DO_CENARIO_1}» do cenário 1 não existe mais no acervo`);
  const final = trilha.passos[trilha.passos.length - 1]?.final;
  if (!final?.evento?.rota) {
    romper(
      `a trilha «${TRILHA_DO_CENARIO_1}» deixou de terminar num evento com rota, e o cenário 1 ` +
        `promete que ela termina numa montagem real e datada`,
    );
  }
  return { rota: final.evento.rota, titulo: final.evento.titulo };
}

/** O primeiro evento que a busca do Cenário 5 devolve. A ficha que a demonstração abre. */
function eventoDoCenario5(): { slug: string; titulo: string } {
  const indice = montarIndice({ slugsPorTipo, porSlug, vizinhos });
  const traducao = traduzir(FRASE_DO_CENARIO_5, indice);
  const resposta = consultar({ criterios: traducao.criterios, limite: 60 }, indice);
  const evento = resposta.resultados.find((r) => r.classe === "evento");
  if (!evento) {
    romper(
      `a busca por «${FRASE_DO_CENARIO_5}» não devolveu nenhum evento, e o cenário 5 abre ` +
        `uma ficha de evento no segundo passo`,
    );
  }
  return { slug: evento.slug, titulo: evento.titulo };
}

/**
 * A gramática da lente do mapa, COM A BARRA FINAL.
 *
 * `trailingSlash: true` normaliza `/mapa#…` para `/mapa/#…`, e a forma sem barra redireciona
 * ANTES de o fragmento ser lido — o recorte se perde e o mapa abre sem lente. Escrever a
 * forma com barra no roteiro é o que faz quem apresenta digitar a que funciona.
 */
const LENTE_DO_MAPA = "/mapa/#r=<chaves separadas por ~>&t=<título do recorte>&v=<rota de volta>";

// ---------------------------------------------------------------------------
// Os cinco cenários
// ---------------------------------------------------------------------------

let roteiroMemo: RoteiroDTO | null = null;

export function montarRoteiro(): RoteiroDTO {
  if (roteiroMemo) return roteiroMemo;

  const n = numerosDoRoteiro();

  const maria = persona("pessoa-usuaria:autorado:maria");
  const carlos = persona("pessoa-usuaria:autorado:carlos");
  const joana = persona("pessoa-usuaria:autorado:joana");

  const disposicoesDeMaria = disposicoes([PESO_NUNCA_VI, PESO_SURPRESA]);
  const abertura = cartaoDeAbertura(maria.id, disposicoesDeMaria.ids);
  const destino = destinoDaTrilha();
  const evento5 = eventoDoCenario5();
  const par = parDeDemonstracao();

  const cenarios: Cenario[] = [
    // -----------------------------------------------------------------------
    {
      numero: 1,
      titulo: "Maria, 27 anos, nunca foi ao teatro",
      pergunta:
        "Como levar alguém do que ela já ama até uma linguagem que ela nunca experimentou, " +
        "sem pedir que ela declare um gosto que ainda não tem?",
      visao: "mobile",
      visaoRotulo: "visão app",
      passos: [
        {
          ordem: 1,
          tela: "Onboarding — disposição",
          rota: "/onboarding/1/",
          comoChegar: "digitando",
          provar:
            "a entrada é por DISPOSIÇÃO e não por categoria: a pergunta é «o que te move hoje?», " +
            "seleção múltipla e sem obrigatoriedade, e cada cartão diz qual campo do acervo ele lê.",
        },
        {
          ordem: 2,
          tela: "Descobrir",
          rota: "/descobrir/",
          comoChegar: "digitando",
          provar:
            "o feed é caminhada no acervo e não popularidade: cada cartão traz o motivo que o " +
            "trouxe e quantos saltos foram precisos, não uma posição em ranking.",
        },
        {
          ordem: 3,
          tela: "Por que isto apareceu",
          rota: `/descobrir/porque/${abertura.param}/`,
          comoChegar: "digitando",
          provar:
            `a explicação mostra as ARESTAS que levaram até «${abertura.titulo}» — é rota e não ` +
            `modal, então sobrevive ao botão de voltar e pode ser compartilhada.`,
        },
        {
          ordem: 4,
          tela: "Trilha — do rap ao teatro documentário",
          rota: `/trilha/${TRILHA_DO_CENARIO_1}/`,
          comoChegar: "digitando",
          provar:
            `os ${n.passosDaTrilha} passos aparecem com a relação de cada ligação e a procedência ` +
            `dela ao lado; as ${n.ligacoesAutoradasDaTrilha} autoradas estão rotuladas «autorado» na tela.`,
        },
        {
          ordem: 5,
          tela: `Ficha do evento — ${destino.titulo}`,
          rota: destino.rota,
          comoChegar: "digitando",
          provar:
            "a trilha termina numa montagem REAL e datada do acervo, com sessão, não numa " +
            "categoria abstrata — é aí que a caminhada vira convite.",
        },
      ],
      sustenta: [
        `A caminhada é determinística e auditável: ${n.passosDaTrilha} passos, cada um com a relação e o motivo escrito.`,
        "A explicação de cada cartão é a mesma travessia que o produziu, não uma reconstrução posterior.",
        "O destino é evento real do acervo do Itaú Cultural, com sessão datada.",
      ],
      naoSustenta: {
        texto:
          `A cadeia rap → poesia falada → teatro documentário se apoia em ` +
          `${n.ligacoesAutoradasDaTrilha} ligações AUTORADAS, e não em ligação da fonte. ` +
          `Rap está classificado em Música e Slam em Literatura, e nada no acervo liga as duas: ` +
          `a ponte é nossa. Ela está rotulada «autorado» na tela da trilha, passo a passo — ` +
          `não escondemos a ponte, mostramos de quem ela é.`,
        numeros: [String(n.ligacoesAutoradasDaTrilha)],
        origem: "derivado do acervo · trilhaCompletaPorSlug().ligacoesAutoradas",
      },
      semeadura: {
        visao: "mobile",
        personaId: maria.id,
        personaNome: maria.nome,
        disposicoes: disposicoesDeMaria.ids,
        disposicoesRotulos: disposicoesDeMaria.rotulos,
        ocorrenciasSalvas: [],
        descricao:
          `Põe a visão app, ativa a persona ${maria.nome} e marca as disposições ` +
          `«${disposicoesDeMaria.rotulos.join("» e «")}». Nada é salvo.`,
      },
    },

    // -----------------------------------------------------------------------
    {
      numero: 2,
      titulo: "Carlos, 4 dias em Belém",
      pergunta:
        "O que um visitante com quatro dias deveria conhecer de um território que ele nunca visitou?",
      visao: "mobile",
      visaoRotulo: "visão app",
      passos: [
        {
          ordem: 1,
          tela: "Modo Cidade — Belém",
          rota: "/cidade/belem-para/",
          comoChegar: "digitando",
          provar:
            `o roteiro por dia equilibra deslocamento e densidade e prioriza o que é PRÓPRIO do ` +
            `território; a frase de enquadramento abre a tela dizendo qual pergunta ela responde.`,
        },
        {
          ordem: 2,
          tela: "Mapa como lente",
          rota: LENTE_DO_MAPA,
          comoChegar: "pelo-botao",
          provar:
            "o mapa é LENTE sobre um resultado que já está em tela — nunca home, nunca ponto de " +
            "partida — e a volta preserva o recorte, porque ele viaja no fragmento e não em query.",
        },
      ],
      sustenta: [
        `Belém tem ${n.acervoDeBelem} registros no acervo, e ${n.acervoDeBelemComData} trazem a data que a fonte escreveu.`,
        "A ancoragem geográfica declara o método de cada ponto: coordenada própria ou centroide do município.",
        "O roteiro é reordenável, e a troca de um item mostra qual alternativa entrou no lugar.",
      ],
      naoSustenta: {
        texto:
          `NENHUM evento do acervo tem data futura e território ao mesmo tempo: ` +
          `${n.eventosComSessaoFutura} eventos têm sessão a partir de ${n.dataDeReferencia} e ` +
          `${n.eventosComTerritorio} estão situados em algum lugar, mas a interseção é ` +
          `${n.eventosComFuturaETerritorio}. Os eventos do CMS têm data de 2026 e zero território; ` +
          `os da Enciclopédia têm território real e data histórica. Por isso Modo Cidade responde ` +
          `O QUE EXISTE NO TERRITÓRIO, e não o que está em cartaz esta semana — e nós não ` +
          `fabricamos data para tapar o buraco. Programação futura é exatamente o que chega ` +
          `quando os produtores publicarem no Studio, que é a tela do cenário 4.`,
        numeros: [
          String(n.eventosComFuturaETerritorio),
          String(n.eventosComSessaoFutura),
          String(n.eventosComTerritorio),
        ],
        origem: "derivado do acervo · ocorrenciasDe() + vizinhos(situado_em) sobre os 300 eventos",
      },
      semeadura: {
        visao: "mobile",
        personaId: carlos.id,
        personaNome: carlos.nome,
        disposicoes: [],
        disposicoesRotulos: [],
        ocorrenciasSalvas: [],
        descricao: `Põe a visão app, ativa a persona ${carlos.nome} e limpa as disposições. Nada é salvo.`,
      },
    },

    // -----------------------------------------------------------------------
    {
      numero: 3,
      titulo: "Uma instituição publica milhares de eventos duplicados",
      pergunta: "Como a plataforma resolve isso sem apagar acervo por engano?",
      visao: "web",
      visaoRotulo: "visão web",
      passos: [
        {
          ordem: 1,
          tela: "Studio — resolução de duplicatas",
          rota: "/studio/duplicatas/",
          comoChegar: "digitando",
          provar:
            "o critério de identidade da ontologia está ESCRITO na tela, com os três componentes " +
            "marcados um a um; cada grupo diz em qual estágio foi pego, com o score no " +
            "probabilístico; os registros aparecem lado a lado com os campos divergentes " +
            "destacados; e nenhuma fusão acontece sem um humano.",
        },
      ],
      sustenta: [
        `O estágio determinístico agrupa por chave de identidade e devolve ${daOnda("gruposPorChave")} grupos.`,
        `O estágio probabilístico devolve ${daOnda("paresProbabilisticos")} pares acima do limiar ${daOnda("limiarProbabilistico")}, cada um com o score na tela.`,
        `${daOnda("gruposPorChaveDoAcervo")} desses grupos são duplicata REAL do acervo do Itaú Cultural — o critério achou sozinho o que ninguém plantou.`,
        "Toda decisão é humana e reversível, e o falso positivo fica na tela como contraexemplo.",
      ],
      naoSustenta: {
        texto:
          `O critério da ontologia tem três componentes — título normalizado, agente realizador e ` +
          `obra — e o acervo sustenta UM. Dos ${n.eventos} eventos, ` +
          `${n.eventosComAgenteNaChave} trazem agente na chave e ${n.eventosComObraNaChave} trazem ` +
          `obra: toda chave é «evento|<título>||». O que casou foi o título sozinho, e é ` +
          `exatamente por isso que existe um segundo estágio probabilístico e um desfecho humano ` +
          `em vez de fusão automática. Além disso, ${daOnda("gruposPorChaveEncenados")} dos ` +
          `${daOnda("gruposPorChave")} grupos são ENCENADOS: ` +
          `${n.arestasDeDuplicataSuspeita} ligações autoradas clonaram eventos reais com variação ` +
          `controlada, e estão marcadas «autorado». Os outros ${daOnda("gruposPorChaveDoAcervo")} o ` +
          `critério encontrou sozinho.`,
        numeros: [
          String(n.eventosComAgenteNaChave),
          String(n.eventos),
          daOnda("gruposPorChaveEncenados"),
          String(n.arestasDeDuplicataSuspeita),
        ],
        origem:
          "chave e arestas derivadas do acervo · grupos e pares de src/dados/duplicatas.ts (constante medida)",
      },
      semeadura: {
        visao: "web",
        personaId: null,
        personaNome: null,
        disposicoes: null,
        disposicoesRotulos: [],
        ocorrenciasSalvas: [],
        descricao:
          "Põe a visão web e não semeia mais nada: a fila de duplicatas é dado de build, " +
          "igual em qualquer navegador.",
      },
    },

    // -----------------------------------------------------------------------
    {
      numero: 4,
      titulo: "Um evento muda de horário duas horas antes",
      pergunta: "Quem precisa saber, e como a plataforma garante que só essa sessão foi tocada?",
      visao: "web",
      visaoRotulo: "Studio em web, Salvos em app",
      passos: [
        {
          ordem: 1,
          tela: "Studio — ocorrências",
          rota: "/studio/ocorrencias/",
          comoChegar: "digitando",
          provar:
            `a alteração atinge UMA ocorrência e não o evento: das ${n.sessoesFuturasDoPar} sessões ` +
            `futuras de «${par.eventoTitulo}», só a de ${par.atingida.dataCurta} muda. A prévia diz ` +
            `quantas pessoas serão avisadas ANTES de confirmar.`,
        },
        {
          ordem: 2,
          tela: "Salvos",
          rota: "/salvos/",
          comoChegar: "digitando",
          provar:
            `o alerta aparece na linha de ${par.atingida.dataCurta} e NÃO na irmã de ` +
            `${par.intacta.dataCurta}, que é do mesmo evento — é a prova de que a sessão é a ` +
            `unidade, e não o evento.`,
        },
      ],
      sustenta: [
        "A ocorrência é entidade de primeira classe: sessão tem id, data, hora e alteração próprias.",
        `As duas sessões do par são reais do acervo (${par.atingida.id} e ${par.intacta.id}), não inventadas.`,
        "A prévia conta as pessoas atingidas antes da confirmação, e a alteração fica registrada com procedência.",
      ],
      naoSustenta: {
        texto:
          `Nenhuma das ${milhar(n.ocorrencias)} ocorrências do acervo declara ESPAÇO — são ` +
          `${n.ocorrenciasComEspaco} de ${milhar(n.ocorrencias)} —, então «onde» não é um campo que ` +
          `possamos mostrar por sessão. E ${n.eventosComIngressoDeclarado} dos ${n.eventos} eventos ` +
          `declaram ingresso, então gratuidade não recorta nada: tudo consta como gratuito porque ` +
          `a fonte só tem o booleano. Por fim, nenhum sistema do Itaú Cultural publica histórico de ` +
          `alteração de sessão — a mudança de horário deste cenário é AUTORADA e está rotulada como ` +
          `tal. É exatamente a lacuna que a plataforma existe para fechar.`,
        numeros: [
          String(n.ocorrenciasComEspaco),
          milhar(n.ocorrencias),
          String(n.eventosComIngressoDeclarado),
          String(n.eventos),
        ],
        origem: "derivado do acervo · ocorrenciasDe() sobre os 300 eventos",
      },
      semeadura: {
        visao: "web",
        personaId: joana.id,
        personaNome: joana.nome,
        disposicoes: [],
        disposicoesRotulos: [],
        ocorrenciasSalvas: [par.atingida.id, par.intacta.id],
        descricao:
          `Põe a visão web, ativa a persona ${joana.nome} e deixa SALVAS as duas sessões do par ` +
          `— ${par.atingida.dataCurta} e ${par.intacta.dataCurta}, do mesmo evento —, para o ` +
          `alerta ter onde chegar quando a demonstração abrir Salvos.`,
      },
    },

    // -----------------------------------------------------------------------
    {
      numero: 5,
      titulo: "«Quero algo parecido com a Bienal, gratuito e perto de mim»",
      pergunta: "A plataforma entende uma frase inteira sem virar chatbot?",
      visao: "mobile",
      visaoRotulo: "visão app",
      passos: [
        {
          ordem: 1,
          tela: "Buscar por frase",
          rota: "/buscar/frase/",
          comoChegar: "digitando",
          provar:
            "a frase vira consulta ESTRUTURADA com a tradução visível: cada critério mostra o " +
            "trecho literal da frase que o produziu, e sai num toque. As palavras que nenhuma " +
            "regra leu ficam declaradas, não escondidas.",
        },
        {
          ordem: 2,
          tela: "Ficha do evento",
          rota: `/evento/${evento5.slug}/`,
          comoChegar: "digitando",
          provar:
            "cada ficha mostra POR QUE casou, e de onde veio o motivo: escrito no acervo ou " +
            "composto por nós. Não há texto genérico de reserva.",
        },
        {
          ordem: 3,
          tela: "Mapa como lente",
          rota: LENTE_DO_MAPA,
          comoChegar: "pelo-botao",
          provar:
            "o recorte da busca atravessa para o mapa no fragmento, e a volta traz a consulta " +
            "inteira de novo — a lente não perde o que estava em tela.",
        },
      ],
      sustenta: [
        "A tradução é regra declarada, determinística e editável — não é modelo, e a tela declara a ausência de modelo.",
        `A âncora «Bienal» resolve em ${n.ancorasDeBienal} entradas do índice, e cada resultado carrega o motivo escrito da aresta quando existe.`,
        "Quando um critério recorta demais, a tela oferece o afrouxamento com o número de resultados que ele traria.",
      ],
      naoSustenta: {
        texto:
          `«Parecido com» casa por TEXTO, e não por travessia de aresta. Das ` +
          `${n.arestasDeSemelhancaDaBienal} ligações «semelhante_a» que saem das entidades de ` +
          `Bienal, a busca alcança ${n.semelhancasAlcancaveis} vizinhos e ` +
          `${n.semelhancasForaDoAlcance} ficam FORA DE ALCANCE — o índice de busca não tem campo ` +
          `de vizinhança, então o resultado é sempre um subconjunto do que casa por título. A tela ` +
          `declara esse número em vez de esconder o recorte, e é isso que separa uma busca honesta ` +
          `de uma que parece semântica.`,
        numeros: [
          String(n.arestasDeSemelhancaDaBienal),
          String(n.semelhancasForaDoAlcance),
          String(n.semelhancasAlcancaveis),
        ],
        origem: "derivado do acervo · montarVizinhancaDeSemelhanca() sobre a âncora da frase",
      },
      semeadura: {
        visao: "mobile",
        personaId: maria.id,
        personaNome: maria.nome,
        disposicoes: [],
        disposicoesRotulos: [],
        ocorrenciasSalvas: [],
        descricao:
          `Põe a visão app, ativa a persona ${maria.nome} e limpa as disposições. A frase do ` +
          `cenário já abre traduzida — ninguém precisa digitar nada sob pressão.`,
      },
    },

    // -----------------------------------------------------------------------
    // CENÁRIO 6, o único que não é sobre quem CONSOME, e sim sobre quem ALIMENTA.
    //
    // Os cinco anteriores respondem perguntas do RFP sobre a experiência do público. Este
    // responde a pergunta que vem depois dela, e que decide se a plataforma existe daqui a
    // um ano: quem põe o conteúdo lá dentro, e com que trabalho.
    //
    // ELE É O ÚNICO QUE TERMINA NUMA TELA PÚBLICA VINDO DO BASTIDOR. É de propósito: o que
    // ele prova não é uma tela de formulário, é o CICLO, o registro sai do Studio e chega
    // à vitrine, e o percurso inteiro cabe numa demonstração.
    // -----------------------------------------------------------------------
    {
      numero: 6,
      titulo: "Quem alimenta a plataforma, e com que trabalho",
      pergunta:
        "Depois de provar a experiência do público, sobra a pergunta que decide se ela " +
        "existe daqui a um ano: quem publica o conteúdo, quanto custa fazer isso, e o que " +
        "impede alguém de publicar coisa incompleta?",
      visao: "mobile",
      visaoRotulo: "visão app",
      passos: [
        {
          ordem: 1,
          tela: "Entrada, perfis de demonstração",
          rota: "/entrar/",
          comoChegar: "digitando",
          provar:
            "há cinco perfis, e a tela diz com todas as letras que isto NÃO é autenticação: " +
            "escolher grava uma preferência no navegador e muda o que a navegação oferece. " +
            "Num artefato estático toda rota continua abrindo por URL, e não há como não abrir.",
        },
        {
          ordem: 2,
          tela: "Studio, o painel do produtor",
          rota: "/studio/",
          comoChegar: "pelo-botao",
          provar:
            "o Studio abre DENTRO DO TELEFONE, é a única superfície de bastidor que faz " +
            "isso, porque quem produz cultura no Brasil produz do telefone. Onze pautas num " +
            "trilho só, o que está pendente de você primeiro, e cada pendência com o nível " +
            "responsável e a saída sem esperar por ele.",
        },
        {
          ordem: 3,
          tela: "Ficha do evento, identidade",
          rota: "/studio/publicar/",
          comoChegar: "pelo-botao",
          provar:
            "um ato por tela, e a chave de identidade acendendo: título + agente realizador " +
            "+ obra. O agente é CARIMBO e não campo, quem publica é quem realiza. O aviso " +
            "de registro parecido dispara ANTES de salvar e PERMANECE enquanto o título " +
            "continuar parecido.",
        },
        {
          ordem: 4,
          tela: "Ficha do evento, grade de sessões",
          rota: "/studio/grade/",
          comoChegar: "pelo-botao",
          provar:
            "ninguém digita 261 sessões: o gerador diz quantas vai criar e quantas COLIDEM " +
            "antes de aplicar. Colisão é mesma temporada, mesmo início e mesmo espaço, a " +
            "chave de ocorrência da ontologia, e não parecença de texto.",
        },
        {
          ordem: 5,
          tela: "Ficha do evento, publicação",
          rota: "/studio/revisar/",
          comoChegar: "pelo-botao",
          provar:
            "o botão de publicar está DESABILITADO e diz por quê, item a item, cada um com " +
            "link para o ato que resolve. E a função recusa por conta própria: são duas " +
            "travas, não uma aparência de trava.",
        },
        {
          ordem: 6,
          tela: "Acontece, o publicado no ar",
          rota: "/acontece/",
          comoChegar: "digitando",
          provar:
            "o evento publicado aparece na agenda, numa seção que DECLARA o que é: está " +
            "gravado neste navegador e não no acervo. O protótipo é estático e não tem " +
            "servidor para receber publicação, dizer isso é melhor do que fingir.",
        },
      ],
      sustenta: [
        "Onze pautas alimentadas pelo mesmo perfil, com as mesmas primitivas: agenda, play, cast, museu, cursos, editorial, curadoria, programa, editais, espaços e mídia.",
        "Publicação direta, no modelo do Sympla: quem produz publica, e a fiscalização é posterior, a Moderação decide sobre o que já está no ar.",
        "Toda alteração de sessão publicada diz, ANTES de confirmar, quantas pessoas serão avisadas; cancelar exige motivo escrito.",
        "Dezesseis catálogos modeláveis, com o alcance de cada termo medido antes de renomear, fundir ou arquivar, e três fechados, cada um dizendo por quê.",
      ],
      naoSustenta: {
        texto:
          "NÃO HÁ BANCO, NÃO HÁ AUTENTICAÇÃO E NÃO HÁ USUÁRIOS. O que o produtor publica " +
          "vive no `localStorage` deste navegador, sob a chave `produtor.v1`, e some ao " +
          "limpar o armazenamento. O número de «pessoas que serão avisadas» é autorado e " +
          "determinístico, não existe servidor para contar quem salvou o quê. O que a " +
          "demonstração prova é o MECANISMO: a consequência medida e dita antes de " +
          "confirmar, a dupla trava da publicação, e o ciclo fechando do bastidor à vitrine.",
        numeros: ["0", "11", "16"],
        origem: "autorado · declarado nas próprias telas do Studio",
      },
      semeadura: {
        visao: "mobile",
        personaId: null,
        personaNome: null,
        disposicoes: null,
        disposicoesRotulos: [],
        ocorrenciasSalvas: [],
        descricao:
          "Põe a visão app e leva à entrada. Este cenário não usa persona: quem entra aqui " +
          "não é o público, é quem alimenta o produto.",
      },
    },
  ];

  // ---------------------------------------------------------------------------
  // A GUARDA DISTINGUE O QUE É DO RFP DO QUE É NOSSO, e a distinção é o ponto.
  //
  // Ela dizia `cenarios.length !== 5`, e estava certa: o RFP tem CINCO cenários, e um sexto
  // aparecendo ali seria um cenário inventado passando por exigência do cliente — que é
  // exatamente o tipo de coisa que este módulo quebra o build para impedir.
  //
  // O Cenário 6 não é do RFP. Ele responde a pergunta que vem DEPOIS dos cinco — quem
  // alimenta a plataforma —, e a guarda agora conta os dois grupos separados: os cinco do
  // RFP têm de continuar sendo cinco, e os nossos são declarados à parte. Somar tudo num
  // número só teria feito a checagem parar de dizer o que ela existe para dizer.
  // ---------------------------------------------------------------------------
  const doRfp = cenarios.filter((c) => c.numero <= CENARIOS_DO_RFP);
  const nossos = cenarios.filter((c) => c.numero > CENARIOS_DO_RFP);

  if (doRfp.length !== CENARIOS_DO_RFP) {
    romper(
      `o RFP tem ${CENARIOS_DO_RFP} cenários e este módulo montou ${doRfp.length} deles`,
    );
  }
  if (nossos.length !== CENARIOS_NOSSOS) {
    romper(
      `este módulo declara ${CENARIOS_NOSSOS} cenário(s) fora do RFP e montou ${nossos.length}`,
    );
  }
  for (const c of cenarios) {
    if (!c.naoSustenta.numeros.length) {
      romper(`o Cenário ${c.numero} declara o limite do acervo sem nenhum número medido (D-77)`);
    }
    if (!c.passos.length) romper(`o Cenário ${c.numero} não tem passo nenhum`);
  }

  roteiroMemo = {
    total: cenarios.length,
    cenarios,
    numeros: n,
    constantesDaOnda: CONSTANTES_DA_ONDA,
    fecho:
      "Os cinco cenários do RFP se resolvem com o MESMO núcleo — a ontologia, o grafo e a " +
      "procedência. Não são cinco truques independentes: é uma coisa só, vista de cinco " +
      "ângulos, e é isso que esta demonstração está provando. O sexto não é do RFP: ele " +
      "responde a pergunta que vem depois, e que decide se a plataforma existe daqui a um " +
      "ano — quem põe o conteúdo lá dentro, e com que trabalho.",
    limiteDoRoteiro:
      "Este roteiro não é slide e não substitui as telas. Tudo que ele afirma está a um " +
      "clique de ser conferido no próprio app, e essa é a única forma de guia que este " +
      "protótipo aceita.",
  };
  return roteiroMemo;
}
