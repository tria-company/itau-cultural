import { SuperficieSoWeb } from "@/componentes/superficie-so-web";
import { SeparacaoDaOrganizacao } from "@/componentes/separacao-da-organizacao";
import { StudioOrgAlcance } from "@/componentes/studio-org-alcance";
import {
  DATA_DA_MEDIDA,
  GESTOR_DA_ORGANIZACAO,
  GESTOR_E_AUTORADO,
  ORGANIZACAO_DA_DEMONSTRACAO,
  eventosParaPrograma,
  instituicaoInicial,
  instituicoesDoAcervo,
  numerosDaIntegracao,
} from "@/dados/organizacao";

/**
 * Studio · Organização, O9 · Alcance consolidado (funcionalidade 152).
 *
 * PÁGINA DE SERVIDOR, pela fronteira de sempre (DP-F).
 *
 * ELA NÃO CALCULA ALCANCE, e a ausência de cálculo é a decisão: o que atravessa são os 300
 * eventos com quem os realiza, a linguagem e o território, arestas contáveis. Não existe
 * neste módulo nenhuma função que produza número de público, e não existir é o que impede a
 * tela de exibir um por engano.
 *
 * O denominador de espaço vem de `numerosDaIntegracao()` em vez de literal digitado: é a
 * mesma contagem que a tela de importação usa, e as duas nunca discordam.
 */
export default function PaginaStudioOrgAlcance() {
  const instituicoes = instituicoesDoAcervo();
  const numeros = numerosDaIntegracao();

  return (
    <SuperficieSoWeb>
      {/* A SEPARAÇÃO, DECLARADA NA PRÓPRIA TELA. Uma tela que mudou de dono e não
          diz isso deixa quem chega achando que nada mudou. */}
      <SeparacaoDaOrganizacao lado="passou-ao-produtor" />
      <StudioOrgAlcance
        instituicoes={instituicoes}
        eventos={eventosParaPrograma()}
        inicial={instituicaoInicial(instituicoes)}
        ocorrencias={numeros.ocorrencias}
        ocorrenciasComEspaco={numeros.ocorrenciasComEspaco}
        organizacao={ORGANIZACAO_DA_DEMONSTRACAO}
        autor={GESTOR_DA_ORGANIZACAO}
        gestorEAutorado={GESTOR_E_AUTORADO}
        dataDeReferencia={DATA_DA_MEDIDA}
      />
    </SuperficieSoWeb>
  );
}
