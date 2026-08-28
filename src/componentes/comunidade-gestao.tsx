"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { Campo } from "@/componentes/base/ficha-em-atos";
import { Folha } from "@/componentes/base/folha";
import { Monograma, nomeDe } from "@/componentes/comunidade";
import { sementeDoPerfil, useComunidadeGerida } from "@/componentes/comunidade-estado";
import { usePontos } from "@/contexto/pontos";
import { PESSOAS } from "@/dados/comunidade";
import type { ComentarioDefinido, PublicacaoDefinida } from "@/lib/pontos/tipos";

/**
 * comunidade-gestao.tsx — quem está na comunidade, e as regras dela.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ELA JÁ FOI OUTRA COISA DUAS VEZES, e o que sobrou aqui é o que não cabe em outro lugar.
 * Publicar, editar e apagar post mudaram para o próprio feed; nome, chamada, descrição e
 * capa mudaram para o lápis da capa. Sobrou o que é lista: as pessoas.
 *
 * REMOVER TIRA DA LISTA, E NÃO APAGA O QUE A PESSOA ESCREVEU. Histórico de conversa não
 * se reescreve porque quem falou saiu, e apagar comentário existe, no próprio comentário.
 * A tela diz isso onde a decisão é tomada, com o número do que fica.
 *
 * O PERFIL DA PESSOA ABRE AQUI, e não numa rota: estas sete são do cenário da
 * demonstração, não têm página no acervo, e inventar uma daria a elas uma existência que
 * o dado não sustenta. A folha mostra o que existe: nome, cidade, e o que a pessoa
 * escreveu nesta comunidade.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function GestaoDaComunidade({
  comunidadeId,
  nome,
  descricao,
  assinantes,
  hoje,
}: {
  comunidadeId: string;
  nome: string;
  descricao: string;
  assinantes: number;
  hoje: string;
}) {
  const semente = useMemo(
    () => sementeDoPerfil(comunidadeId, nome, descricao),
    [comunidadeId, nome, descricao],
  );
  const armazem = useComunidadeGerida(comunidadeId, semente, hoje);
  const { motor, hidratado } = usePontos();

  const [aberta, setAberta] = useState<string | null>(null);
  const [aRemover, setARemover] = useState<string | null>(null);

  const daComunidade = useMemo<PublicacaoDefinida[]>(
    () =>
      hidratado
        ? motor.atual.publicacoes.filter((p) => p.comunidadeId === comunidadeId)
        : [],
    [motor, hidratado, comunidadeId],
  );

  /** Todo comentário da comunidade, achatado com a publicação de onde veio. */
  const conversas = useMemo(() => {
    const linhas: { autorId: string; corpo: string; onde: string }[] = [];
    const descer = (c: ComentarioDefinido, onde: string) => {
      linhas.push({ autorId: c.autorId, corpo: c.corpo, onde });
      for (const r of c.respostas ?? []) descer(r, onde);
    };
    for (const p of daComunidade) for (const c of p.comentarios) descer(c, p.titulo);
    return linhas;
  }, [daComunidade]);

  const quantosDe = (autorId: string) =>
    conversas.filter((c) => c.autorId === autorId).length;
  const comentariosDe = (autorId: string) =>
    conversas.filter((c) => c.autorId === autorId);

  if (!armazem.pronto) {
    return (
      <div className="prod-corpo">
        <p className="prod-campo-nota">Lendo o que está gravado neste navegador…</p>
      </div>
    );
  }

  const dentro = PESSOAS.filter((p) => !armazem.removidos.includes(p.id));
  const perfilAberto = PESSOAS.find((p) => p.id === aberta) ?? null;

  return (
    <>
      <header className="prod-cabecalho" data-coluna-de-leitura>
        <div className="prod-cabecalho-linha">
          <Link
            href="/studio/comunidade/"
            className="prod-superficie prod-voltar"
            data-voltar-studio
          >
            <span className="prod-voltar-texto">‹ Comunidade</span>
            <span className="prod-voltar-x" aria-hidden>
              ✕
            </span>
          </Link>
          <span className="prod-contagem">{dentro.length} pessoas</span>
        </div>
        <h1 className="prod-titulo">Quem está na comunidade</h1>
      </header>

      <div className="prod-corpo" data-gestao-da-comunidade>
        <div className="prod-inicio-stats" data-numeros-da-comunidade>
          <span className="prod-inicio-stat">
            <strong>{dentro.length}</strong>
            <span>na comunidade</span>
          </span>
          <span className="prod-inicio-stat">
            <strong>{assinantes.toLocaleString("pt-BR")}</strong>
            <span>assinantes, de cenário</span>
          </span>
          <span className="prod-inicio-stat">
            <strong>{conversas.length}</strong>
            <span>comentários somados</span>
          </span>
        </div>

        <section className="prod-secao">
          <h2 className="prod-secao-titulo">Na comunidade</h2>
          {dentro.map((pessoa) => (
            <div className="prod-vinculo" key={pessoa.id} data-pessoa={pessoa.id}>
              <span className="prod-registro-corpo">
                <strong className="prod-registro-titulo">{nomeDe(pessoa.id)}</strong>
                <span className="prod-registro-meta">
                  {pessoa.cidade}
                  {pessoa.uf ? `, ${pessoa.uf}` : ""} · {quantosDe(pessoa.id)}{" "}
                  {quantosDe(pessoa.id) === 1 ? "comentário" : "comentários"}
                </span>
              </span>
              <span className="prod-registro-acoes">
                <BotaoDoStudio
                  curto
                  aoClicar={() => setAberta(pessoa.id)}
                  data-acao="ver-perfil"
                >
                  perfil
                </BotaoDoStudio>
                {/* Nem «Você» nem a casa se removem da própria comunidade: `p-ic` é a
                    pessoa que assina as publicações desta comunidade. */}
                {pessoa.id === "eu" || pessoa.id === "p-ic" ? null : (
                  <BotaoDoStudio
                    curto
                    aoClicar={() => setARemover(pessoa.id)}
                    data-acao="remover-pessoa"
                  >
                    remover
                  </BotaoDoStudio>
                )}
              </span>
            </div>
          ))}
        </section>

        {armazem.removidos.length > 0 ? (
          <section className="prod-secao">
            <h2 className="prod-secao-titulo">Fora da comunidade</h2>
            {armazem.removidos.map((id) => (
              <div className="prod-vinculo" key={id} data-pessoa-removida={id}>
                <span className="prod-registro-corpo">
                  <strong className="prod-registro-titulo">{nomeDe(id)}</strong>
                </span>
                <span className="prod-registro-acoes">
                  <BotaoDoStudio
                    curto
                    aoClicar={() => armazem.readmitir(id)}
                    data-acao="readmitir-pessoa"
                  >
                    trazer de volta
                  </BotaoDoStudio>
                </span>
              </div>
            ))}
          </section>
        ) : null}

        <section className="prod-secao">
          <h2 className="prod-secao-titulo">Regras</h2>

          <Campo rotulo="Quem publica">
            <select
              value={armazem.perfil.quemPublica}
              onChange={(e) =>
                armazem.alterarPerfil({
                  quemPublica: e.target.value as "so-a-casa" | "quem-segue",
                })
              }
              className="prod-campo-entrada"
              data-quem-publica
            >
              <option value="so-a-casa">Só a casa</option>
              <option value="quem-segue">Quem segue a comunidade</option>
            </select>
          </Campo>

          <label className="prod-dimensao">
            <input
              type="checkbox"
              checked={armazem.perfil.comentariosAbertos}
              onChange={(e) =>
                armazem.alterarPerfil({ comentariosAbertos: e.target.checked })
              }
              data-comentarios-abertos
            />
            <span className="prod-dimensao-rotulo">Comentários abertos</span>
          </label>
        </section>

      </div>

      {/* ---- o perfil, aqui mesmo ---- */}
      <Folha
        aberta={aberta !== null}
        titulo={aberta ? nomeDe(aberta) : ""}
        aoFechar={() => setAberta(null)}
      >
        {perfilAberto ? (
          <>
            <div className="prod-registro-acoes">
              <Monograma autorId={perfilAberto.id} />
              <span className="prod-registro-corpo">
                <strong className="prod-registro-titulo">{nomeDe(perfilAberto.id)}</strong>
                <span className="prod-registro-meta">
                  {perfilAberto.cidade}
                  {perfilAberto.uf ? `, ${perfilAberto.uf}` : ""}
                </span>
              </span>
            </div>

            <p className="prod-campo-nota">
              {quantosDe(perfilAberto.id) === 0
                ? "Ainda não escreveu nada nesta comunidade."
                : `${quantosDe(perfilAberto.id)} comentário(s) nesta comunidade.`}
            </p>

            {comentariosDe(perfilAberto.id).map((c, i) => (
              <div className="prod-vinculo" key={i}>
                <span className="prod-registro-corpo">
                  <strong className="prod-registro-titulo">{c.onde}</strong>
                  <span className="prod-registro-meta">{c.corpo}</span>
                </span>
              </div>
            ))}

          </>
        ) : null}
      </Folha>

      {/* ---- remover, com o que fica dito antes ---- */}
      <Folha
        aberta={aRemover !== null}
        titulo="Remover da comunidade"
        aoFechar={() => setARemover(null)}
        rodape={
          <BotaoDoStudio
            primaria
            aoClicar={() => {
              if (aRemover) armazem.remover(aRemover);
              setARemover(null);
            }}
            data-confirmar-remover-pessoa
          >
            Remover
          </BotaoDoStudio>
        }
      >
        {aRemover !== null ? (
          <div className="prod-impedimentos" data-alcance-de-remover>
            <p className="prod-impedimentos-frase">
              {nomeDe(aRemover)} sai da lista da comunidade.
            </p>
            <p className="prod-impedimento-texto">
              {quantosDe(aRemover) === 0
                ? "Ela não escreveu nada aqui."
                : `Os ${quantosDe(aRemover)} comentário(s) dela continuam nas publicações: histórico de conversa não se reescreve porque quem falou saiu. Apagar comentário é gesto do próprio comentário.`}
            </p>
          </div>
        ) : null}
      </Folha>
    </>
  );
}
