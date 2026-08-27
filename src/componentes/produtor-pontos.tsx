"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePontos } from "@/componentes/pontos-estado";
import { useProdutor } from "@/componentes/produtor-estado";
import { DESCRICAO_DA_PAUTA, semTravessao } from "@/dados/tipos-produtor";
import type { ContextoDoProdutor, Registro } from "@/dados/tipos-produtor";

/**
 * produtor-pontos.tsx, a loja de pontos: o que o cuidado com o dado vale.
 *
 * OS PONTOS NÃO SÃO INVENTADOS, E É O PONTO DA TELA. Cada um sai de uma coisa que este
 * produto argumenta a demonstração inteira: publicar com crédito na foto, com descrição
 * alternativa, com a ficha de acessibilidade resolvida e com resumo escrito. Um placar que
 * premiasse volume premiaria exatamente o comportamento que enche a vitrine de cartão sem
 * resumo, que é a lacuna que o mapa do produto mede.
 *
 * ELES SÃO RECALCULADOS DO ESTADO, NUNCA GUARDADOS. Guardar um saldo criaria uma segunda
 * verdade: bastaria alguém apagar o crédito de uma foto para o placar continuar contando
 * um ponto que o registro deixou de merecer. O que o armazém guarda é só o que foi
 * RESGATADO, que é decisão, não medida.
 *
 * AS RECOMPENSAS SÃO DECLARADAS. Não há loja atrás disto: resgatar marca o item neste
 * navegador e desconta o saldo, e a tela diz que é assim.
 */

interface RegraDePonto {
  id: string;
  rotulo: string;
  valor: number;
  /** Quem pontua. Recebe o registro publicado. */
  vale: (r: Registro) => boolean;
}

const REGRAS: RegraDePonto[] = [
  {
    id: "publicado",
    rotulo: "registro no ar",
    valor: 20,
    vale: () => true,
  },
  {
    id: "credito",
    rotulo: "foto com crédito de quem a fez",
    valor: 10,
    vale: (r) => (r.imagem?.credito ?? "").trim() !== "",
  },
  {
    id: "alt",
    rotulo: "imagem com descrição para quem não vê",
    valor: 10,
    vale: (r) => (r.imagem?.alt ?? "").trim() !== "",
  },
  {
    id: "acessibilidade",
    rotulo: "ficha de acessibilidade resolvida",
    valor: 15,
    vale: (r) => r.declaraAcessibilidade,
  },
  {
    id: "resumo",
    rotulo: "resumo escrito para a vitrine",
    valor: 5,
    vale: (r) => r.resumo.trim().length >= 20,
  },
];

interface Recompensa {
  id: string;
  rotulo: string;
  descricao: string;
  custo: number;
}

const LOJA: Recompensa[] = [
  {
    id: "destaque",
    rotulo: "Destaque na vitrine",
    descricao: "Sete dias em posição de topo em Descobrir.",
    custo: 120,
  },
  {
    id: "selo",
    rotulo: "Selo de ficha completa",
    descricao: "A marca que diz que nada foi declarado em silêncio.",
    custo: 200,
  },
  {
    id: "mentoria",
    rotulo: "Sessão de curadoria",
    descricao: "Uma hora com a equipe editorial sobre a sua programação.",
    custo: 320,
  },
  {
    id: "impulso",
    rotulo: "Impulso na busca",
    descricao: "Prioridade de ordenação por trinta dias.",
    custo: 480,
  },
];

/** A cada 250 pontos, um nível. É o único número redondo da tela, e ele é declarado. */
const PONTOS_POR_NIVEL = 250;

export function LojaDePontos({
  semente,
  contexto,
}: {
  semente: Registro[];
  contexto: ContextoDoProdutor;
}) {
  const armazem = useProdutor(semente, contexto);
  const { pronto, resgatados, resgatar, devolver } = usePontos();

  const publicados = useMemo(
    () => armazem.registros.filter((r) => r.situacao === "publicado"),
    [armazem.registros],
  );

  const porRegra = useMemo(
    () =>
      REGRAS.map((regra) => {
        const quantos = publicados.filter((r) => regra.vale(r)).length;
        return { regra, quantos, pontos: quantos * regra.valor };
      }),
    [publicados],
  );

  const ganhos = porRegra.reduce((n, p) => n + p.pontos, 0);
  const gastos = LOJA.filter((r) => resgatados.includes(r.id)).reduce((n, r) => n + r.custo, 0);
  /**
   * PISO EM ZERO, e a razão é que os dois lados não têm a mesma vida: `ganhos` é
   * recalculado dos registros a cada render, `gastos` fica gravado. Despublicar um
   * registro depois de resgatar derruba os ganhos sem devolver o que foi gasto, e o saldo
   * ia a negativo. Saldo negativo não é uma dívida neste produto, é um número que não
   * significa nada; a legenda abaixo continua mostrando os dois lados sem arredondar.
   */
  const saldo = Math.max(0, ganhos - gastos);

  const nivel = Math.floor(ganhos / PONTOS_POR_NIVEL) + 1;
  const noNivel = ganhos % PONTOS_POR_NIVEL;
  const faltam = PONTOS_POR_NIVEL - noNivel;

  // O que daria mais pontos agora: a regra que mais registros publicados deixam na mesa.
  const aMelhorar = porRegra
    .filter((p) => p.regra.id !== "publicado" && p.quantos < publicados.length)
    .map((p) => ({ ...p, faltando: publicados.length - p.quantos }))
    .sort((a, b) => b.faltando * b.regra.valor - a.faltando * a.regra.valor);

  if (!armazem.pronto || !pronto) {
    return (
      <div className="prod-corpo">
        <p className="prod-nota">Lendo o que está gravado neste navegador…</p>
      </div>
    );
  }

  return (
    <>
      <header className="prod-cabecalho">
        <div className="prod-cabecalho-linha">
          <Link href="/studio/" className="prod-superficie prod-voltar" data-voltar-studio>
            ‹ Studio
          </Link>
          <span className="prod-contagem">nível {nivel}</span>
        </div>
        <h1 className="prod-titulo">Loja de pontos</h1>
      </header>

      <div className="prod-corpo prod-painel" data-loja-de-pontos>
        {/* ---- o saldo ---- */}
        <section className="prod-secao" aria-labelledby="prod-pontos-saldo">
          <h2 className="prod-secao-titulo" id="prod-pontos-saldo">
            Seu saldo
          </h2>
          <div className="prod-desempenho-numero">
            <strong data-saldo-de-pontos={String(saldo)}>{saldo}</strong>
            <span className="prod-desempenho-delta">pontos</span>
          </div>
          <span className="prod-desempenho-legenda">
            {ganhos} ganhos{gastos > 0 ? `, ${gastos} resgatados` : ""}
          </span>
          <div className="prod-nivel-barra" aria-hidden>
            <span
              className="prod-nivel-cheio"
              style={{ width: `${Math.round((noNivel / PONTOS_POR_NIVEL) * 100)}%` }}
            />
          </div>
          <span className="prod-grafico-legenda">
            faltam {faltam} para o nível {nivel + 1}
          </span>
        </section>

        {/* ---- de onde vêm ---- */}
        <section className="prod-secao" aria-labelledby="prod-pontos-regras">
          <h2 className="prod-secao-titulo" id="prod-pontos-regras">
            De onde vêm
          </h2>
          <div className="prod-conta">
            {porRegra.map((p) => (
              <div className="prod-conta-linha" key={p.regra.id}>
                <span className="prod-conta-rotulo">
                  {p.regra.rotulo}
                  <span className="prod-regra-valor">
                    {p.quantos} × {p.regra.valor}
                  </span>
                </span>
                <span className="prod-conta-valor">{p.pontos}</span>
              </div>
            ))}
          </div>
          <p className="prod-campo-nota">
            Os pontos premiam o cuidado com o dado, não o volume: crédito, descrição
            alternativa, acessibilidade declarada e resumo escrito.
          </p>
        </section>

        {/* ---- o que dá para melhorar ---- */}
        {aMelhorar.length > 0 ? (
          <section className="prod-secao" aria-labelledby="prod-pontos-melhorar">
            <h2 className="prod-secao-titulo" id="prod-pontos-melhorar">
              Onde ganhar mais
            </h2>
            {aMelhorar.slice(0, 3).map((p) => (
              <div className="prod-ganhar" key={p.regra.id}>
                <span className="prod-ganhar-valor">+{p.faltando * p.regra.valor}</span>
                <span className="prod-ganhar-texto">
                  {p.faltando}{" "}
                  {p.faltando === 1 ? "registro publicado ainda não tem" : "registros publicados ainda não têm"}{" "}
                  {p.regra.rotulo}
                </span>
              </div>
            ))}
          </section>
        ) : null}

        {/* ---- a loja ---- */}
        <section className="prod-secao" aria-labelledby="prod-pontos-loja">
          <h2 className="prod-secao-titulo" id="prod-pontos-loja">
            Resgatar
          </h2>
          {LOJA.map((r) => {
            const jaTem = resgatados.includes(r.id);
            const podeResgatar = saldo >= r.custo;
            return (
              <div
                className="prod-recompensa"
                key={r.id}
                data-recompensa={r.id}
                data-resgatada={jaTem ? "sim" : "nao"}
              >
                <span className="prod-recompensa-texto">
                  <strong>{r.rotulo}</strong>
                  <span className="prod-recompensa-descricao">{r.descricao}</span>
                </span>
                <span className="prod-recompensa-acao">
                  <span className="prod-recompensa-custo">{r.custo}</span>
                  {jaTem ? (
                    <button
                      type="button"
                      className="prod-botao"
                      data-porte="curto"
                      onClick={() => devolver(r.id)}
                      data-devolver-recompensa={r.id}
                    >
                      Devolver
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="prod-botao"
                      data-porte="curto"
                      disabled={!podeResgatar}
                      title={
                        podeResgatar
                          ? undefined
                          : `Faltam ${r.custo - saldo} pontos para esta recompensa.`
                      }
                      onClick={() => resgatar(r.id, r.custo, saldo)}
                      data-resgatar={r.id}
                    >
                      Resgatar
                    </button>
                  )}
                </span>
              </div>
            );
          })}
          <p className="prod-campo-nota">
            {semTravessao(
              "Resgatar marca a recompensa neste navegador e desconta o saldo. Não há loja atrás disto: o que a tela prova é a mecânica.",
            )}
          </p>
        </section>

        {/* ---- onde os pontos nasceram ---- */}
        {publicados.length === 0 ? (
          <div className="prod-vazio">
            <p className="prod-vazio-frase">
              Nada publicado ainda. Os pontos nascem quando o primeiro registro vai ao ar,
              e crescem com o que ele declara.
            </p>
          </div>
        ) : (
          <p className="prod-grafico-legenda">
            {publicados.length}{" "}
            {publicados.length === 1 ? "registro no ar" : "registros no ar"} em{" "}
            {new Set(publicados.map((r) => DESCRICAO_DA_PAUTA[r.pauta].rotulo)).size} pautas
          </p>
        )}
      </div>
    </>
  );
}
