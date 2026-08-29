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
 * Studio · Comunidade, o feed de quem lê.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ELA VOLTOU A SER LEITURA EM 29/08/2026. Até aqui esta rota atendia duas pessoas ao mesmo
 * tempo: montava `ComunidadeNoStudio`, com publicar, editar e apagar, e uma capa com lápis.
 * O pedido foi de uma linha: dentro do Studio fica tudo que ele mexe, e a aba Comunidade é
 * o que ele consome. A gestão mudou para `/studio/minhas-comunidades/[id]/`.
 *
 * O QUE SOBRA É O FEED CRU, o mesmo que `/studio/comunidade/[id]/` já montava para as de
 * fora. Sem `acoesDoPost`, sem `acaoDePublicar`, e a capa sem `gerenciavel`.
 *
 * ESTA ROTA É A PORTA, E O SELETOR É A NAVEGAÇÃO. Ela abre na comunidade da casa porque
 * ela é a que ele sempre assina; trocar no seletor leva para `/studio/comunidade/[id]/`,
 * onde a capa e o feed falam da mesma comunidade. Antes o seletor trocava só o feed, por
 * estado, e a capa acima continuava mostrando a comunidade anterior.
 * ─────────────────────────────────────────────────────────────────────────────
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
      <CapaDaComunidade
        comunidadeId={COMUNIDADE_OFICIAL}
        nome={DA_CASA.nome}
        descricao={DA_CASA.descricao}
        hoje={CONTEXTO_DO_PRODUTOR.dataDeReferencia}
        publicacoes={PUBLICACOES_DA_CASA}
        assinantes={DA_CASA.assinantes}
      />

      <Comunidade comunidadeId={COMUNIDADE_OFICIAL} />

      <BarraDoStudio pautasComFicha={PAUTAS_COM_FICHA} imagens={catalogoComum().imagens} />
    </div>
  );
}
