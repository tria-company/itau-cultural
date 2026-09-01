import type { Metadata } from "next";
import Link from "next/link";
import { CapaDeCartao } from "@/componentes/capa-sem-imagem";
import { Grafismo } from "@/componentes/grafismo";
import { BlocoPonte } from "@/componentes/ponte";
import { SelosDeLinguagem } from "@/componentes/selo-linguagem";
import { Verbete } from "@/componentes/verbete";
import { porSlug, slugsPorTipo } from "@/dados/grafo";
import { vinculosDe } from "@/dados/ponte";
import { limitarSlugs } from "@/dados/limite-paginas";

/**
 * Verbete de termo da Enciclopédia — etiqueta de museu, não matéria.
 * A entrada mora aqui; a URL da Enciclopédia vira crédito, não destino.
 */

export function generateStaticParams() {
  const slugs = slugsPorTipo("termo");
  const cortados = limitarSlugs(slugs);
  return (cortados.length ? cortados : ["sem-entidade"]).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entidade = porSlug("termo", slug);
  return { title: `${entidade?.titulo ?? "Verbete"} — Itaú Cultural` };
}

export default async function PaginaVerbete({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entidade = porSlug("termo", slug);

  if (!entidade) {
    return (
      <div className="flex flex-col gap-5 p-5 desk:p-8">
        <h1 className="text-2xl font-bold">Verbete não encontrado</h1>
        <p className="text-sm text-tinta-2">
          Nenhuma entrada do acervo responde por «{slug}».
        </p>
      </div>
    );
  }

  const grupos = vinculosDe(entidade.id);

  return (
    <article className="verbete-pagina" data-verbete-pagina={entidade.slug}>
      <header className="verbete-pagina-abertura">
        <p className="tipo-micro">
          <Grafismo variacao="barra" className="h-[0.8em] w-auto" />
          Verbete
        </p>
        <div className="verbete-pagina-identidade">
          <CapaDeCartao
            titulo={entidade.titulo}
            classe={entidade.classe}
            linguagens={entidade.linguagens}
            imagem={entidade.imagem}
            creditoImagem={entidade.creditoImagem}
            className="verbete-pagina-capa"
          />
          <div>
            <h1 className="tipo-titulo-1">{entidade.titulo}</h1>
            {entidade.linguagens.length ? <SelosDeLinguagem ids={entidade.linguagens} /> : null}
          </div>
        </div>
      </header>

      <Verbete entidade={entidade} />

      {grupos.map((g) => (
        <BlocoPonte key={g.chave} grupo={g} />
      ))}

      <p className="tipo-legenda">
        <Link href="/descobrir/" className="underline decoration-borda-forte underline-offset-4">
          ← voltar a descobrir
        </Link>
      </p>
    </article>
  );
}
