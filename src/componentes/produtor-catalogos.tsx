"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { Campo } from "@/componentes/base/ficha-em-atos";
import { Folha } from "@/componentes/base/folha";
import { useProdutor } from "@/componentes/produtor-estado";
import { normalizar } from "@/dados/indice";
import type { ContextoDoProdutor, Registro } from "@/dados/tipos-produtor";

/**
 * produtor-catalogos.tsx, tudo o que é lista de escolha passa a ser dele.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DEZESSEIS CATÁLOGOS, TRÊS DELES FECHADOS, e a tela diz por quê em cada caso.
 *
 * Os treze abertos são vocabulário de PRODUTO: linguagens, temas, categorias, seções,
 * formatos, séries, programas, papéis. Quem produz é quem sabe se falta uma categoria.
 *
 * Os três fechados são de outra natureza:
 *   · as 8 DIMENSÕES DE ACESSIBILIDADE vêm do CMS do Itaú Cultural e da norma;
 *   · os 5 RECURSOS FÍSICOS, da mesma norma;
 *   · o TERRITÓRIO é governança da plataforma, só a Administração acrescenta município.
 *
 * Inventar uma categoria de acessibilidade seria inventar um direito. Inventar um município
 * seria inventar um lugar. Os dois são exatamente o tipo de coisa que não se inventa.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * O ALCANCE É MEDIDO ANTES DE CONFIRMAR. «Este termo está em 68 registros; fundir move
 * todos» dito antes do clique é uma decisão; dito depois, é um estrago. É o mesmo mecanismo
 * que o tesauro da Redação já usa.
 *
 * ARQUIVAR NÃO APAGA. O termo some dos seletores e continua nos registros que já o usam,
 * apagar reescreveria o passado, e um registro publicado perderia uma classificação que ele
 * de fato teve.
 */

export interface CatalogoModelavel {
  id: string;
  nome: string;
  /** Uma linha do que ele classifica. */
  objetivo: string;
  /** Onde ele mora hoje, no código. A trilha de conferência. */
  origem: string;
  termos: { id: string; rotulo: string; cor?: string | null; usos?: number }[];
  /** `false` nos três de governança, com o motivo. */
  aberto: boolean;
  porQueFechado?: string;
  /** A frase que declara a consequência de mexer neste catálogo. */
  consequencia?: string;
}

type Acao = "renomear" | "fundir" | "arquivar";

interface Pendente {
  catalogo: CatalogoModelavel;
  termo: { id: string; rotulo: string; usos?: number };
  acao: Acao;
}

export function TelaDeCatalogos({
  catalogos,
  semente,
  contexto,
}: {
  catalogos: CatalogoModelavel[];
  semente: Registro[];
  contexto: ContextoDoProdutor;
}) {
  const armazem = useProdutor(semente, contexto);
  const [abertoId, setAbertoId] = useState<string | null>(catalogos[0]?.id ?? null);
  const [pendente, setPendente] = useState<Pendente | null>(null);
  const [valor, setValor] = useState("");

  /**
   * O ALCANCE MEDIDO NOS REGISTROS DO PRODUTOR.
   *
   * O número do acervo vem no catálogo, calculado no build; este é o do que ESTE navegador
   * escreveu. Os dois são somados na frase de confirmação, porque fundir um termo move os
   * dois conjuntos, e mostrar só um deles subestimaria o estrago.
   */
  const usosNosRegistros = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const r of armazem.registros) {
      for (const id of [...r.linguagens, ...r.temas]) {
        mapa.set(id, (mapa.get(id) ?? 0) + 1);
      }
    }
    return mapa;
  }, [armazem.registros]);

  const aberto = catalogos.find((c) => c.id === abertoId) ?? catalogos[0];

  /** Os termos que as fichas PROPUSERAM e que ainda não estão no vocabulário. */
  const propostos = useMemo(() => {
    const mapa = new Map<string, string[]>();
    for (const r of armazem.registros) {
      for (const t of r.termosPropostos) {
        const lista = mapa.get(normalizar(t)) ?? [];
        lista.push(r.titulo || r.id);
        mapa.set(normalizar(t), lista);
      }
    }
    return [...mapa.entries()].map(([termo, registros]) => ({ termo, registros }));
  }, [armazem.registros]);

  return (
    <>
      <header className="prod-cabecalho">
        <div className="prod-cabecalho-linha">
          <Link href="/studio/" className="prod-superficie prod-voltar" data-voltar-studio>
            ‹ Studio
          </Link>
          <span className="prod-contagem">{catalogos.length} catálogos</span>
        </div>
        <h1 className="prod-titulo">Catálogos</h1>
        <p className="prod-objetivo">
          Tudo o que é lista de escolha nas fichas. Treze você modela; três são fechados, e
          cada um diz por quê.
        </p>
      </header>

      <div className="prod-corpo">
        {/* ---- os termos propostos pelas fichas chegam aqui ---- */}
        {propostos.length > 0 ? (
          <section className="prod-secao">
            <h2 className="prod-secao-titulo">
              Propostos pelas fichas · {propostos.length}
            </h2>
            <div className="prod-pendencias" data-termos-propostos={String(propostos.length)}>
              <span className="prod-pendencia-dono">Editor / Curador (130)</span>
              {propostos.map((p) => (
                <p className="prod-pendencia-texto" key={p.termo}>
                  <strong>{p.termo}</strong>, proposto em {p.registros.length}{" "}
                  {p.registros.length === 1 ? "registro" : "registros"}:{" "}
                  {p.registros.slice(0, 3).join(", ")}
                  {p.registros.length > 3 ? "…" : ""}
                </p>
              ))}
              <p className="prod-pendencia-texto">
                <em>
                  Aprovar põe o termo no vocabulário; fundir aponta-o para um termo que já
                  existe. Nenhuma das duas impede publicar, o registro segue com o termo
                  marcado como proposto.
                </em>
              </p>
            </div>
          </section>
        ) : null}

        {/* ---- o trilho dos catálogos ---- */}
        <nav className="prod-trilho" aria-label="os catálogos">
          {catalogos.map((c) => (
            <button
              key={c.id}
              type="button"
              className="prod-pauta"
              data-catalogo={c.id}
              data-ativa={c.id === aberto?.id ? "sim" : "nao"}
              onClick={() => setAbertoId(c.id)}
            >
              {c.nome} · {c.termos.length}
            </button>
          ))}
        </nav>

        {aberto ? (
          <section className="prod-secao" data-catalogo-aberto={aberto.id}>
            <h2 className="prod-secao-titulo">{aberto.nome}</h2>
            <p className="prod-campo-nota">{aberto.objetivo}</p>
            <p className="prod-campo-nota">
              <strong>Onde ele mora hoje:</strong> <code>{aberto.origem}</code>
            </p>

            {!aberto.aberto ? (
              <div className="prod-pendencias" data-catalogo-fechado={aberto.id}>
                <span className="prod-pendencia-dono">catálogo fechado</span>
                <p className="prod-pendencia-texto">{aberto.porQueFechado}</p>
              </div>
            ) : aberto.consequencia ? (
              <div className="prod-impedimentos">
                <p className="prod-impedimentos-frase">{aberto.consequencia}</p>
              </div>
            ) : null}

            <ul className="prod-lista" data-termos={String(aberto.termos.length)}>
              {aberto.termos.map((t) => {
                const noAcervo = t.usos ?? 0;
                const meus = usosNosRegistros.get(t.id) ?? 0;
                return (
                  <li key={t.id}>
                    <div className="prod-vinculo" data-termo={t.id}>
                      <span className="prod-registro-corpo">
                        <strong
                          className="prod-registro-titulo"
                          style={
                            t.cor
                              ? ({ "--cor-termo": `var(${t.cor})` } as React.CSSProperties)
                              : undefined
                          }
                          data-tem-cor={t.cor ? "sim" : "nao"}
                        >
                          {t.rotulo}
                        </strong>
                        {/* O ALCANCE, SEMPRE À VISTA. Um termo com 68 usos e outro com 1
                            pedem decisões diferentes, e o número é o que separa os dois. */}
                        <span className="prod-registro-meta">
                          {noAcervo > 0 ? `${noAcervo} no acervo` : "não usado no acervo"}
                          {meus > 0 ? ` · ${meus} nos seus registros` : ""}
                        </span>
                      </span>
                      {aberto.aberto ? (
                        <span className="prod-registro-acoes">
                          {(["renomear", "fundir", "arquivar"] as const).map((a) => (
                            <BotaoDoStudio
                              key={a}
                              curto
                              aoClicar={() => {
                                setPendente({ catalogo: aberto, termo: t, acao: a });
                                setValor(a === "renomear" ? t.rotulo : "");
                              }}
                              data-acao={a}
                            >
                              {a}
                            </BotaoDoStudio>
                          ))}
                        </span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>

            {aberto.aberto ? (
              <BotaoDoStudio
                aoClicar={() => {
                  setPendente({
                    catalogo: aberto,
                    termo: { id: "", rotulo: "" },
                    acao: "renomear",
                  });
                  setValor("");
                }}
                data-acao="criar-termo"
              >
                + criar termo em {aberto.nome}
              </BotaoDoStudio>
            ) : null}
          </section>
        ) : null}
      </div>

      {/* ---- a confirmação, com o alcance MEDIDO ANTES ---- */}
      <Folha
        aberta={pendente !== null}
        titulo={pendente ? tituloDaAcao(pendente) : ""}
        descricao={pendente ? descricaoDaAcao(pendente, usosNosRegistros) : undefined}
        aoFechar={() => setPendente(null)}
        rodape={
          <BotaoDoStudio
            primaria
            aoClicar={() => setPendente(null)}
            data-confirmar-acao
            desabilitado={pendente?.acao !== "arquivar" && valor.trim() === ""}
            porQueDesabilitado="Escreva o novo rótulo."
          >
            Confirmar
          </BotaoDoStudio>
        }
      >
        {pendente ? (
          <>
            {pendente.acao !== "arquivar" ? (
              <Campo
                rotulo={pendente.acao === "renomear" ? "Novo rótulo" : "Fundir com"}
                obrigatorio
              >
                <input
                  type="text"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="prod-campo-entrada"
                  data-valor-acao
                />
              </Campo>
            ) : null}

            {/* O ALCANCE MEDIDO, na frase que a pessoa lê antes de confirmar. */}
            <div className="prod-impedimentos" data-alcance-da-acao>
              <p className="prod-impedimentos-frase">
                {alcanceEmFrase(pendente, usosNosRegistros)}
              </p>
            </div>

            {pendente.acao === "arquivar" ? (
              <p className="prod-campo-nota">
                <strong>Arquivar não apaga.</strong> O termo some dos seletores e continua
                nos registros que já o usam, apagar reescreveria o passado, e um registro
                publicado perderia uma classificação que ele de fato teve.
              </p>
            ) : null}

            <p className="prod-campo-nota" data-mock-catalogo>
              <strong>Mock explícito:</strong> esta demonstração não reescreve o vocabulário
              gerado, que é lido do build. O que a tela prova é o MECANISMO, o alcance
              medido antes, a consequência dita antes, e o arquivamento que não apaga.
            </p>
          </>
        ) : null}
      </Folha>
    </>
  );
}

// ---------------------------------------------------------------------------

function tituloDaAcao(p: Pendente): string {
  if (p.termo.id === "") return `Criar termo em ${p.catalogo.nome}`;
  return `${p.acao[0]?.toUpperCase()}${p.acao.slice(1)} «${p.termo.rotulo}»`;
}

function descricaoDaAcao(p: Pendente, meus: Map<string, number>): string {
  if (p.termo.id === "") return `Um termo novo em ${p.catalogo.nome}.`;
  const total = (p.termo.usos ?? 0) + (meus.get(p.termo.id) ?? 0);
  return `${total} ${total === 1 ? "registro usa" : "registros usam"} este termo.`;
}

/** A frase de consequência, com o número. Nunca «isto pode afetar vários registros». */
function alcanceEmFrase(p: Pendente, meus: Map<string, number>): string {
  const noAcervo = p.termo.usos ?? 0;
  const nosMeus = meus.get(p.termo.id) ?? 0;
  const total = noAcervo + nosMeus;

  if (p.termo.id === "") {
    return "Nenhum registro usa este termo ainda, ele nasce vazio e passa a aparecer nos seletores.";
  }
  if (total === 0) {
    return "Nenhum registro usa este termo. A mudança não move nada.";
  }
  const quantos = `${total} ${total === 1 ? "registro" : "registros"}`;
  const detalhe =
    nosMeus > 0 && noAcervo > 0
      ? ` (${noAcervo} no acervo, ${nosMeus} seus)`
      : "";

  switch (p.acao) {
    case "renomear":
      return `${quantos}${detalhe} passam a mostrar o rótulo novo. O id não muda, então nada se perde.`;
    case "fundir":
      return `Fundir MOVE ${quantos}${detalhe} para o termo escolhido. O termo de origem deixa de existir nos seletores.`;
    case "arquivar":
      return `${quantos}${detalhe} continuam com este termo. Ele some dos seletores e não é oferecido a novos registros.`;
  }
}
