"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ICONE_ACONTECE,
  ICONE_CHEVRON_DIREITA,
  ICONE_CHEVRON_ESQUERDA,
  ICONE_FILTROS,
  ICONE_MAPA,
  ICONE_RELOGIO,
  ICONE_SALVOS,
} from "@/componentes/base/icones";
import { OpcaoDeSegmento, Segmento } from "@/componentes/base/segmento";
import { CapaDeCartao, CapaSemImagem } from "@/componentes/capa-sem-imagem";
import { PublicadoPeloProdutor } from "@/componentes/publicado-pelo-produtor";
import { linguagemPorId, SelosDeLinguagem } from "@/componentes/selo-linguagem";
import type { Agenda, DiaDaAgenda, EventoDaAgenda } from "@/dados/agenda";
import type { MapaDaAgenda } from "@/dados/mapa-agenda";
import {
  expandirItem,
  expandirPino,
  type IdDoRecorte,
} from "@/dados/mapa-agenda-wire";

/**
 * acontece.tsx — a agenda como LISTA DE EVENTOS (D-53), e a faixa que navega dias que
 * existem (D-55), e o passado mostrado como passado (D-54).
 *
 * ESTA É A TELA ONDE A DECISÃO DE MODELAGEM CENTRAL DA PROPOSTA FICA VISÍVEL. Evento e
 * ocorrência são registros próprios: um espetáculo com 53 sessões aparece UMA vez, com
 * «53 sessões» no cartão, e não 53 vezes na rolagem. Se esta lista pudesse repetir um
 * título, o produto teria virado catálogo de calendário — que é exatamente o que a
 * ontologia foi desenhada para não ser. A estrutura torna isso impossível: os dias
 * guardam ÍNDICES para dentro de `agenda.eventos`, e o agrupamento por índice acontece
 * antes de qualquer renderização.
 *
 * ESTE COMPONENTE NÃO CALCULA A AGENDA. `montarAgenda` rodou no BUILD, em componente de
 * servidor, e o que atravessou a fronteira RSC foi o DTO de 192 KB. Trocar de dia aqui é
 * trocar um índice: sem navegação, sem busca, sem travessia. É o mesmo padrão que a fase
 * 2 fixou em `feed.tsx`, e é o que faz a demonstração ao vivo ser instantânea.
 *
 * DP-F: nenhuma linha deste arquivo conhece `@/dados/grafo`. O tipo vem de
 * `@/dados/agenda` por `import type`, que é apagado na compilação e não arrasta módulo
 * nenhum. Os 23 MB do grafo ficam do lado de lá da fronteira.
 *
 * NENHUM RELÓGIO DE RUNTIME (T-03-04). «Hoje» é `agenda.hoje`, a data do build, e está
 * escrita na tela — um «passado» calculado contra uma data que o leitor não conhece é
 * pior do que nenhuma informação.
 *
 * Distância em tempo (tela 8) continua de fora: exigiria a localização de quem usa e o
 * espaço da sessão, e o acervo não publica o segundo em 2.425 de 2.425 sessões — qualquer
 * distância seria inventada. O atalho de filtros aponta para `/filtros/`, que existe.
 */

// ---------------------------------------------------------------------------
// Datas e números, sem Intl, sem fuso e sem locale
// ---------------------------------------------------------------------------

/**
 * As três funções abaixo são exportadas para `selecao-ocorrencia.tsx` usar as MESMAS.
 * Duas telas desta fase escrevem data na tela; duas cópias do formatador divergiriam na
 * primeira correção — e a data é justamente o eixo em que D-48 proíbe qualquer desvio.
 *
 * Elas repetem a lógica que `lista-ocorrencias.tsx` já tem porque aquele arquivo as
 * mantém privadas e é somente leitura para este plano. Importá-las de `@/dados/agenda`,
 * onde a formatação de número já existe, arrastaria `grafo.ts` para o pacote do cliente e
 * quebraria DP-F — a fronteira vale mais do que a duplicação.
 */

const DIAS = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

const DIAS_CURTOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const MESES_CURTOS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

function partesDaData(iso: string) {
  const [data, resto = ""] = iso.split("T");
  const [ano, mes, dia] = data.split("-").map(Number);
  const hora = resto.slice(0, 5);
  // `Date.UTC` só para saber o dia da semana. Nada de fuso local entra na conta.
  const indiceSemana = new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
  return { ano, mes, dia, hora, semana: DIAS[indiceSemana], semanaCurta: DIAS_CURTOS[indiceSemana] };
}

/** «sábado, 27 de agosto de 2026, 20h» — a forma que a fase 2 já usa na página do evento. */
export function porExtenso(iso: string): string {
  const { ano, mes, dia, hora, semana } = partesDaData(iso);
  const base = `${semana}, ${dia} de ${MESES[mes - 1]} de ${ano}`;
  return hora ? `${base}, ${hora.replace(":", "h")}` : base;
}

/** «27.08.2026». */
export function curta(iso: string): string {
  const { ano, mes, dia } = partesDaData(iso);
  return `${String(dia).padStart(2, "0")}.${String(mes).padStart(2, "0")}.${ano}`;
}

export function pedacosDoDia(iso: string) {
  return partesDaData(iso);
}

/** «22 de agosto de 2026» — a data de referência por extenso, sem o dia da semana. */
export function dataPorExtenso(iso: string): string {
  const { ano, mes, dia } = partesDaData(iso);
  return `${dia} de ${MESES[mes - 1]} de ${ano}`;
}

/** «22 AGO 2026». A caixa alta sai do CSS (`text-transform`), para «sáb» virar «SÁB». */
export function dataAgenda(iso: string): string {
  const { ano, mes, dia } = partesDaData(iso);
  return `${dia} ${MESES_CURTOS[mes - 1]} ${ano}`;
}

/** «11h00». */
export function horaAgenda(hhmm: string): string {
  return hhmm.replace(":", "h");
}

function rotulosDeLinguagem(ids: string[]): string {
  return ids
    .map(linguagemPorId)
    .filter((l): l is NonNullable<typeof l> => Boolean(l))
    .map((l) => l.rotulo)
    .join(" · ");
}

/**
 * Milhar com ponto. `Intl.NumberFormat` dependeria do ICU do ambiente e o texto do HTML
 * exportado tem de ser o mesmo byte a byte em qualquer máquina que rode o build.
 */
export function milhar(n: number): string {
  const bruto = String(Math.trunc(Math.abs(n)));
  let saida = "";
  for (let i = 0; i < bruto.length; i++) {
    if (i > 0 && (bruto.length - i) % 3 === 0) saida += ".";
    saida += bruto[i];
  }
  return n < 0 ? `-${saida}` : saida;
}

export function plural(n: number, singular: string, plural: string): string {
  return `${milhar(n)} ${n === 1 ? singular : plural}`;
}

// ---------------------------------------------------------------------------
// O selo de gratuidade — a afirmação mais delicada desta tela depois da data
// ---------------------------------------------------------------------------

/**
 * O acervo marca 2.425 de 2.425 sessões como gratuitas, e isso NÃO é uma afirmação de
 * entrada franca: no gerador, `gratuito` é a negação de um campo de ingresso do CMS que
 * nenhum dos 300 eventos declara. Gratuidade aqui é AUSÊNCIA DE INGRESSO DECLARADO.
 *
 * Um selo escrito «gratuito», sozinho, afirmaria sobre eventos reais um fato que a fonte
 * nunca disse — a mesma classe de defeito que D-48 proíbe no eixo da data (T-03-01). Por
 * isso a qualificação viaja DENTRO do selo, e não numa nota de rodapé que a foto do slide
 * não pega. O texto é um só, exportado, e aparece igual nas duas telas desta fase.
 */
export const SELO_GRATUIDADE = "gratuito — sem ingresso declarado na fonte";

// ---------------------------------------------------------------------------
// Lente para o mapa (D-59)
// ---------------------------------------------------------------------------

/**
 * O recorte do dia atravessa para `/mapa` no HASH, e não em query string: sob
 * `output: "export"` (D-24) não existe servidor para ler `?`, e um parâmetro de busca
 * simplesmente não chegaria do outro lado.
 *
 * A gramática é contrato desta fase e está escrita igual nos planos 03-01, 03-03 e 03-04:
 *   `r` — ids de entidade no formato `{classe}_{slug}` da fase 2, juntados por `~`
 *   `t` — o título legível do recorte
 *   `v` — o endereço de volta, com o hash de estado de QUEM CHAMA
 *
 * O mapa não sabe nada sobre Acontece: quem chama carrega o próprio endereço de volta.
 */
function hashDeLente(recorte: string[], titulo: string, volta: string): string {
  const r = recorte.map(encodeURIComponent).join("~");
  return `/mapa/#r=${r}&t=${encodeURIComponent(titulo)}&v=${encodeURIComponent(volta)}`;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

interface EventoDoDia {
  evento: EventoDaAgenda;
  /** `HH:MM` das sessões deste evento NESTE dia. No acervo carregado é sempre uma. */
  horas: string[];
}

export function Acontece({ agenda, mapa }: { agenda: Agenda; mapa: MapaDaAgenda }) {
  const { dias, eventos, janelaSugerida, diagnostico } = agenda;

  /* ---------------------------------------------------------------------
   * O ESTADO DA VISÃO WEB (D-80, D-81).
   *
   * UM ÚNICO `parRealcado`, e os dois lados apenas o LEEM. Dois estados — um para a
   * lista e outro para o mapa, sincronizados um contra o outro — divergem no primeiro
   * caso de borda, e o sintoma é o realce que fica preso aceso depois que o cursor já
   * saiu. Com um estado só, a divergência é impossível por construção.
   *
   * `modoLista` é o recorte ativo, e o alternador entre os dois É a declaração honesta
   * de D-90 virada controle: «por data» são os 129 eventos com sessão, e o mapa ao lado
   * declara com o denominador que 0 deles pode ser posto no mapa; «por lugar» são os 158
   * situados, onde o par existe e a sincronia é real nos dois sentidos.
   *
   * NENHUM DOS DOIS LÊ A VISÃO. Não existe um ramo em JavaScript decidindo o que
   * renderizar por `data-view`: o conteúdo sai pronto no artefato estático (D-02) e quem
   * decide o layout é o CSS sob `[data-view="web"]` e `[data-view="mobile"]` (D-79).
   * ------------------------------------------------------------------- */
  const [parRealcado, setParRealcado] = useState<string | null>(null);
  const [modoLista, setModoLista] = useState<IdDoRecorte>("lugar");

  const realcar = useCallback((par: string | null) => setParRealcado(par), []);

  const recorte = mapa.recortes.find((r) => r.id === modoLista) ?? mapa.recortes[0];
  const itensDoRecorte = useMemo(() => recorte.itens.map(expandirItem), [recorte]);
  const pinosDoRecorte = useMemo(() => recorte.pinos.map(expandirPino), [recorte]);

  /* Os denominadores da declaração de D-90. Nenhum deles é literal: todos vêm da
   * contagem feita no build por `mapa-agenda.ts`, que quebra o build se a interseção
   * medida deixar de ser a que esta frase afirma. */
  const denominadores = [
    { chave: "com-sessao", n: mapa.interseccao.comSessao, rotulo: "com sessão datada" },
    { chave: "com-lugar", n: mapa.interseccao.comLugar, rotulo: "com lugar no acervo" },
    { chave: "com-os-dois", n: mapa.interseccao.comOsDois, rotulo: "com as duas coisas" },
    { chave: "no-desenho", n: mapa.interseccao.comLugarNoDesenho, rotulo: "no mapa ao lado" },
    {
      chave: "fora-do-desenho",
      n: mapa.interseccao.comLugarForaDoDesenho,
      rotulo: "com lugar fora do Brasil",
    },
  ];

  const indicePorData = useMemo(
    () => new Map(dias.map((d, i) => [d.data, i])),
    [dias],
  );

  const visiveis = Math.max(1, janelaSugerida.diasNoRecorte);
  /** Dias passados que ficam no DOM à esquerda do escolhido — D-54 precisa vê-los, a
   *  tela mostra o escolhido primeiro e eles entram pelo gesto à esquerda. */
  const FOLGA_PASSADO = 8;

  /** O dia escolhido abre a faixa: passado fica à esquerda, futuro à direita. */
  const enquadrar = useCallback(
    (indice: number) => Math.min(Math.max(0, dias.length - visiveis), Math.max(0, indice)),
    [dias.length, visiveis],
  );

  /* A primeira renderização usa o dia da REFERÊNCIA, nunca o hash: sob `output: "export"`
   * o HTML é gerado no build, e ler `location` no primeiro render divergiria da
   * hidratação. A leitura do hash mora no efeito abaixo, que só roda no cliente — é o
   * mesmo padrão que `visao.tsx` fixou na fase 1 e `sessao.tsx` na fase 2. */
  const [diaSelecionado, setDiaSelecionado] = useState<string>(
    dias[janelaSugerida.indiceDeHoje]?.data ?? dias[0]?.data ?? "",
  );
  const [inicioFaixa, setInicioFaixa] = useState<number>(janelaSugerida.indiceDeHoje);

  useEffect(() => {
    const aplicar = () => {
      const achado = /(?:^#|[#&])dia=(\d{4}-\d{2}-\d{2})/.exec(window.location.hash);
      const candidato = achado?.[1];
      if (!candidato) return;
      /* T-03-02: o hash é digitável por quem avalia. Dia que não existe na lista do DTO é
       * IGNORADO e a tela fica no dia de referência — em vez de propagar uma data
       * desconhecida para dentro da lista e produzir uma tela vazia na demonstração. É o
       * mesmo tratamento que `personaIdValido` deu ao storage em 02-01. */
      const indice = indicePorData.get(candidato);
      if (indice === undefined) return;
      setDiaSelecionado(candidato);
      setInicioFaixa(enquadrar(indice));
    };
    aplicar();
    window.addEventListener("hashchange", aplicar);
    return () => window.removeEventListener("hashchange", aplicar);
  }, [indicePorData, enquadrar]);

  const selecionar = useCallback((data: string) => {
    setDiaSelecionado(data);
    /* O dia espelha no hash para o recorte sobreviver à ida e à volta do mapa e a um
     * recarregar. `replaceState` e não `pushState`: escolher dia é filtrar, não navegar,
     * e encher o histórico faria o botão «voltar» do navegador desfazer cliques de
     * filtro em vez de sair da tela. */
    try {
      window.history.replaceState(null, "", `#dia=${data}`);
    } catch {
      // Contexto sem history acessível (arquivo local, iframe restrito): espelhar o
      // recorte é conveniência, não requisito da tela.
    }
  }, []);

  const dia: DiaDaAgenda | undefined =
    dias[indicePorData.get(diaSelecionado) ?? janelaSugerida.indiceDeHoje];

  /**
   * Os eventos do dia, agrupados por evento. O agrupamento é o que garante D-53 na
   * renderização e não só no dado: mesmo que um evento tivesse duas sessões no mesmo dia,
   * ele continuaria produzindo UM cartão, com as duas horas dentro.
   */
  const eventosDoDia: EventoDoDia[] = useMemo(() => {
    if (!dia) return [];
    const porIndice = new Map<number, string[]>();
    dia.eventos.forEach((indice, posicao) => {
      const horas = porIndice.get(indice);
      if (horas) horas.push(dia.horas[posicao]);
      else porIndice.set(indice, [dia.horas[posicao]]);
    });
    return [...porIndice.entries()]
      .map(([indice, horas]) => ({ evento: eventos[indice], horas: [...horas].sort() }))
      .filter((e): e is EventoDoDia => Boolean(e.evento))
      .sort((a, b) =>
        a.horas[0] < b.horas[0]
          ? -1
          : a.horas[0] > b.horas[0]
            ? 1
            : a.evento.slug < b.evento.slug
              ? -1
              : 1,
      );
  }, [dia, eventos]);

  const faixa = dias.slice(
    Math.max(0, inicioFaixa - FOLGA_PASSADO),
    inicioFaixa + visiveis,
  );
  const anoDeReferencia = agenda.hoje.slice(0, 4);
  const faixaEl = useRef<HTMLDivElement>(null);
  const [destaqueIndice, setDestaqueIndice] = useState(0);

  const destaques = useMemo(() => {
    const comImagem = eventosDoDia.filter((e) => e.evento.imagem);
    return (comImagem.length ? comImagem : eventosDoDia).slice(0, 5);
  }, [eventosDoDia]);

  useEffect(() => {
    setDestaqueIndice(0);
  }, [diaSelecionado]);

  useEffect(() => {
    const el = faixaEl.current;
    const chip = el?.querySelector(`[data-dia="${diaSelecionado}"]`);
    if (!el || !(chip instanceof HTMLElement)) return;
    const alinhar = () => {
      const esquerda =
        chip.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft;
      el.scrollLeft = Math.max(0, esquerda);
    };
    alinhar();
    const quadro = requestAnimationFrame(alinhar);
    return () => cancelAnimationFrame(quadro);
  }, [diaSelecionado, inicioFaixa]);

  const avancarFaixa = useCallback(
    (dir: -1 | 1) => {
      const el = faixaEl.current;
      if (!el) return;
      const chip = el.querySelector(".dia-chip");
      const passo = chip instanceof HTMLElement ? chip.offsetWidth + 8 : 72;
      const noInicio = el.scrollLeft <= 2;
      const noFim = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
      if (dir < 0 && noInicio) {
        setInicioFaixa((i) => Math.max(0, i - 1));
        return;
      }
      if (dir > 0 && noFim) {
        setInicioFaixa((i) => Math.min(Math.max(0, dias.length - visiveis), i + 1));
        return;
      }
      el.scrollBy({ left: dir * passo, behavior: "smooth" });
    },
    [dias.length, visiveis],
  );

  const destaque = destaques[Math.min(destaqueIndice, Math.max(0, destaques.length - 1))];

  const lente = dia
    ? hashDeLente(
        eventosDoDia.map((e) => `evento_${e.evento.slug}`),
        `${porExtenso(dia.data)} · ${plural(dia.totalEventos, "evento", "eventos")}`,
        `/acontece/#dia=${dia.data}`,
      )
    : "/mapa/";

  return (
    <div className="flex flex-col gap-5 p-5 desk:p-8">
      {/* ================================================================== */}
      {/* 1 — ENQUADRAMENTO. Só o nome da tela e a porta dos filtros: a       */}
      {/*     contagem do acervo e a data de referência saíram do cabeçalho,  */}
      {/*     e quem quiser o denominador o encontra nos recortes da visão    */}
      {/*     web, onde ele é argumento e não nota de rodapé.                 */}
      {/* ================================================================== */}
      <header className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className="tipo-titulo-1 font-bold">Acontece</h1>
          <Link href="/filtros/" className="acontece-filtros">
            {ICONE_FILTROS}
            Filtros
          </Link>
        </div>
      </header>

      {/* O QUE ESTE NAVEGADOR PUBLICOU pelo Studio. Fica ACIMA do conteúdo do build e
          declara que não está no acervo: o protótipo é um artefato estático e não tem
          servidor para receber publicação. Sem este bloco, a jornada de oito atos do
          produtor terminaria no vazio — ele aperta publicar e a agenda não muda. */}
      <PublicadoPeloProdutor pauta="agenda" titulo="Publicado por você nesta demonstração" />

      {/* ================================================================== */}
      {/* A VISÃO WEB — lista e mapa lado a lado, sincronizados (D-79, D-80,   */}
      {/*   D-81). MESMO COMPONENTE, mesma árvore de JSX. Não existe um        */}
      {/*   `AconteceWeb` irmão, e não existe ramo em JavaScript lendo a visão */}
      {/*   para decidir o que renderizar (D-05, D-02): quem apaga este bloco  */}
      {/*   na visão app é uma regra de CSS em `acontece-web.css`, e o         */}
      {/*   conteúdo sai pronto no artefato estático.                          */}
      {/* ================================================================== */}
      <section data-acontece-web className="acontece-web">
        <div className="acontece-web-topo">
          {/* O ALTERNADOR É A DECLARAÇÃO DE D-90 VIRADA CONTROLE. Ele não é um
              filtro de conveniência: cada recorte responde uma pergunta que o
              acervo sustenta, e a diferença entre as duas é o achado da tela. */}
          <Segmento rotulo="Recorte da lista">
            {mapa.recortes.map((r) => (
              <OpcaoDeSegmento
                key={r.id}
                data-modo-lista={r.id}
                selecionado={r.id === modoLista}
                onClick={() => {
                  setModoLista(r.id);
                  // O realce morre com a troca de recorte: a chave acesa pode não
                  // existir do outro lado, e um realce preso num pino que sumiu é o
                  // sintoma clássico de estado que sobreviveu ao próprio conjunto.
                  setParRealcado(null);
                }}
              >
                {`${r.rotulo} · ${milhar(r.total)}`}
              </OpcaoDeSegmento>
            ))}
          </Segmento>
        </div>

        {/* D-90. TEXTO DE PRODUTO: é a resposta da tela ao que o acervo não
            sustenta. Nenhum destes números é literal —
            todos vêm da contagem feita no build, e `mapa-agenda.ts` derruba o
            build se a interseção medida deixar de ser a que esta frase afirma. */}
        <div data-interseccao className="web-declaracao acontece-web-interseccao">
          <p className="acontece-web-interseccao-texto">{mapa.interseccao.texto}</p>
          <ul className="web-denominadores">
            {denominadores.map((d) => (
              <li key={d.chave} className="web-denominador" data-denominador={d.chave}>
                <span className="web-denominador-numero">{milhar(d.n)}</span>
                <span className="web-denominador-rotulo">{d.rotulo}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="web-duas-colunas acontece-web-colunas">
          {/* ---------------- A COLUNA DA LISTA ---------------- */}
          <div className="acontece-web-coluna-lista">
            <div className="acontece-web-cabecalho-lista">
              <h2 className="web-painel-titulo">{`${recorte.rotulo} · ${plural(recorte.total, "evento", "eventos")}`}</h2>
              {/* 05-06 cria esta rota nesta mesma onda. Ela não existe enquanto a
                  onda corre e o export estático não valida href interno; quem prova
                  que ela resolve é o gate de 05-08. */}
              <a href="/filtros/" className="acontece-web-atalho">
                Filtrar este acervo
              </a>
            </div>

            <ul className="web-lista-densa" data-lista-recorte={recorte.id}>
              {itensDoRecorte.map((item) => (
                <li
                  key={item.slug}
                  data-item-lista=""
                  data-par={item.par}
                  data-mapeavel={item.mapeavel ? "sim" : "nao"}
                  data-motivo-sem-pino={
                    item.mapeavel ? null : item.lugar ? "fora-do-desenho" : "sem-lugar"
                  }
                  /* SEMPRE «sim» OU «nao», nunca ausente. Um item que não pode ser
                     realçado precisa dizer isso positivamente: atributo ausente é
                     indistinguível de atributo que ninguém escreveu. */
                  data-realcado={item.par !== null && item.par === parRealcado ? "sim" : "nao"}
                  className="web-linha web-realce"
                  onMouseEnter={() => realcar(item.par)}
                  onMouseLeave={() => realcar(null)}
                  /* Cursor não é o único apontador. Os itens já são links, então o
                     foco de teclado percorre a lista sozinho — e a mesma sincronia
                     acontece por Tab, sem uma linha de código a mais no mapa. */
                  onFocus={() => realcar(item.par)}
                  onBlur={() => realcar(null)}
                >
                  <Link href={item.rota} className="web-linha-titulo no-underline">
                    {item.titulo}
                  </Link>
                  <span className="web-linha-meta">
                    {item.mapeavel
                      ? `${item.lugar} · pino no ${item.via === "espaco" ? "espaço" : "centroide do território"}`
                      : item.lugar
                        ? `${item.lugar} — fora do contorno do Brasil, sem pino neste desenho`
                        : "sem lugar no acervo — este registro traz data e nenhum território"}
                  </span>
                  {item.totalSessoes > 0 ? (
                    <span className="web-linha-meta">
                      {`${plural(item.totalSessoes, "sessão", "sessões")}${
                        item.proximaSessao
                          ? ` · a próxima ${porExtenso(item.proximaSessao)}`
                          : ""
                      }`}
                    </span>
                  ) : null}
                  {item.linguagens.length ? (
                    <SelosDeLinguagem ids={[...item.linguagens]} limite={2} />
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          {/* ---------------- A COLUNA DO MAPA ---------------- */}
          {/* Desenhado AQUI, e não por `<Mapa>`: aquele componente carrega lente por
              hash, camada de desertos e legenda de agrupamento que esta tela não
              quer. O contorno e os pinos já vieram projetados de `mapa-agenda.ts`. */}
          <div className="web-painel web-colada acontece-web-coluna-mapa">
            <h2 className="web-painel-titulo">
              {`${plural(recorte.mapeaveis, "pino", "pinos")} de ${milhar(recorte.total)}`}
            </h2>
            <svg
              data-mapa-acontece=""
              viewBox={mapa.viewBox}
              className="web-mapa acontece-web-svg"
              role="img"
              aria-label={mapa.rotuloContorno}
            >
              <path d={mapa.contorno} className="acontece-web-contorno" />
              {pinosDoRecorte.map((p) => (
                <circle
                  key={p.par}
                  data-pino=""
                  data-par={p.par}
                  data-realcado={p.par === parRealcado ? "sim" : "nao"}
                  className="web-realce acontece-web-pino"
                  cx={p.x}
                  cy={p.y}
                  /* Raio maior no realce. É o que faz um pino de 3 px se destacar
                     no meio de outros 109 sem precisar de cor nova. */
                  r={p.par === parRealcado ? 5 : 3}
                  onMouseEnter={() => realcar(p.par)}
                  onMouseLeave={() => realcar(null)}
                />
              ))}
            </svg>
            <p className="acontece-web-declaracao-mapa">{recorte.declaracao}</p>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 2 — A FAIXA DE DATAS (D-55). Montada da lista `dias`, que só contém */}
      {/*     dias com sessão. Dia vazio não existe aqui por construção.      */}
      {/* ================================================================== */}
      <section className="flex flex-col gap-2">
        <div className="faixa-dias-envolve">
          <button
            type="button"
            className="dia-seta"
            aria-label="Dias anteriores"
            onClick={() => avancarFaixa(-1)}
          >
            {ICONE_CHEVRON_ESQUERDA}
          </button>

          <div
            ref={faixaEl}
            className="faixa-dias"
            role="group"
            aria-label="Dias com sessão no acervo"
          >
            {faixa.map((d) => {
              const p = pedacosDoDia(d.data);
              return (
                <button
                  key={d.data}
                  type="button"
                  data-dia={d.data}
                  data-tempo={d.tempo}
                  aria-pressed={d.data === diaSelecionado}
                  aria-label={`${porExtenso(d.data)} — ${plural(d.totalEventos, "evento", "eventos")}, ${
                    d.tempo === "passado"
                      ? "sessões já realizadas"
                      : d.tempo === "hoje"
                        ? "data de referência"
                        : "sessões ainda por acontecer"
                  }`}
                  onClick={() => selecionar(d.data)}
                  className="dia-chip"
                >
                  <span className="dia-chip-semana">{p.semanaCurta}</span>
                  <span className="dia-chip-data">{p.dia}</span>
                  <span className="dia-chip-mes">
                    {MESES_CURTOS[p.mes - 1]}
                    {String(p.ano) === anoDeReferencia ? "" : ` ${p.ano}`}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="dia-seta"
            aria-label="Dias seguintes"
            onClick={() => avancarFaixa(1)}
          >
            {ICONE_CHEVRON_DIREITA}
          </button>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 3 e 4 — O DIA SELECIONADO E A LISTA DE EVENTOS (D-53 e D-54).       */}
      {/* ================================================================== */}
      {dia ? (
        <section className="flex flex-col gap-4">
          <div className="acontece-dia-barra">
            {/* `<a>` e não `<Link>`: `trailingSlash: true` faz o Link reescrever
                `/mapa#…` como `/mapa/#…`, e a gramática do hash é contrato de fase. */}
            <a href={lente} className="acontece-mapa">
              {ICONE_MAPA}
              Ver este dia no mapa
            </a>
          </div>

          {dia.tempo === "passado" ? (
            <p className="tipo-legenda text-tinta-2">
              {`Este dia já passou: as ${milhar(diagnostico.sessoesPassadas)} sessões passadas continuam na tela.`}
            </p>
          ) : null}

          {destaque ? (
            <div>
              <article className="destaque-agenda">
                <Link
                  href={`/evento/${destaque.evento.slug}/`}
                  className="destaque-agenda-link"
                >
                  {destaque.evento.imagem ? (
                    // `images.unoptimized` sob output: "export" — o arquivo já está em public/acervo.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={destaque.evento.imagem}
                      alt={destaque.evento.titulo}
                      loading="lazy"
                      decoding="async"
                      className="destaque-agenda-foto"
                    />
                  ) : (
                    <CapaSemImagem
                      titulo={destaque.evento.titulo}
                      classe={destaque.evento.classe}
                      linguagens={destaque.evento.linguagens}
                      className="destaque-agenda-foto"
                    />
                  )}
                  <span className="destaque-agenda-veu" aria-hidden />
                  <span className="destaque-agenda-corpo">
                    <span className="destaque-agenda-selo">Evento</span>
                    <h2>{destaque.evento.titulo}</h2>
                    {rotulosDeLinguagem(destaque.evento.linguagens) ? (
                      <p className="destaque-agenda-sub">
                        {rotulosDeLinguagem(destaque.evento.linguagens)}
                      </p>
                    ) : null}
                    <p className="destaque-agenda-meta">
                      <span>
                        {ICONE_ACONTECE}
                        {dataAgenda(dia.data)}
                      </span>
                      <span>
                        {ICONE_RELOGIO}
                        {destaque.horas.map(horaAgenda).join(" e ")}
                      </span>
                      <span>
                        {plural(destaque.evento.totalSessoes, "sessão", "sessões")}
                      </span>
                    </p>
                  </span>
                </Link>
                <Link
                  href={`/evento/${destaque.evento.slug}/sessoes/`}
                  className="destaque-agenda-salvar"
                  aria-label={`Escolher sessão de ${destaque.evento.titulo} para salvar`}
                >
                  {ICONE_SALVOS}
                </Link>
              </article>
              {destaques.length > 1 ? (
                <div
                  className="destaque-agenda-pontos"
                  role="group"
                  aria-label="Eventos em destaque neste dia"
                >
                  {destaques.map((item, i) => (
                    <button
                      key={item.evento.slug}
                      type="button"
                      aria-current={i === destaqueIndice ? "true" : undefined}
                      aria-label={`Mostrar ${item.evento.titulo}`}
                      className="destaque-agenda-ponto"
                      onClick={() => setDestaqueIndice(i)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {eventosDoDia.length ? (
            <ul className="flex flex-col gap-3">
              {eventosDoDia.map(({ evento, horas }) => (
                <li key={evento.slug}>
                  <article
                    className="cartao-agenda"
                    data-evento={evento.slug}
                    data-sessoes={evento.totalSessoes}
                  >
                    <Link
                      href={`/evento/${evento.slug}/`}
                      className="cartao-agenda-capa no-underline"
                    >
                      <CapaDeCartao
                        titulo={evento.titulo}
                        classe={evento.classe}
                        linguagens={evento.linguagens}
                        imagem={evento.imagem ?? undefined}
                        className="size-full"
                      />
                    </Link>

                    <div className="cartao-agenda-corpo">
                      <div className="cartao-agenda-topo">
                        <Link
                          href={`/evento/${evento.slug}/`}
                          className="min-w-0 flex-1 no-underline"
                        >
                          <h3>{evento.titulo}</h3>
                        </Link>
                        <Link
                          href={`/evento/${evento.slug}/sessoes/`}
                          className="cartao-agenda-salvar"
                          aria-label={`Escolher sessão de ${evento.titulo} para salvar`}
                        >
                          {ICONE_SALVOS}
                        </Link>
                      </div>

                      <p className="cartao-agenda-meta">
                        <span>
                          {ICONE_ACONTECE}
                          {dataAgenda(dia.data)}
                        </span>
                        <span>
                          {ICONE_RELOGIO}
                          {horas.map(horaAgenda).join(" e ")}
                        </span>
                      </p>

                      <p className="contagem-sessoes">
                        <strong>{plural(evento.totalSessoes, "sessão", "sessões")}</strong>
                      </p>

                      <p className="cartao-agenda-pills">
                        {dia.tempo === "passado" ? (
                          <span className="selo-acervo" data-tom="passado">
                            já aconteceu
                          </span>
                        ) : null}
                        {evento.gratuitas > 0 ? (
                          <>
                            <span className="selo-acervo">Gratuito</span>
                            <span className="selo-acervo">Sem ingresso</span>
                          </>
                        ) : null}
                      </p>

                      <Link
                        href={`/evento/${evento.slug}/sessoes/`}
                        className="cartao-agenda-escolher"
                      >
                        Escolher sessão ›
                      </Link>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-borda p-3 tipo-legenda leading-relaxed text-tinta-2">
              Nenhum evento neste dia. Escolha outro na faixa acima.
            </p>
          )}
        </section>
      ) : null}

    </div>
  );
}
