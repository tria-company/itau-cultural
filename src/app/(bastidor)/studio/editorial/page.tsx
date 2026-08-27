import { FichaEditorial } from "@/componentes/produtor-editorial";
import {
  CONTEXTO_DO_PRODUTOR,
  catalogoEditorial,
  registrosSemeados,
} from "@/dados/mock/seed-produtor";

/**
 * Studio · Editorial, a matéria, com corpo em blocos.
 *
 * PORTADA DA REDAÇÃO (tela E5). Fecha a maior lacuna de alimentação do produto: 53 corpos
 * para 1.850 páginas editoriais. O grafo traz chamada, não corpo, as 1.797 restantes abrem
 * com chapéu, título e lead, e nada abaixo.
 *
 * PÁGINA DE SERVIDOR: chama `seed-produtor` por valor, no build, e passa DTOs de primitivo.
 */
export default function Pagina() {
  return (
    <FichaEditorial
      semente={registrosSemeados()}
      contexto={CONTEXTO_DO_PRODUTOR}
      catalogo={catalogoEditorial()}
    />
  );
}
