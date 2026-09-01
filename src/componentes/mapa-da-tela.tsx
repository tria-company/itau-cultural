"use client";

import { useEffect, useState } from "react";
import { Mapa, type DadosDoMapa } from "@/componentes/mapa";
import { MapaSP } from "@/componentes/mapa-sp";

/**
 * mapa-da-tela.tsx, qual mapa a tela Mapa abre.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * O MAPA DE EQUIPAMENTOS PASSOU A SER O QUE ABRE. Ele foi construído para a Administração e
 * é o mais forte que o produto tem: 2.503 equipamentos em duas cores, coroplético por 10 mil
 * habitantes, camada de calor, deserto cultural medido a 20 km, linha do tempo de 2020 a
 * 2026, e a distância do cursor aos três mais próximos. Ele merece a tela que se chama Mapa.
 *
 * A LENTE DO ACERVO NÃO FOI APAGADA, e a razão é medida, não gosto. `/mapa` não é só uma
 * tela: é a LENTE que Acontece e Buscar abrem, com o recorte no fragmento
 * (`/mapa/#r=…&t=…&v=…`), e `verificar-fase3` e `verificar-fase4` afirmam essa gramática.
 * Trocar o componente e pronto derrubaria os dois portões sobre uma regressão de verdade:
 * quem clicasse em «ver no mapa» a partir de uma busca cairia num mapa que não conhece a
 * busca dela.
 *
 * ENTÃO QUEM DECIDE É A CHAMADA. Sem recorte no endereço, a tela abre o mapa de
 * equipamentos, que é o que se pede quando se abre «Mapa». Com recorte, ela abre a lente,
 * que é o que se pede quando se chega de uma busca. As duas continuam a um toque, no
 * seletor do topo.
 *
 * A ESCOLHA É LIDA DEPOIS DE MONTAR, e não no primeiro render: `window` não existe no build,
 * e ler o fragmento durante a hidratação daria duas árvores diferentes no servidor e no
 * cliente. O primeiro quadro é sempre o mapa de equipamentos; se havia recorte, a lente
 * entra no quadro seguinte.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function MapaDaTela({ dados }: { dados: DadosDoMapa }) {
  const [qual, definirQual] = useState<"equipamentos" | "acervo">("equipamentos");

  useEffect(() => {
    // O recorte da lente vive no fragmento: `#r=<recorte>&t=<termo>&v=<volta>`.
    if (/[#&]r=/.test(window.location.hash)) definirQual("acervo");
  }, []);

  return (
    <div className="mapa-da-tela" data-mapa-da-tela={qual}>
      <div className="mapa-da-tela-seletor" role="group" aria-label="Qual mapa">
        <button
          type="button"
          data-ativo={qual === "equipamentos" ? "sim" : "nao"}
          aria-pressed={qual === "equipamentos"}
          onClick={() => definirQual("equipamentos")}
        >
          Equipamentos culturais
        </button>
        <button
          type="button"
          data-ativo={qual === "acervo" ? "sim" : "nao"}
          aria-pressed={qual === "acervo"}
          onClick={() => definirQual("acervo")}
        >
          Acervo no Brasil
        </button>
      </div>

      {qual === "equipamentos" ? (
        <div className="mapa-da-tela-corpo">
          <MapaSP />
        </div>
      ) : (
        <Mapa dados={dados} />
      )}
    </div>
  );
}
