"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { CampoDeImagem } from "@/componentes/base/campo-de-imagem";
import type { ImagemDoAcervo } from "@/componentes/base/campo-de-imagem";
import { Campo } from "@/componentes/base/ficha-em-atos";
import {
  PREFIXO_DA_PUBLICACAO,
  sementeDoPerfil,
  useComunidadeGerida,
} from "@/componentes/comunidade-estado";
import { usePontos } from "@/contexto/pontos";
import type { PublicacaoDefinida } from "@/lib/pontos/tipos";

/**
 * comunidade-gestao.tsx — a identidade da comunidade.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * ELA TINHA DUAS ABAS E PERDEU UMA (2026-08-28). «As publicações» mostrava a lista do que
 * se tinha postado, com editar e apagar; agora esses gestos moram no PRÓPRIO post, no
 * feed, que é onde a coisa está. Publicar também: é um botão em cima do feed.
 *
 * O QUE SOBRA AQUI É O QUE NÃO CABE NUM POST: o nome que assina todos eles, a capa que
 * abre a tela, a descrição, as regras e o alcance. Identidade é de tela; operação é de
 * gesto.
 *
 * NÃO HÁ BOTÃO DE SALVAR: cada tecla escreve no armazém, a mesma disciplina da ficha em
 * atos. Formulário que só grava no fim é formulário que perde trabalho.
 *
 * ESCOPADA NA COMUNIDADE DA CASA. As outras 21 pertencem a instituições, coletivos e
 * pessoas reais amarradas à Enciclopédia; renomeá-las daqui seria pôr palavra na boca de
 * quem não escreveu.
 * ────────────────────────────────────────────────────────────────────────────
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

        <p className="prod-campo-nota">
          Publicar, editar e apagar moram no próprio feed, em{" "}
          <Link href="/studio/comunidade/" className="prod-link">
            Comunidade
          </Link>
          .
        </p>
      </div>
    </>
  );
}
