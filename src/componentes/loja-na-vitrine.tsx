"use client";

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
 * loja-na-vitrine.tsx — a loja com o que o dono dela pode fazer, na própria vitrine.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ADICIONAR E EDITAR ITEM MORAM AQUI, e não numa tela de gestão à parte. A tela à parte
 * existiu e não foi encontrada, o que é o mesmo que não existir: quem quer mexer no preço
 * está olhando para o preço. Mesmo arranjo do feed da comunidade — a vitrine é portada e
 * não sabe o que é gestão; ela recebe por prop o botão de criar e as ações de cada item.
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
  };
}

export function LojaNaVitrine({
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
  const podeGravar =
    rascunho !== null &&
    rascunho.titulo.trim() !== "" &&
    custoOk &&
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
    };
    if (rascunho.id === null) armazem.criar(campos);
    else armazem.alterar(rascunho.id, campos);
    setRascunho(null);
  }

  return (
    <>
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
            porQueDesabilitado="Precisa de título, preço a partir de 1 ficha, e foto com crédito e texto alternativo."
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
                </select>
              </Campo>
            </div>

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
