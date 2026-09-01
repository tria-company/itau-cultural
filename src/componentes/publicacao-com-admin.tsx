"use client";

import { useRouter } from "next/navigation";
import { ControlesDeAdmin } from "@/componentes/admin-controles";
import { usePoderDeAdmin } from "@/componentes/admin-estado";
import { PublicacaoAberta } from "@/componentes/comunidade-publicacao";
import { usePontos } from "@/contexto/pontos";

/**
 * publicacao-com-admin.tsx, a publicação pública com o que o administrador pode nela.
 *
 * A TELA É A MESMA DE TODO MUNDO. Quem não é administrador vê exatamente o que via antes:
 * este componente devolve a publicação inteira e mais nada. O poder entra por cima, numa
 * tira, e some junto com o perfil.
 *
 * MODERAR COMENTÁRIO VALE EM QUALQUER COMUNIDADE, e é a diferença entre este papel e o do
 * produtor. `publicacao-no-studio.tsx` só concede na comunidade do dono, porque produtor
 * que apaga comentário na comunidade alheia é o defeito que aquele arquivo conserta. O
 * administrador é o caso em que a resposta é sim em todas.
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

  if (poder.apagado(id)) {
    return (
      <div className="adm-apagado" data-publicacao-apagada={id}>
        <p>Esta publicação foi apagada pela administração.</p>
        <button type="button" className="adm-botao" onClick={() => router.push("/comunidade/")}>
          Voltar
        </button>
      </div>
    );
  }

  return (
    <>
      <ControlesDeAdmin
        alvo={{ tipo: "publicacao", id, titulo }}
        carimbo={carimbo}
        destinos={comunidades}
        aoAgir={(acao) => {
          if (acao === "apagar") router.push("/comunidade/");
        }}
      />

      {poder.suspenso(id) && (
        <p className="adm-aviso" data-publicacao-suspensa={id}>
          Suspensa pela administração. Continua visível para você.
        </p>
      )}

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
    </>
  );
}
