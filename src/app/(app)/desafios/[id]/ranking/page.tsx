import Link from "next/link";
import { Grafismo } from "@/componentes/grafismo";
import { MissaoRanking } from "@/componentes/missao-ranking";
import { MISSOES } from "@/dados/pontos";

/**
 * `/desafios/[id]/ranking` — o placar isolado da missão.
 *
 * SÓ AS MISSÕES COM PLACAR viram rota. Gerar a página para as trinta faria vinte
 * e oito telas que só sabem dizer «esta missão não tem ranking» — e um link no
 * detalhe que leva a isso é pior que link nenhum.
 */
export function generateStaticParams() {
  return MISSOES.filter((m) => m.ranking).map((m) => ({ id: m.id }));
}

export default async function PaginaRanking({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const missao = MISSOES.find((m) => m.id === id);

  return (
    <div className="flex flex-col gap-5 p-5 desk:p-8">
      <header className="flex flex-col gap-2">
        <Link href={`/desafios/${id}/`} className="tipo-legenda text-tinta-2 no-underline">
          ← {missao ? missao.titulo : "Desafios"}
        </Link>
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">Ranking da missão</h1>
        </div>
      </header>

      {missao?.ranking ? (
        <MissaoRanking missaoId={missao.id} />
      ) : (
        <p className="tipo-detalhe text-tinta-2">
          Esta missão não tem placar. <Link href="/desafios/">Voltar aos desafios</Link>.
        </p>
      )}
    </div>
  );
}
