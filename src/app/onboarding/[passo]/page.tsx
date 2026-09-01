import Link from "next/link";
import { EsqueletoLista, TelaEsqueleto } from "@/componentes/esqueleto";
import { OnboardingDisposicao } from "@/componentes/onboarding-disposicao";
import { OnboardingLinguagens } from "@/componentes/onboarding-linguagens";
import { OnboardingRodape } from "@/componentes/onboarding-rodape";
import { OnboardingSementes } from "@/componentes/onboarding-sementes";
import { cidadesComAcervo } from "@/dados/cidade";
import { catalogoDeSementes } from "@/dados/sementes";

/**
 * Onboarding em CINCO passos: disposição, linguagens, artistas, obras e o passo de
 * contexto (território + acessibilidade).
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * O QUE MUDOU COM A S8, e por quê.
 *
 * Eram três passos — disposição, território, acessibilidade — e só o primeiro era Camada
 * 1. Os passos de semeadura entraram no meio; território e acessibilidade continuam
 * FUNDIDOS num passo só, que fecha a sequência. Os dois são Camada 3, os dois são
 * contexto e não gosto, e nenhum é pré-requisito de nada (D-19).
 *
 * ARTISTAS E OBRAS SÃO DUAS TELAS, e a de obras não se recorta pela de artistas: o acervo
 * não tem nenhuma aresta ligando pessoa a obra. O motivo medido está no cabeçalho de
 * `onboarding-sementes.tsx`.
 *
 * NENHUM PASSO É PORTEIRO. «Pular» existe nos quatro e leva direto a Descobrir, que
 * funciona sem semente nenhuma e diz na tela que está mostrando o feed base. É a mesma
 * regra de sempre — Camada 3 nunca bloqueia Camada 1 — estendida ao onboarding inteiro,
 * inclusive aos passos que são Camada 1.
 *
 * COMPONENTE DE SERVIDOR. `catalogoDeSementes()` roda no BUILD e alcança o grafo; o que
 * atravessa a fronteira são as listas já recortadas — 33 linguagens com contagem, 194
 * rostos e 676 entradas de busca. Os 23 MB do acervo ficam do lado de lá (DP-F).
 */

const CATALOGO = catalogoDeSementes();

const PASSOS = {
  "1": {
    titulo: "Onboarding 1 — disposição",
    camada: "C1" as const,
    blocos: [] as string[],
  },
  "2": {
    titulo: "Onboarding 2 — linguagens",
    camada: "C1" as const,
    blocos: [] as string[],
  },
  "3": {
    titulo: "Onboarding 3 — artistas",
    camada: "C1" as const,
    blocos: [] as string[],
  },
  "4": {
    titulo: "Onboarding 4 — obras",
    camada: "C1" as const,
    blocos: [] as string[],
  },
  "5": {
    titulo: "Onboarding 5 — território e acessibilidade",
    camada: "C3" as const,
    blocos: [
      "cidade atual, com correção manual",
      "raio de deslocamento em tempo — até 30 min",
      "estou de viagem · destino e período",
      "as 8 dimensões de acessibilidade que o CMS já modela",
    ],
  },
};

/** Exatamente cinco passos. Sob `output: "export"` esta lista é a rota (D-24). */
export function generateStaticParams() {
  return Object.keys(PASSOS).map((passo) => ({ passo }));
}

const PROXIMO: Record<string, string> = {
  "1": "/onboarding/2/",
  "2": "/onboarding/3/",
  "3": "/onboarding/4/",
  "4": "/onboarding/5/",
  "5": "/descobrir/",
};

/* A grade de cada passo de semeadura, recortada por classe no BUILD. Artistas e obras são
 * telas independentes — ver o cabeçalho deste arquivo. */
const ARTISTAS = {
  grade: CATALOGO.grade.filter((r) => r.classe === "pessoa"),
  busca: CATALOGO.busca.filter((r) => r.classe === "pessoa"),
};
const OBRAS = {
  grade: CATALOGO.grade.filter((r) => r.classe === "obra"),
  busca: CATALOGO.busca.filter((r) => r.classe === "obra"),
};

export default async function Onboarding({ params }: { params: Promise<{ passo: string }> }) {
  const { passo } = await params;
  const conteudo = PASSOS[passo as keyof typeof PASSOS] ?? PASSOS["1"];
  const proximo = PROXIMO[passo] ?? "/descobrir/";
  const total = Object.keys(PASSOS).length;

  return (
    <TelaEsqueleto
      nome={conteudo.titulo}
      rodape={
        /* NO FIM DA TELA, e não no cabeçalho: «Avançar» acima da grade seria o botão de
           confirmar aparecendo antes daquilo que ele confirma. Os dois continuam
           presentes em TODOS os passos e os dois marcam que a pessoa foi perguntada. */
        <OnboardingRodape
          proximo={proximo}
          rotuloAvancar={passo === String(total) ? "Ver o meu Descobrir" : "Avançar"}
        />
      }
    >
      {/* Era um `EsqueletoBloco` — um retângulo cinza rotulado, que é o vocabulário de uma
          tela que ainda não existe. Nestes passos a tela já existe, e o placeholder
          passava a anunciar ausência em cima de conteúdo. Sobrou a informação, que é real. */}
      <p className="onb-passos">
        passo {passo} de {total}
      </p>

      {passo === "1" ? <OnboardingDisposicao /> : null}
      {passo === "2" ? <OnboardingLinguagens linguagens={CATALOGO.linguagens} /> : null}
      {passo === "3" ? (
        <OnboardingSementes
          grade={ARTISTAS.grade}
          busca={ARTISTAS.busca}
          pergunta="Quais artistas já te interessam?"
          rotuloDaBusca="Procurar artista pelo nome"
        />
      ) : null}
      {passo === "4" ? (
        <OnboardingSementes
          grade={OBRAS.grade}
          busca={OBRAS.busca}
          pergunta="E quais obras te param?"
          rotuloDaBusca="Procurar obra pelo título"
        />
      ) : null}

      {passo === "5" ? (
        <>
          <EsqueletoLista rotulos={conteudo.blocos} />

          {/* PORTAS REAIS dentro do esqueleto: o que já existe no produto entra como
              caminho de verdade; o esqueleto rotulado segue marcando o que falta. */}
          <section className="flex flex-col gap-2">
            <p className="text-sm font-semibold">Estou de viagem</p>
            <div className="flex flex-wrap gap-2">
              {cidadesComAcervo().map((c) => (
                <Link
                  key={c.slug}
                  href={`/cidade/${c.slug}/`}
                  className="rounded-full border border-borda-forte px-3 py-1 text-xs font-semibold no-underline"
                >
                  {c.titulo}
                </Link>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <Link
              href="/filtros/"
              className="w-fit rounded-full bg-acao px-4 py-2 text-sm font-semibold text-sobre-acao no-underline transition-opacity hover:opacity-90"
            >
              Acessibilidade
            </Link>
          </section>
        </>
      ) : null}
    </TelaEsqueleto>
  );
}
