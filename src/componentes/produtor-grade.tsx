"use client";

import { useMemo, useState } from "react";
import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { Campo } from "@/componentes/base/ficha-em-atos";
import {
  NOMES_DOS_DIAS,
  dataLegivel,
  diaDaSemana,
  diasEntre,
  partesDaData,
  somarDias,
} from "@/componentes/base/seletores-de-tempo";
import { emReais, minutosEntre, somarMinutos } from "@/dados/tipos-produtor";
import type { CatalogoDaAgenda } from "@/dados/mock/seed-produtor";
import type { RegistroDeAgenda, SessaoDoProdutor } from "@/dados/tipos-produtor";

/**
 * produtor-grade.tsx, o ato 5: a grade de sessões. **O mais difícil em 370px.**
 *
 * O GERADOR EXISTE PORQUE NINGUÉM DIGITA 261 SESSÕES. Uma temporada de três meses com
 * sessões de quinta a domingo produz mais de duzentas ocorrências, e a alternativa ao
 * gerador é o produtor desistir de declarar as sessões, que é exatamente o estado do
 * acervo hoje: 129 de 300 eventos têm sessão, e 158 temporadas não têm nenhuma.
 *
 * A PRÉVIA VEM ANTES DE APLICAR, e não depois. «Gera 39 sessões · 2 colidem» dito antes do
 * clique é uma decisão; dito depois, é uma limpeza. O teto de 200 está na prévia pelo mesmo
 * motivo, quem pede uma grade de mil precisa saber disso enquanto ainda pode mudar o
 * intervalo.
 *
 * O DETECTOR DE COLISÃO CONTINUA VALENDO. Duas sessões com a mesma temporada, o mesmo
 * início e o mesmo espaço têm a MESMA chave de ocorrência, são o mesmo registro escrito
 * duas vezes, e é isso que a fila de duplicatas existe para pegar. Aqui elas nem nascem.
 *
 * NO APP A SESSÃO É CARTÃO AGRUPADO POR DIA; NA WEB É TABELA. Mesma árvore JSX, divergência
 * em CSS puro sob `[data-view]` (D-05).
 */

/** O teto de sessões geradas de uma vez. Não é limite do armazém, é o ponto em que a
 *  prévia deixa de ser conferível e vira uma parede de linhas. */
const TETO = 200;

interface Gerador {
  /** 0 = domingo. */
  dias: number[];
  horarios: string[];
  de: string;
  ate: string;
  duracaoMinutos: number | null;
}

const GERADOR_VAZIO: Gerador = {
  dias: [],
  horarios: ["20:00"],
  de: "",
  ate: "",
  duracaoMinutos: null,
};

export function GradeDeSessoes({
  registro,
  catalogo,
  aoAlterar,
}: {
  registro: RegistroDeAgenda;
  catalogo: CatalogoDaAgenda;
  aoAlterar: (m: Partial<RegistroDeAgenda>) => void;
}) {
  const primeira = registro.temporadas[0];
  const [gerador, setGerador] = useState<Gerador>(() => ({
    ...GERADOR_VAZIO,
    de: primeira?.inicio ?? "",
    ate: primeira?.fim ?? "",
  }));

  const previa = useMemo(
    () => calcularPrevia(gerador, registro),
    [gerador, registro],
  );

  if (registro.temporadas.length === 0) {
    return (
      <div className="prod-vazio">
        <p className="prod-vazio-frase">
          Sem temporada não há sessão: a chave da ocorrência é montada SOBRE a da temporada,
          e uma sessão sem ela gravaria chave de duas partes em vez de três.
        </p>
      </div>
    );
  }

  function aplicar() {
    if (previa.geradas.length === 0) return;
    aoAlterar({
      sessoes: [...registro.sessoes, ...previa.geradas.filter((s) => !s.colide).map((s) => s.sessao)],
    });
    setGerador((g) => ({ ...g, dias: [] }));
  }

  function alterarSessao(id: string, m: Partial<SessaoDoProdutor>) {
    aoAlterar({
      sessoes: registro.sessoes.map((s) => (s.id === id ? { ...s, ...m } : s)),
    });
  }

  const porDia = agruparPorDia(registro.sessoes);

  return (
    <>
      {/* ---- O GERADOR ---- */}
      <div className="prod-gerador" data-gerador>
        <h3 className="prod-secao-titulo">Gerador</h3>

        <Campo rotulo="Dias da semana">
          <div className="prod-dias" role="group" aria-label="dias da semana">
            {NOMES_DOS_DIAS.map((nome, n) => (
              <button
                key={nome}
                type="button"
                className="prod-dia"
                data-dia={String(n)}
                data-marcado={gerador.dias.includes(n) ? "sim" : "nao"}
                aria-pressed={gerador.dias.includes(n)}
                onClick={() =>
                  setGerador((g) => ({
                    ...g,
                    dias: g.dias.includes(n)
                      ? g.dias.filter((d) => d !== n)
                      : [...g.dias, n].sort((a, b) => a - b),
                  }))
                }
              >
                {nome}
              </button>
            ))}
          </div>
        </Campo>

        <Campo rotulo="Horários">
          <div className="prod-horarios">
            {gerador.horarios.map((h, i) => (
              <div className="prod-horario" key={`h${i}`}>
                <input
                  type="time"
                  value={h}
                  onChange={(e) =>
                    setGerador((g) => ({
                      ...g,
                      horarios: g.horarios.map((x, n) => (n === i ? e.target.value : x)),
                    }))
                  }
                  className="prod-campo-entrada"
                  aria-label={`horário ${i + 1}`}
                  data-horario={String(i)}
                />
                {gerador.horarios.length > 1 ? (
                  <BotaoDoStudio
                    curto
                    aoClicar={() =>
                      setGerador((g) => ({
                        ...g,
                        horarios: g.horarios.filter((_, n) => n !== i),
                      }))
                    }
                    data-acao="remover-horario"
                  >
                    ✕
                  </BotaoDoStudio>
                ) : null}
              </div>
            ))}
            <BotaoDoStudio
              curto
              aoClicar={() =>
                setGerador((g) => ({ ...g, horarios: [...g.horarios, "20:00"] }))
              }
              data-acao="mais-horario"
            >
              + horário
            </BotaoDoStudio>
          </div>
        </Campo>

        <div className="prod-par">
          <Campo rotulo="De">
            <input
              type="date"
              value={gerador.de}
              onChange={(e) => setGerador((g) => ({ ...g, de: e.target.value }))}
              className="prod-campo-entrada"
              data-gerador-de
            />
          </Campo>
          <Campo rotulo="Até">
            <input
              type="date"
              value={gerador.ate}
              min={gerador.de || undefined}
              onChange={(e) => setGerador((g) => ({ ...g, ate: e.target.value }))}
              className="prod-campo-entrada"
              data-gerador-ate
            />
          </Campo>
        </div>

        <Campo
          rotulo="Duração (minutos)"
          nota="O fim de cada sessão é calculado a partir dela. Quem preenche um vê o outro."
        >
          <input
            type="number"
            min={0}
            step={5}
            value={gerador.duracaoMinutos ?? ""}
            onChange={(e) =>
              setGerador((g) => ({
                ...g,
                duracaoMinutos: e.target.value === "" ? null : Number(e.target.value),
              }))
            }
            className="prod-campo-entrada"
            data-gerador-duracao
          />
        </Campo>

        {/* ---- A PRÉVIA, ANTES DE APLICAR ---- */}
        <div className="prod-previa-grade" data-previa-grade={String(previa.geradas.length)}>
          {previa.motivo ? (
            <p className="prod-campo-nota">{previa.motivo}</p>
          ) : (
            <>
              <p className="prod-previa-conta">
                Gera <strong>{previa.novas}</strong>{" "}
                {previa.novas === 1 ? "sessão" : "sessões"}
                {previa.estourouTeto ? ` · teto de ${TETO} atingido` : ""}
              </p>
              {previa.colidem > 0 ? (
                <p className="prod-previa-colisao" data-colisoes={String(previa.colidem)}>
                  ⚠ {previa.colidem}{" "}
                  {previa.colidem === 1 ? "colide" : "colidem"} com sessão já declarada:{" "}
                  {previa.colidem === 1 ? "ela não será criada" : "elas não serão criadas"}.
                  Mesma temporada, mesmo início e mesmo espaço é a MESMA chave de ocorrência.
                </p>
              ) : null}
              <BotaoDoStudio
                primaria
                curto
                desabilitado={previa.novas === 0}
                porQueDesabilitado="Escolha ao menos um dia da semana e um intervalo válido."
                aoClicar={aplicar}
                data-acao="aplicar-grade"
              >
                Aplicar
              </BotaoDoStudio>
            </>
          )}
        </div>
      </div>

      {/* ---- AS SESSÕES ---- */}
      <h3 className="prod-secao-titulo" data-total-sessoes={String(registro.sessoes.length)}>
        Sessões · {registro.sessoes.length}
      </h3>

      {registro.sessoes.length === 0 ? (
        <p className="prod-campo-nota">
          Nenhuma sessão ainda. Sem elas o evento aparece na agenda sem data, que é o estado
          de 171 dos 300 eventos do acervo.
        </p>
      ) : (
        <ul className="prod-sessoes" data-lista-sessoes>
          {porDia.map(([dia, sessoes]) => (
            <li key={dia}>
              <div className="prod-dia-grupo" data-dia-grupo={dia}>
                <h4 className="prod-dia-titulo">
                  {dataLegivel(dia)}
                  <span className="prod-campo-nota">
                    {" "}
                    {NOMES_DOS_DIAS[diaDaSemana(dia) ?? 0]} · {sessoes.length}{" "}
                    {sessoes.length === 1 ? "sessão" : "sessões"}
                  </span>
                </h4>
                <ul className="prod-lista">
                  {sessoes.map((s) => (
                    <li key={s.id}>
                      <LinhaDeSessao
                        sessao={s}
                        catalogo={catalogo}
                        aoAlterar={(m) => alterarSessao(s.id, m)}
                        aoRemover={() =>
                          aoAlterar({
                            sessoes: registro.sessoes.filter((x) => x.id !== s.id),
                          })
                        }
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------

function LinhaDeSessao({
  sessao,
  catalogo,
  aoAlterar,
  aoRemover,
}: {
  sessao: SessaoDoProdutor;
  catalogo: CatalogoDaAgenda;
  aoAlterar: (m: Partial<SessaoDoProdutor>) => void;
  aoRemover: () => void;
}) {
  const hora = sessao.inicio.slice(11, 16);
  const espaco = catalogo.espacos.find((e) => e.id === sessao.espacoId);
  const duracao =
    sessao.duracaoMinutos ??
    (sessao.fim ? minutosEntre(sessao.inicio, sessao.fim) : null);

  return (
    <div className="prod-sessao" data-sessao={sessao.id} data-cancelada={sessao.cancelada ? "sim" : "nao"}>
      <div className="prod-sessao-quando">
        <strong className="prod-sessao-hora">{hora}</strong>
        {sessao.fim ? <span>–{sessao.fim.slice(11, 16)}</span> : null}
        {duracao !== null ? (
          <span className="prod-campo-nota">{duracao} min</span>
        ) : null}
      </div>

      <span className="prod-sessao-espaco">
        {espaco?.titulo ?? "espaço não declarado"}
      </span>

      <div className="prod-sessao-edicao">
        <Campo rotulo="Término">
          <input
            type="time"
            value={sessao.fim ? sessao.fim.slice(11, 16) : ""}
            onChange={(e) => {
              const hhmm = e.target.value;
              if (!hhmm) {
                aoAlterar({ fim: null, duracaoMinutos: null });
                return;
              }
              const fim = `${sessao.inicio.slice(0, 10)}T${hhmm}`;
              aoAlterar({ fim, duracaoMinutos: minutosEntre(sessao.inicio, fim) });
            }}
            className="prod-campo-entrada"
            data-fim-sessao
            aria-label="hora de término"
          />
        </Campo>

        <Campo rotulo="Preço">
          <input
            type="number"
            min={0}
            value={sessao.preco === null ? "" : sessao.preco / 100}
            onChange={(e) =>
              aoAlterar({
                preco: e.target.value === "" ? null : Math.round(Number(e.target.value) * 100),
                gratuito: e.target.value === "" ? sessao.gratuito : false,
              })
            }
            className="prod-campo-entrada"
            data-preco-sessao
            aria-label="preço desta sessão"
          />
        </Campo>
      </div>

      <div className="prod-sessao-marcas">
        <label className="prod-dimensao">
          <input
            type="checkbox"
            checked={sessao.gratuito}
            onChange={(e) => aoAlterar({ gratuito: e.target.checked })}
            data-gratuito
          />
          <span className="prod-dimensao-rotulo">gratuita</span>
        </label>
        <label className="prod-dimensao">
          <input
            type="checkbox"
            checked={sessao.esgotado}
            onChange={(e) => aoAlterar({ esgotado: e.target.checked })}
            data-esgotado
          />
          <span className="prod-dimensao-rotulo">esgotada</span>
        </label>
        {sessao.preco !== null ? (
          <span className="prod-sessao-preco">{emReais(sessao.preco)}</span>
        ) : null}
        <BotaoDoStudio curto aoClicar={aoRemover} data-acao="remover-sessao">
          Remover
        </BotaoDoStudio>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// O CÁLCULO, puro, testável, sem relógio
// ---------------------------------------------------------------------------

interface Gerada {
  sessao: SessaoDoProdutor;
  colide: boolean;
}

interface PreviaDaGrade {
  geradas: Gerada[];
  novas: number;
  colidem: number;
  estourouTeto: boolean;
  /** Preenchido quando não há o que gerar, com o motivo. */
  motivo: string | null;
}

/**
 * O que o gerador produziria, sem produzir nada.
 *
 * A CHAVE DA COLISÃO É `temporada + início + espaço`, as três partes da chave de
 * ocorrência da ontologia, e não uma comparação de texto. Duas sessões com a mesma chave são
 * o MESMO registro escrito duas vezes.
 */
function calcularPrevia(g: Gerador, r: RegistroDeAgenda): PreviaDaGrade {
  const vazia: PreviaDaGrade = {
    geradas: [],
    novas: 0,
    colidem: 0,
    estourouTeto: false,
    motivo: null,
  };

  if (g.dias.length === 0) {
    return { ...vazia, motivo: "Escolha ao menos um dia da semana." };
  }
  if (!partesDaData(g.de) || !partesDaData(g.ate)) {
    return { ...vazia, motivo: "Preencha o intervalo, de e até." };
  }
  const total = diasEntre(g.de, g.ate);
  if (total === null) {
    return { ...vazia, motivo: "O intervalo termina antes de começar." };
  }
  if (g.horarios.every((h) => h.trim() === "")) {
    return { ...vazia, motivo: "Preencha ao menos um horário." };
  }

  // A temporada que CONTÉM cada data. Uma sessão fora de toda temporada não teria chave,
  // e é por isso que ela cai na primeira em vez de nascer órfã.
  const temporadaDe = (dia: string): string => {
    const dentro = r.temporadas.find(
      (t) => t.inicio !== "" && t.fim !== "" && dia >= t.inicio && dia <= t.fim,
    );
    return (dentro ?? r.temporadas[0])?.id ?? "";
  };

  const jaExistem = new Set(
    r.sessoes.map((s) => `${s.temporadaId}|${s.inicio}|${s.espacoId ?? "—"}`),
  );

  const geradas: Gerada[] = [];
  let estourouTeto = false;
  let dia = g.de;

  for (let i = 0; i < total; i += 1) {
    const semana = diaDaSemana(dia);
    if (semana !== null && g.dias.includes(semana)) {
      for (const h of g.horarios) {
        if (h.trim() === "") continue;
        if (geradas.length >= TETO) {
          estourouTeto = true;
          break;
        }
        const temporadaId = temporadaDe(dia);
        const temporada = r.temporadas.find((t) => t.id === temporadaId);
        const inicio = `${dia}T${h}`;
        const espacoId = temporada?.espacoId ?? null;
        const chave = `${temporadaId}|${inicio}|${espacoId ?? "—"}`;
        geradas.push({
          colide: jaExistem.has(chave),
          sessao: {
            // ID DETERMINÍSTICO: mesma entrada, mesmo id. Dois navegadores rodando a mesma
            // demonstração chegam ao mesmo resultado, e a captura de ontem continua batendo.
            id: `sessao:${r.id}:${dia}:${h.replace(":", "")}`,
            temporadaId,
            inicio,
            fim: g.duracaoMinutos ? somarMinutos(inicio, g.duracaoMinutos) : null,
            duracaoMinutos: g.duracaoMinutos,
            espacoId,
            gratuito: r.cobranca === "gratuito",
            preco: null,
            precoEstruturado: null,
            esgotado: false,
            cancelada: false,
            motivoDoCancelamento: null,
          },
        });
      }
    }
    if (estourouTeto) break;
    dia = somarDias(dia, 1);
  }

  const colidem = geradas.filter((x) => x.colide).length;
  return {
    geradas,
    novas: geradas.length - colidem,
    colidem,
    estourouTeto,
    motivo: geradas.length === 0 ? "Nenhum dia do intervalo casa com os dias escolhidos." : null,
  };
}

/** As sessões agrupadas por dia, em ordem. No app cada grupo é um cartão; na web, uma
 *  seção da tabela, mesma árvore, outro CSS. */
function agruparPorDia(sessoes: readonly SessaoDoProdutor[]): [string, SessaoDoProdutor[]][] {
  const mapa = new Map<string, SessaoDoProdutor[]>();
  for (const s of sessoes) {
    const dia = s.inicio.slice(0, 10);
    const lista = mapa.get(dia) ?? [];
    lista.push(s);
    mapa.set(dia, lista);
  }
  return [...mapa.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([dia, lista]) => [dia, lista.sort((x, y) => (x.inicio < y.inicio ? -1 : 1))]);
}
