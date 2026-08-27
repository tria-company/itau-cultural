import { StudioDuplicatas } from "@/componentes/studio-duplicatas";
import { DATA_DE_REFERENCIA } from "@/dados/alerta";
import {
  COMPONENTES_DO_CRITERIO,
  CRITERIO_DE_IDENTIDADE,
  FRASE_DE_D72,
  GRUPO_DO_TRACADOR,
  declaracaoDoQueNaoSustenta,
  filaDeDuplicatas,
  numerosDaDeduplicacao,
  parQueOHumanoSepara,
} from "@/dados/duplicatas";

/**
 * Studio, resolução de duplicatas (tela 31, STUD-01). **Cenário 3 do RFP.**
 *
 * Página de SERVIDOR. Ela é quem chama `@/dados/duplicatas` por valor, no build, e passa
 * adiante DTOs só de primitivo. O componente de cliente recebe os DTOs e importa o módulo
 * apenas por tipo, é essa fronteira, e só ela, que impede 23 MB de grafo de atravessar
 * para o navegador (DP-F).
 *
 * A FILA INTEIRA VAI JUNTO, e é decisão e não descuido. São 84 grupos já achatados em
 * registro de comparação, título, chave, procedência, contagem de ocorrências, período e
 * variação, e nenhuma `Entidade` inteira. É esse achatamento que permite trocar de grupo
 * sem navegar: uma rota por grupo geraria 84 páginas e faria quem opera perder o lugar na
 * fila a cada clique.
 *
 * O texto do critério, a declaração do que o acervo não sustenta e a frase de D-72 vêm do
 * MÓDULO, e não escritos no componente: eles citam números medidos sobre o dado, e um
 * literal digitado na tela faria a apresentação afirmar, na primeira regeração do grafo,
 * número que o acervo não sustenta.
 *
 * O CARIMBO DA DECISÃO VEM DAQUI, e não do navegador. `DATA_DE_REFERENCIA` é a data
 * contra a qual o grafo foi medido, fixada em `alerta.ts` e citada na fonte em vez de
 * copiada: ler o relógio do runtime no cliente faria o HTML exportado e a página hidratada
 * divergirem, e ainda exporia o fuso horário de quem avalia a proposta.
 *
 * Sob `output: "export"` (D-24) isto roda uma vez, na geração do artefato estático.
 */
export default function PaginaStudioDuplicatas() {
  return (
    <StudioDuplicatas
      fila={filaDeDuplicatas()}
      grupoInicial={GRUPO_DO_TRACADOR}
      criterio={CRITERIO_DE_IDENTIDADE}
      componentes={COMPONENTES_DO_CRITERIO}
      naoSustenta={declaracaoDoQueNaoSustenta()}
      numeros={numerosDaDeduplicacao()}
      parSeparado={parQueOHumanoSepara()}
      fraseDeD72={FRASE_DE_D72}
      dataDeReferencia={DATA_DE_REFERENCIA}
    />
  );
}
