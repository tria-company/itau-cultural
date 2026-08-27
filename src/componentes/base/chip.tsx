"use client";

import Link from "next/link";
import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ICONE_CHEVRON_DIREITA, ICONE_CHEVRON_ESQUERDA } from "@/componentes/base/icones";

/**
 * chip.tsx, a primeira primitiva de `base/`, e a que o projeto mais devia.
 *
 * O QUE ELA SUBSTITUI. Havia OITO vocabulários de pílula no projeto, cada um com
 * seu raio, seu padding, seu tamanho de fonte e sua ideia do que «selecionado»
 * parece: contorno laranja em `/buscar`, fundo laranja em `/play`, fundo preto
 * na estrelinha. Sete deles empilhavam em `flex flex-wrap`, então dentro da
 * moldura de 390px o trilho de filtros quebrava em duas ou três linhas tortas,
 * a «linha quebrada feia» que abriu esta reformulação. Este arquivo é o único
 * vocabulário, e `docs/DESIGN-SYSTEM.md` §4 já o especificava desde agosto.
 *
 * SELECIONADO É PRETO CHEIO, e a razão não é gosto. Branco sobre o laranja da
 * marca mede 2,64:1 e reprova o mínimo de 4,5:1; a tinta sobre o papel mede
 * 21:1 no escuro e 18,7:1 no claro. O chip preto também deixa o laranja livre
 * para significar só AÇÃO, que é o princípio 2 do design system.
 *
 * A CONTAGEM É SEMPRE O ÚLTIMO FILHO. Não é detalhe de layout: o portão de
 * `/play` lê `chip.innerText.match(/(\d+)\s*$/)` para conferir que o número
 * anunciado bate com o número entregue. Soldar a posição na primitiva é o que
 * impede que a próxima tela quebre esse contrato sem ninguém perceber.
 *
 * VARIANTE EXPLORAR. O filtrador de seção (ícone + rótulo + contagem numa
 * pastilha larga) não é outra primitiva: é o mesmo chip, com o mesmo
 * `aria-pressed` e a mesma contagem no fim. A pílula continua o padrão; o
 * cartão é o recorte que a pessoa EXPLORA, não o atalho que ela dispara.
 */

type VarianteChip = "pilula" | "explorar";

type PropsComuns = {
  /**
   * A contagem opcional, renderizada como último nó de texto do chip.
   * Aceita nó para casos como «3 de 113», que o portão de /play lê inteiro.
   */
  contagem?: ReactNode;
  /** Vira `data-denominador` no span da contagem, os portões procuram por ele. */
  chaveDaContagem?: string;
  /**
   * O NOME DO TOKEN de cor vindo do dado (`"--ic-lilas"`), nunca um hex e nunca
   * uma cor decidida aqui. Mesmo mecanismo de `selo-linguagem.tsx`: a cor de
   * linguagem é DADO, e um mapa linguagem→cor em TypeScript seria a segunda
   * fonte de verdade que D-08 existe para impedir.
   */
  cor?: string;
  /**
   * `pilula` é o padrão (atalho, critério marcado, recorte curto).
   * `explorar` é o explorador: ícone à esquerda, rótulo e contagem empilhados.
   */
  variante?: VarianteChip;
  children: ReactNode;
  className?: string;
};

type PropsBotao = PropsComuns &
  Omit<ComponentPropsWithoutRef<"button">, "children" | "className" | "color"> & {
    /** Vira `aria-pressed`. O desenho sai do atributo de acessibilidade, nunca de
     *  uma classe paralela, assim não há como o visual e o anunciado divergirem. */
    selecionado?: boolean;
    href?: never;
  };

type PropsLink = PropsComuns &
  Omit<ComponentPropsWithoutRef<typeof Link>, "children" | "className" | "href" | "color"> & {
    /** Chip que NAVEGA em vez de recortar. Sem `aria-pressed`: não é um estado
     *  de filtro, é um destino, e anunciá-lo como alternável seria mentira. */
    href: string;
    selecionado?: never;
  };

export type PropsChip = PropsBotao | PropsLink;

/**
 * Se o primeiro filho é um SVG, ele é o glifo; o resto é o rótulo.
 * Passar o ícone como filho (e não como prop) deixa o cartão usável a partir
 * de um Server Component, JSX nomeado na prop não atravessa a fronteira.
 */
function partirIcone(children: ReactNode): { icone: ReactNode; rotulo: ReactNode } {
  const itens = Children.toArray(children);
  // Qualquer elemento no primeiro filho é o glifo (`<Icone>` ou `<svg>`).
  // `type === "svg"` falhava: os glifos da casa são o componente `Icone`.
  if (itens.length >= 2 && isValidElement(itens[0])) {
    return { icone: itens[0], rotulo: itens.slice(1) };
  }
  return { icone: null, rotulo: children };
}

function Miolo({
  cor,
  contagem,
  chaveDaContagem,
  children,
  variante = "pilula",
}: PropsComuns) {
  const n =
    contagem != null ? (
      <span className="chip-n" data-denominador={chaveDaContagem}>
        {contagem}
      </span>
    ) : null;

  if (variante === "explorar") {
    const { icone, rotulo } = partirIcone(children);
    return (
      <>
        {icone ? (
          <span className="chip-glifo" aria-hidden>
            {icone}
          </span>
        ) : cor ? (
          <span aria-hidden className="chip-ponto" />
        ) : null}
        <span className="chip-texto">
          <span className="chip-rotulo">{rotulo}</span>
          {n}
        </span>
      </>
    );
  }

  return (
    <>
      {cor ? <span aria-hidden className="chip-ponto" /> : null}
      <span className="chip-rotulo">{children}</span>
      {n}
    </>
  );
}

export function Chip(props: PropsChip) {
  const { contagem, chaveDaContagem, cor, children, className, variante = "pilula", ...resto } =
    props;
  const classe = `chip${variante === "explorar" ? " chip-explorar" : ""}${className ? ` ${className}` : ""}`;
  const estilo = cor ? ({ "--cor-chip": `var(${cor})` } as CSSProperties) : undefined;
  const miolo = (
    <Miolo
      cor={cor}
      contagem={contagem}
      chaveDaContagem={chaveDaContagem}
      variante={variante}
    >
      {children}
    </Miolo>
  );

  if ("href" in resto && resto.href) {
    const { selecionado: _naoUsado, ...deLink } = resto as PropsLink;
    return (
      <Link {...deLink} className={classe} style={estilo}>
        {miolo}
      </Link>
    );
  }

  const { selecionado, ...deBotao } = resto as PropsBotao;
  return (
    <button
      type="button"
      // `selecionado ?? false` e não `selecionado || undefined`: omitir o
      // atributo faria o portão de /play ler `null` onde espera a string
      // "false", e um leitor de tela deixaria de anunciar que o chip é
      // alternável. Um chip sem estado anunciado é um botão mudo.
      aria-pressed={selecionado ?? false}
      {...deBotao}
      className={classe}
      style={estilo}
    >
      {miolo}
    </button>
  );
}

/**
 * O trilho: uma fileira que ROLA na horizontal em vez de quebrar linha.
 *
 * Na visão web ele volta a quebrar linha, lá há largura de sobra e rolagem
 * horizontal seria pior. Isso mora no CSS, sob `[data-view="web"]`, e não num
 * ramo de JavaScript: mesma árvore de JSX, outra medida (D-05).
 *
 * `setas` desenha os botões circulares de avançar/voltar, o mesmo recado
 * visual da máscara, em controle. Só aparece quando a fileira realmente
 * transborda; sem overflow o botão mentiria que há mais.
 */
export function TrilhoDeChips({
  rotulo,
  children,
  className,
  setas = false,
  ...resto
}: { rotulo: string; setas?: boolean } & Omit<ComponentPropsWithoutRef<"div">, "className"> & {
    className?: string;
  }) {
  const trilho = useRef<HTMLDivElement>(null);
  const arrasto = useRef<{ x: number; scroll: number } | null>(null);
  const arrastou = useRef(false);
  const [mais, setMais] = useState({ atras: false, frente: false });

  useEffect(() => {
    if (!setas) return;
    const el = trilho.current;
    if (!el) return;
    const medir = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setMais({
        atras: scrollLeft > 4,
        frente: scrollLeft + clientWidth < scrollWidth - 4,
      });
    };
    medir();
    el.addEventListener("scroll", medir, { passive: true });
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", medir);
      ro.disconnect();
    };
  }, [setas, children]);

  function rolar(direcao: -1 | 1) {
    const el = trilho.current;
    if (!el) return;
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({
      left: direcao * Math.max(el.clientWidth * 0.7, 1),
      behavior: reduzir ? "auto" : "smooth",
    });
  }

  const miolo = (
    <div
      ref={trilho}
      role="group"
      aria-label={rotulo}
      className={`trilho-chips${className ? ` ${className}` : ""}`}
      onPointerDown={(e) => {
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        arrasto.current = { x: e.clientX, scroll: trilho.current?.scrollLeft ?? 0 };
        arrastou.current = false;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!arrasto.current || !trilho.current) return;
        const dx = e.clientX - arrasto.current.x;
        if (Math.abs(dx) > 6) arrastou.current = true;
        trilho.current.scrollLeft = arrasto.current.scroll - dx;
      }}
      onPointerUp={() => {
        arrasto.current = null;
      }}
      onPointerCancel={() => {
        arrasto.current = null;
      }}
      onClickCapture={(e) => {
        if (!arrastou.current) return;
        e.preventDefault();
        e.stopPropagation();
        arrastou.current = false;
      }}
      {...resto}
    >
      {children}
    </div>
  );

  if (!setas) return miolo;

  return (
    <div className="trilho-chips-caixa">
      {miolo}
      {mais.atras ? (
        <button
          type="button"
          className="trilho-chips-seta trilho-chips-seta-tras"
          aria-label="Ver as opções anteriores"
          onClick={() => rolar(-1)}
        >
          {ICONE_CHEVRON_ESQUERDA}
        </button>
      ) : null}
      {mais.frente ? (
        <button
          type="button"
          className="trilho-chips-seta trilho-chips-seta-frente"
          aria-label="Ver as próximas opções"
          onClick={() => rolar(1)}
        >
          {ICONE_CHEVRON_DIREITA}
        </button>
      ) : null}
    </div>
  );
}

/** Porta à direita da estante, só existe quando leva a algum lugar. */
export type PortaDaEstante =
  | { href: string; rotulo: string }
  | { onClick: () => void; rotulo: string };

/**
 * O painel do explorador: título, porta opcional («Ver todas» só quando há
 * destino), trilho com seta. Sem porta o recorte inteiro já está no trilho,
 * inventar um «ver todas» que não leva a lugar nenhum seria mentira.
 */
export function Estante({
  titulo,
  rotulo,
  verTodas,
  children,
  className,
}: {
  titulo: string;
  rotulo: string;
  verTodas?: PortaDaEstante;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  if (Children.count(children) === 0) return null;
  return (
    <section
      className={`estante${className ? ` ${className}` : ""}`}
      aria-labelledby={id}
    >
      <div className="estante-cabeca">
        <p id={id} className="estante-titulo">
          {titulo}
        </p>
        {verTodas ? (
          "href" in verTodas ? (
            <Link href={verTodas.href} className="estante-ver">
              {verTodas.rotulo}
              {ICONE_CHEVRON_DIREITA}
            </Link>
          ) : (
            <button type="button" className="estante-ver" onClick={verTodas.onClick}>
              {verTodas.rotulo}
              {ICONE_CHEVRON_DIREITA}
            </button>
          )
        ) : null}
      </div>
      <TrilhoDeChips rotulo={rotulo} className="trilho-chips-rola" setas>
        {children}
      </TrilhoDeChips>
    </section>
  );
}
