"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import {
  ICONE_CORACAO,
  ICONE_CORACAO_CHEIO,
  ICONE_FALA,
} from "@/componentes/base/icones";
import { MenuDeEscolha } from "@/componentes/menu-escolha";
import { PalcoYoutube } from "@/componentes/palco";
import { Painel, Vazio } from "@/componentes/pontos-base";
import { nomeGerido } from "@/componentes/comunidade-estado";
import { usePontos } from "@/contexto/pontos";
import {
  COMUNIDADES,
  PRODUTOR_DA_CASA,
  comunidadePorId,
  pessoaPorId,
} from "@/dados/comunidade";
import type { PublicacaoDefinida } from "@/lib/pontos/tipos";

export function Monograma({ autorId, pequeno }: { autorId: string; pequeno?: boolean }) {
  const pessoa = pessoaPorId(autorId);
  return (
    <span className="monograma" data-porte={pequeno ? "pequeno" : undefined} aria-hidden="true">
      {pessoa?.monograma ?? "?"}
    </span>
  );
}

export function nomeDe(autorId: string): string {
  // O NOME QUE O PRODUTOR DEU vence o semeado, e vale nos tres lugares que chamam esta
  // funcao: o cartao do feed, o seletor e a publicacao aberta. Antes de o
  // armazem hidratar ela devolve `null`, e cai no semeado — que e o que o HTML do build
  // traz, entao a hidratacao nao diverge.
  return nomeGerido(autorId) ?? pessoaPorId(autorId)?.nome ?? "Alguém";
}

export function assinaturaDe(autorId: string, diasAtras: number): string {
  const pessoa = pessoaPorId(autorId);
  const quando = diasAtras === 0 ? "hoje" : `há ${diasAtras}d`;
  return pessoa?.cidade ? `${pessoa.cidade} · ${quando}` : quando;
}

function Enquete({ opcoes }: { opcoes: { rotulo: string; pct: number }[] }) {
  const [votou, setVotou] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {opcoes.map((opcao, i) => (
        <button
          key={opcao.rotulo}
          type="button"
          className="enquete-opcao"
          disabled={votou !== null}
          onClick={() => setVotou(i)}
        >
          {votou !== null && (
            <span className="enquete-preenchimento" style={{ width: `${opcao.pct}%` }} />
          )}
          <span className={votou === i ? "font-bold" : undefined}>{opcao.rotulo}</span>
          {votou !== null && <span className="tipo-legenda font-bold">{opcao.pct}%</span>}
        </button>
      ))}
      <span className="tipo-legenda text-tinta-3">
        {votou === null ? "Vote para ver o resultado parcial" : "Obrigado pelo voto."}
      </span>
    </div>
  );
}

/**
 * O CARTÃO DO POST, exportado desde 29/08/2026 para o feed próprio poder reusá-lo.
 *
 * O feed de uma comunidade e o feed de quem segue várias desenham o mesmo objeto, e o
 * autor do post já diz de onde ele veio, porque nas publicações do acervo o autor É a
 * comunidade. Um segundo cartão seria a mesma coisa escrita duas vezes.
 */
export function Cartao({
  publicacao,
  acoesDoDono,
}: {
  publicacao: PublicacaoDefinida;
  acoesDoDono?: ReactNode;
}) {
  const router = useRouter();
  const { motor, hidratado } = usePontos();

  const reagi = hidratado && (motor.atual.reacoesDadas[publicacao.id] ?? 0) > 0;
  const comentarios = publicacao.comentarios.reduce(
    (soma, c) => soma + 1 + (c.respostas?.length ?? 0),
    0,
  );

  function reagir() {
    if (reagi) return;
    motor.emitir("comunidade.reacao.dada", { tipo: "publicacao", id: publicacao.id });
  }

  function abrir() {
    router.push(`/studio/comunidade/publicacao/${publicacao.id}/`);
  }

  return (
    <article className="publicacao">
      <div className="publicacao-topo">
        <Monograma autorId={publicacao.autorId} />
        <div className="flex min-w-0 flex-col">
          <span className="tipo-detalhe font-bold">{nomeDe(publicacao.autorId)}</span>
          <span className="tipo-legenda text-tinta-3">
            {assinaturaDe(publicacao.autorId, publicacao.diasAtras)}
          </span>
        </div>
      </div>

      {/* VÍDEO QUANDO HÁ VÍDEO (2026-08-28). O palco carrega o iframe só depois do
          clique, então o feed continua sem requisição externa até alguém querer ver. Fica
          FORA do botão que abre a publicação: um play dentro de um botão de navegar
          disputaria o mesmo clique. */}
      {publicacao.video ? (
        <PalcoYoutube
          id={publicacao.video}
          titulo={publicacao.titulo}
          poster={publicacao.imagem}
        />
      ) : null}

      <button type="button" className="publicacao-corpo" onClick={abrir}>
        {publicacao.video ? null : (
          <span className="publicacao-imagem">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={publicacao.imagem} alt={publicacao.imagemAlt} loading="lazy" />
          </span>
        )}
        <span className="tipo-destaque font-bold">{publicacao.titulo}</span>
        {publicacao.corpo && (
          <span className="publicacao-chamada">
            <span className="publicacao-trecho">{publicacao.corpo}</span>
            <span className="publicacao-ler-mais">ler mais</span>
          </span>
        )}
      </button>

      {publicacao.enquete && <Enquete opcoes={publicacao.enquete.opcoes} />}

      <div className="publicacao-rodape">
        <button
          type="button"
          className="pastilha"
          data-ativa={reagi ? "sim" : "nao"}
          onClick={reagir}
          aria-pressed={reagi}
          aria-label="Reagir"
        >
          {reagi ? ICONE_CORACAO_CHEIO : ICONE_CORACAO}
          <span>{publicacao.reacoes}</span>
        </button>
        <button type="button" className="pastilha" onClick={abrir} aria-label="Comentar">
          {ICONE_FALA}
          <span>{comentarios}</span>
        </button>
        {/* AS AÇÕES DE QUEM MANTÉM A COMUNIDADE, no próprio post (pedido de 2026-08-28).
            Ficam à direita, discretas, e só aparecem para quem pode: apagar o que se
            publicou não é uma viagem a outra tela, é um gesto sobre a coisa. */}
        {acoesDoDono ? <span className="publicacao-dono">{acoesDoDono}</span> : null}
      </div>
    </article>
  );
}

export function Comunidade({
  comunidadeId,
  /** O que o dono pode fazer com CADA post. `undefined` some da tela. */
  acoesDoPost,
  /** O botão de publicar, montado por quem sabe se esta comunidade é sua. */
  acaoDePublicar,
}: {
  comunidadeId: string;
  acoesDoPost?: (p: PublicacaoDefinida) => ReactNode;
  acaoDePublicar?: ReactNode;
}) {
  const { motor, hidratado } = usePontos();

  /**
   * TROCAR DE COMUNIDADE É NAVEGAR, E QUEM NAVEGA É A GALERIA (29/08/2026).
   *
   * Aqui havia um seletor de dois menus suspensos que trocava o feed por estado local
   * enquanto a capa acima continuava na comunidade anterior. Ele saiu inteiro: a porta da
   * aba é a galeria em `/studio/comunidade/`, e uma segunda maneira de trocar, dentro da
   * tela para onde a primeira leva, é ruído.
   *
   * Sobrou uma verdade só: esta tela mostra a comunidade do endereço.
   */
  const atual = comunidadeId;

  const comunidade = comunidadePorId(atual);
  if (!comunidade) return <Vazio>Esta comunidade não existe.</Vazio>;

  const publicacoes = motor.atual.publicacoes.filter((p) => p.comunidadeId === atual);
  const oficial = comunidade.natureza === "oficial";
  const seguindo = hidratado && motor.atual.assinadas.includes(atual);

  /**
   * SEGUIR ALIMENTA O FEED PRÓPRIO, e é o que dá sentido a esta aba.
   *
   * Quem segue uma ou mais comunidades passa a abrir a aba num feed misturado, com o que
   * elas publicaram, em vez da galeria. É o mesmo contrato de qualquer rede: você escolhe
   * quem lê você de volta.
   *
   * DEIXAR DE SEGUIR É OUTRO EVENTO, e não o mesmo alternando. `comunidade.assinada` paga
   * 10 de percurso, com teto de 3 por dia; se ele alternasse, seguir e deixar de seguir a
   * mesma comunidade três vezes renderia 30 sem que nada acontecesse. Foi exatamente o
   * defeito que o guardar de publicação tinha, e que este projeto já pagou uma vez.
   */
  function alternarSeguir() {
    motor.emitir(seguindo ? "comunidade.deixada" : "comunidade.assinada", {
      tipo: "comunidade",
      id: atual,
    });
  }

  return (
    // A COLUNA TEM LARGURA DE LEITURA NA WEB (2026-08-28): esticar a foto de um post por
    // 1.100px nao mostra mais foto, mostra a mesma foto maior, e o texto embaixo vira uma
    // linha de 180 caracteres. O limite mora no CSS, sob `[data-view="web"]`.
    <div className="flex flex-col gap-4 comunidade-coluna">

      {/* A ficha e o botão só aparecem fora da casa: na comunidade do Itaú a pessoa já
          está dentro, e não há o que decidir. */}
      {!oficial && (
        <>
          <div className="faixa-visita">
            <span>
              {seguindo ? (
                <>Você segue <strong>{comunidade.nome}</strong>.</>
              ) : (
                <>Siga para ver as publicações no seu feed.</>
              )}
            </span>
            <button
              type="button"
              className={seguindo ? "botao-discreto" : "botao-acao"}
              data-ativo={seguindo ? "sim" : undefined}
              onClick={alternarSeguir}
              disabled={!hidratado}
              data-seguir-comunidade
            >
              {seguindo ? "Seguindo" : "Seguir"}
            </button>
          </div>

          <div className="cartao">
            {comunidade.curada && (
              <span className="selo-curadoria">
                Curadoria do Itaú Cultural — {comunidade.nome} não publica aqui
              </span>
            )}
            <span className="tipo-legenda text-tinta-2">{comunidade.descricao}</span>
            <span className="tipo-legenda text-tinta-3">
              {comunidade.assinantes.toLocaleString("pt-BR")} pessoas
              {comunidade.uf ? ` · ${comunidade.uf}` : ""}
            </span>
          </div>
        </>
      )}

      {/* PUBLICAR MORA AQUI, em cima do feed: é onde a publicação vai aparecer. */}
      {acaoDePublicar ? (
        <div className="publicacao-acao-de-publicar">{acaoDePublicar}</div>
      ) : null}

      {publicacoes.length === 0 ? (
        <Painel titulo="Ainda sem publicações">
          <Vazio>Esta comunidade ainda não publicou nada.</Vazio>
        </Painel>
      ) : (
        publicacoes.map((p) => (
          <Cartao key={p.id} publicacao={p} acoesDoDono={acoesDoPost?.(p)} />
        ))
      )}
    </div>
  );
}
