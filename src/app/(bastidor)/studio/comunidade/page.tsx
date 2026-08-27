import { BarraDoStudio } from "@/componentes/produtor-barra";
import { Comunidade } from "@/componentes/produtor-comunidade";
import { PAUTAS_COM_FICHA } from "@/dados/produtor-rotas";
import {
  CONTEXTO_DO_PRODUTOR,
  catalogoComum,
  catalogoDaAgenda,
  registrosSemeados,
} from "@/dados/mock/seed-produtor";

/**
 * Studio · Comunidade, o outro lado do que você publica.
 *
 * Os agentes são do ACERVO REAL (o mesmo catálogo que a ficha da agenda usa para vincular
 * quem realiza), e atravessam como DTO de primitivo (DP-F). Os comentários são autorados
 * e determinísticos, calculados no cliente a partir do id de cada registro.
 */
export default function Pagina() {
  return (
    <>
      <Comunidade
        semente={registrosSemeados()}
        contexto={CONTEXTO_DO_PRODUTOR}
        agentes={catalogoDaAgenda().agentes}
      />

      <BarraDoStudio pautasComFicha={PAUTAS_COM_FICHA} imagens={catalogoComum().imagens} />
    </>
  );
}
