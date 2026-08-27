"use client";

import { useEffect, useMemo, useState } from "react";
import { StudioOrgNavegacao } from "./studio-org-navegacao";
import { useOrganizacao } from "./studio-org-estado";
import {
  CHAVE_DE_ARMAZENAMENTO,
  PORTAS,
  ROTULO_DA_SITUACAO,
  SITUACOES,
  scoreDoRascunho,
} from "@/dados/tipos-acesso";
import type { Porta, RascunhoDoProdutor, Situacao } from "@/dados/tipos-acesso";
import {
  COMO_A_O10_LE_A_FILA,
  CONFORMIDADE_NAO_E_VIGILANCIA,
  midiaPublica,
} from "@/dados/tipos-organizacao";
import type { MidiaDoAcervo } from "@/dados/organizacao";

/**
 * studio-org-conformidade.tsx, O10 · Conformidade da equipe (funcionalidade 168).
 *
 * A FUNCIONALIDADE QUE A AUDITORIA ACHOU. A Organização tinha painel de alcance de público e
 * NÃO via a fila dos próprios produtores, sabia quanta gente viu e não sabia o que estava
 * parado esperando correção. Esta tela é o inverso do painel de alcance, e as duas moram na
 * mesma superfície de propósito.
 *
 * COMO ELA LÊ A FILA, E POR QUE ISSO É LEGÍTIMO. O registro do produtor mora sob outra chave
 * de armazenamento, escrita pelo nível 7. Esta tela a lê pelo CONTRATO COMPARTILHADO,
 * `CHAVE_DE_ARMAZENAMENTO` e `RascunhoDoProdutor` são exportados por `tipos-acesso.ts`, que
 * existe exatamente para atravessar níveis, e a lê EM LEITURA: não há neste arquivo nenhum
 * caminho que escreva no registro do produtor. A organização vê a fila; quem decide sobre ela
 * continua sendo a moderação.
 *
 * A DISTINÇÃO QUE A TORNA ACEITÁVEL. Isto é conformidade, não vigilância: mede o REGISTRO,
 * não a pessoa. O recorte por colaborador existe para a organização corrigir processo, três
 * devoluções pelo mesmo motivo são um problema de instrução, não de quem preencheu,, e
 * nenhuma medida daqui vira nota de desempenho de ninguém. A tela diz isso em cima, e não em
 * letra miúda.
 *
 * O QUE FALTA VEM NOMEADO. «3 registros incompletos» não é trabalho; «o evento X está sem
 * elenco e a mídia Y está sem crédito» é. É a mesma disciplina das outras nove telas.
 *
 * SÓ NA VISÃO WEB (D-67).
 */

interface Props {
  midias: MidiaDoAcervo[];
  organizacao: string;
  autor: string;
  gestorEAutorado: string;
  dataDeReferencia: string;
}

/** O que a leitura do armazenamento do produtor devolve. `null` enquanto não leu. */
type FilaDoProdutor = RascunhoDoProdutor[] | null;

/**
 * Confere a forma do que veio da OUTRA chave de armazenamento.
 *
 * É entrada externa duas vezes: escrita por outro nível, e guardada num lugar que qualquer
 * coisa do mesmo domínio pode ter tocado. A checagem é estreita de propósito, confere o que
 * esta tela realmente lê, e descarta o resto em vez de tentar recuperar.
 */
function pareceRascunho(v: unknown): v is RascunhoDoProdutor {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.situacao === "string" &&
    typeof o.titulo === "string" &&
    typeof o.autor === "string" &&
    Array.isArray(o.elenco) &&
    Array.isArray(o.temporadas) &&
    Array.isArray(o.ocorrencias) &&
    Array.isArray(o.pendencias)
  );
}

/**
 * Lê a fila do produtor, uma vez, depois de montar.
 *
 * `useEffect` e não render: ler `localStorage` durante o render faria o HTML exportado e a
 * página hidratada divergirem. E a leitura é uma só, esta tela não observa a outra em tempo
 * real, porque um painel de conformidade que muda sozinho enquanto alguém o lê é pior do que
 * um que pede recarregamento.
 */
function useFilaDoProdutor(): FilaDoProdutor {
  const [fila, setFila] = useState<FilaDoProdutor>(null);

  useEffect(() => {
    let cru: string | null = null;
    try {
      cru = window.localStorage.getItem(CHAVE_DE_ARMAZENAMENTO);
    } catch (erro) {
      console.error("Conformidade: não foi possível ler a fila do produtor.", erro);
      setFila([]);
      return;
    }
    if (cru === null) {
      setFila([]);
      return;
    }
    let lido: unknown = null;
    try {
      lido = JSON.parse(cru);
    } catch (erro) {
      console.warn("Conformidade: a fila do produtor está ilegível no armazenamento.", erro);
      setFila([]);
      return;
    }
    const bruto = (lido as { rascunhos?: unknown })?.rascunhos;
    setFila(Array.isArray(bruto) ? bruto.filter(pareceRascunho) : []);
  }, []);

  return fila;
}

export function StudioOrgConformidade({
  midias,
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
  const fila = useFilaDoProdutor();

  const registros = fila ?? [];

  const porSituacao = useMemo(() => {
    const conta = new Map<Situacao, number>();
    for (const r of registros) conta.set(r.situacao, (conta.get(r.situacao) ?? 0) + 1);
    return SITUACOES.map((s) => ({ situacao: s, quantos: conta.get(s) ?? 0 }));
  }, [registros]);

  const porColaborador = useMemo(() => {
    const mapa = new Map<string, { total: number; devolvidos: number; publicados: number }>();
    for (const r of registros) {
      const atual = mapa.get(r.autor) ?? { total: 0, devolvidos: 0, publicados: 0 };
      atual.total += 1;
      if (r.situacao === "devolvido") atual.devolvidos += 1;
      if (r.situacao === "publicado") atual.publicados += 1;
      mapa.set(r.autor, atual);
    }
    return [...mapa.entries()].sort((a, b) => b[1].total - a[1].total);
  }, [registros]);

  const porPorta = useMemo(() => {
    const conta = new Map<Porta, number>();
    for (const r of registros) {
      for (const p of r.pendencias) conta.set(p.porta, (conta.get(p.porta) ?? 0) + 1);
    }
    return (Object.keys(PORTAS) as Porta[]).map((p) => ({ porta: p, quantos: conta.get(p) ?? 0 }));
  }, [registros]);

  const scoreMedio = useMemo(() => {
    if (registros.length === 0) return 0;
    const soma = registros.reduce((s, r) => s + scoreDoRascunho(r).score, 0);
    return Math.round(soma / registros.length);
  }, [registros]);

  /** O que falta, NOMEADO, nunca «3 registros incompletos». */
  const faltasNomeadas = useMemo(() => {
    const saida: { texto: string; dono: string | null }[] = [];

    for (const r of registros) {
      if (r.elenco.length === 0) {
        saida.push({ texto: `«${r.titulo}» está sem elenco`, dono: null });
      }
      const semEspaco = r.temporadas.filter((t) => t.espacoId === null).length;
      if (semEspaco > 0) {
        saida.push({
          texto: `«${r.titulo}» tem ${semEspaco} temporada(s) sem espaço declarado`,
          dono: "Organização (142)",
        });
      }
      if (r.imagem !== null && !r.creditoImagem) {
        saida.push({ texto: `«${r.titulo}» tem imagem sem crédito`, dono: null });
      }
    }

    for (const m of midias) {
      if (!midiaPublica(m.creditoImagem, org.midias[m.id])) {
        saida.push({ texto: `a mídia «${m.titulo}» não publica, falta crédito`, dono: null });
      }
    }

    return saida;
  }, [registros, midias, org.midias]);

  return (
    <div className="studio">
      <header className="studio-cabecalho">
        <div className="studio-superficie">
          <p className="studio-rotulo">Studio · Organização · nível 6</p>
          <h1 className="studio-titulo">Conformidade da equipe</h1>
        </div>
        <p className="studio-objetivo">
          A fila dos próprios produtores, que a organização não via. {organizacao} · {autor} ·{" "}
          {dataDeReferencia}.
        </p>
        <p className="studio-nota">{gestorEAutorado}</p>
        <StudioOrgNavegacao ativa="conformidade" />
      </header>

      <section className="studio-painel">
        <h2 className="studio-painel-nome">O que esta tela é, e o que ela não é</h2>
        <div className="web-declaracao">
          <strong>Conformidade, não vigilância</strong>
          <span>{CONFORMIDADE_NAO_E_VIGILANCIA}</span>
        </div>
        <div className="web-declaracao">
          <strong>Como ela lê a fila do produtor</strong>
          <span>{COMO_A_O10_LE_A_FILA}</span>
        </div>
      </section>

      {fila === null || !org.pronto ? (
        <section className="studio-painel">
          <p className="studio-nota">Lendo a fila do produtor neste navegador…</p>
        </section>
      ) : registros.length === 0 ? (
        <section className="studio-painel">
          <h2 className="studio-painel-nome">A fila está vazia neste navegador</h2>
          <p className="studio-nota">
            Nenhum registro do produtor foi encontrado sob a chave compartilhada. Isso não quer
            dizer que a organização não tem produção: quer dizer que a jornada do nível 7 ainda
            não rodou <strong>neste navegador</strong>. Abra a superfície do produtor e volte,
            a tela lê o mesmo armazenamento, e não um servidor.
          </p>
        </section>
      ) : (
        <div className="web-duas-colunas">
          {/* -------- O estado da fila, à esquerda -------- */}
          <div className="studio-forma">
            <section className="studio-painel">
              <div className="studio-painel-cabeca">
                <h2 className="studio-painel-nome">Estado dos registros</h2>
                <span className="studio-pastilha">
                  <span className="studio-pastilha-numero">{registros.length}</span> registros
                </span>
              </div>
              <ul className="org-caixas">
                {porSituacao.map((s) => (
                  <li
                    key={s.situacao}
                    className="org-caixa"
                    data-estado={s.quantos > 0 ? "oferece" : "declarado-ausente"}
                  >
                    <span>
                      {ROTULO_DA_SITUACAO[s.situacao]}, {s.quantos}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="studio-campo-nota">
                Score médio dos cadastros: <strong>{scoreMedio}%</strong>. Ele é calculado pela
                MESMA função que o produtor vê na tela dele, duas contas fariam a organização
                cobrar um número que quem preenche nunca viu.
              </p>
            </section>

            <section className="studio-painel">
              <h2 className="studio-painel-nome">Por colaborador</h2>
              <p className="studio-nota">
                O recorte existe para corrigir processo. Três devoluções pelo mesmo motivo são
                um problema de instrução, não de quem preencheu.
              </p>
              <ul className="org-falta">
                {porColaborador.map(([nome, m]) => (
                  <li key={nome} className="org-falta-item" data-bloqueia="nao">
                    <span>{nome}</span>
                    <span className="org-falta-dono">
                      {m.total} registro(s) · {m.devolvidos} devolvido(s) · {m.publicados}{" "}
                      publicado(s)
                      {m.total > 0
                        ? ` · devolução em ${Math.round((m.devolvidos / m.total) * 100)}%`
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="studio-painel">
              <h2 className="studio-painel-nome">As três portas, somadas</h2>
              <p className="studio-nota">
                Cada porta é uma falta que depende de outro nível. Nenhuma delas bloqueia o
                envio, elas seguem junto, nomeadas, com o responsável.
              </p>
              <ul className="org-falta">
                {porPorta.map((p) => (
                  <li
                    key={p.porta}
                    className="org-falta-item"
                    data-bloqueia={p.quantos > 0 ? "sim" : "nao"}
                  >
                    <span>
                      {PORTAS[p.porta].estado}, {p.quantos}
                    </span>
                    <span className="org-falta-dono">{PORTAS[p.porta].nivel}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* -------- O que falta, nomeado, à direita -------- */}
          <aside className="org-colada studio-forma">
            <section className="studio-painel">
              <div className="studio-painel-cabeca">
                <h2 className="studio-painel-nome">O que falta para publicar</h2>
                <span className="studio-pastilha studio-pastilha-marca">
                  <span className="studio-pastilha-numero">{faltasNomeadas.length}</span> itens
                </span>
              </div>
              <p className="studio-nota">
                Nomeado, e não contado. «3 registros incompletos» não é trabalho; o nome do
                registro e do campo é.
              </p>
              {faltasNomeadas.length === 0 ? (
                <p className="studio-campo-nota">
                  Nada pendente entre os registros lidos e o acervo de mídia.
                </p>
              ) : (
                <ul className="org-falta">
                  {faltasNomeadas.slice(0, 40).map((f, i) => (
                    <li key={`${f.texto}-${i}`} className="org-falta-item" data-bloqueia="sim">
                      <span>{f.texto}</span>
                      {f.dono ? <span className="org-falta-dono">{f.dono}</span> : null}
                    </li>
                  ))}
                </ul>
              )}
              {faltasNomeadas.length > 40 ? (
                <p className="studio-campo-nota">
                  Mostrando 40 de {faltasNomeadas.length}. O corte é da lista, e está declarado
                 , uma lista truncada em silêncio faria a fila parecer menor do que é.
                </p>
              ) : null}
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
