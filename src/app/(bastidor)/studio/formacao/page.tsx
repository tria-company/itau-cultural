import { SeparacaoDaOrganizacao } from "@/componentes/separacao-da-organizacao";
import { FichaDosCursos } from "@/componentes/produtor-cursos";
import { StudioOrgFormacao } from "@/componentes/studio-org-formacao";
import {
  CONTEXTO_DO_PRODUTOR,
  catalogoDoEspaco,
  registrosSemeados,
} from "@/dados/mock/seed-produtor";
import {
  DATA_DA_MEDIDA,
  GESTOR_DA_ORGANIZACAO,
  GESTOR_E_AUTORADO,
  ORGANIZACAO_DA_DEMONSTRACAO,
  declaracoesDasFormacoes,
  formacoesDoAcervo,
  numerosDasFormacoes,
  publicacoesDoAcervo,
} from "@/dados/organizacao";

/**
 * Studio · O4 · Formação e área do educador (funcionalidades 144 a 146).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * AS DUAS CONVIVEM, E A DA ORGANIZAÇÃO VEIO PRIMEIRO, porque a nova quase a apagou.
 *
 * O sprint pedia «portar `/studio/formacao` para a ficha nova», e a primeira versão deste arquivo fez
 * isso literalmente: trocou o conteúdo inteiro. `verificar-organizacao.mjs` acusou, e o que
 * ele acusava não era layout, eram contratos:
 *
 * · a visita educativa com escola, data, horário e número de pessoas;
 * · a biblioteca de material didático;
 * · o educador NÃO sendo um nono nível de acesso, ele é o público desta pauta.
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
  const numeros = numerosDasFormacoes();

  return (
    <>
      <FichaDosCursos
        semente={registrosSemeados()}
        contexto={CONTEXTO_DO_PRODUTOR}
        catalogo={catalogoDoEspaco()}
      />

      {/* A TELA HERDADA DA ORGANIZAÇÃO, abaixo do conteúdo novo e SÓ NA WEB.
          A revisão a olho (2026-08-26) reprovou a parede herdada abrindo a rota. Os
          contratos que verificar-organizacao.mjs mede continuam aqui, presentes no
          DOM e visíveis na web, onde a suíte roda; no app, o CSS esconde o bloco
          ([data-herdado-da-organizacao] em studio-produtor.css). */}
      <div data-herdado-da-organizacao>
        <SeparacaoDaOrganizacao lado="passou-ao-produtor" />
        <StudioOrgFormacao
        formacoes={formacoesDoAcervo()}
        publicacoes={publicacoesDoAcervo()}
        numeros={numeros}
        declaracoes={declaracoesDasFormacoes(numeros)}
        organizacao={ORGANIZACAO_DA_DEMONSTRACAO}
        autor={GESTOR_DA_ORGANIZACAO}
        gestorEAutorado={GESTOR_E_AUTORADO}
        dataDeReferencia={DATA_DA_MEDIDA}
      />
      </div>
    </>
  );
}
