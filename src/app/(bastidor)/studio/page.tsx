import { ProdutorPainel } from "@/componentes/produtor-painel";
import {
  CONTEXTO_DO_PRODUTOR,
  PRODUTOR_ALIMENTA_TUDO,
  SEMENTE_E_AUTORADA,
  catalogoComum,
  registrosSemeados,
} from "@/dados/mock/seed-produtor";
import { PAUTAS_COM_FICHA } from "@/dados/produtor-rotas";

/**
 * Studio, P1 · o painel do produtor. **A tela que nunca existiu.**
 *
 * `/studio` era um diretório com dezoito telas e nenhum índice. Quem chegava digitava a URL
 * de uma delas, o menu lateral apontava para `/studio/duplicatas` porque precisava escolher
 * alguma, e as oito telas da jornada não se alcançavam entre si. Esta é a porta, e é ela que
 * o menu, o hub e a rota de chegada do papel «produtor» passam a abrir.
 *
 * PÁGINA DE SERVIDOR. É ela quem chama `@/dados/mock/seed-produtor` por valor, no build, e
 * passa adiante DTOs só de primitivo. O painel importa o módulo apenas por tipo, é essa
 * fronteira, e só ela, que impede os 9,4 MB de `entidades.json` de atravessarem (DP-F).
 *
 * Sob `output: "export"` (D-24) isto roda uma vez, na geração do artefato estático.
 */
export default function StudioPainel() {
  return (
    <ProdutorPainel
      semente={registrosSemeados()}
      contexto={CONTEXTO_DO_PRODUTOR}
      sementeEAutorada={SEMENTE_E_AUTORADA}
      produtorAlimentaTudo={PRODUTOR_ALIMENTA_TUDO}
      pautasComFicha={PAUTAS_COM_FICHA}
      imagens={catalogoComum().imagens}
    />
  );
}
