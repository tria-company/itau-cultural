"use client";

import { useState, type ReactNode } from "react";
import { Cartao } from "@/componentes/cartao";
import { OpcaoDeSegmento, Segmento } from "@/componentes/base/segmento";
import { DESCRICAO_DA_PAUTA } from "@/dados/tipos-produtor";
import type { Registro } from "@/dados/tipos-produtor";
import type { Cartao as CartaoDTO } from "@/dados/cartao";
import type { ClasseEntidade } from "@/dados/tipos";

/**
 * base/previa.tsx, o que o público vai ver, renderizado pelo COMPONENTE PÚBLICO DE VERDADE.
 *
 * NÃO É UMA IMITAÇÃO, e a distinção é o motivo de a primitiva existir. Uma prévia desenhada
 * à parte diverge do produto no primeiro ajuste do cartão, e diverge em silêncio, porque
 * ninguém compara as duas telas lado a lado. Aqui o `<Cartao>` importado é o mesmo que
 * `/descobrir` monta: se o cartão mudar, a prévia muda junto, sem ninguém lembrar.
 *
 * O PREÇO É UM DTO DE ADAPTAÇÃO, e ele é barato. `Cartao` pede um `CartaoDTO` de
 * primitivos; o registro do Studio tem os mesmos campos com outros nomes. A tradução mora
 * aqui, num lugar só, e é ela que carrega a diferença entre «o que o produtor escreveu» e
 * «o que o público lê».
 *
 * O MOTIVO É DECLARADO COMO PRÉVIA. O selo de motivo é o elemento mais importante do cartão
 * público, é ele que separa mediação legível de recomendador opaco, e num registro que
 * ainda não foi publicado não existe aresta nenhuma para produzir um. Inventar uma frase ali
 * faria a prévia prometer uma mediação que o registro não tem. A frase diz o que ela é.
 */

const MOTIVO_DA_PREVIA =
  "prévia do Studio, o selo real nasce da aresta, depois de publicado";

/** A classe da ontologia que cada pauta produz. É ela que decide a rota e o desenho da capa. */
const CLASSE_DA_PAUTA: Record<Registro["pauta"], ClasseEntidade> = {
  agenda: "evento",
  play: "midia",
  cast: "midia",
  museu: "evento",
  cursos: "formacao",
  editorial: "conteudo",
  curadoria: "trilha",
  programa: "evento",
  editais: "conteudo",
  espacos: "espaco",
  midia: "midia",
};

export function cartaoDoRegistro(r: Registro): CartaoDTO {
  return {
    id: r.id,
    classe: CLASSE_DA_PAUTA[r.pauta],
    titulo: r.titulo || "(sem título)",
    // O slug real nasce na publicação. Aqui o id serve, e a prévia não é navegável de
    // propósito: um link para uma rota que ainda não existe daria 404 no meio da revisão.
    slug: r.id,
    imagem: r.imagem?.caminho || undefined,
    creditoImagem: r.imagem?.credito || undefined,
    resumo: r.resumo || undefined,
    linguagens: [...r.linguagens],
    procedencia: "ic",
    motivo: {
      texto: MOTIVO_DA_PREVIA,
      // `sem-aresta`: é a verdade. O registro não foi publicado, não há aresta
      // nenhuma, e o cartão público exibe essa procedência ao lado do selo, a prévia
      // diz que o texto é nosso em vez de deixá-lo passar por texto do acervo (T-02-05).
      origemMotivo: "sem-aresta",
      relacao: null,
      procedenciaAresta: null,
    },
    saltos: 1,
    viaConcentrador: false,
    caminho: [],
  };
}

export interface PropsPrevia {
  registro: Registro;
  /** A prévia da PÁGINA, quando a ficha souber montá-la. Sem ela, só a aba do cartão. */
  pagina?: ReactNode;
}

export function Previa({ registro, pagina }: PropsPrevia) {
  const [aba, setAba] = useState<"cartao" | "pagina">("cartao");
  const d = DESCRICAO_DA_PAUTA[registro.pauta];

  return (
    <div className="prod-previa" data-previa={registro.pauta}>
      {pagina ? (
        <Segmento rotulo="o que a prévia mostra" data-abas-previa>
          <OpcaoDeSegmento
            selecionado={aba === "cartao"}
            onClick={() => setAba("cartao")}
            data-aba="cartao"
          >
            Cartão
          </OpcaoDeSegmento>
          <OpcaoDeSegmento
            selecionado={aba === "pagina"}
            onClick={() => setAba("pagina")}
            data-aba="pagina"
          >
            Página
          </OpcaoDeSegmento>
        </Segmento>
      ) : null}

      <div className="prod-previa-palco" data-palco-previa>
        {aba === "cartao" || !pagina ? (
          // O COMPONENTE PÚBLICO DE VERDADE, sem a promessa de navegação: o slug real
          // nasce na publicação, e o `<Link>` prefetcharia uma rota que não existe.
          <Cartao cartao={cartaoDoRegistro(registro)} naoNavegavel />
        ) : (
          pagina
        )}
      </div>

      <p className="prod-campo-nota">
        {aba === "cartao"
          ? `Assim aparece em ${d.telaPublica || "nenhuma vitrine"}.`
          : "Assim a página abre."}
      </p>
    </div>
  );
}
