"use client";

import Link from "next/link";
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
export function MeuFeed() {
  const { motor, hidratado } = usePontos();

  const seguidas = useMemo(
    () =>
      (hidratado ? motor.atual.assinadas : []).filter(
        (id) => comunidadePorId(id)?.donoId !== PRODUTOR_DA_CASA,
      ),
    [motor, hidratado],
  );

  const publicacoes = useMemo(
    () =>
      motor.atual.publicacoes
        .filter((p) => seguidas.includes(p.comunidadeId))
        .slice()
        .sort((a, b) => a.diasAtras - b.diasAtras),
    [motor, seguidas],
  );

  return (
    <div className="prod-corpo" data-meu-feed>
      <div className="prod-vinculo" data-resumo-do-feed>
        <span className="prod-registro-corpo">
          <strong className="prod-registro-titulo">
            {seguidas.length} {seguidas.length === 1 ? "comunidade" : "comunidades"}
          </strong>
          <span className="prod-registro-meta">
            {seguidas.slice(0, 3).map((id) => nomeDe(id)).join(" · ")}
            {seguidas.length > 3 ? ` e mais ${seguidas.length - 3}` : ""}
          </span>
        </span>
        <span className="prod-registro-acoes">
          <Link
            href="/studio/comunidade/descobrir/"
            className="pastilha"
            data-descobrir-comunidades
          >
            Descobrir ›
          </Link>
        </span>
      </div>

      <div className="flex flex-col gap-4 comunidade-coluna">
        {publicacoes.length === 0 ? (
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
