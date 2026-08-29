"use client";

import { useRouter } from "next/navigation";
import { PublicacaoAberta } from "@/componentes/comunidade-publicacao";
import { ehMinha } from "@/dados/comunidade";
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

  // TODA PUBLICAÇÃO DE UMA COMUNIDADE DELE, e não só as criadas nesta sessão: ver a nota
  // gêmea em comunidade-em-gestao.tsx. A pergunta é ao dado desde 29/08/2026 — `ehMinha`
  // lê `donoId` —, e não mais à constante `COMUNIDADE_OFICIAL`, que só sabia de uma.
  const publicacao = hidratado
    ? motor.atual.publicacoes.find((p) => p.id === id)
    : undefined;
  const minha = publicacao !== undefined && ehMinha(publicacao.comunidadeId);

  return (
    <PublicacaoAberta
      id={id}
      // MODERAR COMENTÁRIO SÓ NO QUE É DELE. Até 29/08/2026 esta prop chegava sempre
      // `true`, nas 142 páginas de publicação: quem lê uma comunidade de fora ganhava o
      // botão de apagar comentário de gente real, e o botão funcionava.
      podeModerar={minha}
      aoApagarPost={
        minha
          ? () => {
              motor.emitir("comunidade.publicacao.retirada", { tipo: "publicacao", id });
              router.push(`/studio/minhas-comunidades/${publicacao.comunidadeId}/`);
            }
          : undefined
      }
    />
  );
}
