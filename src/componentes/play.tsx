"use client";

import Link from "next/link";
import { PublicadoPeloProdutor } from "@/componentes/publicado-pelo-produtor";
import {
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { AcoesDoCartaz } from "@/componentes/base/acoes-do-cartaz";
import { Chip, Estante } from "@/componentes/base/chip";
import {
  ICONE_ACONTECE,
  ICONE_APPS,
  ICONE_CAST,
  ICONE_CONFERIDO,
  ICONE_FICHA,
  ICONE_MAIS,
  ICONE_MUSEU,
  ICONE_NOTICIAS,
  ICONE_ONDA,
  ICONE_PLAY,
  ICONE_TOCAR,
} from "@/componentes/base/icones";
import {
  CHAVE_LISTA_PLAY,
  CHAVE_VISTOS_PLAY,
  useMinhaLista,
  useVistos,
} from "@/componentes/base/minha-lista";
import { CapaSemImagem } from "@/componentes/capa-sem-imagem";
import { Grafismo } from "@/componentes/grafismo";
import {
  creditoQueCredita,
  diaParaIso,
  diaParaTexto,
  DIMENSOES_DO_FILTRO,
  expandirItem,
  ROTULOS_DE_DIMENSAO,
  type CatalogoNoFio,
  type DestaqueNoFio,
  type DimensaoContada,
  type ItemDoPlayNoCliente,
} from "@/dados/play-wire";
import type { DimensaoAcessibilidade } from "@/dados/tipos";

/**
 * play.tsx — Play, a vitrine de streaming do acervo (D-92, `docs/telas.md` tela 19).
 *
 * POR QUE ESTA TELA EXISTE NA PROPOSTA. Ela sustenta dois argumentos ao mesmo tempo: o da
 * gratuidade e o da escala nacional onde não há equipamento cultural. É a resposta para as
 * regiões que o mapa de desertos mostra vazias — quando não há teatro na cidade, o que
 * existe é isto.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * REFORMULAÇÃO DE 23/08 — A TELA VIRA VITRINE, no molde de Netflix e Apple TV.
 *
 * A decisão é da reunião: «esse play aí pode ser bem dizer um clone da Netflix», «como
 * se já fosse logado», com destaque em cima e as fileiras embaixo. A forma anterior era
 * uma lista vertical de miniaturas de 88px, que entregava três itens por rolagem e não
 * dizia a ninguém que ali havia 113 coisas para assistir.
 *
 * O QUE ESTA TELA COPIA, e o que ela se recusa a copiar:
 *
 * **COPIA A FORMA.** Peça de destaque sangrando no topo, prateleiras horizontais, cartaz
 * em pé, e a troca de fileira para grade quando alguém escolhe um recorte. É vocabulário
 * que a pessoa já sabe operar sem aprender nada — a regra que a reunião fixou («vamos
 * evitar reinventar a roda»).
 *
 * **TRÊS PORTES DE FILEIRA** (pedido de 23/08: «se não vira lista gigante sem alma»). A
 * primeira é a maior e ganha cartaz grande; as de menos de {@link LIMIAR_COMPACTO} viram
 * LISTA; o resto é trilho. Quem entra em cada porte é POSIÇÃO E TAMANHO, os dois
 * derivados — a referência nunca desenha todas as fileiras iguais, e três fileiras
 * idênticas de 63, 46 e 4 era o que esta tela tinha antes.
 *
 * **NÃO COPIA O QUE SERIA MENTIRA.** Não há «Top 10», não há «Em alta», não há «porque
 * você assistiu». As três coisas dependem de dado de uso, e este acervo não tem nenhum:
 * inventá-lo para encher fileira seria autorar um fato sobre o Itaú Cultural, que é a
 * linha que este projeto não cruza desde a fase 1. As fileiras saem de campo declarado —
 * o nome repetido no título, o tema, a categoria (`prateleiras.ts`) — e o destaque é
 * simplesmente A MAIS RECENTE, que é ordem, não curadoria fabricada.
 *
 * **AS 113 CONTINUAM TODAS NA TELA.** As prateleiras são uma PARTIÇÃO do recorte de
 * streaming: cada mídia aparece em exatamente uma fileira, e as fileiras somam 113. Não
 * há `slice`, não há teto de exibição, não há item inalcançável — o mesmo compromisso que
 * o Cast assumiu ao acabar com o corte de 60. É por isso que não existe uma fileira
 * «novidades» nem uma fileira «com Libras»: as duas seriam o mesmo item aparecendo duas
 * vezes, e aí a soma das fileiras deixaria de ser o tamanho do acervo.
 *
 * **O CARTAZ É NOSSO DE PROPÓSITO.** O acervo não tem key art — tem fotografia larga com
 * o assunto fora do centro. Fechá-la num 2:3 de pôster decepa o assunto. Então o cartaz é
 * COMPOSTO: foto em 3:2, sem crop destrutivo, e uma faixa tipográfica da casa embaixo.
 * A forma é de streaming; a capa é deste design system, e isso se vê.
 *
 * **O BOTÃO NÃO DIZ «ASSISTIR».** O acervo traz a ficha e a capa, não o arquivo — e é a
 * página do player que explica isso por extenso. Um botão de play sobre nada seria a
 * mentira mais barata desta tela, do mesmo jeito que «ouvir» seria no Cast.
 * ─────────────────────────────────────────────────────────────────────────────────────
 *
 * ONDE ESTA TELA PODERIA MENTIR MAIS FÁCIL, e o que impede:
 *
 * 1. **O FILTRO DE ACESSIBILIDADE.** A tela 19 pede legenda, Libras e audiodescrição como
 *    se fossem três recortes equivalentes. Medido no acervo: Libras recorta 3 de 113 e os
 *    outros dois recortam ZERO. Os três aparecem, os dois zerados carregam
 *    `data-nao-sustenta`, e marcá-los devolve um vazio explicado em vez de um vazio mudo
 *    (D-90, D-91). As 3 com Libras ganham selo no próprio cartaz: o argumento aparece na
 *    parede, não só no chip. O NÚMERO ao lado do rótulo saiu em 25/08 (pedido do cliente,
 *    ver «AS CONTAGENS SAÍRAM DA TELA» abaixo) — a declaração do que não se sustenta
 *    passou a ser inteiramente do `data-nao-sustenta` e do vazio explicado.
 *
 * 2. **A PONTE COM EVENTO.** «Não pode ir? veja isto» é sustentado por 14 das 529, não
 *    pelas 529. O bloco declara o denominador em vez de fingir cobertura. É PROIBIDO
 *    autorar aresta mídia→evento para inflar o número (T-05-34).
 *
 * 3. **O CORTE DO RESUMO.** O resumo não cabe no orçamento do catálogo e não viaja nele.
 *    Ele aparece por inteiro na página de cada mídia; o destaque é a exceção medida — UM
 *    resumo custa ~200 bytes e ele é a peça que abre a tela. O porquê do corte está em
 *    `play.ts`, não na tela.
 *
 * A TELA NÃO SE EXPLICA (pedido de 23/08). Os parágrafos que justificavam o recorte, o
 * custo em bytes e o descarte de storage saíram do JSX. Eles viviam abaixo do conteúdo e
 * faziam a tela falar de si.
 *
 * AS CONTAGENS SAÍRAM DA TELA (pedido de 25/08, sobre esta tela). Saíram QUATRO coisas,
 * todas números: a linha «Série · a mais recente do acervo · 14.04.2025» sob a marca do
 * destaque; a linha «113 mídias para assistir, de graça · acervo do Itaú Cultural»; o
 * número dentro de cada chip — de categoria e de recurso de acessibilidade («3 de 113»);
 * e o número ao lado do título de cada prateleira («IC para crianças 29»), junto com o
 * «Ver 29 →», que virou «Ver tudo →».
 *
 * É a mesma direção do pedido de 23/08, um passo adiante: a vitrine mostra o acervo em
 * vez de contá-lo. O QUE NÃO MUDOU é o compromisso debaixo dos números — as 113 continuam
 * TODAS na parede, as prateleiras continuam sendo uma PARTIÇÃO que soma o total, e os
 * dois recursos que o acervo não sustenta continuam declarando `data-nao-sustenta` antes
 * de qualquer gesto. O que era prova POR ESCRITO virou prova POR MEDIÇÃO: o portão de
 * `verificar-fase5.mjs` conta o DOM onde antes lia o rótulo. Os números medidos que
 * sobraram na tela são os do RECORTE — «12 de 113 — séries» —, que não são vitrine: são
 * a resposta a um gesto que a pessoa acabou de fazer.
 *
 * DP-F: este é um `"use client"` e por isso NÃO alcança `@/dados/play` nem
 * `@/dados/grafo`, nem transitivamente. O DTO chega por propriedade, e o vocabulário
 * posicional vem de `play-wire.ts`, que não importa nada por valor.
 */

/**
 * A chave da conclusão, no espaço `agenda-cultural:`. É ESTE arquivo e `player.tsx` que a
 * conhecem — `src/contexto/sessao.tsx` é compartilhado com a fase inteira e não foi
 * tocado. O registro é um CONJUNTO de slugs de mídia: concluir a mesma duas vezes deixa
 * uma entrada.
 */
export const CHAVE_CONCLUIDAS = "agenda-cultural:play-concluidas";

/**
 * Lista de strings guardada como JSON, no molde de `lerLista` de `sessao.tsx`.
 *
 * T-05-37: o valor vem de storage EDITÁVEL por quem avalia. Valor que não é lista devolve
 * lista vazia e a tela continua de pé; item que não é string é descartado. O que a tela
 * não faz é propagar lixo para dentro do catálogo.
 */
export function lerConcluidas(): string[] {
  try {
    const bruto = window.localStorage.getItem(CHAVE_CONCLUIDAS);
    if (!bruto) return [];
    const valor: unknown = JSON.parse(bruto);
    if (!Array.isArray(valor)) return [];
    return valor.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
}

export function gravarConcluidas(slugs: string[]) {
  try {
    window.localStorage.setItem(CHAVE_CONCLUIDAS, JSON.stringify(slugs));
  } catch {
    // Storage bloqueado (modo privado, iframe): persistir é conveniência, não requisito.
  }
}

/** «Todas» não é uma categoria do acervo — é a ausência de recorte. */
const SEM_RECORTE = "";

/**
 * Abaixo disto a fileira vira LISTA em vez de trilho. Oito: até aí a fileira cabe
 * INTEIRA na lista — quatro linhas em duas colunas na web —, e mostrar tudo de uma vez
 * é melhor que pedir o gesto de rolar meio palmo. O trilho existe para o que não cabe.
 */
const LIMIAR_COMPACTO = 8;

const ICONE_DA_CATEGORIA: Record<string, ReactNode> = {
  podcasts: ICONE_CAST,
  series: ICONE_PLAY,
  videos: ICONE_TOCAR,
  noticias: ICONE_NOTICIAS,
  entrevista: ICONE_ONDA,
  colunistas: ICONE_FICHA,
  playlists: ICONE_ONDA,
  "agenda-cultural": ICONE_ACONTECE,
  acervos: ICONE_MUSEU,
};

/**
 * O cartaz — a unidade da parede, usada IGUAL no trilho e na grade.
 *
 * Um vocabulário só para os dois lugares não é economia de código: é o que impede que a
 * fileira e a grade divirjam de aparência e a tela passe a ter dois cartões para a mesma
 * coisa, que é exatamente a dívida que a primitiva `Chip` veio pagar.
 */
function Cartaz({
  item,
  naLista,
  aoAlternarLista,
  aoAbrir,
}: {
  item: ItemDoPlayNoCliente;
  naLista: boolean;
  aoAlternarLista: () => void;
  /** Registra que a pessoa abriu este item — alimenta «Continuar assistindo». */
  aoAbrir?: (slug: string) => void;
}) {
  return (
    <li data-midia={item.slug} data-categoria-do-item={item.categoria}>
      {/* O CARTAZ DEIXOU DE SER UM LINK E VIROU UM ARTIGO COM UM LINK DENTRO (23/08).
          Ele ganhou dois controles no hover, e `<button>` dentro de `<a>` é HTML inválido:
          o teclado alcança o botão e o clique cai no link. Agora o link cobre o cartão por
          `::after` (ver `play.css`) e os controles sobem por cima dele. Um link e dois
          botões, cada um fazendo o que diz. */}
      <article className="play-cartaz">
        <span className="play-cartaz-quadro">
          {item.imagem ? (
            /* `alt=""`: o título está logo abaixo, como texto, dentro do mesmo link.
               Repeti-lo no alt faria o leitor de tela anunciar a mesma frase duas vezes
               por cartaz, 113 vezes.

               `next/image` está fora do projeto por decisão registrada em
               `capa-sem-imagem.tsx`: sob `output: "export"` com `images.unoptimized`
               ele só acrescentaria peso ao pacote. */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imagem}
              alt=""
              loading="lazy"
              decoding="async"
              className="play-cartaz-foto"
            />
          ) : (
            <CapaSemImagem
              titulo={item.titulo}
              classe="midia"
              rotulo={item.rotuloCategoria}
              linguagens={item.linguagens}
              className="size-full"
            />
          )}
          {item.acessibilidade.libras ? (
            <span className="play-cartaz-selo tipo-micro">Libras</span>
          ) : null}

          <AcoesDoCartaz
            rota={item.rota}
            titulo={item.titulo}
            naLista={naLista}
            aoAlternarLista={aoAlternarLista}
            className="play-cartaz-acoes"
          />
        </span>
        <span className="play-cartaz-faixa">
          <span className="play-cartaz-tipo tipo-micro">{item.rotuloCategoria}</span>
          {/* É ESTE link que cobre o cartaz inteiro, por `::after`. Ele fica no TÍTULO
              porque é o título que um leitor de tela deve anunciar ao chegar nele. */}
          <Link
            href={item.rota}
            className="play-cartaz-titulo tipo-detalhe"
            onClick={() => aoAbrir?.(item.slug)}
          >
            {item.titulo}
          </Link>
        </span>
      </article>
    </li>
  );
}

/**
 * A LINHA da fileira compacta — capa pequena à esquerda, título e data à direita.
 *
 * O terceiro porte de fileira, e o motivo de ele existir: «playlist» tem 4 mídias e
 * «quem traduziu?» tem 4. Quatro cartazes num trilho que não rola leem como fileira
 * quebrada; em lista, quatro itens são quatro itens.
 */
function Linha({ item }: { item: ItemDoPlayNoCliente }) {
  return (
    <li data-midia={item.slug} data-categoria-do-item={item.categoria}>
      <Link href={item.rota} className="play-linha">
        <span className="play-linha-quadro">
          {item.imagem ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imagem}
              alt=""
              loading="lazy"
              decoding="async"
              className="play-linha-foto"
            />
          ) : (
            <CapaSemImagem
              titulo={item.titulo}
              classe="midia"
              rotulo={item.rotuloCategoria}
              linguagens={item.linguagens}
              className="size-full"
            />
          )}
        </span>
        <span className="play-linha-texto">
          <span className="play-linha-titulo tipo-detalhe">{item.titulo}</span>
          <span className="play-linha-pe tipo-micro">
            {item.rotuloCategoria} ·{" "}
            <time dateTime={diaParaIso(item.dia)}>{diaParaTexto(item.dia)}</time>
          </span>
        </span>
      </Link>
    </li>
  );
}

export function Play({
  catalogo,
  destaque,
  dimensoes,
}: {
  catalogo: CatalogoNoFio;
  destaque: DestaqueNoFio;
  dimensoes: readonly DimensaoContada[];
}) {
  const [categoria, setCategoria] = useState<string>(SEM_RECORTE);
  const [fileira, setFileira] = useState<string>(SEM_RECORTE);
  const [dimensoesMarcadas, setDimensoesMarcadas] = useState<DimensaoAcessibilidade[]>([]);
  const [concluidas, setConcluidas] = useState<string[]>([]);
  const [hidratado, setHidratado] = useState(false);
  const minhaLista = useMinhaLista(CHAVE_LISTA_PLAY);
  const vistos = useVistos(CHAVE_VISTOS_PLAY);

  // A leitura do storage mora no efeito, nunca no primeiro render: sob `output: "export"`
  // o HTML é gerado no build e ler `localStorage` no render divergiria da hidratação.
  useEffect(() => {
    setConcluidas(lerConcluidas());
    setHidratado(true);
  }, []);

  // As tuplas viram objetos UMA vez. O que viajou foi a posição; expandir é de graça.
  const itens = useMemo(
    () => catalogo.itens.map((f) => expandirItem(f, catalogo.categorias, catalogo.linguagens)),
    [catalogo],
  );

  const porSlug = useMemo(() => new Map(itens.map((i) => [i.slug, i])), [itens]);

  /**
   * A lista da pessoa, resolvida contra o catálogo — e o `filter(Boolean)` não é cinto de
   * segurança de graça: o storage é EDITÁVEL por quem avalia, e um slug que não existe mais
   * no recorte simplesmente não desenha, em vez de derrubar a fileira.
   */
  const naMinhaLista = useMemo(
    () => minhaLista.slugs.map((s) => porSlug.get(s)).filter((i) => i !== undefined),
    [minhaLista.slugs, porSlug],
  );

  /**
   * O que a pessoa abriu, do mais recente para o mais antigo.
   *
   * NÃO É POSIÇÃO DE REPRODUÇÃO. O acervo não guarda em que segundo alguém parou — a
   * funcionalidade 26 está marcada `não sustentada` por isso, e inventar o número seria
   * fabricar dado. A fileira mostra o que foi aberto, que é real, e o rótulo promete
   * exatamente isso.
   */
  const continuarAssistindo = useMemo(
    () => vistos.slugs.map((s) => porSlug.get(s)).filter((i) => i !== undefined),
    [vistos.slugs, porSlug],
  );

  /**
   * As prateleiras, montadas a partir dos ÍNDICES que o build conferiu — coleção pelo
   * nome no título, tema declarado, e a categoria como fileira de sobra (`prateleiras.ts`).
   * É uma PARTIÇÃO: cada mídia cai em exatamente uma fileira e elas somam o total.
   *
   * TRÊS PORTES, e a regra é POSIÇÃO E TAMANHO — os dois derivados, nenhuma escolha
   * editorial. A primeira é a maior (o build ordena por tamanho) e ganha cartaz grande;
   * as de menos de {@link LIMIAR_COMPACTO} viram lista, porque três cartazes soltos num
   * trilho que não rola leem como fileira quebrada e não como fileira pequena.
   */
  const prateleiras = useMemo(
    () =>
      catalogo.prateleiras.map((p, i) => ({
        ...p,
        midias: p.itens.map((n) => itens[n]).filter(Boolean),
        porte: i === 0 ? "grande" : p.itens.length < LIMIAR_COMPACTO ? "compacta" : "trilho",
      })),
    [catalogo.prateleiras, itens],
  );

  const recortando =
    categoria !== SEM_RECORTE || fileira !== SEM_RECORTE || dimensoesMarcadas.length > 0;

  const recorte = useMemo(() => {
    const base =
      fileira === SEM_RECORTE
        ? itens
        : (prateleiras.find((p) => p.valor === fileira)?.midias ?? []);
    return base.filter((i) => {
      if (categoria !== SEM_RECORTE && i.categoria !== categoria) return false;
      return dimensoesMarcadas.every((d) => i.acessibilidade[d]);
    });
  }, [itens, prateleiras, fileira, categoria, dimensoesMarcadas]);

  /**
   * O que o Player registrou, resolvido contra o catálogo.
   *
   * T-05-37: um slug que NÃO resolve em mídia nenhuma é descartado em silêncio. Até
   * 23/08 o descarte era DECLARADO num parágrafo; ele saiu junto com os outros textos
   * de sistema — o que sobrou é a lista, que é o produto.
   */
  const retomada = useMemo(() => {
    const vistos = new Set<string>();
    const resolvidas: ItemDoPlayNoCliente[] = [];
    for (const slug of concluidas) {
      if (vistos.has(slug)) continue;
      vistos.add(slug);
      const item = porSlug.get(slug);
      if (item) resolvidas.push(item);
    }
    return { resolvidas };
  }, [concluidas, porSlug]);

  const rotuloDoRecorte = [
    fileira === SEM_RECORTE
      ? ""
      : (catalogo.prateleiras.find((p) => p.valor === fileira)?.rotulo ?? fileira),
    categoria === SEM_RECORTE
      ? ""
      : (catalogo.categorias.find((c) => c.valor === categoria)?.rotulo ?? categoria),
  ]
    .filter(Boolean)
    .join(" · ") || "todas as categorias";

  function limparRecorte() {
    setCategoria(SEM_RECORTE);
    setFileira(SEM_RECORTE);
    setDimensoesMarcadas([]);
  }

  return (
    <section data-play className="play">
      {/* O QUE ESTE NAVEGADOR PUBLICOU pelo Studio. Fica ACIMA do conteúdo do build e
          declara que não está no acervo: o protótipo é um artefato estático e não tem
          servidor para receber publicação. Sem este bloco, a jornada do produtor terminaria
          no vazio — ele aperta publicar e a vitrine não muda. */}
      <PublicadoPeloProdutor pauta="play" titulo="Publicado por você nesta demonstração" />
      {/* ------------------------------------------------------- os filtros, no topo
       *
       * TRÊS SELETORES NUMA LINHA, acima do destaque — a forma da referência. Antes eram
       * duas estantes de chips no MEIO da tela, entre o destaque e as prateleiras: elas
       * quebravam a leitura em duas e faziam o recorte parecer um assunto à parte, quando
       * é o controle da vitrine inteira.
       *
       * «NOVIDADES» NÃO ENTROU, e é decisão de dado. Nenhuma das 529 mídias do acervo
       * declara data — não há campo de publicação em `midia`. Um filtro chamado
       * «novidades» ordenando por id de CMS afirmaria recência que a fonte não sustenta,
       * e é exatamente a mentira barata que esta obra recusa. Linguagem entrou no lugar:
       * ela é declarada, medida, e é o recorte que o produto inteiro usa. */}
      <header className="play-filtros">
        <label className="play-filtro">
          <span className="sr-only">Categoria</span>
          <select
            className="filtros-select"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            data-filtro-categoria
          >
            <option value={SEM_RECORTE}>Categoria</option>
            {catalogo.categorias.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.rotulo}
              </option>
            ))}
          </select>
        </label>

        <label className="play-filtro">
          <span className="sr-only">Linguagem</span>
          <select
            className="filtros-select"
            value={fileira}
            onChange={(e) => setFileira(e.target.value)}
            data-filtro-linguagem
          >
            <option value={SEM_RECORTE}>Linguagem</option>
            {prateleiras.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.rotulo}
              </option>
            ))}
          </select>
        </label>

        <label className="play-filtro">
          <span className="sr-only">Acessibilidade</span>
          <select
            className="filtros-select"
            value={dimensoesMarcadas[0] ?? ""}
            onChange={(e) =>
              setDimensoesMarcadas(
                e.target.value ? [e.target.value as DimensaoAcessibilidade] : [],
              )
            }
            data-filtro-acessibilidade
          >
            <option value="">Acessibilidade</option>
            {DIMENSOES_DO_FILTRO.map((campo) => (
              <option key={campo} value={campo}>
                {ROTULOS_DE_DIMENSAO[campo]}
              </option>
            ))}
          </select>
        </label>
      </header>

      {/* ------------------------------------------------------------------ o destaque */}
      <section data-destaque={destaque.slug} className="play-destaque">
        {destaque.imagem ? (
          /* `alt=""`: o título vem logo abaixo como texto, dentro da mesma peça. */
          // eslint-disable-next-line @next/next/no-img-element
          <img src={destaque.imagem} alt="" decoding="async" className="play-destaque-foto" />
        ) : null}
        <span className="play-destaque-veu" aria-hidden />

        {/* O crédito só aparece quando NOMEIA ALGUÉM. «Foto: divulgação» é a etiqueta do
            material de imprensa para «não há autoria a declarar», e ela cobre 175 das 529
            mídias — uma tarja sobre a abertura que não credita ninguém. Quem decide o que
            é crédito de verdade é `creditoQueCredita`, em `play-wire.ts`, com a medição. */}
        {creditoQueCredita(destaque.creditoImagem) ? (
          <span className="play-destaque-credito">
            Foto: {creditoQueCredita(destaque.creditoImagem)}
          </span>
        ) : null}

        <div className="play-destaque-texto">
          {/* O `<h1>` diz ONDE a pessoa está, como nas outras trinta telas. O texto
              grande é o título da mídia, e ele é `<p>`: promovê-lo a cabeçalho daria
              dois `<h1>` à rota e faria a navegação por cabeçalhos anunciar o nome de
              um vídeo no lugar do nome da tela. Mesma escolha de `heroi.tsx`. */}
          <h1 className="play-destaque-marca tipo-titulo-3">
            <Grafismo variacao="barra" className="h-[0.9em] w-auto" />
            Play
          </h1>
          <p className="play-destaque-titulo tipo-cartaz">{destaque.titulo}</p>
          {destaque.resumo ? (
            <p className="play-destaque-resumo tipo-detalhe">{destaque.resumo}</p>
          ) : null}
          {/* OS DOIS BOTÕES DA ABERTURA, sempre visíveis — a abertura não tem hover para
              esconder nada atrás. São o mesmo par da página de um título, com o glifo à
              esquerda do rótulo, e por isso usam o mesmo vocabulário (`.midia-botao`): dois
              desenhos para o mesmo botão em duas telas irmãs divergiriam na primeira
              correção.

              «DAR PLAY» ABRE A PÁGINA DA MÍDIA, DENTRO DO APP — decisão de 23/08. Ela
              chegou a apontar para o site do Itaú Cultural, onde o arquivo realmente está,
              e o cliente pediu o contrário: o gesto tem de continuar dentro do protótipo,
              mesmo sem player do outro lado. É a página do título que recebe — capa
              sangrando, sinopse, a coleção inteira e as semelhantes —, e é lá que o link
              para a fonte existe, com o rótulo dizendo que ele sai daqui. */}
          <div className="play-destaque-acoes">
            <Link
              href={destaque.rota}
              className="midia-botao midia-botao--primario tipo-detalhe"
              aria-label={`Dar play em «${destaque.titulo}»`}
            >
              {ICONE_TOCAR}
              Dar play
            </Link>

            <button
              type="button"
              data-na-lista={minhaLista.tem(destaque.slug) ? "sim" : "nao"}
              aria-pressed={minhaLista.tem(destaque.slug)}
              onClick={() => minhaLista.alternar(destaque.slug)}
              className="midia-botao tipo-detalhe"
            >
              {minhaLista.tem(destaque.slug) ? ICONE_CONFERIDO : ICONE_MAIS}
              {minhaLista.tem(destaque.slug) ? "Na minha lista" : "Adicionar na lista"}
            </button>
          </div>
        </div>
      </section>


      {/* ------------------------------------------------------------------- a vitrine */}
      {recortando ? (
        /* COM RECORTE A FILEIRA VIRA GRADE — a mesma troca que a referência faz ao
           escolher um gênero. Com recorte, a pergunta deixou de ser «o que tem aqui» e
           passou a ser «me mostre tudo isso de uma vez». */
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="tipo-detalhe">
              <strong data-recorte-n className="font-display">
                {recorte.length}
              </strong>{" "}
              de {catalogo.total} — {rotuloDoRecorte}
              {dimensoesMarcadas.length
                ? ` · com ${dimensoesMarcadas.map((d) => ROTULOS_DE_DIMENSAO[d].toLowerCase()).join(" e ")}`
                : ""}
            </p>
            {/* Nenhum recorte é beco: sair dele é sempre um clique, e o clique está do
                lado do número que ele desfaz. */}
            <button
              type="button"
              data-limpar-recorte
              onClick={limparRecorte}
              className="tipo-detalhe cursor-pointer font-bold text-acao-tinta hover:underline hover:underline-offset-4"
            >
              Limpar recorte
            </button>
          </div>

          {recorte.length === 0 ? (
            /* Vazio EXPLICADO — o mesmo compromisso de D-93: nenhum fim de caminho mudo. */
            <p
              data-recorte-vazio
              className="tipo-detalhe rounded-m border border-dashed border-borda-forte p-4"
            >
              Nenhuma das {catalogo.total} mídias atende a esse recorte. Solte uma das
              marcações acima.
            </p>
          ) : (
            <ul className="play-grade">
              {recorte.map((i) => (
                <Cartaz
                  key={i.slug}
                  item={i}
                  naLista={minhaLista.tem(i.slug)}
                  aoAbrir={vistos.registrar}
              aoAlternarLista={() => minhaLista.alternar(i.slug)}
                />
              ))}
            </ul>
          )}
        </section>
      ) : (
        <>
          {/* ------------------------------------------------------------ minha lista
           *
           * A FILEIRA DA PESSOA VEM ANTES DAS DO ACERVO, e só existe quando tem item.
           * Ela é o destino do «+» dos cartazes: sem ela o botão seria uma gaveta sem
           * porta — dá para pôr e não dá para ver. Tirar é o mesmo gesto de pôr, no
           * mesmo cartaz, aqui ou na fileira de origem.
           *
           * ELA NÃO CARREGA `data-prateleira`, e não é descuido: as prateleiras são uma
           * PARTIÇÃO do recorte — cada mídia em exatamente uma fileira, somando o total.
           * Esta é da pessoa e repete de propósito o que já está em outra fileira. */}
          {/* ----------------------------------------------------- continuar assistindo
           *
           * O QUE A PESSOA ABRIU, do mais recente para o mais antigo — e o rótulo promete
           * exatamente isso. NÃO é posição de reprodução: a funcionalidade 26 está marcada
           * `não sustentada` porque o acervo não guarda em que segundo alguém parou, e
           * inventar esse número seria fabricar dado. Abrir de novo traz o item de volta
           * para a frente da fileira.
           *
           * VEM ANTES DE «MINHA LISTA» e das fileiras do acervo: é a única que responde
           * «onde eu estava», e essa pergunta vem antes de «o que tem aqui». */}
          {vistos.hidratado && continuarAssistindo.length ? (
            <section data-continuar={continuarAssistindo.length} className="play-prateleira">
              <div className="play-prateleira-cabecalho">
                <h2 className="play-prateleira-titulo tipo-titulo-3">
                  <Grafismo variacao="barra" className="h-[0.8em] w-auto text-acao-tinta" />
                  Continuar assistindo
                </h2>
              </div>
              <ul className="play-trilho">
                {continuarAssistindo.map((i) => (
                  <Cartaz
                    key={i.slug}
                    item={i}
                    naLista={minhaLista.tem(i.slug)}
                    aoAbrir={vistos.registrar}
                    aoAlternarLista={() => minhaLista.alternar(i.slug)}
                  />
                ))}
              </ul>
            </section>
          ) : null}

          {minhaLista.hidratado && naMinhaLista.length ? (
            <section data-minha-lista={naMinhaLista.length} className="play-prateleira">
              <div className="play-prateleira-cabecalho">
                <h2 className="play-prateleira-titulo tipo-titulo-3">
                  <Grafismo variacao="barra" className="h-[0.8em] w-auto text-acao-tinta" />
                  Minha lista
                </h2>
              </div>
              {!minhaLista.persistida ? (
                <p className="tipo-legenda text-tinta-2">
                  Este navegador não deixou guardar a lista — ela vale só enquanto esta aba
                  estiver aberta.
                </p>
              ) : null}
              <ul className="play-trilho">
                {naMinhaLista.map((i) => (
                  <Cartaz
                    key={i.slug}
                    item={i}
                    naLista
                    aoAbrir={vistos.registrar}
                    aoAlternarLista={() => minhaLista.alternar(i.slug)}
                  />
                ))}
              </ul>
            </section>
          ) : null}

          {/* SEM RECORTE, AS PRATELEIRAS — e elas somam as 113: cada mídia aparece em
              exatamente uma fileira. Nada de `slice`, nada de teto de exibição. */}
          {prateleiras.map((p) => (
          <section
            key={p.valor}
            data-prateleira={p.valor}
            data-porte={p.porte}
            className="play-prateleira"
          >
            <div className="play-prateleira-cabecalho">
              <h2 className="play-prateleira-titulo tipo-titulo-3">
                <Grafismo variacao="barra" className="h-[0.8em] w-auto text-acao-tinta" />
                {p.rotulo}
              </h2>
              <button
                type="button"
                data-ver-tudo={p.valor}
                onClick={() => setFileira(p.valor)}
                className="play-prateleira-tudo tipo-detalhe"
              >
                Ver tudo →
              </button>
            </div>
            {p.porte === "compacta" ? (
              <ul className="play-lista">
                {p.midias.map((i) => (
                  <Linha key={i.slug} item={i} />
                ))}
              </ul>
            ) : (
              <ul className="play-trilho">
                {p.midias.map((i) => (
                  <Cartaz
                    key={i.slug}
                    item={i}
                    naLista={minhaLista.tem(i.slug)}
                    aoAbrir={vistos.registrar}
                    aoAlternarLista={() => minhaLista.alternar(i.slug)}
                  />
                ))}
              </ul>
            )}
          </section>
          ))}
        </>
      )}

      {/* ---------------------------------------------------- já concluídas por você
       *
       * DEPOIS DA VITRINE, e não antes dela. A referência abre com «continue
       * assistindo» porque lá essa lista quase nunca está vazia; aqui ela começa vazia
       * para todo mundo que abre a proposta, e vazia ela é um parágrafo de explicação.
       * Explicação antes de conteúdo era o defeito que esta reformulação veio corrigir.
       *
       * «Já concluídas», e não «continue de onde parou», que era o rótulo antigo: o que
       * esta lista guarda é o que a pessoa MARCOU COMO CONCLUÍDO no player. Não há
       * posição de reprodução no acervo, então prometer retomada era um rótulo que não
       * correspondia ao conteúdo debaixo dele.
       */}
      <section
        data-continue={!hidratado ? "carregando" : retomada.resolvidas.length ? "com-itens" : "vazio"}
        className="flex flex-col gap-2 rounded-m border border-borda p-3"
      >
        <h2 className="tipo-detalhe font-bold">Já concluídas por você</h2>

        {!hidratado ? (
          <p className="tipo-legenda text-tinta-3">Lendo o que ficou guardado neste navegador…</p>
        ) : retomada.resolvidas.length === 0 ? (
          /* Vazio com saída, não sumido: um bloco que desaparece deixa quem avalia sem
             saber se a funcionalidade existe ou se ela quebrou. */
          <p className="tipo-legenda text-tinta-2">
            Nada aqui ainda. Marque uma mídia como concluída na página dela.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {retomada.resolvidas.map((i) => (
              <li key={i.slug}>
                <Link
                  href={i.rota}
                  data-retomada={i.slug}
                  className="tipo-detalhe flex items-baseline gap-2 py-1 underline decoration-borda-forte underline-offset-4 hover:decoration-current"
                >
                  <span className="tipo-micro shrink-0 text-tinta-3">{i.rotuloCategoria}</span>
                  <span className="min-w-0 truncate">{i.titulo}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* O painel «Não pode ir? veja isto» saiu do catálogo em 23/08. Ele mostrava a
          COBERTURA da ponte mídia→evento — «14 das 529 mídias falam de um evento…» — no
          fim da vitrine, para quem veio escolher o que assistir. É prestação de contas
          sobre o acervo, não é escolha de conteúdo, e o lugar dela é o Observatório.
          A ponte em si continua: ela é o que põe as mídias na página do evento
          (`midiasPorEvento` em `play.ts`), e os números continuam MEDIDOS lá. */}
    </section>
  );
}
