"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { Folha } from "@/componentes/base/folha";
import {
  ICONE_COMUNIDADE,
  ICONE_LOJA,
  ICONE_MAIS,
  ICONE_STUDIO_HOME,
} from "@/componentes/base/icones";
import { marcarAberturaDaFicha, useProdutor } from "@/componentes/produtor-estado";
import { DESCRICAO_DA_PAUTA, PAUTAS, semTravessao } from "@/dados/tipos-produtor";
import type { ContextoDoProdutor, Pauta, Registro } from "@/dados/tipos-produtor";

/**
 * produtor-barra.tsx, a barra flutuante do Studio, no molde da barra do público.
 *
 * MESMA GRAMÁTICA DO PRODUTO, VISTA DE TRÁS. O público tem quatro abas numa pílula
 * flutuante e um botão redondo separado que abre o hub; o Studio tem três abas e um botão
 * redondo que abre a criação. Inventar outro controle aqui faria o bastidor parecer outro
 * produto, e ele é o mesmo produto do outro lado do balcão.
 *
 * O REDONDO É AÇÃO, NÃO ABA. Criar não é um destino de mesma natureza que as três: é o
 * gesto pelo qual tudo que existe nas outras telas nasceu. A forma diferente é o que diz
 * isso, e o laranja é legítimo porque é o único papel que ele tem neste design system.
 *
 * A CRIAÇÃO MORA AQUI, e não no painel, e a razão é mecânica: o botão aparece nas três
 * telas de topo, e uma folha presa ao painel deixaria o mesmo botão funcionando numa tela
 * e inerte nas outras duas.
 *
 * `absolute` CONTRA A MOLDURA, NUNCA `fixed` (D-03), e no fluxo na visão web (D-05): uma
 * pílula flutuando no pé de uma janela de 960px é padrão de telefone posto onde não
 * resolve nada. Ela mantém `data-barra-acao` com UMA ação primária, que é o que a sonda
 * da dobra confere.
 */

const PASSOS_DA_FICHA = [
  "Identidade: título, resumo e capa",
  "Os detalhes da pauta",
  "Acessibilidade declarada",
  "Prévia e publicação",
] as const;

export interface ImagemDaBarra {
  caminho: string;
  credito: string;
  alt: string;
  de: string;
}

const ABAS = [
  { href: "/studio", rotulo: "Início", icone: ICONE_STUDIO_HOME },
  { href: "/studio/comunidade", rotulo: "Comunidade", icone: ICONE_COMUNIDADE },
  { href: "/studio/pontos", rotulo: "Loja", icone: ICONE_LOJA },
] as const;

export function BarraDoStudio({
  semente,
  contexto,
  pautasComFicha,
  imagens,
}: {
  semente: Registro[];
  contexto: ContextoDoProdutor;
  pautasComFicha: readonly Pauta[];
  imagens: ImagemDaBarra[];
}) {
  const router = useRouter();
  const armazem = useProdutor(semente, contexto);
  // Sem a barra final: `trailingSlash: true` publica `/studio/`, e a igualdade exata
  // contra os hrefs sem barra nunca acenderia.
  const caminho = (usePathname() ?? "").replace(/\/$/, "");
  const [criando, setCriando] = useState(false);
  const [pauta, setPauta] = useState<Pauta | null>(null);

  const prontas = new Set(pautasComFicha);
  const imagemDe = (p: Pauta) =>
    imagens.length === 0 ? null : (imagens[PAUTAS.indexOf(p) % imagens.length] ?? null);

  function fechar() {
    setCriando(false);
    setPauta(null);
  }

  function comecar(p: Pauta) {
    armazem.criar(p);
    fechar();
    // A rota da pauta abre no painel da categoria; quem veio daqui já pediu a ficha.
    marcarAberturaDaFicha();
    router.push(DESCRICAO_DA_PAUTA[p].rota);
  }

  const escolhida = pauta ? DESCRICAO_DA_PAUTA[pauta] : null;
  const capa = pauta ? imagemDe(pauta) : null;

  return (
    <>
      {/* `data-raiz` existe para o CSS saber o que a tela tem: na RAIZ da visao web o
          trilho lateral nao e montado (o painel e a navegacao), e esconder as abas ali
          deixava Comunidade e Loja sem nenhum caminho. Nas telas internas o trilho existe,
          e as abas somem para a mesma escolha nao aparecer duas vezes. */}
      <nav
        className="prod-barra-nav"
        aria-label="Navegação do Studio"
        data-barra-acao
        data-raiz={caminho === "/studio" ? "sim" : "nao"}
      >
        <ul className="prod-abas">
          {ABAS.map((aba) => {
            const ativa = caminho === aba.href;
            return (
              <li key={aba.href}>
                <Link
                  href={`${aba.href}/`}
                  className="prod-aba"
                  data-aba={aba.rotulo.toLowerCase()}
                  data-ativa={ativa ? "sim" : "nao"}
                  aria-current={ativa ? "page" : undefined}
                >
                  {aba.icone}
                  <span className="prod-aba-rotulo">{aba.rotulo}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          className="prod-criar-redondo"
          onClick={() => setCriando(true)}
          data-abrir-criar="sim"
          data-primaria="sim"
          aria-label="criar um registro"
        >
          {ICONE_MAIS}
          <span className="prod-criar-rotulo">Criar</span>
        </button>
      </nav>

      {/* ---- a criação, em dois passos ---- */}
      {/* O `singular` do contrato JÁ começa com «Novo»/«Nova» («Novo evento», «Nova
          mídia»): prefixar de novo produzia «Novo: Novo evento» no título da folha. */}
      <Folha
        aberta={criando}
        titulo={escolhida ? escolhida.singular : "O que você vai publicar?"}
        descricao={
          escolhida ? undefined : "Escolha a pauta. O caminho aparece antes de você começar."
        }
        aoFechar={fechar}
        rodape={
          escolhida && pauta ? (
            <BotaoDoStudio primaria aoClicar={() => comecar(pauta)} data-acao="comecar-criacao">
              Começar
            </BotaoDoStudio>
          ) : undefined
        }
      >
        {escolhida && pauta ? (
          <div className="prod-criacao" data-passo="2">
            {capa ? (
              <span className="prod-atalho-capa prod-criacao-capa">
                {/* eslint-disable-next-line @next/next/no-img-element -- capa local do acervo */}
                <img src={capa.caminho} alt="" />
                <span className="prod-atalho-credito">{capa.credito}</span>
              </span>
            ) : null}
            <p className="prod-nota">{semTravessao(escolhida.objetivo)}</p>
            <ol className="prod-passos">
              {PASSOS_DA_FICHA.map((passo, i) => (
                <li className="prod-passo" key={passo}>
                  <span className="prod-passo-numero" aria-hidden>
                    {i + 1}
                  </span>
                  <span className="prod-passo-texto">{passo}</span>
                </li>
              ))}
            </ol>
            <BotaoDoStudio curto aoClicar={() => setPauta(null)} data-acao="voltar-escolha">
              Escolher outra pauta
            </BotaoDoStudio>
          </div>
        ) : (
          <div className="prod-opcoes-pauta">
            {PAUTAS.map((p) => {
              const d = DESCRICAO_DA_PAUTA[p];
              const img = imagemDe(p);
              const pronta = prontas.has(p);
              return (
                <button
                  key={p}
                  type="button"
                  className="prod-atalho"
                  data-atalho={p}
                  data-pronta={pronta ? "sim" : "nao"}
                  disabled={!pronta}
                  title={pronta ? d.objetivo : `${d.objetivo} Ficha ainda não construída.`}
                  onClick={() => setPauta(p)}
                >
                  <span className="prod-atalho-capa">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element -- capa local
                      <img src={img.caminho} alt="" loading="lazy" />
                    ) : null}
                    {img ? <span className="prod-atalho-credito">{img.credito}</span> : null}
                  </span>
                  <span className="prod-atalho-rotulo">
                    {d.rotulo}
                    {pronta ? null : <span className="prod-atalho-breve">em breve</span>}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Folha>
    </>
  );
}
