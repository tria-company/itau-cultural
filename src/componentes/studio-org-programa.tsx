"use client";

import { useMemo, useState } from "react";
import { StudioOrgNavegacao } from "./studio-org-navegacao";
import { useOrganizacao } from "./studio-org-estado";
import { PROGRAMA_TEM_ZERO, faltasDoPrograma } from "@/dados/tipos-organizacao";
import type {
  DeclaracaoDaTela,
  EventoParaPrograma,
  NumerosDosProgramas,
} from "@/dados/organizacao";

/**
 * studio-org-programa.tsx, O3 · Programa (funcionalidade 143): a camada acima do evento.
 *
 * É A ÚNICA TELA DA SESSÃO SEM LISTA PARA EDITAR, e a razão é medida: `programa` tem ZERO
 * instâncias em 7.810 entidades. Ela é a única das 20 classes da ontologia nessa situação,
 * está declarada em `tipos.ts`, o motor de caminhada a percorre, e nada no acervo a popula.
 *
 * O QUE ISSO EXIGE DA TELA. Um catálogo vazio com um botão «criar» leria como tela nova sem
 * dado ainda. O que ela precisa dizer é outra coisa: **o zero é o achado**, e vem com
 * denominador, antes de qualquer formulário. Depois disso ela cria, e o que cria é
 * autorado, e ela diz que é.
 *
 * A MISTURA É O DESENHO. O guarda-chuva é autorado; os eventos que ele reúne são REAIS,
 * 300 no acervo, 260 da fonte. É essa mistura que deixa ver o que a classe faria se alguém
 * a povoasse, sem fabricar um programa «do Itaú Cultural» que ninguém publicou.
 *
 * SÓ NA VISÃO WEB (D-67).
 */

interface Props {
  eventos: EventoParaPrograma[];
  numeros: NumerosDosProgramas;
  declaracoes: DeclaracaoDaTela[];
  organizacao: string;
  autor: string;
  gestorEAutorado: string;
  dataDeReferencia: string;
}

export function StudioOrgPrograma({
  eventos,
  numeros,
  declaracoes,
  organizacao,
  autor,
  gestorEAutorado,
  dataDeReferencia,
}: Props) {
  const contexto = useMemo(
    () => ({ dataDeReferencia, autor, organizacao }),
    [dataDeReferencia, autor, organizacao],
  );
  const semente = useMemo(() => ({}), []);
  const org = useOrganizacao(contexto, semente);

  const [titulo, setTitulo] = useState("");
  const [busca, setBusca] = useState("");
  const [edicaoRotulo, setEdicaoRotulo] = useState("");
  const [edicaoInicio, setEdicaoInicio] = useState("");
  const [edicaoFim, setEdicaoFim] = useState("");

  const atual =
    org.programas.find((p) => p.id === org.atualProgramaId) ?? org.programas[0] ?? null;

  const reunidos = useMemo(
    () => (atual ? eventos.filter((e) => atual.eventoIds.includes(e.id)) : []),
    [atual, eventos],
  );

  const candidatos = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    if (termo.length === 0) return [];
    return eventos
      .filter((e) => e.titulo.toLocaleLowerCase("pt-BR").includes(termo))
      .slice(0, 40);
  }, [eventos, busca]);

  return (
    <div className="studio">
      <header className="studio-cabecalho">
        <div className="studio-superficie">
          <p className="studio-rotulo">Studio · Organização · nível 6</p>
          <h1 className="studio-titulo">Programa</h1>
        </div>
        <p className="studio-objetivo">
          A camada acima do evento, Rumos, uma temporada, um festival com edições.{" "}
          {organizacao} · {autor} · medido em {dataDeReferencia}.
        </p>
        <p className="studio-nota">{gestorEAutorado}</p>
        <StudioOrgNavegacao ativa="programa" />
      </header>

      {/* O zero vem ANTES do formulário. Ele é o achado, não o estado inicial de uma tela
          nova, e a diferença entre as duas leituras é tudo o que esta tela tem a dizer. */}
      <section className="studio-painel">
        <div className="studio-painel-cabeca">
          <h2 className="studio-painel-nome">A classe existe e está vazia</h2>
          <span className="studio-pastilha studio-pastilha-marca">
            <span className="studio-pastilha-numero">{numeros.programas}</span> instâncias no
            acervo
          </span>
        </div>
        <p className="studio-nota">{PROGRAMA_TEM_ZERO}</p>
        <ul className="web-denominadores">
          <li className="web-denominador">
            <span className="web-denominador-numero">{numeros.programas}</span>
            <span className="web-denominador-rotulo">programas no acervo</span>
          </li>
          <li className="web-denominador">
            <span className="web-denominador-numero">{org.programas.length}</span>
            <span className="web-denominador-rotulo">criados nesta demonstração</span>
          </li>
          <li className="web-denominador">
            <span className="web-denominador-numero">{numeros.eventos}</span>
            <span className="web-denominador-rotulo">eventos para reunir</span>
          </li>
          <li className="web-denominador">
            <span className="web-denominador-numero">
              {numeros.eventosComRealizador}/{numeros.eventos}
            </span>
            <span className="web-denominador-rotulo">com instituição realizadora</span>
          </li>
        </ul>
        {declaracoes.map((d) => (
          <div key={d.titulo} className="web-declaracao">
            <strong>{d.titulo}</strong>
            <span>{d.texto}</span>
          </div>
        ))}
      </section>

      {!org.pronto ? (
        <section className="studio-painel">
          <p className="studio-nota">Lendo os programas guardados neste navegador…</p>
        </section>
      ) : (
        <div className="web-duas-colunas">
          {/* ---------------- Programas, à esquerda ---------------- */}
          <div className="studio-forma">
            <section className="studio-painel">
              <h2 className="studio-painel-nome">Criar programa</h2>
              <label className="studio-campo">
                <span className="studio-campo-rotulo">
                  Título
                  <em className="studio-campo-exigido">obrigatório</em>
                </span>
                <input
                  type="text"
                  className="studio-campo-entrada"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Rumos, Temporada 2026, Ocupação…"
                />
              </label>
              <div className="studio-acoes">
                <button
                  type="button"
                  className="studio-botao studio-botao-primario"
                  disabled={titulo.trim().length === 0}
                  onClick={() => {
                    org.criarPrograma(titulo.trim());
                    setTitulo("");
                  }}
                >
                  Criar
                </button>
              </div>
              <p className="studio-campo-nota">
                O que for criado aqui é autorado, e a tela diz que é. Nenhum programa do
                acervo foi carregado, porque não há nenhum.
              </p>
            </section>

            {org.programas.length > 0 ? (
              <section className="studio-painel">
                <div className="studio-painel-cabeca">
                  <h2 className="studio-painel-nome">Programas desta demonstração</h2>
                  <span className="studio-pastilha">
                    <span className="studio-pastilha-numero">{org.programas.length}</span>{" "}
                    criados
                  </span>
                </div>
                <ul className="web-lista-densa">
                  {org.programas.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className="web-linha studio-botao"
                        aria-pressed={atual?.id === p.id}
                        onClick={() => org.escolherPrograma(p.id)}
                      >
                        <span className="web-linha-titulo">{p.titulo}</span>
                        <span className="web-linha-meta">
                          {p.edicoes.length} edição(ões) · {p.eventoIds.length} evento(s)
                          reunido(s)
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {atual ? (
              <section className="studio-painel">
                <h2 className="studio-painel-nome">{atual.titulo}</h2>
                <label className="studio-campo">
                  <span className="studio-campo-rotulo">Resumo</span>
                  <textarea
                    className="studio-campo-entrada"
                    rows={3}
                    value={atual.resumo}
                    onChange={(e) => org.alterarPrograma(atual.id, { resumo: e.target.value })}
                    placeholder="O que reúne estes eventos"
                  />
                </label>

                <div>
                  <p className="studio-rotulo">Edições ({atual.edicoes.length})</p>
                  {atual.edicoes.length > 0 ? (
                    <ul className="org-falta">
                      {atual.edicoes.map((ed, i) => (
                        <li key={`${ed.rotulo}-${i}`} className="org-falta-item" data-bloqueia="nao">
                          <span>
                            {ed.rotulo}
                            {ed.inicio || ed.fim ? `, ${ed.inicio} a ${ed.fim}` : ""}
                          </span>
                          <button
                            type="button"
                            className="studio-botao"
                            onClick={() => org.removerEdicao(atual.id, i)}
                          >
                            remover
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="studio-campo-nota">
                      Nenhuma edição ainda. Um programa sem edição é indistinguível de uma
                      etiqueta.
                    </p>
                  )}
                  <label className="studio-campo">
                    <span className="studio-campo-rotulo">Nova edição</span>
                    <input
                      type="text"
                      className="studio-campo-entrada studio-campo-entrada-curta"
                      value={edicaoRotulo}
                      onChange={(e) => setEdicaoRotulo(e.target.value)}
                      placeholder="Rumos 2026"
                    />
                    <input
                      type="text"
                      className="studio-campo-entrada studio-campo-entrada-curta"
                      value={edicaoInicio}
                      onChange={(e) => setEdicaoInicio(e.target.value)}
                      placeholder="início"
                    />
                    <input
                      type="text"
                      className="studio-campo-entrada studio-campo-entrada-curta"
                      value={edicaoFim}
                      onChange={(e) => setEdicaoFim(e.target.value)}
                      placeholder="fim"
                    />
                    <span className="studio-campo-nota">
                      O rótulo é texto e não ano: nem toda edição é anual, e um campo numérico
                      obrigaria «Temporada 2024/2025» a virar dois registros ou uma mentira.
                    </span>
                  </label>
                  <div className="studio-acoes">
                    <button
                      type="button"
                      className="studio-botao"
                      disabled={edicaoRotulo.trim().length === 0}
                      onClick={() => {
                        org.acrescentarEdicao(atual.id, {
                          rotulo: edicaoRotulo.trim(),
                          inicio: edicaoInicio.trim(),
                          fim: edicaoFim.trim(),
                        });
                        setEdicaoRotulo("");
                        setEdicaoInicio("");
                        setEdicaoFim("");
                      }}
                    >
                      Acrescentar edição
                    </button>
                  </div>
                </div>

                <p className="studio-literal">
                  criado por {atual.autor} em {atual.quando} · procedência autorado
                </p>
              </section>
            ) : null}
          </div>

          {/* -------- Eventos reunidos, à direita -------- */}
          <aside className="org-colada studio-forma">
            {atual === null ? (
              <section className="studio-painel">
                <p className="studio-nota">
                  Nenhum programa criado ainda. Crie um à esquerda para reunir eventos embaixo
                  dele, e note que a lista de programas começa vazia porque o acervo está
                  vazio, não porque a tela é nova.
                </p>
              </section>
            ) : (
              <>
                <section className="studio-painel">
                  <div className="studio-painel-cabeca">
                    <h2 className="studio-painel-nome">Eventos reunidos</h2>
                    <span className="studio-pastilha">
                      <span className="studio-pastilha-numero">{reunidos.length}</span> de{" "}
                      {numeros.eventos}
                    </span>
                  </div>
                  {reunidos.length === 0 ? (
                    <p className="studio-campo-nota">
                      O guarda-chuva existe e não cobre nada. Busque abaixo para reunir eventos
                      reais do acervo.
                    </p>
                  ) : (
                    <ul className="web-lista-densa">
                      {reunidos.map((e) => (
                        <li key={e.id}>
                          <button
                            type="button"
                            className="web-linha studio-botao"
                            onClick={() => org.alternarEvento(atual.id, e.id)}
                          >
                            <span className="web-linha-titulo">{e.titulo}</span>
                            <span className="web-linha-meta">
                              {e.realizadoPor.length > 0 ? e.realizadoPor.join(", ") : "sem instituição realizadora"} ·{" "}
                              {e.ocorrencias} sessões · {e.procedencia}, clique para tirar
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="studio-painel">
                  <h2 className="studio-painel-nome">Reunir evento do acervo</h2>
                  <label className="studio-campo">
                    <span className="studio-campo-rotulo">Buscar entre os {numeros.eventos}</span>
                    <input
                      type="search"
                      className="studio-campo-entrada"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      placeholder="Ocupação, Rumos, mostra…"
                    />
                  </label>
                  {busca.trim().length === 0 ? (
                    <p className="studio-campo-nota">
                      A busca é obrigatória e não há lista completa aqui de propósito: 300
                      eventos numa coluna colada viram rolagem infinita, e quem reúne procura
                      por nome.
                    </p>
                  ) : candidatos.length === 0 ? (
                    <p className="studio-campo-nota">Nenhum evento com este termo.</p>
                  ) : (
                    <ul className="web-lista-densa">
                      {candidatos.map((e) => (
                        <li key={e.id}>
                          <button
                            type="button"
                            className="web-linha studio-botao"
                            aria-pressed={atual.eventoIds.includes(e.id)}
                            onClick={() => org.alternarEvento(atual.id, e.id)}
                          >
                            <span className="web-linha-titulo">{e.titulo}</span>
                            <span className="web-linha-meta">
                              {e.periodo ?? "sem período"} ·{" "}
                              {atual.eventoIds.includes(e.id) ? "reunido" : "reunir"}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="studio-painel">
                  <h2 className="studio-painel-nome">O que falta neste programa</h2>
                  <ul className="org-falta">
                    {faltasDoPrograma(atual).map((f) => (
                      <li
                        key={f.texto}
                        className="org-falta-item"
                        data-bloqueia={f.bloqueia ? "sim" : "nao"}
                      >
                        <span>{f.texto}</span>
                        {f.dono ? <span className="org-falta-dono">{f.dono}</span> : null}
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
