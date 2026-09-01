"use client";

import Link from "next/link";
import { ICONE_MAPA } from "./base/icones";
import { useMemo, useState } from "react";
import { Chip, TrilhoDeChips } from "@/componentes/base/chip";
import { Grafismo } from "@/componentes/grafismo";
import {
  consultar,
  expandirIndice,
  facetasDe,
  type Criterio,
  type IndiceDTO,
  type OpcaoFaceta,
} from "@/dados/indice";
import type {
  AcessibilidadeDTO,
  CriterioSemLastro,
  DimensaoContada,
  NumerosDosFiltros,
  ResumoDaFicha,
} from "@/dados/filtros";
import type { EstadoDeFiltro, MunicipioDeFiltro } from "@/dados/localizacao";
import type { TrilhaResumo } from "@/dados/trilha";
import type { DimensaoAcessibilidade } from "@/dados/tipos";

/**
 * filtros.tsx — Filtros ontológicos (`docs/telas.md` tela 9, APPX-01, D-91, D-90, D-43).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A DECISÃO QUE ESTA TELA É
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Acessibilidade como FILTRO, e não como selo mostrado depois, é a diferença entre uma
 * plataforma que informa e uma que serve. Quem precisa de Libras precisa poder PEDIR
 * Libras — não descobrir, depois de escolher o evento e a sessão, que não tinha
 * intérprete. Por isso as 8 dimensões vivem na MESMA coluna, com o MESMO peso visual, que
 * linguagem e território. Esse posicionamento é o argumento; uma frase dizendo «também nos
 * importamos com acessibilidade» não seria.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * AS TRÊS RECUSAS, E POR QUE CADA UMA TEM UMA FORMA DIFERENTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. AS CINCO DIMENSÕES QUE MEDEM ZERO ficam na tela e ficam MARCÁVEIS. Escondê-las
 *    apagaria o diagnóstico — que é: a acessibilidade está catalogada em oito dimensões e
 *    documentada em uma e meia. Esse diagnóstico é argumento da proposta. Cada uma declara
 *    o seu zero COM o denominador antes de ser marcada, e marcá-la explica o vazio em vez
 *    de mostrar uma tela em branco.
 *
 * 2. GRATUIDADE não vira controle: o campo existe e NÃO DISCRIMINA. Zero de 300 eventos
 *    declaram ingresso, então as 2.425 sessões saem todas gratuitas e o filtro passaria
 *    100% do que é datado. A fase 3 já recusou a faceta em `/buscar` pelo mesmo motivo, e
 *    aqui o raciocínio é repetido, não reinventado.
 *
 * 3. FAIXA ETÁRIA não vira controle porque O CAMPO NÃO EXISTE — nem no CMS, nem na
 *    Enciclopédia, nem nos 7.810 registros. `disposicoes.ts` já registrou essa decisão por
 *    escrito e o predicado de lá devolve `indeterminado` de propósito. A tela 9 pede faixa
 *    etária, e a resposta honesta é dizer que ela não existe: é mais forte do que um
 *    seletor que devolve tudo.
 *
 * Três ausências, três formas. Colapsá-las num «não temos esse filtro» apagaria o que cada
 * uma diz sobre a fonte.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * O QUE ESTA TELA NÃO FINGE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `Criterio` de `indice.ts` tem seis campos e acessibilidade NÃO é um deles. O recorte de
 * acessibilidade, portanto, NÃO VIAJA para `/buscar/`. A escolha aqui é mostrar o
 * resultado NESTA tela, com o recorte inteiro aplicado, e oferecer a ida a `/buscar/`
 * DIZENDO, com o número, o que se perde no caminho. Levar a pessoa para uma tela que
 * silenciosamente devolve mais resultados do que ela pediu seria pior do que não oferecer
 * o botão.
 *
 * DP-F: este arquivo não alcança `@/dados/grafo`, nem transitivamente. De `@/dados/filtros`
 * ele importa SÓ TIPO — aquele módulo carrega o grafo por valor. O DTO de acessibilidade
 * desce por propriedade do componente de servidor de `/filtros`, e são 12,7 KB de
 * contagens, nunca entidade.
 *
 * NENHUMA POSIÇÃO ANCORADA NA JANELA: dentro da moldura de 390px da visão app, `fixed`
 * escaparia do telefone (D-03). O estilo mora em `src/estilos/filtros.css`.
 */

// ---------------------------------------------------------------------------
// Constantes de tela
// ---------------------------------------------------------------------------

/** Quantos resultados a prévia lista. O TOTAL REAL fica sempre declarado ao lado. */
const TETO_PREVIA = 40;

/** Quantas opções de cada faceta a coluna oferece. São 33 linguagens e 359 territórios. */
const TETO_LINGUAGENS = 12;
const TETO_TERRITORIOS = 10;

function milhar(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Marca a ficha: `sim` só o que declarou, `nao` só o que nunca declarou, `` qualquer. */
type RecorteDeFicha = "" | "declara" | "nao-declara";

export interface FiltrosProps {
  /** Estados brasileiros do acervo, cada um com os municípios que ele tem. */
  estados: EstadoDeFiltro[];
  indice: IndiceDTO;
  acessibilidade: AcessibilidadeDTO;
  dimensoes: DimensaoContada[];
  ficha: ResumoDaFicha;
  semLastro: readonly CriterioSemLastro[];
  trilhas: readonly TrilhaResumo[];
  numeros: NumerosDosFiltros;
}

export function Filtros({
  estados,
  indice,
  acessibilidade,
  dimensoes,
  ficha,
  semLastro,
  trilhas,
  numeros,
}: FiltrosProps) {
  const [marcadas, setMarcadas] = useState<DimensaoAcessibilidade[]>([]);
  const [recorteDeFicha, setRecorteDeFicha] = useState<RecorteDeFicha>("");
  const [criterios, setCriterios] = useState<Criterio[]>([]);
  const [todasAsLinguagens, setTodasAsLinguagens] = useState(false);
  const [ufEscolhida, setUfEscolhida] = useState("");
  const [municipioEscolhido, setMunicipioEscolhido] = useState("");

  // ---- as estruturas de leitura do DTO, montadas UMA vez --------------------
  //
  // O DTO de acessibilidade é POSICIONAL contra o índice: a posição `i` dele é a entrada
  // `i` de `expandirIndice`. `filtros.ts` garante o alinhamento por construção e derruba o
  // build se ele se perder; aqui basta ler.
  const leitura = useMemo(() => {
    const entradas = expandirIndice(indice);
    const posicaoPorChave = new Map<string, number>();
    for (let i = 0; i < entradas.length; i += 1) posicaoPorChave.set(entradas[i].chave, i);
    return {
      posicaoPorChave,
      declaram: new Set(acessibilidade.declaram),
      bitsPorPosicao: new Map(acessibilidade.marcadas),
      bitPorCampo: new Map(acessibilidade.ordemDosBits.map((campo, b) => [campo, 1 << b])),
    };
  }, [indice, acessibilidade]);

  const facetas = useMemo(() => facetasDe({ criterios }, indice), [criterios, indice]);

  // ---- O CONTADOR AO VIVO ---------------------------------------------------
  //
  // Filtro linear em memória, a cada marcação, exatamente como `/buscar` faz a cada tecla:
  // sem navegação, sem rota nova, sem requisição. Linguagem e território passam pelo MOTOR
  // DE `indice.ts` — não há um segundo motor aqui —, e a acessibilidade entra como camada
  // sobre as posições que ele devolveu.
  const recorte = useMemo(() => {
    const resposta = consultar({ criterios }, indice);
    const alvo = marcadas.reduce(
      (bits, campo) => bits | (leitura.bitPorCampo.get(campo) ?? 0),
      0,
    );

    const chaves: string[] = [];
    for (const r of resposta.resultados) {
      const i = leitura.posicaoPorChave.get(r.chave);
      if (i === undefined) continue;
      if (alvo && ((leitura.bitsPorPosicao.get(i) ?? 0) & alvo) !== alvo) continue;
      if (recorteDeFicha === "declara" && !leitura.declaram.has(i)) continue;
      if (recorteDeFicha === "nao-declara" && leitura.declaram.has(i)) continue;
      chaves.push(r.chave);
    }

    const porChave = new Map(resposta.resultados.map((r) => [r.chave, r]));
    return {
      total: chaves.length,
      previa: chaves.slice(0, TETO_PREVIA).map((c) => porChave.get(c)!),
      semAcessibilidade: resposta.total,
    };
  }, [criterios, indice, leitura, marcadas, recorteDeFicha]);

  const zeradas = dimensoes.filter((d) => !d.sustentada);
  const criteriosAtivos =
    marcadas.length + criterios.length + (recorteDeFicha === "" ? 0 : 1);

  // ---- as ações -------------------------------------------------------------
  function alternarDimensao(campo: DimensaoAcessibilidade) {
    setMarcadas((atual) =>
      atual.includes(campo) ? atual.filter((c) => c !== campo) : [...atual, campo],
    );
  }

  function alternarFicha(valor: Exclude<RecorteDeFicha, "">) {
    // Os dois são EXCLUSIVOS entre si: pedir «só quem declarou» e «só quem não declarou»
    // ao mesmo tempo é pedir o conjunto vazio, e um controle que devolve vazio por
    // contradição é ruído, não critério.
    setRecorteDeFicha((atual) => (atual === valor ? "" : valor));
  }

  /**
   * Os municípios do estado escolhido. Vazio quando não há estado — e é ele que desabilita
   * o segundo campo, em vez de um booleano à parte que poderia divergir da lista.
   */
  const municipiosDaUf: MunicipioDeFiltro[] = useMemo(
    () => estados.find((uf) => uf.slug === ufEscolhida)?.municipios ?? [],
    [estados, ufEscolhida],
  );

  /**
   * ESTADO E MUNICÍPIO SÃO UM CRITÉRIO SÓ, não dois. Marcar os dois ao mesmo tempo pediria
   * ao motor a interseção de «Bahia» com «Salvador», que é sempre Salvador — e a tela
   * mostraria dois recortes concorrendo pela mesma pergunta. Escolher município SUBSTITUI
   * o estado no recorte; voltar para «todo o estado» devolve o estado.
   */
  function trocarTerritorio(valor: string, rotulo: string) {
    setCriterios((atual) => {
      const semTerritorio = atual.filter((c) => c.campo !== "territorio");
      return valor ? [...semTerritorio, { campo: "territorio", valor, rotulo }] : semTerritorio;
    });
  }

  function escolherUf(slug: string) {
    setUfEscolhida(slug);
    setMunicipioEscolhido("");
    const uf = estados.find((e) => e.slug === slug);
    trocarTerritorio(uf ? uf.slug : "", uf?.titulo ?? "");
  }

  function escolherMunicipio(slug: string) {
    setMunicipioEscolhido(slug);
    const m = municipiosDaUf.find((x) => x.slug === slug);
    if (m) {
      trocarTerritorio(m.slug, m.titulo);
      return;
    }
    const uf = estados.find((e) => e.slug === ufEscolhida);
    trocarTerritorio(uf ? uf.slug : "", uf?.titulo ?? "");
  }

  /** Quantas linguagens estão no recorte. O resumo da gaveta lê daqui. */
  const linguagensMarcadas = criterios.filter((c) => c.campo === "linguagem").length;

  function alternarCriterio(opcao: OpcaoFaceta) {
    setCriterios((atual) => {
      const ja = atual.find((c) => c.campo === opcao.campo && c.valor === opcao.valor);
      if (ja) return atual.filter((c) => c !== ja);
      return [...atual, { campo: opcao.campo, valor: opcao.valor, rotulo: opcao.rotulo }];
    });
  }

  function limparTudo() {
    setMarcadas([]);
    setRecorteDeFicha("");
    setCriterios([]);
    setUfEscolhida("");
    setMunicipioEscolhido("");
  }

  const marcado = (campo: DimensaoAcessibilidade) => marcadas.includes(campo);
  const criterioMarcado = (o: OpcaoFaceta) =>
    criterios.some((c) => c.campo === o.campo && c.valor === o.valor);

  // O endereço de `/buscar/` com o que o motor entende. A gramática é a da fase 3:
  // `#f=campo:valor~campo:valor`.
  const enderecoDeBusca = criterios.length
    ? `/buscar/#f=${criterios.map((c) => `${c.campo}:${c.valor}`).join("~")}`
    : "/buscar/";

  return (
    <div data-filtros className="filtros">
      {/* ---------------------------------------------------------------- */}
      {/* Cabeçalho e o contador ao vivo                                    */}
      {/* ---------------------------------------------------------------- */}
      <header className="filtros-topo">
        <div className="filtros-topo-linha">
          <h1 className="filtros-titulo">
            <Grafismo
              variacao="barra"
              className="h-3.5 w-auto shrink-0 text-acao-tinta"
            />
            Filtros
          </h1>

          <button
            type="button"
            data-limpar-filtros
            className="filtros-limpar"
            onClick={limparTudo}
            disabled={criteriosAtivos === 0}
          >
            limpar tudo
          </button>
        </div>

        {/* O total continua medido e continua no atributo, para os portões — ele só não
            ocupa a primeira linha da tela. Cobertura tem tela própria: o Observatório. */}
        <p data-contador-vivo={recorte.total} className="filtros-resumo" aria-live="polite">
          {criteriosAtivos === 0
            ? ""
            : `${criteriosAtivos} filtro${criteriosAtivos > 1 ? "s" : ""} aplicado${
                criteriosAtivos > 1 ? "s" : ""
              }`}
        </p>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* A COLUNA DOS CRITÉRIOS.                                             */}
      {/*                                                                     */}
      {/* Um DOM só para as duas visões (D-05: é proibido um componente irmão  */}
      {/* por visão). Na visão app este invólucro é uma coluna comum e a tela  */}
      {/* rola inteira dentro da moldura; na web ele vira `.web-coluna-fixa`   */}
      {/* de `web.css` — a coluna de facetas permanente de D-80, que cola no   */}
      {/* topo e ROLA POR DENTRO. A regra é de `web.css`, consumida aqui sem   */}
      {/* uma linha alterada lá: ela está CONGELADA desde 05-01.               */}
      {/* ------------------------------------------------------------------ */}
      <div className="filtros-criterios web-coluna-fixa" data-coluna-criterios>
      {/* ---------------------------------------------------------------- */}
      {/* 1. ONDE — o primeiro filtro, porque é a primeira pergunta         */}
      {/*                                                                    */}
      {/* Antes a tela abria por acessibilidade, que é a decisão editorial   */}
      {/* mais forte do produto — e continua na tela, logo abaixo. Mas a     */}
      {/* primeira coisa que alguém quer de uma agenda cultural é onde, e    */}
      {/* pôr o critério mais nobre na frente do mais usado troca a ordem    */}
      {/* do argumento pela ordem do uso.                                    */}
      {/* ---------------------------------------------------------------- */}
      <section className="filtros-bloco" data-bloco="localizacao">
        <h2 className="filtros-bloco-titulo">
          {ICONE_MAPA}
          Onde
        </h2>

        <div className="filtros-locais">
          <label className="filtros-local">
            <span className="filtros-local-rotulo">Estado</span>
            <select
              className="filtros-select"
              value={ufEscolhida}
              onChange={(e) => escolherUf(e.target.value)}
              data-filtro-uf
            >
              <option value="">Todo o Brasil</option>
              {estados.map((uf) => (
                <option key={uf.slug} value={uf.slug}>
                  {uf.titulo}
                </option>
              ))}
            </select>
          </label>

          <label className="filtros-local">
            <span className="filtros-local-rotulo">Município</span>
            <select
              className="filtros-select"
              value={municipioEscolhido}
              onChange={(e) => escolherMunicipio(e.target.value)}
              disabled={municipiosDaUf.length === 0}
              data-filtro-municipio
            >
              <option value="">
                {municipiosDaUf.length === 0 ? "Escolha um estado" : "Todo o estado"}
              </option>
              {municipiosDaUf.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.titulo}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 2. ACESSIBILIDADE — critério de primeira classe (D-91)            */}
      {/* ---------------------------------------------------------------- */}
      <section className="filtros-bloco" data-bloco="acessibilidade">
        <h2 className="filtros-bloco-titulo">Acessibilidade</h2>

        <p className="filtros-bloco-linha">
          Marque o que você precisa para conseguir aproveitar.
        </p>

        {/* DROPDOWN, E NÃO LISTA ABERTA. Oito dimensões abertas ocupavam meia tela para um
            critério que a maioria não usa — e empurravam linguagem para baixo da dobra.
            `<details>` é o controle nativo: abre e fecha sem JavaScript, o teclado já sabe
            operar, e o resumo diz quantas estão marcadas com a folha fechada. */}
        <details className="filtros-gaveta">
          <summary className="filtros-gaveta-topo">
            <span className="filtros-gaveta-rotulo">
              {marcadas.length === 0
                ? "Escolher recursos"
                : `${marcadas.length} recurso${marcadas.length > 1 ? "s" : ""} marcado${
                    marcadas.length > 1 ? "s" : ""
                  }`}
            </span>
          </summary>

          <ul className="filtros-dimensoes">
            {dimensoes.map((d) => (
              <li
                key={d.campo}
                className="filtros-dimensao"
                data-dimensao-acessibilidade={d.campo}
                {...(d.sustentada ? {} : { "data-nao-sustenta": `acessibilidade:${d.campo}` })}
              >
                <button
                  type="button"
                  aria-pressed={marcado(d.campo)}
                  className="filtros-marcavel"
                  onClick={() => alternarDimensao(d.campo)}
                >
                  <span className="filtros-marcavel-caixa" aria-hidden />
                  <span className="filtros-marcavel-rotulo">{d.rotulo}</span>
                  <span className="filtros-marcavel-n" data-denominador={d.campo}>
                    {milhar(d.declaradaVerdadeira)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </details>

      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 2. D-43 — declarado-ausente contra não-declarado                  */}
      
      {/* ---------------------------------------------------------------- */}
      {/* 3. Linguagem e território — as duas facetas que RECORTAM          */}
      {/* ---------------------------------------------------------------- */}
      <section className="filtros-bloco" data-bloco="ontologia">
        <h2 className="filtros-bloco-titulo">Linguagem</h2>

        {/* O TRILHO DE TERRITÓRIO SAIU (27.08): «Onde», no alto da tela, já recorta por
            estado e município, e dois controles para a mesma pergunta é a tela pedindo
            duas vezes a mesma coisa com respostas que podem discordar.

            E LINGUAGEM VIROU GAVETA. São 33 linguagens; em trilho horizontal, as que não
            cabem na primeira tela dependem de alguém adivinhar que aquilo rola. Aberta, a
            lista mostra todas de uma vez e o resumo conta quantas estão marcadas. */}
        <details className="filtros-gaveta">
          <summary className="filtros-gaveta-topo">
            <span className="filtros-gaveta-rotulo">
              {linguagensMarcadas === 0
                ? "Escolher linguagem"
                : `${linguagensMarcadas} linguagem${linguagensMarcadas > 1 ? "s" : ""} marcada${
                    linguagensMarcadas > 1 ? "s" : ""
                  }`}
            </span>
          </summary>

          <ul className="filtros-dimensoes">
            {facetas.linguagem.map((o) => (
              <li key={`${o.campo}:${o.valor}`} className="filtros-dimensao">
                <button
                  type="button"
                  aria-pressed={criterioMarcado(o)}
                  className="filtros-marcavel"
                  onClick={() => alternarCriterio(o)}
                >
                  <span className="filtros-marcavel-caixa" aria-hidden />
                  {/* A bolinha é pintada pelo CSS a partir do token do dado, do mesmo
                      jeito que `selo-linguagem.tsx` faz — a cor da linguagem é dado. */}
                  {o.cor ? (
                    <span
                      className="filtros-marcavel-cor"
                      style={{ background: `var(${o.cor})` }}
                      aria-hidden
                    />
                  ) : null}
                  <span className="filtros-marcavel-rotulo">{o.rotulo}</span>
                  <span className="filtros-marcavel-n">{milhar(o.n)}</span>
                </button>
              </li>
            ))}
          </ul>
        </details>
      </section>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* A COLUNA DA SAÍDA: o que o acervo não sustenta, e o recorte.        */}
      {/* ------------------------------------------------------------------ */}
      <div className="filtros-saida" data-coluna-saida>
      {/* ---------------------------------------------------------------- */}
      {/* 4. O que o acervo NÃO sustenta (D-90)                             */}
      
      {/* ---------------------------------------------------------------- */}
      {/* 5. O recorte, aqui mesmo — e o que NÃO viaja para /buscar         */}
      {/* A PRÉVIA DO RECORTE SAIU (27.08, pedido do cliente). Ela listava oito resultados
          e o total dentro da própria tela de filtros — dois lugares mostrando resultado,
          e o segundo sempre pela metade. Quem monta um recorte quer chegar aos resultados,
          não espiá-los. A ação de saída fica, e agora é a ação primária da tela. */}
      <div className="filtros-rodape">
        <Link href={enderecoDeBusca} className="filtros-ir-buscar no-underline">
          Ver resultados
        </Link>
      </div>
      </div>
    </div>
  );
}
