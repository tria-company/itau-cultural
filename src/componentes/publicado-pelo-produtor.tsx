"use client";

import { useEffect, useState } from "react";
import { Cartao } from "@/componentes/cartao";
import { cartaoDoRegistro } from "@/componentes/base/previa";
import { CHAVE_DO_PRODUTOR } from "@/dados/tipos-produtor";
import type { Pauta, Registro } from "@/dados/tipos-produtor";

/**
 * publicado-pelo-produtor.tsx, o que ESTE navegador publicou, na tela pública.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUE ELE EXISTE, E POR QUE ELE DECLARA O QUE É.
 *
 * O protótipo é um artefato estático: `/acontece` é um HTML gerado no build a partir das
 * 2.425 ocorrências do grafo, e não existe servidor para receber uma publicação. Quando o
 * produtor publica no Studio, o registro vai para o `localStorage`, e é lá, e só lá, que
 * ele existe.
 *
 * A ALTERNATIVA SERIA A JORNADA TERMINAR NO VAZIO. O produtor preenche oito atos, aperta
 * publicar, abre `/acontece` e não vê nada: a demonstração inteira do perfil se desfaz no
 * último passo. Este bloco é o que fecha o ciclo.
 *
 * ELE NÃO SE DISFARÇA DE ACERVO. A seção tem título próprio, fica ACIMA do conteúdo do
 * build e declara, em texto, que aquilo está gravado neste navegador e some ao limpar o
 * armazenamento. Misturar os registros do produtor com os 300 do acervo faria a tela
 * afirmar um número que o acervo não sustenta, que é a contradição mais cara que este
 * produto poderia mostrar.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * MÓDULO DE CLIENTE, LEITURA SÓ EM `useEffect`. Sob `output: "export"` o HTML é gerado no
 * build; ler `localStorage` no render faria o HTML exportado e a página hidratada
 * divergirem, o defeito exato que a casa já corrigiu duas vezes.
 *
 * ELE NÃO USA `useProdutor`. O gancho hidrata a loja e precisa da semente, que só o
 * servidor tem; aqui basta LER. Uma segunda hidratação disputando com a do Studio faria as
 * duas escreverem por cima uma da outra.
 */

/** O que a tela pública mostra: só o que está `publicado` e `publico`. */
function publicadosDe(pauta: Pauta, cru: unknown): Registro[] {
  if (typeof cru !== "object" || cru === null) return [];
  const o = cru as Record<string, unknown>;
  if (!Array.isArray(o.registros)) return [];
  return (o.registros as Registro[]).filter(
    (r) =>
      r &&
      typeof r === "object" &&
      r.pauta === pauta &&
      r.situacao === "publicado" &&
      // AGENDADO NÃO APARECE, e privado também não. O eixo da visibilidade existe
      // justamente para isso: um registro pode estar publicado e ainda não ser público.
      r.visibilidade === "publico",
  );
}

export function PublicadoPeloProdutor({
  pauta,
  titulo,
}: {
  pauta: Pauta;
  /** O título da seção. Cada vitrine nomeia a própria. */
  titulo: string;
}) {
  const [registros, setRegistros] = useState<Registro[]>([]);

  useEffect(() => {
    let cru: string | null = null;
    try {
      cru = window.localStorage.getItem(CHAVE_DO_PRODUTOR);
    } catch {
      // Armazenamento bloqueado (modo privado, iframe): a seção simplesmente não aparece.
      return;
    }
    if (cru === null) return;
    try {
      setRegistros(publicadosDe(pauta, JSON.parse(cru)));
    } catch {
      // Conteúdo ilegível: não é problema desta tela resolver, e o Studio já avisa.
    }
  }, [pauta]);

  if (registros.length === 0) return null;

  return (
    <section className="prod-publicado" data-publicado-pelo-produtor={pauta}>
      <div className="prod-publicado-cabeca">
        <h2 className="prod-publicado-titulo">{titulo}</h2>
        <p className="prod-publicado-nota">
          {registros.length}{" "}
          {registros.length === 1 ? "registro publicado" : "registros publicados"} pelo Studio
          neste navegador. <strong>Não está no acervo</strong>, o protótipo é um artefato
          estático e não tem servidor para receber publicação. Limpar o armazenamento ou
          reiniciar a demonstração faz esta seção desaparecer.
        </p>
      </div>
      <ul className="prod-publicado-lista">
        {registros.map((r) => (
          <li key={r.id}>
            {/* O COMPONENTE PÚBLICO DE VERDADE, o mesmo que o resto da tela monta,
                sem a promessa de navegação que ele não pode cumprir: este registro não
                tem página no build, e o prefetch do link dispararia 404 sozinho. */}
            <Cartao cartao={cartaoDoRegistro(r)} naoNavegavel />
          </li>
        ))}
      </ul>
    </section>
  );
}
