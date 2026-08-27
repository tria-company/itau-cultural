import { FichaDaCuradoria } from "@/componentes/produtor-curadoria";
import {
  CONTEXTO_DO_PRODUTOR,
  catalogoDaCuradoria,
  registrosSemeados,
} from "@/dados/mock/seed-produtor";

/**
 * Studio · Curadoria, trilha, destaque e ponte de sentido.
 *
 * PORTADA DA REDAÇÃO (telas E1, E2 e E3). O que estas três povoam é o vazio: das 66.563
 * arestas do grafo, 51.600 são `semelhante_a`, máquina. As quatro relações de SENTIDO
 * somam menos de 80, e `influenciou` mede ZERO. Há UMA trilha curada no acervo inteiro.
 */
export default function Pagina() {
  return (
    <FichaDaCuradoria
      semente={registrosSemeados()}
      contexto={CONTEXTO_DO_PRODUTOR}
      catalogo={catalogoDaCuradoria()}
    />
  );
}
