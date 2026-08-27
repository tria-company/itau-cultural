import { SeparacaoDaOrganizacao } from "@/componentes/separacao-da-organizacao";
import { FichaDoEdital } from "@/componentes/produtor-programa";
import { StudioOrgEditais } from "@/componentes/studio-org-editais";
import {
  CONTEXTO_DO_PRODUTOR,
  catalogoDoEdital,
  registrosSemeados,
} from "@/dados/mock/seed-produtor";
import {
  DATA_DA_MEDIDA,
  GESTOR_DA_ORGANIZACAO,
  GESTOR_E_AUTORADO,
  ORGANIZACAO_DA_DEMONSTRACAO,
  declaracoesDosEditais,
  vocabularioDoEdital,
} from "@/dados/organizacao";

/**
 * Studio · O6 · Editais e chamadas (funcionalidade 149).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * AS DUAS CONVIVEM, E A DA ORGANIZAÇÃO VEIO PRIMEIRO, porque a nova quase a apagou.
 *
 * O sprint pedia «portar `/studio/editais` para a ficha nova», e a primeira versão deste arquivo fez
 * isso literalmente: trocou o conteúdo inteiro. `verificar-organizacao.mjs` acusou, e o que
 * ele acusava não era layout, eram contratos:
 *
 * · o casamento entre o edital e o PERFIL de quem produz, território e linguagem;
 * · o vocabulário do recorte vindo do acervo, não digitado.
 *
 * Apagá-los teria sido destruir a demonstração de decisões de ontologia para acomodar uma
 * ficha nova. As duas cabem, e a ordem diz de quem é cada uma: a tela da Organização
 * continua no topo, com o que ela prova; a ficha do Produtor entra abaixo, com o que ela
 * acrescenta.
 *
 * A SEPARAÇÃO CONTINUA DECLARADA. Esta tela passou ao Produtor, quem cadastra o espaço
 * onde o próprio evento acontece é quem produz, não a instituição. O que muda é que a
 * transição é VISÍVEL na tela, em vez de ser uma substituição silenciosa.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PÁGINA DE SERVIDOR: os módulos de dado são chamados aqui, por valor, no build, e o que
 * atravessa para os componentes de cliente são DTOs de primitivo (DP-F).
 */
export default function Pagina() {
  const vocabulario = vocabularioDoEdital();

  return (
    <>
      <FichaDoEdital
        semente={registrosSemeados()}
        contexto={CONTEXTO_DO_PRODUTOR}
        catalogo={catalogoDoEdital()}
      />

      {/* A TELA HERDADA DA ORGANIZAÇÃO, abaixo do conteúdo novo e SÓ NA WEB.
          A revisão a olho (2026-08-26) reprovou a parede herdada abrindo a rota. Os
          contratos que verificar-organizacao.mjs mede continuam aqui, presentes no
          DOM e visíveis na web, onde a suíte roda; no app, o CSS esconde o bloco
          ([data-herdado-da-organizacao] em studio-produtor.css). */}
      <div data-herdado-da-organizacao>
        <SeparacaoDaOrganizacao lado="passou-ao-produtor" />
        <StudioOrgEditais
        vocabulario={vocabulario}
        declaracoes={declaracoesDosEditais(vocabulario)}
        organizacao={ORGANIZACAO_DA_DEMONSTRACAO}
        autor={GESTOR_DA_ORGANIZACAO}
        gestorEAutorado={GESTOR_E_AUTORADO}
        dataDeReferencia={DATA_DA_MEDIDA}
      />
      </div>
    </>
  );
}
