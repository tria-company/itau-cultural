import { FichaDosCursos } from "@/componentes/produtor-cursos";
import {
  CONTEXTO_DO_PRODUTOR,
  catalogoDoEspaco,
  registrosSemeados,
} from "@/dados/mock/seed-produtor";

/**
 * Studio · Cursos, a pauta do Produtor (funcionalidades 144 a 146).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A PAREDE DA ORGANIZAÇÃO SAIU DAQUI em 2026-08-27, e foi para
 * `/studio/organizacao/formacao/`.
 *
 * Esta é a quinta das telas híbridas, e a única fora do pedido: as quatro nomeadas foram
 * programa, espaços, editais e mídia. Ela veio junto por necessidade, e não por escolha.
 * A barra de dez abas da Organização liga uma tela à outra; deixar quatro no endereço novo
 * e esta no antigo teria quebrado a navegação da superfície inteira.
 *
 * NADA DO QUE ELA PROVAVA FOI PERDIDO: a visita educativa com escola, data, horário e
 * número de pessoas, a biblioteca de material didático e o educador como PÚBLICO desta
 * pauta (e não como um nono nível de acesso) continuam medidos, na rota própria.
 *
 * DIFERENÇA PARA AS QUATRO IRMÃS: elas ganharam painel de acervo (`acervo` → `panorama`);
 * esta só perdeu a parede. Cursos tem vitrine pública e registros publicados, então o trio
 * genérico do painel já responde «quantos no ar, quanta audiência, quantos em edição», que
 * é a pergunta certa aqui. Por isso não há chamada a `@/dados/organizacao` nesta página:
 * a que existia alimentava a parede, e saiu com ela.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PÁGINA DE SERVIDOR: os módulos de dado são chamados aqui, por valor, no build.
 */
export default function Pagina() {
  return (
    <FichaDosCursos
      semente={registrosSemeados()}
      contexto={CONTEXTO_DO_PRODUTOR}
      catalogo={catalogoDoEspaco()}
    />
  );
}
