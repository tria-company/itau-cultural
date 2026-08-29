"use client";

import { ComunidadesParaLer } from "@/componentes/comunidades-para-ler";
import { MeuFeed } from "@/componentes/comunidade-meu-feed";
import { usePontos } from "@/contexto/pontos";
import { PRODUTOR_DA_CASA, comunidadePorId } from "@/dados/comunidade";

/**
 * aba-comunidade.tsx — quem decide o que a aba mostra.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DUAS TELAS NUM ENDEREÇO SÓ, e a escolha é do estado da pessoa (pedido de 29/08/2026):
 * sem seguir ninguém, a aba é a galeria, porque não há feed que fazer; seguindo uma que
 * seja, ela é o feed próprio, com o que essas comunidades publicaram, misturado.
 *
 * É o contrato de qualquer rede, e é o que faz o botão «Seguir» valer alguma coisa: antes
 * dele o gesto existia e não mudava nada na tela seguinte.
 *
 * A GALERIA NÃO SOME quando o feed aparece: ela ganha endereço próprio, em
 * `/studio/comunidade/descobrir/`, e o feed leva até ela. Sem isso, seguir a primeira
 * comunidade trancaria a porta de encontrar a segunda.
 *
 * QUEM DECIDE É O CLIENTE, porque quem sabe é o `localStorage`. No servidor não há
 * assinatura, e o HTML do build sai com a galeria: é o que uma pessoa que chega sem estado
 * vê, e é o que a hidratação confirma para ela.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function AbaComunidade() {
  const { motor, hidratado } = usePontos();

  const segueAlguma =
    hidratado &&
    motor.atual.assinadas.some((id) => comunidadePorId(id)?.donoId !== PRODUTOR_DA_CASA);

  return segueAlguma ? <MeuFeed /> : <ComunidadesParaLer />;
}
