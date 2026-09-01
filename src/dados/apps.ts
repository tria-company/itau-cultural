/**
 * apps.ts — o catálogo do hub: os aplicativos que moram dentro deste aplicativo.
 *
 * POR QUE ESTE ARQUIVO EXISTE. A árvore de navegação estava escrita dentro de
 * `menu-lateral.tsx`, como rótulo + ícone. Isso serve a um menu de texto e não
 * serve a um hub: um hub é uma prateleira de CAPAS, e capa é dado — arquivo,
 * autoria e descrição para quem não vê a imagem. Deixar isso dentro do
 * componente transformaria três informações do acervo em detalhe de layout.
 *
 * COMO AS CAPAS FORAM ESCOLHIDAS. Não por gosto e não por sorteio: cada app
 * declara um recorte do acervo (a categoria do CMS ou o tema que já classifica
 * aquele conteúdo), e a capa saiu de uma entidade REAL desse recorte, medida no
 * disco — ≥700px de largura e proporção entre 1,2 e 2,1, que é a faixa que
 * sobrevive ao corte de um mosaico. `origem` guarda o título da entidade de
 * onde a imagem veio: é o que permite conferir a escolha em vez de confiar
 * nela.
 *
 * ALT E CRÉDITO SÃO DO ACERVO, NÃO NOSSOS. `alt` é o `imagemAlt` que o CMS
 * publica e `credito` é o `creditoImagem` da mesma entidade. Nenhuma capa
 * entrou aqui sem os dois — escrever a descrição por conta própria seria pôr
 * palavra nossa na boca do Itaú Cultural, que é a linha que este projeto não
 * cruza (D-28).
 *
 * OS ATALHOS DE CONTA E DE BASTIDOR NÃO TÊM CAPA, e não é lacuna. «Salvos» é o
 * que VOCÊ guardou e «Studio» é uma mesa de trabalho: nenhum dos dois é um
 * acervo a folhear, e uma foto do acervo ali dentro prometeria conteúdo onde há
 * ferramenta.
 */

/**
 * Por onde o corte da capa deve segurar quando o cartaz é mais estreito que a
 * foto — e por que isso é dado da CAPA e não medida de layout.
 *
 * Parte do acervo tem TIPOGRAFIA GRAVADA na imagem: a foto do Cast é a thumb do
 * Mekukradjá e traz o letreiro do programa e o grafismo do Itaú Cultural no
 * terço esquerdo. Num cartaz em retrato o corte centralizado guarda justamente
 * essa faixa, e o rótulo «Cast» cai por cima de um segundo título. Onde segurar
 * o corte é propriedade daquela imagem, não do porte do cartaz: a mesma capa num
 * cartaz largo continua tendo o letreiro do mesmo lado.
 */
export type FocoDaCapa = "centro" | "direita" | "esquerda";

export interface CapaApp {
  /** Nome do arquivo em `public/acervo/`, sem o diretório. */
  readonly arquivo: string;
  /** Onde o corte segura. Ausente é `centro`, que serve à maioria. */
  readonly foco?: FocoDaCapa;
  /** `imagemAlt` da entidade de origem. Nunca vazio. */
  readonly alt: string;
  /** `creditoImagem` da entidade de origem. Nunca vazio. */
  readonly credito: string;
  /** Título da entidade do acervo de onde a capa veio — a trilha de conferência. */
  readonly origem: string;
}

/**
 * O vocabulário de desenho do cartaz. Ele diz, ANTES do toque, o que acontece do
 * outro lado: Play e Cast começam a tocar alguma coisa, Acontece abre um
 * calendário, Mapa abre um mapa. `entrar` é o resto — a seta que não promete nada
 * além de atravessar. Quem desenha cada um é `base/icones.tsx`.
 */
export type Glifo = "entrar" | "tocar" | "ouvir" | "agenda" | "mapa" | "ia";

/**
 * Como o grupo se arruma na grade, e por que isto é DADO e não posição.
 *
 * O ritmo era derivado da ordem do grupo — girava sozinho e nenhum se repetia em
 * sequência. A referência de 23/08 tirou essa liberdade: ela desenha uma forma
 * para cada grupo, e a forma carrega significado. «Ler» é faixa larga porque
 * notícia e curso são leitura contínua; «Descobrir e perguntar» põe o feed em pé
 * ao lado dos dois atalhos porque o feed é o destino grande da fileira. Derivar
 * isso da posição do grupo daria a forma certa por acidente e a erraria assim que
 * alguém reordenasse a lista.
 *
 *   · **par**    — retratos aos pares. Contagem ímpar deixaria meia fileira vazia
 *                  no fim, então o ÚLTIMO vira faixa e fecha a linha.
 *   · **faixa**  — cada cartaz ocupa a largura toda.
 *   · **lado**   — o primeiro fica em pé à esquerda, os outros empilham à direita.
 */
/**
 * O ritmo do grupo, de onde sai o porte de cada cartaz (`hub-apps.tsx`).
 *
 * `duo` e `abertura` entraram em 2026-08-25, a pedido: o hub deixou de ser quatro
 * prateleiras do mesmo tipo e passou a INTERCALAR dois pesos — uma fileira de dois
 * cartazes, uma faixa da largura da abertura, e assim por diante até o fim da página.
 */
export type Ritmo = "par" | "faixa" | "lado" | "duo" | "trio" | "abertura";

export interface App {
  readonly id: string;
  readonly rotulo: string;
  /** Uma linha: o que este app responde. Nunca o nome repetido em outra ordem. */
  readonly descricao: string;
  readonly href: string;
  /**
   * A amostra do acervo daquele app. AUSENTE quando não há acervo a amostrar —
   * ver «Roteiros com IA» lá embaixo: o cartaz vira um gradiente da paleta da
   * marca, desenhado em CSS, e não uma foto emprestada de outra coisa.
   */
  readonly capa?: CapaApp;
  /** O disco no canto de baixo. */
  readonly selo: Glifo;
  /**
   * O glifo grande no alto do cartaz SEM capa. Sem fotografia, o quadro fica com
   * um vazio no topo e o cartaz perde o peso dos vizinhos; qual símbolo entra ali
   * é do app, não do layout.
   */
  readonly marca?: Glifo;
}

export interface GrupoApps {
  readonly id: string;
  /**
   * O título da prateleira, quando ela precisa de um. AUSENTE nos blocos de um cartaz só:
   * a faixa já traz o nome do app em corpo de título dentro dela, e um «Museu» escrito
   * acima de um cartaz que diz «Museu virtual» é a mesma palavra duas vezes em dois
   * tamanhos. Prateleira com dois cartazes mantém o título, porque aí ele nomeia o par e
   * não repete nenhum dos dois.
   */
  readonly rotulo?: string;
  readonly ritmo: Ritmo;
  readonly apps: readonly App[];
}

export interface Atalho {
  readonly href: string;
  readonly rotulo: string;
  readonly descricao: string;
}

export const GRUPOS_APPS: readonly GrupoApps[] = [
  {
    id: "repertorio",
    rotulo: "Seu repertório",
    ritmo: "trio",
    apps: [
      {
        id: "comunidade",
        rotulo: "Comunidade",
        descricao: "O feed do Itaú Cultural e as comunidades dos produtores",
        href: "/comunidade",
        capa: {
          arquivo: "/hub/comunidade.jpg",
          alt: "Seis pessoas jovens sentadas em roda conversando num espaço cultural de paredes descascadas, cobertas de cartazes onde se lê «juntos ideias conectam pessoas transformam» e «cultura diálogo colaboração criatividade pertencimento». Ao fundo, outras mesas ocupadas e uma estante de livros.",
          credito: "Ilustração gerada para o protótipo",
          origem: "Peça de interface, fora do acervo do Itaú Cultural",
        },
        selo: "entrar",
      },
      {
        id: "desafios",
        rotulo: "Desafios",
        descricao: "As missões da semana e o seu nível",
        href: "/desafios",
        capa: {
          arquivo: "/hub/desafios.jpg",
          alt: "Parede coberta de cartões de papel colados com fita, cada um marcado «missão» e trazendo um ícone e uma pontuação: um alvo com flecha para «participe de um evento, +150 pontos», um balão de fala para «comente em uma publicação, +50 pontos», duas silhuetas para «convide um amigo, +200 pontos».",
          credito: "Ilustração gerada para o protótipo",
          origem: "Peça de interface, fora do acervo do Itaú Cultural",
        },
        selo: "entrar",
      },
      {
        id: "loja",
        rotulo: "Recompensas",
        descricao: "O que suas fichas abrem",
        href: "/recompensas",
        capa: {
          arquivo: "/hub/loja.jpg",
          alt: "Vitrine iluminada com caixas de presente empilhadas, um livro de arte, um fone de ouvido, um frasco de perfume e uma nécessaire de couro. Sobre vários deles pousam moedas douradas luminosas com uma estrela no centro.",
          credito: "Ilustração gerada para o protótipo",
          origem: "Peça de interface, fora do acervo do Itaú Cultural",
        },
        selo: "entrar",
      },
    ],
  },
  {
    id: "assistir",
    rotulo: "Assistir e ouvir",
    ritmo: "duo",
    apps: [
      {
        id: "play",
        rotulo: "Play",
        descricao: "Filmes, séries e mostras do acervo",
        href: "/play",
        capa: {
          // A capa anterior era o frame de «O segredo delas», e ela vinha do
          // vídeo com as TARJAS PRETAS gravadas em cima e embaixo: num cartaz em
          // retrato, o corte guarda as duas e o app abre com uma faixa preta
          // atravessada. Esta é uma fotografia, não um frame — e é do mesmo
          // recorte, uma mídia de vídeo do catálogo do Play.
          arquivo: "009010abd65ad607.jpg",
          alt: "Na imagem está uma mulher negra, de cabeça raspada, sorrindo e com uma das mãos no rosto, quanto a outra está apoiada na mesa. Ela usa uma roupa vermelha de um ombro só, anel com uma pedra grande e brincos.",
          credito: "Marcus Leoni/Itaú Cultural",
          origem: "Série “Cada voz” recebe Virgínia Rodrigues (midia:cms:1114)",
        },
        selo: "tocar",
      },
      {
        id: "cast",
        rotulo: "Cast",
        descricao: "Podcasts e conversas do Itaú Cultural",
        href: "/cast",
        capa: {
          arquivo: "41307c2ff3e8a383.jpeg",
          // O letreiro «Mekukradjá» e o grafismo do IC ocupam o terço esquerdo
          // desta foto. Segurando à direita, o corte fica em Célia e o cartaz
          // deixa de ter dois títulos.
          foco: "direita",
          alt: "Célia Xakriabá é uma mulher indígena jovem. Ela usa cocar e segura um microfone.",
          credito: "Guilherme Castoldi",
          origem: "Célia Xakriabá – Mekukradjá",
        },
        selo: "ouvir",
      },
    ],
  },
  {
    id: "museu",
    ritmo: "abertura",
    apps: [
      {
        id: "museu",
        rotulo: "Museu virtual",
        descricao: "Exposições que continuam abertas",
        href: "/museu",
        capa: {
          arquivo: "9d6aae06dc62e35c.jpeg",
          alt: "Trata-se de um painel com quadrados e retângulos de tons diversos de azul e cinza.",
          credito: "Everton Ballardin",
          origem: "Recortes sobre Sandra Cinto",
        },
        selo: "entrar",
      },
    ],
  },
  {
    id: "ir",
    rotulo: "Ir e ver",
    ritmo: "duo",
    apps: [
      {
        id: "acontece",
        rotulo: "Acontece",
        descricao: "A agenda, dia a dia",
        href: "/acontece",
        capa: {
          arquivo: "ed71328d4eadd832.jpeg",
          alt: "Parede com duas fileiras de cartazes coloridos de shows do Auditório Ibirapuera",
          credito: "Itaú Cultural",
          origem: "Auditório Ibirapuera (curadoria de hero, docs em src/dados/heroi.ts)",
        },
        selo: "agenda",
      },
      {
        id: "mapa",
        rotulo: "Mapa",
        descricao: "Onde a cultura está — e onde não está",
        href: "/mapa",
        capa: {
          arquivo: "934960fe5cd814d7.jpeg",
          alt: "A imagem mostra edifícios, telhados e casas. No centro da foto, há o desenho feito na lateral de um prédio.",
          credito: "Pri Barbosa",
          origem: "A arte visual e urbana cura a cidade em meio ao caos",
        },
        selo: "mapa",
      },
    ],
  },
  {
    id: "ler",
    ritmo: "abertura",
    apps: [
      {
        id: "noticias",
        rotulo: "Notícias",
        descricao: "O que saiu hoje sobre cultura",
        href: "/noticias",
        capa: {
          arquivo: "ba73e8bf6017b82a.jpeg",
          alt: "Montagem colorida de duas fotos. Do lado esquerdo há uma mulher jovem encostada em um carro.",
          credito: "divulgação",
          origem: "Roteiristas de A Vida Invisível falam sobre o processo de adaptação",
        },
        selo: "entrar",
      },
    ],
  },
  {
    id: "descobrir",
    rotulo: "Descobrir, buscar e perguntar",
    ritmo: "trio",
    apps: [
      {
        id: "descobrir",
        rotulo: "Descobrir",
        descricao: "O feed que se explica",
        href: "/descobrir",
        capa: {
          arquivo: "8e3a4a31a4246c0b.jpeg",
          alt: "Cantora de vestido dourado ao microfone, iluminada de azul num palco",
          credito: "Agência Ophelia",
          origem: "curadoria de hero, docs em src/dados/heroi.ts",
        },
        selo: "entrar",
      },
      {
        id: "buscar",
        rotulo: "Buscar",
        descricao: "Atravessar as 7.810 entidades do acervo",
        href: "/buscar",
        capa: {
          arquivo: "08211344cfb3ec74.jpeg",
          alt: "A imagem dispõe em três colunas verticais as fotos de três Yanomami, dois homens nas pontas.",
          credito: "Iara Venanzi/Itaú Cultural",
          origem: "Artistas Mulheres Contemporâneas no Acervo: Claudia Andujar",
        },
        selo: "entrar",
      },
      {
        id: "ia",
        rotulo: "Roteiros com IA",
        descricao: "Descreva o programa e receba um roteiro",
        href: "/ia",
        // CAPA TROCADA EM 2026-08-25, a pedido. Até aqui este era o único cartaz sem
        // capa: os outros nove mostram uma amostra do acervo do app, e este não tem
        // acervo — ele RECEBE uma descrição e devolve um roteiro —, então o fundo era um
        // degradê desenhado em CSS com as seis cores de apoio da marca.
        //
        // A ilustração que entrou no lugar NÃO É DO ACERVO, e por isso mora em `/hub/` e
        // não em `/acervo/`: `origem` diz o que ela é em vez de inventar uma procedência
        // de coleção, que é a regra que vale para todas as outras nove.
        //
        // `marca` saiu junto: o glifo de IA já está DESENHADO na ilustração, no alto à
        // esquerda, e o componente o repetiria por cima — dois glifos iguais no mesmo
        // canto. O da imagem é preto sobre a parte clara; o do componente também é preto,
        // e cairia sobre a mesma região.
        capa: {
          arquivo: "/hub/roteiros-ia.jpg",
          alt: "Ilustração em tons de laranja: uma mulher negra de perfil, olhos fechados e cabelo crespo volumoso, ao lado de um sol grande. Ao fundo, um prédio de museu com uma pessoa na entrada, e um caminho sinuoso pontilhado de luzes atravessa a cena.",
          credito: "Ilustração gerada para o protótipo",
          origem: "Peça de interface, fora do acervo do Itaú Cultural",
        },
        selo: "entrar",
      },
    ],
  },
  {
    id: "cursos",
    ritmo: "abertura",
    apps: [
      {
        id: "cursos",
        rotulo: "Cursos",
        descricao: "Formação aberta, on-line e presencial",
        href: "/cursos",
        capa: {
          arquivo: "30539015f18e9533.jpeg",
          alt: "A imagem traz Edinho Santos fazendo um sinal em libras. Ele é negro, tem barba e bigode.",
          credito: "Leonardo Rogério",
          origem: "Curso de extensão propõe reflexões sobre as culturas surdas",
        },
        selo: "entrar",
      },
    ],
  },
];

/** Sua conta: o que você guardou e quem você é. Sem capa, de propósito. */
export const ATALHOS_CONTA: readonly Atalho[] = [
  { href: "/comunidade/marketplace", rotulo: "Comunidades", descricao: "Produtores e organizações, por estado" },
  { href: "/comunidade/guardadas", rotulo: "Guardadas", descricao: "As publicações que você guardou" },
  { href: "/meu/carteira", rotulo: "Carteira", descricao: "Saldo, extrato e entregas" },
  { href: "/salvos", rotulo: "Salvos", descricao: "O que você guardou e os alertas" },
  { href: "/meu/repertorio", rotulo: "Meu repertório", descricao: "As linguagens que você atravessou" },
  { href: "/meu", rotulo: "Perfil", descricao: "Persona, disposições e preferências" },
];

/**
 * Bastidor — e desde o perfil Produtor a lista tem DUAS marcações, porque duas coisas
 * diferentes decidem se cada item aparece.
 *
 * `superficie` é o prefixo que o PAPEL compara: o hub mostra só o que o perfil escolhido
 * abre, e para quem entra como público a seção some inteira. `soWeb` é a outra pergunta, e
 * ela é anterior — a rota se declara superfície de desktop? Cinco se declaram; o Studio
 * deixou de se declarar quando virou mobile-first, e é por isso que ele é o único item que
 * aparece dentro da moldura.
 *
 * O STUDIO APONTA PARA A RAIZ, e não mais para `/studio/duplicatas`: a raiz não existia, e
 * o hub tinha de escolher uma das dezoito telas para servir de porta. Agora ela é o painel.
 */
export interface AtalhoDeBastidor extends Atalho {
  /** O prefixo que `DESCRICAO_DO_PAPEL[...].superficies` compara. */
  readonly superficie: string;
  /** `false` no Studio, que é mobile-first desde o perfil Produtor. */
  readonly soWeb: boolean;
}

export const ATALHOS_BASTIDOR: readonly AtalhoDeBastidor[] = [
  {
    href: "/studio",
    rotulo: "Studio",
    descricao: "Alimentar as onze pautas do produto e publicar",
    superficie: "/studio",
    soWeb: false,
  },
  {
    href: "/moderacao/fila",
    rotulo: "Moderação",
    descricao: "Fiscalizar o que foi publicado, com decisão e autor",
    superficie: "/moderacao",
    soWeb: true,
  },
  {
    href: "/redacao/trilha",
    rotulo: "Redação",
    descricao: "Trilha curada, pontes de sentido e destaque de feed",
    superficie: "/redacao",
    soWeb: true,
  },
  {
    href: "/observatorio",
    rotulo: "Observatório",
    descricao: "Indicadores e procedência do acervo",
    superficie: "/observatorio",
    soWeb: true,
  },
  {
    href: "/admin",
    rotulo: "Administração",
    descricao: "Governança: motor, território, vocabulário e auditoria",
    superficie: "/admin",
    soWeb: true,
  },
  {
    href: "/roteiro",
    rotulo: "Roteiro guiado",
    descricao: "A demonstração passo a passo",
    superficie: "/roteiro",
    soWeb: true,
  },
];

/**
 * Quantos aplicativos o hub anuncia. Contado, nunca digitado.
 *
 * Só os cartazes. Conta e bastidor não entram: os da conta saíram do hub em
 * 23/08, e os do bastidor são ferramenta da visão web — no app a seção nem
 * aparece. O hub anuncia o que ele mostra.
 */
export const TOTAL_APPS = GRUPOS_APPS.reduce((n, g) => n + g.apps.length, 0);
