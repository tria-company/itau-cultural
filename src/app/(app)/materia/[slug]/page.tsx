import type { Metadata } from "next";
import { Materia } from "@/componentes/materia";
import { materiaPorSlug, slugsDeMateria } from "@/dados/materias";
import { limitarSlugs } from "@/dados/limite-paginas";

export function generateStaticParams() {
  const slugs = slugsDeMateria();
  const cortados = limitarSlugs(slugs);
  return (cortados.length ? cortados : ["sem-entidade"]).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const materia = materiaPorSlug(slug);
  return { title: `${materia?.titulo ?? "Matéria"} — Itaú Cultural` };
}

export default async function PaginaMateria({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const materia = materiaPorSlug(slug);

  if (!materia) {
    return (
      <main className="flex flex-col gap-2 p-4">
        <h1 className="text-lg font-bold">Texto não encontrado</h1>
        <p className="text-sm">
          Nenhuma matéria do acervo responde por «{slug}».{" "}
          <a href="/noticias/" className="underline underline-offset-4">
            Voltar às notícias
          </a>
          .
        </p>
      </main>
    );
  }

  return <Materia materia={materia} />;
}
