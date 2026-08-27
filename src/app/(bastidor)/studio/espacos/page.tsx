import { SeparacaoDaOrganizacao } from "@/componentes/separacao-da-organizacao";
import { FichaDoEspaco } from "@/componentes/produtor-espaco";
import { StudioOrgEspacos } from "@/componentes/studio-org-espacos";
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
  declaracoesDosEspacos,
  espacosDoAcervo,
  numerosDosEspacos,
} from "@/dados/organizacao";

/**
 * Studio · O2 · Espaços e acessibilidade (funcionalidade 142).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * AS DUAS CONVIVEM, E A DA ORGANIZAÇÃO VEIO PRIMEIRO, porque a nova quase a apagou.
 *
 * O sprint pedia «portar `/studio/espacos` para a ficha nova», e a primeira versão deste arquivo fez
 * isso literalmente: trocou o conteúdo inteiro. `verificar-organizacao.mjs` acusou, e o que
 * ele acusava não era layout, eram contratos:
 *
 * · a ficha do espaço abrindo com as 13 dimensões em «não declarado»;
 * · o ATO explícito de declarar ausência, que move as 13 para «declarado ausente»
 *   e NÃO para «não declarado», a distinção que D-43 existe para manter;
 * · o selo de procedência de saída;
 * · a coordenada trocando de MÉTODO e continuando derivada.
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
  const numeros = numerosDosEspacos();

  return (
    <>
      <FichaDoEspaco
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
        <StudioOrgEspacos
        espacos={espacosDoAcervo()}
        numeros={numeros}
        declaracoes={declaracoesDosEspacos(numeros)}
        organizacao={ORGANIZACAO_DA_DEMONSTRACAO}
        autor={GESTOR_DA_ORGANIZACAO}
        gestorEAutorado={GESTOR_E_AUTORADO}
        dataDeReferencia={DATA_DA_MEDIDA}
      />
      </div>
    </>
  );
}
