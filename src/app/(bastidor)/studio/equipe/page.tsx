import { SuperficieSoWeb } from "@/componentes/superficie-so-web";
import { SeparacaoDaOrganizacao } from "@/componentes/separacao-da-organizacao";
import { StudioOrgEquipe } from "@/componentes/studio-org-equipe";
import {
  DATA_DA_MEDIDA,
  GESTOR_DA_ORGANIZACAO,
  GESTOR_E_AUTORADO,
  ORGANIZACAO_DA_DEMONSTRACAO,
} from "@/dados/organizacao";

/**
 * Studio · Organização, O7 · Equipe e alçadas (funcionalidades 139 e 140).
 *
 * ESTA PÁGINA NÃO LÊ O GRAFO, e a ausência é a informação. O acervo do Itaú Cultural não
 * publica quadro de pessoal: não há aresta de emprego, não há classe de colaborador, e as
 * 575 pessoas da Enciclopédia são verbetes, não funcionárias. Tudo o que a O7 mostra é
 * autorado, e a tela declara isso em vez de vestir um dado real de fantasia.
 *
 * O que vem daqui são as quatro constantes de contexto: a organização, o autor, a frase que
 * diz que o perfil é autorado, e a data de referência. `DATA_DA_MEDIDA` no lugar do relógio
 * porque o carimbo de cada decisão da equipe sai dela, `new Date()` no cliente exporia o
 * fuso de quem avalia e faria o HTML exportado divergir da página hidratada.
 */
export default function PaginaStudioOrgEquipe() {
  return (
    <SuperficieSoWeb>
      {/* A SEPARAÇÃO, DECLARADA NA PRÓPRIA TELA. Uma tela que mudou de dono e não
          diz isso deixa quem chega achando que nada mudou. */}
      <SeparacaoDaOrganizacao lado="fica-com-a-organizacao" />
      <StudioOrgEquipe
        organizacao={ORGANIZACAO_DA_DEMONSTRACAO}
        autor={GESTOR_DA_ORGANIZACAO}
        gestorEAutorado={GESTOR_E_AUTORADO}
        dataDeReferencia={DATA_DA_MEDIDA}
      />
    </SuperficieSoWeb>
  );
}
