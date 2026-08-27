import { FichaDaAgenda } from "@/componentes/produtor-agenda";
import { CRITERIO_DE_IDENTIDADE } from "@/dados/duplicatas";
import {
  CONTEXTO_DO_PRODUTOR,
  catalogoDaAgenda,
  registrosSemeados,
} from "@/dados/mock/seed-produtor";

/**
 * pagina-da-agenda.tsx, o componente de SERVIDOR que as oito rotas da agenda montam.
 *
 * OITO ROTAS, UMA FICHA. As telas da jornada existiam como oito páginas independentes, cada
 * uma lendo o próprio recorte do catálogo, montando o próprio seletor de registro e o
 * próprio cabeçalho. Aqui a ficha é uma só e a rota decide apenas por qual ATO ela abre,
 * é o que faz o `2/8` do trilho significar alguma coisa e o link de um impedimento levar ao
 * ato que o resolve sem trocar de página.
 *
 * ELE É QUEM CHAMA `seed-produtor` POR VALOR, no build, e passa adiante DTOs só de
 * primitivo. A ficha importa o módulo apenas por tipo, é essa fronteira, e só ela, que
 * impede os 9,4 MB de `entidades.json` de atravessarem (DP-F).
 *
 * Sob `output: "export"` (D-24) isto roda uma vez, na geração do artefato estático.
 */
export function PaginaDaAgenda({ ato, inicio = false }: { ato: number; inicio?: boolean }) {
  return (
    <FichaDaAgenda
      semente={registrosSemeados()}
      contexto={CONTEXTO_DO_PRODUTOR}
      catalogo={catalogoDaAgenda()}
      atoInicial={ato}
      criterioDeIdentidade={CRITERIO_DE_IDENTIDADE}
      comInicio={inicio}
    />
  );
}
