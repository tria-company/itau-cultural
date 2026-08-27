"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ICONE_ACONTECE,
  ICONE_BUSCAR,
  ICONE_CAST,
  ICONE_CURSOS,
  ICONE_DESCOBRIR,
  ICONE_IA,
  ICONE_MAPA,
  ICONE_MUSEU,
  ICONE_NOTICIAS,
  ICONE_OBRA,
  ICONE_PERFIL,
  ICONE_PLAY,
  ICONE_SALVOS,
} from "@/componentes/base/icones";
import { IconeVivo } from "@/componentes/icone-vivo";
import { AssinaturaIc, Chancela } from "@/componentes/marca";
import { TrocaDePapel } from "@/componentes/selecao-papel";
import { DESCRICAO_DO_PAPEL, usePapel } from "@/contexto/papel";
import { useSessao } from "@/contexto/sessao";
import { personaPorId } from "@/dados/personas";

/**
 * menu-lateral.tsx — a navegação da VISÃO WEB: trilho permanente à esquerda.
 *
 * Foi a navegação das duas visões entre a reformulação de agosto e 23/08, quando
 * o app passou a ter barra inferior (`navegacao-barra.tsx`) e o menu ficou só na
 * web. Uma gaveta com hambúrguer num telefone que já tem barra seria a mesma
 * árvore duas vezes; uma barra de abas no pé de uma janela de 1440px seria um
 * padrão de telefone posto onde não resolve nada. Quem escolhe entre os dois é
 * `navegacao-principal.tsx`.
 *
 * A árvore de itens foi FIXADA PELO CLIENTE (22/08): Descobrir · Buscar ·
 * Acontece · Play · Cast · Notícias · Museu · IA · Cursos · Blog. Planejar
 * (Mapa/Salvos) e Meu perfil formam o grupo secundário; o bastidor só aparece
 * na visão web, porque as rotas dele se declaram «só web» (AvisoDesktop).
 *
 * O CABEÇALHO FINO, O SCRIM E A GAVETA SAÍRAM em 23/08, junto com o estado
 * `aberto`, o atalho de Escape e o `aoNavegar` que fechava a gaveta a cada
 * clique. Um trilho permanente nunca esteve fechado: não havia o que abrir, o
 * que fechar nem o que fechar depois de navegar. As suítes das fases 2, 3 e 5 e
 * o roteiro de captura foram reescritos na mesma mudança para medir a barra
 * inferior em vez do hambúrguer.
 *
 * OS ÍCONES SAÍRAM DAQUI em 23/08, para `base/icones.tsx`: a barra inferior
 * desenha os mesmos cinco primeiros, e duas cópias do mesmo `<path>` divergem na
 * primeira edição — a bússola de Descobrir com um traço na barra e outro no
 * menu, na mesma tela.
 */

interface Item {
  href: string;
  rotulo: string;
  icone?: React.ReactNode;
  /** Subitens (ex.: Exposições dentro de Museu) — só renderizados com o pai ativo. */
  filhos?: { href: string; rotulo: string; icone?: React.ReactNode }[];
}

const PRINCIPAIS: Item[] = [
  { href: "/descobrir", rotulo: "Descobrir", icone: ICONE_DESCOBRIR },
  { href: "/buscar", rotulo: "Buscar", icone: ICONE_BUSCAR },
  { href: "/acontece", rotulo: "Acontece", icone: ICONE_ACONTECE },
  { href: "/play", rotulo: "Play", icone: ICONE_PLAY },
  { href: "/cast", rotulo: "Cast", icone: ICONE_CAST },
  { href: "/noticias", rotulo: "Notícias", icone: ICONE_NOTICIAS },
  {
    href: "/museu",
    rotulo: "Museu",
    icone: ICONE_MUSEU,
    filhos: [
      { href: "/museu/espaco-olavo-setubal", rotulo: "Olavo Setubal", icone: ICONE_MUSEU },
      { href: "/museu/espaco-herculano-pires", rotulo: "Herculano Pires", icone: ICONE_MUSEU },
      { href: "/museu/exposicoes", rotulo: "Exposições", icone: ICONE_OBRA },
    ],
  },
  { href: "/ia", rotulo: "IA", icone: ICONE_IA },
  { href: "/cursos", rotulo: "Cursos", icone: ICONE_CURSOS },
];

const PLANEJAR: Item[] = [
  { href: "/mapa", rotulo: "Mapa", icone: ICONE_MAPA },
  { href: "/salvos", rotulo: "Salvos", icone: ICONE_SALVOS },
  { href: "/meu", rotulo: "Meu perfil", icone: ICONE_PERFIL },
];

/**
 * O bastidor, com o prefixo de superfície ao lado — é por ele que o papel filtra.
 *
 * O STUDIO PASSOU A APONTAR PARA A RAIZ, e não mais para `/studio/duplicatas`. A raiz não
 * existia: `/studio` era um diretório sem índice, e o menu tinha de escolher uma das
 * dezoito telas para servir de porta. Agora ela existe — é o painel P1 — e é ela a porta.
 *
 * `/redacao` E `/admin` ENTRARAM. Nenhum dos dois estava listado, e quem chegava a eles
 * digitava a URL. A Redação foi um pedido aberto desde a fase 5; a Administração nunca
 * teve entrada. Como o grupo agora é filtrado por papel, listá-los não polui a navegação de
 * quem não os usa.
 */
interface ItemDeBastidor extends Item {
  /** O prefixo que `DESCRICAO_DO_PAPEL[...].superficies` compara. */
  superficie: string;
  /** `false` no Studio, que é mobile-first desde o perfil Produtor. */
  soWeb: boolean;
}

const BASTIDOR: ItemDeBastidor[] = [
  { href: "/studio", rotulo: "Studio", superficie: "/studio", soWeb: false },
  { href: "/moderacao/fila", rotulo: "Moderação", superficie: "/moderacao", soWeb: true },
  { href: "/redacao/trilha", rotulo: "Redação", superficie: "/redacao", soWeb: true },
  { href: "/observatorio", rotulo: "Observatório", superficie: "/observatorio", soWeb: true },
  { href: "/admin/papeis", rotulo: "Administração", superficie: "/admin", soWeb: true },
  { href: "/roteiro", rotulo: "Roteiro guiado", superficie: "/roteiro", soWeb: true },
];

function ItemDeMenu({ item, caminho }: { item: Item; caminho: string }) {
  const ativo = caminho === item.href || caminho.startsWith(`${item.href}/`);
  return (
    <li>
      <Link
        href={item.href}
        aria-current={caminho === item.href ? "page" : undefined}
        className="menu-item tipo-detalhe"
      >
        {item.icone ? <IconeVivo ativo={ativo}>{item.icone}</IconeVivo> : null}
        <span>{item.rotulo}</span>
      </Link>
      {item.filhos && ativo ? (
        <ul>
          {item.filhos.map((filho) => (
            <li key={filho.href}>
              <Link
                href={filho.href}
                aria-current={caminho === filho.href ? "page" : undefined}
                className="menu-item menu-subitem tipo-detalhe"
              >
                {filho.icone ? (
                  <IconeVivo ativo={caminho === filho.href || caminho.startsWith(`${filho.href}/`)}>
                    {filho.icone}
                  </IconeVivo>
                ) : null}
                {filho.rotulo}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function MenuLateral() {
  // Sem a barra final: `trailingSlash: true` faz o pathname canônico vir como
  // `/descobrir/`, e a igualdade exata do aria-current nunca acenderia contra os
  // hrefs sem barra (regressão pega pelo flow-critic — a barra de abas antiga
  // normalizava com startsWith).
  const caminho = (usePathname() ?? "").replace(/\/$/, "");
  const { personaId } = useSessao();
  const persona = personaPorId(personaId);
  const { papel, hidratado: papelHidratado } = usePapel();

  // ANTES DE HIDRATAR, O GRUPO É O DO PÚBLICO — vazio. O HTML do build não sabe qual papel
  // o navegador guardou, e renderizar a lista cheia para depois encolhê-la faria o menu
  // piscar itens que aquele perfil não usa. É a mesma disciplina de `SelecaoPersona`.
  const doPapel = papelHidratado
    ? BASTIDOR.filter((b) => DESCRICAO_DO_PAPEL[papel].superficies.includes(b.superficie))
    : [];

  return (
    <div className="menu-lateral">
      <nav className="menu-lateral-nav" aria-label="Navegação principal">
        <div className="menu-marca">
          <AssinaturaIc prioridade />
        </div>

        <div className="menu-grupos">
          <ul>
            {PRINCIPAIS.map((item) => (
              <ItemDeMenu key={item.href} item={item} caminho={caminho} />
            ))}
          </ul>

          <p className="menu-rotulo-grupo tipo-micro">Planejar</p>
          <ul>
            {PLANEJAR.map((item) => (
              <ItemDeMenu key={item.href} item={item} caminho={caminho} />
            ))}
          </ul>

          {/* Bastidor: só o que ESTE papel abre. O grupo some inteiro para o público, que
              é o padrão — quem entra sem escolher perfil vê o produto e mais nada.

              O item «só web» continua escondido na visão app, porque a rota dele se declara
              superfície de desktop e um atalho para um aviso é um beco anunciado. O Studio
              NÃO é «só web» desde o perfil Produtor: ele aparece nas duas visões. */}
          {doPapel.length > 0 ? (
            <div>
              <p className="menu-rotulo-grupo tipo-micro">Bastidor</p>
              <ul>
                {doPapel.map((item) => (
                  <div key={item.href} className={item.soWeb ? "hidden desk:block" : undefined}>
                    <ItemDeMenu item={item} caminho={caminho} />
                  </div>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="menu-rodape">
          <Link href="/meu" className="tipo-legenda block text-tinta-2">
            Você está como <strong className="text-tinta">{persona?.nome ?? "…"}</strong>
            <span className="text-acao-tinta"> · trocar</span>
          </Link>
          {/* Trocar de papel SEM passar por `/entrar`: quem troca a partir de uma tela
              qualquer quase sempre quer continuar onde está e ver o que muda. */}
          <TrocaDePapel className="mt-2" />
        </div>
      </nav>
      <Chancela />
    </div>
  );
}
