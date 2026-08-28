"use client";

import { useState } from "react";
import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { CampoDeImagem } from "@/componentes/base/campo-de-imagem";
import type { ImagemDoAcervo } from "@/componentes/base/campo-de-imagem";
import { Campo } from "@/componentes/base/ficha-em-atos";
import { Folha } from "@/componentes/base/folha";
import { Comunidade } from "@/componentes/comunidade";
import {
  useComunidadeGerida,
  sementeDoPerfil,
} from "@/componentes/comunidade-estado";
import { usePontos } from "@/contexto/pontos";
import { imagemVazia, imagemCompleta } from "@/dados/tipos-produtor";
import type { ImagemDeclarada } from "@/dados/tipos-produtor";
import type { PublicacaoDefinida } from "@/lib/pontos/tipos";

/**
 * comunidade-no-studio.tsx — o feed com o que o dono da comunidade pode fazer nele.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A GESTÃO MORA ONDE A COISA MORA (pedido de 2026-08-28). Antes, apagar um post era uma
 * viagem a uma tela de gestão com abas; agora o gesto está no próprio post, e publicar é
 * um botão em cima do feed, que é onde a publicação vai aparecer.
 *
 * ESTE COMPONENTE É NOSSO, E O FEED É PORTADO. Ele monta `<Comunidade>` — cópia literal do
 * outro ramo — e lhe entrega duas coisas por prop: o botão de publicar e as ações de cada
 * post. O feed não sabe o que é gestão; ele só desenha o que recebe. Foi assim que a
 * gestão entrou sem reescrever a tela.
 *
 * NÃO HÁ ESCOLHA DE «TIPO» ANTES DE ESCREVER. Existiu um segmentado Imagem|Vídeo que
 * decidia qual campo aparecia; ele foi retirado em 28/08/2026 porque pedia uma decisão
 * antes da matéria e escondia metade do formulário. Toda publicação tem imagem, e o vídeo
 * é um campo a mais: quem cola um link do YouTube ganha o palco, quem não cola não perde
 * nada.
 *
 * SÓ NA COMUNIDADE DA CASA. Nas outras 21 as props não chegam, e o feed volta a ser
 * exatamente o do outro ramo: elas pertencem a instituições e pessoas reais.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** O que se está escrevendo. Mora aqui porque a folha desmonta ao fechar. */
interface Composicao {
  id: string;
  titulo: string;
  corpo: string;
  etiqueta: string;
  imagem: ImagemDeclarada | null;
  video: string;
  enquete: string[];
}

function vazia(id: string): Composicao {
  return {
    id,
    titulo: "",
    corpo: "",
    etiqueta: "",
    imagem: imagemVazia(),
    video: "",
    enquete: [],
  };
}

function daPublicacao(p: PublicacaoDefinida): Composicao {
  return {
    id: p.id,
    titulo: p.titulo,
    corpo: p.corpo,
    etiqueta: p.etiqueta ?? "",
    imagem: {
      caminho: p.imagem,
      credito: p.imagemCredito,
      alt: p.imagemAlt,
      licenca: null,
    },
    video: p.video ?? "",
    enquete: (p.enquete?.opcoes ?? []).map((o) => o.rotulo),
  };
}

/**
 * O id do vídeo, extraído de qualquer forma de endereço do YouTube.
 *
 * Cola-se a URL da barra do navegador, e o campo guarda só o id: o iframe é montado a
 * partir dele, e é essa disciplina que sustenta a promessa de zero requisição externa
 * enquanto ninguém aperta o play.
 */
export function idDoVideo(entrada: string): string {
  const texto = entrada.trim();
  if (texto === "") return "";
  const porV = texto.match(/[?&]v=([\w-]{6,})/);
  if (porV) return porV[1];
  const curto = texto.match(/youtu\.be\/([\w-]{6,})/);
  if (curto) return curto[1];
  const embutido = texto.match(/embed\/([\w-]{6,})/);
  if (embutido) return embutido[1];
  return texto.replace(/[^\w-]/g, "");
}

/**
 * As parciais de uma enquete são REPARTIDAS EM PARTES IGUAIS, e a tela diz isso.
 *
 * Não há voto de ninguém neste protótipo: inventar 62% contra 38% seria fabricar
 * resultado. Divisão igual é a única distribuição que não afirma nada.
 */
function opcoesDaEnquete(rotulos: string[]): { rotulo: string; pct: number }[] {
  const limpos = rotulos.map((r) => r.trim()).filter((r) => r !== "");
  if (limpos.length === 0) return [];
  const fatia = Math.round(100 / limpos.length);
  return limpos.map((rotulo, i) => ({
    rotulo,
    // A última fecha a conta, para a soma dar 100 mesmo com arredondamento.
    pct: i === limpos.length - 1 ? 100 - fatia * (limpos.length - 1) : fatia,
  }));
}

export function ComunidadeNoStudio({
  comunidadeId,
  nome,
  descricao,
  hoje,
  imagens,
}: {
  comunidadeId: string;
  nome: string;
  descricao: string;
  hoje: string;
  imagens: ImagemDoAcervo[];
}) {
  const { motor, hidratado } = usePontos();
  const semente = sementeDoPerfil(comunidadeId, nome, descricao);
  const armazem = useComunidadeGerida(comunidadeId, semente, hoje);

  const [compondo, setCompondo] = useState<Composicao | null>(null);
  const [aApagar, setAApagar] = useState<string | null>(null);

  const restam = armazem.pronto ? armazem.rascunhos.length : 0;

  function abrirNova() {
    const id = armazem.criarRascunho();
    if (id === null) return;
    setCompondo(vazia(id));
  }

  function publicar() {
    if (compondo === null) return;
    const capa = compondo.imagem;
    if (capa === null || !imagemCompleta(capa)) return;
    const jaNoAr = motor.atual.publicacoes.some((p) => p.id === compondo.id);
    motor.emitir(
      jaNoAr ? "comunidade.publicacao.editada" : "comunidade.publicacao.criada",
      { tipo: "publicacao", id: compondo.id },
      {
        comunidadeId,
        titulo: compondo.titulo.trim(),
        corpo: compondo.corpo.trim(),
        etiqueta: compondo.etiqueta.trim(),
        imagem: capa.caminho,
        imagemAlt: capa.alt,
        imagemCredito: capa.credito,
        video: idDoVideo(compondo.video),
        enquete: opcoesDaEnquete(compondo.enquete),
      },
    );
    armazem.marcarPublicada(compondo.id);
    setCompondo(null);
  }

  function apagar(id: string) {
    motor.emitir("comunidade.publicacao.retirada", { tipo: "publicacao", id });
    armazem.esquecerRascunho(id);
    setAApagar(null);
  }

  const podeEnviar =
    compondo !== null &&
    compondo.titulo.trim() !== "" &&
    imagemCompleta(compondo.imagem);

  return (
    <>
      <Comunidade
        comunidadeId={comunidadeId}
        acaoDePublicar={
          <BotaoDoStudio
            aoClicar={abrirNova}
            desabilitado={!armazem.pronto || restam >= 20}
            porQueDesabilitado={
              armazem.pronto
                ? "Acabaram os endereços reservados para publicação."
                : "Lendo o que está gravado neste navegador…"
            }
            data-publicar-aqui
          >
            + Publicar na comunidade
          </BotaoDoStudio>
        }
        acoesDoPost={(p) => {
          // TODA PUBLICAÇÃO DESTA COMUNIDADE, e não só as criadas nesta sessão. A regra
          // anterior olhava o prefixo do id e escondia o botão nas sete publicações
          // semeadas, que são justamente as que aparecem primeiro no feed: quem mantém a
          // comunidade da casa responde por tudo que está nela.
          if (!hidratado || p.comunidadeId !== comunidadeId) return undefined;
          if (aApagar === p.id) {
            return (
              <>
                <button
                  type="button"
                  className="pastilha"
                  onClick={() => apagar(p.id)}
                  data-apagar-post
                >
                  Apagar mesmo
                </button>
                <button
                  type="button"
                  className="pastilha"
                  onClick={() => setAApagar(null)}
                >
                  Cancelar
                </button>
              </>
            );
          }
          return (
            <>
              <button
                type="button"
                className="pastilha"
                onClick={() => setCompondo(daPublicacao(p))}
                data-editar-post
              >
                Editar
              </button>
              <button
                type="button"
                className="pastilha"
                onClick={() => setAApagar(p.id)}
                data-pedir-apagar-post
              >
                Apagar
              </button>
            </>
          );
        }}
      />

      <Folha
        aberta={compondo !== null}
        titulo="Publicar na comunidade"
        aoFechar={() => setCompondo(null)}
        rodape={
          <BotaoDoStudio
            primaria
            desabilitado={!podeEnviar}
            porQueDesabilitado="Falta o título ou a imagem com crédito e texto alternativo."
            aoClicar={publicar}
            data-enviar-publicacao
          >
            Publicar
          </BotaoDoStudio>
        }
      >
        {compondo !== null ? (
          <>
            <Campo rotulo="Título" obrigatorio>
              <input
                type="text"
                value={compondo.titulo}
                onChange={(e) => setCompondo({ ...compondo, titulo: e.target.value })}
                className="prod-campo-entrada"
                data-titulo-publicacao
                aria-invalid={compondo.titulo.trim() === ""}
              />
            </Campo>

            <Campo rotulo="Descrição">
              <textarea
                value={compondo.corpo}
                onChange={(e) => setCompondo({ ...compondo, corpo: e.target.value })}
                rows={4}
                className="prod-campo-entrada"
                data-corpo-publicacao
              />
            </Campo>

            <CampoDeImagem
              rotulo="Imagem"
              obrigatoria
              imagem={compondo.imagem ?? imagemVazia()}
              aoMudar={(i) => setCompondo({ ...compondo, imagem: i })}
              acervo={imagens}
            />

            <Campo rotulo="Vídeo" nota="Link do YouTube, se houver.">
              <input
                type="text"
                value={compondo.video}
                onChange={(e) => setCompondo({ ...compondo, video: e.target.value })}
                className="prod-campo-entrada"
                data-video-publicacao
              />
            </Campo>

            <Campo rotulo="Etiqueta" nota="Uma palavra, no canto do cartão.">
              <input
                type="text"
                value={compondo.etiqueta}
                onChange={(e) => setCompondo({ ...compondo, etiqueta: e.target.value })}
                className="prod-campo-entrada"
                data-etiqueta-publicacao
              />
            </Campo>

            <Campo
              rotulo="Enquete"
              nota="Sem voto aqui: as parciais saem em partes iguais."
            >
              <div className="prod-enquete-campos">
                {compondo.enquete.map((opcao, i) => (
                  <div className="prod-registro-acoes" key={i}>
                    <input
                      type="text"
                      value={opcao}
                      placeholder={`Opção ${i + 1}`}
                      onChange={(e) =>
                        setCompondo({
                          ...compondo,
                          enquete: compondo.enquete.map((x, n) =>
                            n === i ? e.target.value : x,
                          ),
                        })
                      }
                      className="prod-campo-entrada"
                      data-opcao-da-enquete={String(i)}
                    />
                    <BotaoDoStudio
                      curto
                      aoClicar={() =>
                        setCompondo({
                          ...compondo,
                          enquete: compondo.enquete.filter((_, n) => n !== i),
                        })
                      }
                    >
                      tirar
                    </BotaoDoStudio>
                  </div>
                ))}
                {compondo.enquete.length < 4 ? (
                  <BotaoDoStudio
                    curto
                    aoClicar={() =>
                      setCompondo({ ...compondo, enquete: [...compondo.enquete, ""] })
                    }
                    data-nova-opcao-da-enquete
                  >
                    + opção
                  </BotaoDoStudio>
                ) : null}
              </div>
            </Campo>
          </>
        ) : null}
      </Folha>
    </>
  );
}
