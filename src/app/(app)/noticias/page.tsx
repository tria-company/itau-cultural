import type { Metadata } from "next";
import { NoticiasHub } from "@/componentes/noticias";
import { PreferenciaFaixa } from "@/componentes/preferencia-faixa";
import { temasDeLeitura } from "@/dados/sementes";

export const metadata: Metadata = { title: "Notícias — Itaú Cultural" };

/**
 * Notícias — a capa editorial. A página só despacha: o recorte e o desenho
 * moram em `noticias.tsx`, que é servidor e alcança `leituras.ts` (DP-F).
 */
const TEMAS = temasDeLeitura();

export default function Noticias() {
  return (
    <>
      <PreferenciaFaixa
        app="noticias"
        pergunta="Sobre o que você quer ler?"
        opcoes={TEMAS}
      />
      <NoticiasHub />
    </>
  );
}
