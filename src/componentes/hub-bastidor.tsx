"use client";

import Link from "next/link";
import { DESCRICAO_DO_PAPEL, usePapel } from "@/contexto/papel";
import { ATALHOS_BASTIDOR } from "@/dados/apps";

/**
 * hub-bastidor.tsx, a seção «Bastidor» do hub, recortada pelo papel escolhido.
 *
 * POR QUE ELE É CLIENTE E `hub-apps.tsx` NÃO É. O papel mora no navegador, e o hub é
 * componente de servidor que renderiza 34 cartazes lidos do acervo. Marcar o arquivo
 * inteiro com `"use client"` para filtrar quatro links empurraria toda a prateleira de
 * capas para a fronteira de hidratação. A seção sai, o resto fica.
 *
 * ANTES DE HIDRATAR, NADA APARECE. O HTML do build não sabe qual papel o navegador
 * guardou; renderizar a lista cheia para depois encolhê-la faria o hub piscar superfícies
 * que aquele perfil não usa. Para o público, o padrão, a seção não existe, e é assim que
 * deve ser: quem entra sem escolher perfil vê o produto e mais nada.
 *
 * A DIVERGÊNCIA POR VISÃO CONTINUA EM CSS. `hidden desk:block` marca o item cuja rota se
 * declara superfície de desktop. O Studio não é um deles desde o perfil Produtor.
 */
export function HubBastidor() {
  const { papel, hidratado } = usePapel();
  if (!hidratado) return null;

  const superficies = DESCRICAO_DO_PAPEL[papel].superficies;
  const meus = ATALHOS_BASTIDOR.filter((a) => superficies.includes(a.superficie));
  if (meus.length === 0) return null;

  return (
    <section className="hub-grupo" data-hub-bastidor>
      <h2 className="tipo-titulo-3 font-bold">Bastidor</h2>
      <ul className="hub-atalhos">
        {meus.map((atalho) => (
          <li key={atalho.href} className={atalho.soWeb ? "hidden desk:block" : undefined}>
            <Link href={atalho.href} className="hub-atalho">
              <span className="hub-atalho-rotulo tipo-detalhe">{atalho.rotulo}</span>
              <span className="hub-atalho-descricao tipo-legenda">{atalho.descricao}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
