import { notFound } from "next/navigation";
import { Comunidade } from "@/componentes/comunidade";
import { CapaDaComunidade } from "@/componentes/comunidade-capa";
import { COMUNIDADES, PUBLICACOES, comunidadePorId } from "@/dados/comunidade";
import { PUBLICACOES_DO_ACERVO } from "@/dados/comunidade-feed";
import { BarraDoStudio } from "@/componentes/produtor-barra";
import { PAUTAS_COM_FICHA } from "@/dados/produtor-rotas";
import { CONTEXTO_DO_PRODUTOR, catalogoComum } from "@/dados/mock/seed-produtor";

/**
 * Studio · Comunidade, uma comunidade do acervo.
 *
 * PORTADA DO OUTRO RAMO em 2026-08-28, do repositorio Apogeunexus/bid-itau, onde estas
 * telas foram construidas. O corpo e o de la, palavra por palavra: o pedido foi que
 * ficassem EXATAMENTE iguais. O que muda e o endereco, porque aqui elas vivem na visao do
 * Produtor, sob /studio/, e nao no app publico.
 *
 * Por isso a BarraDoStudio no fim: e ela que da as abas do aparelho a qualquer tela do
 * Studio, e sem ela esta rota seria a unica sem saida na visao app.
 */

/** Quantas publicações o build abre para uma comunidade. Medido, não estimado. */
const TODAS_AS_PUBLICACOES = [...PUBLICACOES, ...PUBLICACOES_DO_ACERVO];
function quantasPublicacoes(id: string): number {
  return TODAS_AS_PUBLICACOES.filter((p) => p.comunidadeId === id).length;
}

export function generateStaticParams() {
  return COMUNIDADES.map((c) => ({ id: c.id }));
}

export default async function PaginaDeComunidade({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const comunidade = comunidadePorId(id);
  if (!comunidade) notFound();

  return (
    <div className="flex flex-col gap-5 p-5 desk:p-8">
      {/* Sem o botão de gestão: estas 21 comunidades pertencem a instituições, coletivos
          e pessoas reais, amarradas por `entidadeId` à Enciclopédia. Deixá-las renomear
          aqui cruzaria a mesma linha que este produto se recusa a cruzar ao não autorar
          elenco. Quem gerencia é só a comunidade da casa. */}
      <CapaDaComunidade
        comunidadeId={id}
        nome={comunidade.nome}
        descricao={comunidade.descricao}
        hoje={CONTEXTO_DO_PRODUTOR.dataDeReferencia}
        publicacoes={quantasPublicacoes(id)}
        assinantes={comunidade.assinantes}
      />

      <Comunidade comunidadeId={id} />

      <BarraDoStudio pautasComFicha={PAUTAS_COM_FICHA} imagens={catalogoComum().imagens} />
    </div>
  );
}
