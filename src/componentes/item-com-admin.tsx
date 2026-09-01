"use client";

import { useRouter } from "next/navigation";
import { ControlesDeAdmin } from "@/componentes/admin-controles";
import { usePoderDeAdmin, type Alvo } from "@/componentes/admin-estado";
import { ROTULO_DO_ALVO } from "@/dados/admin-acoes";

/**
 * item-com-admin.tsx, qualquer coisa do aplicativo com o poder do administrador em cima.
 *
 * UMA PEÇA SÓ PARA TODAS AS SUPERFÍCIES. Publicação, comunidade, evento e pessoa recebem o
 * mesmo tratamento: a tira em cima, o aviso quando está suspenso, e a tela de apagado no
 * lugar do conteúdo. Um invólucro por superfície faria quatro cópias da mesma regra, e elas
 * divergiriam na primeira mudança.
 *
 * PARA QUEM NÃO É ADMINISTRADOR ELE É TRANSPARENTE: devolve as crianças e mais nada. A
 * página é idêntica à de antes, e o HTML estático não muda.
 */
export function ItemComAdmin({
  alvo,
  carimbo,
  destinos = [],
  /** Para onde voltar depois de apagar. */
  volta,
  children,
}: {
  alvo: Alvo;
  carimbo: string;
  destinos?: readonly { id: string; nome: string }[];
  volta: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const poder = usePoderDeAdmin(carimbo);

  if (!poder.ehAdmin) return <>{children}</>;

  if (poder.apagado(alvo.id)) {
    return (
      <div className="adm-apagado" data-item-apagado={alvo.id}>
        <p>Esta {ROTULO_DO_ALVO[alvo.tipo]} foi apagada pela administração.</p>
        <button type="button" className="adm-botao" onClick={() => router.push(volta)}>
          Voltar
        </button>
      </div>
    );
  }

  return (
    <>
      <ControlesDeAdmin
        alvo={alvo}
        carimbo={carimbo}
        destinos={destinos}
        aoAgir={(acao) => {
          if (acao === "apagar") router.push(volta);
        }}
      />

      {poder.suspenso(alvo.id) && (
        <p className="adm-aviso" data-item-suspenso={alvo.id}>
          Suspensa pela administração. Continua visível para você.
        </p>
      )}

      {children}
    </>
  );
}
