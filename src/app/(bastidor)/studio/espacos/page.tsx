import { FichaDoEspaco } from "@/componentes/produtor-espaco";
import {
  CONTEXTO_DO_PRODUTOR,
  catalogoDoEspaco,
  registrosSemeados,
} from "@/dados/mock/seed-produtor";
import { numerosDosEspacos } from "@/dados/organizacao";

/**
 * Studio · Espaços, a pauta do Produtor (funcionalidade 142).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A PAREDE DA ORGANIZAÇÃO SAIU DAQUI em 2026-08-27, e foi para `/studio/organizacao/espacos/`.
 *
 * Até então esta rota entregava duas telas empilhadas: o painel do Produtor no topo e,
 * logo abaixo, a tela inteira da Organização, com banner, kicker de nível 6, dez abas e
 * parágrafos de declaração. Medido na véspera, a parede ocupava 72% da altura da página.
 * Quem abria «Espaços» para cadastrar um lugar recebia junto a prestação de contas
 * institucional do acervo.
 *
 * NADA DO QUE ELA PROVAVA FOI PERDIDO. Os contratos continuam sendo medidos, na rota
 * própria, numa tela que uma pessoa consegue ver: esconder com `display: none` e manter o
 * portão medindo por `querySelector` seria portão verde sobre tela invisível, que é o pior
 * defeito registrado nesta casa.
 *
 * O QUE FICOU: os números do acervo, que são o que esta pauta tem de verdade a mostrar.
 * Espaço não tem vitrine nem audiência, então o trio genérico do painel abria zerado. Eles
 * atravessam como PRIMITIVOS, e é isso que mantém DP-F de pé.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PÁGINA DE SERVIDOR: os módulos de dado são chamados aqui, por valor, no build.
 */
export default function Pagina() {
  const n = numerosDosEspacos();

  return (
    <FichaDoEspaco
      semente={registrosSemeados()}
      contexto={CONTEXTO_DO_PRODUTOR}
      catalogo={catalogoDoEspaco()}
      acervo={{
        total: n.total,
        declaramAcessibilidade: n.declaramAcessibilidade,
        comCoordenada: n.comCoordenada,
        ocorrencias: n.ocorrencias,
        ocorrenciasComEspaco: n.ocorrenciasComEspaco,
        porMetodo: n.porMetodo.map((m) => ({ metodo: m.metodo, quantos: m.quantos })),
      }}
    />
  );
}
