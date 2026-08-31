"use client";

import { useMemo } from "react";
import { Cartao, nomeDe } from "@/componentes/comunidade";
import { Painel } from "@/componentes/pontos-base";
import { usePontos } from "@/contexto/pontos";
import { PRODUTOR_DA_CASA, comunidadePorId } from "@/dados/comunidade";

/**
 * comunidade-meu-feed.tsx — o feed de quem segue, com tudo misturado.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * O CONTRATO DE QUALQUER REDE (pedido de 29/08/2026): você segue, e o que essas
 * comunidades publicam chega num feed só, do mais novo para o mais velho. Sem seguir
 * nenhuma, a aba abre na galeria; seguindo uma que seja, abre aqui.
 *
 * O AUTOR DO POST JÁ DIZ DE ONDE ELE VEIO. Nas publicações do acervo o `autorId` é o id da
 * própria comunidade, então o cartão que o feed de uma comunidade desenha serve igual aqui:
 * ele assina «Brô MC's · há 3d» sozinho. Repetir a origem numa etiqueta seria dizer duas
 * vezes a mesma coisa no mesmo cartão.
 *
 * A ORDEM É `diasAtras`, que é o carimbo que as publicações têm. Não há relógio: o que o
 * produtor publica nasce com zero e sobe para o topo, e o resto do acervo mantém a distância
 * que declarou. Ordenar por outra coisa exigiria inventar data.
 *
 * AS DELE NÃO ENTRAM. Ele não «segue» a própria comunidade: ela é a bancada dele, e mora em
 * `/studio/minhas-comunidades/`. Misturar o que ele escreve com o que ele lê é o que este
 * refinamento inteiro veio desfazer.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function MeuFeed({ filtro = [] }: { filtro?: readonly string[] }) {
  const { motor, hidratado } = usePontos();

  const seguidas = useMemo(
    () =>
      (hidratado ? motor.atual.assinadas : []).filter(
        (id) => comunidadePorId(id)?.donoId !== PRODUTOR_DA_CASA,
      ),
    [motor, hidratado],
  );

  /**
   * NADA MARCADO QUER DIZER TODAS, e não nenhuma. Filtro que começa vazio e esconde tudo é
   * uma tela quebrada no primeiro toque, e obriga a pessoa a marcar tudo só para voltar ao
   * estado em que ela já estava.
   */
  const visiveis = filtro.length === 0 ? seguidas : seguidas.filter((id) => filtro.includes(id));

  const publicacoes = useMemo(
    () =>
      motor.atual.publicacoes
        .filter((p) => visiveis.includes(p.comunidadeId))
        .slice()
        .sort((a, b) => a.diasAtras - b.diasAtras),
    [motor, visiveis],
  );

  return (
    <div data-meu-feed>
      <div className="prod-vinculo" data-resumo-do-feed>
        <span className="prod-registro-corpo">
          <strong className="prod-registro-titulo">
            {publicacoes.length} {publicacoes.length === 1 ? "publicação" : "publicações"}
          </strong>
          <span className="prod-registro-meta">
            {visiveis.slice(0, 3).map((id) => nomeDe(id)).join(" · ")}
            {visiveis.length > 3 ? ` e mais ${visiveis.length - 3}` : ""}
            {filtro.length > 0 ? " · filtrado" : ""}
          </span>
        </span>
      </div>

      <div className="flex flex-col gap-4 comunidade-coluna">
        {seguidas.length === 0 ? (
          <Painel titulo="Você ainda não segue nenhuma">
            Abra Explorar aqui em cima, ou veja as comunidades uma a uma em Descobrir. O que
            você seguir passa a chegar neste feed.
          </Painel>
        ) : publicacoes.length === 0 ? (
          <Painel titulo="Ainda sem publicações">
            As comunidades que você segue ainda não publicaram nada.
          </Painel>
        ) : (
          publicacoes.map((p) => <Cartao key={p.id} publicacao={p} />)
        )}
      </div>
    </div>
  );
}
