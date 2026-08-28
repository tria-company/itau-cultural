"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  ICONE_CHEVRON_ESQUERDA,
  ICONE_CORACAO,
  ICONE_CORACAO_CHEIO,
  ICONE_ENVIAR,
  ICONE_FALA,
  ICONE_SALVOS,
} from "@/componentes/base/icones";
import { Monograma, assinaturaDe, nomeDe } from "@/componentes/comunidade";
import { Vazio } from "@/componentes/pontos-base";
import { usePontos } from "@/contexto/pontos";
import type { ComentarioDefinido } from "@/lib/pontos/tipos";

function Thread({
  comentario,
  indiceRaiz,
  aoResponder,
  profundidade = 0,
}: {
  comentario: ComentarioDefinido;
  indiceRaiz: number;
  aoResponder: (nome: string, indiceRaiz: number) => void;
  profundidade?: number;
}) {
  const [curtiu, setCurtiu] = useState(false);
  const reacoes = (comentario.reacoes ?? 0) + (curtiu ? 1 : 0);
  const temRespostas = Boolean(comentario.respostas?.length);
  const nome = nomeDe(comentario.autorId);

  return (
    <div className="thread">
      <div className="thread-coluna">
        <Monograma autorId={comentario.autorId} pequeno={profundidade > 0} />
        {temRespostas && <span className="thread-trilho" aria-hidden="true" />}
      </div>

      <div className="thread-corpo">
        <span className="tipo-legenda">
          <span className="font-bold">{nome}</span>
          {comentario.quandoRotulo && (
            <span className="text-tinta-3"> · {comentario.quandoRotulo}</span>
          )}
        </span>
        <p className="tipo-detalhe">{comentario.corpo}</p>

        <div className="thread-acoes">
          <button
            type="button"
            className="thread-acao"
            data-ativa={curtiu ? "sim" : "nao"}
            onClick={() => setCurtiu((v) => !v)}
            aria-pressed={curtiu}
            aria-label="Curtir comentário"
          >
            {curtiu ? ICONE_CORACAO_CHEIO : ICONE_CORACAO}
            <span>{reacoes}</span>
          </button>
          {profundidade === 0 && (
            <button
              type="button"
              className="thread-acao"
              onClick={() => aoResponder(nome, indiceRaiz)}
            >
              Responder
            </button>
          )}
        </div>

        {temRespostas && (
          <div className="thread-respostas">
            {comentario.respostas?.map((resposta, i) => (
              <Thread
                key={i}
                comentario={resposta}
                indiceRaiz={indiceRaiz}
                aoResponder={aoResponder}
                profundidade={profundidade + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function PublicacaoAberta({ id }: { id: string }) {
  const router = useRouter();
  const { motor, hidratado } = usePontos();
  const [texto, setTexto] = useState("");
  const [respondendo, setRespondendo] = useState<{ indice: number; nome: string } | null>(null);
  const campo = useRef<HTMLInputElement>(null);

  const publicacao = motor.atual.publicacoes.find((p) => p.id === id);
  if (!publicacao) return <Vazio>Esta publicação não existe mais.</Vazio>;

  const reagi = hidratado && (motor.atual.reacoesDadas[publicacao.id] ?? 0) > 0;
  const guardada = hidratado && motor.atual.publicacoesSalvas.includes(publicacao.id);
  const total = publicacao.comentarios.reduce(
    (soma, c) => soma + 1 + (c.respostas?.length ?? 0),
    0,
  );

  function responder(nome: string, indice: number) {
    setRespondendo({ indice, nome: nome.split(" ")[0] });
    campo.current?.focus();
  }

  function enviar() {
    const corpo = texto.trim();
    if (!corpo) return;
    motor.emitir(
      "comunidade.comentario.criado",
      { tipo: "publicacao", id: publicacao!.id },
      { corpo, respostaA: respondendo?.indice },
    );
    setTexto("");
    setRespondendo(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="aberta-foto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={publicacao.imagem} alt={publicacao.imagemAlt} />
        <span className="aberta-veu" aria-hidden="true" />
        <div className="aberta-autor">
          <button
            type="button"
            className="aberta-voltar"
            onClick={() => router.back()}
            aria-label="Voltar"
          >
            {ICONE_CHEVRON_ESQUERDA}
          </button>
          <Monograma autorId={publicacao.autorId} />
          <div className="flex min-w-0 flex-col">
            <span className="tipo-detalhe font-bold">{nomeDe(publicacao.autorId)}</span>
            <span className="tipo-legenda">
              {assinaturaDe(publicacao.autorId, publicacao.diasAtras)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="tipo-destaque font-bold">{publicacao.titulo}</h2>
        {publicacao.corpo && <p className="tipo-detalhe">{publicacao.corpo}</p>}
        <span className="credito-foto">
          Foto: {publicacao.imagemCredito}
          {publicacao.fonte && (
            <>
              {" · "}
              <a href={publicacao.fonte} target="_blank" rel="noopener noreferrer">
                ver no site do Itaú Cultural
              </a>
            </>
          )}
        </span>

        <div className="publicacao-rodape">
          <button
            type="button"
            className="pastilha"
            data-ativa={reagi ? "sim" : "nao"}
            onClick={() =>
              !reagi &&
              motor.emitir("comunidade.reacao.dada", { tipo: "publicacao", id: publicacao.id })
            }
            aria-pressed={reagi}
            aria-label="Reagir"
          >
            {reagi ? ICONE_CORACAO_CHEIO : ICONE_CORACAO}
            <span>{publicacao.reacoes}</span>
          </button>
          <button
            type="button"
            className="pastilha"
            data-ativa={guardada ? "sim" : "nao"}
            onClick={() =>
              motor.emitir("comunidade.publicacao.salva", {
                tipo: "publicacao",
                id: publicacao.id,
              })
            }
            aria-pressed={guardada}
            aria-label={guardada ? "Remover dos guardados" : "Guardar"}
            disabled={!hidratado}
          >
            {ICONE_SALVOS}
          </button>
          <span className="tipo-legenda text-tinta-3 inline-flex items-center gap-1">
            <span className="inline-flex size-3.5">{ICONE_FALA}</span>
            {total} {total === 1 ? "comentário" : "comentários"}
          </span>
        </div>
      </div>

      <section className="estante">
        {publicacao.comentarios.length === 0 ? (
          <p className="tipo-legenda text-tinta-3">Seja a primeira pessoa a comentar.</p>
        ) : (
          publicacao.comentarios.map((c, i) => (
            <Thread key={i} comentario={c} indiceRaiz={i} aoResponder={responder} />
          ))
        )}
      </section>

      {respondendo && (
        <div className="tipo-legenda text-tinta-2 flex items-center gap-2">
          Respondendo a <span className="font-bold">{respondendo.nome}</span>
          <button
            type="button"
            className="botao-discreto"
            style={{ padding: "0.1rem 0.6rem" }}
            onClick={() => setRespondendo(null)}
          >
            cancelar
          </button>
        </div>
      )}

      <div className="responder">
        <label className="sr-only" htmlFor="responder">
          Seu comentário
        </label>
        <input
          id="responder"
          ref={campo}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Responder com algo útil…"
          onKeyDown={(e) => {
            if (e.key === "Enter") enviar();
          }}
        />
        <button type="button" onClick={enviar} disabled={!texto.trim()} aria-label="Enviar">
          {ICONE_ENVIAR}
        </button>
      </div>
    </div>
  );
}
