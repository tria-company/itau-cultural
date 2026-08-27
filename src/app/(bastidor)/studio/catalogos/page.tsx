import { TelaDeCatalogos } from "@/componentes/produtor-catalogos";
import type { CatalogoModelavel } from "@/componentes/produtor-catalogos";
import {
  CONTEXTO_DO_PRODUTOR,
  catalogoDaCuradoria,
  catalogoDoCast,
  catalogoDoEdital,
  catalogoDoPlay,
  catalogoEditorial,
  registrosSemeados,
} from "@/dados/mock/seed-produtor";
import { catalogoDaAgenda } from "@/dados/mock/seed-produtor";
import { DIMENSOES_DE_ACESSIBILIDADE, FAIXAS_ETARIAS, CANAIS_DE_INGRESSO, ROTULO_DA_FAIXA, ROTULO_DO_CANAL } from "@/dados/tipos-acesso";
import {
  ESTADOS_DO_EDITAL,
  FORMATOS_DE_MIDIA,
  RECURSOS_FISICOS,
  ROTULO_DO_EDITAL,
  ROTULO_DO_FORMATO,
  ROTULO_DO_RECURSO,
} from "@/dados/tipos-organizacao";
import {
  FORMATOS_DE_CURSO,
  FORMATOS_DE_EVENTO,
  ROTULO_DO_FORMATO_DE_CURSO,
  ROTULO_DO_FORMATO_DE_EVENTO,
} from "@/dados/tipos-produtor";

/**
 * Studio · Catálogos, tudo o que é lista de escolha nas fichas.
 *
 * OS DEZESSEIS SÃO MONTADOS AQUI, no servidor, a partir das MESMAS constantes que as fichas
 * consomem. Uma segunda lista escrita nesta página divergiria da ficha no primeiro
 * acréscimo, e a tela ofereceria um termo que nenhum seletor conhece.
 *
 * OS NÚMEROS SÃO CONTADOS. `usos` vem do vocabulário gerado e das arestas do grafo; nenhum
 * deles é digitado, e é isso que faz «este termo está em 68 registros» ser uma medida em
 * vez de uma estimativa.
 */

function montar(): CatalogoModelavel[] {
  const agenda = catalogoDaAgenda();
  const play = catalogoDoPlay();
  const cast = catalogoDoCast();
  const editorial = catalogoEditorial();
  const curadoria = catalogoDaCuradoria();
  const edital = catalogoDoEdital();

  return [
    {
      id: "linguagens",
      nome: "Linguagens",
      objetivo: "As linguagens artísticas. Cada uma tem cor própria, e a cor é DADO.",
      origem: "gerado/vocabulario.json",
      termos: agenda.linguagens,
      aberto: true,
      consequencia:
        "A cor da linguagem vem do vocabulário, ele guarda o NOME do token CSS, nunca o hex. Renomear muda o rótulo e não a cor.",
    },
    {
      id: "temas",
      nome: "Temas",
      objetivo: "A tag livre do CMS, virada vocabulário controlado.",
      origem: "gerado/vocabulario.json",
      termos: agenda.temas,
      aberto: true,
    },
    {
      id: "categorias-editoriais",
      nome: "Categorias editoriais",
      objetivo: "O que a vitrine de Notícias usa para filtrar.",
      origem: "leituras.ts:27",
      termos: editorial.categorias,
      aberto: true,
      consequencia:
        "Uma categoria sem rótulo em `leituras.ts` vira um chip escrito em inglês de banco de dados no meio de uma tela em português.",
    },
    {
      id: "secoes-editoriais",
      nome: "Seções editoriais",
      objetivo: "As quatro do submenu de Notícias.",
      origem: "leituras.ts:103",
      termos: editorial.secoes,
      aberto: true,
      consequencia:
        "`/noticias/[secao]` é gerada sobre estas quatro. Uma seção declarada sem nenhuma matéria produz uma rota sem o que renderizar, e derruba o build.",
    },
    {
      id: "formatos-de-evento",
      nome: "Formatos de evento",
      objetivo: "Espetáculo, exposição, ocupação, show, oficina, encontro, visita, sessão.",
      origem: "tipos-produtor.ts",
      termos: FORMATOS_DE_EVENTO.map((f) => ({
        id: f,
        rotulo: ROTULO_DO_FORMATO_DE_EVENTO[f],
      })),
      aberto: true,
    },
    {
      id: "formatos-de-curso",
      nome: "Formatos de curso",
      objetivo: "Os cinco da vitrine de Cursos, hoje adivinhados por regex sobre o título.",
      origem: "cursos-wire.ts:18",
      termos: FORMATOS_DE_CURSO.map((f) => ({
        id: f,
        rotulo: ROTULO_DO_FORMATO_DE_CURSO[f],
      })),
      aberto: true,
      consequencia:
        "Os 54 cursos herdados continuam classificados por regex. Só o que for aberto na ficha passa a declarar, e o declarado ganha da regex.",
    },
    {
      id: "series",
      nome: "Séries do Play",
      objetivo: "As coleções de vídeo, hoje derivadas do prefixo repetido no título.",
      origem: "prateleiras.ts (derivado)",
      termos: play.series.map((s) => ({ id: s.id, rotulo: s.rotulo, usos: s.itens })),
      aberto: true,
    },
    {
      id: "programas",
      nome: "Programas do Cast",
      objetivo: "As fileiras do Cast, hoje derivadas do prefixo repetido no título.",
      origem: "prateleiras.ts (derivado)",
      termos: cast.programas.map((p) => ({ id: p.id, rotulo: p.rotulo, usos: p.itens })),
      aberto: true,
      consequencia:
        "Onde o programa aparece no Cast depende do TAMANHO dele: o maior vira painel de destaque, os medianos viram trilho, e os de menos de oito viram lista compacta.",
    },
    {
      id: "papeis",
      nome: "Papéis do elenco",
      objetivo: "Os papéis da aresta `atua_em`, lidos das próprias arestas, não digitados.",
      origem: "gerado/arestas.json (medido)",
      termos: agenda.papeis.map((p) => ({ id: p.papel, rotulo: p.papel, usos: p.arestas })),
      aberto: true,
    },
    {
      id: "formatos-de-midia",
      nome: "Formatos de ativo",
      objetivo: "Áudio, vídeo, texto, imagem, o que o player sabe tocar.",
      origem: "tipos-organizacao.ts:690",
      termos: FORMATOS_DE_MIDIA.map((f) => ({ id: f, rotulo: ROTULO_DO_FORMATO[f] })),
      aberto: true,
    },
    {
      id: "relacoes",
      nome: "Relações de sentido",
      objetivo: "As quatro que uma pessoa afirma, contra as 51.600 que a máquina deriva.",
      origem: "gerado/arestas.json (medido)",
      termos: curadoria.relacoes.map((r) => ({
        id: r.id,
        rotulo: r.rotulo,
        usos: r.arestas,
      })),
      aberto: true,
    },
    {
      id: "faixas-etarias",
      nome: "Faixas etárias",
      objetivo: "A classificação indicativa que liga a disposição «vou com criança».",
      origem: "tipos-acesso.ts:202",
      termos: FAIXAS_ETARIAS.map((f) => ({ id: f, rotulo: ROTULO_DA_FAIXA[f] })),
      aberto: true,
      consequencia:
        "O público já lê estes rótulos no filtro. Renomear um muda o que a pessoa vê ao escolher com quem vai.",
    },
    {
      id: "canais-de-ingresso",
      nome: "Canais de ingresso",
      objetivo: "Por onde se consegue entrar.",
      origem: "tipos-acesso.ts:218",
      termos: CANAIS_DE_INGRESSO.map((c) => ({ id: c, rotulo: ROTULO_DO_CANAL[c] })),
      aberto: true,
      consequencia:
        "O público lê estes rótulos no bloco de ingresso da página do evento.",
    },
    {
      id: "estados-do-edital",
      nome: "Estados do edital",
      objetivo: "Aberto, encerrado, em julgamento, resultado publicado.",
      origem: "tipos-organizacao.ts:1029",
      termos: ESTADOS_DO_EDITAL.map((e) => ({ id: e, rotulo: ROTULO_DO_EDITAL[e] })),
      aberto: true,
    },

    // ---- OS TRÊS FECHADOS ----
    {
      id: "dimensoes",
      nome: "Dimensões de acessibilidade",
      objetivo: "As oito que o produto declara, e cujo zero ele explica.",
      origem: "tipos.ts:83 · tipos-acesso.ts:259",
      termos: DIMENSOES_DE_ACESSIBILIDADE.map((d) => ({ id: d.chave, rotulo: d.rotulo })),
      aberto: false,
      porQueFechado:
        "As oito vêm do CMS do Itaú Cultural e da norma de acessibilidade. Inventar uma nona seria inventar um direito, e o produto que faz da acessibilidade o critério de primeira classe não pode ser o que a redefine por conta própria.",
    },
    {
      id: "recursos-fisicos",
      nome: "Recursos físicos",
      objetivo: "Rampa, elevador, banheiro adaptado, piso tátil, vaga reservada.",
      origem: "tipos-organizacao.ts:53",
      termos: RECURSOS_FISICOS.map((r) => ({ id: r, rotulo: ROTULO_DO_RECURSO[r] })),
      aberto: false,
      porQueFechado:
        "Mesma norma das oito dimensões. Um sexto recurso inventado aqui seria uma afirmação sobre acessibilidade física que ninguém verificou.",
    },
    {
      id: "territorios",
      nome: "Territórios",
      objetivo: "As 27 UFs do acervo, faltam Sergipe e Tocantins, e a ausência é declarada.",
      origem: "grafo · 359 territórios",
      termos: edital.territorios.slice(0, 40),
      aberto: false,
      porQueFechado:
        "Território é governança da plataforma: só a Administração acrescenta município e estado. A coordenada de cada pino é derivada do centroide, e um município inventado aqui produziria um pino sobre um lugar que não existe.",
    },
  ];
}

export default function Pagina() {
  return (
    <TelaDeCatalogos
      catalogos={montar()}
      semente={registrosSemeados()}
      contexto={CONTEXTO_DO_PRODUTOR}
    />
  );
}
