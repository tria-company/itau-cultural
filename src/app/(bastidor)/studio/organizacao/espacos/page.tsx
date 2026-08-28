import { SuperficieSoWeb } from "@/componentes/superficie-so-web";
import { SeparacaoDaOrganizacao } from "@/componentes/separacao-da-organizacao";
import { StudioOrgEspacos } from "@/componentes/studio-org-espacos";
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
 * Studio · Organização · Espaços.
 *
 * A PAREDE MORA AQUI AGORA, e não mais empilhada embaixo da ficha do Produtor.
 *
 * Até 2026-08-27 esta tela era o segundo andar de `/studio/espacos/`: quem abria a pauta
 * para publicar recebia primeiro o painel do Produtor e, logo abaixo, a tela inteira da
 * Organização, com banner, kicker de nível 6, dez abas e parágrafos de declaração.
 * Medido na véspera: a parede ocupava de 58% a 73% da altura da página, e a revisão a
 * olho a reprovou nas quatro pautas.
 *
 * O QUE ELA PROVA CONTINUA SENDO PROVADO, e por isso ela não foi escondida com
 * `display: none`: portão verde medindo tela invisível é o pior defeito da casa. Ela
 * mudou de ENDEREÇO, continua visível, alcançável pelo grupo Gerenciar da lateral, e
 * `verificar-organizacao.mjs` a mede aqui.
 *
 * SÓ NA WEB (D-67): ninguém resolve uma fila institucional em 390px.
 *
 * PÁGINA DE SERVIDOR: os módulos de dado são chamados aqui, por valor, no build, e o que
 * atravessa para os componentes de cliente são DTOs de primitivo (DP-F).
 */
export default function Pagina() {
  const numeros = numerosDosEspacos();

  return (
    <SuperficieSoWeb>
      <SeparacaoDaOrganizacao
        lado="passou-ao-produtor"
        rotaNova="/studio/espacos/"
        rotuloDaRotaNova="Abrir Espaços no Studio"
      />
      <StudioOrgEspacos
        espacos={espacosDoAcervo()}
        numeros={numeros}
        declaracoes={declaracoesDosEspacos(numeros)}
        organizacao={ORGANIZACAO_DA_DEMONSTRACAO}
        autor={GESTOR_DA_ORGANIZACAO}
        gestorEAutorado={GESTOR_E_AUTORADO}
        dataDeReferencia={DATA_DA_MEDIDA}
      />
    </SuperficieSoWeb>
  );
}
