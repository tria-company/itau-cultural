"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { CampoDeImagem } from "@/componentes/base/campo-de-imagem";
import type { ImagemDoAcervo } from "@/componentes/base/campo-de-imagem";
import { Campo } from "@/componentes/base/ficha-em-atos";
import { Folha } from "@/componentes/base/folha";
import {
  PREFIXO_DO_PRODUTOR,
  useLojaGerida,
  usePainelDeResgates,
} from "@/componentes/loja-estado";
import { usePontos } from "@/contexto/pontos";
import { FAMILIAS, FASES_DE_ENTREGA } from "@/dados/recompensas";
import { imagemVazia, imagemCompleta } from "@/dados/tipos-produtor";
import type { ImagemDeclarada } from "@/dados/tipos-produtor";
import type { FaseDoResgate, RecompensaDefinida } from "@/lib/pontos/tipos";

/**
 * loja-gestao.tsx — a loja pelo lado de quem a opera.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DUAS ABAS, PORQUE SÃO DUAS PERGUNTAS. «Catálogo» responde o que está à venda e por
 * quanto; «Resgates» responde quem levou, quando, e em que pé está a entrega. Juntá-las
 * numa tela só faria a operação do dia a dia disputar espaço com a curadoria da vitrine.
 *
 * A GESTÃO NÃO ESCREVE NO CATÁLOGO DO BUILD. Tudo passa por `loja-estado.ts`, que é
 * sobreposição: `src/dados/recompensas.ts` fica intocado, e é isso que mantém verdes os
 * portões de `scripts/verificar-pontos.ts`, que exigem o item de custo 520, o
 * `rec-exposicao` e o decremento de exatamente um.
 *
 * NENHUMA AÇÃO PRIMÁRIA EM REPOUSO. Esta rota monta a `BarraDoStudio`, cujo redondo
 * «Criar» já é a primária da tela, e o portão conta uma só na página inteira. Todo
 * confirmar mora dentro de uma `Folha`, que só existe enquanto aberta; as ações de linha
 * são botões curtos secundários.
 *
 * O RELÓGIO É VIRTUAL, e a tela diz isso onde mostra data. O motor nasce ancorado numa
 * segunda-feira fixa e só anda quando alguém pede: sem essa âncora, o HTML do build e o
 * primeiro render do cliente divergiriam.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const ROTULO_DA_ENTREGA: Record<RecompensaDefinida["entrega"], string> = {
  presencial: "presencial",
  digital: "digital",
  correio: "correio",
  "no-produto": "no app",
};

/** A forma de um item em edição. Nasce vazia ou de um item que já existe. */
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

function rascunhoVazio(): Rascunho {
  return {
    id: null,
    familia: "acesso",
    titulo: "",
    descricao: "",
    custo: "",
    estoque: "",
    semLimite: false,
    entrega: "presencial",
    imagem: null,
  };
}

function rascunhoDe(r: RecompensaDefinida): Rascunho {
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

/** A data virtual do motor, escrita como gente lê. Sem relógio real: ver o cabeçalho. */
function quando(em: number): string {
  const d = new Date(em);
  const dois = (n: number) => String(n).padStart(2, "0");
  return `${dois(d.getDate())}.${dois(d.getMonth() + 1)}.${d.getFullYear()} · ${dois(
    d.getHours(),
  )}h${dois(d.getMinutes())}`;
}

function proximaFase(fase: FaseDoResgate): FaseDoResgate | null {
  const i = FASES_DE_ENTREGA.findIndex((f) => f.id === fase);
  const seguinte = FASES_DE_ENTREGA[i + 1];
  return seguinte ? seguinte.id : null;
}

export function GestaoDaLoja({
  hoje,
  imagens,
}: {
  hoje: string;
  imagens: ImagemDoAcervo[];
}) {
  const armazem = useLojaGerida(hoje);
  const { motor, hidratado } = usePontos();
  const [aba, setAba] = useState<"catalogo" | "resgates">("catalogo");
  const [rascunho, setRascunho] = useState<Rascunho | null>(null);
  const [aTirar, setATirar] = useState<string | null>(null);
  const [aRepor, setARepor] = useState<string | null>(null);

  // A varredura das personas refaz a cada commit do motor, que é quando um resgate novo
  // pode ter entrado. `lerVersao` é o contador que o motor incrementa ao confirmar.
  const painel = usePainelDeResgates(hidratado ? motor.lerVersao() : 0);

  const porFamilia = useMemo(
    () =>
      FAMILIAS.map((f) => ({
        familia: f,
        itens: armazem.itens.filter((r) => r.familia === f.id),
      })).filter((g) => g.itens.length > 0),
    [armazem.itens],
  );

  const fichasQueSairam = useMemo(
    () => painel.linhas.reduce((n, l) => n + (l.resgate.custoPago ?? 0), 0),
    [painel.linhas],
  );

  const porFase = useMemo(() => {
    const conta: Record<string, number> = {};
    for (const l of painel.linhas) conta[l.resgate.fase] = (conta[l.resgate.fase] ?? 0) + 1;
    return conta;
  }, [painel.linhas]);

  const esgotados = useMemo(
    () => armazem.itens.filter((r) => r.estoque !== null && r.estoque <= 0).length,
    [armazem.itens],
  );

  if (!armazem.pronto) {
    return (
      <div className="prod-corpo">
        <p className="prod-campo-nota">Lendo o que está gravado neste navegador…</p>
      </div>
    );
  }

  const emEdicao = rascunho;
  const custoValido = emEdicao !== null && Number(emEdicao.custo) >= 1;
  const podeGravar =
    emEdicao !== null &&
    emEdicao.titulo.trim() !== "" &&
    custoValido &&
    imagemCompleta(emEdicao.imagem);

  function gravarRascunho() {
    if (emEdicao === null || !podeGravar || emEdicao.imagem === null) return;
    const campos = {
      familia: emEdicao.familia,
      titulo: emEdicao.titulo.trim(),
      descricao: emEdicao.descricao.trim(),
      custo: Number(emEdicao.custo),
      estoque: emEdicao.semLimite ? null : Number(emEdicao.estoque || 0),
      entrega: emEdicao.entrega,
      imagem: emEdicao.imagem.caminho,
      imagemAlt: emEdicao.imagem.alt,
      imagemCredito: emEdicao.imagem.credito,
    };
    if (emEdicao.id === null) armazem.criar(campos);
    else armazem.alterar(emEdicao.id, campos);
    setRascunho(null);
  }

  const itemATirar = armazem.itens.find((r) => r.id === aTirar) ?? null;
  const resgatesDoItem = painel.linhas.filter((l) => l.resgate.recompensaId === aTirar).length;

  return (
    <>
      <header className="prod-cabecalho">
        <div className="prod-cabecalho-linha">
          <Link href="/studio/" className="prod-superficie prod-voltar" data-voltar-studio>
            <span className="prod-voltar-texto">‹ Studio</span>
            <span className="prod-voltar-x" aria-hidden>
              ✕
            </span>
          </Link>
          <span className="prod-contagem">{armazem.itens.length} itens na loja</span>
        </div>
        <h1 className="prod-titulo">Gestão da loja</h1>
        <p className="prod-objetivo">
          O que está à venda, por quanto, quanto resta, e o que já foi resgatado.
        </p>
      </header>

      <div className="prod-corpo" data-gestao-da-loja>
        <div className="prod-trilho-abas" role="tablist" aria-label="as duas gestões">
          <button
            type="button"
            role="tab"
            className="prod-pauta"
            data-ativa={aba === "catalogo" ? "sim" : "nao"}
            aria-selected={aba === "catalogo"}
            onClick={() => setAba("catalogo")}
            data-aba="catalogo"
          >
            Catálogo
          </button>
          <button
            type="button"
            role="tab"
            className="prod-pauta"
            data-ativa={aba === "resgates" ? "sim" : "nao"}
            aria-selected={aba === "resgates"}
            onClick={() => setAba("resgates")}
            data-aba="resgates"
          >
            Resgates
          </button>
        </div>

        {aba === "catalogo" ? (
          <>
            <div className="prod-inicio-stats" data-numeros-da-loja>
              <span className="prod-inicio-stat">
                <strong>{armazem.itens.length}</strong>
                <span>itens à venda</span>
              </span>
              <span className="prod-inicio-stat">
                <strong>{esgotados}</strong>
                <span>esgotados</span>
              </span>
              <span className="prod-inicio-stat">
                <strong>{armazem.retirados.length}</strong>
                <span>fora de cartaz</span>
              </span>
            </div>

            <div className="prod-linha-de-acao">
              <BotaoDoStudio
                aoClicar={() => setRascunho(rascunhoVazio())}
                data-criar-item-da-loja
              >
                + Novo item
              </BotaoDoStudio>
            </div>

            {porFamilia.map(({ familia, itens }) => (
              <section className="prod-secao" key={familia.id}>
                <h2 className="prod-secao-titulo">{familia.rotulo}</h2>
                <p className="prod-campo-nota">{familia.resumo}</p>
                {itens.map((r) => (
                  <div className="prod-vinculo" key={r.id} data-item-da-loja={r.id}>
                    <span className="prod-registro-corpo">
                      <strong className="prod-registro-titulo">{r.titulo}</strong>
                      <span className="prod-registro-meta">
                        {r.custo} fichas ·{" "}
                        {r.estoque === null ? "sem limite" : `${r.estoque} em estoque`} ·{" "}
                        {ROTULO_DA_ENTREGA[r.entrega]}
                        {r.id.startsWith(PREFIXO_DO_PRODUTOR) ? " · criado por você" : ""}
                      </span>
                    </span>
                    <span className="prod-registro-acoes">
                      {r.estoque !== null && r.estoque <= 0 ? (
                        <span className="prod-situacao" data-situacao="suspenso">
                          esgotado
                        </span>
                      ) : null}
                      <BotaoDoStudio
                        curto
                        aoClicar={() => setRascunho(rascunhoDe(r))}
                        data-acao="editar-item"
                      >
                        editar
                      </BotaoDoStudio>
                      {r.estoque !== null ? (
                        <BotaoDoStudio
                          curto
                          aoClicar={() => setARepor(r.id)}
                          data-acao="repor-estoque"
                        >
                          repor
                        </BotaoDoStudio>
                      ) : null}
                      <BotaoDoStudio
                        curto
                        aoClicar={() => setATirar(r.id)}
                        data-acao="tirar-item"
                      >
                        tirar
                      </BotaoDoStudio>
                    </span>
                  </div>
                ))}
              </section>
            ))}

            {armazem.retirados.length > 0 ? (
              <section className="prod-secao">
                <h2 className="prod-secao-titulo">Fora de cartaz</h2>
                <p className="prod-campo-nota">
                  Não aparecem na vitrine. Quem já resgatou continua com o item na carteira.
                </p>
                {armazem.retirados.map((id) => (
                  <div className="prod-vinculo" key={id} data-item-retirado={id}>
                    <span className="prod-registro-corpo">
                      <strong className="prod-registro-titulo">{id}</strong>
                    </span>
                    <span className="prod-registro-acoes">
                      <BotaoDoStudio
                        curto
                        aoClicar={() => armazem.devolver(id)}
                        data-acao="devolver-item"
                      >
                        devolver à loja
                      </BotaoDoStudio>
                    </span>
                  </div>
                ))}
              </section>
            ) : null}
          </>
        ) : (
          <>
            <div className="prod-inicio-stats" data-numeros-dos-resgates>
              <span className="prod-inicio-stat">
                <strong>{painel.linhas.length}</strong>
                <span>resgates feitos</span>
              </span>
              <span className="prod-inicio-stat">
                <strong>{fichasQueSairam}</strong>
                <span>fichas gastas</span>
              </span>
              <span className="prod-inicio-stat">
                <strong>{porFase.entregue ?? 0}</strong>
                <span>já entregues</span>
              </span>
            </div>

            <div className="prod-linha-de-acao">
              <BotaoDoStudio
                curto
                aoClicar={() => motor.avancarDias(1)}
                data-avancar-um-dia
              >
                Avançar 1 dia
              </BotaoDoStudio>
              <BotaoDoStudio
                curto
                aoClicar={() => motor.avancarDias(7)}
                data-avancar-uma-semana
              >
                Avançar 7 dias
              </BotaoDoStudio>
            </div>
            <p className="prod-campo-nota">
              O relógio é virtual e ancorado, e só anda quando você pede. Avançar move a
              esteira de entrega desta conta.
            </p>

            {painel.linhas.length === 0 ? (
              <div className="prod-vazio">
                <p className="prod-vazio-frase">
                  Nenhum resgate ainda. Eles aparecem aqui assim que alguém troca fichas por
                  um item da loja.
                </p>
              </div>
            ) : (
              <section className="prod-secao">
                <h2 className="prod-secao-titulo">Quem resgatou</h2>
                {painel.linhas.map((l) => {
                  const seguinte = proximaFase(l.resgate.fase);
                  const daPersonaAtiva = hidratado && l.personaId === motor.atual.personaId;
                  return (
                    <div
                      className="prod-vinculo"
                      key={`${l.personaId}:${l.resgate.id}`}
                      data-resgate={l.resgate.id}
                    >
                      <span className="prod-registro-corpo">
                        <strong className="prod-registro-titulo">
                          {l.resgate.titulo ?? l.resgate.recompensaId}
                        </strong>
                        <span className="prod-registro-meta">
                          {l.personaNome} · {quando(l.resgate.em)} ·{" "}
                          {l.resgate.custoPago ?? 0} fichas · {l.ordem}º resgate dela
                        </span>
                      </span>
                      <span className="prod-registro-acoes">
                        <span className="prod-situacao" data-situacao="publicado">
                          {FASES_DE_ENTREGA.find((f) => f.id === l.resgate.fase)?.rotulo ??
                            l.resgate.fase}
                        </span>
                        {seguinte && daPersonaAtiva ? (
                          <BotaoDoStudio
                            curto
                            aoClicar={() => motor.moverResgate(l.resgate.id, seguinte)}
                            data-acao="avancar-fase"
                          >
                            avançar
                          </BotaoDoStudio>
                        ) : null}
                        {l.resgate.fase !== "entregue" && daPersonaAtiva ? (
                          <BotaoDoStudio
                            curto
                            aoClicar={() => motor.moverResgate(l.resgate.id, "entregue")}
                            data-acao="marcar-entregue"
                          >
                            entregue
                          </BotaoDoStudio>
                        ) : null}
                      </span>
                    </div>
                  );
                })}
                <p className="prod-campo-nota">
                  A entrega só se move na conta que está aberta agora. Para mover a de outra
                  pessoa, troque de conta no Perfil.
                </p>
              </section>
            )}
          </>
        )}
      </div>

      {/* ---- a folha do item ---- */}
      <Folha
        aberta={emEdicao !== null}
        titulo={emEdicao?.id === null ? "Novo item da loja" : "Editar item"}
        descricao="O que a pessoa vê na vitrine antes de gastar as fichas."
        aoFechar={() => setRascunho(null)}
        rodape={
          <BotaoDoStudio
            primaria
            desabilitado={!podeGravar}
            porQueDesabilitado="Precisa de título, preço a partir de 1 ficha, e uma capa com crédito e texto alternativo."
            aoClicar={gravarRascunho}
            data-gravar-item-da-loja
          >
            {emEdicao?.id === null ? "Criar item" : "Salvar"}
          </BotaoDoStudio>
        }
      >
        {emEdicao !== null ? (
          <>
            <Campo rotulo="Título" obrigatorio>
              <input
                type="text"
                value={emEdicao.titulo}
                onChange={(e) => setRascunho({ ...emEdicao, titulo: e.target.value })}
                className="prod-campo-entrada"
                data-titulo-do-item
                aria-invalid={emEdicao.titulo.trim() === ""}
              />
            </Campo>

            <Campo rotulo="Descrição" nota="O que a pessoa recebe, em uma frase.">
              <textarea
                value={emEdicao.descricao}
                onChange={(e) => setRascunho({ ...emEdicao, descricao: e.target.value })}
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
                  value={emEdicao.custo}
                  onChange={(e) => setRascunho({ ...emEdicao, custo: e.target.value })}
                  className="prod-campo-entrada"
                  data-custo-do-item
                  aria-invalid={!custoValido}
                />
              </Campo>
              <Campo rotulo="Estoque">
                <input
                  type="number"
                  min={0}
                  value={emEdicao.semLimite ? "" : emEdicao.estoque}
                  disabled={emEdicao.semLimite}
                  onChange={(e) => setRascunho({ ...emEdicao, estoque: e.target.value })}
                  className="prod-campo-entrada"
                  data-estoque-do-item
                />
              </Campo>
            </div>

            <label className="prod-dimensao">
              <input
                type="checkbox"
                checked={emEdicao.semLimite}
                onChange={(e) => setRascunho({ ...emEdicao, semLimite: e.target.checked })}
                data-sem-limite
              />
              <span className="prod-dimensao-rotulo">
                Sem limite de estoque, como as recompensas que vivem dentro do app
              </span>
            </label>

            <div className="prod-par">
              <Campo rotulo="Família">
                <select
                  value={emEdicao.familia}
                  onChange={(e) =>
                    setRascunho({
                      ...emEdicao,
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
                  value={emEdicao.entrega}
                  onChange={(e) =>
                    setRascunho({
                      ...emEdicao,
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

            <CampoDeImagem
              rotulo="Foto do item"
              obrigatoria
              imagem={emEdicao.imagem ?? imagemVazia()}
              aoMudar={(i) => setRascunho({ ...emEdicao, imagem: i })}
              acervo={imagens}
            />
          </>
        ) : null}
      </Folha>

      {/* ---- repor estoque ---- */}
      <Folha
        aberta={aRepor !== null}
        titulo="Repor estoque"
        descricao="O número que você escrever passa a ser o estoque cheio deste item."
        aoFechar={() => setARepor(null)}
      >
        {aRepor !== null ? <ReporEstoque id={aRepor} armazem={armazem} aoFim={() => setARepor(null)} /> : null}
      </Folha>

      {/* ---- tirar de cartaz, em dois tempos, no lugar ---- */}
      <Folha
        aberta={aTirar !== null}
        titulo="Tirar da loja"
        aoFechar={() => setATirar(null)}
        rodape={
          <BotaoDoStudio
            primaria
            aoClicar={() => {
              if (aTirar) armazem.retirar(aTirar);
              setATirar(null);
            }}
            data-confirmar-tirar
          >
            Tirar da loja
          </BotaoDoStudio>
        }
      >
        <div className="prod-impedimentos" data-alcance-de-tirar>
          <p className="prod-impedimentos-frase">
            {resgatesDoItem === 0
              ? "Ninguém resgatou este item ainda."
              : `${resgatesDoItem} ${
                  resgatesDoItem === 1 ? "pessoa já resgatou" : "pessoas já resgataram"
                } este item.`}
          </p>
          <p className="prod-impedimento-texto">
            Tirar não apaga resgate: a carteira continua mostrando o título e o preço que
            foi pago. O item some da vitrine e volta quando você devolver.
          </p>
        </div>
        {itemATirar ? (
          <p className="prod-campo-nota">
            {itemATirar.titulo} · {itemATirar.custo} fichas
          </p>
        ) : null}
      </Folha>
    </>
  );
}

/**
 * Repor é operação de rotina, e por isso o número entra direto, sem confirmação de
 * segunda ordem. Repor ZERA o consumido daquele item: sem isso, repor 50 num item com 8
 * saídas entregaria 42 à prateleira, e o produtor teria de fazer a conta de cabeça.
 */
function ReporEstoque({
  id,
  armazem,
  aoFim,
}: {
  id: string;
  armazem: ReturnType<typeof useLojaGerida>;
  aoFim: () => void;
}) {
  const item = armazem.itens.find((r) => r.id === id);
  const [quanto, setQuanto] = useState(String(item?.estoque ?? 0));

  return (
    <>
      <Campo rotulo="Estoque cheio" nota="É o número que a vitrine passa a contar.">
        <input
          type="number"
          min={0}
          value={quanto}
          onChange={(e) => setQuanto(e.target.value)}
          className="prod-campo-entrada"
          data-repor-quanto
        />
      </Campo>
      <div className="prod-registro-acoes">
        {[10, 50, 120].map((n) => (
          <BotaoDoStudio key={n} curto aoClicar={() => setQuanto(String(n))}>
            {n}
          </BotaoDoStudio>
        ))}
        <BotaoDoStudio
          curto
          aoClicar={() => {
            armazem.reporEstoque(id, Number(quanto || 0));
            aoFim();
          }}
          data-confirmar-repor
        >
          Repor
        </BotaoDoStudio>
      </div>
    </>
  );
}
