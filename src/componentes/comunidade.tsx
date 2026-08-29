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
  COMUNIDADE_OFICIAL,
  COMUNIDADES,
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

function Cartao({
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

/**
 * O seletor: dois menus e um botão.
 *
 * O PRIMEIRO menu lista as que a pessoa segue, com a do Itaú Cultural sempre no
 * topo — é a casa e não se deixa de seguir. O SEGUNDO lista as que ela ainda não
 * segue, e escolher uma ali é uma VISITA: o feed troca na hora e a faixa abaixo
 * diz que ela está de passagem, com o botão de seguir à mão.
 *
 * Dois menus e não um só porque as duas listas respondem a perguntas diferentes:
 * «para onde eu volto» e «o que existe além». Misturadas, a segunda enterra a
 * primeira assim que a lista de fora crescer.
 */
function Seletor({ atual, aoTrocar }: { atual: string; aoTrocar: (id: string) => void }) {
  const { motor, hidratado } = usePontos();

  const seguidas = hidratado ? motor.atual.assinadas : [COMUNIDADE_OFICIAL];
  const sigoAAtual = seguidas.includes(atual);

  const paraOpcao = (c: (typeof COMUNIDADES)[number]) => ({
    id: c.id,
    rotulo: c.nome,
    nota: c.uf,
  });

  const minhas = COMUNIDADES.filter((c) => seguidas.includes(c.id)).map(paraOpcao);
  const outras = COMUNIDADES.filter(
    (c) => c.natureza !== "oficial" && !seguidas.includes(c.id),
  ).map(paraOpcao);

  return (
    <div className="seletor-comunidade">
      <MenuDeEscolha
        rotulo="Minhas comunidades"
        opcoes={minhas}
        valor={sigoAAtual ? atual : null}
        aoEscolher={aoTrocar}
        textoVazio="nenhuma ainda"
        placeholder="visitando outra"
      />
      <MenuDeEscolha
        rotulo="Visitar outras"
        opcoes={outras}
        valor={sigoAAtual ? null : atual}
        aoEscolher={aoTrocar}
        textoVazio="você já segue todas"
        placeholder={`${outras.length} para conhecer`}
      />
    </div>
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
  const router = useRouter();

  /**
   * TROCAR DE COMUNIDADE É NAVEGAR, E NÃO TROCAR ESTADO (29/08/2026).
   *
   * Antes o seletor guardava a escolha num `useState` local: o feed trocava, e a capa
   * renderizada acima pela página continuava mostrando a comunidade anterior, porque ela
   * recebe o id do servidor e ninguém a avisava. Eram duas maneiras de trocar de comunidade
   * que não se conheciam, com a rota `[id]` existindo em paralelo.
   *
   * Agora há uma só. A escolha vira endereço, a página inteira responde por ela, e o
   * endereço pode ser copiado e colado.
   */
  const atual = comunidadeId;
  const trocar = (id: string) => router.push(`/studio/comunidade/${id}/`);

  const comunidade = comunidadePorId(atual);
  if (!comunidade) return <Vazio>Esta comunidade não existe.</Vazio>;

  const publicacoes = motor.atual.publicacoes.filter((p) => p.comunidadeId === atual);
  const assinada = hidratado && motor.atual.assinadas.includes(atual);
  const oficial = comunidade.natureza === "oficial";

  function seguir() {
    motor.emitir("comunidade.assinada", { tipo: "comunidade", id: atual });
  }

  return (
    // A COLUNA TEM LARGURA DE LEITURA NA WEB (2026-08-28): esticar a foto de um post por
    // 1.100px nao mostra mais foto, mostra a mesma foto maior, e o texto embaixo vira uma
    // linha de 180 caracteres. O limite mora no CSS, sob `[data-view="web"]`.
    <div className="flex flex-col gap-4 comunidade-coluna">
      <Seletor atual={atual} aoTrocar={trocar} />

      {/* A ficha e a faixa só aparecem fora da casa: na comunidade do Itaú a
          pessoa já está dentro, e não há o que decidir. */}
      {!oficial && (
        <>
          <div className="faixa-visita">
            <span>
              {assinada ? (
                <>Você segue <strong>{comunidade.nome}</strong>.</>
              ) : (
                <>Você está visitando <strong>{comunidade.nome}</strong>.</>
              )}
            </span>
            <button
              type="button"
              className={assinada ? "botao-discreto" : "botao-acao"}
              data-ativo={assinada ? "sim" : undefined}
              onClick={seguir}
              disabled={assinada || !hidratado}
            >
              {assinada ? "Seguindo" : "Seguir"}
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
