import { FichaDoCast } from "@/componentes/produtor-cast";
import {
  CONTEXTO_DO_PRODUTOR,
  catalogoDoCast,
  registrosSemeados,
} from "@/dados/mock/seed-produtor";

/**
 * Studio · Cast, a ficha do episódio de podcast.
 *
 * PÁGINA DE SERVIDOR: é ela quem chama `seed-produtor` por valor, no build, e passa adiante
 * DTOs só de primitivo. A ficha importa o módulo apenas por tipo (DP-F).
 */
export default function Pagina() {
  return (
    <FichaDoCast
      semente={registrosSemeados()}
      contexto={CONTEXTO_DO_PRODUTOR}
      catalogo={catalogoDoCast()}
    />
  );
}
