"use client";

import { useMemo, useState } from "react";
import { StudioOrgNavegacao } from "./studio-org-navegacao";
import { useOrganizacao } from "./studio-org-estado";
import {
  ORIGENS_DE_LOTE,
  O_QUE_O_LOTE_NAO_TRAZ,
  POR_QUE_A_PREVIA,
  QUEM_EMITE_A_CHAVE,
  ROTULO_DA_ORIGEM,
  lerLote,
  linhaGravavel,
} from "@/dados/tipos-organizacao";
import type { ChaveDeIntegracao, LinhaDoLote, OrigemDeLote } from "@/dados/tipos-organizacao";
import type {
  DeclaracaoDaTela,
  EventoParaPrograma,
  NumerosDaIntegracao,
} from "@/dados/organizacao";

/**
 * studio-org-integracao.tsx, O8 · Integração (funcionalidades 150 e 151).
 *
 * COMO UMA INSTITUIÇÃO COM CMS PRÓPRIO ALIMENTA A PLATAFORMA SEM DIGITAR DUAS VEZES. E o que
 * a tela faz de diferente de um importador comum é dizer, antes de aplicar, **o que o lote
 * não traz**: espaço cadastrado, elenco com papel, preço e ficha de acessibilidade não vêm em
 * nenhum formato de agenda. Um importador que só mostrasse «12 eventos importados» faria
 * parecer que o trabalho acabou, o que acabou foi a digitação.
 *
 * A PRÉVIA VEM SEMPRE, e não é cautela genérica. O lote é a origem clássica de duplicata, e o
 * critério de identidade roda ANTES de gravar, contra os títulos normalizados dos eventos
 * REAIS do acervo, a mesma normalização do índice de busca, importada e não reescrita.
 *
 * A CHAVE VEM DO ADMIN, E SÓ A REVOGAÇÃO É DAQUI. Não existe `emitirChave` em módulo nenhum
 * desta sessão, e a ausência é a segregação: emitir a própria credencial e definir o próprio
 * teto seria a organização se autorizando, o mesmo defeito de ela se verificar. É a terceira
 * segregação da sessão, e as três moram no código e não num aviso.
 *
 * NÃO HÁ UPLOAD NESTE PROTÓTIPO, e a tela diz isso em vez de simular um: o conteúdo é colado.
 *
 * SÓ NA VISÃO WEB (D-67).
 */

interface Props {
  eventos: EventoParaPrograma[];
  numeros: NumerosDaIntegracao;
  declaracoes: DeclaracaoDaTela[];
  chaves: ChaveDeIntegracao[];
  organizacao: string;
  autor: string;
  gestorEAutorado: string;
  dataDeReferencia: string;
}

const EXEMPLO_ICAL = `BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:Ocupação Artacho Jurado
DTSTART:20260910T190000
DTEND:20261120T200000
LOCATION:Itaú Cultural
END:VEVENT
BEGIN:VEVENT
SUMMARY:Mostra de curtas do Norte
DTSTART:20261002T140000
END:VEVENT
END:VCALENDAR`;

export function StudioOrgIntegracao({
  eventos,
  numeros,
  declaracoes,
  chaves,
  organizacao,
  autor,
  gestorEAutorado,
  dataDeReferencia,
}: Props) {
  const contexto = useMemo(
    () => ({ dataDeReferencia, autor, organizacao }),
    [dataDeReferencia, autor, organizacao],
  );
  const semente = useMemo(() => ({ chaves }), [chaves]);
  const org = useOrganizacao(contexto, semente);

  const [origem, setOrigem] = useState<OrigemDeLote>("ical");
  const [conteudo, setConteudo] = useState(EXEMPLO_ICAL);

  /** O índice de colisão, montado uma vez: título normalizado → título do acervo. */
  const porNormalizado = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const e of eventos) if (!mapa.has(e.normalizado)) mapa.set(e.normalizado, e.titulo);
    return mapa;
  }, [eventos]);

  const previa: LinhaDoLote[] = useMemo(
    () =>
      lerLote(conteudo, origem).map((l) => ({
        ...l,
        colideCom: porNormalizado.get(l.normalizado) ?? null,
      })),
    [conteudo, origem, porNormalizado],
  );

  const gravaveis = previa.filter(linhaGravavel);
  const colidem = previa.filter((l) => l.colideCom !== null);
  const semTitulo = previa.length - gravaveis.length;
  const vaziosPorCampo = useMemo(() => {
    const conta = new Map<string, number>();
    for (const l of previa) for (const v of l.vazios) conta.set(v, (conta.get(v) ?? 0) + 1);
    return [...conta.entries()].sort((a, b) => b[1] - a[1]);
  }, [previa]);

  return (
    <div className="studio">
      <header className="studio-cabecalho">
        <div className="studio-superficie">
          <p className="studio-rotulo">Studio · Organização · nível 6</p>
          <h1 className="studio-titulo">Integração</h1>
        </div>
        <p className="studio-objetivo">
          Como uma instituição com CMS próprio alimenta a plataforma sem digitar duas vezes.{" "}
          {organizacao} · {autor} · {dataDeReferencia}.
        </p>
        <p className="studio-nota">{gestorEAutorado}</p>
        <StudioOrgNavegacao ativa="integracao" />
      </header>

      <section className="studio-painel">
        <h2 className="studio-painel-nome">O que o lote traz, e o que não traz</h2>
        <ul className="web-denominadores">
          <li className="web-denominador">
            <span className="web-denominador-numero">{previa.length}</span>
            <span className="web-denominador-rotulo">linhas na prévia</span>
          </li>
          <li className="web-denominador">
            <span className="web-denominador-numero">{colidem.length}</span>
            <span className="web-denominador-rotulo">colidem por identidade</span>
          </li>
          <li className="web-denominador">
            <span className="web-denominador-numero">{semTitulo}</span>
            <span className="web-denominador-rotulo">sem título, não gravam</span>
          </li>
          <li className="web-denominador">
            <span className="web-denominador-numero">
              {numeros.ocorrenciasComEspaco}/{numeros.ocorrencias}
            </span>
            <span className="web-denominador-rotulo">sessões com espaço, o lote não move</span>
          </li>
        </ul>
        <div className="web-declaracao">
          <strong>O que a importação não inventa</strong>
          {/* `ul` direto e não dentro de um `span`: lista é bloco, e bloco dentro de
              elemento em linha é HTML inválido, o navegador reestrutura a árvore na
              hidratação e o React acusa divergência. */}
          <ul className="org-falta">
            {O_QUE_O_LOTE_NAO_TRAZ.map((t) => (
              <li key={t} className="org-falta-item" data-bloqueia="nao">
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        {declaracoes.map((d) => (
          <div key={d.titulo} className="web-declaracao">
            <strong>{d.titulo}</strong>
            <span>{d.texto}</span>
          </div>
        ))}
      </section>

      {!org.pronto ? (
        <section className="studio-painel">
          <p className="studio-nota">Lendo o histórico guardado neste navegador…</p>
        </section>
      ) : (
        <div className="web-duas-colunas">
          {/* -------- A prévia do lote, à esquerda -------- */}
          <div className="studio-forma">
            <section className="studio-painel">
              <h2 className="studio-painel-nome">Prévia do lote</h2>
              <p className="studio-nota">{POR_QUE_A_PREVIA}</p>

              <div className="studio-acoes">
                {ORIGENS_DE_LOTE.map((o) => (
                  <button
                    key={o}
                    type="button"
                    className={origem === o ? "studio-botao studio-botao-primario" : "studio-botao"}
                    onClick={() => setOrigem(o)}
                  >
                    {ROTULO_DA_ORIGEM[o]}
                  </button>
                ))}
              </div>

              <label className="studio-campo">
                <span className="studio-campo-rotulo">Conteúdo do arquivo</span>
                <textarea
                  className="studio-campo-entrada"
                  rows={8}
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                />
                <span className="studio-campo-nota">
                  Não há upload neste protótipo, e a tela diz isso em vez de simular um: o
                  conteúdo é colado. O leitor pega título, início, fim e local, e ignora o
                  resto, fingir que lê um iCal completo seria prometer o que não existe.
                </span>
              </label>

              {previa.length === 0 ? (
                <p className="studio-campo-nota">
                  Nada legível neste conteúdo. Arquivo ilegível é lote vazio, e a tela diz que
                  veio vazio em vez de derrubar a leitura.
                </p>
              ) : (
                <ul className="org-falta">
                  {previa.map((l, i) => (
                    <li
                      key={`${l.normalizado}-${i}`}
                      className="org-falta-item"
                      data-bloqueia={!linhaGravavel(l) || l.colideCom ? "sim" : "nao"}
                    >
                      <span>
                        {l.titulo || ", sem título,"}
                        {l.inicio ? ` · ${l.inicio}` : ""}
                        {l.local ? ` · ${l.local}` : ""}
                      </span>
                      <span className="org-falta-dono">
                        {!linhaGravavel(l)
                          ? "sem título, não grava, a chave de identidade começa nele"
                          : l.colideCom
                            ? `colide com «${l.colideCom}» do acervo`
                            : l.vazios.length > 0
                              ? `vazio: ${l.vazios.join(", ")}`
                              : "completo"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="studio-acoes">
                <button
                  type="button"
                  className="studio-botao studio-botao-primario"
                  disabled={gravaveis.length === 0}
                  onClick={() => org.registrarLote({ origem, linhas: previa })}
                >
                  Guardar esta prévia
                </button>
              </div>
              {gravaveis.length === 0 ? (
                <p className="studio-campo-nota">
                  Nenhuma linha gravável: sem título não há chave de identidade, e gravar assim
                  produziria registro que a própria fila de duplicatas passaria a acusar.
                </p>
              ) : null}
            </section>
          </div>

          {/* -------- O que ficou vazio, chave e histórico -------- */}
          <aside className="org-colada studio-forma">
            <section className="studio-painel">
              <h2 className="studio-painel-nome">O que ficou vazio</h2>
              {vaziosPorCampo.length === 0 ? (
                <p className="studio-campo-nota">
                  Nenhum campo vazio nesta prévia, o que não quer dizer completo: espaço,
                  elenco, preço e acessibilidade continuam faltando, porque o formato não os
                  carrega.
                </p>
              ) : (
                <ul className="org-caixas">
                  {vaziosPorCampo.map(([campo, quantos]) => (
                    <li key={campo} className="org-caixa" data-estado="declarado-ausente">
                      <span>
                        {campo}, {quantos} de {previa.length}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="studio-painel">
              <h2 className="studio-painel-nome">Chave de integração</h2>
              <p className="studio-nota">{QUEM_EMITE_A_CHAVE}</p>
              {org.chaves.length === 0 ? (
                <p className="studio-campo-nota">
                  O Admin ainda não emitiu chave para esta organização.
                </p>
              ) : (
                <ul className="org-falta">
                  {org.chaves.map((c) => (
                    <li
                      key={c.id}
                      className="org-falta-item"
                      data-bloqueia={c.revogada ? "nao" : "sim"}
                    >
                      <span>
                        {c.rotulo} · {c.escopo} · teto de {c.limitePorDia} chamadas por dia ·{" "}
                        {c.revogada ? "revogada" : "ativa"}
                      </span>
                      <span className="org-falta-dono">
                        emitida por {c.emitidaPor} em {c.emitidaEm}
                      </span>
                      {!c.revogada ? (
                        <button
                          type="button"
                          className="studio-botao"
                          onClick={() => org.revogarChave(c.id)}
                        >
                          Revogar
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="studio-painel">
              <div className="studio-painel-cabeca">
                <h2 className="studio-painel-nome">Histórico de importações</h2>
                <span className="studio-pastilha">
                  <span className="studio-pastilha-numero">{org.lotes.length}</span> lotes
                </span>
              </div>
              {org.lotes.length === 0 ? (
                <p className="studio-campo-nota">Nenhum lote guardado nesta sessão.</p>
              ) : (
                <ul className="org-falta">
                  {org.lotes.map((l) => {
                    const rejeitadas = l.linhas.filter((x) => !linhaGravavel(x)).length;
                    return (
                      <li key={l.id} className="org-falta-item" data-bloqueia="nao">
                        <span>
                          {ROTULO_DA_ORIGEM[l.origem]} · {l.linhas.length} linha(s) ·{" "}
                          {l.linhas.length - rejeitadas} entram · {rejeitadas} rejeitada(s) ·{" "}
                          {l.aplicadoEm ? `aplicado em ${l.aplicadoEm}` : "só prévia"}
                        </span>
                        <span className="org-falta-dono">
                          {l.autor} · {l.quando}
                        </span>
                        {l.aplicadoEm === null ? (
                          <button
                            type="button"
                            className="studio-botao studio-botao-primario"
                            onClick={() => org.aplicarLote(l.id)}
                          >
                            Aplicar
                          </button>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
