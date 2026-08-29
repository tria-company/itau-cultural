"use client";

import Link from "next/link";
import { useState } from "react";
import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { Campo } from "@/componentes/base/ficha-em-atos";
import { Folha } from "@/componentes/base/folha";
import { useMinhasComunidades } from "@/componentes/comunidade-estado";
import { usePontos } from "@/contexto/pontos";

/**
 * minhas-comunidades.tsx — as comunidades que o produtor mantém.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ESTA TELA É DO STUDIO, E O STUDIO É O QUE ELE MEXE (pedido de 29/08/2026). A aba
 * Comunidade, irmã de Início e Loja, é o que ele LÊ: lá ele escolhe uma comunidade no
 * seletor e acompanha o feed. Aqui ele decide o que aparece nas que são dele.
 *
 * A LISTA NASCE COM UMA. A comunidade da casa vem do build; as outras nascem aqui, em
 * endereços reservados no `out/`, porque sob `output: export` id sem HTML é 404 duro. Por
 * isso a tela diz quantas ainda cabem, em vez de deixar a pessoa descobrir no oitavo clique.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function MinhasComunidades({ hoje }: { hoje: string }) {
  const { motor, hidratado } = usePontos();
  const armazem = useMinhasComunidades(hoje);
  const [criando, setCriando] = useState<{ nome: string; descricao: string } | null>(null);

  const quantas = (comunidadeId: string) =>
    hidratado ? motor.atual.publicacoes.filter((p) => p.comunidadeId === comunidadeId).length : 0;

  const podeCriar = criando !== null && criando.nome.trim() !== "";

  function criar() {
    if (criando === null || !podeCriar) return;
    armazem.criar({ nome: criando.nome, descricao: criando.descricao });
    setCriando(null);
  }

  return (
    <>
      <header className="prod-cabecalho">
        <div className="prod-cabecalho-linha">
          <Link href="/studio/pautas/" className="prod-superficie prod-voltar" data-voltar-studio>
            <span className="prod-voltar-texto">‹ Studio</span>
            <span className="prod-voltar-x" aria-hidden>
              ✕
            </span>
          </Link>
          <span className="prod-contagem">
            {armazem.minhas.length} {armazem.minhas.length === 1 ? "comunidade" : "comunidades"}
          </span>
        </div>
        <h1 className="prod-titulo">Comunidades</h1>
      </header>

      <div className="prod-corpo" data-minhas-comunidades>
        <div className="prod-linha-de-acao">
          <BotaoDoStudio
            curto
            aoClicar={() => setCriando({ nome: "", descricao: "" })}
            desabilitado={!armazem.pronto || armazem.restam <= 0}
            porQueDesabilitado={
              armazem.pronto
                ? "Os endereços reservados para comunidade acabaram nesta demonstração."
                : "Lendo o que está gravado neste navegador…"
            }
            data-criar-comunidade
          >
            + Nova comunidade
          </BotaoDoStudio>
        </div>

        <section className="prod-secao">
          {armazem.minhas.map((c) => (
            <div className="prod-vinculo" key={c.id} data-minha-comunidade={c.id}>
              <span className="prod-registro-corpo">
                <strong className="prod-registro-titulo">{c.nome}</strong>
                <span className="prod-registro-meta">
                  {quantas(c.id)} {quantas(c.id) === 1 ? "publicação" : "publicações"} ·{" "}
                  {c.assinantes.toLocaleString("pt-BR")} assinantes
                </span>
              </span>
              <span className="prod-registro-acoes">
                <Link
                  href={`/studio/minhas-comunidades/${c.id}/`}
                  className="pastilha"
                  data-abrir-comunidade={c.id}
                >
                  Abrir
                </Link>
              </span>
            </div>
          ))}
        </section>
      </div>

      <Folha
        aberta={criando !== null}
        titulo="Nova comunidade"
        aoFechar={() => setCriando(null)}
        rodape={
          <BotaoDoStudio
            primaria
            desabilitado={!podeCriar}
            porQueDesabilitado="Falta o nome."
            aoClicar={criar}
            data-gravar-comunidade
          >
            Criar
          </BotaoDoStudio>
        }
      >
        {criando !== null ? (
          <>
            <Campo rotulo="Nome" obrigatorio>
              <input
                type="text"
                value={criando.nome}
                onChange={(e) => setCriando({ ...criando, nome: e.target.value })}
                className="prod-campo-entrada"
                data-nome-da-comunidade
                aria-invalid={criando.nome.trim() === ""}
              />
            </Campo>

            <Campo rotulo="Descrição">
              <textarea
                value={criando.descricao}
                onChange={(e) => setCriando({ ...criando, descricao: e.target.value })}
                rows={3}
                className="prod-campo-entrada"
                data-descricao-da-comunidade
              />
            </Campo>

            <p className="prod-campo-nota">
              A capa entra depois, no lápis da própria comunidade. Cabem mais{" "}
              {armazem.restam} nesta demonstração.
            </p>
          </>
        ) : null}
      </Folha>
    </>
  );
}
