import { CapaDeCartao } from "@/componentes/capa-sem-imagem";
import { Grafismo } from "@/componentes/grafismo";
import { BlocoPonte } from "@/componentes/ponte";
import { SelosDeLinguagem } from "@/componentes/selo-linguagem";
import { Verbete } from "@/componentes/verbete";
import { porSlug, slugsPorTipo } from "@/dados/grafo";
import { vinculosDe } from "@/dados/ponte";
import { limitarSlugs } from "@/dados/limite-paginas";

/**
 * Página da obra — tela 15, entregue na reformulação de 2026-08 (Parte 6 do
 * feedback do cliente). O MOLDE É O DA PÁGINA DO ARTISTA: identidade + selos +
 * verbete embutido + os vínculos como arestas nomeadas do grafo, cada grupo com a
 * contagem à vista.
 *
 * O QUE O GRAFO NÃO SUSTENTA FICA DECLARADO: medido, não existe nenhuma aresta
 * ligando obra a pessoa — autoria não é dado do acervo exportado, e a página diz
 * isso em vez de inferir do título ou esconder o bloco.
 */

/** Reserva para classe vazia — mesmo contrato da página do artista. */
export function generateStaticParams() {
  const slugs = slugsPorTipo("obra");
  const cortados = limitarSlugs(slugs);
  return (cortados.length ? cortados : ["sem-entidade"]).map((slug) => ({ slug }));
}

function Cabecalho({ nome, objetivo }: { nome: string; objetivo: string }) {
  return (
    <header className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
        <h1 className="text-2xl leading-tight font-bold desk:text-3xl">{nome}</h1>
      </div>
      <p className="max-w-prose text-sm text-tinta-2">{objetivo}</p>
    </header>
  );
}

export default async function PaginaObra({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entidade = porSlug("obra", slug);

  if (!entidade) {
    return (
      <div className="flex flex-col gap-5 p-5 desk:p-8">
        <Cabecalho
          nome="Página da obra"
          objetivo="A rota existe e responde; nenhuma obra do acervo corresponde a este endereço."
        />
      </div>
    );
  }

  const grupos = vinculosDe(entidade.id);

  return (
    <div className="flex flex-col gap-6 p-5 desk:p-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <CapaDeCartao
            titulo={entidade.titulo}
            classe={entidade.classe}
            linguagens={entidade.linguagens}
            imagem={entidade.imagem}
            creditoImagem={entidade.creditoImagem}
            className="h-28 w-24 shrink-0 rounded-xl"
          />
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="text-2xl leading-tight font-bold">{entidade.titulo}</h1>
            {entidade.resumo ? (
              <p className="max-w-prose text-sm leading-snug text-tinta-2">{entidade.resumo}</p>
            ) : null}
            <p className="text-[0.65rem] tracking-widest text-tinta-3 uppercase">
              {entidade.classe} · procedência {entidade.procedencia}
            </p>
          </div>
        </div>

        {entidade.linguagens.length ? (
          <SelosDeLinguagem ids={entidade.linguagens} />
        ) : (
          <p className="text-xs text-tinta-3">
            Nenhuma linguagem artística declarada para esta obra no acervo.
          </p>
        )}
      </header>

      {/* O verbete, embutido, com crédito e link de procedência (D-39). */}
      <Verbete entidade={entidade} />

      {/* OS VÍNCULOS, grupo a grupo, como o grafo os declara — cada um com contagem. */}
      {grupos.length ? (
        grupos.map((grupo) => <BlocoPonte key={grupo.chave} grupo={grupo} />)
      ) : (
        <p className="text-sm leading-snug text-tinta-2" data-vinculos="0">
          O acervo não declara nenhum vínculo partindo desta obra — nem evento que a
          apresente, nem conteúdo que fale dela.
        </p>
      )}

      {/* A AUSÊNCIA QUE DEFINE A CLASSE, declarada como produto: autoria. */}
      <section className="rounded-g border border-borda bg-superficie-2 p-4">
        <h2 className="tipo-detalhe font-bold">Autoria</h2>
        <p className="max-w-prose text-sm leading-snug text-tinta-2">
          O acervo não liga nenhuma obra a uma pessoa: não existe aresta de autoria, e por
          isso esta página não atribui a obra a ninguém.
        </p>
      </section>

    </div>
  );
}
