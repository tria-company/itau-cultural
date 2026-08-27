import { GestaoDeSessoes } from "@/componentes/produtor-sessoes";
import { StudioOcorrencias } from "@/componentes/studio-ocorrencias";
import { CONTEXTO_DO_PRODUTOR, registrosSemeados } from "@/dados/mock/seed-produtor";
import {
  CARIMBO_DA_ALTERACAO,
  EVENTO_PADRAO_DO_STUDIO,
  FRASE_DAS_DUAS_METADES,
  FRASE_DE_D73,
  OPERADOR_DO_STUDIO,
  OPERADOR_E_AUTORADO,
  PREFIXO_DA_OCORRENCIA,
  declaracoesDoQueNaoSustenta,
  eventosDoStudio,
  historicoAutorado,
  horariosPropostos,
  numerosDoAcervo,
  parDoCenario4,
  salvamentosSemeados,
} from "@/dados/ocorrencias-studio";

/**
 * Studio · gestão de ocorrências, a tela da fase 4, MAIS a gestão do que o produtor publicou.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * AS DUAS CONVIVEM, E A PRIMEIRA VEIO PRIMEIRO, porque a segunda quase a apagou.
 *
 * O sprint pedia «portar `/studio/ocorrencias` para a gestão de sessões publicadas», e a
 * primeira versão deste arquivo fez isso literalmente: trocou o conteúdo inteiro. O portão
 * da fase 4 acusou, e o que ele acusou não foi um detalhe, era `[data-evento-imutavel]`,
 * o bloco que prova, POR AUSÊNCIA DE CONTROLES, que mexer numa sessão nunca mexe no evento.
 * Quatro asserções daquela suíte dependem dele, incluindo a que conta quantos `input`,
 * `button`, `select` e `textarea` existem dentro da ficha, e a resposta certa é zero.
 *
 * Apagar aquilo teria sido destruir a demonstração de uma decisão de ontologia para
 * acomodar uma tela nova. As duas cabem: a ficha imutável e o histórico do Cenário 4
 * continuam no topo, e a gestão do que ESTE navegador publicou entra abaixo.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PÁGINA DE SERVIDOR: os dois módulos de dado são chamados aqui, por valor, no build, e o
 * que atravessa para os dois componentes de cliente são DTOs de primitivo (DP-F).
 */
export default function PaginaStudioOcorrencias() {
  return (
    <>
      <GestaoDeSessoes semente={registrosSemeados()} contexto={CONTEXTO_DO_PRODUTOR} />

      {/* O HERDADO DA FASE 4 CONTINUA, ABAIXO E NAS DUAS VISÕES: verificar-fase4
          exige o evento imutável VISÍVEL no app e as contagens exatas no HTML
          exportado. Só a ordem mudou: o conteúdo novo abre a tela. */}
      <StudioOcorrencias
        eventos={eventosDoStudio()}
        eventoPadrao={EVENTO_PADRAO_DO_STUDIO}
        prefixo={PREFIXO_DA_OCORRENCIA}
        semeados={salvamentosSemeados()}
        historicoAutorado={historicoAutorado()}
        propostas={horariosPropostos()}
        par={parDoCenario4()}
        numeros={numerosDoAcervo()}
        declaracoes={declaracoesDoQueNaoSustenta()}
        operador={OPERADOR_DO_STUDIO}
        operadorFrase={OPERADOR_E_AUTORADO}
        carimbo={CARIMBO_DA_ALTERACAO}
        fraseDeD73={FRASE_DE_D73}
        fraseDasDuasMetades={FRASE_DAS_DUAS_METADES}
      />
    </>
  );
}
