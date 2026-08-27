"use client";

import { useState } from "react";
import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { CampoComProposta } from "@/componentes/base/campo-com-proposta";
import { Campo } from "@/componentes/base/ficha-em-atos";
import { OpcaoDeSegmento, Segmento } from "@/componentes/base/segmento";
import { SeletorDeCatalogo } from "@/componentes/base/seletor-de-catalogo";
import { FichaSimples } from "@/componentes/produtor-ficha";
import { ESPECIES_DE_SPOTIFY } from "@/dados/tipos-produtor";
import type { CatalogoDoCast } from "@/dados/mock/seed-produtor";
import type {
  ContextoDoProdutor,
  Registro,
  RegistroDeCast,
} from "@/dados/tipos-produtor";

/**
 * produtor-cast.tsx, a ficha do episódio de podcast.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * OS QUATRO CAMPOS QUE ESTA FICHA EXISTE PARA GANHAR, e o número de cada um:
 *
 *   · PROGRAMA, hoje derivado do prefixo do título. As doze fileiras do Cast saem de
 *     `prateleiras.ts` contando quantos itens começam igual, e um programa novo só existe
 *     depois do segundo episódio.
 *   · FONTE DO ÁUDIO, os 336 podcasts não declaram URL de Spotify em campo nenhum.
 *   · PARTICIPANTES, não há aresta `atua_em` saindo de mídia. Quem fala num episódio não
 *     está em lugar nenhum do acervo.
 *   · TRANSCRIÇÃO, e esta é a mais importante. Os 336 declaram ZERO em todas as oito
 *     dimensões de acessibilidade, e não é silêncio da fonte: é uma negativa declarada. A
 *     transcrição é o que torna um podcast acessível a quem não ouve, e ela não existe.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function FichaDoCast({
  semente,
  contexto,
  catalogo,
}: {
  semente: Registro[];
  contexto: ContextoDoProdutor;
  catalogo: CatalogoDoCast;
}) {
  return (
    <FichaSimples<"cast">
      pauta="cast"
      semente={semente}
      contexto={contexto}
      catalogo={catalogo}
      destinoAoPublicar="/cast/"
      cabecalhoDaIdentidade={() => (
        <p className="prod-campo-nota">
          As doze fileiras do Cast somam <strong>{catalogo.totalDePodcasts}</strong>{" "}
          episódios, e nenhum deles declara transcrição, duração, participante ou fonte de
          áudio. Os quatro são campos desta ficha.
        </p>
      )}
      atosProprios={(r, alterar) => [
        {
          rotulo: "Programa",
          fechado: r.programaTitulo.trim() !== "",
          conteudo: <AtoPrograma registro={r} catalogo={catalogo} aoAlterar={alterar} />,
        },
        {
          rotulo: "Áudio",
          fechado: r.urlDoSpotify.trim() !== "" || r.linkExterno.trim() !== "",
          conteudo: <AtoAudio registro={r} aoAlterar={alterar} />,
        },
        {
          rotulo: "Participantes",
          fechado: r.participantes.length > 0,
          conteudo: <AtoParticipantes registro={r} catalogo={catalogo} aoAlterar={alterar} />,
        },
        {
          rotulo: "Transcrição",
          fechado: r.transcricao.trim() !== "",
          conteudo: <AtoTranscricao registro={r} catalogo={catalogo} aoAlterar={alterar} />,
        },
      ]}
    />
  );
}

// ---------------------------------------------------------------------------

function AtoPrograma({
  registro,
  catalogo,
  aoAlterar,
}: {
  registro: RegistroDeCast;
  catalogo: CatalogoDoCast;
  aoAlterar: (m: Partial<RegistroDeCast>) => void;
}) {
  return (
    <>
      <Campo
        rotulo="Programa"
        obrigatorio
        nota="Os que aparecem aqui são os que a derivação do título já reconhece, com o número de episódios de cada um. Criar um novo faz um programa nascer com um episódio só, o que a derivação não permite."
      >
        <SeletorDeCatalogo
          nome="Programa"
          unico
          termos={catalogo.programas.map((p) => ({
            id: p.id,
            rotulo: p.rotulo,
            usos: p.itens,
          }))}
          escolhidos={registro.programaId ? [registro.programaId] : []}
          aoMudar={(ids) => {
            const id = ids[0] ?? null;
            const achado = catalogo.programas.find((p) => p.id === id);
            aoAlterar({ programaId: id, programaTitulo: achado?.rotulo ?? "" });
          }}
          propostos={
            registro.programaId === null && registro.programaTitulo
              ? [registro.programaTitulo]
              : []
          }
          aoPropor={(t) =>
            aoAlterar({ programaId: null, programaTitulo: t[t.length - 1] ?? "" })
          }
        />
      </Campo>

      <div className="prod-par">
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
        <Campo rotulo="Temporada">
          <input
            type="number"
            min={1}
            value={registro.temporada ?? ""}
            onChange={(e) =>
              aoAlterar({ temporada: e.target.value === "" ? null : Number(e.target.value) })
            }
            className="prod-campo-entrada"
            data-temporada-programa
          />
        </Campo>
      </div>

      {/* A RÉGUA DE FILEIRAS. Um programa novo entra na régua por TAMANHO, destaque para o
          maior, trilho para os medianos, lista compacta para os de menos de oito. Dizer
          isso aqui evita a surpresa de o episódio publicado aparecer numa lista miúda. */}
    </>
  );
}

function AtoAudio({
  registro,
  aoAlterar,
}: {
  registro: RegistroDeCast;
  aoAlterar: (m: Partial<RegistroDeCast>) => void;
}) {
  return (
    <>
      <Campo
        rotulo="URL do Spotify"
        nota="A espécie muda o embed: `show` é o programa inteiro, `episode` é um episódio, `playlist` é uma seleção."
      >
        <input
          type="url"
          value={registro.urlDoSpotify}
          onChange={(e) => aoAlterar({ urlDoSpotify: e.target.value })}
          placeholder="https://open.spotify.com/episode/…"
          className="prod-campo-entrada"
          data-url-spotify
        />
      </Campo>

      <Campo rotulo="Espécie">
        <Segmento rotulo="espécie do link do Spotify" data-seletor-especie>
          {ESPECIES_DE_SPOTIFY.map((e) => (
            <OpcaoDeSegmento
              key={e}
              selecionado={registro.especie === e}
              data-especie={e}
              onClick={() => aoAlterar({ especie: e })}
            >
              {e}
            </OpcaoDeSegmento>
          ))}
        </Segmento>
      </Campo>

      <Campo rotulo="Ou um link direto" nota="Quando o áudio não está no Spotify.">
        <input
          type="url"
          value={registro.linkExterno}
          onChange={(e) => aoAlterar({ linkExterno: e.target.value })}
          className="prod-campo-entrada"
          data-link-externo
        />
      </Campo>

      <div className="prod-par">
        <Campo rotulo="Duração (minutos)">
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
        <Campo rotulo="Data">
          <input
            type="date"
            value={registro.data}
            onChange={(e) => aoAlterar({ data: e.target.value })}
            className="prod-campo-entrada"
            data-data
          />
        </Campo>
      </div>
    </>
  );
}

function AtoParticipantes({
  registro,
  catalogo,
  aoAlterar,
}: {
  registro: RegistroDeCast;
  catalogo: CatalogoDoCast;
  aoAlterar: (m: Partial<RegistroDeCast>) => void;
}) {
  const [papel, setPapel] = useState("");

  return (
    <>

      <Campo rotulo="Papel" obrigatorio>
        <SeletorDeCatalogo
          nome="Papel"
          unico
          termos={[
            ...catalogo.papeis.map((p) => ({ id: p.papel, rotulo: p.papel, usos: p.arestas })),
            { id: "apresentação", rotulo: "apresentação" },
            { id: "convidado", rotulo: "convidado" },
          ]}
          escolhidos={papel ? [papel] : []}
          aoMudar={(ids) => setPapel(ids[0] ?? "")}
          propostos={[]}
          aoPropor={(t) => setPapel(t[t.length - 1] ?? "")}
        />
      </Campo>

      <Campo rotulo="Quem participa">
        <CampoComProposta
          nome="Pessoa"
          acervo={catalogo.agentes}
          porta="moderacao"
          escolha={{ id: null, titulo: null, proposto: false }}
          aoEscolher={(e) => {
            if (!e.titulo || papel.trim() === "") return;
            aoAlterar({
              participantes: [
                ...registro.participantes,
                {
                  agenteId: e.id ?? `proposto:${e.titulo}`,
                  agenteTitulo: e.titulo,
                  papel,
                  proposto: e.proposto,
                },
              ],
            });
            setPapel("");
          }}
        />
        {papel.trim() === "" ? (
          <p className="prod-campo-nota" data-papel-antes>
            Escolha o papel primeiro.
          </p>
        ) : null}
      </Campo>

      {registro.participantes.length > 0 ? (
        <ul className="prod-lista" data-participantes>
          {registro.participantes.map((p, i) => (
            <li key={`${p.agenteId}-${i}`}>
              <div className="prod-vinculo" data-proposto={p.proposto ? "sim" : "nao"}>
                <span className="prod-registro-corpo">
                  <strong className="prod-registro-titulo">{p.agenteTitulo}</strong>
                  <span className="prod-registro-meta">
                    {p.papel}
                    {p.proposto ? " · proposto à Enciclopédia (Moderador 117)" : ""}
                  </span>
                </span>
                <BotaoDoStudio
                  curto
                  aoClicar={() =>
                    aoAlterar({
                      participantes: registro.participantes.filter((_, n) => n !== i),
                    })
                  }
                  data-acao="remover-participante"
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

function AtoTranscricao({
  registro,
  catalogo,
  aoAlterar,
}: {
  registro: RegistroDeCast;
  catalogo: CatalogoDoCast;
  aoAlterar: (m: Partial<RegistroDeCast>) => void;
}) {
  const palavras = registro.transcricao.trim() === "" ? 0 : registro.transcricao.trim().split(/\s+/).length;

  return (
    <>
      {/* O NÚMERO COM DENOMINADOR. Zero de 336 é a medida, e é ela que explica por que esta
          tela existe, não uma frase sobre a importância da acessibilidade. */}

      <Campo
        rotulo="Transcrição"
        nota={palavras > 0 ? `${palavras} palavras` : "Cole o texto ou digite. Não impede publicar, e é a única coisa que faz este episódio existir para quem não ouve."}
      >
        <textarea
          value={registro.transcricao}
          onChange={(e) => aoAlterar({ transcricao: e.target.value })}
          rows={10}
          placeholder="[00:00] Apresentação, …"
          className="prod-campo-entrada"
          data-transcricao
        />
      </Campo>

    </>
  );
}
