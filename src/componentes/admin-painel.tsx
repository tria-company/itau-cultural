"use client";

import Link from "next/link";
import { usePoderDeAdmin } from "@/componentes/admin-estado";
import { BarrasDoAdmin, MedidorDoAdmin, RoscaDoAdmin } from "@/componentes/admin-graficos";
import { ROTULO_DA_ACAO, ROTULO_DO_ALVO } from "@/dados/admin-acoes";
import type { DescricaoDaCoisa, PainelDaPlataforma } from "@/dados/admin-area";

/**
 * admin-painel.tsx, como a plataforma esta e onde ela chega.
 *
 * A TELA TEM QUATRO FAIXAS, e a ordem e a da pergunta: quanta coisa existe, de que ela e
 * feita, ate onde ela chega, e o que fazer com ela. Antes era uma pilha de cartoes de
 * tamanhos diferentes sem essa ordem, e ler exigia adivinhar o que era resumo e o que era
 * detalhe.
 *
 * TODO NUMERO COM DENOMINADOR quando ele e parte de um todo. As seis caixas de cima sao
 * contagem pura; o que e parte de um todo desceu para os medidores, onde o denominador
 * cabe embaixo em vez de quebrar a linha do titulo.
 *
 * O MAPA E O DIAGNOSTICO, e nao enfeite: 312 dos 645 municipios de Sao Paulo nao tem
 * nenhum equipamento cultural mapeado, quase metade do estado. Ele chega pronto do
 * servidor e ocupa a faixa inteira, porque a leitura dele depende do tamanho.
 */
export function AdminPainel({
  painel,
  area,
  carimbo,
}: {
  painel: PainelDaPlataforma;
  area: DescricaoDaCoisa[];
  carimbo: string;
}) {
  const poder = usePoderDeAdmin(carimbo);

  if (!poder.pronto) return null;

  if (!poder.ehAdmin) {
    return (
      <p className="adm-aviso" data-nao-e-admin>
        Esta área é da administração. Troque o perfil em <Link href="/meu/">Meu</Link>.
      </p>
    );
  }

  const totalDaProcedencia = painel.procedencia.reduce((a, f) => a + f.valor, 0);

  return (
    <div className="adm-painel" data-admin-painel>
      {/* 1. Quanta coisa existe. */}
      <ul className="adm-numeros" data-numeros={painel.numeros.length}>
        {painel.numeros.map((n) => (
          <li key={n.id} className="adm-numero" data-numero={n.id}>
            <span className="adm-numero-valor">{n.valor}</span>
            <span className="adm-numero-rotulo">{n.rotulo}</span>
          </li>
        ))}
      </ul>

      {/* 2. De que ela é feita. */}
      <div className="adm-cartoes">
        <section className="adm-cartao" data-cartao="procedencia">
          <h2 className="adm-titulo">De onde veio o acervo</h2>
          <RoscaDoAdmin
            fatias={painel.procedencia}
            centro={totalDaProcedencia.toLocaleString("pt-BR")}
            rotuloDoCentro="entidades"
          />
        </section>

        <section className="adm-cartao" data-cartao="classes">
          <h2 className="adm-titulo">O que o acervo tem mais</h2>
          <BarrasDoAdmin barras={painel.porClasse} />
        </section>

        <section className="adm-cartao" data-cartao="cobertura">
          <h2 className="adm-titulo">Cobertura</h2>
          <div className="adm-medidores">
            {painel.cobertura.map((m) => (
              <MedidorDoAdmin key={m.id} medida={m} />
            ))}
          </div>
        </section>
      </div>

      {/* 4. O que fazer com ela. */}
      <section className="adm-secao" data-cartao="portas">
        <h2 className="adm-titulo">Administrar</h2>
        <ul className="adm-grade" data-coisas={area.length}>
          {area.map((c) => (
            <li key={c.coisa}>
              <Link href={`/admin/${c.coisa}/`} className="adm-porta" data-coisa={c.coisa}>
                <span className="adm-porta-nome">{c.rotulo}</span>
                <span className="adm-porta-num">{c.quantos.toLocaleString("pt-BR")}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="adm-secao adm-feito" data-registro={poder.registro.length}>
        <h2 className="adm-titulo">O que você fez</h2>
        {poder.registro.length === 0 ? (
          <p className="adm-vazio">Nada ainda.</p>
        ) : (
          <>
            <ul className="adm-registro">
              {poder.registro.slice(0, 8).map((r, i) => (
                <li key={`${r.alvo}-${i}`} data-linha-do-registro={r.acao}>
                  <span className="adm-registro-acao" data-acao-feita={r.acao}>
                    {ROTULO_DA_ACAO[r.acao]}
                  </span>
                  <span className="adm-registro-alvo">
                    {ROTULO_DO_ALVO[r.tipo]}: {r.titulo}
                  </span>
                  <span className="adm-registro-quem">
                    {r.autor} · {r.carimbo}
                    {r.motivo ? ` · ${r.motivo}` : ""}
                  </span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="adm-botao"
              onClick={poder.reiniciar}
              data-reiniciar-admin
            >
              Reiniciar a demonstração
            </button>
          </>
        )}
      </section>
    </div>
  );
}
