import { SuperficieSoWeb } from "@/componentes/superficie-so-web";
import { SeparacaoDaOrganizacao } from "@/componentes/separacao-da-organizacao";
import { StudioOrgIntegracao } from "@/componentes/studio-org-integracao";
import {
  CHAVE_EMITIDA_PELO_ADMIN,
  DATA_DA_MEDIDA,
  GESTOR_DA_ORGANIZACAO,
  GESTOR_E_AUTORADO,
  ORGANIZACAO_DA_DEMONSTRACAO,
  declaracoesDaIntegracao,
  eventosParaPrograma,
  numerosDaIntegracao,
} from "@/dados/organizacao";

/**
 * Studio · Organização, O8 · Integração (funcionalidades 150 e 151).
 *
 * PÁGINA DE SERVIDOR, pela fronteira de sempre (DP-F).
 *
 * OS 300 EVENTOS ATRAVESSAM COM O TÍTULO NORMALIZADO JUNTO, e não com o cru para o cliente
 * recalcular: a normalização é a primeira parte do critério de identidade, e duas
 * implementações fariam o lote gravar chave diferente da que o acervo usa. O sintoma seria a
 * duplicata que a máquina não acha.
 *
 * A CHAVE VEM PRONTA DO ADMIN, e é a segregação em forma de dado: não existe função de
 * emitir em módulo nenhum desta sessão, então a tela não tem como criar uma nem por engano.
 */
export default function PaginaStudioOrgIntegracao() {
  const numeros = numerosDaIntegracao();

  return (
    <SuperficieSoWeb>
      {/* A SEPARAÇÃO, DECLARADA NA PRÓPRIA TELA. Uma tela que mudou de dono e não
          diz isso deixa quem chega achando que nada mudou. */}
      <SeparacaoDaOrganizacao lado="passou-ao-produtor" />
      <StudioOrgIntegracao
        eventos={eventosParaPrograma()}
        numeros={numeros}
        declaracoes={declaracoesDaIntegracao(numeros)}
        chaves={[{ ...CHAVE_EMITIDA_PELO_ADMIN }]}
        organizacao={ORGANIZACAO_DA_DEMONSTRACAO}
        autor={GESTOR_DA_ORGANIZACAO}
        gestorEAutorado={GESTOR_E_AUTORADO}
        dataDeReferencia={DATA_DA_MEDIDA}
      />
    </SuperficieSoWeb>
  );
}
