"use client";

import { useRouter } from "next/navigation";
import { usePoderDeAdmin } from "@/componentes/admin-estado";
import { PublicacaoAberta } from "@/componentes/comunidade-publicacao";
import { ItemComAdmin } from "@/componentes/item-com-admin";
import { usePontos } from "@/contexto/pontos";

/**
 * publicacao-com-admin.tsx, a publicação pública com o que o administrador pode nela.
 *
 * A TIRA, O AVISO DE SUSPENSA E A TELA DE APAGADA vêm de `ItemComAdmin`, que é a mesma peça
 * de comunidade e evento. O que sobra aqui é o que só a publicação tem: moderar comentário.
 *
 * MODERAR COMENTÁRIO VALE EM QUALQUER COMUNIDADE, e é a diferença entre este papel e o do
 * produtor. `publicacao-no-studio.tsx` só concede na comunidade do dono, porque produtor
 * que apaga comentário alheio é o defeito que aquele arquivo conserta. O administrador é o
 * caso em que a resposta é sim em todas.
 */
export function PublicacaoComAdmin({
  id,
  titulo,
  comunidades,
  carimbo,
}: {
  id: string;
  titulo: string;
  /** Para onde a publicação pode ser movida. */
  comunidades: readonly { id: string; nome: string }[];
  carimbo: string;
}) {
  const router = useRouter();
  const poder = usePoderDeAdmin(carimbo);
  const { motor } = usePontos();

  return (
    <ItemComAdmin
      alvo={{ tipo: "publicacao", id, titulo }}
      carimbo={carimbo}
      destinos={comunidades}
      volta="/comunidade/"
    >
      <PublicacaoAberta
        id={id}
        podeModerar={poder.ehAdmin}
        aoApagarPost={
          poder.ehAdmin
            ? () => {
                motor.emitir("comunidade.publicacao.retirada", { tipo: "publicacao", id });
                router.push("/comunidade/");
              }
            : undefined
        }
      />
    </ItemComAdmin>
  );
}
