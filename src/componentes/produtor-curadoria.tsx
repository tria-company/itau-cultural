"use client";

import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { CampoComProposta } from "@/componentes/base/campo-com-proposta";
import { Campo } from "@/componentes/base/ficha-em-atos";
import { OpcaoDeSegmento, Segmento } from "@/componentes/base/segmento";
import { SeletorDeCatalogo } from "@/componentes/base/seletor-de-catalogo";
import { FichaSimples } from "@/componentes/produtor-ficha";
import { ROTULO_DO_OBJETO_DE_CURADORIA } from "@/dados/tipos-produtor";
import type { CatalogoDaCuradoria } from "@/dados/mock/seed-produtor";
import type {
  ContextoDoProdutor,
  PassoDaTrilha,
  Registro,
  RegistroDeCuradoria,
} from "@/dados/tipos-produtor";

/**
 * produtor-curadoria.tsx, trilha, destaque e ponte de sentido.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * O QUE ESTAS TRÊS POVOAM, e o vazio que elas encontram.
 *
 * O grafo tem 66.563 arestas, e 51.600 delas são `semelhante_a`, máquina. As quatro
 * relações de SENTIDO, que são as que uma pessoa afirma, medem quase nada:
 * `influenciou` mede ZERO, a relação existe na ontologia e nenhuma aresta a usa,
 * `dialoga_com` mede 31, `contextualiza` mede 4 e `fala_sobre` mede 39. E há UMA trilha
 * curada no acervo inteiro.
 *
 * Não é que falte tela: falta quem escreva. É isso que esta ficha muda.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * O MOTIVO É OBRIGATÓRIO NOS TRÊS, e não é rigor de formulário. O motivo é o SELO que o
 * público lê no cartão, é ele que separa mediação legível de recomendador opaco, e é por
 * causa dele que a caminhada existe em vez de um score. Um passo sem motivo publicaria uma
 * cadeia que não explica a si mesma.
 *
 * O DESTINO DA TRILHA TEM DE SER EVENTO COM SESSÃO DATADA (D-38). Uma trilha de primeira vez
 * termina em algo a que se possa IR: cadeia sem passos, cadeia que não termina em evento e
 * evento sem ocorrência datada são os três casos em que ela não é publicável.
 */
export function FichaDaCuradoria({
  semente,
  contexto,
  catalogo,
}: {
  semente: Registro[];
  contexto: ContextoDoProdutor;
  catalogo: CatalogoDaCuradoria;
}) {
  return (
    <FichaSimples<"curadoria">
      pauta="curadoria"
      semente={semente}
      contexto={contexto}
      catalogo={catalogo}
      destinoAoPublicar="/descobrir/"
      cabecalhoDaIdentidade={(r) => (
        <>
          <div className="prod-carimbo" data-objeto-curadoria={r.objeto}>
            Este registro é <strong>{ROTULO_DO_OBJETO_DE_CURADORIA[r.objeto]}</strong>.
          </div>
          <ul className="prod-lista" data-vazio-de-sentido>
            {catalogo.relacoes.map((rel) => (
              <li key={rel.id}>
                <div className="prod-chave-item" data-fechado={rel.arestas > 0 ? "sim" : "nao"}>
                  <span className="prod-degrau-marca" aria-hidden />
                  <span>
                    <strong>{rel.rotulo}</strong>, {rel.arestas}{" "}
                    {rel.arestas === 1 ? "aresta no acervo" : "arestas no acervo"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      atosProprios={(r, alterar) => {
        if (r.objeto === "destaque") {
          return [
            {
              rotulo: "Destaque",
              fechado: r.itemDestacadoId !== null && r.feed.trim() !== "",
              conteudo: <AtoDestaque registro={r} catalogo={catalogo} aoAlterar={alterar} />,
            },
          ];
        }
        if (r.objeto === "ponte") {
          return [
            {
              rotulo: "Ponte",
              fechado: r.ponte !== null && r.ponte.motivo.trim() !== "",
              conteudo: <AtoPonte registro={r} catalogo={catalogo} aoAlterar={alterar} />,
            },
          ];
        }
        return [
          {
            rotulo: "Passos",
            fechado: r.passos.length > 0 && r.passos.every((p) => p.motivo.trim() !== ""),
            conteudo: <AtoPassos registro={r} catalogo={catalogo} aoAlterar={alterar} />,
          },
          {
            rotulo: "Destino",
            fechado: r.destinoId !== null && r.destinoTemSessaoDatada,
            conteudo: <AtoDestino registro={r} catalogo={catalogo} aoAlterar={alterar} />,
          },
        ];
      }}
    />
  );
}

// ---------------------------------------------------------------------------

function AtoPassos({
  registro,
  catalogo,
  aoAlterar,
}: {
  registro: RegistroDeCuradoria;
  catalogo: CatalogoDaCuradoria;
  aoAlterar: (m: Partial<RegistroDeCuradoria>) => void;
}) {
  const semMotivo = registro.passos.filter((p) => p.motivo.trim() === "");

  function acrescentar(paraId: string, paraTitulo: string) {
    const ultimo = registro.passos[registro.passos.length - 1];
    const passo: PassoDaTrilha = {
      deId: ultimo?.paraId ?? registro.id,
      deTitulo: ultimo?.paraTitulo ?? registro.titulo,
      paraId,
      paraTitulo,
      relacao: "dialoga_com",
      motivo: "",
    };
    aoAlterar({ passos: [...registro.passos, passo] });
  }

  return (
    <>
      <Campo rotulo="Assinatura" obrigatorio nota="Curadoria anônima não é curadoria.">
        <input
          type="text"
          value={registro.assinatura}
          onChange={(e) => aoAlterar({ assinatura: e.target.value })}
          className="prod-campo-entrada"
          data-assinatura
          aria-invalid={registro.assinatura.trim() === ""}
        />
      </Campo>

      {/* UM PASSO SEM MOTIVO IMPEDE PUBLICAR A TRILHA INTEIRA, e a tela diz QUAL passo. */}
      {semMotivo.length > 0 ? (
        <div className="prod-duplicata" data-passos-sem-motivo={String(semMotivo.length)}>
          <strong>
            {semMotivo.length}{" "}
            {semMotivo.length === 1 ? "passo sem motivo" : "passos sem motivo"}
          </strong>
        </div>
      ) : null}

      {registro.passos.map((p, i) => (
        <div className="prod-temporada" key={`p${i}`} data-passo={String(i)}>
          <strong className="prod-registro-titulo">
            {i + 1}. {p.deTitulo} → {p.paraTitulo}
          </strong>
          <Campo rotulo="Relação">
            <SeletorDeCatalogo
              nome="Relação"
              unico
              termos={catalogo.relacoes.map((r) => ({
                id: r.id,
                rotulo: r.rotulo,
                usos: r.arestas,
              }))}
              escolhidos={[p.relacao]}
              aoMudar={(ids) =>
                aoAlterar({
                  passos: registro.passos.map((x, n) =>
                    n === i ? { ...x, relacao: ids[0] ?? "dialoga_com" } : x,
                  ),
                })
              }
              aceitaProposta={false}
              porQueFechado="As quatro relações de sentido são o vocabulário da ontologia."
            />
          </Campo>
          <Campo rotulo="Por quê" obrigatorio nota="O selo que o público lê neste passo.">
            <textarea
              value={p.motivo}
              onChange={(e) =>
                aoAlterar({
                  passos: registro.passos.map((x, n) =>
                    n === i ? { ...x, motivo: e.target.value } : x,
                  ),
                })
              }
              rows={2}
              className="prod-campo-entrada"
              data-motivo-passo
              aria-invalid={p.motivo.trim() === ""}
            />
          </Campo>
          <BotaoDoStudio
            curto
            aoClicar={() =>
              aoAlterar({ passos: registro.passos.filter((_, n) => n !== i) })
            }
            data-acao="remover-passo"
          >
            Remover
          </BotaoDoStudio>
        </div>
      ))}

      <Campo rotulo="Acrescentar passo">
        <CampoComProposta
          nome="Registro do acervo"
          acervo={catalogo.acervo}
          porta="moderacao"
          escolha={{ id: null, titulo: null, proposto: false }}
          aoEscolher={(e) => e.id && e.titulo && acrescentar(e.id, e.titulo)}
        />
      </Campo>
    </>
  );
}

function AtoDestino({
  registro,
  catalogo,
  aoAlterar,
}: {
  registro: RegistroDeCuradoria;
  catalogo: CatalogoDaCuradoria;
  aoAlterar: (m: Partial<RegistroDeCuradoria>) => void;
}) {
  const validos = new Set(catalogo.destinosValidos);
  const eventos = catalogo.acervo.filter((x) => x.classe === "evento");

  return (
    <>

      <Campo rotulo="Destino final" obrigatorio>
        <CampoComProposta
          nome="Evento"
          acervo={eventos}
          porta="moderacao"
          escolha={{
            id: registro.destinoId,
            titulo: registro.destinoTitulo,
            proposto: false,
          }}
          aoEscolher={(e) =>
            aoAlterar({
              destinoId: e.id,
              destinoTitulo: e.titulo,
              destinoTemSessaoDatada: e.id !== null && validos.has(e.id),
            })
          }
        />
      </Campo>

      {registro.destinoId !== null && !registro.destinoTemSessaoDatada ? (
        <div className="prod-duplicata" data-destino-sem-sessao>
          <strong>Este destino não tem sessão datada.</strong>
        </div>
      ) : null}
    </>
  );
}

function AtoDestaque({
  registro,
  catalogo,
  aoAlterar,
}: {
  registro: RegistroDeCuradoria;
  catalogo: CatalogoDaCuradoria;
  aoAlterar: (m: Partial<RegistroDeCuradoria>) => void;
}) {
  return (
    <>
      {/* UM POR FEED. O novo substitui o anterior, dois destaques no mesmo feed fariam a
          vitrine escolher um deles por ordem de leitura, e a curadoria perderia o controle
          do que ela mesma destacou. */}

      <Campo rotulo="Feed" obrigatorio>
        <SeletorDeCatalogo
          nome="Feed"
          unico
          termos={catalogo.feeds}
          escolhidos={registro.feed ? [registro.feed] : []}
          aoMudar={(ids) => aoAlterar({ feed: ids[0] ?? "" })}
          aceitaProposta={false}
          porQueFechado="Os feeds são as vitrines que existem."
        />
      </Campo>

      <Campo rotulo="O que destacar" obrigatorio>
        <CampoComProposta
          nome="Registro do acervo"
          acervo={catalogo.acervo}
          porta="moderacao"
          escolha={{
            id: registro.itemDestacadoId,
            titulo: registro.itemDestacadoTitulo,
            proposto: false,
          }}
          aoEscolher={(e) =>
            aoAlterar({ itemDestacadoId: e.id, itemDestacadoTitulo: e.titulo })
          }
        />
      </Campo>

      <Campo rotulo="Assinatura" obrigatorio>
        <input
          type="text"
          value={registro.assinatura}
          onChange={(e) => aoAlterar({ assinatura: e.target.value })}
          className="prod-campo-entrada"
          data-assinatura
          aria-invalid={registro.assinatura.trim() === ""}
        />
      </Campo>

      <div className="prod-par">
        <Campo rotulo="De" obrigatorio>
          <input
            type="date"
            value={registro.vigenciaInicio}
            onChange={(e) => aoAlterar({ vigenciaInicio: e.target.value })}
            className="prod-campo-entrada"
            data-vigencia-inicio
          />
        </Campo>
        <Campo rotulo="Até" obrigatorio>
          <input
            type="date"
            value={registro.vigenciaFim}
            min={registro.vigenciaInicio || undefined}
            onChange={(e) => aoAlterar({ vigenciaFim: e.target.value })}
            className="prod-campo-entrada"
            data-vigencia-fim
          />
        </Campo>
      </div>
    </>
  );
}

function AtoPonte({
  registro,
  catalogo,
  aoAlterar,
}: {
  registro: RegistroDeCuradoria;
  catalogo: CatalogoDaCuradoria;
  aoAlterar: (m: Partial<RegistroDeCuradoria>) => void;
}) {
  const p = registro.ponte ?? { relacao: "dialoga_com", alvoId: "", alvoTitulo: "", motivo: "" };

  return (
    <>

      <Campo rotulo="Relação" obrigatorio>
        <SeletorDeCatalogo
          nome="Relação"
          unico
          termos={catalogo.relacoes.map((r) => ({
            id: r.id,
            rotulo: r.rotulo,
            usos: r.arestas,
          }))}
          escolhidos={[p.relacao]}
          aoMudar={(ids) =>
            aoAlterar({ ponte: { ...p, relacao: ids[0] ?? "dialoga_com" } })
          }
          aceitaProposta={false}
          porQueFechado="As quatro relações de sentido são o vocabulário da ontologia."
        />
      </Campo>

      <Campo rotulo="Aponta para" obrigatorio>
        <CampoComProposta
          nome="Registro do acervo"
          acervo={catalogo.acervo}
          porta="moderacao"
          escolha={{
            id: p.alvoId || null,
            titulo: p.alvoTitulo || null,
            proposto: false,
          }}
          aoEscolher={(e) =>
            aoAlterar({
              ponte: { ...p, alvoId: e.id ?? "", alvoTitulo: e.titulo ?? "" },
            })
          }
        />
      </Campo>

      <Campo rotulo="Por quê" obrigatorio nota="O selo que o público lê. Selo em branco não publica.">
        <textarea
          value={p.motivo}
          onChange={(e) => aoAlterar({ ponte: { ...p, motivo: e.target.value } })}
          rows={3}
          className="prod-campo-entrada"
          data-motivo-ponte
          aria-invalid={p.motivo.trim() === ""}
        />
      </Campo>

      <Campo rotulo="Assinatura" obrigatorio>
        <input
          type="text"
          value={registro.assinatura}
          onChange={(e) => aoAlterar({ assinatura: e.target.value })}
          className="prod-campo-entrada"
          data-assinatura
          aria-invalid={registro.assinatura.trim() === ""}
        />
      </Campo>
    </>
  );
}

/** O menu de criação da curadoria, três objetos, três formas. */
export function EscolherObjetoDaCuradoria({
  aoEscolher,
}: {
  aoEscolher: (o: RegistroDeCuradoria["objeto"]) => void;
}) {
  return (
    <Segmento rotulo="objeto de curadoria" data-escolher-objeto>
      {(["trilha", "destaque", "ponte"] as const).map((o) => (
        <OpcaoDeSegmento key={o} selecionado={false} data-objeto={o} onClick={() => aoEscolher(o)}>
          {ROTULO_DO_OBJETO_DE_CURADORIA[o]}
        </OpcaoDeSegmento>
      ))}
    </Segmento>
  );
}
