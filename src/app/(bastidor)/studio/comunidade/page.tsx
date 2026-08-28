import { Comunidade } from "@/componentes/comunidade";
import { CapaDaComunidade } from "@/componentes/comunidade-capa";
import {
  COMUNIDADE_OFICIAL,
  COMUNIDADES,
  PUBLICACOES,
  comunidadePorId,
} from "@/dados/comunidade";
import { PUBLICACOES_DO_ACERVO } from "@/dados/comunidade-feed";
import { BarraDoStudio } from "@/componentes/produtor-barra";
import { PAUTAS_COM_FICHA } from "@/dados/produtor-rotas";
import { CONTEXTO_DO_PRODUTOR, catalogoComum } from "@/dados/mock/seed-produtor";

/**
 * Studio · Comunidade, o feed de quem produz.
 *
 * PORTADA DO OUTRO RAMO em 2026-08-28, do repositorio Apogeunexus/bid-itau, onde estas
 * telas foram construidas. O corpo e o de la, palavra por palavra: o pedido foi que
 * ficassem EXATAMENTE iguais. O que muda e o endereco, porque aqui elas vivem na visao do
 * Produtor, sob /studio/, e nao no app publico.
 *
 * Por isso a BarraDoStudio no fim: e ela que da as abas do aparelho a qualquer tela do
 * Studio, e sem ela esta rota seria a unica sem saida na visao app.
 */

/** Medidos no build: a comunidade da casa e quantas publicações ela abre. */
const DA_CASA = comunidadePorId(COMUNIDADE_OFICIAL) ?? COMUNIDADES[0];
const PUBLICACOES_DA_CASA = [...PUBLICACOES, ...PUBLICACOES_DO_ACERVO].filter(
  (p) => p.comunidadeId === COMUNIDADE_OFICIAL,
).length;

export default function PaginaComunidade() {
  return (
    <div
      className="flex flex-col gap-5 px-1 py-4 desk:px-2 desk:py-6"
      data-margem-quase-nula
    >
      {/* A CAPA NO LUGAR DO CABEÇALHO DE TEXTO (2026-08-28): a foto da comunidade com o
          nome dentro, no gesto da abertura de Descobrir. Ela também é a porta da gestão. */}
      <CapaDaComunidade
        comunidadeId={COMUNIDADE_OFICIAL}
        nome={DA_CASA.nome}
        descricao={DA_CASA.descricao}
        hoje={CONTEXTO_DO_PRODUTOR.dataDeReferencia}
        publicacoes={PUBLICACOES_DA_CASA}
        assinantes={DA_CASA.assinantes}
        gerenciavel
      />

      <Comunidade comunidadeId={COMUNIDADE_OFICIAL} />

      <BarraDoStudio pautasComFicha={PAUTAS_COM_FICHA} imagens={catalogoComum().imagens} />
    </div>
  );
}
