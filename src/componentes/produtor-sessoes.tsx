"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { Campo } from "@/componentes/base/ficha-em-atos";
import { Folha } from "@/componentes/base/folha";
import { dataLegivel } from "@/componentes/base/seletores-de-tempo";
import { useProdutor } from "@/componentes/produtor-estado";
import { emReais } from "@/dados/tipos-produtor";
import type {
  ContextoDoProdutor,
  Registro,
  RegistroDeAgenda,
  SessaoDoProdutor,
} from "@/dados/tipos-produtor";

/**
 * produtor-sessoes.tsx, o que o produtor faz DEPOIS de publicar.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * É A MAIOR PARTE DO TRABALHO REAL, e a que quase nenhum sistema de publicação trata bem.
 *
 * Publicar um evento é um dia. Mudar o horário de uma sessão porque o elenco atrasou,
 * marcar esgotado na terça, cancelar a sessão de domingo por causa da chuva, isso é toda
 * semana, e é o que decide se o público confia na agenda.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * A MUDANÇA DIZ QUANTAS PESSOAS SERÃO AVISADAS, ANTES DE CONFIRMAR. Mudar o horário de uma
 * sessão que doze pessoas salvaram não é a mesma coisa que mudar o de uma que ninguém
 * salvou, e quem edita precisa saber a diferença enquanto ainda pode desistir. É o mesmo
 * princípio da prévia do gerador: a consequência dita antes é uma decisão; dita depois, é
 * um estrago.
 *
 * CANCELAR EXIGE MOTIVO. Um cancelamento sem motivo dispara um alerta que não explica nada
 *, e quem recebe um aviso vazio sobre um evento que ia ver aprende a ignorar os avisos.
 *
 * ESGOTADO ALTERNA SEM PASSAR POR FILA NENHUMA. Com a publicação direta, a moderação virou
 * fiscalização posterior: marcar esgotado é operação, não decisão editorial, e mandá-la
 * para uma fila faria a bilheteria esperar por um moderador.
 */

/** Quantas pessoas salvaram uma sessão. O acervo não tem esse dado, ver a frase abaixo. */
function quantosSalvaram(sessaoId: string): number {
  // DETERMINÍSTICO E DECLARADO. Não há usuários neste protótipo: `salvos` é uma lista no
  // `localStorage` de UM navegador, e não existe servidor para contar quantas pessoas
  // salvaram o quê. O número sai do próprio id, por soma de caracteres, é reprodutível
  // entre dois carregamentos e entre duas máquinas, que é o que a demonstração precisa.
  let soma = 0;
  for (let i = 0; i < sessaoId.length; i += 1) soma += sessaoId.charCodeAt(i);
  return soma % 23;
}

export const ALCANCE_E_AUTORADO =
  "O número de pessoas avisadas é AUTORADO e determinístico: não há usuários neste " +
  "protótipo, e não existe servidor para contar quem salvou o quê. O que a tela prova é o " +
  "MECANISMO, a consequência medida e dita antes de confirmar.";

interface Edicao {
  registro: RegistroDeAgenda;
  sessao: SessaoDoProdutor;
  campo: "horario" | "cancelamento";
  valor: string;
}

export function GestaoDeSessoes({
  semente,
  contexto,
}: {
  semente: Registro[];
  contexto: ContextoDoProdutor;
}) {
  const armazem = useProdutor(semente, contexto);
  const [edicao, setEdicao] = useState<Edicao | null>(null);
  const [motivo, setMotivo] = useState("");

  const publicados = useMemo(
    () =>
      armazem.registros.filter(
        (r): r is RegistroDeAgenda =>
          r.pauta === "agenda" && r.situacao === "publicado" && r.sessoes.length > 0,
      ),
    [armazem.registros],
  );

  if (!armazem.pronto) {
    return (
      <div className="prod-corpo">
        <p className="prod-nota">Lendo o que está gravado neste navegador…</p>
      </div>
    );
  }

  const totalDeSessoes = publicados.reduce((n, r) => n + r.sessoes.length, 0);

  function alterarSessao(r: RegistroDeAgenda, id: string, m: Partial<SessaoDoProdutor>) {
    armazem.alterarId(r.id, {
      sessoes: r.sessoes.map((s) => (s.id === id ? { ...s, ...m } : s)),
    } as Partial<Registro>);
  }

  return (
    <>
      <header className="prod-cabecalho">
        <div className="prod-cabecalho-linha">
          <Link href="/studio/" className="prod-superficie prod-voltar" data-voltar-studio>
            ‹ Studio
          </Link>
          <span className="prod-contagem">{totalDeSessoes} sessões no ar</span>
        </div>
        <h1 className="prod-titulo">Sessões publicadas</h1>
        <p className="prod-objetivo">
          O que muda depois de publicar: horário, preço, esgotado, cancelamento. Toda
          alteração diz, antes de confirmar, quantas pessoas serão avisadas.
        </p>
      </header>

      <div className="prod-corpo">
        {publicados.length === 0 ? (
          <div className="prod-vazio">
            <p className="prod-vazio-frase">
              Nenhum evento publicado com sessões. Esta tela é sobre o que já está no ar, o
              que ainda não foi publicado se edita na ficha da Agenda.
            </p>
          </div>
        ) : (
          publicados.map((r) => (
            <section className="prod-secao" key={r.id} data-evento-publicado={r.id}>
              <h2 className="prod-secao-titulo">
                {r.titulo} · {r.sessoes.length}{" "}
                {r.sessoes.length === 1 ? "sessão" : "sessões"}
              </h2>
              <ul className="prod-lista">
                {r.sessoes.map((s) => {
                  const avisados = quantosSalvaram(s.id);
                  return (
                    <li key={s.id}>
                      <div
                        className="prod-sessao"
                        data-sessao-publicada={s.id}
                        data-cancelada={s.cancelada ? "sim" : "nao"}
                      >
                        <div className="prod-sessao-quando">
                          <strong className="prod-sessao-hora">
                            {dataLegivel(s.inicio.slice(0, 10))} · {s.inicio.slice(11, 16)}
                          </strong>
                          {s.cancelada ? (
                            <span className="prod-situacao" data-situacao="vetado">
                              cancelada
                            </span>
                          ) : null}
                          {s.esgotado ? (
                            <span className="prod-situacao" data-situacao="suspenso">
                              esgotada
                            </span>
                          ) : null}
                        </div>

                        <span className="prod-sessao-espaco" data-avisados={String(avisados)}>
                          {avisados === 0
                            ? "ninguém salvou esta sessão"
                            : `${avisados} ${avisados === 1 ? "pessoa salvou" : "pessoas salvaram"}`}
                          {s.preco !== null ? ` · ${emReais(s.preco)}` : ""}
                        </span>

                        <div className="prod-sessao-marcas">
                          <BotaoDoStudio
                            curto
                            aoClicar={() => {
                              setEdicao({
                                registro: r,
                                sessao: s,
                                campo: "horario",
                                valor: s.inicio.slice(11, 16),
                              });
                              setMotivo("");
                            }}
                            data-acao="mudar-horario"
                          >
                            Mudar horário
                          </BotaoDoStudio>

                          {/* ESGOTADO ALTERNA SEM CONFIRMAÇÃO E SEM FILA. É operação de
                              bilheteria, não decisão editorial, e o público que chega à
                              porta prefere saber cinco minutos antes. */}
                          <BotaoDoStudio
                            curto
                            aoClicar={() => alterarSessao(r, s.id, { esgotado: !s.esgotado })}
                            data-acao="alternar-esgotado"
                          >
                            {s.esgotado ? "Desmarcar esgotada" : "Marcar esgotada"}
                          </BotaoDoStudio>

                          <BotaoDoStudio
                            curto
                            aoClicar={() => {
                              setEdicao({
                                registro: r,
                                sessao: s,
                                campo: "cancelamento",
                                valor: "",
                              });
                              setMotivo("");
                            }}
                            data-acao="cancelar-sessao"
                          >
                            {s.cancelada ? "Reativar" : "Cancelar"}
                          </BotaoDoStudio>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}

        <p className="prod-nota" data-alcance-autorado>
          {ALCANCE_E_AUTORADO}
        </p>
      </div>

      {/* ---- A CONFIRMAÇÃO, COM O NÚMERO ---- */}
      <Folha
        aberta={edicao !== null}
        titulo={edicao?.campo === "horario" ? "Mudar o horário" : "Cancelar a sessão"}
        descricao={
          edicao
            ? `${dataLegivel(edicao.sessao.inicio.slice(0, 10))} · ${edicao.sessao.inicio.slice(11, 16)}`
            : undefined
        }
        aoFechar={() => setEdicao(null)}
        rodape={
          <BotaoDoStudio
            primaria
            desabilitado={
              edicao?.campo === "cancelamento" &&
              !edicao.sessao.cancelada &&
              motivo.trim() === ""
            }
            porQueDesabilitado="Cancelamento sem motivo dispara um alerta que não explica nada."
            aoClicar={() => {
              if (!edicao) return;
              if (edicao.campo === "horario") {
                const novo = `${edicao.sessao.inicio.slice(0, 10)}T${edicao.valor}`;
                alterarSessao(edicao.registro, edicao.sessao.id, { inicio: novo });
              } else if (edicao.sessao.cancelada) {
                alterarSessao(edicao.registro, edicao.sessao.id, {
                  cancelada: false,
                  motivoDoCancelamento: null,
                });
              } else {
                alterarSessao(edicao.registro, edicao.sessao.id, {
                  cancelada: true,
                  motivoDoCancelamento: motivo,
                });
              }
              setEdicao(null);
            }}
            data-confirmar-alteracao
          >
            Confirmar
          </BotaoDoStudio>
        }
      >
        {edicao ? (
          <>
            {edicao.campo === "horario" ? (
              <Campo rotulo="Novo horário" obrigatorio>
                <input
                  type="time"
                  value={edicao.valor}
                  onChange={(e) => setEdicao({ ...edicao, valor: e.target.value })}
                  className="prod-campo-entrada"
                  data-novo-horario
                />
              </Campo>
            ) : edicao.sessao.cancelada ? (
              <p className="prod-campo-nota">
                Reativar devolve a sessão à agenda. Quem foi avisado do cancelamento recebe
                um segundo aviso, e é por isso que reativar não é um gesto de rotina.
              </p>
            ) : (
              <Campo
                rotulo="Motivo do cancelamento"
                obrigatorio
                nota="O público lê este texto no alerta."
              >
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={3}
                  className="prod-campo-entrada"
                  data-motivo-cancelamento
                  aria-invalid={motivo.trim() === ""}
                />
              </Campo>
            )}

            {/* O NÚMERO, ANTES DE CONFIRMAR. */}
            <div className="prod-impedimentos" data-aviso-de-alcance>
              <p className="prod-impedimentos-frase">
                {(() => {
                  const n = quantosSalvaram(edicao.sessao.id);
                  if (n === 0) {
                    return "Ninguém salvou esta sessão. A alteração não dispara alerta.";
                  }
                  return `${n} ${n === 1 ? "pessoa salvou" : "pessoas salvaram"} esta sessão e ${n === 1 ? "será avisada" : "serão avisadas"}.`;
                })()}
              </p>
              {edicao.campo === "horario" ? (
                <p className="prod-impedimento-texto">
                  O alerta mostra <strong>de → para</strong>: de{" "}
                  {edicao.sessao.inicio.slice(11, 16)} para {edicao.valor || "…"}, com o seu
                  nome e a data. Um alerta que só diz «mudou» faz a pessoa reabrir a página
                  para descobrir o quê.
                </p>
              ) : null}
              <p className="prod-impedimento-texto">
                Ele aparece em <strong>/salvos</strong>, junto com os outros, é a mesma
                mecânica que <code>alerta.ts</code> já usa para as duas alterações autoradas
                do Cenário 4.
              </p>
            </div>
          </>
        ) : null}
      </Folha>
    </>
  );
}
