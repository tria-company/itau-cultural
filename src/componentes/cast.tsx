"use client";

import Link from "next/link";
import { PublicadoPeloProdutor } from "@/componentes/publicado-pelo-produtor";
import { useEffect, useMemo, useState } from "react";
import { AcoesDoCartaz } from "@/componentes/base/acoes-do-cartaz";
import { Chip, Estante } from "@/componentes/base/chip";
import { CHAVE_LISTA_CAST, useMinhaLista } from "@/componentes/base/minha-lista";
import { CapaSemImagem } from "@/componentes/capa-sem-imagem";
import { Grafismo } from "@/componentes/grafismo";
import { lerConcluidas } from "@/componentes/play";
import type { LinguagemDoCast } from "@/dados/cast-wire";
import {
  diaParaIso,
  diaParaTexto,
  expandirItem,
  type CatalogoNoFio,
  type ItemDoPlayNoCliente,
} from "@/dados/play-wire";

/**
 * cast.tsx — Cast, os 336 podcasts do acervo (`docs/telas.md`, reformulação de
 * 2026-08: o cliente separou streaming, podcast e editorial em portas próprias).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * REFORMULAÇÃO DE 23/08 — A TELA VIRA APP DE ÁUDIO, no molde do Spotify, que é
 * a referência que a reunião mandou. O Play já tinha virado vitrine no molde da
 * Netflix; esta é a mesma decisão, no vocabulário certo para áudio.
 *
 * A tela anterior era uma grade única de 336 cartões em ordem de publicação.
 * Ela era honesta — nada escondido, nada cortado — e mesmo assim não respondia
 * «o que tem aqui»: 336 capas seguidas não têm hierarquia nenhuma, e ninguém
 * descobre que Mekukradjá tem 71 episódios rolando uma parede.
 *
 * **TRÊS PORTES DE FILEIRA, e não um só** (pedido da reunião: «se não vira lista
 * gigante sem alma»). A referência nunca desenha todas as fileiras iguais, e a
 * regra daqui é TAMANHO, não gosto — curadoria fabricada é o que este projeto
 * não faz:
 *
 *   · **destaque** — a MAIOR fileira do acervo, num painel próprio: capa grande,
 *     nome em corpo de título e o trilho dos episódios dentro do painel.
 *   · **trilho** — o padrão: fileira horizontal de capas em 3:2.
 *   · **compacta** — fileiras de menos de {@link LIMIAR_COMPACTO} episódios
 *     viram LISTA. Três capas soltas num trilho que não rola leem como fileira
 *     quebrada, não como fileira pequena.
 *
 * **O QUE ESTA TELA COPIA DA REFERÊNCIA.** A fileira de pílulas no topo; a
 * grade de ATALHOS em duas colunas, que lá são os programas a que a pessoa
 * volta; as prateleiras horizontais; e a troca de fileira para grade quando
 * alguém escolhe um recorte.
 *
 * **O QUE ELA SE RECUSA A COPIAR, e por quê:**
 *
 * 1. **NÃO HÁ BARRA DE REPRODUÇÃO.** A referência mantém um mini player fixo no
 *    rodapé, e ele é a peça mais reconhecível dela. Este acervo traz a ficha e a
 *    capa do episódio, nunca o arquivo de áudio — uma barra «tocando agora»
 *    sobre nada seria a mentira mais barata desta tela, do mesmo jeito que um
 *    botão de play seria no Play. O cartão leva para a ficha do episódio.
 *
 * 2. **NÃO HÁ CAPA QUADRADA.** Podcast em app de áudio é sempre 1:1. MEDIDO nas
 *    325 capas deste recorte: 207 são 3:2 ou mais largas, 114 são ~4:3 e só 4
 *    são quadradas — fechá-las num quadrado decepa um terço da largura, e o
 *    assunto destas fotos raramente está no centro. A capa fica em 3:2.
 *
 * 3. **NÃO HÁ «FEITO PARA VOCÊ» NEM «TOCADAS RECENTEMENTE».** As duas dependem
 *    de dado de uso, e este acervo não tem nenhum. A única lista de uso desta
 *    tela é a que o próprio navegador guardou, ela começa vazia, e por isso mora
 *    no fim e não na abertura.
 *
 * 4. **O VERDE NÃO VEM JUNTO.** Selecionado é preto cheio, a ação é laranja —
 *    princípios 1 e 2 do design system —, e a cor da linguagem no ponto do chip
 *    vem do dado (D-08), nunca de um mapa escrito aqui.
 *
 * **AS 336 CONTINUAM TODAS NA TELA.** As fileiras são uma PARTIÇÃO: cada
 * episódio aparece em exatamente uma e elas somam 336, conferido no build
 * (`fioDeItens`). Não há `slice`, não há teto de exibição, não há episódio
 * inalcançável — o mesmo compromisso que esta tela assumiu quando acabou com o
 * corte de 60, e que o Play repetiu com as 113.
 *
 * DE ONDE SAEM AS FILEIRAS: o acervo não tem campo de programa para podcast; o
 * que ele tem é o nome no título, o tema declarado e a categoria. A regra
 * inteira mora em `prateleiras.ts`, com o porquê de derivar do título não ser
 * autorar um fato.
 *
 * A TELA NÃO SE EXPLICA (pedido de 23/08, ESTENDIDO EM 25/08 AOS NÚMEROS).
 * Antes saía só a prosa e as contagens medidas ficavam; a revisão do cliente
 * tirou também a descrição da abertura, o número do chip de linguagem, o do
 * atalho e o do cabeçalho de cada fileira. O acervo continua inteiro na tela e
 * a soma continua conferida no build (`fioDeItens`) — o que saiu foi o número
 * IMPRESSO, não a régua. Sobra o nome da fileira e a capa. Esse raciocínio
 * mora aqui em cima e na mensagem do commit, nunca no JSX.
 *
 * DP-F: este é um `"use client"` e por isso NÃO alcança `@/dados/cast` nem
 * `@/dados/play`. O DTO chega por propriedade.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** «Todas» não é um recorte — é a ausência dele. */
/** Quantas fileiras a tela oferece em «Recentes». Seis cabem sem rolagem. */
const TETO_RECENTES = 6;

const SEM_RECORTE = "";

/**
 * Abaixo disto a fileira vira LISTA em vez de trilho. Oito: até aí a fileira cabe
 * INTEIRA na lista — quatro linhas em duas colunas na web —, e mostrar tudo de uma vez
 * é melhor que pedir o gesto de rolar meio palmo. O trilho existe para o que não cabe.
 */
const LIMIAR_COMPACTO = 8;

/**
 * O cartão do episódio — a unidade do trilho, usada IGUAL na grade.
 *
 * SEM MOLDURA, ao contrário do cartaz do Play: aqui a capa flutua sobre o papel
 * e o texto vem solto embaixo, que é como a referência desenha a prateleira de
 * áudio. Um vocabulário só para os dois lugares é o que impede o trilho e a
 * grade de divergirem de aparência.
 */
function CartaoDoEpisodio({
  item,
  programa,
  naLista,
  aoAlternarLista,
}: {
  item: ItemDoPlayNoCliente;
  /** O nome da fileira, mostrado só onde ela não o diz — ou seja, na grade. */
  programa?: string;
  naLista: boolean;
  aoAlternarLista: () => void;
}) {
  return (
    <li data-midia={item.slug}>
      {/* Artigo com um link dentro, e não um link envolvendo tudo: os dois controles do
          hover são `<button>`, e `<button>` dentro de `<a>` é HTML inválido. O link cobre
          o cartão por `::after` — mesma correção do cartaz do Play, mesmo motivo. */}
      <article className="cast-cartao">
        <span className="cast-cartao-quadro">
          <Capa item={item} className="cast-cartao-foto" />
          <AcoesDoCartaz
            rota={item.rota}
            titulo={item.titulo}
            naLista={naLista}
            aoAlternarLista={aoAlternarLista}
            className="cast-cartao-acoes"
          />
        </span>
        {programa ? <span className="cast-cartao-programa tipo-micro">{programa}</span> : null}
        <Link href={item.rota} className="cast-cartao-titulo tipo-detalhe">
          {item.titulo}
        </Link>
      </article>
    </li>
  );
}

/** A LINHA da fileira compacta: capa pequena à esquerda, título e data à direita. */
function LinhaDoEpisodio({ item }: { item: ItemDoPlayNoCliente }) {
  return (
    <li data-midia={item.slug}>
      <Link href={item.rota} className="cast-linha">
        <span className="cast-linha-quadro">
          <Capa item={item} className="cast-linha-foto" />
        </span>
        <span className="cast-linha-texto">
          <span className="cast-linha-titulo tipo-detalhe">{item.titulo}</span>
          <span className="cast-linha-data tipo-micro">
            <time dateTime={diaParaIso(item.dia)}>{diaParaTexto(item.dia)}</time>
          </span>
        </span>
      </Link>
    </li>
  );
}

/**
 * A capa, com o mesmo fallback nos três portes.
 *
 * `alt=""`: o título está sempre logo ao lado, como texto, dentro do mesmo
 * link. Repeti-lo no alt faria o leitor de tela anunciar a mesma frase duas
 * vezes por cartão, 336 vezes.
 *
 * `next/image` está fora do projeto por decisão registrada em
 * `capa-sem-imagem.tsx`: sob `output: "export"` com `images.unoptimized` ele só
 * acrescentaria peso ao pacote.
 */
function Capa({ item, className }: { item: ItemDoPlayNoCliente; className: string }) {
  if (!item.imagem) {
    return (
      <CapaSemImagem
        titulo={item.titulo}
        classe="midia"
        rotulo={item.rotuloCategoria}
        linguagens={item.linguagens}
        className="size-full"
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={item.imagem} alt="" loading="lazy" decoding="async" className={className} />;
}

export function Cast({
  catalogo,
  linguagens,
}: {
  catalogo: CatalogoNoFio;
  linguagens: readonly LinguagemDoCast[];
}) {
  const [prateleira, setPrateleira] = useState<string>(SEM_RECORTE);
  const [linguagem, setLinguagem] = useState<string>(SEM_RECORTE);
  const [concluidas, setConcluidas] = useState<string[]>([]);
  const [hidratado, setHidratado] = useState(false);
  const minhaLista = useMinhaLista(CHAVE_LISTA_CAST);

  // A leitura do storage mora no efeito, nunca no primeiro render: sob
  // `output: "export"` o HTML é gerado no build, e ler `localStorage` no render
  // divergiria da hidratação.
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
   * A lista da pessoa, resolvida contra o catálogo. O `filter` não é cinto de segurança de
   * graça: o storage é EDITÁVEL por quem avalia, e um slug que não existe mais simplesmente
   * não desenha, em vez de derrubar a fileira.
   */
  const naMinhaLista = useMemo(
    () => minhaLista.slugs.map((s) => porSlug.get(s)).filter((i) => i !== undefined),
    [minhaLista.slugs, porSlug],
  );

  /**
   * As fileiras, montadas a partir dos ÍNDICES que o build conferiu. Não há um
   * segundo agrupamento aqui: a fileira que a tela desenha é a mesma que o build
   * somou, e é por isso que a soma delas não pode divergir das 336.
   */
  const fileiras = useMemo(
    () =>
      catalogo.prateleiras.map((p, i) => ({
        ...p,
        episodios: p.itens.map((n) => itens[n]).filter(Boolean),
        capa: itens[p.rosto],
        // O porte é POSIÇÃO E TAMANHO, os dois derivados: a primeira fileira é a
        // maior (o build ordena por tamanho) e ganha o painel; as pequenas viram
        // lista. Nenhuma escolha editorial entra aqui.
        porte: i === 0 ? "destaque" : p.itens.length < LIMIAR_COMPACTO ? "compacta" : "trilho",
      })),
    [catalogo.prateleiras, itens],
  );

  const recortando = prateleira !== SEM_RECORTE || linguagem !== SEM_RECORTE;

  const recorte = useMemo(() => {
    const daFileira =
      prateleira === SEM_RECORTE
        ? itens
        : (fileiras.find((p) => p.valor === prateleira)?.episodios ?? []);
    return linguagem === SEM_RECORTE
      ? daFileira
      : daFileira.filter((i) => i.linguagens.includes(linguagem));
  }, [itens, fileiras, prateleira, linguagem]);

  /** De qual fileira cada episódio veio — a grade mistura fileiras e precisa dizer qual. */
  const fileiraPorSlug = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const p of fileiras) for (const e of p.episodios) mapa.set(e.slug, p.rotulo);
    return mapa;
  }, [fileiras]);

  /**
   * O que o Player registrou, resolvido contra ESTE recorte. O registro é do
   * acervo inteiro — o Play grava na mesma chave —, então um slug que não é
   * podcast simplesmente não é desta tela.
   */
  const concluidosAqui = useMemo(() => {
    const vistos = new Set<string>();
    const resolvidos: ItemDoPlayNoCliente[] = [];
    for (const slug of concluidas) {
      if (vistos.has(slug)) continue;
      vistos.add(slug);
      const item = porSlug.get(slug);
      if (item) resolvidos.push(item);
    }
    return resolvidos;
  }, [concluidas, porSlug]);

  const rotuloDaFileira =
    prateleira === SEM_RECORTE
      ? ""
      : (catalogo.prateleiras.find((p) => p.valor === prateleira)?.rotulo ?? prateleira);
  const rotuloDaLinguagem =
    linguagem === SEM_RECORTE
      ? ""
      : (linguagens.find((l) => l.valor === linguagem)?.rotulo ?? linguagem);

  function limparRecorte() {
    setPrateleira(SEM_RECORTE);
    setLinguagem(SEM_RECORTE);
  }

  return (
    <section data-cast className="cast">
      {/* O QUE ESTE NAVEGADOR PUBLICOU pelo Studio. Fica ACIMA do conteúdo do build e
          declara que não está no acervo: o protótipo é um artefato estático e não tem
          servidor para receber publicação. Sem este bloco, a jornada do produtor terminaria
          no vazio — ele aperta publicar e a vitrine não muda. */}
      <PublicadoPeloProdutor pauta="cast" titulo="Publicado por você nesta demonstração" />

      {/* PEQUENA DE PROPÓSITO: a referência abre com as pílulas e o conteúdo
          logo abaixo. Um cabeçalho alto empurraria a primeira capa para fora da
          dobra. */}
      {/* TÍTULO E FILTROS NA MESMA LINHA. Antes eram onze pílulas de programa acima e um
          trilho de linguagens abaixo — duas faixas inteiras de recorte antes da primeira
          capa. Dois seletores cabem numa linha e respondem as mesmas duas perguntas: o
          que é, e de que linguagem. */}
      <header className="cast-topo">
        <h1 className="cast-marca tipo-titulo-1">
          <Grafismo variacao="barra" className="h-[0.8em] w-auto text-acao-tinta" />
          Cast
        </h1>

        <div className="cast-filtros">
          <label className="cast-filtro">
            <span className="sr-only">Categoria</span>
            <select
              className="filtros-select"
              value={prateleira}
              onChange={(e) => setPrateleira(e.target.value)}
              data-filtro-categoria
            >
              <option value={SEM_RECORTE}>Categoria</option>
              {catalogo.prateleiras.map((p) => (
                <option key={p.valor} value={p.valor}>
                  {p.rotulo}
                </option>
              ))}
            </select>
          </label>

          <label className="cast-filtro">
            <span className="sr-only">Linguagem</span>
            <select
              className="filtros-select"
              value={linguagem}
              onChange={(e) => setLinguagem(e.target.value)}
              data-filtro-linguagem
            >
              <option value={SEM_RECORTE}>Linguagem</option>
              {linguagens.map((l) => (
                <option key={l.valor} value={l.valor}>
                  {l.rotulo}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>


      {recortando ? (
        /* COM RECORTE A FILEIRA VIRA GRADE — a mesma troca do Play. Com recorte
           a pergunta deixou de ser «o que tem aqui» e virou «me mostre tudo». */
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="tipo-detalhe">
              <strong data-recorte-n className="font-display">
                {recorte.length}
              </strong>{" "}
              de {catalogo.total}
              {rotuloDaFileira ? ` — ${rotuloDaFileira}` : ""}
              {rotuloDaLinguagem ? ` · ${rotuloDaLinguagem.toLowerCase()}` : ""}
            </p>
            {/* Nenhum recorte é beco: sair dele é um clique, e o clique está do
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
            /* Vazio com saída, nunca vazio mudo (D-93). */
            <p
              data-recorte-vazio
              className="tipo-detalhe rounded-m border border-dashed border-borda-forte p-4"
            >
              Nenhum episódio
              {rotuloDaFileira ? ` de ${rotuloDaFileira}` : ""}
              {rotuloDaLinguagem ? ` em ${rotuloDaLinguagem.toLowerCase()}` : ""}. Solte uma
              das marcações para ver os outros.
            </p>
          ) : (
            <ul className="cast-grade">
              {recorte.map((i) => (
                <CartaoDoEpisodio
                  key={i.slug}
                  item={i}
                  programa={fileiraPorSlug.get(i.slug)}
                  naLista={minhaLista.tem(i.slug)}
                  aoAlternarLista={() => minhaLista.alternar(i.slug)}
                />
              ))}
            </ul>
          )}
        </section>
      ) : (
        <>
          {/* OS ATALHOS — a grade de duas colunas da referência. Lá são os
              programas a que a pessoa volta; aqui são TODAS as fileiras do
              acervo: em uma tela a pessoa vê do que o Cast é feito, que é
              justamente o que a parede de 336 capas não contava. */}
          <section className="flex flex-col gap-3">
            {/* SEIS, E CHAMADO DE «RECENTES» (27.08). A lista inteira de fileiras era um
                índice do acervo no meio da tela — útil para quem já conhece o Cast e
                parede para quem não conhece. Seis cabem sem rolagem e convidam. */}
            <h2 className="tipo-titulo-3 font-bold">Recentes</h2>
            <ul className="cast-atalhos">
              {fileiras.slice(0, TETO_RECENTES).map((p) => (
                <li key={p.valor}>
                  <button
                    type="button"
                    data-atalho={p.valor}
                    onClick={() => setPrateleira(p.valor)}
                    className="cast-atalho"
                  >
                    <span className="cast-atalho-quadro">
                      <Capa item={p.capa} className="cast-atalho-foto" />
                    </span>
                    {/* SÓ O NOME (25/08). Em duas colunas dentro da moldura de
                        390px sobram ~93px por atalho; sem o número, as duas
                        linhas do clamp são inteiras do nome. */}
                    <span className="cast-atalho-texto tipo-legenda">{p.rotulo}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* ------------------------------------------------------------- minha lista
           *
           * A FILEIRA DA PESSOA VEM ANTES DAS DO ACERVO, e só existe quando tem item. Ela
           * é o destino do «+» dos cartões: sem ela o botão seria uma gaveta sem porta.
           * Não carrega `data-prateleira` porque não é uma fileira do acervo — as do
           * acervo somam as 336 e cada episódio cai em exatamente uma; esta repete de
           * propósito o que já está em outra. O porquê inteiro está em
           * `base/minha-lista.ts`. */}
          {minhaLista.hidratado && naMinhaLista.length ? (
            <section data-minha-lista={naMinhaLista.length} className="cast-prateleira">
              <div className="cast-prateleira-cabecalho">
                <h2 className="cast-prateleira-titulo">Minha lista</h2>
              </div>
              {!minhaLista.persistida ? (
                <p className="tipo-legenda text-tinta-2">
                  Este navegador não deixou guardar a lista — ela vale só enquanto esta aba
                  estiver aberta.
                </p>
              ) : null}
              <ul className="cast-trilho">
                {naMinhaLista.map((i) => (
                  <CartaoDoEpisodio
                    key={i.slug}
                    item={i}
                    programa={fileiraPorSlug.get(i.slug)}
                    naLista
                    aoAlternarLista={() => minhaLista.alternar(i.slug)}
                  />
                ))}
              </ul>
            </section>
          ) : null}

          {/* AS FILEIRAS, nos três portes. Elas SOMAM as 336. */}
          {fileiras.map((p) => (
            <section
              key={p.valor}
              data-prateleira={p.valor}
              data-porte={p.porte}
              className="cast-prateleira"
            >
              <div className="cast-prateleira-cabecalho">
                {p.porte === "destaque" ? (
                  <span className="cast-prateleira-selo tipo-micro">A maior do acervo</span>
                ) : null}
                <h2 className="cast-prateleira-titulo">{p.rotulo}</h2>
                <button
                  type="button"
                  data-ver-tudo={p.valor}
                  onClick={() => setPrateleira(p.valor)}
                  className="cast-prateleira-tudo tipo-detalhe"
                >
                  Ver tudo →
                </button>
              </div>

              {p.porte === "compacta" ? (
                <ul className="cast-lista">
                  {p.episodios.map((i) => (
                    <LinhaDoEpisodio key={i.slug} item={i} />
                  ))}
                </ul>
              ) : (
                <ul className="cast-trilho">
                  {p.episodios.map((i) => (
                    <CartaoDoEpisodio
                      key={i.slug}
                      item={i}
                      naLista={minhaLista.tem(i.slug)}
                      aoAlternarLista={() => minhaLista.alternar(i.slug)}
                    />
                  ))}
                </ul>
              )}
            </section>
          ))}
        </>
      )}

      {/* DEPOIS DO ACERVO, e não antes dele: a referência abre com o que a
          pessoa ouviu porque lá essa lista quase nunca está vazia; aqui ela
          começa vazia para todo mundo que abre a proposta. */}
      <section
        data-concluidos={!hidratado ? "carregando" : concluidosAqui.length ? "com-itens" : "vazio"}
        className="flex flex-col gap-2 rounded-m border border-borda p-3"
      >
        <h2 className="tipo-detalhe font-bold">Já concluídos por você</h2>

        {!hidratado ? (
          <p className="tipo-legenda text-tinta-3">Lendo o que ficou guardado neste navegador…</p>
        ) : concluidosAqui.length === 0 ? (
          /* Vazio e com saída, não sumido: um bloco que desaparece deixa quem
             avalia sem saber se a funcionalidade existe ou se ela quebrou. */
          <p className="tipo-legenda text-tinta-2">
            Nada aqui ainda. Marque um episódio como concluído na página dele.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {concluidosAqui.map((i) => (
              <li key={i.slug}>
                <Link
                  href={i.rota}
                  data-concluido={i.slug}
                  className="tipo-detalhe flex items-baseline gap-2 py-1 underline decoration-borda-forte underline-offset-4 hover:decoration-current"
                >
                  <span className="tipo-micro shrink-0 text-tinta-3">
                    {fileiraPorSlug.get(i.slug) ?? i.rotuloCategoria}
                  </span>
                  <span className="min-w-0 truncate">{i.titulo}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
