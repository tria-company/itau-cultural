import type { Acessibilidade, DimensaoAcessibilidade } from "@/dados/tipos";

/**
 * ficha-acessibilidade.tsx, D-43: as 8 dimensões, sempre as 8, em TRÊS estados.
 *
 * O terceiro estado é o ponto inteiro da decisão: **ausência não é negação**. Uma ficha
 * que mostra «Libras ✗» para um registro que simplesmente não fala de Libras afirma, em
 * nome do Itaú Cultural, que o evento não tinha intérprete. Isso é uma alegação factual
 * que a fonte não faz, e que pode ser falsa. «Não declarado» é a única leitura honesta
 * desse dado, e por isso ele é um estado próprio e não uma variação do «não».
 *
 * COMO OS TRÊS ESTADOS SÃO DECIDIDOS, E POR QUE A REGRA É MEDIDA E NÃO ARBITRADA:
 *
 * O tipo `Acessibilidade` é oito booleanos, e um booleano `false` sozinho é ambíguo, não
 * dá para saber se a fonte disse «não» ou se a fonte não disse nada. A desambiguação vem
 * de fora do booleano, do campo `declaraAcessibilidade` da entidade, que o gerador
 * escreve a partir da FORMA do registro de origem:
 *
 *   - **Registro da agenda do CMS:** dos 100 eventos do CMS, os 100 trazem no JSON bruto o
 *     objeto `accessibility` COMPLETO, com as 8 chaves explícitas (`{"libras": false, …}`).
 *     Nunca parcial: dos 2.534 registros do CMS, 2.514 têm as 8 chaves e 20 não têm o
 *     campo. Onde as 8 vêm, `false` é DECLARAÇÃO DE AUSÊNCIA, a ficha foi preenchida e
 *     disse que não.
 *   - **Registro da Enciclopédia:** a Enciclopédia não tem campo de acessibilidade
 *     nenhum. Aqui `false` é o valor padrão da estrutura, e o estado correto é NÃO
 *     DECLARADO.
 *
 * ESTE COMENTÁRIO JÁ DESCREVEU OUTRA COISA, e a diferença vale registro. Enquanto
 * `dados/normalizar.py` descartava os `false` (`{k: v for … if v}`), a distinção morria
 * antes de `entidades.json` e esta ficha a RECONSTRUÍA do prefixo do id, «começa com
 * `evento:cms:`, então declarou». Funcionava por medição, não por dado: valia porque
 * alguém tinha contado que os 100 eventos do CMS declaram. Para os 20 registros do CMS
 * que não trazem o campo, teria afirmado «declarado ausente» em nome do Itaú Cultural
 * sobre uma ficha que ninguém preencheu. Com o normalizador corrigido e o grafo
 * regerado, a declaração é um fato que vem no registro, e a heurística saiu.
 *
 * O NÚMERO QUE DÁ SENTIDO À DECISÃO: a fonte declara `libras` em 48 entradas e as outras
 * dimensões em uma ou nenhuma. A ficha vai mostrar sobretudo «declarado ausente» e «não
 * declarado», e esse é o resultado correto, é ele que torna visível, em uma tela, o
 * tamanho do buraco de acessibilidade no acervo publicado.
 */

export type EstadoDimensao = "presente" | "ausente-declarada" | "nao-declarada";

/**
 * As 8, na ordem da estrutura da fonte. `Record` completo de propósito: acrescentar
 * dimensão em `tipos.ts` sem escrever o rótulo aqui vira erro de compilação, e não uma
 * ficha que silenciosamente mostra 8 de 9.
 */
const ROTULOS: Record<DimensaoAcessibilidade, string> = {
  audio_description: "Audiodescrição",
  libras: "Libras",
  descriptive_subtitle: "Legenda descritiva",
  closed_caption: "Closed caption",
  open_caption: "Legenda aberta",
  simultaneous_translation: "Tradução simultânea",
  stenotypy: "Estenotipia",
  subtitle: "Legendagem",
};

const DIMENSOES = Object.keys(ROTULOS) as DimensaoAcessibilidade[];

const APARENCIA: Record<EstadoDimensao, { texto: string; classe: string }> = {
  presente: {
    texto: "declarado",
    classe: "border-acao bg-acao text-sobre-acao",
  },
  "ausente-declarada": {
    texto: "declarado ausente",
    classe: "border-tinta-2 text-tinta-2",
  },
  "nao-declarada": {
    texto: "não declarado",
    classe: "border-dashed border-borda-forte text-tinta-3",
  },
};

export function FichaDeAcessibilidade({
  acessibilidade,
  /**
   * O registro de origem preencheu a ficha das 8 dimensões? Vem de
   * `entidade.declaraAcessibilidade`, escrito pelo gerador. É esta prop, e nada dentro
   * do booleano, que separa «declarado ausente» de «não declarado».
   */
  declaraDimensoes,
  fonteDaDeclaracao,
  className,
}: {
  acessibilidade: Acessibilidade;
  declaraDimensoes: boolean;
  fonteDaDeclaracao: string;
  className?: string;
}) {
  const estados = DIMENSOES.map((dimensao) => {
    const estado: EstadoDimensao = acessibilidade[dimensao]
      ? "presente"
      : declaraDimensoes
        ? "ausente-declarada"
        : "nao-declarada";
    return { dimensao, estado };
  });

  const declaradas = estados.filter((e) => e.estado === "presente").length;

  return (
    <section className={`flex flex-col gap-2 ${className ?? ""}`}>
      <h3 className="text-sm font-bold">
        Acessibilidade{" "}
        <span className="text-xs font-normal text-tinta-3">
          {declaradas} de {DIMENSOES.length} recursos declarados
        </span>
      </h3>

      <ul className="flex flex-col gap-1">
        {estados.map(({ dimensao, estado }) => (
          <li
            key={dimensao}
            data-dimensao={dimensao}
            data-estado={estado}
            className="flex items-center justify-between gap-2 border-t border-borda py-1.5 text-sm first:border-t-0"
          >
            <span>{ROTULOS[dimensao]}</span>
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.65rem] font-bold tracking-wide uppercase ${APARENCIA[estado].classe}`}
            >
              {APARENCIA[estado].texto}
            </span>
          </li>
        ))}
      </ul>

      {/* A linha ao pé é o requisito, não o enfeite: sem ela a coluna de «não declarado»
          é lida como uma coluna de «não tem». */}
      <p className="text-xs leading-relaxed text-tinta-2">
        {declaraDimensoes ? (
          <>
            Este registro vem da agenda do Itaú Cultural, que preenche as 8 dimensões: onde
            se lê <strong>declarado ausente</strong>, a ficha da fonte foi preenchida e diz
            que o recurso não é oferecido.
          </>
        ) : (
          <>
            Este registro vem da {fonteDaDeclaracao} e não traz o campo de acessibilidade.
            Onde se lê <strong>não declarado</strong>, o registro não informa, o que não
            quer dizer que o recurso não exista. Ausência de declaração não é negação, e
            não a convertemos em uma.
          </>
        )}
      </p>
    </section>
  );
}
