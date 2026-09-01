import type { Metadata } from "next";
import Link from "next/link";
import { Grafismo } from "@/componentes/grafismo";
import { RepertorioDoPerfil } from "@/componentes/repertorio-do-perfil";
import { TelaRepertorio } from "@/componentes/repertorio";
import { PERSONAS } from "@/dados/personas";
import { indiceDeSalvaveis, repertorioDe, type RepertorioDaPersona } from "@/dados/repertorio";
import { catalogoDeSementes, precomputoDeSementes } from "@/dados/sementes";

export const metadata: Metadata = { title: "Mapa de repertório — Itaú Cultural" };

/**
 * `/meu/repertorio` — o MAPA DE REPERTÓRIO como tela própria (tela 22, Parte 6
 * do feedback do cliente): as linguagens atravessadas com peso e as adjacentes a
 * um passo, por persona. O conteúdo é a `TelaRepertorio` que morava dentro de
 * /meu — o perfil virou hub e o mapa ganhou endereço. COMPONENTE DE SERVIDOR:
 * a travessia roda no build (DP-F), as três personas já prontas (D-45).
 */
const repertorios: Record<string, RepertorioDaPersona> = Object.fromEntries(
  PERSONAS.map((persona) => [persona.id, repertorioDe(persona.id)]),
);

const indice = indiceDeSalvaveis();

/* A ampliação do perfil PRÓPRIO. `repertorioDe` sabe medir as três personas e mais
 * ninguém; a métrica de impacto do RFP não pode ficar presa a perfis fictícios. O cálculo
 * do perfil roda no cliente, sobre as linguagens pré-computadas por semente. */
const SEMENTES = precomputoDeSementes();
const LINGUAGENS = catalogoDeSementes().linguagens;

export default function MapaDeRepertorio() {
  return (
    <div className="flex flex-col gap-5 p-5 desk:p-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">Mapa de repertório</h1>
        </div>
        <Link
          href="/meu/"
          className="w-fit rounded-full border border-borda-forte px-3 py-1 text-xs font-bold no-underline"
        >
          ← Meu perfil
        </Link>
      </header>

      <RepertorioDoPerfil precomputo={SEMENTES} linguagens={LINGUAGENS} />

      <TelaRepertorio repertorios={repertorios} indice={indice} />
    </div>
  );
}
