"use client";

import Link from "next/link";
import { useState } from "react";
import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { CampoDeImagem } from "@/componentes/base/campo-de-imagem";
import type { ImagemDoAcervo } from "@/componentes/base/campo-de-imagem";
import { Campo } from "@/componentes/base/ficha-em-atos";
import { Folha } from "@/componentes/base/folha";
import { ICONE_LAPIS } from "@/componentes/base/icones";
import { useLojaGerida } from "@/componentes/loja-estado";
import { Recompensas } from "@/componentes/recompensas";
import { FAMILIAS } from "@/dados/recompensas";
import { imagemVazia, imagemCompleta } from "@/dados/tipos-produtor";
import type { ImagemDeclarada } from "@/dados/tipos-produtor";
import type { RecompensaDefinida } from "@/lib/pontos/tipos";

/**
 * loja-em-gestao.tsx — a loja pelo lado de quem a abastece.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ELA MUDOU DE ENDEREÇO EM 29/08/2026, e o nome mudou junto. Era `loja-na-vitrine`, montada
 * dentro de `/studio/pontos/loja/`, com um lápis sobre cada cartão da vitrine que a pessoa
 * usa para gastar fichas. Funcionava, e era a mesma tela servindo a duas pessoas.
 *
 * O corte pedido foi de uma linha: dentro do Studio fica tudo que ele mexe, e a Loja, irmã
 * de Início e Comunidade, é onde ele compra. Cadastrar item mora aqui, em
 * `/studio/minha-loja/`; a vitrine voltou a ser só vitrine.
 *
 * O DESENHO DO CARTÃO NÃO MUDOU. Esta tela monta a mesma `<Recompensas>` da vitrine, e lhe
 * entrega por prop o botão de criar e o lápis de cada item. O componente é portado do outro
 * ramo e não sabe o que é gestão: ele só desenha o que recebe. Foi assim que a gestão entrou
 * sem reescrever a tela, e é assim que ela sai.
 * ─────────────────────────────────────────────────────────────────────────────
 */

interface Rascunho {
  id: string | null;
  familia: RecompensaDefinida["familia"];
  titulo: string;
  descricao: string;
  custo: string;
  estoque: string;
  semLimite: boolean;
  entrega: RecompensaDefinida["entrega"];
  imagem: ImagemDeclarada | null;
  link: string;
  lojaDeFora: string;
  cupom: string;
}

function vazio(): Rascunho {
  return {
    id: null,
    familia: "acesso",
    titulo: "",
    descricao: "",
    custo: "",
    estoque: "",
    semLimite: false,
    entrega: "presencial",
    imagem: imagemVazia(),
    link: "",
    lojaDeFora: "",
    cupom: "",
  };
}

function doItem(r: RecompensaDefinida): Rascunho {
  return {
    id: r.id,
    familia: r.familia,
    titulo: r.titulo,
    descricao: r.descricao,
    custo: String(r.custo),
    estoque: r.estoque === null ? "" : String(r.estoque),
    semLimite: r.estoque === null,
    entrega: r.entrega,
    imagem: {
      caminho: r.imagem,
      credito: r.imagemCredito,
      alt: r.imagemAlt,
      licenca: null,
    },
    link: r.link ?? "",
    lojaDeFora: r.lojaDeFora ?? "",
    cupom: r.cupom ?? "",
  };
}

export function LojaEmGestao({
  hoje,
  imagens,
}: {
  hoje: string;
  imagens: ImagemDoAcervo[];
}) {
  const armazem = useLojaGerida(hoje);
  const [rascunho, setRascunho] = useState<Rascunho | null>(null);
  const [aTirar, setATirar] = useState<string | null>(null);

  const custoOk = rascunho !== null && Number(rascunho.custo) >= 1;
  /**
   * O DISCRIMINANTE EXIGE O VALOR. Item declarado como «retira numa loja de fora» sem o
   * endereço é um resgate que não leva a lugar nenhum: a pessoa paga a ficha e recebe um
   * botão morto. Mesma guarda que a ficha de evento faz com `canalIngresso` e
   * `linkDeIngresso` (`tipos-produtor.ts:1227`).
   */
  const linkOk =
    rascunho !== null && (rascunho.entrega !== "link" || rascunho.link.trim() !== "");
  const podeGravar =
    rascunho !== null &&
    rascunho.titulo.trim() !== "" &&
    custoOk &&
    linkOk &&
    imagemCompleta(rascunho.imagem);

  function gravar() {
    if (rascunho === null || rascunho.imagem === null || !podeGravar) return;
    const campos = {
      familia: rascunho.familia,
      titulo: rascunho.titulo.trim(),
      descricao: rascunho.descricao.trim(),
      custo: Number(rascunho.custo),
      estoque: rascunho.semLimite ? null : Number(rascunho.estoque || 0),
      entrega: rascunho.entrega,
      imagem: rascunho.imagem.caminho,
      imagemAlt: rascunho.imagem.alt,
      imagemCredito: rascunho.imagem.credito,
      // Os três só existem quando o discriminante os pede: gravar cupom num item
      // presencial deixaria lixo esperando alguém acreditar nele.
      link: rascunho.entrega === "link" ? rascunho.link.trim() : "",
      lojaDeFora: rascunho.entrega === "link" ? rascunho.lojaDeFora.trim() : "",
      cupom: rascunho.entrega === "link" ? rascunho.cupom.trim() : "",
    };
    if (rascunho.id === null) armazem.criar(campos);
    else armazem.alterar(rascunho.id, campos);
    setRascunho(null);
  }

  return (
    <>
      <header className="prod-cabecalho">
        <div className="prod-cabecalho-linha">
          <Link href="/studio/pautas/" className="prod-superficie prod-voltar" data-voltar-studio>
            <span className="prod-voltar-texto">‹ Studio</span>
            <span className="prod-voltar-x" aria-hidden>
              ✕
            </span>
          </Link>
          <Link href="/studio/minha-loja/resgates/" className="pastilha" data-ver-resgates>
            Resgates
          </Link>
        </div>
        <h1 className="prod-titulo">Loja</h1>
      </header>

      <Recompensas
        hoje={hoje}
        acaoDeCriar={
          <BotaoDoStudio
            aoClicar={() => setRascunho(vazio())}
            desabilitado={!armazem.pronto}
            porQueDesabilitado="Lendo o que está gravado neste navegador…"
            curto
            data-criar-item
          >
            + Novo item
          </BotaoDoStudio>
        }
        acoesDoItem={(r) =>
          !armazem.pronto ? undefined : (
            <button
              type="button"
              className="prod-comunidade-capa-lapis"
              onClick={() => {
                setATirar(null);
                setRascunho(doItem(r));
              }}
              aria-label={`Editar ${r.titulo}`}
              title="Editar preço, estoque e foto"
              data-editar-item
            >
              {ICONE_LAPIS}
            </button>
          )
        }
      />

      <Folha
        aberta={rascunho !== null}
        titulo={rascunho?.id === null ? "Novo item" : "Editar item"}
        aoFechar={() => setRascunho(null)}
        rodape={
          <BotaoDoStudio
            primaria
            desabilitado={!podeGravar}
            porQueDesabilitado="Precisa de título, preço a partir de 1 ficha, foto com crédito e texto alternativo, e o endereço quando a retirada é numa loja de fora."
            aoClicar={gravar}
            data-gravar-item
          >
            {rascunho?.id === null ? "Criar" : "Salvar"}
          </BotaoDoStudio>
        }
      >
        {rascunho !== null ? (
          <>
            <CampoDeImagem
              rotulo="Foto"
              obrigatoria
              imagem={rascunho.imagem ?? imagemVazia()}
              aoMudar={(i) => setRascunho({ ...rascunho, imagem: i })}
              acervo={imagens}
            />

            <Campo rotulo="Título" obrigatorio>
              <input
                type="text"
                value={rascunho.titulo}
                onChange={(e) => setRascunho({ ...rascunho, titulo: e.target.value })}
                className="prod-campo-entrada"
                data-titulo-do-item
                aria-invalid={rascunho.titulo.trim() === ""}
              />
            </Campo>

            <Campo rotulo="Descrição">
              <textarea
                value={rascunho.descricao}
                onChange={(e) => setRascunho({ ...rascunho, descricao: e.target.value })}
                rows={2}
                className="prod-campo-entrada"
                data-descricao-do-item
              />
            </Campo>

            <div className="prod-par">
              <Campo rotulo="Preço em fichas" obrigatorio>
                <input
                  type="number"
                  min={1}
                  value={rascunho.custo}
                  onChange={(e) => setRascunho({ ...rascunho, custo: e.target.value })}
                  className="prod-campo-entrada"
                  data-custo-do-item
                  aria-invalid={!custoOk}
                />
              </Campo>
              <Campo rotulo="Estoque">
                <input
                  type="number"
                  min={0}
                  value={rascunho.semLimite ? "" : rascunho.estoque}
                  disabled={rascunho.semLimite}
                  onChange={(e) => setRascunho({ ...rascunho, estoque: e.target.value })}
                  className="prod-campo-entrada"
                  data-estoque
                />
              </Campo>
            </div>

            <label className="prod-dimensao">
              <input
                type="checkbox"
                checked={rascunho.semLimite}
                onChange={(e) => setRascunho({ ...rascunho, semLimite: e.target.checked })}
                data-sem-limite
              />
              <span className="prod-dimensao-rotulo">Sem limite de estoque</span>
            </label>

            <div className="prod-par">
              <Campo rotulo="Família">
                <select
                  value={rascunho.familia}
                  onChange={(e) =>
                    setRascunho({
                      ...rascunho,
                      familia: e.target.value as RecompensaDefinida["familia"],
                    })
                  }
                  className="prod-campo-entrada"
                  data-familia-do-item
                >
                  {FAMILIAS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.rotulo}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo rotulo="Entrega">
                <select
                  value={rascunho.entrega}
                  onChange={(e) =>
                    setRascunho({
                      ...rascunho,
                      entrega: e.target.value as RecompensaDefinida["entrega"],
                    })
                  }
                  className="prod-campo-entrada"
                  data-entrega-do-item
                >
                  <option value="presencial">Presencial</option>
                  <option value="digital">Digital</option>
                  <option value="correio">Correio</option>
                  <option value="no-produto">No app</option>
                  <option value="link">Loja de fora</option>
                </select>
              </Campo>
            </div>

            {/* SÓ QUANDO A ENTREGA PEDE. Três campos escondidos atrás de um seletor é o
                mesmo desenho do canal de ingresso na ficha de evento, e pela mesma razão:
                pedir endereço de afiliado a quem vai entregar um cartaz pelo correio é
                perguntar o que não se aplica. */}
            {rascunho.entrega === "link" ? (
              <>
                <Campo
                  rotulo="Endereço"
                  obrigatorio
                  nota="Onde a pessoa termina a compra. Abre em outra aba."
                >
                  <input
                    type="text"
                    value={rascunho.link}
                    onChange={(e) => setRascunho({ ...rascunho, link: e.target.value })}
                    className="prod-campo-entrada"
                    data-link-do-item
                    aria-invalid={rascunho.link.trim() === ""}
                  />
                </Campo>

                <div className="prod-par">
                  <Campo rotulo="Loja" nota="O nome que a tela mostra.">
                    <input
                      type="text"
                      value={rascunho.lojaDeFora}
                      onChange={(e) =>
                        setRascunho({ ...rascunho, lojaDeFora: e.target.value })
                      }
                      className="prod-campo-entrada"
                      data-loja-do-item
                    />
                  </Campo>
                  <Campo rotulo="Cupom" nota="O código que zera o carrinho.">
                    <input
                      type="text"
                      value={rascunho.cupom}
                      onChange={(e) => setRascunho({ ...rascunho, cupom: e.target.value })}
                      className="prod-campo-entrada"
                      data-cupom-do-item
                    />
                  </Campo>
                </div>
              </>
            ) : null}

            {/* TIRAR MORA NA FOLHA, e nao no cartao: e o unico gesto sem volta daqui, e
                cartao de vitrine nao e lugar de gesto sem volta. Dois toques. */}
            {rascunho.id !== null ? (
              <div className="prod-linha-de-acao">
                {aTirar === rascunho.id ? (
                  <>
                    <BotaoDoStudio
                      curto
                      aoClicar={() => {
                        armazem.retirar(rascunho.id!);
                        setATirar(null);
                        setRascunho(null);
                      }}
                      data-tirar-item
                    >
                      Tirar mesmo
                    </BotaoDoStudio>
                    <BotaoDoStudio curto aoClicar={() => setATirar(null)}>
                      Cancelar
                    </BotaoDoStudio>
                  </>
                ) : (
                  <BotaoDoStudio
                    curto
                    aoClicar={() => setATirar(rascunho.id)}
                    data-pedir-tirar-item
                  >
                    Tirar da loja
                  </BotaoDoStudio>
                )}
              </div>
            ) : null}
          </>
        ) : null}
      </Folha>
    </>
  );
}
