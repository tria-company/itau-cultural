"use client";

import { SeloDeNivel } from "@/componentes/selo-nivel";
import { usePontos } from "@/contexto/pontos";

/**
 * selo-do-perfil.tsx — o selo do nível grudado no ícone de perfil.
 *
 * ELE NÃO PINTA ANTES DA HIDRATAÇÃO. O nível sai do estado guardado no
 * aparelho, e sob export estático o HTML vem do build: desenhar um selo de
 * nível 1 no servidor faria toda pessoa ver o degrau errado por um quadro,
 * inclusive quem está no 17. A mesma regra que o contador de saldos segue.
 */
export function SeloDoPerfil() {
  const { motor, hidratado } = usePontos();
  if (!hidratado) return null;

  const nivel = motor.nivel();

  return (
    <span className="selo-no-perfil" title={`Nível ${nivel.numero} · ${nivel.nome}`}>
      <SeloDeNivel nivel={nivel.numero} porte="pequeno" />
      <span className="sr-only">
        Nível {nivel.numero}, {nivel.nome}
      </span>
    </span>
  );
}
