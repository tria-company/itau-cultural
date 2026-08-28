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
/**
 * O ACERVO DE ATIVOS, medido no build e atravessado como primitivo (DP-F).
 *
 * Estes números moravam na parede da Organização empilhada embaixo desta tela, e mudaram
 * de andar em 2026-08-27. Eles são o que a pauta tem: mídia não tem vitrine própria, e o
 * trio genérico do painel abria «0 no ar / 0 visualizações / 8 em edição».
 */
export interface AcervoDeMidias {
  total: number;
  comCredito: number;
  semCredito: number;
  comImagemAlt: number;
  comLibras: number;
  declaramAcessibilidade: number;
  dimensoesEmZero: number;
  porCategoria: { categoria: string; quantos: number }[];
}

/**
 * As categorias viram fatias: as cinco maiores, e o resto somado em «outras».
 *
 * A rosca tem seis tons declarados; nove fatias fariam duas delas repetirem o mesmo tom,
 * e duas fatias da mesma cor num gráfico de composição é pior do que uma fatia a menos.
 */
function fatiasDasCategorias(
  porCategoria: { categoria: string; quantos: number }[],
): { rotulo: string; valor: number }[] {
  // Os identificadores do CMS vem sem acento; a legenda e texto, e texto leva acento.
  const NOME: Record<string, string> = {
    series: "séries",
    videos: "vídeos",
    noticias: "notícias",
    colunistas: "colunistas",
    "agenda-cultural": "agenda cultural",
  };
  const maiores = porCategoria.slice(0, 5);
  const resto = porCategoria.slice(5).reduce((n, c) => n + c.quantos, 0);
  const fatias = maiores.map((c) => ({
    rotulo: NOME[c.categoria] ?? c.categoria,
    valor: c.quantos,
  }));
  return resto > 0 ? [...fatias, { rotulo: "outras", valor: resto }] : fatias;
}

export function FichaDaMidia({
  semente,
  contexto,
  catalogo,
  acervo,
}: {
  semente: Registro[];
  contexto: ContextoDoProdutor;
  catalogo: CatalogoComum;
  acervo: AcervoDeMidias;
}) {
  const porcento = (parte: number) =>
    Math.round((parte / Math.max(1, acervo.total)) * 100);

  return (
    <FichaSimples<"midia">
      pauta="midia"
      semente={semente}
      contexto={contexto}
      catalogo={catalogo}
      painelDaPauta={(daPauta) => {
        const emEdicao = daPauta.filter(
          (r) => r.situacao === "rascunho" || r.situacao === "devolvido",
        );
        return {
        contagem: `${acervo.total} no acervo`,
        numeros: [
          { valor: String(acervo.total), rotulo: "ativos no acervo" },
          { valor: String(acervo.semCredito), rotulo: "sem crédito, não publicam" },
          { valor: String(emEdicao.length), rotulo: "em edição" },
        ],
        frase: "Crédito é condição de publicar, e é por ele que a fila anda.",
        cartoes: [
          {
            // ROSCA, E NÃO BARRAS. As categorias são partes de um todo de 529, e com
            // podcasts em 336 contra acervos em 1 a barra mais alta virava um bloco
            // branco e as outras oito, tocos (reprovado a olho, 2026-08-27). Rosca
            // responde «que fatia», que é a pergunta quando o total importa.
            titulo: "As categorias do CMS",
            largura: 8,
            rosca: {
              fatias: fatiasDasCategorias(acervo.porCategoria),
              centroValor: String(acervo.total),
              centroRotulo: "ativos",
            },
            nota: "Categoria não é formato: um podcast é áudio, e a categoria diz outra coisa.",
          },
          {
            titulo: "Crédito",
            largura: 4,
            medidor: { porcento: porcento(acervo.comCredito), rotulo: "creditados" },
            nota: `${acervo.semCredito} esperam por quem os creditou.`,
          },
          {
            titulo: "Descrição alternativa",
            largura: 4,
            medidor: { porcento: porcento(acervo.comImagemAlt), rotulo: "com alt" },
            nota: "Sem alt, a imagem não existe para quem usa leitor de tela.",
          },
          {
            titulo: "Libras",
            largura: 4,
            medidor: {
              porcento: porcento(acervo.comLibras),
              rotulo: `${acervo.comLibras} de ${acervo.total}`,
            },
            nota: `${acervo.dimensoesEmZero} das 8 dimensões medem zero no acervo inteiro.`,
          },
          {
            // MEDIDO, E NÃO CRAVADO. Este 100 era um literal: acertava por coincidência, e
            // mentiria no dia em que um ativo entrasse sem ficha.
            titulo: "Ficha de acessibilidade",
            largura: 4,
            medidor: {
              porcento: porcento(acervo.declaramAcessibilidade),
              rotulo: "declaram a ficha",
            },
            nota: "Declarar não é oferecer: a ficha está preenchida, e quase toda em ausência.",
          },
        ],
        // O QUE FALTA É LIDO DO REGISTRO. A frase era fixa, e por isso continuaria
        // dizendo «falta o arquivo» depois de alguém preencher o arquivo.
        subDe: (r) => {
          if (r.situacao === "publicado") return null;
          const m = r as RegistroDeMidia;
          const faltas = [
            m.arquivo.trim() === "" ? "o arquivo" : null,
            m.formato === null ? "o formato" : null,
            !m.direito.declarado || m.direito.titular.trim() === ""
              ? "o direito de distribuição"
              : null,
          ].filter((x): x is string => x !== null);
          if (faltas.length === 0) return "pronto para publicar";
          // Tres faltas com «e» entre todas viram ladainha: vírgula até a última.
          const lista =
            faltas.length === 1
              ? faltas[0]
              : `${faltas.slice(0, -1).join(", ")} e ${faltas[faltas.length - 1]}`;
          return `falta ${lista}`;
        },
        };
      }}
      cabecalhoDaIdentidade={() => (
        <p className="prod-campo-nota">
          O ativo é <strong>transversal</strong>: subir uma vez, usar em muitas.
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
      nota="Cole o endereço, ou o id do vídeo."
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
