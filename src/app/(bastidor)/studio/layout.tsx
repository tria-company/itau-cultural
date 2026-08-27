import { ProdutorNavegacao } from "@/componentes/produtor-navegacao";
import { PAUTAS_COM_FICHA } from "@/dados/produtor-rotas";

/**
 * Layout do Studio, a superfície do perfil Produtor.
 *
 * ELE NÃO ESCONDE NADA NA VISÃO APP, e essa é a inversão de D-67. Até 2026-08 o Studio
 * declarava-se «superfície de desktop» e sumia no telefone junto com as outras cinco
 * superfícies de bastidor. Isso estava certo enquanto o Studio era resolução de duplicatas
 * e gestão de ocorrências, mesa de trabalho densa. Deixou de estar quando ele virou a
 * ferramenta de quem alimenta o produto: um produtor cultural brasileiro publica do
 * telefone, e uma ferramenta de publicação que só existe no computador não é usada.
 *
 * A INVERSÃO É SÓ DAQUI. Moderação, Redação, Observatório, Administração e o roteiro
 * continuam web-only, cada uma com o próprio layout montando `SuperficieSoWeb`. Nenhum
 * portão foi afrouxado: os dois que afirmavam «conteúdo de bastidor invisível no app»
 * foram REESCRITOS para afirmar a regra nova, Moderação escondida, Studio visível, com a
 * mesma sonda.
 *
 * A NAVEGAÇÃO MORA AQUI, e não em cada tela. As dezoito telas que já existiam tinham
 * navegação para metade delas; o trilho no layout é o que faz as onze pautas se alcançarem
 * entre si sem que nenhuma delas precise saber das outras dez.
 *
 * COMPONENTE DE SERVIDOR. A lista de pautas prontas é constante de módulo em
 * `produtor-rotas.ts`, que não importa nada de `@/dados/grafo`, é essa disciplina, e não
 * a diretiva, que mantém os 9,4 MB do outro lado da fronteira (DP-F).
 */
export default function LayoutDoStudio({ children }: { children: React.ReactNode }) {
  return (
    <div className="prod-tela" data-superficie="studio">
      <ProdutorNavegacao prontas={PAUTAS_COM_FICHA} />
      {/* O INVÓLUCRO EXISTE POR CAUSA DA GRADE DA WEB, e a razão é mecânica.
          Na visão web `.prod-tela` é uma grade de duas colunas com o trilho à esquerda. Sem
          o invólucro, cada filho da página vira um item da grade e o trilho ocupa só a
          PRIMEIRA linha, e como onze pastilhas empilhadas são mais altas que um título de
          duas linhas, aquela linha crescia até a altura do trilho e abria um vazio de
          quinhentos pixels entre o cabeçalho e o conteúdo. `grid-row: 1 / -1` não resolve:
          `-1` aponta para o fim da grade EXPLÍCITA, e aqui todas as linhas são implícitas.
          Com o invólucro a grade tem uma linha só, e o trilho ocupa a coluna inteira por
          construção. A captura de tela pegou; nenhum número teria pego. */}
      <div className="prod-conteudo">{children}</div>
    </div>
  );
}
