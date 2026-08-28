"use client";

import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { CampoDeImagem } from "@/componentes/base/campo-de-imagem";
import { Campo } from "@/componentes/base/ficha-em-atos";
import { SeletorDeCatalogo } from "@/componentes/base/seletor-de-catalogo";
import { FichaSimples } from "@/componentes/produtor-ficha";
import { imagemVazia, semTravessao } from "@/dados/tipos-produtor";
import type { CatalogoDoEspaco } from "@/dados/mock/seed-produtor";
import type {
  ContextoDoProdutor,
  ImagemDeclarada,
  Registro,
  RegistroDeEspaco,
} from "@/dados/tipos-produtor";

/**
 * produtor-espaco.tsx, o lugar deixa de ser inferência.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * O QUE O ACERVO TEM SOBRE OS 113 ESPAÇOS: cidade, estado, país. E mais nada.
 *
 * Não há endereço, não há capacidade, não há horário, não há foto e não há acessibilidade
 * física. A coordenada dos 472 nós que a têm é SEMPRE derivada, 118 por centroide de
 * município, 27 por centroide de estado, 214 por centroide de país e 113 por deslocamento
 * a partir do espaço. É por isso que 0 de 2.425 sessões declaram espaço: o espaço existe
 * como nome, não como lugar.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * A LATITUDE NÃO É CAMPO, E NUNCA SERÁ (D-19, D-20). Ela é derivada do município e
 * carimbada como derivada, e a tela diz o método. Um campo de latitude aqui produziria
 * coordenada digitada passando por coordenada medida, e o mapa perderia a única coisa que
 * o torna honesto, que é declarar a precisão de cada pino.
 *
 * PORTADA DA ORGANIZAÇÃO (tela O2), pelo mesmo critério das outras seis: cadastrar o espaço
 * onde o próprio evento acontece é ação de quem produz, não da instituição.
 */
/**
 * O ACERVO DE ESPAÇOS, medido no build e atravessado como primitivo (DP-F).
 *
 * Estes números moravam na parede da Organização empilhada embaixo desta tela, e mudaram
 * de andar em 2026-08-27: eles são o que a pauta tem de verdade a mostrar. Espaço não tem
 * vitrine nem audiência, então o trio genérico do painel abria «0 no ar / 0 visualizações»
 * e não dizia nada.
 */
export interface AcervoDeEspacos {
  total: number;
  declaramAcessibilidade: number;
  comCoordenada: number;
  ocorrencias: number;
  ocorrenciasComEspaco: number;
  porMetodo: { metodo: string; quantos: number }[];
}

/**
 * O método que produziu mais coordenadas, escrito para gente ler.
 *
 * «centroide-municipio» vira «município». O acervo usa um método só, então isto é uma
 * frase, e não uma distribuição.
 */
function metodoDominante(porMetodo: { metodo: string; quantos: number }[]): string {
  const maior = [...porMetodo].sort((a, b) => b.quantos - a.quantos)[0];
  if (!maior) return "sem coordenada no acervo";
  // Os identificadores do dado vêm sem acento; a tela é texto, e texto leva acento.
  const NOME: Record<string, string> = {
    "centroide-municipio": "centroide de município",
    "centroide-estado": "centroide de estado",
    "centroide-pais": "centroide de país",
    "deslocamento-por-espaco": "deslocamento a partir do espaço",
  };
  return `${maior.quantos} por ${NOME[maior.metodo] ?? maior.metodo.replace(/-/g, " ")}`;
}

/**
 * Os rascunhos agrupados pelo estado que cada um declara.
 *
 * O painel genérico listava oito linhas iguais, todas dizendo «continue de onde parou».
 * Agrupar por UF é o único corte que os dados sustentam, e é o que um produtor procura:
 * onde ficam os lugares que ele ainda não cadastrou.
 */
function agrupar(daPauta: RegistroDeEspaco[]): { nome: string; registros: Registro[] }[] {
  const mapa = new Map<string, Registro[]>();
  for (const r of daPauta) {
    const uf = r.estado.trim() === "" ? "sem estado" : r.estado.trim();
    mapa.set(uf, [...(mapa.get(uf) ?? []), r]);
  }
  return [...mapa.entries()]
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .map(([nome, registros]) => ({ nome, registros }));
}

export function FichaDoEspaco({
  semente,
  contexto,
  catalogo,
  acervo,
}: {
  semente: Registro[];
  contexto: ContextoDoProdutor;
  catalogo: CatalogoDoEspaco;
  acervo: AcervoDeEspacos;
}) {
  return (
    <FichaSimples<"espacos">
      pauta="espacos"
      semente={semente}
      contexto={contexto}
      catalogo={catalogo}
      destinoAoPublicar="/mapa/"
      temLugarFisico={() => true}
      painelDaPauta={(daPauta) => {
        // `daPauta` traz a pauta INTEIRA, publicados inclusive. «Em edição» é um recorte,
        // e chamá-lo de total fazia a tela contar publicado como rascunho.
        const emEdicao = daPauta.filter(
          (r) => r.situacao === "rascunho" || r.situacao === "devolvido",
        );
        return {
        contagem: `${acervo.total} no acervo`,
        numeros: [
          { valor: String(acervo.total), rotulo: "no acervo" },
          {
            valor: `${acervo.declaramAcessibilidade}/${acervo.total}`,
            rotulo: "declaram acessibilidade",
          },
          { valor: String(emEdicao.length), rotulo: "em edição" },
        ],
        frase:
          "Os espaços do acervo são inferência do território: nenhum deles é cadastro.",
        cartoes: [
          {
            titulo: "Coordenada",
            largura: 4,
            medidor: {
              porcento: Math.round((acervo.comCoordenada / Math.max(1, acervo.total)) * 100),
              rotulo: "têm coordenada",
            },
            // O MÉTODO CABE NA NOTA. Ele era um cartão de barras, e como o acervo usa um
            // método só, a barra ocupava a largura inteira e virava um bloco branco
            // (reprovado a olho, 2026-08-27). Um valor único não é distribuição.
            nota: `Sempre derivada, nunca digitada: ${metodoDominante(acervo.porMetodo)}.`,
          },
          {
            titulo: "Acessibilidade",
            largura: 4,
            medidor: {
              porcento: Math.round(
                (acervo.declaramAcessibilidade / Math.max(1, acervo.total)) * 100,
              ),
              rotulo: "declaram",
            },
            nota: "Silêncio não é ausência: falta o ato de declarar.",
          },
          {
            titulo: "Sessões que dizem onde acontecem",
            largura: 4,
            medidor: {
              porcento: Math.round(
                (acervo.ocorrenciasComEspaco / Math.max(1, acervo.ocorrencias)) * 100,
              ),
              rotulo: `de ${acervo.ocorrencias}`,
            },
            nota: "É o que o cadastro daqui resolve.",
          },
        ],
        grupos: agrupar(emEdicao),
        tituloDosGrupos: "Em edição, por estado",
        subDe: (r) => {
          const e = r as RegistroDeEspaco;
          const onde = [e.cidade, e.estado].filter((x) => x.trim() !== "").join(", ");
          return onde === "" ? "sem cidade ainda" : semTravessao(onde);
        },
        };
      }}
      cabecalhoDaIdentidade={() => (
        <p className="prod-campo-nota">
          <strong>{catalogo.totalDeEspacos}</strong> espaços no acervo: o que falta em
          todos é endereço.
        </p>
      )}
      atosProprios={(r, alterar) => [
        {
          rotulo: "Endereço",
          fechado: r.endereco.trim() !== "" && r.cidade.trim() !== "",
          conteudo: <AtoEndereco registro={r} catalogo={catalogo} aoAlterar={alterar} />,
        },
        {
          rotulo: "Visita",
          fechado: r.horario.trim() !== "",
          conteudo: <AtoVisita registro={r} aoAlterar={alterar} />,
        },
        {
          rotulo: "Fotos",
          fechado: r.fotos.length > 0,
          conteudo: <AtoFotos registro={r} catalogo={catalogo} aoAlterar={alterar} />,
        },
      ]}
    />
  );
}

// ---------------------------------------------------------------------------

function AtoEndereco({
  registro,
  catalogo,
  aoAlterar,
}: {
  registro: RegistroDeEspaco;
  catalogo: CatalogoDoEspaco;
  aoAlterar: (m: Partial<RegistroDeEspaco>) => void;
}) {
  return (
    <>
      <Campo rotulo="Endereço" obrigatorio nota="Logradouro e número. Texto, porque é o que a organização tem, não é geocódigo.">
        <input
          type="text"
          value={registro.endereco}
          onChange={(e) => aoAlterar({ endereco: e.target.value })}
          className="prod-campo-entrada"
          data-endereco
          aria-invalid={registro.endereco.trim() === ""}
        />
      </Campo>

      <Campo rotulo="Bairro">
        <input
          type="text"
          value={registro.bairro}
          onChange={(e) => aoAlterar({ bairro: e.target.value })}
          className="prod-campo-entrada"
          data-bairro
        />
      </Campo>

      <div className="prod-par">
        <Campo rotulo="Cidade" obrigatorio>
          <input
            type="text"
            value={registro.cidade}
            onChange={(e) => aoAlterar({ cidade: e.target.value })}
            className="prod-campo-entrada"
            data-cidade
            aria-invalid={registro.cidade.trim() === ""}
          />
        </Campo>
        <Campo rotulo="Estado" obrigatorio>
          <SeletorDeCatalogo
            nome="Estado"
            unico
            termos={catalogo.estados.map((e) => ({ id: e, rotulo: e }))}
            escolhidos={registro.estado ? [registro.estado] : []}
            aoMudar={(ids) => aoAlterar({ estado: ids[0] ?? "" })}
            aceitaProposta={false}
            porQueFechado="Território é governança da plataforma: só a Administração acrescenta município e estado. Os 27 do acervo, faltam Sergipe e Tocantins, e a ausência é declarada no Observatório."
          />
        </Campo>
      </div>

      <Campo rotulo="Capacidade" nota="Lotação declarada. Vazio é «não sei», nunca 0, que seria «cabe ninguém» e é uma afirmação diferente.">
        <input
          type="number"
          min={1}
          value={registro.capacidade ?? ""}
          onChange={(e) =>
            aoAlterar({ capacidade: e.target.value === "" ? null : Number(e.target.value) })
          }
          className="prod-campo-entrada"
          data-capacidade
        />
      </Campo>

      {/* A COORDENADA É CARIMBO, E ELE DIZ O MÉTODO. Latitude digitada não existe neste
          produto: ela é derivada do município, e o mapa exibe a precisão de cada pino na
          legenda, a honestidade do dado é argumento da proposta (D-19, D-20). */}
      <Campo rotulo="Coordenada">
        <p className="prod-carimbo" data-metodo-coordenada={registro.metodoDaCoordenada}>
          derivada por <strong>{registro.metodoDaCoordenada.replace(/-/g, " ")}</strong>,
          calculada a partir de {registro.cidade || "cidade"}
          {registro.estado ? `, ${registro.estado}` : ""}. O acervo não traz latitude, e
          este produto não a digita.
        </p>
      </Campo>
    </>
  );
}

function AtoVisita({
  registro,
  aoAlterar,
}: {
  registro: RegistroDeEspaco;
  aoAlterar: (m: Partial<RegistroDeEspaco>) => void;
}) {
  return (
    <>
      <Campo
        rotulo="Horário de funcionamento"
        nota="Em texto, como a instituição publica: «terça a domingo, das 11h às 20h»."
      >
        <textarea
          value={registro.horario}
          onChange={(e) => aoAlterar({ horario: e.target.value })}
          rows={3}
          className="prod-campo-entrada"
          data-horario
        />
      </Campo>

      <Campo rotulo="Entrada" nota="Gratuita, paga, com agendamento, o que o público precisa saber antes de sair de casa.">
        <input
          type="text"
          value={registro.entrada}
          onChange={(e) => aoAlterar({ entrada: e.target.value })}
          placeholder="entrada gratuita"
          className="prod-campo-entrada"
          data-entrada
        />
      </Campo>
    </>
  );
}

function AtoFotos({
  registro,
  catalogo,
  aoAlterar,
}: {
  registro: RegistroDeEspaco;
  catalogo: CatalogoDoEspaco;
  aoAlterar: (m: Partial<RegistroDeEspaco>) => void;
}) {
  function alterarFoto(i: number, f: ImagemDeclarada | null) {
    if (f === null) {
      aoAlterar({ fotos: registro.fotos.filter((_, n) => n !== i) });
      return;
    }
    aoAlterar({ fotos: registro.fotos.map((x, n) => (n === i ? f : x)) });
  }

  return (
    <>
      {/* AS 21 FACHADAS DE HOJE VÊM DA WIKIMEDIA, e é por isso que a licença é um campo e
          não uma nota de rodapé: quem republica uma foto CC tem obrigação de dizer sob que
          licença o faz. */}

      {registro.fotos.map((f, i) => (
        <CampoDeImagem
          key={`foto${i}`}
          imagem={f}
          aoMudar={(x) => alterarFoto(i, x)}
          acervo={catalogo.imagens}
          rotulo={`Foto ${i + 1}`}
        />
      ))}

      <BotaoDoStudio
        aoClicar={() => aoAlterar({ fotos: [...registro.fotos, imagemVazia()] })}
        data-acao="mais-foto"
      >
        + foto
      </BotaoDoStudio>
    </>
  );
}
