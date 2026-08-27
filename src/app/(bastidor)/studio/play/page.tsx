import { FichaDoPlay } from "@/componentes/produtor-play";
import {
  CONTEXTO_DO_PRODUTOR,
  catalogoDoPlay,
  registrosSemeados,
} from "@/dados/mock/seed-produtor";

/**
 * Studio · Play, a ficha de vídeo, série e playlist.
 *
 * PÁGINA DE SERVIDOR: é ela quem chama `seed-produtor` por valor, no build, e passa adiante
 * DTOs só de primitivo. A ficha importa o módulo apenas por tipo (DP-F).
 */
export default function Pagina() {
  return (
    <FichaDoPlay
      semente={registrosSemeados()}
      contexto={CONTEXTO_DO_PRODUTOR}
      catalogo={catalogoDoPlay()}
    />
  );
}
