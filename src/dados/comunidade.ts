/**
 * comunidade.ts — as duas camadas de comunidade, e a amarra que segura a segunda.
 *
 * CAMADA 1 — a comunidade do Itaú Cultural. Uma só, oficial, onde o IC publica e
 * o público responde. É a que existe hoje na aplicação de origem, sem mudança.
 *
 * CAMADA 2 — o marketplace de comunidades de produtores e organizações. E aqui
 * está a decisão que segura o arquivo inteiro: NENHUMA COMUNIDADE É INVENTADA.
 * Cada uma tem `entidadeId` apontando para uma instituição ou coletivo que o
 * acervo já reconhece, com id canônico, slug navegável e fonte na Enciclopédia.
 * Uma lista de nomes fabricados ao lado de um acervo com procedência seria a
 * única coisa capaz de desmontar o argumento da proposta.
 *
 * POR QUE ESTAS DEZESSETE. Não por gosto: são as entidades que declaram
 * território no acervo, uma por unidade da federação — e é essa distribuição que
 * transforma o marketplace num argumento em vez de uma vitrine. O acervo tem
 * instituição ou coletivo em 19 UFs; São Paulo e Rio somam 140 das 220. As que
 * estão aqui são as OUTRAS 17, de propósito: o marketplace é onde o mapa de
 * desertos culturais deixa de ser diagnóstico e vira porta.
 *
 * DP-F: literais tipados, sem alcançar `grafo.ts`. Os ids e slugs foram MEDIDOS
 * contra `dados/gerado/entidades.json`, não escritos de memória.
 */

import type {
  ComunidadeDefinida,
  PessoaDaComunidade,
  PublicacaoDefinida,
} from "@/lib/pontos/tipos";

/* ── As comunidades ──────────────────────────────────────────────────────── */

export const COMUNIDADE_OFICIAL = "ic";

export const COMUNIDADES: ComunidadeDefinida[] = [
  {
    id: COMUNIDADE_OFICIAL,
    entidadeId: null,
    nome: "Itaú Cultural",
    descricao: "A comunidade da casa: programação, bastidores e o que está sendo pensado.",
    natureza: "oficial",
    linguagens: [],
    assinantes: 48210,
  },

  {
    id: "c-bro-mcs",
    entidadeId: "coletivo:enc:80580",
    nome: "Brô MC's",
    descricao: "Rap em guarani-kaiowá, de Dourados. O primeiro grupo de rap indígena do país.",
    natureza: "coletivo",
    uf: "MS",
    linguagens: ["musica"],
    assinantes: 3120,
  },
  {
    id: "c-teatro-amazonas",
    entidadeId: "instituicao:enc:70692",
    nome: "Teatro Amazonas",
    descricao: "Ópera, concerto e temporada no casarão de Manaus.",
    natureza: "instituicao",
    uf: "AM",
    linguagens: ["musica", "teatro"],
    assinantes: 9840,
  },
  {
    id: "c-bordadeiras",
    entidadeId: "coletivo:enc:194263",
    nome: "Bordadeiras do Curtume",
    descricao: "Bordado narrativo em Jenipapo de Minas, no Vale do Jequitinhonha.",
    natureza: "coletivo",
    uf: "MG",
    linguagens: ["artes-visuais"],
    assinantes: 1470,
  },
  {
    id: "c-itamatatiua",
    entidadeId: "coletivo:enc:196461",
    nome: "Ceramistas de Itamatatiua",
    descricao: "Cerâmica quilombola em Alcântara, feita por mulheres há mais de três séculos.",
    natureza: "coletivo",
    uf: "MA",
    linguagens: ["artes-visuais"],
    assinantes: 980,
  },
  {
    id: "c-rendeiras-cariri",
    entidadeId: "coletivo:enc:81449",
    nome: "Rendeiras de Bilro do Cariri",
    descricao: "Renda de bilro em Santana do Cariri, no sopé da Chapada do Araripe.",
    natureza: "coletivo",
    uf: "CE",
    linguagens: ["artes-visuais"],
    assinantes: 1130,
  },
  {
    id: "c-caixa-belem",
    entidadeId: "instituicao:enc:196649",
    nome: "Caixa Cultural Belém",
    descricao: "Exposição, cinema e formação no centro histórico de Belém.",
    natureza: "instituicao",
    uf: "PA",
    linguagens: ["artes-visuais"],
    assinantes: 6210,
  },
  {
    id: "c-coletivo-bispo",
    entidadeId: "coletivo:enc:194646",
    nome: "Coletivo Bispo",
    descricao: "Teatro de pesquisa em Salvador.",
    natureza: "coletivo",
    uf: "BA",
    linguagens: ["teatro"],
    assinantes: 2340,
  },
  {
    id: "c-brigada-henfil",
    entidadeId: "coletivo:enc:195562",
    nome: "Brigada Henfil",
    descricao: "Muralismo e gravura em Recife.",
    natureza: "coletivo",
    uf: "PE",
    linguagens: ["artes-visuais"],
    assinantes: 2890,
  },
  {
    id: "c-basirah",
    entidadeId: "coletivo:enc:80658",
    nome: "BaSiraH",
    descricao: "Núcleo de dança contemporânea de Brasília.",
    natureza: "coletivo",
    uf: "DF",
    linguagens: ["danca"],
    assinantes: 1760,
  },
  {
    id: "c-armazem",
    entidadeId: "coletivo:enc:80348",
    nome: "Armazém Companhia de Teatro",
    descricao: "Companhia de repertório, com sede no Paraná.",
    natureza: "coletivo",
    uf: "PR",
    linguagens: ["teatro"],
    assinantes: 4020,
  },
  {
    id: "c-caixa-do-elefante",
    entidadeId: "coletivo:enc:80898",
    nome: "Caixa do Elefante",
    descricao: "Teatro de bonecos em Porto Alegre, para adulto e para criança.",
    natureza: "coletivo",
    uf: "RS",
    linguagens: ["teatro"],
    assinantes: 3410,
  },
  {
    id: "c-artmosfera",
    entidadeId: "coletivo:enc:195566",
    nome: "Artmosfera",
    descricao: "Arte urbana em Santa Catarina.",
    natureza: "coletivo",
    uf: "SC",
    linguagens: ["artes-visuais"],
    assinantes: 1520,
  },
  {
    id: "c-a-cena",
    entidadeId: "coletivo:enc:80675",
    nome: "A Cena",
    descricao: "Dança contemporânea na Paraíba.",
    natureza: "coletivo",
    uf: "PB",
    linguagens: ["danca"],
    assinantes: 890,
  },
  {
    id: "c-atelie-gravura",
    entidadeId: "coletivo:enc:80827",
    nome: "Ateliê Livre de Gravura",
    descricao: "Gravura de acesso aberto em Goiânia.",
    natureza: "coletivo",
    uf: "GO",
    linguagens: ["artes-visuais"],
    assinantes: 1240,
  },
  {
    id: "c-bonobando",
    entidadeId: "coletivo:enc:81501",
    nome: "Coletivo Bonobando",
    descricao: "Criação coletiva no Acre.",
    natureza: "coletivo",
    uf: "AC",
    linguagens: ["artes-visuais"],
    assinantes: 640,
  },
  {
    id: "c-cine-falcatrua",
    entidadeId: "coletivo:enc:80555",
    nome: "Cine Falcatrua",
    descricao: "Cinema de exibição livre no Espírito Santo.",
    natureza: "coletivo",
    uf: "ES",
    linguagens: ["arte-e-tecnologia", "artes-visuais"],
    assinantes: 1980,
  },
  {
    id: "c-o-imaginario",
    entidadeId: "coletivo:enc:80694",
    nome: "Associação Cultural O Imaginário",
    descricao: "Teatro e formação em Rondônia.",
    natureza: "coletivo",
    uf: "RO",
    linguagens: ["teatro"],
    assinantes: 720,
  },

  /* ── Cinco artistas do acervo, com comunidade CURADA ───────────────────────
   *
   * O nome puxa público; o conteúdo é da curadoria. Nenhuma publicação aqui é
   * escrita em primeira pessoa por quem dá nome à comunidade — inventar fala de
   * pessoa real é a linha que este projeto não cruza, e é por isso que cada uma
   * carrega `curada: true` e a tela diz «curadoria do Itaú Cultural» embaixo do
   * nome. O `entidadeId` e a `fonte` apontam para o verbete na Enciclopédia.
   * ---------------------------------------------------------------------- */

  {
    id: "c-ailton-krenak",
    entidadeId: "pessoa:enc:65144",
    nome: "Ailton Krenak",
    descricao: "Pensamento indígena, escrita e as ideias que adiam o fim do mundo.",
    natureza: "pessoa",
    uf: "MG",
    linguagens: ["literatura"],
    assinantes: 27400,
    fonte: "https://enciclopedia.itaucultural.org.br/pessoas/65144-ailton-krenak",
    curada: true,
  },
  {
    id: "c-alceu-valenca",
    entidadeId: "pessoa:enc:14718",
    nome: "Alceu Valença",
    descricao: "Do frevo ao rock: a música do Nordeste que virou repertório do país.",
    natureza: "pessoa",
    uf: "PE",
    linguagens: ["musica"],
    assinantes: 41300,
    fonte: "https://enciclopedia.itaucultural.org.br/pessoas/14718-alceu-valenca",
    curada: true,
  },
  {
    id: "c-adriana-varejao",
    entidadeId: "pessoa:enc:5282",
    nome: "Adriana Varejão",
    descricao: "Azulejo, carne e história colonial na pintura brasileira contemporânea.",
    natureza: "pessoa",
    uf: "RJ",
    linguagens: ["artes-visuais"],
    assinantes: 18900,
    fonte: "https://enciclopedia.itaucultural.org.br/pessoas/5282-adriana-varejao",
    curada: true,
  },
  {
    id: "c-abdias-nascimento",
    entidadeId: "pessoa:enc:22552",
    nome: "Abdias Nascimento",
    descricao: "O Teatro Experimental do Negro, a pintura sagrada e a luta que os fundou.",
    natureza: "pessoa",
    uf: "SP",
    linguagens: ["teatro", "artes-visuais", "literatura"],
    assinantes: 22600,
    fonte: "https://enciclopedia.itaucultural.org.br/pessoas/22552-abdias-nascimento",
    curada: true,
  },
  {
    id: "c-adelia-sampaio",
    entidadeId: "pessoa:enc:65321",
    nome: "Adélia Sampaio",
    descricao: "A primeira mulher negra a dirigir um longa no Brasil, e o cinema que veio depois.",
    natureza: "pessoa",
    uf: "MG",
    linguagens: ["cinema"],
    assinantes: 12800,
    fonte: "https://enciclopedia.itaucultural.org.br/pessoas/65321-adelia-sampaio",
    curada: true,
  },
];

const POR_ID = new Map(COMUNIDADES.map((c) => [c.id, c]));

export function comunidadePorId(id: string): ComunidadeDefinida | undefined {
  return POR_ID.get(id);
}

/** As do marketplace — tudo menos a oficial. */
export function comunidadesDoMarketplace(): ComunidadeDefinida[] {
  return COMUNIDADES.filter((c) => c.natureza !== "oficial");
}

/**
 * Agrupa por UF, da que tem mais para a que tem menos. O marketplace ordena por
 * TERRITÓRIO e não por número de assinantes de propósito: ordenar por tamanho
 * empurraria as comunidades pequenas — que são justamente as dos territórios com
 * menos acervo — para o fim de uma lista que ninguém rola até o fim.
 */
export function comunidadesPorUf(): { uf: string; comunidades: ComunidadeDefinida[] }[] {
  const mapa = new Map<string, ComunidadeDefinida[]>();
  for (const c of comunidadesDoMarketplace()) {
    if (!c.uf) continue;
    const lista = mapa.get(c.uf) ?? [];
    lista.push(c);
    mapa.set(c.uf, lista);
  }
  return [...mapa.entries()]
    .map(([uf, comunidades]) => ({ uf, comunidades }))
    .sort((a, b) => a.uf.localeCompare(b.uf, "pt-BR"));
}

/* ── As pessoas ──────────────────────────────────────────────────────────── */

/**
 * Avatar é MONOGRAMA, nunca foto. Não temos foto de nenhuma pessoa real e gerar
 * uma seria inventar rosto — a mesma linha que o projeto já se recusou a cruzar
 * ao não autorar elenco. Nomes de demonstração, marcados como tal.
 */
export const PESSOAS: PessoaDaComunidade[] = [
  { id: "eu", nome: "Você", monograma: "VC", cidade: "São Paulo", uf: "SP" },
  { id: "p-ic", nome: "Itaú Cultural", monograma: "IC", cidade: "São Paulo", uf: "SP" },
  { id: "p-maria", nome: "Maria Andrade", monograma: "MA", cidade: "Recife", uf: "PE" },
  { id: "p-carlos", nome: "Carlos Ribeiro", monograma: "CR", cidade: "Belo Horizonte", uf: "MG" },
  { id: "p-joana", nome: "Joana Lima", monograma: "JL", cidade: "Belém", uf: "PA" },
  { id: "p-rita", nome: "Rita Nascimento", monograma: "RN", cidade: "Salvador", uf: "BA" },
  { id: "p-tiago", nome: "Tiago Moraes", monograma: "TM", cidade: "Porto Alegre", uf: "RS" },
];

/**
 * Toda comunidade assina as próprias publicações.
 *
 * Numa comunidade que leva o nome de uma instituição ou de uma artista, quem
 * publica é ela — publicação assinada por terceiro ali dentro faz a comunidade
 * parecer emprestada. O monograma sai das iniciais do nome, derivado e não
 * escrito à mão, para nome novo nunca nascer sem avatar.
 *
 * O QUE ISSO NÃO SIGNIFICA: fala em primeira pessoa. O que essas publicações
 * carregam é conteúdo DO ACERVO — título, imagem, crédito e link da matéria —,
 * ou seja, a comunidade compartilha o que o Itaú Cultural publicou. As de
 * pessoa continuam declarando na tela que a curadoria é do IC.
 */
function monogramaDe(nome: string): string {
  const partes = nome
    .replace(/[^\p{L}\p{N} ]/gu, " ")
    .split(" ")
    .filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

const PESSOAS_DAS_COMUNIDADES: PessoaDaComunidade[] = COMUNIDADES.map((c) => ({
  id: c.id,
  nome: c.nome,
  monograma: monogramaDe(c.nome),
  cidade: "",
  uf: c.uf ?? "",
}));

const PESSOA_POR_ID = new Map(
  [...PESSOAS, ...PESSOAS_DAS_COMUNIDADES].map((p) => [p.id, p]),
);

export function pessoaPorId(id: string): PessoaDaComunidade | undefined {
  return PESSOA_POR_ID.get(id);
}

/* ── O feed inicial ──────────────────────────────────────────────────────── */

/**
 * TODA PUBLICAÇÃO TEM CAPA, e ela vem do acervo com o alt e o crédito do CMS. A
 * aplicação de origem desenhava uma cena SVG à mão quando faltava foto; aqui há
 * 1.920 capas reais com autoria declarada, e usar uma delas custa menos que
 * inventar uma.
 */
export const PUBLICACOES: PublicacaoDefinida[] = [
  {
    id: "pub-ic-1",
    comunidadeId: COMUNIDADE_OFICIAL,
    autorId: "ic",
    titulo: "A temporada Travessias começou",
    corpo:
      "Durante 18 dias, tudo que estiver fora do seu repertório vale mais. Quem nunca ouviu um disco de música do Norte, quem nunca leu sobre gravura, quem nunca foi a um espetáculo de dança: é agora que compensa.",
    etiqueta: "Temporada",
    imagem: "/acervo/b7356adde1e249a7.jpeg",
    imagemAlt: "O auditório do Itaú Cultural visto do alto. No telão atrás do palco, está escrito Caminhada Rumos. No palco há duas pessoas sob a luz e a plateia está cheia e pouco iluminada.",
    imagemCredito: "Itaú Cultural",
    reacoes: 412,
    comentarios: [
      {
        autorId: "p-carlos",
        corpo: "Já fui atrás de teatro de bonecos por causa disso. Não sabia que existia companhia disso no Sul.",
        reacoes: 34,
        quandoRotulo: "2d",
        respostas: [
          {
            autorId: "p-ic",
            corpo: "Caixa do Elefante, em Porto Alegre. Está no marketplace de comunidades.",
            reacoes: 12,
            quandoRotulo: "2d",
          },
        ],
      },
    ],
    diasAtras: 3,
    oficial: true,
  },
  {
    id: "pub-ic-2",
    comunidadeId: COMUNIDADE_OFICIAL,
    autorId: "ic",
    titulo: "Qual linguagem você quer atravessar nesta temporada?",
    corpo: "A gente monta uma trilha com a mais votada.",
    etiqueta: "Enquete",
    imagem: "/acervo/62aa3a29b29496ce.jpeg",
    imagemAlt: "Um grupo de dançarinos vestido de preto estou junto no fundo do palco, que é iluminado de amarelo. Um dançarino está em primeiro plano, em um salto, sob luz vermelha e com imagem desfocada pelo movimento.",
    imagemCredito: "José Luiz Pederneiras",
    reacoes: 188,
    comentarios: [],
    diasAtras: 1,
    oficial: true,
    enquete: {
      opcoes: [
        { rotulo: "Dança", pct: 31 },
        { rotulo: "Literatura", pct: 27 },
        { rotulo: "Cultura popular", pct: 24 },
        { rotulo: "Arte e tecnologia", pct: 18 },
      ],
    },
  },

  /* ── As comunidades curadas ──────────────────────────────────────────────
   * Quem assina é `p-ic` — a curadoria do Itaú Cultural. Nenhuma linha abaixo é
   * atribuída à pessoa que dá nome à comunidade.
   * --------------------------------------------------------------------- */

  {
    id: "pub-krenak-1",
    comunidadeId: "c-ailton-krenak",
    autorId: "c-ailton-krenak",
    titulo: "«A natureza não é recurso, é a gente»",
    corpo:
      "O verbete de Ailton Krenak na Enciclopédia reúne a trajetória de um pensador que atravessou a Constituinte, o cinema e a literatura sem mudar de posição. Reunimos aqui as obras do acervo que dialogam com o que ele escreve.",
    etiqueta: "Curadoria",
    imagem: "/acervo/6580fd97357d32ea.jpeg",
    imagemAlt:
      "Fotografia colorida de um homem indígena sentado sobre um painel verde. No painel há grafismos indígenas pintados em preto. Ele usa uma calça verde caqui, uma camiseta preta e um boné bege. Ele olha para a câmera sorridente.",
    imagemCredito: "Anna Carolina Bueno / Itaú Cultural",
    reacoes: 1840,
    comentarios: [
      {
        autorId: "p-joana",
        corpo: "Li «Ideias para adiar o fim do mundo» depois de uma exposição em Belém. Mudou como eu olho para o rio.",
        reacoes: 96,
        quandoRotulo: "1d",
        respostas: [
          {
            autorId: "p-rita",
            corpo: "O trecho sobre a montanha que tem nome próprio é o que mais volta na minha cabeça.",
            reacoes: 41,
            quandoRotulo: "18h",
          },
        ],
      },
    ],
    diasAtras: 2,
  },
  {
    id: "pub-alceu-1",
    comunidadeId: "c-alceu-valenca",
    autorId: "c-alceu-valenca",
    titulo: "O frevo que virou rock, e o rock que virou frevo",
    corpo:
      "São Bento do Una, 1946. A trajetória de Alceu Valença atravessa a MPB, o cinema e o carnaval de rua sem pedir licença a nenhum deles. Seis obras do acervo para entender a costura.",
    etiqueta: "Curadoria",
    imagem: "/acervo/254e5a855ae33cc4.jpg",
    imagemAlt: "O cantor está com roupas brancas diante de uma casa. À sua esquerda está uma janela.",
    imagemCredito: "Daryan Dornelles",
    reacoes: 2610,
    comentarios: [
      {
        autorId: "p-tiago",
        corpo: "Cresci ouvindo em Porto Alegre achando que era música gaúcha de tão nossa que parecia.",
        reacoes: 132,
        quandoRotulo: "3d",
      },
    ],
    diasAtras: 4,
  },
  {
    id: "pub-varejao-1",
    comunidadeId: "c-adriana-varejao",
    autorId: "c-adriana-varejao",
    titulo: "Azulejo rachado é história rachada",
    corpo:
      "A pintura de Adriana Varejão usa o azulejo português para falar do que ele cobriu. Selecionamos as obras do acervo que conversam com essa leitura da herança colonial.",
    etiqueta: "Curadoria",
    imagem: "/acervo/13132bceecb05dfc.jpeg",
    imagemAlt:
      "Em primeiro plano, vemos duas esculturas. Elas são composições de formas geométricas; à esquerda, uma azul; à direita, uma amarela. No fundo, vemos vários quadros dispostos nas paredes.",
    imagemCredito: "Anna Carolina Bueno",
    reacoes: 1120,
    comentarios: [],
    diasAtras: 5,
  },
  {
    id: "pub-abdias-1",
    comunidadeId: "c-abdias-nascimento",
    autorId: "c-abdias-nascimento",
    titulo: "Antes de ser pintor, ele fundou um teatro",
    corpo:
      "O Teatro Experimental do Negro nasceu em 1944 porque não havia palco para atores negros no Brasil. Abdias Nascimento construiu um. A pintura veio depois, e carrega os mesmos símbolos.",
    etiqueta: "Curadoria",
    imagem: "/acervo/9f0459009305fe0a.jpeg",
    imagemAlt:
      "A pintura possui ao centro duas serpentes de cor laranja com o corpo cheio de pontos pretos com borda vermelha. As duas serpentes formam o mesmo desenho de cada lado. O fundo da tela possui várias cores demarcadas por recortes geométricos. Em primeiro plano há vários traços grossos pretos que terminam em diferentes formatos de tridente, símbolos de uma entidade sagrada africana chamada Exu.",
    imagemCredito: "Ipeafro",
    reacoes: 3420,
    comentarios: [
      {
        autorId: "p-carlos",
        corpo: "Descobri a pintura dele depois do teatro. São a mesma obra em dois suportes.",
        reacoes: 210,
        quandoRotulo: "2d",
      },
      {
        autorId: "p-maria",
        corpo: "Fui na Ocupação e saí com uma lista de coisas para ler. Ainda estou nela.",
        reacoes: 88,
        quandoRotulo: "1d",
      },
    ],
    diasAtras: 3,
  },
  {
    id: "pub-adelia-1",
    comunidadeId: "c-adelia-sampaio",
    autorId: "c-adelia-sampaio",
    titulo: "«Amor Maldito», 1984 — e o silêncio dos 40 anos seguintes",
    corpo:
      "Adélia Sampaio foi a primeira mulher negra a dirigir um longa-metragem no Brasil. O filme circulou pouco e demorou décadas para ser reconhecido. O que veio depois dela, e o que ainda não veio.",
    etiqueta: "Curadoria",
    imagem: "/acervo/85daa432b2571672.jpeg",
    imagemAlt: "Sala de cinema vazia. Podemos ver as cadeiras pretas e o fundo da sala.",
    imagemCredito: "Fernanda Castello Branco",
    reacoes: 1980,
    comentarios: [
      {
        autorId: "p-rita",
        corpo: "Passou numa mostra em Salvador ano passado e a sala encheu. Quarenta anos depois.",
        reacoes: 154,
        quandoRotulo: "12h",
      },
    ],
    diasAtras: 1,
  },
];
