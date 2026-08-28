import { SuperficieSoWeb } from "@/componentes/superficie-so-web";
import { SeparacaoDaOrganizacao } from "@/componentes/separacao-da-organizacao";
import { StudioOrgFormacao } from "@/componentes/studio-org-formacao";
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
 * Studio · Organização · Cursos.
 *
 * A PAREDE MORA AQUI AGORA, e não mais empilhada embaixo da ficha do Produtor.
 *
 * Até 2026-08-27 esta tela era o segundo andar de `/studio/formacao/`: quem abria a pauta
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
  const numeros = numerosDasFormacoes();

  return (
    <SuperficieSoWeb>
      <SeparacaoDaOrganizacao
        lado="passou-ao-produtor"
        rotaNova="/studio/formacao/"
        rotuloDaRotaNova="Abrir Cursos no Studio"
      />
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
    </SuperficieSoWeb>
  );
}
