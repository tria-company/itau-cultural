import { FichaDoMuseu } from "@/componentes/produtor-museu";
import {
  CONTEXTO_DO_PRODUTOR,
  catalogoDoMuseu,
  registrosSemeados,
} from "@/dados/mock/seed-produtor";

/**
 * Studio · Museu, espaço-museu, exposição permanente e exposição em cartaz.
 *
 * A ficha da PERMANENTE é a que carrega o peso: `exposicoes-permanentes.ts` guarda duas
 * exposições inteiras à mão, 19 passos de percurso, 12 fotos, 5 vídeos e 3 textos
 * assinados, e é conteúdo editorial vestido de código. `seed-produtor.ts` migra as duas
 * linha a linha e `verificar-produtor.mjs` confere os cinco números.
 */
export default function Pagina() {
  return (
    <FichaDoMuseu
      semente={registrosSemeados()}
      contexto={CONTEXTO_DO_PRODUTOR}
      catalogo={catalogoDoMuseu()}
    />
  );
}
