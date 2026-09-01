import { Grafismo } from "@/componentes/grafismo";

/**
 * esqueleto.tsx — as primitivas de estado de esqueleto.
 *
 * Nesta fase o esqueleto É o conteúdo legítimo: as 18 rotas de D-12 existem e navegam,
 * mas nenhuma tela de conteúdo foi entregue. Por isso o esqueleto merece ser componente
 * e não `div` improvisada em cada página — as fases 2 a 6 substituem o miolo sem mexer
 * na moldura da tela.
 *
 * Toda primitiva aceita um rótulo textual do que virá ali. Uma rota que não explica o que
 * vai ser é indistinguível de uma rota quebrada durante a apresentação.
 */

export function EsqueletoLinha({
  largura = "100%",
  className,
}: {
  largura?: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      style={{ width: largura }}
      className={`block h-3 animate-pulse rounded-full bg-superficie-2 ${className ?? ""}`}
    />
  );
}

export function EsqueletoBloco({
  altura = "8rem",
  rotulo,
  className,
}: {
  altura?: string;
  rotulo?: string;
  className?: string;
}) {
  return (
    <div
      style={{ height: altura }}
      className={`flex animate-pulse items-center justify-center rounded-xl bg-superficie-2 px-3 text-center text-xs font-medium text-tinta-3 ${className ?? ""}`}
    >
      {rotulo}
    </div>
  );
}

/**
 * O cartão é a unidade de conteúdo do produto — evento, obra, artista, vídeo, trilha.
 * Aqui ele aparece vazio, com o nome do que ocupará o lugar.
 */
export function EsqueletoCartao({
  rotulo,
  linhas = 2,
  className,
}: {
  rotulo: string;
  linhas?: number;
  className?: string;
}) {
  return (
    <article
      className={`flex gap-3 rounded-xl border border-borda bg-superficie p-3 ${className ?? ""}`}
    >
      <EsqueletoBloco altura="4.5rem" className="w-20 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
        <p className="truncate text-sm font-semibold text-tinta-2">{rotulo}</p>
        {Array.from({ length: linhas }, (_, i) => (
          <EsqueletoLinha key={i} largura={i === linhas - 1 ? "60%" : "92%"} />
        ))}
      </div>
    </article>
  );
}

/** Lista de cartões de esqueleto — o corpo padrão de quase toda tela desta fase. */
export function EsqueletoLista({
  rotulos,
  className,
}: {
  rotulos: string[];
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-3 ${className ?? ""}`}>
      {rotulos.map((rotulo) => (
        <EsqueletoCartao key={rotulo} rotulo={rotulo} />
      ))}
    </div>
  );
}

/**
 * A casca de uma tela em esqueleto: nome da tela, uma linha do objetivo tirada de
 * `docs/telas.md`, a camada de corte (C1/C2/C3, PRD §14) e o miolo.
 *
 * O `\` marca o título, que é o uso que o manual faz do grafismo (D-11).
 */
export function TelaEsqueleto({
  nome,
  objetivo,
  acoes,
  rodape,
  children,
}: {
  nome: string;
  /** Ausente nas telas que deixaram de ser esqueleto — ver o parágrafo abaixo. */
  objetivo?: string;
  acoes?: React.ReactNode;
  /**
   * As mesmas ações, mas DEPOIS do conteúdo.
   *
   * Numa tela de escolha, o botão de avançar no cabeçalho fica acima daquilo que ele
   * confirma: a pessoa lê «Avançar» antes de ver o que há para escolher. No fim ele é o
   * passo seguinte de verdade, e é o que a mão alcança depois de percorrer a grade.
   */
  rodape?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 p-5 desk:mx-auto desk:max-w-5xl desk:p-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">{nome}</h1>
        </div>
        {/* A linha de objetivo é NOTA DE ESQUELETO: ela existe para dizer o que aquele
            lugar vai ser quando existir. Numa tela que já é o produto, ela vira uma
            explicação de si mesma logo acima do que se explica sozinho — por isso é
            opcional, e some junto com o esqueleto. */}
        {objetivo ? <p className="max-w-prose text-sm text-tinta-2">{objetivo}</p> : null}
        {acoes ? <div className="flex flex-wrap gap-2 pt-1">{acoes}</div> : null}
      </header>
      {children}
      {rodape ? <div className="onb-rodape">{rodape}</div> : null}
    </div>
  );
}
