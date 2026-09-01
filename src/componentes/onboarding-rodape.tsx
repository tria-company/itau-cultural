"use client";

import Link from "next/link";
import { useSessao } from "@/contexto/sessao";

/**
 * onboarding-rodape.tsx — as duas saídas de cada passo, e o registro de que a pessoa
 * passou por aqui.
 *
 * POR QUE PULAR TAMBÉM MARCA. «Semeado» não quer dizer «escolheu alguma coisa», quer
 * dizer «foi perguntada». Quem pulou respondeu — respondeu que não quer responder — e
 * mandá-la de volta para a mesma tela na próxima visita seria transformar a saída num
 * adiamento. É por isso que `semeado` é estado separado de `sementes.length > 0`.
 *
 * É componente de cliente por causa disso: a página é de servidor e não tem como gravar
 * nada. O que ela passa são dois destinos; o que este arquivo acrescenta é o registro.
 */
export function OnboardingRodape({
  proximo,
  rotuloAvancar,
}: {
  proximo: string;
  rotuloAvancar: string;
}) {
  const { marcarSemeado } = useSessao();

  return (
    <>
      <Link href={proximo} className="onb-avancar no-underline" onClick={marcarSemeado}>
        {rotuloAvancar}
      </Link>
      <Link href="/descobrir/" className="onb-pular no-underline" onClick={marcarSemeado}>
        Pular
      </Link>
    </>
  );
}
