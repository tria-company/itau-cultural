import { CascaDoAdmin } from "@/componentes/admin-casca";
import { NavegacaoPrincipal } from "@/componentes/navegacao-principal";

/**
 * Layout de `/admin/*`.
 *
 * A ADMINISTRACAO GANHOU A NAVEGACAO DA PLATAFORMA, e essa e a correcao principal desta
 * rodada. O grupo `(bastidor)` nao monta navegacao nenhuma: o Studio resolve com coluna
 * propria e as outras superficies sao mesa de trabalho fechada. O Admin nascia orfao,
 * sem trilho lateral e sem barra inferior, e quem chegava nele so saia pela URL.
 *
 * A REGRA E A MESMA DO APP porque o Admin E o app: `NavegacaoPrincipal` escolhe entre o
 * trilho lateral da web e a barra inferior do telefone, identica a que todo mundo usa.
 * Por cima dela vem `CascaDoAdmin`, o trilho das oito listas.
 *
 * ELE NAO E `SuperficieSoWeb`. A administracao abre no telefone desde a rodada do mobile,
 * e `medidas.mjs` declara `/admin` como `visivel-no-app`. Envolver aqui contradiria o
 * portao.
 */
export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col desk:flex-row">
      <NavegacaoPrincipal />
      <CascaDoAdmin>{children}</CascaDoAdmin>
    </div>
  );
}
