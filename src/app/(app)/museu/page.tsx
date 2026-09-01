import type { Metadata } from "next";
import { Museu } from "@/componentes/museu";
import { MuseuReentrada } from "@/componentes/museu-reentrada";
import { catalogoDeSementes } from "@/dados/sementes";

export const metadata: Metadata = { title: "Museu — Itaú Cultural" };

/**
 * Museu virtual — o hub museal. O recorte (5 eventos únicos, 22 espaços, 4
 * visitas) é medido em `museu.ts` no build; este arquivo só despacha. COMPONENTE
 * DE SERVIDOR (DP-F): `Museu` também é de servidor e é ele que toca o módulo
 * de dados. O clone de «Filmes e vídeos de artistas» fica de fora da vitrine.
 */
/* As obras oferecíveis como semente, já sem as que não alcançam nada no grafo. É a mesma
 * lista do passo 3 do onboarding, recortada na classe — ver `museu-reentrada.tsx` para
 * por que o Museu reentra no passo 3 em vez de ganhar uma pergunta própria. */
const OBRAS = catalogoDeSementes().grade.filter((r) => r.classe === "obra");

export default function PaginaMuseu() {
  return (
    <>
      <MuseuReentrada obras={OBRAS} />
      <Museu />
    </>
  );
}
