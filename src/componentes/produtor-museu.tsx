"use client";

import Link from "next/link";
import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { CampoComProposta } from "@/componentes/base/campo-com-proposta";
import { CampoDeImagem } from "@/componentes/base/campo-de-imagem";
import { Campo } from "@/componentes/base/ficha-em-atos";
import { OpcaoDeSegmento, Segmento } from "@/componentes/base/segmento";
import { FichaSimples } from "@/componentes/produtor-ficha";
import { OBJETOS_DE_MUSEU, ROTULO_DO_OBJETO_DE_MUSEU, imagemVazia } from "@/dados/tipos-produtor";
import type { CatalogoDoMuseu } from "@/dados/mock/seed-produtor";
import type {
  ContextoDoProdutor,
  ImagemDeclarada,
  Registro,
  RegistroDeMuseu,
} from "@/dados/tipos-produtor";

/**
 * produtor-museu.tsx, os três objetos do museu, e a exposição que hoje é código.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * AS DUAS EXPOSIÇÕES PERMANENTES SÃO 381 LINHAS DE `.ts`.
 *
 * `exposicoes-permanentes.ts` guarda, à mão, duas exposições inteiras: 19 passos de
 * percurso, 12 fotos com crédito e alt, 5 vídeos e 3 textos assinados. Isso é conteúdo
 * editorial vestido de código, quem quiser corrigir uma legenda precisa de um editor de
 * texto, de um build e de permissão de escrita no repositório.
 *
 * ESTA FICHA COMPORTA O MESMO CONTEÚDO. `seed-produtor.ts` migra as duas linha a linha, e
 * `medidasDaMigracaoDeMuseu()` conta o que atravessou, 2 exposições, 19 percursos, 12
 * fotos, 5 vídeos, 3 textos. O portão confere os cinco números; se a migração perder um
 * passo, ele fica vermelho.
 *
 * O ARQUIVO NÃO FOI APAGADO, e é decisão. Ele continua sendo a fonte da página pública
 * `/museu/[slug]` até que alguém troque o consumo, e as duas formas convivem sem
 * contradição porque a semente prova que a ficha COMPORTA o conteúdo, sem ainda ser a
 * origem dele. Apagar o arquivo antes disso derrubaria duas páginas do produto.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * A EXPOSIÇÃO EM CARTAZ NÃO TEM FICHA PRÓPRIA: ela é um EVENTO com formato `exposicao` ou
 * `ocupacao` e programação por vigência. Dar-lhe uma ficha separada produziria dois
 * caminhos para o mesmo objeto, e a fila de duplicatas passaria a acusar o Studio.
 */
export function FichaDoMuseu({
  semente,
  contexto,
  catalogo,
}: {
  semente: Registro[];
  contexto: ContextoDoProdutor;
  catalogo: CatalogoDoMuseu;
}) {
  return (
    <FichaSimples<"museu">
      pauta="museu"
      semente={semente}
      contexto={contexto}
      catalogo={catalogo}
      destinoAoPublicar="/museu/"
      temLugarFisico={(r) => r.objeto !== "em-cartaz"}
      cabecalhoDaIdentidade={(r) => <SeletorDeObjeto registro={r} />}
      atosProprios={(r, alterar) => {
        // A ficha MUDA com o objeto. Espaço-museu chama a ficha do espaço; exposição em
        // cartaz chama a do evento; só a permanente tem atos próprios aqui.
        if (r.objeto === "espaco-museu") {
          return [
            {
              rotulo: "Espaço",
              fechado: r.espacoId !== null,
              conteudo: <EspacoMuseu registro={r} catalogo={catalogo} aoAlterar={alterar} />,
            },
          ];
        }
        if (r.objeto === "em-cartaz") {
          return [
            {
              rotulo: "Evento",
              fechado: r.eventoId !== null,
              conteudo: <EmCartaz registro={r} catalogo={catalogo} aoAlterar={alterar} />,
            },
          ];
        }
        return [
          {
            rotulo: "Cabeçalho",
            fechado: r.lead.trim() !== "",
            conteudo: <AtoCabecalho registro={r} aoAlterar={alterar} />,
          },
          {
            rotulo: "Espaço e visita",
            fechado: r.espacoId !== null,
            conteudo: <AtoVisita registro={r} catalogo={catalogo} aoAlterar={alterar} />,
          },
          {
            rotulo: "Galeria",
            fechado: r.galeria.length > 0,
            conteudo: <AtoGaleria registro={r} catalogo={catalogo} aoAlterar={alterar} />,
          },
          {
            rotulo: "Vídeos",
            fechado: r.videos.length > 0,
            conteudo: <AtoVideos registro={r} aoAlterar={alterar} />,
          },
          {
            rotulo: "Textos",
            fechado: r.textos.length > 0,
            conteudo: <AtoTextos registro={r} aoAlterar={alterar} />,
          },
          {
            rotulo: "Percurso",
            fechado: r.percurso.length > 0,
            conteudo: <AtoPercurso registro={r} catalogo={catalogo} aoAlterar={alterar} />,
          },
        ];
      }}
    />
  );
}

// ---------------------------------------------------------------------------

function SeletorDeObjeto({ registro }: { registro: RegistroDeMuseu }) {
  // O SELETOR É LEITURA depois de criado: trocar o objeto de um registro pela metade
  // deixaria campos de uma forma dentro da outra. Quem quer outro objeto cria outro.
  return (
    <div className="prod-carimbo" data-objeto-museu={registro.objeto}>
      Este registro é <strong>{ROTULO_DO_OBJETO_DE_MUSEU[registro.objeto]}</strong>. O objeto
      é escolhido na criação e não muda depois, trocá-lo pela metade deixaria campos de uma
      forma dentro da outra.
    </div>
  );
}

/** O menu de criação do museu, montado na tela antes da ficha. */
export function EscolherObjetoDoMuseu({
  aoEscolher,
}: {
  aoEscolher: (o: RegistroDeMuseu["objeto"]) => void;
}) {
  return (
    <div className="prod-vazio">
      <p className="prod-vazio-frase">
        O museu tem três objetos, e cada um é uma coisa diferente no modelo.
      </p>
      <Segmento rotulo="objeto do museu" data-escolher-objeto>
        {OBJETOS_DE_MUSEU.map((o) => (
          <OpcaoDeSegmento
            key={o}
            selecionado={false}
            data-objeto={o}
            onClick={() => aoEscolher(o)}
          >
            {ROTULO_DO_OBJETO_DE_MUSEU[o]}
          </OpcaoDeSegmento>
        ))}
      </Segmento>
    </div>
  );
}

function EspacoMuseu({
  registro,
  catalogo,
  aoAlterar,
}: {
  registro: RegistroDeMuseu;
  catalogo: CatalogoDoMuseu;
  aoAlterar: (m: Partial<RegistroDeMuseu>) => void;
}) {
  return (
    <>
      <Campo rotulo="Qual espaço" obrigatorio>
        <CampoComProposta
          nome="Espaço"
          acervo={catalogo.espacos.map((e) => ({
            id: e.id,
            titulo: e.titulo,
            classe: "espaço",
            resumo: [e.cidade, e.estado].filter(Boolean).join(", "),
          }))}
          porta="organizacao"
          escolha={{ id: registro.espacoId, titulo: registro.espacoTitulo, proposto: false }}
          aoEscolher={(e) => aoAlterar({ espacoId: e.id, espacoTitulo: e.titulo })}
        />
      </Campo>
      <Link href="/studio/espacos/" className="prod-botao" data-ir-para-espacos>
        Abrir a ficha de Espaços ▸
      </Link>
    </>
  );
}

function EmCartaz({
  registro,
  catalogo,
  aoAlterar,
}: {
  registro: RegistroDeMuseu;
  catalogo: CatalogoDoMuseu;
  aoAlterar: (m: Partial<RegistroDeMuseu>) => void;
}) {
  return (
    <>
      <Campo rotulo="Qual evento" obrigatorio>
        <CampoComProposta
          nome="Evento"
          acervo={catalogo.eventos}
          porta="moderacao"
          escolha={{
            id: registro.eventoId,
            titulo: registro.eventoId ? registro.titulo : null,
            proposto: false,
          }}
          aoEscolher={(e) => aoAlterar({ eventoId: e.id })}
        />
      </Campo>
      <Link href="/studio/publicar/" className="prod-botao" data-ir-para-agenda>
        Abrir a ficha da Agenda ▸
      </Link>
    </>
  );
}

function AtoCabecalho({
  registro,
  aoAlterar,
}: {
  registro: RegistroDeMuseu;
  aoAlterar: (m: Partial<RegistroDeMuseu>) => void;
}) {
  return (
    <>
      <Campo rotulo="Kicker" nota="A linha curta acima do título, «Espaço Olavo Setúbal».">
        <input
          type="text"
          value={registro.kicker}
          onChange={(e) => aoAlterar({ kicker: e.target.value })}
          className="prod-campo-entrada"
          data-kicker
        />
      </Campo>
      <Campo rotulo="Subtítulo">
        <input
          type="text"
          value={registro.subtitulo}
          onChange={(e) => aoAlterar({ subtitulo: e.target.value })}
          className="prod-campo-entrada"
          data-subtitulo
        />
      </Campo>
      <Campo rotulo="Lead" obrigatorio nota="O parágrafo de abertura da página. É ele que a exposição promete.">
        <textarea
          value={registro.lead}
          onChange={(e) => aoAlterar({ lead: e.target.value })}
          rows={4}
          className="prod-campo-entrada"
          data-lead
          aria-invalid={registro.lead.trim() === ""}
        />
      </Campo>
    </>
  );
}

function AtoVisita({
  registro,
  catalogo,
  aoAlterar,
}: {
  registro: RegistroDeMuseu;
  catalogo: CatalogoDoMuseu;
  aoAlterar: (m: Partial<RegistroDeMuseu>) => void;
}) {
  return (
    <>
      <Campo rotulo="Espaço-museu que hospeda" obrigatorio>
        <CampoComProposta
          nome="Espaço"
          acervo={catalogo.espacos.map((e) => ({
            id: e.id,
            titulo: e.titulo,
            classe: "espaço",
            resumo: [e.cidade, e.estado].filter(Boolean).join(", "),
          }))}
          porta="organizacao"
          escolha={{ id: registro.espacoId, titulo: registro.espacoTitulo, proposto: false }}
          aoEscolher={(e) => aoAlterar({ espacoId: e.id, espacoTitulo: e.titulo })}
        />
      </Campo>
      <Campo rotulo="Andares" nota="Onde dentro do prédio, «3º e 4º andares».">
        <input
          type="text"
          value={registro.andares}
          onChange={(e) => aoAlterar({ andares: e.target.value })}
          className="prod-campo-entrada"
          data-andares
        />
      </Campo>
      <Campo rotulo="Entrada">
        <input
          type="text"
          value={registro.entrada}
          onChange={(e) => aoAlterar({ entrada: e.target.value })}
          placeholder="entrada gratuita"
          className="prod-campo-entrada"
          data-entrada
        />
      </Campo>
      <Campo rotulo="Horário">
        <textarea
          value={registro.horario}
          onChange={(e) => aoAlterar({ horario: e.target.value })}
          rows={2}
          className="prod-campo-entrada"
          data-horario
        />
      </Campo>
    </>
  );
}

function AtoGaleria({
  registro,
  catalogo,
  aoAlterar,
}: {
  registro: RegistroDeMuseu;
  catalogo: CatalogoDoMuseu;
  aoAlterar: (m: Partial<RegistroDeMuseu>) => void;
}) {
  function alterar(i: number, f: ImagemDeclarada | null) {
    if (f === null) {
      aoAlterar({ galeria: registro.galeria.filter((_, n) => n !== i) });
      return;
    }
    aoAlterar({ galeria: registro.galeria.map((x, n) => (n === i ? f : x)) });
  }

  return (
    <>
      {registro.galeria.map((f, i) => (
        <CampoDeImagem
          key={`g${i}`}
          imagem={f}
          aoMudar={(x) => alterar(i, x)}
          acervo={catalogo.imagens}
          rotulo={`Foto ${i + 1}`}
        />
      ))}
      <BotaoDoStudio
        aoClicar={() => aoAlterar({ galeria: [...registro.galeria, imagemVazia()] })}
        data-acao="mais-foto"
      >
        + foto
      </BotaoDoStudio>
    </>
  );
}

function AtoVideos({
  registro,
  aoAlterar,
}: {
  registro: RegistroDeMuseu;
  aoAlterar: (m: Partial<RegistroDeMuseu>) => void;
}) {
  return (
    <>
      <p className="prod-campo-nota">
        Só o id do YouTube, nunca a URL inteira: o <code>iframe</code> continua nascendo
        depois do clique.
      </p>
      {registro.videos.map((v, i) => (
        <div className="prod-par" key={`v${i}`}>
          <Campo rotulo={`Id do vídeo ${i + 1}`} obrigatorio>
            <input
              type="text"
              value={v.idDoVideo}
              onChange={(e) =>
                aoAlterar({
                  videos: registro.videos.map((x, n) =>
                    n === i ? { ...x, idDoVideo: e.target.value } : x,
                  ),
                })
              }
              className="prod-campo-entrada"
              data-id-video
            />
          </Campo>
          <Campo rotulo="Título">
            <input
              type="text"
              value={v.titulo}
              onChange={(e) =>
                aoAlterar({
                  videos: registro.videos.map((x, n) =>
                    n === i ? { ...x, titulo: e.target.value } : x,
                  ),
                })
              }
              className="prod-campo-entrada"
              data-titulo-video
            />
          </Campo>
          <BotaoDoStudio
            curto
            aoClicar={() => aoAlterar({ videos: registro.videos.filter((_, n) => n !== i) })}
            data-acao="remover-video"
          >
            Remover
          </BotaoDoStudio>
        </div>
      ))}
      <BotaoDoStudio
        aoClicar={() =>
          aoAlterar({ videos: [...registro.videos, { idDoVideo: "", titulo: "" }] })
        }
        data-acao="mais-video"
      >
        + vídeo
      </BotaoDoStudio>
    </>
  );
}

function AtoTextos({
  registro,
  aoAlterar,
}: {
  registro: RegistroDeMuseu;
  aoAlterar: (m: Partial<RegistroDeMuseu>) => void;
}) {
  return (
    <>
      {registro.textos.map((t, i) => (
        <div className="prod-temporada" key={`t${i}`}>
          <Campo rotulo="Título" obrigatorio>
            <input
              type="text"
              value={t.titulo}
              onChange={(e) =>
                aoAlterar({
                  textos: registro.textos.map((x, n) =>
                    n === i ? { ...x, titulo: e.target.value } : x,
                  ),
                })
              }
              className="prod-campo-entrada"
              data-titulo-texto
            />
          </Campo>
          <div className="prod-par">
            <Campo rotulo="Autor">
              <input
                type="text"
                value={t.autor}
                onChange={(e) =>
                  aoAlterar({
                    textos: registro.textos.map((x, n) =>
                      n === i ? { ...x, autor: e.target.value } : x,
                    ),
                  })
                }
                className="prod-campo-entrada"
                data-autor-texto
              />
            </Campo>
            <Campo rotulo="Cargo">
              <input
                type="text"
                value={t.cargo}
                onChange={(e) =>
                  aoAlterar({
                    textos: registro.textos.map((x, n) =>
                      n === i ? { ...x, cargo: e.target.value } : x,
                    ),
                  })
                }
                className="prod-campo-entrada"
                data-cargo-texto
              />
            </Campo>
          </div>
          <Campo rotulo="Parágrafos" obrigatorio nota="Uma linha em branco separa parágrafos.">
            <textarea
              value={t.paragrafos.join("\n\n")}
              onChange={(e) =>
                aoAlterar({
                  textos: registro.textos.map((x, n) =>
                    n === i
                      ? { ...x, paragrafos: e.target.value.split(/\n{2,}/).filter(Boolean) }
                      : x,
                  ),
                })
              }
              rows={6}
              className="prod-campo-entrada"
              data-paragrafos
            />
          </Campo>
          <BotaoDoStudio
            curto
            aoClicar={() => aoAlterar({ textos: registro.textos.filter((_, n) => n !== i) })}
            data-acao="remover-texto"
          >
            Remover
          </BotaoDoStudio>
        </div>
      ))}
      <BotaoDoStudio
        aoClicar={() =>
          aoAlterar({
            textos: [...registro.textos, { titulo: "", autor: "", cargo: "", paragrafos: [] }],
          })
        }
        data-acao="mais-texto"
      >
        + texto assinado
      </BotaoDoStudio>
    </>
  );
}

function AtoPercurso({
  registro,
  catalogo,
  aoAlterar,
}: {
  registro: RegistroDeMuseu;
  catalogo: CatalogoDoMuseu;
  aoAlterar: (m: Partial<RegistroDeMuseu>) => void;
}) {
  return (
    <>
      <p className="prod-campo-nota">
        {registro.percurso.length} passo(s). O percurso é a exposição contada em ordem, é o
        que faz a página funcionar para quem não pode ir.
      </p>
      {registro.percurso.map((p, i) => (
        <div className="prod-temporada" key={`p${i}`}>
          <Campo rotulo={`Passo ${i + 1}`} obrigatorio>
            <input
              type="text"
              value={p.titulo}
              onChange={(e) =>
                aoAlterar({
                  percurso: registro.percurso.map((x, n) =>
                    n === i ? { ...x, titulo: e.target.value } : x,
                  ),
                })
              }
              className="prod-campo-entrada"
              data-titulo-passo
            />
          </Campo>
          <Campo rotulo="Texto">
            <textarea
              value={p.texto}
              onChange={(e) =>
                aoAlterar({
                  percurso: registro.percurso.map((x, n) =>
                    n === i ? { ...x, texto: e.target.value } : x,
                  ),
                })
              }
              rows={3}
              className="prod-campo-entrada"
              data-texto-passo
            />
          </Campo>
          <CampoDeImagem
            imagem={p.imagem}
            aoMudar={(x) =>
              aoAlterar({
                percurso: registro.percurso.map((y, n) => (n === i ? { ...y, imagem: x } : y)),
              })
            }
            acervo={catalogo.imagens}
            rotulo="Imagem do passo"
          />
          <BotaoDoStudio
            curto
            aoClicar={() =>
              aoAlterar({ percurso: registro.percurso.filter((_, n) => n !== i) })
            }
            data-acao="remover-passo"
          >
            Remover
          </BotaoDoStudio>
        </div>
      ))}
      <BotaoDoStudio
        aoClicar={() =>
          aoAlterar({
            percurso: [...registro.percurso, { titulo: "", texto: "", imagem: null }],
          })
        }
        data-acao="mais-passo"
      >
        + passo do percurso
      </BotaoDoStudio>
    </>
  );
}
