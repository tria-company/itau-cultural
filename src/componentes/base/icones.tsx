import { cloneElement, isValidElement } from "react";

/**
 * icones.tsx — o traço único da navegação principal.
 *
 * Nasceu quando a barra inferior (2026-08-23) passou a precisar dos
 * mesmos cinco ícones que o menu lateral já desenhava. Dois arquivos com o
 * mesmo `<path>` divergem na primeira edição — e o sintoma seria a bússola de
 * Descobrir com um traço na barra e outro no menu, na mesma tela.
 *
 * São ELEMENTOS, não componentes, porque é assim que os itens de navegação
 * guardam o ícone: um campo `icone?: React.ReactNode` na estrutura do item.
 */

const traco = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function Icone({
  children,
  className = "size-6 shrink-0",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false" className={className}>
      {children}
    </svg>
  );
}

export const ICONE_DESCOBRIR = (
  <Icone>
    <circle cx="12" cy="12" r="9" {...traco} />
    <path d="M15.5 8.5 10.9 10.9 8.5 15.5l4.6-2.4 2.4-4.6Z" {...traco} />
  </Icone>
);

export const ICONE_BUSCAR = (
  <Icone>
    <circle cx="11" cy="11" r="6.5" {...traco} />
    <path d="m15.8 15.8 4 4" {...traco} />
  </Icone>
);

export const ICONE_ACONTECE = (
  <Icone>
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" {...traco} />
    <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" {...traco} />
  </Icone>
);

export const ICONE_PLAY = (
  <Icone>
    <circle cx="12" cy="12" r="9" {...traco} />
    <path d="M10.2 8.6v6.8L15.8 12l-5.6-3.4Z" {...traco} />
  </Icone>
);

export const ICONE_CAST = (
  <Icone>
    <rect x="9" y="3.5" width="6" height="11" rx="3" {...traco} />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5" {...traco} />
  </Icone>
);

export const ICONE_NOTICIAS = (
  <Icone>
    <path d="M4 5.5h13v13a2 2 0 0 0 2-2v-9" {...traco} />
    <path d="M4 5.5v11a2 2 0 0 0 2 2h13M7.5 9h6M7.5 12h6M7.5 15h4" {...traco} />
  </Icone>
);

export const ICONE_MUSEU = (
  <Icone>
    <path d="m12 3.5 8.5 4.5H3.5L12 3.5ZM5 8v8M9.5 8v8M14.5 8v8M19 8v8M3.5 19.5h17" {...traco} />
  </Icone>
);

export const ICONE_IA = (
  <Icone>
    <path
      d="M12 4.5c.7 3.6 2.9 5.8 6.5 6.5-3.6.7-5.8 2.9-6.5 6.5-.7-3.6-2.9-5.8-6.5-6.5 3.6-.7 5.8-2.9 6.5-6.5Z"
      {...traco}
    />
    <path
      d="M18.5 15.5c.3 1.5 1.2 2.4 2.7 2.7-1.5.3-2.4 1.2-2.7 2.7-.3-1.5-1.2-2.4-2.7-2.7 1.5-.3 2.4-1.2 2.7-2.7Z"
      {...traco}
    />
  </Icone>
);

export const ICONE_CURSOS = (
  <Icone>
    <path d="m12 5 9 4-9 4-9-4 9-4Z" {...traco} />
    <path d="M6.5 10.8v4.7c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4.7M21 9v5" {...traco} />
  </Icone>
);

export const ICONE_MAPA = (
  <Icone>
    <path d="M12 20.5s6.5-5.4 6.5-10a6.5 6.5 0 0 0-13 0c0 4.6 6.5 10 6.5 10Z" {...traco} />
    <circle cx="12" cy="10.3" r="2.3" {...traco} />
  </Icone>
);

export const ICONE_SALVOS = (
  <Icone>
    <path d="M7 4.5h10a1 1 0 0 1 1 1v14l-6-3.8-6 3.8v-14a1 1 0 0 1 1-1Z" {...traco} />
  </Icone>
);

export const ICONE_PERFIL = (
  <Icone>
    <circle cx="12" cy="8.5" r="3.8" {...traco} />
    <path d="M4.8 20c.6-3.7 3.6-5.8 7.2-5.8s6.6 2.1 7.2 5.8" {...traco} />
  </Icone>
);

/** Os cursores deslizantes dos filtros — a porta de /filtros na busca de Descobrir. */
export const ICONE_FILTROS = (
  <Icone>
    <path d="M4 7.5h9M17 7.5h3M4 16.5h3M11 16.5h9" {...traco} />
    <circle cx="15" cy="7.5" r="2" {...traco} />
    <circle cx="9" cy="16.5" r="2" {...traco} />
  </Icone>
);

/* ---------------------------------------------------------------------------
 * Os três glifos do SELO dos cartazes do hub (referência de 23/08).
 *
 * O selo é o disco no canto de cada cartaz, e ele diz — antes do toque — o que
 * acontece do outro lado. Quem escolhe qual vai em qual cartaz é `apps.ts`, no
 * campo `selo`; aqui mora só o traço.
 * ------------------------------------------------------------------------- */

/** «Entrar»: a seta que não promete nada além de atravessar. */
/**
 * Menu lateral — duas linhas de comprimentos diferentes, traço fino.
 *
 * Duas e não três: o traço mais curto embaixo é o que distingue este botão de um menu de
 * navegação cheio, e é o desenho que o aplicativo de conversa consagrou para «abrir a
 * lista do lado». Três pontinhos diriam só «tem mais alguma coisa».
 */
export const ICONE_PAINEL = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <path d="M5 10h14" strokeLinecap="round" />
    <path d="M5 15h9" strokeLinecap="round" />
  </svg>
);

export const ICONE_SETA = (
  <Icone>
    <path d="M4.5 12h14M12.8 6.2 18.5 12l-5.7 5.8" {...traco} />
  </Icone>
);

/** «Tocar»: o triângulo CHEIO. `ICONE_PLAY` desenha o círculo junto, e dentro do
 *  selo — que já é um disco — ele viraria um segundo anel concêntrico. */
export const ICONE_TOCAR = (
  <Icone>
    <path
      d="M8.8 5.9 18.6 12l-9.8 6.1V5.9Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinejoin="round"
    />
  </Icone>
);

/** «Ouvir»: a onda do áudio. É o selo do Cast, e não o microfone de
 *  `ICONE_CAST` — o cartaz não convida a gravar, convida a dar play. */
export const ICONE_ONDA = (
  <Icone>
    <path d="M4 10.5v3M8 7.2v9.6M12 4.5v15M16 7.2v9.6M20 10.5v3" {...traco} />
  </Icone>
);

/* ---------------------------------------------------------------------------
 * Os dois estados do botão «minha lista», nas paredes do Play e do Cast.
 * ------------------------------------------------------------------------- */

export const ICONE_MAIS = (
  <Icone>
    <path d="M12 5v14M5 12h14" {...traco} />
  </Icone>
);

export const ICONE_CONFERIDO = (
  <Icone>
    <path d="m4.8 12.6 4.6 4.6L19.2 7.4" {...traco} />
  </Icone>
);

/** O botão que abre o hub — quatro campos, que é o que o hub mostra. */
export const ICONE_APPS = (
  <Icone>
    <rect x="3.5" y="3.5" width="7" height="7" rx="2" {...traco} />
    <rect x="13.5" y="3.5" width="7" height="7" rx="2" {...traco} />
    <rect x="3.5" y="13.5" width="7" height="7" rx="2" {...traco} />
    <rect x="13.5" y="13.5" width="7" height="7" rx="2" {...traco} />
  </Icone>
);

/** Chevron da faixa de datas em Acontece — o mesmo traço nas duas direções. */
export const ICONE_CHEVRON_ESQUERDA = (
  <Icone>
    <path d="M15 5.5 8.5 12 15 18.5" {...traco} />
  </Icone>
);

export const ICONE_CHEVRON_DIREITA = (
  <Icone>
    <path d="M9 5.5 15.5 12 9 18.5" {...traco} />
  </Icone>
);

/** Fones — visitas guiadas, áudio de mediação. */
export const ICONE_FONES = (
  <Icone>
    <path d="M4.5 13v2.2A1.8 1.8 0 0 0 6.3 17H8v-5.5H6.3A1.8 1.8 0 0 0 4.5 13Z" {...traco} />
    <path d="M19.5 13v2.2a1.8 1.8 0 0 1-1.8 1.8H16V11.5h1.7a1.8 1.8 0 0 1 1.8 1.5Z" {...traco} />
    <path d="M4.5 13a7.5 7.5 0 0 1 15 0" {...traco} />
  </Icone>
);

/** Relógio da meta do cartão de agenda. */
export const ICONE_RELOGIO = (
  <Icone>
    <circle cx="12" cy="12" r="8" {...traco} />
    <path d="M12 8v4.5l3 1.5" {...traco} />
  </Icone>
);

/** O triângulo do alerta de sessão alterada. */
export const ICONE_ALERTA = (
  <Icone>
    <path d="M12 4.5 20.5 19H3.5L12 4.5Z" {...traco} />
    <path d="M12 10v4M12 16.5h.01" {...traco} />
  </Icone>
);

/** Oficina / ateliê — o lápis da formação prática. */
export const ICONE_OFICINA = (
  <Icone>
    <path d="M14.2 4.8 19.2 9.8 9 20H4v-5L14.2 4.8Z" {...traco} />
    <path d="M12.8 6.2 17.8 11.2" {...traco} />
  </Icone>
);

/** Pós-graduação — o selo, distinto do capelo de `ICONE_CURSOS`. */
export const ICONE_POS = (
  <Icone>
    <circle cx="12" cy="9.5" r="5" {...traco} />
    <path d="M9.2 13.8 8 20l4-2.2L16 20l-1.2-6.2" {...traco} />
  </Icone>
);

/** Encontro — duas pessoas, o formato presencial/virtual da Escola IC. */
export const ICONE_ENCONTRO = (
  <Icone>
    <circle cx="9" cy="8" r="2.6" {...traco} />
    <circle cx="16.2" cy="8.6" r="2.1" {...traco} />
    <path d="M3.8 19.5c.6-3.4 2.9-5.2 5.2-5.2s4.6 1.8 5.2 5.2" {...traco} />
    <path d="M14.2 14.6c1.8.2 3.5 1.6 4 4.9" {...traco} />
  </Icone>
);

/** Sai do app — a inscrição da formação vive no site do Itaú Cultural. */
export const ICONE_EXTERNO = (
  <Icone>
    <path d="M14 5h5v5M19 5 10 14" {...traco} />
    <path d="M17 13.5V19H5V7h5.5" {...traco} />
  </Icone>
);

/** Enviar o pedido — a seta para cima do compositor de /ia. */
export const ICONE_ENVIAR = (
  <Icone>
    <path d="M12 19V6M6.5 11.5 12 6l5.5 5.5" {...traco} />
  </Icone>
);

/** Critérios do artefato de pensamento — o traço da ficha, não da busca. */
export const ICONE_FICHA = (
  <Icone>
    <rect x="5" y="3.5" width="14" height="17" rx="2" {...traco} />
    <path d="M8.5 8h7M8.5 12h7M8.5 16h4" {...traco} />
  </Icone>
);

/** Livro aberto — editorial, verbete, publicação. */
export const ICONE_LIVRO = (
  <Icone>
    <path d="M12 6.5c-1.6-1-3.7-1.5-6.5-1.5H4.5v13H6c2.6 0 4.5.6 6 1.5 1.5-.9 3.4-1.5 6-1.5h1.5v-13H18.5c-2.8 0-4.9.5-6.5 1.5Z" {...traco} />
    <path d="M12 6.5v13" {...traco} />
  </Icone>
);

/** Prédio — instituição. */
export const ICONE_PREDIO = (
  <Icone>
    <path d="M5 20.5V7.5l7-3.5 7 3.5v13" {...traco} />
    <path d="M3.5 20.5h17" {...traco} />
    <path d="M9 9.5h1.5M13.5 9.5H15M9 13h1.5M13.5 13H15M9 16.5h1.5M13.5 16.5H15" {...traco} />
  </Icone>
);

/** Quadro — obra. */
export const ICONE_OBRA = (
  <Icone>
    <rect x="4" y="5" width="16" height="14" rx="1.5" {...traco} />
    <path d="m8 15 3-3.5 2.5 2.5 2-2.5 3.5 3.5" {...traco} />
    <circle cx="9.5" cy="9" r="1" {...traco} />
  </Icone>
);

/** Etiqueta — tema. */
export const ICONE_TAG = (
  <Icone>
    <path d="M4.5 12V6.5H10l8.5 8.5-5.5 5.5L4.5 12Z" {...traco} />
    <circle cx="8.2" cy="9.2" r="1.1" {...traco} />
  </Icone>
);

/** Caminho — trilha. */
export const ICONE_TRILHA = (
  <Icone>
    <path d="M5 18c2.2-4 3.2-4 5.2-1.2S13.5 19 16 16s3.2-6 4-8" {...traco} />
    <circle cx="5" cy="18" r="1.6" {...traco} />
    <circle cx="19.5" cy="8" r="1.6" {...traco} />
  </Icone>
);

/** Fala — linguagem. */
export const ICONE_FALA = (
  <Icone>
    <path d="M5 6.5h14v9H12l-4 3.5V15.5H5V6.5Z" {...traco} />
  </Icone>
);

/** Troféu — os desafios. */
export const ICONE_TROFEU = (
  <Icone>
    <path d="M7.5 4h9v5.2a4.5 4.5 0 0 1-9 0V4Z" {...traco} />
    <path d="M7.5 5.6H5a2 2 0 0 0 0 4h2.6" {...traco} />
    <path d="M16.5 5.6H19a2 2 0 0 1 0 4h-2.6" {...traco} />
    <path d="M12 13.7V17" {...traco} />
    <path d="M8.5 20h7" {...traco} />
    <path d="M9.8 17h4.4l.6 3H9.2l.6-3Z" {...traco} />
  </Icone>
);

/** Coração — reagir. `data-cheio` no <svg> pinta o miolo. */
export const ICONE_CORACAO = (
  <Icone>
    <path
      d="M12 20.2s-7.5-4.6-7.5-9.5a4.2 4.2 0 0 1 7.5-2.6 4.2 4.2 0 0 1 7.5 2.6c0 4.9-7.5 9.5-7.5 9.5Z"
      {...traco}
    />
  </Icone>
);

export const ICONE_CORACAO_CHEIO = (
  <Icone>
    <path
      d="M12 20.2s-7.5-4.6-7.5-9.5a4.2 4.2 0 0 1 7.5-2.6 4.2 4.2 0 0 1 7.5 2.6c0 4.9-7.5 9.5-7.5 9.5Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinejoin="round"
    />
  </Icone>
);

/** Duas pessoas — a comunidade. */
export const ICONE_COMUNIDADE = (
  <Icone>
    <circle cx="9" cy="8.5" r="3.1" {...traco} />
    <path d="M3.6 19.4a5.6 5.6 0 0 1 10.8 0" {...traco} />
    <path d="M15.6 6.1a3.1 3.1 0 0 1 0 5.9" {...traco} />
    <path d="M17.2 14.5a5.6 5.6 0 0 1 3.2 4.9" {...traco} />
  </Icone>
);

/** Presente — a recompensas de resgate. */
export const ICONE_RECOMPENSAS = (
  <Icone>
    <path d="M4 11h16v8.2a.8.8 0 0 1-.8.8H4.8a.8.8 0 0 1-.8-.8V11Z" {...traco} />
    <path d="M3.4 7.6h17.2v3.4H3.4V7.6Z" {...traco} />
    <path d="M12 7.6V20" {...traco} />
    <path d="M12 7.6S10.9 4 8.9 4a2 2 0 0 0 0 3.6H12Z" {...traco} />
    <path d="M12 7.6S13.1 4 15.1 4a2 2 0 0 1 0 3.6H12Z" {...traco} />
  </Icone>
);

/** Casa/porta — espaço cultural. */
export const ICONE_CASA = (
  <Icone>
    <path d="M4.5 20.5V10.5L12 4.5l7.5 6v10" {...traco} />
    <path d="M10 20.5v-6h4v6" {...traco} />
  </Icone>
);

/**
 * Ícone da CLASSE da ontologia — o mesmo traço em todo filtrador de seção.
 * A chave é o valor cru (`conteudo`, `termo`), nunca o rótulo em português.
 */
export const ICONE_POR_CLASSE: Record<string, React.ReactNode> = {
  conteudo: ICONE_LIVRO,
  pessoa: ICONE_PERFIL,
  midia: ICONE_TOCAR,
  termo: ICONE_FICHA,
  territorio: ICONE_MAPA,
  evento: ICONE_ACONTECE,
  instituicao: ICONE_PREDIO,
  obra: ICONE_OBRA,
  coletivo: ICONE_ENCONTRO,
  espaco: ICONE_CASA,
  tema: ICONE_TAG,
  formacao: ICONE_CURSOS,
  publicacao: ICONE_NOTICIAS,
  linguagem: ICONE_FALA,
  trilha: ICONE_TRILHA,
};

export function iconeDaClasse(classe: string): React.ReactNode {
  const icone = ICONE_POR_CLASSE[classe] ?? ICONE_FICHA;
  return isValidElement(icone) ? cloneElement(icone) : icone;
}


/* ---------------------------------------------------------------------------
 * OS TRÊS DO PRODUTOR, que só existem deste lado.
 *
 * Vieram do trabalho de Studio, Comunidade e Loja, e não estão no ramo de onde veio o
 * resto desta folha. Ficam no fim para a ordem do arquivo continuar sendo a de lá: quando
 * a próxima atualização chegar, o único trecho que precisa de atenção é este.
 * --------------------------------------------------------------------------- */
/** Lápis — editar aqui mesmo, sem sair da tela. */
export const ICONE_LAPIS = (
  <Icone>
    <path d="M4.5 19.5h3.2l9.1-9.1-3.2-3.2-9.1 9.1v3.2Z" {...traco} />
    <path d="M14.9 5.4l1.5-1.5a1.4 1.4 0 0 1 2 0l1.2 1.2a1.4 1.4 0 0 1 0 2l-1.5 1.5" {...traco} />
  </Icone>
);

/** A sacola da loja de pontos: e uma LOJA, e a estrela dizia «favorito». */
export const ICONE_LOJA = (
  <Icone>
    <path d="M5.5 8h13l-1 11.5a1.5 1.5 0 0 1-1.5 1.4H8a1.5 1.5 0 0 1-1.5-1.4L5.5 8Z" {...traco} />
    <path d="M9 8V6.5a3 3 0 0 1 6 0V8" {...traco} />
  </Icone>
);

/** As três abas do Studio: a casa, a rede e os pontos. Mesmo traço das outras. */
export const ICONE_STUDIO_HOME = (
  <Icone>
    <path d="M4 10.5 12 4l8 6.5V20H4v-9.5Z" {...traco} />
    <path d="M9.5 20v-5.5h5V20" {...traco} />
  </Icone>
);
