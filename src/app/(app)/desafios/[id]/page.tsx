import Link from "next/link";
import { Grafismo } from "@/componentes/grafismo";
import { MissaoDetalhe } from "@/componentes/missao-detalhe";
import { MISSOES } from "@/dados/pontos";

/**
 * `/desafios/[id]` — a tela da missão.
 *
 * ELA NÃO EXISTIA, e a falta dela era o buraco do módulo: o hub listava missões
 * com um botão «Fazer» que mandava a pessoa para outra parte do app, então não
 * havia lugar nenhum para as regras de aceite, o histórico de envios, o placar e
 * a própria porta de enviar prova. Missão de prova sem tela própria é missão que
 * não dá para cumprir.
 *
 * Sob `output: "export"` (D-24) rota dinâmica sem `generateStaticParams` não é
 * exportada. Aqui o catálogo é literal, então a lista sai completa do build — não
 * há parâmetro de reserva a inventar.
 */
export function generateStaticParams() {
  return MISSOES.map((m) => ({ id: m.id }));
}

export default async function PaginaMissao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const missao = MISSOES.find((m) => m.id === id);

  return (
    <div className="flex flex-col gap-5 p-5 desk:p-8">
      <header className="flex flex-col gap-2">
        <Link href="/desafios/" className="tipo-legenda text-tinta-2 no-underline">
          ← Desafios
        </Link>
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">
            {missao ? missao.titulo : "Missão não encontrada"}
          </h1>
        </div>
      </header>

      {missao ? (
        <MissaoDetalhe missaoId={missao.id} />
      ) : (
        // Slug inexistente é estado vazio, nunca exceção: sob export estático uma
        // exceção aqui derrubaria o build inteiro por causa de um id.
        <p className="tipo-detalhe text-tinta-2">
          Esta missão não está mais no catálogo.{" "}
          <Link href="/desafios/">Ver as que estão abertas</Link>.
        </p>
      )}
    </div>
  );
}
