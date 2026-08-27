"use client";

import { useMemo, useState } from "react";
import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { Folha } from "@/componentes/base/folha";
import { normalizar } from "@/dados/indice";

/**
 * base/seletor-de-catalogo.tsx, escolher termos de um vocabulário controlado.
 *
 * NUNCA UM `<select>` NATIVO. São 94 temas, 33 linguagens, 22 categorias editoriais: num
 * `<select multiple>` de telefone isso é uma lista de rolagem sem busca, e a pessoa desiste
 * na terceira tentativa de achar «questões indígenas». A folha traz busca, contagem e o
 * botão de confirmar, e é a mesma folha que a web usa como painel lateral.
 *
 * TERMO LIVRE VIRA PROPOSTA, E NÃO TEXTO. Digitar «teatro físico» quando o vocabulário não
 * o tem não pode nem travar a pessoa nem sujar o vocabulário: o termo entra marcado como
 * PROPOSTO, segue junto com o registro, e a porta do Editor (130) é nomeada na tela. É o
 * §8 da ontologia, nenhuma porta é beco sem saída.
 *
 * A COR DA LINGUAGEM VEM DO DADO. `vocabulario.json` guarda o NOME do token CSS
 * (`"--ic-lilas"`), nunca o hex, é isso que faz a cor ser dado e não estilo (D-08). Um mapa
 * linguagem→cor escrito aqui seria uma segunda fonte de verdade, e a primeira regeração do
 * grafo faria as duas divergirem.
 */

export interface TermoDoCatalogo {
  id: string;
  rotulo: string;
  /** Nome do token CSS, quando o vocabulário declara cor. Nunca o hex. */
  cor?: string | null;
  /** Quantos registros do acervo o usam. Mostrado ao lado, recorte vazio é beco. */
  usos?: number;
}

export interface PropsSeletor {
  /** O nome do catálogo, «Linguagens», «Temas». Vira o título da folha. */
  nome: string;
  termos: readonly TermoDoCatalogo[];
  /** Os ids escolhidos. */
  escolhidos: readonly string[];
  aoMudar: (ids: string[]) => void;
  /** Os termos digitados fora do vocabulário. */
  propostos?: readonly string[];
  aoPropor?: (termos: string[]) => void;
  /** `false` quando o catálogo é fechado, o botão de propor some e a tela diz por quê. */
  aceitaProposta?: boolean;
  porQueFechado?: string;
  /** Um só, em vez de vários. Usado por seção editorial e formato. */
  unico?: boolean;
}

export function SeletorDeCatalogo({
  nome,
  termos,
  escolhidos,
  aoMudar,
  propostos = [],
  aoPropor,
  aceitaProposta = true,
  porQueFechado,
  unico = false,
}: PropsSeletor) {
  const [aberta, setAberta] = useState(false);
  const [busca, setBusca] = useState("");

  const porId = useMemo(() => new Map(termos.map((t) => [t.id, t])), [termos]);

  const filtrados = useMemo(() => {
    const t = normalizar(busca).trim();
    if (t === "") return termos;
    return termos.filter((x) => normalizar(x.rotulo).includes(t));
  }, [termos, busca]);

  // O que a busca não achou e que também não é termo do vocabulário: o candidato a
  // proposta. Só aparece quando há texto digitado e nenhum casamento exato.
  const candidato = useMemo(() => {
    const cru = busca.trim();
    if (cru.length < 2) return null;
    const jaExiste = termos.some((t) => normalizar(t.rotulo) === normalizar(cru));
    const jaProposto = propostos.some((p) => normalizar(p) === normalizar(cru));
    return jaExiste || jaProposto ? null : cru;
  }, [busca, termos, propostos]);

  function alternar(id: string) {
    if (unico) {
      aoMudar(escolhidos.includes(id) ? [] : [id]);
      return;
    }
    aoMudar(
      escolhidos.includes(id)
        ? escolhidos.filter((x) => x !== id)
        : [...escolhidos, id],
    );
  }

  const total = escolhidos.length + propostos.length;

  return (
    <>
      <button
        type="button"
        className="prod-abrir-catalogo"
        onClick={() => setAberta(true)}
        data-abrir-catalogo={nome}
      >
        <span className="prod-abrir-catalogo-rotulo">
          {total === 0 ? `Escolher ${nome.toLowerCase()}` : `${total} escolhido(s)`}
        </span>
        <span className="prod-abrir-catalogo-seta" aria-hidden>
          ▸
        </span>
      </button>

      {/* Os escolhidos ficam à vista FORA da folha. Uma escolha que só existe dentro de um
          painel fechado é uma escolha que a pessoa não confere antes de publicar. */}
      {total > 0 ? (
        <ul className="prod-escolhidos" data-escolhidos={nome}>
          {escolhidos.map((id) => {
            const t = porId.get(id);
            return (
              <li key={id}>
                <button
                  type="button"
                  className="prod-termo"
                  style={t?.cor ? ({ "--cor-termo": `var(${t.cor})` } as React.CSSProperties) : undefined}
                  data-tem-cor={t?.cor ? "sim" : "nao"}
                  onClick={() => alternar(id)}
                  aria-label={`remover ${t?.rotulo ?? id}`}
                >
                  {t?.rotulo ?? id}
                  <span aria-hidden>✕</span>
                </button>
              </li>
            );
          })}
          {propostos.map((p) => (
            <li key={`proposto:${p}`}>
              <button
                type="button"
                className="prod-termo"
                data-proposto="sim"
                onClick={() => aoPropor?.(propostos.filter((x) => x !== p))}
                aria-label={`remover a proposta ${p}`}
                title="Termo proposto, aguardando o Editor / Curador (130)"
              >
                {p}
                <span aria-hidden>✕</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <Folha
        aberta={aberta}
        titulo={nome}
        descricao={
          unico
            ? `Escolha um. ${termos.length} disponíveis.`
            : `${termos.length} disponíveis. Escolha quantos quiser.`
        }
        aoFechar={() => {
          setAberta(false);
          setBusca("");
        }}
        rodape={
          <BotaoDoStudio
            primaria
            aoClicar={() => {
              setAberta(false);
              setBusca("");
            }}
            data-confirmar-catalogo={nome}
          >
            Confirmar{total > 0 ? ` (${total})` : ""}
          </BotaoDoStudio>
        }
      >
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder={`buscar em ${termos.length} termos`}
          className="prod-campo-entrada"
          data-busca-catalogo
          aria-label={`buscar em ${nome}`}
        />

        {filtrados.length === 0 && !candidato ? (
          <p className="prod-campo-nota">
            Nenhum termo casa com «{busca}». Apague parte do texto para ver a lista inteira.
          </p>
        ) : null}

        <ul className="prod-opcoes">
          {filtrados.map((t) => {
            const marcado = escolhidos.includes(t.id);
            return (
              <li key={t.id}>
                <button
                  type="button"
                  className="prod-opcao"
                  data-marcado={marcado ? "sim" : "nao"}
                  data-termo={t.id}
                  aria-pressed={marcado}
                  onClick={() => alternar(t.id)}
                >
                  <span className="prod-opcao-marca" aria-hidden>
                    {marcado ? "✓" : ""}
                  </span>
                  <span
                    className="prod-opcao-rotulo"
                    style={t.cor ? ({ "--cor-termo": `var(${t.cor})` } as React.CSSProperties) : undefined}
                    data-tem-cor={t.cor ? "sim" : "nao"}
                  >
                    {t.rotulo}
                  </span>
                  {typeof t.usos === "number" ? (
                    <span className="prod-opcao-usos">{t.usos}</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>

        {/* A PROPOSTA. Ela não trava e não suja: o termo entra marcado, segue junto, e a
            porta responsável é nomeada aqui mesmo. */}
        {candidato && aceitaProposta && aoPropor ? (
          <button
            type="button"
            className="prod-propor"
            onClick={() => {
              aoPropor([...propostos, candidato]);
              setBusca("");
            }}
            data-propor-termo
          >
            <strong>Propor «{candidato}»</strong>
            <span>
              Ele segue junto com o registro, marcado como proposto, e não impede publicar. A
              decisão é do Editor / Curador (130).
            </span>
          </button>
        ) : null}

        {!aceitaProposta && porQueFechado ? (
          <p className="prod-campo-nota" data-catalogo-fechado>
            Este catálogo é fechado. {porQueFechado}
          </p>
        ) : null}
      </Folha>
    </>
  );
}
