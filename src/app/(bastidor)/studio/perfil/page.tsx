import { PerfilDoProdutorTela } from "@/componentes/produtor-perfil";
import {
  CONTEXTO_DO_PRODUTOR,
  catalogoComum,
  registrosSemeados,
} from "@/dados/mock/seed-produtor";

/**
 * Studio · Perfil, quem é a pessoa e o estado da conta.
 *
 * Os dados pessoais vivem em armazém próprio (produtor.perfil.v1), separado dos registros:
 * reiniciar a demonstração devolve o conteúdo à semente e NÃO apaga o perfil, porque o
 * reinício é sobre o conteúdo, nunca sobre quem está na cadeira.
 *
 * PÁGINA DE SERVIDOR: semente, contexto e imagens saem daqui como DTOs de primitivo (DP-F).
 */
export default function Pagina() {
  return (
    <PerfilDoProdutorTela
      semente={registrosSemeados()}
      contexto={CONTEXTO_DO_PRODUTOR}
      imagens={catalogoComum().imagens}
    />
  );
}
