"use client";

import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { CampoComProposta } from "@/componentes/base/campo-com-proposta";
import { Campo } from "@/componentes/base/ficha-em-atos";
import { OpcaoDeSegmento, Segmento } from "@/componentes/base/segmento";
import { SeletorDeCatalogo } from "@/componentes/base/seletor-de-catalogo";
import { FichaSimples } from "@/componentes/produtor-ficha";
import {
  FONTES_DE_VIDEO,
  ROTULO_DO_TIPO_DE_PLAY,
  TIPOS_DE_PLAY,
} from "@/dados/tipos-produtor";
import type { CatalogoDoPlay } from "@/dados/mock/seed-produtor";
import type {
  ContextoDoProdutor,
  PonteDoRegistro,
  Registro,
  RegistroDePlay,
} from "@/dados/tipos-produtor";

/**
 * produtor-play.tsx, a ficha de vídeo, série e playlist.
 *
 * O QUE ELA TRANSFORMA EM CAMPO. Hoje a prateleira em que um item cai é DERIVADA do título:
 * `prateleiras.ts` conta prefixos repetidos, e uma série nova só existe depois que houver
 * dois itens com o mesmo começo de nome. É derivação legítima e está declarada lá, mas
 * significa que o produtor não decide onde o próprio item aparece. Aqui ele decide.
 *
 * A FONTE É SÓ O ID, NUNCA A URL INTEIRA. O `<iframe>` do YouTube continua nascendo depois
 * do clique (a promessa medida de zero requisição em runtime), e guardar a URL inteira
 * convidaria alguém a incorporá-la direto no atributo `src`.
 *
 * AS PONTES SÃO O QUE O ACERVO NÃO TEM. `fala_sobre` mede 39 arestas e `aprofunda` mede 887
 *, mas saindo de MATÉRIA, não de mídia: das 529 mídias, quase nenhuma aponta para um
 * evento. O bloco «não pode ir? veja isto» do Play vive dessas arestas.
 */
export function FichaDoPlay({
  semente,
  contexto,
  catalogo,
}: {
  semente: Registro[];
  contexto: ContextoDoProdutor;
  catalogo: CatalogoDoPlay;
}) {
  return (
    <FichaSimples<"play">
      pauta="play"
      semente={semente}
      contexto={contexto}
      catalogo={catalogo}
      destinoAoPublicar="/play/"
      atosProprios={() => []}
      composicao={(r, alterar, pecas) => [
        {
          // O VÍDEO PRIMEIRO: quem sobe um vídeo começa pelo vídeo, como em qualquer
          // estúdio de publicação. Título e capa vêm DEPOIS que existe o que descrever.
          rotulo: "Vídeo",
          fechado: r.idDoVideo.trim() !== "" || r.linkExterno.trim() !== "",
          conteudo: (
            <>
              {pecas.seletorDeRegistro}
              <AtoFonte registro={r} aoAlterar={alterar} />
            </>
          ),
        },
        {
          // A CAPA SOBRE O PLAYER, e então o texto: a miniatura é o que o público vê
          // antes do play, e escolhê-la olhando a moldura é escolher o que ela decide.
          rotulo: "Detalhes",
          fechado: r.titulo.trim().length >= 3 && r.imagem !== null,
          conteudo: (
            <>
              <div className="prod-capa-player">{pecas.capa}</div>
              {pecas.titulo}
              {pecas.resumo}
              <AtoTipo registro={r} catalogo={catalogo} aoAlterar={alterar} />
              {pecas.linguagens}
              {pecas.temas}
            </>
          ),
        },
        {
          rotulo: "Conferências",
          fechado: r.direito.declarado && r.declaraAcessibilidade,
          conteudo: (
            <>
              <AtoDireitos registro={r} aoAlterar={alterar} />
              {pecas.acessibilidade}
              <AtoPontes registro={r} catalogo={catalogo} aoAlterar={alterar} />
            </>
          ),
        },
        {
          rotulo: "Publicar",
          fechado: r.situacao === "publicado",
          conteudo: pecas.publicacao,
        },
      ]}
      montarExtrasDoInicio={(daPauta, operacoes) => ({
        // A TRILHA de um vídeo é a série que ele declara; sem série, «Avulsos».
        // Playlists ficam fora do agrupamento: elas são a seção de baixo.
        trilhaDe: (r) => {
          const play = r as RegistroDePlay;
          if (play.tipo === "playlist") return null;
          return play.serieTitulo ?? "Avulsos";
        },
        playlists: daPauta
          .filter((r) => r.tipo === "playlist")
          .map((r) => ({
            id: r.id,
            titulo: r.titulo,
            itens: r.itens.length,
            situacao: r.situacao,
          })),
        aoNovaPlaylist: (nome) => {
          // NASCE RASCUNHO, SEM ABRIR A FICHA: criar uma playlist não é publicar nada.
          const id = operacoes.criar();
          operacoes.alterarId(id, { tipo: "playlist", titulo: nome });
        },
        aoAdicionarAPlaylist: (playlistId, videoId) => {
          const alvo = daPauta.find((r) => r.id === playlistId);
          if (!alvo || alvo.tipo !== "playlist") return;
          if (alvo.itens.includes(videoId)) return;
          operacoes.alterarId(playlistId, { itens: [...alvo.itens, videoId] });
        },
      })}
    />
  );
}

// ---------------------------------------------------------------------------

function AtoTipo({
  registro,
  catalogo,
  aoAlterar,
}: {
  registro: RegistroDePlay;
  catalogo: CatalogoDoPlay;
  aoAlterar: (m: Partial<RegistroDePlay>) => void;
}) {
  return (
    <>
      <Campo rotulo="O que é isto" obrigatorio>
        <Segmento rotulo="tipo do item" data-seletor-tipo-play>
          {TIPOS_DE_PLAY.map((t) => (
            <OpcaoDeSegmento
              key={t}
              selecionado={registro.tipo === t}
              data-tipo-play={t}
              onClick={() => aoAlterar({ tipo: t })}
            >
              {ROTULO_DO_TIPO_DE_PLAY[t]}
            </OpcaoDeSegmento>
          ))}
        </Segmento>
      </Campo>

      {registro.tipo === "episodio" ? (
        <>
          <Campo
            rotulo="Série"
            obrigatorio
            nota="Hoje a série é DERIVADA do prefixo repetido no título. Aqui ela é campo, e é isso que permite uma série nova nascer com um episódio só."
          >
            <SeletorDeCatalogo
              nome="Série"
              unico
              termos={catalogo.series.map((s) => ({
                id: s.id,
                rotulo: s.rotulo,
                usos: s.itens,
              }))}
              escolhidos={registro.serieId ? [registro.serieId] : []}
              aoMudar={(ids) => {
                const id = ids[0] ?? null;
                const achada = catalogo.series.find((s) => s.id === id);
                aoAlterar({ serieId: id, serieTitulo: achada?.rotulo ?? null });
              }}
              propostos={registro.serieId === null && registro.serieTitulo ? [registro.serieTitulo] : []}
              aoPropor={(t) => {
                // CRIAR SÉRIE NÃO É PROPOR TERMO. A série é do produtor, não do vocabulário
                // controlado: ela nasce aqui, sem passar pelo Editor.
                const nova = t[t.length - 1] ?? null;
                aoAlterar({ serieId: null, serieTitulo: nova });
              }}
            />
          </Campo>
          <Campo rotulo="Número do episódio">
            <input
              type="number"
              min={1}
              value={registro.numeroDoEpisodio ?? ""}
              onChange={(e) =>
                aoAlterar({
                  numeroDoEpisodio: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              className="prod-campo-entrada"
              data-numero-episodio
            />
          </Campo>
        </>
      ) : null}

      {registro.tipo === "playlist" ? (
        <Campo
          rotulo="Itens, em ordem"
          obrigatorio
          nota="Uma playlist vazia é uma prateleira sem nada dentro."
        >
          <CampoComProposta
            nome="Mídia"
            acervo={catalogo.midias}
            porta="moderacao"
            escolha={{ id: null, titulo: null, proposto: false }}
            aoEscolher={(e) => {
              if (!e.id) return;
              aoAlterar({ itens: [...registro.itens, e.id] });
            }}
          />
          {registro.itens.length > 0 ? (
            <ol className="prod-lista" data-itens-playlist>
              {registro.itens.map((id, i) => {
                const m = catalogo.midias.find((x) => x.id === id);
                return (
                  <li key={`${id}-${i}`}>
                    <div className="prod-vinculo">
                      <span className="prod-registro-corpo">
                        <strong className="prod-registro-titulo">
                          {i + 1}. {m?.titulo ?? id}
                        </strong>
                      </span>
                      <BotaoDoStudio
                        curto
                        aoClicar={() =>
                          aoAlterar({ itens: registro.itens.filter((_, n) => n !== i) })
                        }
                        data-acao="remover-item"
                      >
                        Remover
                      </BotaoDoStudio>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : null}
        </Campo>
      ) : null}
    </>
  );
}

function AtoFonte({
  registro,
  aoAlterar,
}: {
  registro: RegistroDePlay;
  aoAlterar: (m: Partial<RegistroDePlay>) => void;
}) {
  return (
    <>
      <Campo rotulo="Onde o vídeo está" obrigatorio>
        <Segmento rotulo="fonte do vídeo" data-seletor-fonte>
          {FONTES_DE_VIDEO.map((f) => (
            <OpcaoDeSegmento
              key={f}
              selecionado={registro.fonte_video === f}
              data-fonte-video={f}
              onClick={() => aoAlterar({ fonte_video: f })}
            >
              {f === "externo" ? "link externo" : f}
            </OpcaoDeSegmento>
          ))}
        </Segmento>
      </Campo>

      {registro.fonte_video === "externo" ? (
        <Campo rotulo="Link" obrigatorio>
          <input
            type="url"
            value={registro.linkExterno}
            onChange={(e) => aoAlterar({ linkExterno: e.target.value })}
            className="prod-campo-entrada"
            data-link-externo
            aria-invalid={registro.linkExterno.trim() === ""}
          />
        </Campo>
      ) : (
        <Campo
          rotulo={registro.fonte_video === "youtube" ? "Id do YouTube" : "Id do Vimeo"}
          obrigatorio
          nota="SÓ O ID, nunca a URL inteira. O iframe continua nascendo depois do clique, é essa disciplina que sustenta a promessa de zero requisição externa em runtime."
        >
          <input
            type="text"
            value={registro.idDoVideo}
            onChange={(e) => {
              // Colar a URL inteira é o gesto natural. Em vez de recusar, extrai o id,
              // recusar ensinaria a pessoa a editar a URL à mão antes de colar.
              const cru = e.target.value.trim();
              const achado = /(?:v=|youtu\.be\/|embed\/|vimeo\.com\/)([A-Za-z0-9_-]{6,})/.exec(cru);
              aoAlterar({ idDoVideo: achado?.[1] ?? cru });
            }}
            placeholder="odfGFrMCsOM"
            className="prod-campo-entrada"
            data-id-video
            aria-invalid={registro.idDoVideo.trim() === ""}
          />
        </Campo>
      )}

      <Campo
        rotulo="Duração (minutos)"
        nota="O acervo não declara duração em campo nenhum, é por isso que «player com retomada» está registrado como não sustentado, e não como faltando."
      >
        <input
          type="number"
          min={0}
          value={registro.duracaoMinutos ?? ""}
          onChange={(e) =>
            aoAlterar({
              duracaoMinutos: e.target.value === "" ? null : Number(e.target.value),
            })
          }
          className="prod-campo-entrada"
          data-duracao
        />
      </Campo>

      <Campo rotulo="Data" obrigatorio>
        <input
          type="date"
          value={registro.data}
          onChange={(e) => aoAlterar({ data: e.target.value })}
          className="prod-campo-entrada"
          data-data
        />
      </Campo>
    </>
  );
}

function AtoDireitos({
  registro,
  aoAlterar,
}: {
  registro: RegistroDePlay;
  aoAlterar: (m: Partial<RegistroDePlay>) => void;
}) {
  const d = registro.direito;
  return (
    <>
      <p className="prod-campo-nota">
        Um item sem direito declarado NÃO BAIXA. Dois booleanos em <code>false</code>
        significam «não permite» e «ninguém declarou» ao mesmo tempo, e distribuir porque
        ninguém disse que não seria a leitura mais cara que este produto poderia fazer de um
        silêncio, a mesma razão de existir do ato de declarar acessibilidade.
      </p>

      <Campo rotulo="Titular do direito" obrigatorio>
        <input
          type="text"
          value={d.titular}
          onChange={(e) =>
            aoAlterar({ direito: { ...d, titular: e.target.value, declarado: true } })
          }
          className="prod-campo-entrada"
          data-titular
          aria-invalid={d.declarado && d.titular.trim() === ""}
        />
      </Campo>

      <label className="prod-dimensao">
        <input
          type="checkbox"
          checked={d.permiteOffline}
          onChange={(e) =>
            aoAlterar({ direito: { ...d, permiteOffline: e.target.checked, declarado: true } })
          }
          data-permite-offline
        />
        <span className="prod-dimensao-rotulo">pode ser baixado para ver sem internet</span>
      </label>

      <label className="prod-dimensao">
        <input
          type="checkbox"
          checked={d.permiteIncorporar}
          onChange={(e) =>
            aoAlterar({
              direito: { ...d, permiteIncorporar: e.target.checked, declarado: true },
            })
          }
          data-permite-incorporar
        />
        <span className="prod-dimensao-rotulo">pode ser incorporado em outro site</span>
      </label>

      {!d.declarado ? (
        <button
          type="button"
          className="prod-botao-ato"
          onClick={() => aoAlterar({ direito: { ...d, declarado: true } })}
          data-acao="declarar-direito"
        >
          Declaro que este item não permite download nem incorporação.
        </button>
      ) : null}
    </>
  );
}

function AtoPontes({
  registro,
  catalogo,
  aoAlterar,
}: {
  registro: RegistroDePlay;
  catalogo: CatalogoDoPlay;
  aoAlterar: (m: Partial<RegistroDePlay>) => void;
}) {
  function acrescentar(relacao: string, alvoId: string, alvoTitulo: string) {
    const ponte: PonteDoRegistro = { relacao, alvoId, alvoTitulo, motivo: "" };
    aoAlterar({ pontes: [...registro.pontes, ponte] });
  }

  return (
    <>
      <p className="prod-campo-nota">
        Das <strong>{catalogo.totalDeMidias}</strong> mídias do acervo,{" "}
        <strong>{catalogo.midiasComPonte}</strong> apontam para um evento ou uma matéria. É
        dessa aresta que vive o bloco «não pode ir? veja isto».
      </p>

      <Campo rotulo="Fala sobre um evento" nota="A relação `fala_sobre`.">
        <CampoComProposta
          nome="Evento"
          acervo={catalogo.eventos}
          porta="moderacao"
          escolha={{ id: null, titulo: null, proposto: false }}
          aoEscolher={(e) => e.id && e.titulo && acrescentar("fala_sobre", e.id, e.titulo)}
        />
      </Campo>

      <Campo rotulo="Aprofunda uma matéria" nota="A relação `aprofunda`.">
        <CampoComProposta
          nome="Matéria"
          acervo={catalogo.materias}
          porta="moderacao"
          escolha={{ id: null, titulo: null, proposto: false }}
          aoEscolher={(e) => e.id && e.titulo && acrescentar("aprofunda", e.id, e.titulo)}
        />
      </Campo>

      {registro.pontes.length > 0 ? (
        <ul className="prod-lista" data-pontes>
          {registro.pontes.map((p, i) => (
            <li key={`${p.alvoId}-${i}`}>
              <div className="prod-temporada">
                <strong className="prod-registro-titulo">
                  {p.relacao === "fala_sobre" ? "fala sobre" : "aprofunda"} · {p.alvoTitulo}
                </strong>
                {/* O MOTIVO É O SELO QUE O PÚBLICO LÊ. Selo em branco não publica, é a
                    diferença entre mediação legível e recomendador opaco. */}
                <Campo rotulo="Por quê" obrigatorio nota="Este texto é o selo que o público lê no cartão.">
                  <textarea
                    value={p.motivo}
                    onChange={(e) =>
                      aoAlterar({
                        pontes: registro.pontes.map((x, n) =>
                          n === i ? { ...x, motivo: e.target.value } : x,
                        ),
                      })
                    }
                    rows={2}
                    className="prod-campo-entrada"
                    data-motivo-ponte
                    aria-invalid={p.motivo.trim() === ""}
                  />
                </Campo>
                <BotaoDoStudio
                  curto
                  aoClicar={() =>
                    aoAlterar({ pontes: registro.pontes.filter((_, n) => n !== i) })
                  }
                  data-acao="remover-ponte"
                >
                  Remover
                </BotaoDoStudio>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
