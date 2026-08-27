"use client";

import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { Campo } from "@/componentes/base/ficha-em-atos";
import { SeletorDeCatalogo } from "@/componentes/base/seletor-de-catalogo";
import { FichaSimples } from "@/componentes/produtor-ficha";
import { FORMATOS_DE_MIDIA, ROTULO_DO_FORMATO } from "@/dados/tipos-organizacao";
import type { CatalogoComum } from "@/dados/mock/seed-produtor";
import type {
  ContextoDoProdutor,
  Registro,
  RegistroDeMidia,
} from "@/dados/tipos-produtor";

/**
 * produtor-midia.tsx, o ativo transversal. Subir uma vez, usar em muitas.
 *
 * PORTADA DA ORGANIZAÇÃO (tela O5). Ela era da Organização e passou ao Produtor pelo mesmo
 * critério das outras seis: descrevia uma ação que a Organização não fará. Quem sobe o
 * arquivo, declara o crédito e responde pelo direito de distribuição é quem produz o
 * conteúdo, a instituição responde pela ficha DELA, não pelos ativos de cada evento.
 *
 * A FICHA TÉCNICA É A LACUNA QUE TRAVA DUAS FUNCIONALIDADES. Sem duração declarada não há
 * barra de progresso honesta; sem capítulo não há retomada que signifique alguma coisa,
 * retomar aos 43% de um podcast de duas horas é retomar no meio de uma frase. É por isso
 * que «player com retomada» e «download e offline» estão registrados como NÃO SUSTENTADOS,
 * e não como faltando: o que falta é dado, não tela.
 */
export function FichaDaMidia({
  semente,
  contexto,
  catalogo,
}: {
  semente: Registro[];
  contexto: ContextoDoProdutor;
  catalogo: CatalogoComum;
}) {
  return (
    <FichaSimples<"midia">
      pauta="midia"
      semente={semente}
      contexto={contexto}
      catalogo={catalogo}
      cabecalhoDaIdentidade={() => (
        <p className="prod-campo-nota">
          O ativo é <strong>transversal</strong>: ele não tem vitrine própria: é o que o
          evento, o episódio e a matéria usam. Subir uma vez, usar em muitas.
        </p>
      )}
      atosProprios={(r, alterar) => [
        {
          rotulo: "Arquivo",
          fechado: r.arquivo.trim() !== "",
          conteudo: <AtoArquivo registro={r} aoAlterar={alterar} />,
        },
        {
          rotulo: "Ficha técnica",
          fechado: r.formato !== null,
          conteudo: <AtoFichaTecnica registro={r} aoAlterar={alterar} />,
        },
        {
          rotulo: "Direitos",
          fechado: r.direito.declarado && r.direito.titular.trim() !== "",
          conteudo: <AtoDireitos registro={r} aoAlterar={alterar} />,
        },
      ]}
    />
  );
}

// ---------------------------------------------------------------------------

function AtoArquivo({
  registro,
  aoAlterar,
}: {
  registro: RegistroDeMidia;
  aoAlterar: (m: Partial<RegistroDeMidia>) => void;
}) {
  return (
    <Campo
      rotulo="Arquivo ou URL"
      obrigatorio
      nota="Não há upload neste protótipo, ele é um artefato estático, sem servidor para receber arquivo. Cole o endereço, ou o id do vídeo."
    >
      <input
        type="text"
        value={registro.arquivo}
        onChange={(e) => aoAlterar({ arquivo: e.target.value })}
        className="prod-campo-entrada"
        data-arquivo
        aria-invalid={registro.arquivo.trim() === ""}
      />
    </Campo>
  );
}

function AtoFichaTecnica({
  registro,
  aoAlterar,
}: {
  registro: RegistroDeMidia;
  aoAlterar: (m: Partial<RegistroDeMidia>) => void;
}) {
  const precisaDuracao = registro.formato === "audio" || registro.formato === "video";

  return (
    <>
      <Campo rotulo="Formato" obrigatorio>
        <SeletorDeCatalogo
          nome="Formato"
          unico
          termos={FORMATOS_DE_MIDIA.map((f) => ({ id: f, rotulo: ROTULO_DO_FORMATO[f] }))}
          escolhidos={registro.formato ? [registro.formato] : []}
          aoMudar={(ids) =>
            aoAlterar({ formato: (ids[0] as RegistroDeMidia["formato"]) ?? null })
          }
          aceitaProposta={false}
          porQueFechado="Os quatro formatos são o vocabulário do contrato, lido pelo player."
        />
      </Campo>

      {precisaDuracao ? (
        <>
          <Campo
            rotulo="Duração"
            nota="Texto e não segundos: quem preenche digita «1:42:30», e converter na entrada esconderia o erro de digitação até a hora de tocar."
          >
            <input
              type="text"
              value={registro.duracao}
              onChange={(e) => aoAlterar({ duracao: e.target.value })}
              placeholder="1:42:30"
              className="prod-campo-entrada"
              data-duracao
            />
          </Campo>

          {/* OS CAPÍTULOS SÃO O QUE FAZ A RETOMADA SIGNIFICAR ALGUMA COISA. Sem eles,
              retomar aos 43% de duas horas é retomar no meio de uma frase. */}
          <Campo rotulo="Capítulos">
            {registro.capitulos.map((c, i) => (
              <div className="prod-par" key={`c${i}`}>
                <input
                  type="text"
                  value={c.inicio}
                  onChange={(e) =>
                    aoAlterar({
                      capitulos: registro.capitulos.map((x, n) =>
                        n === i ? { ...x, inicio: e.target.value } : x,
                      ),
                    })
                  }
                  placeholder="12:30"
                  className="prod-campo-entrada"
                  aria-label={`início do capítulo ${i + 1}`}
                  data-capitulo-inicio
                />
                <input
                  type="text"
                  value={c.titulo}
                  onChange={(e) =>
                    aoAlterar({
                      capitulos: registro.capitulos.map((x, n) =>
                        n === i ? { ...x, titulo: e.target.value } : x,
                      ),
                    })
                  }
                  placeholder="título do capítulo"
                  className="prod-campo-entrada"
                  aria-label={`título do capítulo ${i + 1}`}
                  data-capitulo-titulo
                />
                <BotaoDoStudio
                  curto
                  aoClicar={() =>
                    aoAlterar({ capitulos: registro.capitulos.filter((_, n) => n !== i) })
                  }
                  data-acao="remover-capitulo"
                >
                  Remover
                </BotaoDoStudio>
              </div>
            ))}
            <BotaoDoStudio
              curto
              aoClicar={() =>
                aoAlterar({ capitulos: [...registro.capitulos, { titulo: "", inicio: "" }] })
              }
              data-acao="mais-capitulo"
            >
              + capítulo
            </BotaoDoStudio>
          </Campo>
        </>
      ) : (
        <p className="prod-campo-nota" data-sem-duracao>
          Duração e capítulos não aparecem porque este formato não toca. Um texto não tem
          barra de progresso.
        </p>
      )}
    </>
  );
}

function AtoDireitos({
  registro,
  aoAlterar,
}: {
  registro: RegistroDeMidia;
  aoAlterar: (m: Partial<RegistroDeMidia>) => void;
}) {
  const d = registro.direito;
  return (
    <>

      <Campo rotulo="Titular do direito" obrigatorio nota="Texto, porque o titular pode não estar no grafo.">
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
          Declaro que este ativo não permite download nem incorporação.
        </button>
      ) : null}
    </>
  );
}
