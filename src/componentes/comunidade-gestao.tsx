"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { CampoDeImagem } from "@/componentes/base/campo-de-imagem";
import type { ImagemDoAcervo } from "@/componentes/base/campo-de-imagem";
import { Campo } from "@/componentes/base/ficha-em-atos";
import { Folha } from "@/componentes/base/folha";
import {
  PREFIXO_DA_PUBLICACAO,
  SLUGS_RESERVADOS,
  sementeDoPerfil,
  useComunidadeGerida,
} from "@/componentes/comunidade-estado";
import { usePontos } from "@/contexto/pontos";
import { imagemVazia, imagemCompleta } from "@/dados/tipos-produtor";
import type { PublicacaoDefinida } from "@/lib/pontos/tipos";

/**
 * comunidade-gestao.tsx — a comunidade pelo lado de quem a mantém.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DUAS ABAS, DUAS PERGUNTAS. «A comunidade» é a identidade: nome, chamada, capa, regras.
 * «As publicações» é o trabalho do dia: postar, editar, apagar, e ver o que voltou.
 *
 * NÃO HÁ BOTÃO DE SALVAR NA IDENTIDADE. Cada tecla escreve no armazém, a mesma disciplina
 * da ficha em atos: um formulário que só grava no fim é um formulário que perde trabalho
 * quando alguém troca de aba.
 *
 * A PUBLICAÇÃO VIVE NO MOTOR, não aqui. Este armazém guarda o rascunho — o texto que se
 * está escrevendo — e o motor guarda o que está no ar, no mesmo array que o feed, o
 * detalhe e as guardadas leem. Sem isso, reagir a uma publicação nova acenderia o coração
 * e não subiria o contador, e guardar a faria sumir da tela de Guardadas.
 *
 * ESCOPADA NA COMUNIDADE DA CASA. As outras 21 pertencem a instituições, coletivos e
 * pessoas reais amarradas à Enciclopédia; renomeá-las daqui seria pôr palavra na boca de
 * quem não escreveu.
 *
 * NENHUMA AÇÃO PRIMÁRIA EM REPOUSO: a rota monta a barra do Studio, cujo «Criar» já é a
 * primária da tela. Todo confirmar mora dentro de uma folha, que só existe aberta.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Comentários mais respostas, o mesmo cálculo que o cartão do feed faz. */
function totalDeComentarios(p: PublicacaoDefinida): number {
  return p.comentarios.reduce((n, c) => n + 1 + (c.respostas?.length ?? 0), 0);
}

export function GestaoDaComunidade({
  comunidadeId,
  nome,
  descricao,
  assinantes,
  hoje,
  imagens,
}: {
  comunidadeId: string;
  nome: string;
  descricao: string;
  assinantes: number;
  hoje: string;
  imagens: ImagemDoAcervo[];
}) {
  const semente = useMemo(
    () => sementeDoPerfil(comunidadeId, nome, descricao),
    [comunidadeId, nome, descricao],
  );
  const armazem = useComunidadeGerida(comunidadeId, semente, hoje);
  const { motor, hidratado } = usePontos();

  const [aba, setAba] = useState<"identidade" | "publicacoes">("identidade");
  const [emEdicao, setEmEdicao] = useState<string | null>(null);
  const [aApagar, setAApagar] = useState<string | null>(null);
  const [aLimpar, setALimpar] = useState(false);

  const minhas = useMemo(
    () =>
      hidratado
        ? motor.atual.publicacoes.filter((p) => p.id.startsWith(PREFIXO_DA_PUBLICACAO))
        : [],
    [motor, hidratado],
  );

  const daComunidade = useMemo(
    () =>
      hidratado
        ? motor.atual.publicacoes.filter((p) => p.comunidadeId === comunidadeId)
        : [],
    [motor, hidratado, comunidadeId],
  );

  const reacoes = daComunidade.reduce((n, p) => n + p.reacoes, 0);
  const comentarios = daComunidade.reduce((n, p) => n + totalDeComentarios(p), 0);

  if (!armazem.pronto) {
    return (
      <div className="prod-corpo">
        <p className="prod-campo-nota">Lendo o que está gravado neste navegador…</p>
      </div>
    );
  }

  const rascunho = armazem.rascunhos.find((r) => r.id === emEdicao) ?? null;
  const podePublicar =
    rascunho !== null &&
    rascunho.titulo.trim() !== "" &&
    imagemCompleta(rascunho.imagem);
  const jaNoAr = rascunho !== null && minhas.some((p) => p.id === rascunho.id);

  function abrirNova() {
    const id = armazem.criarRascunho();
    if (id === null) return;
    setEmEdicao(id);
  }

  function abrirEdicao(p: PublicacaoDefinida) {
    const existente = armazem.rascunhos.find((r) => r.id === p.id);
    if (!existente) {
      armazem.alterarRascunho(p.id, {});
    }
    setEmEdicao(p.id);
  }

  function publicar() {
    if (rascunho === null || !podePublicar || rascunho.imagem === null) return;
    const contexto = {
      comunidadeId,
      titulo: rascunho.titulo.trim(),
      corpo: rascunho.corpo.trim(),
      etiqueta: rascunho.etiqueta.trim(),
      imagem: rascunho.imagem.caminho,
      imagemAlt: rascunho.imagem.alt,
      imagemCredito: rascunho.imagem.credito,
    };
    motor.emitir(
      jaNoAr ? "comunidade.publicacao.editada" : "comunidade.publicacao.criada",
      { tipo: "publicacao", id: rascunho.id },
      contexto,
    );
    armazem.marcarPublicada(rascunho.id);
    setEmEdicao(null);
  }

  function apagar(id: string) {
    motor.emitir("comunidade.publicacao.retirada", { tipo: "publicacao", id });
    armazem.esquecerRascunho(id);
    setAApagar(null);
  }

  const publicacaoAApagar = minhas.find((p) => p.id === aApagar) ?? null;
  const restam = SLUGS_RESERVADOS - armazem.rascunhos.length;

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
          <span className="prod-contagem">{minhas.length} publicações suas</span>
        </div>
        <h1 className="prod-titulo">Gerenciar a comunidade</h1>
        <p className="prod-objetivo">
          Nome, capa, regras, e o que você publica na comunidade da casa.
        </p>
      </header>

      <div className="prod-corpo" data-gestao-da-comunidade>
        <div className="prod-trilho-abas" role="tablist" aria-label="as duas gestões">
          <button
            type="button"
            role="tab"
            className="prod-pauta"
            data-ativa={aba === "identidade" ? "sim" : "nao"}
            aria-selected={aba === "identidade"}
            onClick={() => setAba("identidade")}
            data-aba="identidade"
          >
            A comunidade
          </button>
          <button
            type="button"
            role="tab"
            className="prod-pauta"
            data-ativa={aba === "publicacoes" ? "sim" : "nao"}
            aria-selected={aba === "publicacoes"}
            onClick={() => setAba("publicacoes")}
            data-aba="publicacoes"
          >
            As publicações
          </button>
        </div>

        {aba === "identidade" ? (
          <>
            <section className="prod-secao">
              <h2 className="prod-secao-titulo">Identidade</h2>

              <Campo
                rotulo="Nome da comunidade"
                obrigatorio
                nota="Aparece grande na capa e assina cada publicação."
              >
                <input
                  type="text"
                  value={armazem.perfil.nome}
                  placeholder={semente.nome}
                  onChange={(e) => armazem.alterarPerfil({ nome: e.target.value })}
                  className="prod-campo-entrada"
                  data-nome-comunidade
                />
              </Campo>

              <Campo rotulo="Chamada da capa" nota="Uma linha, sob o nome.">
                <input
                  type="text"
                  value={armazem.perfil.chamada}
                  placeholder={semente.chamada}
                  onChange={(e) => armazem.alterarPerfil({ chamada: e.target.value })}
                  className="prod-campo-entrada"
                  data-chamada-comunidade
                />
              </Campo>

              <Campo rotulo="Descrição">
                <textarea
                  value={armazem.perfil.descricao}
                  placeholder={semente.descricao}
                  onChange={(e) => armazem.alterarPerfil({ descricao: e.target.value })}
                  rows={3}
                  className="prod-campo-entrada"
                  data-descricao-comunidade
                />
              </Campo>

              <CampoDeImagem
                rotulo="Capa da comunidade"
                imagem={armazem.perfil.capa}
                aoMudar={(i) => armazem.alterarPerfil({ capa: i })}
                acervo={imagens}
              />
              <p className="prod-campo-nota">
                Sem capa própria, vale a foto semeada. Campo em branco sempre volta para o
                que a semente diz.
              </p>
            </section>

            <section className="prod-secao">
              <h2 className="prod-secao-titulo">Regras</h2>

              <Campo rotulo="Quem publica">
                <select
                  value={armazem.perfil.quemPublica}
                  onChange={(e) =>
                    armazem.alterarPerfil({
                      quemPublica: e.target.value as "so-a-casa" | "quem-segue",
                    })
                  }
                  className="prod-campo-entrada"
                  data-quem-publica
                >
                  <option value="so-a-casa">Só a casa</option>
                  <option value="quem-segue">Quem segue a comunidade</option>
                </select>
              </Campo>

              <label className="prod-dimensao">
                <input
                  type="checkbox"
                  checked={armazem.perfil.comentariosAbertos}
                  onChange={(e) =>
                    armazem.alterarPerfil({ comentariosAbertos: e.target.checked })
                  }
                  data-comentarios-abertos
                />
                <span className="prod-dimensao-rotulo">Comentários abertos</span>
              </label>
              <p className="prod-campo-nota">
                As duas regras ficam gravadas e valem para esta gestão. A tela pública da
                publicação ainda não as lê: é código do outro ramo, e mexer nele custaria
                a fidelidade que o porte comprou.
              </p>
            </section>

            <section className="prod-secao">
              <h2 className="prod-secao-titulo">Alcance</h2>
              <div className="prod-inicio-stats" data-alcance-da-comunidade>
                <span className="prod-inicio-stat">
                  <strong>{assinantes.toLocaleString("pt-BR")}</strong>
                  <span>assinantes, de cenário</span>
                </span>
                <span className="prod-inicio-stat">
                  <strong>{daComunidade.length}</strong>
                  <span>publicações no ar</span>
                </span>
                <span className="prod-inicio-stat">
                  <strong>{reacoes}</strong>
                  <span>reações somadas</span>
                </span>
              </div>
              <p className="prod-campo-nota">
                O número de assinantes é escrito no dado, não medido: não há usuários neste
                protótipo. Reações e {comentarios} comentários são os do acervo mais o que
                aconteceu neste navegador.
              </p>
            </section>

            <section className="prod-secao">
              <h2 className="prod-secao-titulo">Recomeçar</h2>
              {aLimpar ? (
                <>
                  <p className="prod-campo-nota">
                    Apaga o nome, a chamada, a descrição e a capa que você escreveu. As
                    publicações que já foram ao ar continuam no ar, e a comunidade volta a
                    se chamar {semente.nome}.
                  </p>
                  <div className="prod-registro-acoes">
                    <BotaoDoStudio
                      curto
                      aoClicar={() => {
                        armazem.limpar();
                        setALimpar(false);
                      }}
                      data-confirmar-limpar-comunidade
                    >
                      Apagar a gestão
                    </BotaoDoStudio>
                    <BotaoDoStudio curto aoClicar={() => setALimpar(false)}>
                      Cancelar
                    </BotaoDoStudio>
                  </div>
                </>
              ) : (
                <BotaoDoStudio
                  curto
                  aoClicar={() => setALimpar(true)}
                  data-limpar-comunidade
                >
                  Voltar ao que a semente diz
                </BotaoDoStudio>
              )}
            </section>
          </>
        ) : (
          <>
            <div className="prod-linha-de-acao">
              <BotaoDoStudio
                aoClicar={abrirNova}
                desabilitado={restam <= 0}
                porQueDesabilitado="Os endereços reservados para publicação acabaram nesta demonstração."
                data-nova-publicacao
              >
                + Publicar na comunidade
              </BotaoDoStudio>
            </div>

            {minhas.length === 0 ? (
              <div className="prod-vazio">
                <p className="prod-vazio-frase">
                  Você ainda não publicou nada aqui. O que você postar entra no topo do
                  feed, junto do que já existe.
                </p>
              </div>
            ) : (
              <section className="prod-secao">
                <h2 className="prod-secao-titulo">Suas publicações</h2>
                {minhas.map((p) => (
                  <div
                    className="prod-vinculo"
                    key={p.id}
                    data-publicacao-do-produtor={p.id}
                  >
                    <span className="prod-registro-corpo">
                      <strong className="prod-registro-titulo">
                        {p.titulo || "(sem título)"}
                      </strong>
                      <span className="prod-registro-meta">
                        {p.reacoes} reações · {totalDeComentarios(p)} comentários · hoje
                      </span>
                    </span>
                    <span className="prod-registro-acoes">
                      <Link
                        href={`/studio/comunidade/publicacao/${p.id}/`}
                        className="prod-botao"
                        data-porte="curto"
                        data-acao="ver-publicacao"
                      >
                        ver
                      </Link>
                      <BotaoDoStudio
                        curto
                        aoClicar={() => abrirEdicao(p)}
                        data-acao="editar-publicacao"
                      >
                        editar
                      </BotaoDoStudio>
                      <BotaoDoStudio
                        curto
                        aoClicar={() => setAApagar(p.id)}
                        data-acao="apagar-publicacao"
                      >
                        apagar
                      </BotaoDoStudio>
                    </span>
                  </div>
                ))}
              </section>
            )}

            {aApagar !== null ? (
              <section className="prod-secao">
                <div className="prod-impedimentos" data-alcance-de-apagar>
                  <p className="prod-impedimentos-frase">
                    Apagar «{publicacaoAApagar?.titulo || aApagar}» tira a publicação do
                    feed e de quem a guardou.
                  </p>
                  <p className="prod-impedimento-texto">
                    Não há como desfazer: as reações e os {" "}
                    {publicacaoAApagar ? totalDeComentarios(publicacaoAApagar) : 0}{" "}
                    comentários somem com ela.
                  </p>
                </div>
                <div className="prod-registro-acoes">
                  <BotaoDoStudio
                    curto
                    aoClicar={() => apagar(aApagar)}
                    data-confirmar-apagar-publicacao
                  >
                    Apagar mesmo assim
                  </BotaoDoStudio>
                  <BotaoDoStudio curto aoClicar={() => setAApagar(null)}>
                    Cancelar
                  </BotaoDoStudio>
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>

      {/* ---- a folha da publicação ---- */}
      <Folha
        aberta={rascunho !== null}
        titulo={jaNoAr ? "Editar publicação" : "Publicar na comunidade"}
        descricao="É o que aparece no feed de quem assina a comunidade."
        aoFechar={() => setEmEdicao(null)}
        rodape={
          <BotaoDoStudio
            primaria
            desabilitado={!podePublicar}
            porQueDesabilitado="Precisa de título e de uma imagem com crédito e texto alternativo."
            aoClicar={publicar}
            data-publicar-na-comunidade
          >
            {jaNoAr ? "Salvar" : "Publicar"}
          </BotaoDoStudio>
        }
      >
        {rascunho !== null ? (
          <>
            <div className="prod-impedimentos" data-alcance-da-publicacao>
              <p className="prod-impedimentos-frase">
                {assinantes.toLocaleString("pt-BR")} pessoas assinam esta comunidade. A
                publicação entra no topo do feed.
              </p>
              <p className="prod-impedimento-texto">
                O número de assinantes é de cenário, escrito no dado: não há usuários neste
                protótipo, e o que a tela prova é o mecanismo.
              </p>
            </div>

            <Campo rotulo="Título" obrigatorio>
              <input
                type="text"
                value={rascunho.titulo}
                onChange={(e) =>
                  armazem.alterarRascunho(rascunho.id, { titulo: e.target.value })
                }
                className="prod-campo-entrada"
                data-titulo-publicacao
                aria-invalid={rascunho.titulo.trim() === ""}
              />
            </Campo>

            <Campo rotulo="Texto">
              <textarea
                value={rascunho.corpo}
                onChange={(e) =>
                  armazem.alterarRascunho(rascunho.id, { corpo: e.target.value })
                }
                rows={5}
                className="prod-campo-entrada"
                data-corpo-publicacao
              />
            </Campo>

            <Campo rotulo="Etiqueta" nota="Uma palavra, no canto do cartão.">
              <input
                type="text"
                value={rascunho.etiqueta}
                onChange={(e) =>
                  armazem.alterarRascunho(rascunho.id, { etiqueta: e.target.value })
                }
                className="prod-campo-entrada"
                data-etiqueta-publicacao
              />
            </Campo>

            <CampoDeImagem
              rotulo="Imagem"
              obrigatoria
              imagem={rascunho.imagem ?? imagemVazia()}
              aoMudar={(i) => armazem.alterarRascunho(rascunho.id, { imagem: i })}
              acervo={imagens}
            />
          </>
        ) : null}
      </Folha>
    </>
  );
}
