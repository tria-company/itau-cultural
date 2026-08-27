"use client";

import { useMemo, useState } from "react";
import { StudioOrgNavegacao } from "./studio-org-navegacao";
import { useOrganizacao } from "./studio-org-estado";
import {
  EDUCADOR_FORA_DOS_OITO,
  FORMACAO_E_O_MODELO,
  ROTULO_DA_VISITA,
  faltasDaFormacao,
  porQueNaoConfirma,
} from "@/dados/tipos-organizacao";
import type {
  DeclaracaoDaTela,
  NumerosDasFormacoes,
  OfertaDoAcervo,
} from "@/dados/organizacao";

/**
 * studio-org-formacao.tsx, O4 · Formação (funcionalidades 144, 145 e 146).
 *
 * TRÊS COISAS NUMA TELA, e a do meio é a que muda o que ela é. Curso com inscrição é
 * publicação; biblioteca é catálogo; **agendamento de visita educativa é GESTÃO DE
 * RESERVA**, uma escola pede, alguém confirma ou recusa, e o número de pessoas entra na
 * conta das vagas. Uma tela que só publicasse «temos visitas educativas» seria um cartaz, e
 * a diferença entre um cartaz e uma agenda é a turma que aparece na porta sem ter lugar.
 *
 * O ARGUMENTO DAS 54, E O CONTRA-ARGUMENTO NA MESMA TELA. As formações são a única classe
 * do acervo com 100% de ficha, imagem, crédito e descrição alternativa, o modelo do que
 * dado bem preenchido parece. E ainda assim as 54 somam 6 marcações de dimensão em 432
 * possíveis: a ficha foi preenchida em todas, e o que ela diz na maioria das linhas é «não
 * oferece». **Preencher é o que a plataforma pode exigir; oferecer é o que ela pode medir**,
 * e a tela mostra as duas medidas lado a lado em vez de escolher a que soa melhor.
 *
 * O QUE ELA DECLARA QUE NÃO FAZ. O material didático é publicado aqui, mas o ACESSO do
 * educador ficou fora dos oito níveis desta versão: professor com turma não é público
 * comum, e criar um nono nível sem o resto do modelo pronto seria inventar governança.
 *
 * SÓ NA VISÃO WEB (D-67).
 */

interface Props {
  formacoes: OfertaDoAcervo[];
  publicacoes: OfertaDoAcervo[];
  numeros: NumerosDasFormacoes;
  declaracoes: DeclaracaoDaTela[];
  organizacao: string;
  autor: string;
  gestorEAutorado: string;
  dataDeReferencia: string;
}

export function StudioOrgFormacao({
  formacoes,
  publicacoes,
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
  const semente = useMemo(() => ({ formacaoId: formacoes[0]?.id ?? null }), [formacoes]);
  const org = useOrganizacao(contexto, semente);

  const [busca, setBusca] = useState("");
  const [escola, setEscola] = useState("");
  const [dataDaVisita, setDataDaVisita] = useState("");
  const [horario, setHorario] = useState("");
  const [pessoas, setPessoas] = useState("");
  const [materialTitulo, setMaterialTitulo] = useState("");
  const [materialDescricao, setMaterialDescricao] = useState("");
  const [aba, setAba] = useState<"formacoes" | "biblioteca">("formacoes");

  const atual = formacoes.find((f) => f.id === org.atualFormacaoId) ?? formacoes[0] ?? null;
  const cadastro = atual ? org.formacoes[atual.id] : undefined;

  const visitasDaOferta = useMemo(
    () => (atual ? org.visitas.filter((v) => v.formacaoId === atual.id) : []),
    [org.visitas, atual],
  );
  const jaConfirmadas = visitasDaOferta
    .filter((v) => v.estado === "confirmada")
    .reduce((soma, v) => soma + (v.pessoas ?? 0), 0);
  const pendentes = visitasDaOferta.filter((v) => v.estado === "solicitada").length;

  const lista = useMemo(() => {
    const base = aba === "formacoes" ? formacoes : publicacoes;
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    if (termo.length === 0) return base;
    return base.filter((o) => o.titulo.toLocaleLowerCase("pt-BR").includes(termo));
  }, [aba, formacoes, publicacoes, busca]);

  const visitaPronta = escola.trim().length > 0 && dataDaVisita.trim().length > 0;

  return (
    <div className="studio">
      <header className="studio-cabecalho">
        <div className="studio-superficie">
          <p className="studio-rotulo">Studio · Organização · nível 6</p>
          <h1 className="studio-titulo">Formação</h1>
        </div>
        <p className="studio-objetivo">
          Cursos, biblioteca e a agenda da visita educativa. {organizacao} · {autor} · medido
          em {dataDeReferencia}.
        </p>
        <p className="studio-nota">{gestorEAutorado}</p>
        <StudioOrgNavegacao ativa="formacao" />
      </header>

      <section className="studio-painel">
        <h2 className="studio-painel-nome">O estado do acervo, medido</h2>
        <ul className="web-denominadores">
          <li className="web-denominador">
            <span className="web-denominador-numero">
              {numeros.comFicha}/{numeros.formacoes}
            </span>
            <span className="web-denominador-rotulo">declaram a ficha</span>
          </li>
          <li className="web-denominador">
            <span className="web-denominador-numero">
              {numeros.comCredito}/{numeros.formacoes}
            </span>
            <span className="web-denominador-rotulo">com imagem e crédito</span>
          </li>
          <li className="web-denominador">
            <span className="web-denominador-numero">
              {numeros.marcacoes}/{numeros.marcacoesPossiveis}
            </span>
            <span className="web-denominador-rotulo">recursos realmente oferecidos</span>
          </li>
          <li className="web-denominador">
            <span className="web-denominador-numero">{numeros.publicacoes}</span>
            <span className="web-denominador-rotulo">publicações na biblioteca</span>
          </li>
        </ul>
        <p className="studio-nota">{FORMACAO_E_O_MODELO}</p>
        {declaracoes.map((d) => (
          <div key={d.titulo} className="web-declaracao">
            <strong>{d.titulo}</strong>
            <span>{d.texto}</span>
          </div>
        ))}
      </section>

      {!org.pronto ? (
        <section className="studio-painel">
          <p className="studio-nota">Lendo a agenda guardada neste navegador…</p>
        </section>
      ) : (
        <div className="web-duas-colunas">
          {/* -------- Ofertas e biblioteca, à esquerda -------- */}
          <div className="studio-forma">
            <section className="studio-painel">
              <div className="studio-acoes">
                <button
                  type="button"
                  className={aba === "formacoes" ? "studio-botao studio-botao-primario" : "studio-botao"}
                  onClick={() => setAba("formacoes")}
                >
                  Ofertas ({numeros.formacoes})
                </button>
                <button
                  type="button"
                  className={aba === "biblioteca" ? "studio-botao studio-botao-primario" : "studio-botao"}
                  onClick={() => setAba("biblioteca")}
                >
                  Biblioteca ({numeros.publicacoes})
                </button>
              </div>

              <label className="studio-campo">
                <span className="studio-campo-rotulo">Buscar por título</span>
                <input
                  type="search"
                  className="studio-campo-entrada"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </label>

              {aba === "biblioteca" ? (
                <p className="studio-campo-nota">
                  A consulta ao acervo bibliográfico está listada como faltando no catálogo de
                  funcionalidades. O dado está aqui, {numeros.publicacoes} publicações,{" "}
                  {numeros.publicacoesComFicha} com ficha declarada,, e a tela pública que o
                  mostra é que não existe.
                </p>
              ) : null}

              <ul className="web-lista-densa">
                {lista.slice(0, 60).map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      className="web-linha studio-botao"
                      aria-pressed={atual?.id === o.id}
                      disabled={aba === "biblioteca"}
                      onClick={() => org.escolherFormacao(o.id)}
                    >
                      <span className="web-linha-titulo">{o.titulo}</span>
                      <span className="web-linha-meta">
                        {o.dimensoesMarcadas} de 8 recursos ·{" "}
                        {o.creditoImagem ? "com crédito" : "sem crédito"}
                        {o.publicadoEm ? ` · ${o.publicadoEm.slice(0, 10)}` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {lista.length > 60 ? (
                <p className="studio-campo-nota">
                  Mostrando 60 de {lista.length}. O corte é da lista, não do acervo.
                </p>
              ) : null}
            </section>

            {atual && aba === "formacoes" ? (
              <section className="studio-painel">
                <h2 className="studio-painel-nome">{atual.titulo}</h2>
                {atual.resumo.length > 0 ? <p className="studio-nota">{atual.resumo}</p> : null}
                <p className="studio-literal">
                  {atual.dimensoesMarcadas} de 8 recursos declarados ·{" "}
                  {atual.creditoImagem ?? "sem crédito"}
                </p>
                {atual.imagemAlt ? (
                  <p className="studio-campo-nota">
                    <span className="studio-rotulo">Descrição alternativa</span> {atual.imagemAlt}
                  </p>
                ) : null}

                <label className="studio-campo">
                  <span className="studio-campo-rotulo">Vagas da oferta</span>
                  <input
                    type="number"
                    min={0}
                    className="studio-campo-entrada studio-campo-entrada-curta"
                    value={cadastro?.vagas ?? ""}
                    onChange={(e) =>
                      org.alterarFormacao(atual.id, {
                        vagas: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                  <span className="studio-campo-nota">
                    Sem vagas declaradas nenhuma visita se confirma: confirmar contra um teto
                    desconhecido é aceitar qualquer coisa.
                  </span>
                </label>

                <div className="org-ato" data-declarado={cadastro?.inscricaoAberta ? "sim" : "nao"}>
                  <span className="org-ato-texto">
                    {cadastro?.inscricaoAberta
                      ? "Inscrição aberta, a oferta recebe."
                      : "Inscrição fechada: a oferta aparece no app e não recebe ninguém."}
                  </span>
                  <button
                    type="button"
                    className="studio-botao studio-botao-primario"
                    onClick={() =>
                      org.alterarFormacao(atual.id, {
                        inscricaoAberta: !cadastro?.inscricaoAberta,
                      })
                    }
                  >
                    {cadastro?.inscricaoAberta ? "Fechar inscrição" : "Abrir inscrição"}
                  </button>
                </div>

                <div>
                  <p className="studio-rotulo">
                    Material didático ({cadastro?.materiais.length ?? 0})
                  </p>
                  {cadastro && cadastro.materiais.length > 0 ? (
                    <ul className="org-falta">
                      {cadastro.materiais.map((m, i) => (
                        <li key={`${m.titulo}-${i}`} className="org-falta-item" data-bloqueia="nao">
                          <span>
                            {m.titulo}
                            {m.descricao ? `, ${m.descricao}` : ""}
                          </span>
                          <button
                            type="button"
                            className="studio-botao"
                            onClick={() => org.removerMaterial(atual.id, i)}
                          >
                            remover
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <label className="studio-campo">
                    <span className="studio-campo-rotulo">Novo material</span>
                    <input
                      type="text"
                      className="studio-campo-entrada"
                      value={materialTitulo}
                      onChange={(e) => setMaterialTitulo(e.target.value)}
                      placeholder="Roteiro de visita, caderno do professor…"
                    />
                    <input
                      type="text"
                      className="studio-campo-entrada"
                      value={materialDescricao}
                      onChange={(e) => setMaterialDescricao(e.target.value)}
                      placeholder="Para qual série, o que traz"
                    />
                  </label>
                  <div className="studio-acoes">
                    <button
                      type="button"
                      className="studio-botao"
                      disabled={materialTitulo.trim().length === 0}
                      onClick={() => {
                        org.acrescentarMaterial(atual.id, {
                          titulo: materialTitulo.trim(),
                          descricao: materialDescricao.trim(),
                        });
                        setMaterialTitulo("");
                        setMaterialDescricao("");
                      }}
                    >
                      Publicar material
                    </button>
                  </div>
                  <p className="studio-campo-nota">{EDUCADOR_FORA_DOS_OITO}</p>
                </div>
              </section>
            ) : null}
          </div>

          {/* -------- A agenda de visitas, à direita -------- */}
          <aside className="org-colada studio-forma">
            {atual === null ? (
              <section className="studio-painel">
                <p className="studio-nota">O acervo não tem formação nenhuma.</p>
              </section>
            ) : (
              <>
                <section className="studio-painel">
                  <div className="studio-painel-cabeca">
                    <h2 className="studio-painel-nome">Agenda de visitas</h2>
                    <span className="studio-pastilha">
                      <span className="studio-pastilha-numero">{jaConfirmadas}</span> de{" "}
                      {cadastro?.vagas ?? ", "} pessoas confirmadas
                    </span>
                  </div>
                  <p className="studio-nota">
                    Isto é gestão de reserva, e não publicação: a escola pede, a organização
                    responde, e o número de pessoas entra na conta das vagas.
                  </p>

                  {visitasDaOferta.length === 0 ? (
                    <p className="studio-campo-nota">
                      Nenhuma visita solicitada para esta oferta.
                    </p>
                  ) : (
                    <ul className="org-falta">
                      {visitasDaOferta.map((v) => {
                        const motivo = porQueNaoConfirma(v, cadastro?.vagas ?? null, jaConfirmadas);
                        return (
                          <li
                            key={v.id}
                            className="org-falta-item"
                            data-bloqueia={v.estado === "solicitada" ? "sim" : "nao"}
                          >
                            <span>
                              {v.escola} · {v.data}
                              {v.horario ? ` ${v.horario}` : ""} ·{" "}
                              {v.pessoas === null ? "sem número" : `${v.pessoas} pessoas`},{" "}
                              {ROTULO_DA_VISITA[v.estado]}
                            </span>
                            {v.estado === "solicitada" ? (
                              motivo ? (
                                <span className="org-falta-dono">{motivo}</span>
                              ) : (
                                <span className="org-linha-acoes">
                                  <button
                                    type="button"
                                    className="studio-botao studio-botao-primario"
                                    onClick={() => org.responderVisita(v.id, "confirmada")}
                                  >
                                    confirmar
                                  </button>
                                  <button
                                    type="button"
                                    className="studio-botao"
                                    onClick={() => org.responderVisita(v.id, "recusada")}
                                  >
                                    recusar
                                  </button>
                                </span>
                              )
                            ) : (
                              <span className="org-falta-dono">
                                {v.autor} · {v.quando}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>

                <section className="studio-painel">
                  <h2 className="studio-painel-nome">Registrar pedido de escola</h2>
                  <label className="studio-campo">
                    <span className="studio-campo-rotulo">
                      Escola
                      <em className="studio-campo-exigido">obrigatório</em>
                    </span>
                    <input
                      type="text"
                      className="studio-campo-entrada"
                      value={escola}
                      onChange={(e) => setEscola(e.target.value)}
                    />
                  </label>
                  <label className="studio-campo">
                    <span className="studio-campo-rotulo">
                      Data
                      <em className="studio-campo-exigido">obrigatório</em>
                    </span>
                    <input
                      type="text"
                      className="studio-campo-entrada studio-campo-entrada-curta"
                      value={dataDaVisita}
                      onChange={(e) => setDataDaVisita(e.target.value)}
                      placeholder="12.09.2026"
                    />
                    <input
                      type="text"
                      className="studio-campo-entrada studio-campo-entrada-curta"
                      value={horario}
                      onChange={(e) => setHorario(e.target.value)}
                      placeholder="14:00"
                    />
                  </label>
                  <label className="studio-campo">
                    <span className="studio-campo-rotulo">Quantas pessoas</span>
                    <input
                      type="number"
                      min={0}
                      className="studio-campo-entrada studio-campo-entrada-curta"
                      value={pessoas}
                      onChange={(e) => setPessoas(e.target.value)}
                    />
                    <span className="studio-campo-nota">
                      Em branco é «não informou», e visita sem número não se confirma, não há
                      o que somar contra as vagas.
                    </span>
                  </label>
                  <div className="studio-acoes">
                    <button
                      type="button"
                      className="studio-botao studio-botao-primario"
                      disabled={!visitaPronta}
                      onClick={() => {
                        org.solicitarVisita({
                          formacaoId: atual.id,
                          escola: escola.trim(),
                          data: dataDaVisita.trim(),
                          horario: horario.trim(),
                          pessoas: pessoas === "" ? null : Number(pessoas),
                          observacao: "",
                        });
                        setEscola("");
                        setDataDaVisita("");
                        setHorario("");
                        setPessoas("");
                      }}
                    >
                      Registrar pedido
                    </button>
                  </div>
                </section>

                <section className="studio-painel">
                  <h2 className="studio-painel-nome">O que falta nesta oferta</h2>
                  <ul className="org-falta">
                    {faltasDaFormacao(cadastro, pendentes).map((f) => (
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
