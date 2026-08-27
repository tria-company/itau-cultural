import type { ReactNode } from "react";

/**
 * base/barra-de-acao.tsx, a ação primária no pé, dentro do telefone.
 *
 * `absolute` CONTRA A MOLDURA, NUNCA `fixed`. Dentro da moldura de 390px o `fixed` escapa
 * para a largura da janela: a barra iria parar no rodapé do navegador, atravessada por cima
 * do aparelho, e a ilusão de D-03 quebraria. O único `fixed` legítimo do projeto mora no
 * `.canto` de `casca.tsx`. A fase 3 já pagou por esse erro uma vez.
 *
 * O CONTEÚDO PAGA O ESPAÇO DELA. `.prod-tela` reserva 6rem de `padding-bottom` justamente
 * por isto: sem a reserva, o último campo do formulário fica embaixo do botão que o submete,
 * e a pessoa rola até o fim sem nunca alcançar aquele campo. É um defeito que não aparece em
 * nenhuma captura, só em quem tenta usar.
 *
 * NA WEB ELA VOLTA PARA O FLUXO. A divergência é CSS puro sob `[data-view="web"]`: a janela
 * é alta, e uma faixa grudada no pé de 960px é um padrão de telefone posto onde não resolve
 * nada. Mesma árvore JSX, `position: static` do outro lado (D-05).
 *
 * COMPONENTE DE SERVIDOR, sem estado. Ele é montado dentro de telas que são de cliente e
 * viaja no pacote delas; o que ele não arrasta junto é dado.
 */
export function BarraDeAcao({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className ? `prod-barra-acao ${className}` : "prod-barra-acao"} data-barra-acao>
      {children}
    </div>
  );
}

/**
 * O botão do vocabulário do Studio.
 *
 * `data-primaria` E NÃO UMA CLASSE A MAIS. A distinção entre primário e secundário é um
 * ESTADO do botão, não um tipo diferente de botão: um atributo de dado deixa o CSS
 * responder por ele sem multiplicar classes, e é o que a sonda lê para conferir que existe
 * exatamente uma ação primária por tela.
 *
 * O TÍTULO É OBRIGATÓRIO QUANDO ESTÁ DESABILITADO. Um botão cinza sem explicação é a forma
 * mais rápida de fazer alguém achar que o produto travou. Quem desabilita diz por quê.
 */
export function BotaoDoStudio({
  children,
  primaria = false,
  curto = false,
  desabilitado = false,
  porQueDesabilitado,
  aoClicar,
  tipo = "button",
  ...resto
}: {
  children: ReactNode;
  primaria?: boolean;
  curto?: boolean;
  desabilitado?: boolean;
  /** Obrigatório na prática quando `desabilitado`: vira o `title` e o `aria-description`. */
  porQueDesabilitado?: string;
  aoClicar?: () => void;
  tipo?: "button" | "submit";
} & Record<`data-${string}`, string | undefined>) {
  return (
    <button
      type={tipo}
      className="prod-botao"
      data-primaria={primaria ? "sim" : "nao"}
      data-porte={curto ? "curto" : undefined}
      disabled={desabilitado}
      title={desabilitado ? porQueDesabilitado : undefined}
      onClick={aoClicar}
      {...resto}
    >
      {children}
    </button>
  );
}
