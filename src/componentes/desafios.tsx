"use client";

import { useState } from "react";
import Link from "next/link";
import { Moeda } from "@/componentes/pontos-base";
import { EstrelaXp } from "@/componentes/estrela-xp";
import { EstrelasDaMissao } from "@/componentes/estrelas-missao";
import { Grafismo } from "./grafismo";
import { SeloDeNivel } from "@/componentes/selo-nivel";
import { usePontos } from "@/contexto/pontos";
import { MISSOES } from "@/dados/pontos";
import { comprovacoesDe, vagasRestantes } from "@/lib/pontos/comprovacoes";
import { garantirEstado } from "@/lib/pontos/missoes";
import { rankingDaMissao } from "@/lib/pontos/ranking";
import { diaDaSemana } from "@/lib/pontos/relogio";
import type { EstadoDoMotor, MissaoDefinida, TipoDeMissao } from "@/lib/pontos/tipos";

const ETIQUETA: Record<TipoDeMissao, string> = {
  diaria: "Diária",
  semanal: "Semanal",
  social: "Comunidade",
  territorio: "Território",
  temporada: "Temporada",
  onboarding: "Primeiros passos",
  campo: "Campo",
};

/**
 * Os quatro estados do mockup, mais «Todas».
 *
 * «Em revisão» É UM ESTADO DE PRIMEIRA CLASSE, e não um detalhe do card. Quem
 * mandou prova e está esperando decisão precisa de um lugar onde ver isso sem
 * abrir missão por missão — sem esse filtro, a espera parece sumiço.
 */
const FILTROS = ["Todas", "Em andamento", "A fazer", "Em revisão", "Concluídas"] as const;
type Filtro = (typeof FILTROS)[number];

function situacaoDe(estado: EstadoDoMotor, missao: MissaoDefinida): Exclude<Filtro, "Todas"> {
  const emCurso = estado.missoes[missao.id];
  if (emCurso?.concluidaEm) return "Concluídas";

  const esperando = comprovacoesDe(estado, missao.id).some(
    (c) => c.fase === "enviada" || c.fase === "analisando" || c.fase === "em-moderacao",
  );
  if (esperando) return "Em revisão";

  return (emCurso?.progresso ?? 0) > 0 ? "Em andamento" : "A fazer";
}

/** Diária primeiro, depois a semana, depois a temporada — a ordem do dia. */
function ordenar(missoes: MissaoDefinida[]): MissaoDefinida[] {
  const peso: Record<MissaoDefinida["expiraEm"], number> = {
    dia: 0,
    semana: 1,
    ciclo: 2,
    temporada: 3,
    nunca: 4,
  };
  return [...missoes].sort((a, b) => peso[a.expiraEm] - peso[b.expiraEm]);
}

/**
 * O card de uma missão, na leitura de quatro colunas.
 *
 * A ORDEM É A DA PERGUNTA: onde eu estou (estrelas), o que é isso (título),
 * quanto paga (recompensas), quanto falta (progresso). Colocar a recompensa
 * antes do título faria a lista virar uma tabela de preços; colocar o progresso
 * antes de tudo faria a missão que ninguém começou parecer a mais importante.
 *
 * NUM APARELHO ESTREITO as quatro colunas viram duas linhas — o cabeçalho com
 * estrelas e recompensa, e o corpo com título e progresso. Nada é escondido no
 * caminho: uma coluna que some no celular é informação que só existe para quem
 * abre no computador.
 */
function Missao({ missao }: { missao: MissaoDefinida }) {
  const { motor, hidratado } = usePontos();
  const emCurso = garantirEstado(motor.atual, missao);
  const concluida = hidratado && Boolean(emCurso.concluidaEm);
  const progresso = hidratado ? emCurso.progresso : 0;
  const fracao = missao.alvo === 0 ? 0 : Math.min(1, progresso / missao.alvo);
  const restantes = hidratado ? vagasRestantes(motor.atual, missao) : undefined;
  const situacao = hidratado ? situacaoDe(motor.atual, missao) : "A fazer";

  const posicao =
    hidratado && missao.ranking
      ? rankingDaMissao(motor.atual, missao, motor.catalogo.pessoas).find((l) => l.eu)?.posicao
      : undefined;

  // A recompensa mostrada é a que a pessoa recebe NO PRÓXIMO GESTO: numa
  // cumulativa que paga por envio, anunciar só o prêmio final esconde os pontos
  // que caem hoje e faz a missão parecer mais distante do que é.
  const premio = missao.porEnvio ?? { percurso: missao.percurso, fichas: missao.fichas };

  return (
    <article className="missao-linha" data-concluida={concluida ? "sim" : "nao"}>
      <EstrelasDaMissao progresso={progresso} alvo={missao.alvo} concluida={concluida} />

      <div className="missao-corpo">
        <h3 className="tipo-detalhe font-bold">{missao.titulo}</h3>
        <p className="tipo-legenda text-tinta-2">{missao.descricao}</p>
        <div className="missao-etiquetas">
          <span className="missao-etiqueta">{ETIQUETA[missao.tipo]}</span>
          {missao.prova === "midia" && (
            <span className="missao-etiqueta" data-cor="prova">
              foto
            </span>
          )}
          {restantes !== undefined && (
            <span className="missao-etiqueta" data-cor="vagas">
              {restantes.toLocaleString("pt-BR")} vagas
            </span>
          )}
          {situacao === "Em revisão" && (
            <span className="missao-etiqueta" data-cor="revisao">
              em revisão
            </span>
          )}
        </div>
      </div>

      <div className="missao-recompensa">
        <span className="tipo-legenda text-tinta-3">RECOMPENSA</span>
        <span className="premio-fichas">
          <span className="premio-chip" data-ativo="percurso">
            <EstrelaXp />+{premio.percurso}
          </span>
          {premio.fichas > 0 && (
            <span className="premio-chip" data-ativo="ficha">
              <Moeda />+{premio.fichas}
            </span>
          )}
        </span>
        {missao.porEnvio && (
          <span className="tipo-micro text-tinta-3">por envio aprovado</span>
        )}
      </div>

      <div className="missao-estado">
        {concluida ? (
          <span className="missao-selo-feita">
            <span aria-hidden="true">✓</span> Concluída
          </span>
        ) : (
          <span className="missao-trilho-barra">
            <span
              className="missao-trilho-preenchimento"
              style={{ width: `${fracao * 100}%` }}
            />
            <span className="missao-trilho-numero">
              {progresso}/{missao.alvo}
            </span>
          </span>
        )}

        {posicao !== undefined && (
          <span className="tipo-micro text-tinta-3">{posicao}º lugar</span>
        )}

        {/* A porta existe INCLUSIVE na missão concluída: quem fechou ainda quer
            rever as regras, o histórico de envios e o placar. Card sem saída é
            beco, e beco numa lista de trinta itens é meia lista inalcançável. */}
        <Link href={`/desafios/${missao.id}/`} className="missao-ver no-underline">
          Ver missão
        </Link>
      </div>
    </article>
  );
}

export function Desafios() {
  const { motor, hidratado } = usePontos();
  const [filtro, setFiltro] = useState<Filtro>("Todas");

  const nivel = motor.nivel();
  const meta = motor.meta();
  const percurso = motor.saldoDe("percurso");
  const diasParaVirar = 7 - diaDaSemana(motor.atual.agora);
  const faltam = meta.alvo - meta.feitas;

  // O FILTRO VALE PARA AS DUAS LISTAS. Ele fica acima de tudo, e um controle que
  // não mexe no bloco logo abaixo dele é pior que controle nenhum: a pessoa
  // aperta «Concluídas», vê doze missões abertas em seguida e conclui que o
  // filtro está quebrado.
  const passa = (m: MissaoDefinida) =>
    filtro === "Todas" || (hidratado && situacaoDe(motor.atual, m) === filtro);

  const primeirosPassos = MISSOES.filter((m) => m.grupo === "primeiros-passos");
  const fechadas = hidratado
    ? primeirosPassos.filter((m) => motor.atual.missoes[m.id]?.concluidaEm).length
    : 0;
  const aberturaVisivel = primeirosPassos.filter(passa);
  // A trilha de abertura SOME quando termina. Um bloco «Primeiros passos» ainda
  // no topo depois de doze conclusões é um andaime que ninguém tirou.
  const mostrarAbertura =
    hidratado && fechadas < primeirosPassos.length && aberturaVisivel.length > 0;

  const visiveis = ordenar(
    MISSOES.filter((m) => m.grupo !== "primeiros-passos").filter(passa),
  );

  return (
    <div className="flex flex-col gap-4">
      {/* O FILTRO DIVIDE A LINHA COM O TÍTULO. Como trilho de cinco pílulas ele ocupava
          uma faixa inteira para uma escolha única — e escolha única com cinco opções é o
          que `<select>` faz melhor que qualquer coisa montada à mão: lista longa, busca
          por digitação no telefone, teclado de graça. */}
      <header className="desafios-cabecalho">
        <div className="desafios-cabecalho-titulo">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">Desafios</h1>
        </div>

        <label className="desafios-filtro">
          <span className="sr-only">Filtrar desafios</span>
          <select
            className="filtros-select"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as typeof filtro)}
            data-filtro-desafios
          >
            {FILTROS.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="desafios-topo">
        <SeloDeNivel nivel={nivel.numero} />
        <span className="tipo-detalhe font-bold">{nivel.nome}</span>
        <div className="desafios-barra">
          <div
            className="nivel-barra"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(nivel.fracao * 100)}
            aria-label={`Progresso até o próximo nível: ${Math.round(nivel.fracao * 100)}%`}
          >
            <span className="nivel-preenchimento" style={{ width: `${nivel.fracao * 100}%` }} />
          </div>
        </div>
        <span className="tipo-legenda text-tinta-3">
          {hidratado
            ? nivel.noTopo
              ? `${percurso.toLocaleString("pt-BR")} de percurso · nível máximo`
              : `${percurso.toLocaleString("pt-BR")} / ${(percurso + nivel.falta).toLocaleString("pt-BR")} de percurso`
            : "—"}
        </span>
      </div>

      <div className="cartao">
        <span className="tipo-detalhe font-bold">
          Meta da semana: {hidratado ? meta.feitas : 0} de {meta.alvo}
        </span>
        <span className="nivel-barra">
          <span
            className="nivel-preenchimento"
            style={{
              width: `${!hidratado || meta.alvo === 0 ? 0 : (meta.feitas / meta.alvo) * 100}%`,
            }}
          />
        </span>
        <span className="tipo-legenda text-tinta-2">
          {hidratado && faltam <= 0
            ? "Semana fechada. Constância vale mais que volume."
            : `Faltam ${Math.max(0, faltam)} · a semana vira em ${diasParaVirar} ${diasParaVirar === 1 ? "dia" : "dias"}`}
        </span>
      </div>

      {mostrarAbertura && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="tipo-destaque font-bold">Primeiros passos</h2>
            <span className="tipo-legenda text-tinta-2">
              Uma para cada canto do aplicativo · {fechadas} de {primeirosPassos.length} feitas
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {aberturaVisivel.map((m) => (
              <Missao key={m.id} missao={m} />
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-col gap-3">
        {visiveis.length === 0 ? (
          <p className="tipo-legenda text-tinta-2">
            Nenhum desafio em «{filtro.toLowerCase()}» agora.
          </p>
        ) : (
          visiveis.map((m) => <Missao key={m.id} missao={m} />)
        )}
      </div>

      <Link href="/meu/conquistas/" className="botao-discreto no-underline self-start">
        Ver emblemas e como se ganha ficha
      </Link>
    </div>
  );
}

