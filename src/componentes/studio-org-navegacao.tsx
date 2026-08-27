import { TELAS_DA_ORGANIZACAO } from "@/dados/tipos-organizacao";

/**
 * studio-org-navegacao.tsx, a navegação das dez telas da Organização.
 *
 * ELA MORA NO CABEÇALHO DE CADA TELA, e não na raiz do Studio, porque a raiz é da S7 ·
 * Produtor: as duas sessões dividem `(bastidor)/studio/` e nenhuma edita arquivo da outra.
 * É o mesmo desenho que a Redação e o Observatório adotaram quando viraram superfícies de
 * várias telas, sem ele, nove das dez só existiriam para quem digita a URL, e quem digita
 * URL ao vivo, na frente de uma banca, erra.
 *
 * A TELA QUE AINDA NÃO EXISTE APARECE, DESABILITADA. É a diferença entre uma superfície que
 * mostra o próprio tamanho e uma que esconde o que falta: quem avalia vê que são dez e vê
 * quais já respondem. Link para rota inexistente daria 404 no meio da demonstração, que é
 * pior do que o item apagado, quem clicou já perdeu o lugar.
 *
 * A TELA ATIVA CONTINUA SENDO UM LINK, com `aria-current="page"`. Virar texto morto
 * economizaria um clique inútil e custaria a única forma de recarregar a tela em que se
 * está, e, no artefato estático, recarregar é o gesto que desfaz qualquer estado de
 * cliente que tenha ficado estranho.
 *
 * SEM `"use client"` E SEM ESTADO: ele é montado dentro das telas, que são de cliente, e
 * por isso viaja no mesmo pacote delas. O que ele NÃO arrasta junto é dado: a lista é
 * constante de módulo em `tipos-organizacao.ts`, que não importa nada de `@/dados/grafo`.
 * É essa disciplina, e não a diretiva, que mantém os 9,4 MB do outro lado da fronteira.
 */
export function StudioOrgNavegacao({ ativa }: { ativa: string }) {
  return (
    <nav className="org-telas" aria-label="as dez telas da Organização">
      {TELAS_DA_ORGANIZACAO.map((t) =>
        t.pronta ? (
          <a
            key={t.id}
            href={t.rota}
            className="org-tela"
            data-ativa={t.id === ativa ? "sim" : "nao"}
            aria-current={t.id === ativa ? "page" : undefined}
            title={t.objetivo}
          >
            {t.rotulo}
          </a>
        ) : (
          <span
            key={t.id}
            className="org-tela"
            data-pronta="nao"
            title={`${t.objetivo}, ainda não construída`}
          >
            {t.rotulo}
          </span>
        ),
      )}
    </nav>
  );
}
