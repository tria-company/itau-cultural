import type { Metadata } from "next";
import { ExposicaoPermanenteFicha } from "@/componentes/exposicao-permanente";
import { ItemComAdmin } from "@/componentes/item-com-admin";
import { DATA_DE_REFERENCIA } from "@/dados/alerta";
import { EXPOSICOES_PERMANENTES, exposicaoPorSlug } from "@/dados/exposicoes-permanentes";
import { relacionadosDaExposicao } from "@/dados/museu";

export function generateStaticParams() {
  return EXPOSICOES_PERMANENTES.map((expo) => ({ slug: expo.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const expo = exposicaoPorSlug(slug);
  return { title: `${expo?.titulo ?? "Exposição"} — Itaú Cultural` };
}

export default async function PaginaDaExposicao({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const expo = exposicaoPorSlug(slug);

  if (!expo) {
    return (
      <main className="flex flex-col gap-2 p-4">
        <h1 className="text-lg font-bold">Exposição não encontrada</h1>
        <p className="text-sm">
          Nenhuma exposição permanente responde por «{slug}».{" "}
          <a href="/museu/" className="underline underline-offset-4">
            Voltar ao museu
          </a>
          .
        </p>
      </main>
    );
  }

  return (
    <ItemComAdmin
      alvo={{ tipo: "item", id: `expo:${expo.slug}`, titulo: expo.titulo }}
      carimbo={DATA_DE_REFERENCIA}
      volta="/museu/"
      edicao={{ pauta: "museu", rota: `/museu/${expo.slug}/` }}
    >
      <ExposicaoPermanenteFicha expo={expo} relacionados={relacionadosDaExposicao(expo.slug)} />
    </ItemComAdmin>
  );
}
