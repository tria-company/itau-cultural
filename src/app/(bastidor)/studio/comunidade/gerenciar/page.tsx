import { GestaoDaComunidade } from "@/componentes/comunidade-gestao";
import { BarraDoStudio } from "@/componentes/produtor-barra";
import { PAUTAS_COM_FICHA } from "@/dados/produtor-rotas";
import { CONTEXTO_DO_PRODUTOR, catalogoComum } from "@/dados/mock/seed-produtor";
import { COMUNIDADE_OFICIAL, COMUNIDADES, comunidadePorId } from "@/dados/comunidade";

/**
 * Studio · Quem está na comunidade.
 *
 * A COMUNIDADE PELO LADO DE QUEM A MANTÉM, aberta em 2026-08-28: nome, chamada, capa,
 * regras, e o que se publica nela. O feed em `/studio/comunidade/` continua sendo a tela
 * de quem lê; esta é a de quem escreve.
 *
 * ESCOPADA NA COMUNIDADE DA CASA. O produtor deste Studio é a produção do Itaú Cultural,
 * e a comunidade que ele mantém é a mesma que `/studio/comunidade/` abre. As outras 21
 * pertencem a instituições, coletivos e pessoas reais, amarradas à Enciclopédia.
 *
 * PÁGINA DE SERVIDOR: o dado é lido aqui, no build, e atravessa como DTO de primitivo.
 */
const DA_CASA = comunidadePorId(COMUNIDADE_OFICIAL) ?? COMUNIDADES[0];

export default function Pagina() {
  return (
    <>
      <GestaoDaComunidade
        comunidadeId={COMUNIDADE_OFICIAL}
        nome={DA_CASA.nome}
        descricao={DA_CASA.descricao}
        assinantes={DA_CASA.assinantes}
        hoje={CONTEXTO_DO_PRODUTOR.dataDeReferencia}
      />

      <BarraDoStudio pautasComFicha={PAUTAS_COM_FICHA} imagens={catalogoComum().imagens} />
    </>
  );
}
