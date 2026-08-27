import { SuperficieSoWeb } from "@/componentes/superficie-so-web";
import { SeparacaoDaOrganizacao } from "@/componentes/separacao-da-organizacao";
import { StudioOrgInstituicao } from "@/componentes/studio-org-instituicao";
import {
  DATA_DA_MEDIDA,
  GESTOR_DA_ORGANIZACAO,
  GESTOR_E_AUTORADO,
  ORGANIZACAO_DA_DEMONSTRACAO,
  declaracoesDasInstituicoes,
  instituicaoInicial,
  instituicoesDoAcervo,
  numerosDasInstituicoes,
} from "@/dados/organizacao";

/**
 * Studio · Organização, O1 · Ficha da instituição (funcionalidade 141).
 *
 * PÁGINA DE SERVIDOR, pela mesma fronteira da O2: só ela chama `@/dados/organizacao` por
 * valor, no build, e o componente de cliente importa aquele módulo apenas por tipo (DP-F).
 *
 * AS 246 VÃO JUNTAS. A organização escolhe por qual instituição responde, e trocar de
 * instituição não pode ser navegar, uma rota por instituição geraria 246 páginas e faria
 * quem preenche perder o formulário a cada clique.
 *
 * A INSTITUIÇÃO INICIAL É REGRA, não curadoria: a primeira em ordem de título entre as que
 * realizam evento. `instituicaoInicial()` a calcula sobre a mesma lista que a tela recebe,
 * então as duas nunca discordam.
 *
 * Sob `output: "export"` (D-24) isto roda uma vez, na geração do artefato estático.
 */
export default function PaginaStudioOrgInstituicao() {
  const instituicoes = instituicoesDoAcervo();
  // Uma medição só: `numerosDasInstituicoes()` percorre as 246 pedindo vizinhos, e chamá-la
  // duas vezes dobraria a conta no build para produzir exatamente o mesmo objeto.
  const numeros = numerosDasInstituicoes();

  return (
    <SuperficieSoWeb>
      {/* A SEPARAÇÃO, DECLARADA NA PRÓPRIA TELA. Uma tela que mudou de dono e não
          diz isso deixa quem chega achando que nada mudou. */}
      <SeparacaoDaOrganizacao lado="fica-com-a-organizacao" />
      <StudioOrgInstituicao
        instituicoes={instituicoes}
        inicial={instituicaoInicial(instituicoes)}
        numeros={numeros}
        declaracoes={declaracoesDasInstituicoes(numeros)}
        organizacao={ORGANIZACAO_DA_DEMONSTRACAO}
        autor={GESTOR_DA_ORGANIZACAO}
        gestorEAutorado={GESTOR_E_AUTORADO}
        dataDeReferencia={DATA_DA_MEDIDA}
      />
    </SuperficieSoWeb>
  );
}
