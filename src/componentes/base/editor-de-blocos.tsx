"use client";

import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { CampoDeImagem } from "@/componentes/base/campo-de-imagem";
import { Campo } from "@/componentes/base/ficha-em-atos";
import { ROTULO_DO_BLOCO, TIPOS_DE_BLOCO, imagemVazia } from "@/dados/tipos-produtor";
import type { BlocoDoCorpo, ImagemDeclarada, TipoDeBloco } from "@/dados/tipos-produtor";

/**
 * base/editor-de-blocos.tsx, o corpo da matéria, em blocos tipados.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A MAIOR LACUNA DE ALIMENTAÇÃO DO PRODUTO: 53 corpos para 1.850 páginas editoriais.
 *
 * O grafo traz CHAMADA, não corpo. O corpo das 53 que têm mora em `dados/bruto/materias/`,
 * coletado; as outras 1.797 abrem com título, chapéu e lead, e nada abaixo. Este editor é
 * o que faz o corpo passar a existir sem um coletor.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * NUNCA HTML CRU. `BlocoCorpo` é uma união fechada de cinco formas, e o que o público lê é
 * renderizado por `materia.tsx` a partir delas, parágrafo vira `<p>`, subtítulo vira
 * `<h2>`, citação vira `<blockquote>`. Aceitar HTML aqui abriria a porta que T-01-02 e
 * T-02-16 fecharam: nenhum HTML atravessa a fronteira do gerador.
 *
 * O BLOCO DE IMAGEM É O SEXTO, E ELE É NOVO. `BlocoCorpo` tem cinco formas; a imagem no
 * meio do corpo não é uma delas, e `materia.tsx` ainda não a renderiza. A ficha o oferece
 * porque é campo que uma redação real precisa, e a tela DECLARA que ele ainda não aparece
 * na página pública, em vez de prometer o que o produto não entrega.
 */

/** Os cinco que `materia.tsx` já renderiza hoje. O sexto, imagem, é declarado. */
const RENDERIZADOS_HOJE: readonly TipoDeBloco[] = [
  "paragrafo",
  "subtitulo",
  "citacao",
  "youtube",
  "spotify",
];

export const IMAGEM_NO_CORPO_AINDA_NAO_APARECE =
  "O bloco de imagem ainda não é renderizado por `materia.tsx`: `BlocoCorpo` tem cinco " +
  "formas, e a imagem no meio do corpo não é uma delas. Ele fica gravado no registro e " +
  "aparece na página quando o renderizador ganhar a sexta forma, dizer isso é melhor do " +
  "que oferecer um campo que some sem explicação.";

export function EditorDeBlocos({
  blocos,
  aoMudar,
  acervoDeImagens,
}: {
  blocos: readonly BlocoDoCorpo[];
  aoMudar: (b: BlocoDoCorpo[]) => void;
  acervoDeImagens: readonly { caminho: string; credito: string; alt: string; de: string }[];
}) {
  function acrescentar(tipo: TipoDeBloco) {
    aoMudar([
      ...blocos,
      { tipo, texto: "", imagem: tipo === "imagem" ? imagemVazia() : null },
    ]);
  }

  function alterar(i: number, m: Partial<BlocoDoCorpo>) {
    aoMudar(blocos.map((b, n) => (n === i ? { ...b, ...m } : b)));
  }

  function mover(i: number, passo: number) {
    const destino = i + passo;
    if (destino < 0 || destino >= blocos.length) return;
    const copia = [...blocos];
    const [item] = copia.splice(i, 1);
    copia.splice(destino, 0, item as BlocoDoCorpo);
    aoMudar(copia);
  }

  const palavras = blocos
    .filter((b) => b.tipo === "paragrafo" || b.tipo === "citacao")
    .reduce((n, b) => n + (b.texto.trim() === "" ? 0 : b.texto.trim().split(/\s+/).length), 0);

  return (
    <div className="prod-editor" data-editor-de-blocos={String(blocos.length)}>
      <p className="prod-campo-nota">
        {blocos.length} bloco(s) · {palavras} palavras. Nunca HTML cru: cada bloco tem uma
        forma, e é a forma que a página sabe renderizar.
      </p>

      {blocos.map((b, i) => (
        <div className="prod-bloco" key={`b${i}`} data-bloco={b.tipo}>
          <div className="prod-bloco-cabeca">
            <span className="prod-bloco-tipo">{ROTULO_DO_BLOCO[b.tipo]}</span>
            <div className="prod-bloco-acoes">
              <BotaoDoStudio
                curto
                aoClicar={() => mover(i, -1)}
                desabilitado={i === 0}
                porQueDesabilitado="Este é o primeiro bloco."
                data-acao="subir-bloco"
              >
                ↑
              </BotaoDoStudio>
              <BotaoDoStudio
                curto
                aoClicar={() => mover(i, 1)}
                desabilitado={i === blocos.length - 1}
                porQueDesabilitado="Este é o último bloco."
                data-acao="descer-bloco"
              >
                ↓
              </BotaoDoStudio>
              <BotaoDoStudio
                curto
                aoClicar={() => aoMudar(blocos.filter((_, n) => n !== i))}
                data-acao="remover-bloco"
              >
                Remover
              </BotaoDoStudio>
            </div>
          </div>

          {b.tipo === "imagem" ? (
            <>
              {/* CRÉDITO OBRIGATÓRIO DENTRO DO CORPO TAMBÉM. Uma foto no meio do texto é
                  tão publicada quanto a capa, e a regra 165 não tem exceção por posição. */}
              <CampoDeImagem
                imagem={b.imagem}
                aoMudar={(x: ImagemDeclarada | null) => alterar(i, { imagem: x })}
                acervo={acervoDeImagens}
                rotulo="Imagem do corpo"
              />
              <Campo rotulo="Legenda">
                <input
                  type="text"
                  value={b.texto}
                  onChange={(e) => alterar(i, { texto: e.target.value })}
                  className="prod-campo-entrada"
                  data-legenda-bloco
                />
              </Campo>
              <p className="prod-campo-nota" data-imagem-nao-renderiza>
                {IMAGEM_NO_CORPO_AINDA_NAO_APARECE}
              </p>
            </>
          ) : b.tipo === "youtube" ? (
            <Campo
              rotulo="Id do YouTube"
              obrigatorio
              nota="Só o id. O iframe continua nascendo depois do clique."
            >
              <input
                type="text"
                value={b.texto}
                onChange={(e) => {
                  const cru = e.target.value.trim();
                  const achado = /(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/.exec(cru);
                  alterar(i, { texto: achado?.[1] ?? cru });
                }}
                className="prod-campo-entrada"
                data-bloco-youtube
                aria-invalid={b.texto.trim() === ""}
              />
            </Campo>
          ) : b.tipo === "spotify" ? (
            <Campo rotulo="URL do Spotify" obrigatorio>
              <input
                type="url"
                value={b.texto}
                onChange={(e) => alterar(i, { texto: e.target.value })}
                className="prod-campo-entrada"
                data-bloco-spotify
                aria-invalid={b.texto.trim() === ""}
              />
            </Campo>
          ) : (
            <Campo rotulo={ROTULO_DO_BLOCO[b.tipo]} obrigatorio>
              <textarea
                value={b.texto}
                onChange={(e) => alterar(i, { texto: e.target.value })}
                rows={b.tipo === "subtitulo" ? 1 : 5}
                className="prod-campo-entrada"
                data-bloco-texto
                aria-invalid={b.texto.trim() === ""}
              />
            </Campo>
          )}
        </div>
      ))}

      <div className="prod-mais-blocos">
        <span className="prod-campo-nota">Acrescentar</span>
        <div className="prod-trilho">
          {TIPOS_DE_BLOCO.map((t) => (
            <button
              key={t}
              type="button"
              className="prod-pauta"
              data-mais-bloco={t}
              data-pronta={RENDERIZADOS_HOJE.includes(t) ? "sim" : "nao"}
              title={
                RENDERIZADOS_HOJE.includes(t)
                  ? `Acrescentar ${ROTULO_DO_BLOCO[t]}`
                  : IMAGEM_NO_CORPO_AINDA_NAO_APARECE
              }
              onClick={() => acrescentar(t)}
            >
              + {ROTULO_DO_BLOCO[t]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
