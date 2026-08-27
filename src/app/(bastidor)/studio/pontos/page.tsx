import { LojaDePontos } from "@/componentes/produtor-pontos";
import { BarraDoStudio } from "@/componentes/produtor-barra";
import { PAUTAS_COM_FICHA } from "@/dados/produtor-rotas";
import {
  CONTEXTO_DO_PRODUTOR,
  catalogoComum,
  registrosSemeados,
} from "@/dados/mock/seed-produtor";

/**
 * Studio · Loja de pontos, o que o cuidado com o dado vale.
 *
 * Os pontos são RECALCULADOS do estado dos registros a cada render, nunca guardados: um
 * saldo gravado seria uma segunda verdade, e divergiria da primeira no instante em que
 * alguém apagasse o crédito de uma foto. O armazém próprio guarda só o que foi resgatado.
 */
export default function Pagina() {
  return (
    <>
      <LojaDePontos semente={registrosSemeados()} contexto={CONTEXTO_DO_PRODUTOR} />

      <BarraDoStudio
        semente={registrosSemeados()}
        contexto={CONTEXTO_DO_PRODUTOR}
        pautasComFicha={PAUTAS_COM_FICHA}
        imagens={catalogoComum().imagens}
      />
    </>
  );
}
