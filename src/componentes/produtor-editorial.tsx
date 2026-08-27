"use client";

import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { CampoComProposta } from "@/componentes/base/campo-com-proposta";
import { EditorDeBlocos } from "@/componentes/base/editor-de-blocos";
import { Campo } from "@/componentes/base/ficha-em-atos";
import { OpcaoDeSegmento, Segmento } from "@/componentes/base/segmento";
import { SeletorDeCatalogo } from "@/componentes/base/seletor-de-catalogo";
import { FichaSimples } from "@/componentes/produtor-ficha";
import {
  CARA_DA_FAMILIA,
  FAMILIAS_EDITORIAIS,
  ROTULO_DA_FAMILIA,
} from "@/dados/tipos-produtor";
import type { CatalogoEditorial } from "@/dados/mock/seed-produtor";
import type {
  ContextoDoProdutor,
  PonteDoRegistro,
  Registro,
  RegistroEditorial,
} from "@/dados/tipos-produtor";

/**
 * produtor-editorial.tsx, a matéria, e a maior lacuna do produto.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 53 CORPOS PARA 1.850 PÁGINAS EDITORIAIS.
 *
 * O grafo traz 1.805 conteúdos e 46 publicações, e cada um vira uma página. O CORPO das 53
 * que têm foi coletado à parte; as outras 1.797 abrem com chapéu, título e lead, e nada
 * abaixo. Nenhuma outra pauta tem lacuna desse tamanho.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * A FAMÍLIA MUDA A CARA DA PÁGINA, e não só um rótulo. `materia.tsx` lê `data-familia` e
 * desenha diferente: opinião abre com aspas e SEM foto, a opinião não tem rosto de
 * reportagem, publicação abre com capa de livro, e as outras três com hero fotográfico.
 * Escolher a família é escolher o desenho.
 *
 * SEÇÃO VAZIA DERRUBA O BUILD. `/noticias/[secao]` é gerada por `generateStaticParams` sobre
 * as quatro seções; uma seção declarada sem nenhuma matéria produz uma rota que não tem o
 * que renderizar. A guarda está no ato 2.
 */
export function FichaEditorial({
  semente,
  contexto,
  catalogo,
}: {
  semente: Registro[];
  contexto: ContextoDoProdutor;
  catalogo: CatalogoEditorial;
}) {
  return (
    <FichaSimples<"editorial">
      pauta="editorial"
      semente={semente}
      contexto={contexto}
      catalogo={catalogo}
      destinoAoPublicar="/noticias/"
      cabecalhoDaIdentidade={() => (
        <p className="prod-campo-nota" data-lacuna-editorial>
          <strong>
            {catalogo.comCorpo} de {catalogo.totalDeMaterias}
          </strong>{" "}
          páginas editoriais do acervo têm corpo. As outras abrem com chapéu, título e lead,
          e nada abaixo, é a maior lacuna de alimentação do produto.
        </p>
      )}
      atosProprios={(r, alterar) => [
        {
          rotulo: "Família",
          fechado: r.familia !== null,
          conteudo: <AtoFamilia registro={r} aoAlterar={alterar} />,
        },
        {
          rotulo: "Seção",
          fechado: r.secao.trim() !== "",
          conteudo: <AtoSecao registro={r} catalogo={catalogo} aoAlterar={alterar} />,
        },
        {
          rotulo: "Cabeçalho",
          fechado: r.lead.trim() !== "",
          conteudo: <AtoCabecalho registro={r} aoAlterar={alterar} />,
        },
        {
          rotulo: "Autor",
          fechado: r.autorNome.trim() !== "",
          conteudo: <AtoAutor registro={r} aoAlterar={alterar} />,
        },
        {
          rotulo: "Corpo",
          fechado: r.corpo.length > 0,
          conteudo: (
            <EditorDeBlocos
              blocos={r.corpo}
              aoMudar={(b) => alterar({ corpo: b })}
              acervoDeImagens={catalogo.imagens}
            />
          ),
        },
        {
          rotulo: "Ligações",
          fechado: r.pontes.length > 0,
          conteudo: <AtoLigacoes registro={r} catalogo={catalogo} aoAlterar={alterar} />,
        },
      ]}
    />
  );
}

// ---------------------------------------------------------------------------

function AtoFamilia({
  registro,
  aoAlterar,
}: {
  registro: RegistroEditorial;
  aoAlterar: (m: Partial<RegistroEditorial>) => void;
}) {
  return (
    <>
      <Campo
        rotulo="Família"
        obrigatorio
        nota="Ela muda a CARA da página, não só o rótulo, `materia.tsx` lê `data-familia` e desenha diferente."
      >
        <Segmento rotulo="família editorial" data-seletor-familia>
          {FAMILIAS_EDITORIAIS.map((f) => (
            <OpcaoDeSegmento
              key={f}
              selecionado={registro.familia === f}
              data-familia={f}
              onClick={() => aoAlterar({ familia: f })}
            >
              {ROTULO_DA_FAMILIA[f]}
            </OpcaoDeSegmento>
          ))}
        </Segmento>
      </Campo>

      {/* O QUE CADA UMA FAZ COM A PÁGINA, dito antes da escolha e não depois. */}
      <ul className="prod-lista" data-cara-da-familia>
        {FAMILIAS_EDITORIAIS.map((f) => (
          <li key={f}>
            <div
              className="prod-chave-item"
              data-fechado={registro.familia === f ? "sim" : "nao"}
            >
              <span className="prod-degrau-marca" aria-hidden />
              <span>
                <strong>{ROTULO_DA_FAMILIA[f]}</strong>, {CARA_DA_FAMILIA[f]}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function AtoSecao({
  registro,
  catalogo,
  aoAlterar,
}: {
  registro: RegistroEditorial;
  catalogo: CatalogoEditorial;
  aoAlterar: (m: Partial<RegistroEditorial>) => void;
}) {
  return (
    <>
      <Campo
        rotulo="Seção"
        obrigatorio
        nota="As quatro do submenu. Uma seção declarada sem nenhuma matéria produz uma rota que não tem o que renderizar, e derruba o build."
      >
        <SeletorDeCatalogo
          nome="Seção"
          unico
          termos={catalogo.secoes}
          escolhidos={registro.secao ? [registro.secao] : []}
          aoMudar={(ids) => aoAlterar({ secao: ids[0] ?? "" })}
          aceitaProposta={false}
          porQueFechado="`/noticias/[secao]` é gerada sobre estas quatro. Criar uma quinta é mudar a rota, e isso é decisão de catálogo, na tela de Catálogos, com o alcance medido antes."
        />
      </Campo>

      <Campo rotulo="Categoria" nota="As 22 do CMS. É ela que o filtro da vitrine lê.">
        <SeletorDeCatalogo
          nome="Categoria"
          unico
          termos={catalogo.categorias}
          escolhidos={registro.categoria ? [registro.categoria] : []}
          aoMudar={(ids) => aoAlterar({ categoria: ids[0] ?? "" })}
          aceitaProposta={false}
          porQueFechado="As 22 categorias vêm do CMS do Itaú Cultural, e `leituras.ts` traduz cada uma. Uma categoria sem rótulo lá vira um chip escrito em inglês de banco de dados no meio de uma tela em português."
        />
      </Campo>
    </>
  );
}

function AtoCabecalho({
  registro,
  aoAlterar,
}: {
  registro: RegistroEditorial;
  aoAlterar: (m: Partial<RegistroEditorial>) => void;
}) {
  return (
    <>
      <Campo rotulo="Chapéu" nota="A linha curta acima do título. Nas entrevistas, é o nome de quem foi entrevistado.">
        <input
          type="text"
          value={registro.chapeu}
          onChange={(e) => aoAlterar({ chapeu: e.target.value })}
          className="prod-campo-entrada"
          data-chapeu
        />
      </Campo>

      <Campo
        rotulo="Lead"
        obrigatorio
        nota="O parágrafo de abertura. Diferente do resumo: o resumo é o que o cartão mostra na vitrine, o lead é como a página começa."
      >
        <textarea
          value={registro.lead}
          onChange={(e) => aoAlterar({ lead: e.target.value })}
          rows={4}
          className="prod-campo-entrada"
          data-lead
          aria-invalid={registro.lead.trim() === ""}
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

      {registro.familia === "opiniao" ? (
        <p className="prod-campo-nota" data-opiniao-sem-foto>
          Opinião abre com <strong>aspas e sem foto</strong>. A capa que você escolheu no ato
          1 continua valendo para o cartão da vitrine, o que muda é a página.
        </p>
      ) : null}
    </>
  );
}

function AtoAutor({
  registro,
  aoAlterar,
}: {
  registro: RegistroEditorial;
  aoAlterar: (m: Partial<RegistroEditorial>) => void;
}) {
  return (
    <>
      <p className="prod-campo-nota">
        Hoje o autor só existe quando o crawl achou <code>columnist: true</code> na página de
        origem, ou seja, nas colunas, e em mais nada. Uma notícia assinada e uma entrevista
        conduzida saem sem nome.
      </p>

      <Campo rotulo="Nome" obrigatorio={registro.familia === "coluna" || registro.familia === "opiniao"}>
        <input
          type="text"
          value={registro.autorNome}
          onChange={(e) => aoAlterar({ autorNome: e.target.value })}
          className="prod-campo-entrada"
          data-autor-nome
        />
      </Campo>

      <Campo rotulo="Descrição" nota="Uma linha sobre quem assina, é o que a página mostra ao lado do nome.">
        <textarea
          value={registro.autorDescricao}
          onChange={(e) => aoAlterar({ autorDescricao: e.target.value })}
          rows={2}
          className="prod-campo-entrada"
          data-autor-descricao
        />
      </Campo>
    </>
  );
}

function AtoLigacoes({
  registro,
  catalogo,
  aoAlterar,
}: {
  registro: RegistroEditorial;
  catalogo: CatalogoEditorial;
  aoAlterar: (m: Partial<RegistroEditorial>) => void;
}) {
  const RELACOES = [
    { id: "aprofunda", rotulo: "aprofunda" },
    { id: "fala_sobre", rotulo: "fala sobre" },
    { id: "contextualiza", rotulo: "contextualiza" },
  ] as const;

  function acrescentar(relacao: string, alvoId: string, alvoTitulo: string) {
    const ponte: PonteDoRegistro = { relacao, alvoId, alvoTitulo, motivo: "" };
    aoAlterar({ pontes: [...registro.pontes, ponte] });
  }

  return (
    <>
      <p className="prod-campo-nota">
        A ligação é o que faz a matéria pertencer ao acervo em vez de flutuar ao lado dele. E
        o <strong>motivo é o selo que o público lê</strong>, não uma anotação interna.
      </p>

      {RELACOES.map((rel) => (
        <Campo key={rel.id} rotulo={`Esta matéria ${rel.rotulo}…`}>
          <CampoComProposta
            nome="Registro do acervo"
            acervo={catalogo.acervo}
            porta="moderacao"
            escolha={{ id: null, titulo: null, proposto: false }}
            aoEscolher={(e) => e.id && e.titulo && acrescentar(rel.id, e.id, e.titulo)}
          />
        </Campo>
      ))}

      {registro.pontes.map((p, i) => (
        <div className="prod-temporada" key={`${p.alvoId}-${i}`}>
          <strong className="prod-registro-titulo">
            {RELACOES.find((r) => r.id === p.relacao)?.rotulo ?? p.relacao} · {p.alvoTitulo}
          </strong>
          <Campo
            rotulo="Por quê"
            obrigatorio
            nota="Este texto é o SELO que o público lê no cartão. Selo em branco não publica."
          >
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
            data-acao="remover-ligacao"
          >
            Remover
          </BotaoDoStudio>
        </div>
      ))}
    </>
  );
}
