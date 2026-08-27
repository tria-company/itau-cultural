"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { Folha } from "@/componentes/base/folha";
import { marcarCriacaoDaPauta } from "@/componentes/produtor-estado";
import { DESCRICAO_DA_PAUTA, PAUTAS, semTravessao } from "@/dados/tipos-produtor";
import type { Pauta } from "@/dados/tipos-produtor";

/**
 * folha-de-criacao.tsx, a escolha da pauta em dois passos, de quem quer que a abra.
 *
 * UMA FOLHA, DOIS DONOS. No app quem a abre é o Criar redondo da barra flutuante; na web,
 * o Criar da coluna lateral. Duas cópias do mesmo fluxo divergiriam no primeiro ajuste, e
 * a folha é exatamente o tipo de coisa que diverge em silêncio: uma ganharia uma pauta
 * nova e a outra não.
 *
 * ELA NÃO CRIA O REGISTRO. Criar exige o armazém hidratado, e o armazém mora nas páginas;
 * arrastá-lo até aqui faria a coluna lateral carregar a semente inteira em todas as telas.
 * O que a folha faz é MARCAR A INTENÇÃO (`marcarCriacaoDaPauta`) e navegar: a página da
 * pauta consome a intenção quando o armazém dela estiver pronto, cria o registro e abre a
 * ficha no primeiro ato.
 */

const PASSOS_DA_FICHA = [
  "Identidade: título, resumo e capa",
  "Os detalhes da pauta",
  "Acessibilidade declarada",
  "Prévia e publicação",
] as const;

export interface ImagemDaCriacao {
  caminho: string;
  credito: string;
  alt: string;
  de: string;
}

export function FolhaDeCriacao({
  aberta,
  aoFechar,
  pautasComFicha,
  imagens,
}: {
  aberta: boolean;
  aoFechar: () => void;
  pautasComFicha: readonly Pauta[];
  imagens: ImagemDaCriacao[];
}) {
  const router = useRouter();
  const [pauta, setPauta] = useState<Pauta | null>(null);

  const prontas = new Set(pautasComFicha);
  const imagemDe = (p: Pauta) =>
    imagens.length === 0 ? null : (imagens[PAUTAS.indexOf(p) % imagens.length] ?? null);

  function fechar() {
    setPauta(null);
    aoFechar();
  }

  function comecar(p: Pauta) {
    marcarCriacaoDaPauta(p);
    fechar();
    router.push(DESCRICAO_DA_PAUTA[p].rota);
  }

  const escolhida = pauta ? DESCRICAO_DA_PAUTA[pauta] : null;
  const capa = pauta ? imagemDe(pauta) : null;

  // O `singular` do contrato JÁ começa com «Novo»/«Nova»: nada de prefixar de novo.
  return (
    <Folha
      aberta={aberta}
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
  );
}
