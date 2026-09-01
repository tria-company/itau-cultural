"use client";

import Link from "next/link";
import { usePoderDeAdmin } from "@/componentes/admin-estado";
import { BarrasVerticais, LegendaDaRosca, Medidor, Rosca } from "@/componentes/base/graficos";
import { ROTULO_DA_ACAO, ROTULO_DO_ALVO } from "@/dados/admin-acoes";
import type { DescricaoDaCoisa, PainelDaPlataforma } from "@/dados/admin-area";

/**
 * admin-painel.tsx, como a plataforma está e onde ela chega.
 *
 * A MESMA GRAMÁTICA DO PAINEL DO PRODUTOR, com o recorte trocado: lá são os registros de
 * quem produz, aqui é a plataforma inteira. Rosca, barras e medidor vêm de `base/graficos`,
 * para as duas superfícies não desenharem a mesma coisa de jeitos diferentes.
 *
 * TODO NÚMERO COM DENOMINADOR quando ele é parte de um todo. «472 com lugar no mapa» sozinho
 * não diz nada; «472 de 7.810» diz.
 *
 * O MAPA É O DIAGNÓSTICO, e não enfeite: 312 dos 645 municípios de São Paulo não têm nenhum
 * equipamento cultural mapeado, quase metade do estado. Ele chega pronto do servidor.
 */
export function AdminPainel({
  painel,
  area,
  carimbo,
  mapa,
}: {
  painel: PainelDaPlataforma;
  area: DescricaoDaCoisa[];
  carimbo: string;
  /**
   * O MAPA CHEGA PRONTO, do servidor. São 645 caminhos e 167 KB: passá-los como dado
   * obrigaria o navegador a remontar o que o build já desenhou. Aqui ele é marcação.
   */
  mapa: React.ReactNode;
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

  return (
    <div className="adm-painel" data-admin-painel>
      {/* Os números da plataforma. */}
      <ul className="adm-numeros" data-numeros={painel.numeros.length}>
        {painel.numeros.map((n) => (
          <li key={n.id} className="adm-numero" data-numero={n.id}>
            <span className="adm-numero-valor">{n.valor}</span>
            <span className="adm-numero-rotulo">
              {n.rotulo}
              {n.de ? <em className="adm-numero-de"> de {n.de}</em> : null}
            </span>
          </li>
        ))}
      </ul>

      <div className="adm-cartoes">
        <section className="adm-cartao" data-cartao="procedencia">
          <h2 className="adm-titulo">De onde veio o acervo</h2>
          <div className="adm-rosca">
            <Rosca
              fatias={painel.procedencia}
              centroValor={String(painel.procedencia.reduce((a, f) => a + f.valor, 0))}
              centroRotulo="entidades"
            />
            <LegendaDaRosca fatias={painel.procedencia} />
          </div>
        </section>

        <section className="adm-cartao" data-cartao="classes">
          <h2 className="adm-titulo">O que o acervo tem mais</h2>
          <BarrasVerticais barras={painel.porClasse} />
        </section>

        <section className="adm-cartao" data-cartao="cobertura">
          <h2 className="adm-titulo">Cobertura</h2>
          <div className="adm-medidores">
            <Medidor
              porcento={painel.acessibilidade.porcento}
              rotulo={painel.acessibilidade.rotulo}
            />
            <Medidor porcento={painel.imagem.porcento} rotulo={painel.imagem.rotulo} />
          </div>
        </section>
      </div>

      {/* O mapa de uso. */}
      <section className="adm-cartao adm-cartao-largo" data-cartao="mapa">
        <h2 className="adm-titulo">Equipamentos culturais por município</h2>
        {mapa}
      </section>

      {/* As portas para administrar. */}
      <section data-cartao="portas">
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

      {/* O que ele fez. */}
      <section className="adm-feito" data-registro={poder.registro.length}>
        <h2 className="adm-titulo">O que você fez</h2>
        {poder.registro.length === 0 ? (
          <p className="adm-vazio">Nada ainda.</p>
        ) : (
          <>
            <ul className="adm-registro">
              {poder.registro.slice(0, 8).map((r, i) => (
                <li key={`${r.alvo}-${i}`} data-linha-do-registro={r.acao}>
                  <span className="adm-registro-acao">{ROTULO_DA_ACAO[r.acao]}</span>
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
