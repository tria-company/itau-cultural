"use client";

import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { CampoComProposta } from "@/componentes/base/campo-com-proposta";
import { Campo } from "@/componentes/base/ficha-em-atos";
import { OpcaoDeSegmento, Segmento } from "@/componentes/base/segmento";
import { SeletorDeCatalogo } from "@/componentes/base/seletor-de-catalogo";
import { FichaSimples } from "@/componentes/produtor-ficha";
import {
  COBRANCAS,
  EXIGE_POR_MODALIDADE,
  FORMATOS_DE_CURSO,
  MODALIDADES,
  ROTULO_DA_COBRANCA,
  ROTULO_DA_MODALIDADE,
  ROTULO_DO_FORMATO_DE_CURSO,
  emReais,
} from "@/dados/tipos-produtor";
import type { CatalogoDoEspaco } from "@/dados/mock/seed-produtor";
import type {
  ContextoDoProdutor,
  Registro,
  RegistroDeCurso,
} from "@/dados/tipos-produtor";

/**
 * produtor-cursos.tsx, a formação, com os três campos que hoje são adivinhados.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TRÊS REGEX SOBRE O TÍTULO, EM `cursos-wire.ts`:
 *
 *   `classificarFormato()` procura `doutorado|mestrado|especializa|cátedra` para dizer
 *   «isto é uma pós-graduação»; `oficina|ateliê` para «oficina»; e cai em «formação» quando
 *   nada casa.
 *
 *   `textoTemGratuito()` procura `/gratuit/` no título e no resumo.
 *
 *   `textoEstaCancelado()` procura `/cancelad/`.
 *
 * AS TRÊS SÃO DERIVAÇÃO DECLARADA, e o arquivo diz isso: a afirmação «isto é um mestrado» é
 * conferível lendo o título. Mas derivação não é declaração, e as três erram do mesmo jeito:
 * um curso chamado «Oficina de escrita: o mestrado que não fiz» vira pós-graduação, e um
 * intitulado «Gratuidade na cultura» vira gratuito.
 *
 * A REGEX CONTINUA VALENDO PARA OS 54 HERDADOS, e a tela diz isso. Um registro do acervo que
 * ninguém reabriu não tem os campos; apagá-la faria os 54 perderem o formato de uma vez.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const REGEX_COMO_HERANCA =
  "Os 54 cursos do acervo continuam sendo classificados por regex sobre o título, é o que " +
  "`cursos-wire.ts` faz hoje, e apagá-la faria os 54 perderem o formato de uma vez. O que " +
  "muda é que um curso ABERTO nesta ficha passa a declarar, e o declarado ganha da regex.";

export function FichaDosCursos({
  semente,
  contexto,
  catalogo,
}: {
  semente: Registro[];
  contexto: ContextoDoProdutor;
  catalogo: CatalogoDoEspaco;
}) {
  return (
    <FichaSimples<"cursos">
      pauta="cursos"
      semente={semente}
      contexto={contexto}
      catalogo={catalogo}
      destinoAoPublicar="/cursos/"
      temLugarFisico={(r) => EXIGE_POR_MODALIDADE[r.modalidade].recursosFisicos}
      cabecalhoDaIdentidade={() => (
        <p className="prod-campo-nota" data-regex-herdada>
          {REGEX_COMO_HERANCA}
        </p>
      )}
      atosProprios={(r, alterar) => [
        {
          rotulo: "Formato",
          fechado: r.formato !== null,
          conteudo: <AtoFormato registro={r} aoAlterar={alterar} />,
        },
        {
          rotulo: "Modalidade e período",
          fechado: r.inicio.trim() !== "",
          conteudo: <AtoPeriodo registro={r} catalogo={catalogo} aoAlterar={alterar} />,
        },
        {
          rotulo: "Inscrição",
          fechado: r.cobranca !== "pago" || r.preco.inteira !== null,
          conteudo: <AtoInscricao registro={r} aoAlterar={alterar} />,
        },
        {
          rotulo: "Educativo",
          fechado: r.materialDidatico.length > 0 || r.aceitaVisitaEducativa,
          conteudo: <AtoEducativo registro={r} aoAlterar={alterar} />,
        },
        {
          rotulo: "Situação",
          fechado: !r.cancelado || (r.motivoDoCancelamento ?? "").trim() !== "",
          conteudo: <AtoSituacao registro={r} aoAlterar={alterar} />,
        },
      ]}
    />
  );
}

// ---------------------------------------------------------------------------

function AtoFormato({
  registro,
  aoAlterar,
}: {
  registro: RegistroDeCurso;
  aoAlterar: (m: Partial<RegistroDeCurso>) => void;
}) {
  return (
    <>
      <Campo
        rotulo="Formato"
        obrigatorio
        nota="Hoje `classificarFormato()` adivinha isto procurando «doutorado», «oficina» ou «ateliê» no título. Aqui é declarado, e o declarado ganha da regex."
      >
        <SeletorDeCatalogo
          nome="Formato"
          unico
          termos={FORMATOS_DE_CURSO.map((f) => ({
            id: f,
            rotulo: ROTULO_DO_FORMATO_DE_CURSO[f],
          }))}
          escolhidos={registro.formato ? [registro.formato] : []}
          aoMudar={(ids) =>
            aoAlterar({ formato: (ids[0] as RegistroDeCurso["formato"]) ?? null })
          }
          aceitaProposta={false}
          porQueFechado="Os cinco formatos são o vocabulário da vitrine de Cursos. Acrescentar um é decisão de catálogo, na tela de Catálogos."
        />
      </Campo>

      <Campo rotulo="Público-alvo">
        <input
          type="text"
          value={registro.publicoAlvo}
          onChange={(e) => aoAlterar({ publicoAlvo: e.target.value })}
          placeholder="professores da rede pública, estudantes de artes visuais…"
          className="prod-campo-entrada"
          data-publico-alvo
        />
      </Campo>

      <Campo rotulo="Pré-requisitos">
        <textarea
          value={registro.preRequisitos}
          onChange={(e) => aoAlterar({ preRequisitos: e.target.value })}
          rows={2}
          className="prod-campo-entrada"
          data-pre-requisitos
        />
      </Campo>

      <label className="prod-dimensao">
        <input
          type="checkbox"
          checked={registro.certificado}
          onChange={(e) => aoAlterar({ certificado: e.target.checked })}
          data-certificado
        />
        <span className="prod-dimensao-rotulo">emite certificado</span>
      </label>
    </>
  );
}

function AtoPeriodo({
  registro,
  catalogo,
  aoAlterar,
}: {
  registro: RegistroDeCurso;
  catalogo: CatalogoDoEspaco;
  aoAlterar: (m: Partial<RegistroDeCurso>) => void;
}) {
  const exige = EXIGE_POR_MODALIDADE[registro.modalidade];

  return (
    <>
      <Campo rotulo="Modalidade" obrigatorio>
        <Segmento rotulo="modalidade do curso" data-seletor-modalidade>
          {MODALIDADES.map((m) => (
            <OpcaoDeSegmento
              key={m}
              selecionado={registro.modalidade === m}
              data-modalidade={m}
              onClick={() => aoAlterar({ modalidade: m })}
            >
              {ROTULO_DA_MODALIDADE[m]}
            </OpcaoDeSegmento>
          ))}
        </Segmento>
      </Campo>

      {exige.plataforma ? (
        <Campo rotulo="Plataforma" obrigatorio>
          <input
            type="text"
            value={registro.plataforma}
            onChange={(e) => aoAlterar({ plataforma: e.target.value })}
            placeholder="Itaú Cultural Play, Zoom, Moodle…"
            className="prod-campo-entrada"
            data-plataforma
            aria-invalid={registro.plataforma.trim() === ""}
          />
        </Campo>
      ) : null}

      {exige.espaco ? (
        <Campo rotulo="Onde acontece">
          <CampoComProposta
            nome="Espaço"
            acervo={catalogo.espacos.map((e) => ({
              id: e.id,
              titulo: e.titulo,
              classe: "espaço",
              resumo: [e.cidade, e.estado].filter(Boolean).join(", "),
            }))}
            porta="organizacao"
            escolha={{
              id: registro.espacoId,
              titulo: registro.espacoTitulo,
              proposto: false,
            }}
            aoEscolher={(e) => aoAlterar({ espacoId: e.id, espacoTitulo: e.titulo })}
            rotuloDeCriar="Cadastrar espaço agora"
          />
        </Campo>
      ) : null}

      <div className="prod-par">
        <Campo rotulo="Início" obrigatorio>
          <input
            type="date"
            value={registro.inicio}
            onChange={(e) => aoAlterar({ inicio: e.target.value })}
            className="prod-campo-entrada"
            data-inicio
            aria-invalid={registro.inicio.trim() === ""}
          />
        </Campo>
        <Campo rotulo="Fim">
          <input
            type="date"
            value={registro.fim}
            min={registro.inicio || undefined}
            onChange={(e) => aoAlterar({ fim: e.target.value })}
            className="prod-campo-entrada"
            data-fim
          />
        </Campo>
      </div>

      <Campo rotulo="Dias e horários" nota="Em texto, como a escola publica: «terças, das 19h às 22h».">
        <input
          type="text"
          value={registro.diasEHorarios}
          onChange={(e) => aoAlterar({ diasEHorarios: e.target.value })}
          className="prod-campo-entrada"
          data-dias-horarios
        />
      </Campo>

      <Campo rotulo="Carga horária">
        <input
          type="text"
          value={registro.cargaHoraria}
          onChange={(e) => aoAlterar({ cargaHoraria: e.target.value })}
          placeholder="40 horas"
          className="prod-campo-entrada"
          data-carga-horaria
        />
      </Campo>
    </>
  );
}

function AtoInscricao({
  registro,
  aoAlterar,
}: {
  registro: RegistroDeCurso;
  aoAlterar: (m: Partial<RegistroDeCurso>) => void;
}) {
  return (
    <>
      <label className="prod-dimensao">
        <input
          type="checkbox"
          checked={registro.inscricaoAberta}
          onChange={(e) => aoAlterar({ inscricaoAberta: e.target.checked })}
          data-inscricao-aberta
        />
        <span className="prod-dimensao-rotulo">inscrições abertas</span>
      </label>

      {registro.inscricaoAberta ? (
        <>
          <div className="prod-par">
            <Campo rotulo="Vagas">
              <input
                type="number"
                min={1}
                value={registro.vagas ?? ""}
                onChange={(e) =>
                  aoAlterar({ vagas: e.target.value === "" ? null : Number(e.target.value) })
                }
                className="prod-campo-entrada"
                data-vagas
              />
            </Campo>
            <Campo rotulo="Prazo">
              <input
                type="date"
                value={registro.prazoDeInscricao ?? ""}
                onChange={(e) => aoAlterar({ prazoDeInscricao: e.target.value || null })}
                className="prod-campo-entrada"
                data-prazo
              />
            </Campo>
          </div>
          <Campo rotulo="Link de inscrição">
            <input
              type="url"
              value={registro.linkDeInscricao}
              onChange={(e) => aoAlterar({ linkDeInscricao: e.target.value })}
              className="prod-campo-entrada"
              data-link-inscricao
            />
          </Campo>
        </>
      ) : (
        <p className="prod-campo-nota">
          Com as inscrições fechadas, vagas, prazo e link não aparecem, pedi-los seria
          pedir o que ninguém vai usar.
        </p>
      )}

      {/* HOJE `textoTemGratuito()` PROCURA `/gratuit/` NO TÍTULO. Aqui é campo. */}
      <Campo
        rotulo="Cobrança"
        obrigatorio
        nota="Hoje a gratuidade é adivinhada procurando «gratuit» no título e no resumo, e um curso chamado «Gratuidade na cultura» vira gratuito por acidente."
      >
        <Segmento rotulo="como se paga" data-seletor-cobranca>
          {COBRANCAS.filter((c) => c !== "gratuito-com-retirada").map((c) => (
            <OpcaoDeSegmento
              key={c}
              selecionado={registro.cobranca === c}
              data-cobranca={c}
              onClick={() => aoAlterar({ cobranca: c })}
            >
              {ROTULO_DA_COBRANCA[c]}
            </OpcaoDeSegmento>
          ))}
        </Segmento>
      </Campo>

      {registro.cobranca === "pago" ? (
        <Campo
          rotulo="Preço"
          obrigatorio
          nota={registro.preco.inteira !== null ? emReais(registro.preco.inteira) : undefined}
        >
          <input
            type="number"
            min={0}
            value={registro.preco.inteira === null ? "" : registro.preco.inteira / 100}
            onChange={(e) =>
              aoAlterar({
                preco: {
                  ...registro.preco,
                  inteira: e.target.value === "" ? null : Math.round(Number(e.target.value) * 100),
                },
              })
            }
            className="prod-campo-entrada"
            data-preco
            aria-invalid={registro.preco.inteira === null}
          />
        </Campo>
      ) : null}
    </>
  );
}

function AtoEducativo({
  registro,
  aoAlterar,
}: {
  registro: RegistroDeCurso;
  aoAlterar: (m: Partial<RegistroDeCurso>) => void;
}) {
  return (
    <>

      <Campo rotulo="Material didático" nota="Um endereço por linha. Não há upload neste protótipo.">
        <textarea
          value={registro.materialDidatico.join("\n")}
          onChange={(e) =>
            aoAlterar({
              materialDidatico: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean),
            })
          }
          rows={4}
          className="prod-campo-entrada"
          data-material
        />
      </Campo>

      <label className="prod-dimensao">
        <input
          type="checkbox"
          checked={registro.aceitaVisitaEducativa}
          onChange={(e) => aoAlterar({ aceitaVisitaEducativa: e.target.checked })}
          data-visita-educativa
        />
        <span className="prod-dimensao-rotulo">aceita visita educativa de escola</span>
      </label>

      {registro.aceitaVisitaEducativa ? (
        <p className="prod-campo-nota">
          A escola pede a visita pela tela pública, com data, horário, número de pessoas e
          responsável. O pedido chega aqui como pendência, e quem confirma é você.
        </p>
      ) : null}
    </>
  );
}

function AtoSituacao({
  registro,
  aoAlterar,
}: {
  registro: RegistroDeCurso;
  aoAlterar: (m: Partial<RegistroDeCurso>) => void;
}) {
  return (
    <>
      {/* HOJE `textoEstaCancelado()` PROCURA `/cancelad/`. Um curso sobre «arte cancelada»
          vira cancelado, e um curso realmente cancelado cujo título não diz continua no ar. */}
      <label className="prod-dimensao">
        <input
          type="checkbox"
          checked={registro.cancelado}
          onChange={(e) =>
            aoAlterar({
              cancelado: e.target.checked,
              motivoDoCancelamento: e.target.checked ? registro.motivoDoCancelamento : null,
            })
          }
          data-cancelado
        />
        <span className="prod-dimensao-rotulo">este curso foi cancelado</span>
      </label>


      {registro.cancelado ? (
        <Campo
          rotulo="Motivo do cancelamento"
          obrigatorio
          nota="Cancelamento sem motivo não dispara alerta útil: quem tinha o curso salvo recebe um aviso que não explica nada."
        >
          <textarea
            value={registro.motivoDoCancelamento ?? ""}
            onChange={(e) => aoAlterar({ motivoDoCancelamento: e.target.value || null })}
            rows={3}
            className="prod-campo-entrada"
            data-motivo-cancelamento
            aria-invalid={!(registro.motivoDoCancelamento ?? "").trim()}
          />
        </Campo>
      ) : null}
    </>
  );
}
