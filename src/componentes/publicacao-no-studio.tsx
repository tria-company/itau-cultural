"use client";

import { useRouter } from "next/navigation";
import { PublicacaoAberta } from "@/componentes/comunidade-publicacao";
import { PREFIXO_DA_PUBLICACAO } from "@/dados/comunidade-capas";
import { usePontos } from "@/contexto/pontos";

/**
 * publicacao-no-studio.tsx — a publicação aberta com o que o dono pode fazer nela.
 *
 * MESMO ARRANJO DO FEED: a tela portada não sabe o que é gestão, e recebe por prop o que
 * pode fazer. Aqui são duas coisas — moderar comentário e apagar o post — e a segunda só
 * chega quando a publicação nasceu no Studio.
 *
 * APAGAR LEVA DE VOLTA AO FEED, porque a tela que ficaria aberta seria a de uma
 * publicação que não existe mais, e ela diria isso numa frase seca. Voltar é o que a
 * pessoa faria em seguida de qualquer jeito.
 */
export function PublicacaoNoStudio({ id }: { id: string }) {
  const router = useRouter();
  const { motor, hidratado } = usePontos();

  const minha = hidratado && id.startsWith(PREFIXO_DA_PUBLICACAO);

  return (
    <PublicacaoAberta
      id={id}
      podeModerar
      aoApagarPost={
        minha
          ? () => {
              motor.emitir("comunidade.publicacao.retirada", { tipo: "publicacao", id });
              router.push("/studio/comunidade/");
            }
          : undefined
      }
    />
  );
}
