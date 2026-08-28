import { FichaDaMidia } from "@/componentes/produtor-midia";
import {
  CONTEXTO_DO_PRODUTOR,
  catalogoComum,
  registrosSemeados,
} from "@/dados/mock/seed-produtor";
import { numerosDasMidias } from "@/dados/organizacao";

/**
 * Studio · Mídia, a pauta do Produtor (funcionalidades 147 e 148).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A PAREDE DA ORGANIZAÇÃO SAIU DAQUI em 2026-08-27, e foi para `/studio/organizacao/midia/`.
 *
 * Até então esta rota entregava duas telas empilhadas, e a de baixo ocupava 73% da altura
 * da página: banner, kicker de nível 6, dez abas, a fila do crédito com 529 linhas e
 * quatro parágrafos de declaração. Quem abria «Mídia» para subir um ativo recebia junto a
 * auditoria do acervo inteiro.
 *
 * NADA DO QUE ELA PROVAVA FOI PERDIDO: os contratos continuam medidos na rota própria,
 * numa tela visível. Esconder e continuar medindo por `querySelector` seria portão verde
 * sobre tela invisível.
 *
 * O QUE FICOU: os denominadores do acervo, que são o que esta pauta sustenta. Eles
 * atravessam como PRIMITIVOS, e é isso que mantém DP-F de pé.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PÁGINA DE SERVIDOR: os módulos de dado são chamados aqui, por valor, no build.
 */
export default function Pagina() {
  const n = numerosDasMidias();
  const libras = n.porDimensao.find((d) => /libras/i.test(d.rotulo))?.quantos ?? 0;

  return (
    <FichaDaMidia
      semente={registrosSemeados()}
      contexto={CONTEXTO_DO_PRODUTOR}
      catalogo={catalogoComum()}
      acervo={{
        total: n.total,
        comCredito: n.comCredito,
        semCredito: n.semCredito,
        comImagemAlt: n.comImagemAlt,
        comLibras: libras,
        declaramAcessibilidade: n.declaramAcessibilidade,
        dimensoesEmZero: n.porDimensao.filter((d) => d.quantos === 0).length,
        porCategoria: n.porCategoria.map((c) => ({
          categoria: c.categoria,
          quantos: c.quantos,
        })),
      }}
    />
  );
}
