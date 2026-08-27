"use client";

import Link from "next/link";
import { PublicadoPeloProdutor } from "@/componentes/publicado-pelo-produtor";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Chip, Estante } from "@/componentes/base/chip";
import {
  ICONE_BUSCAR,
  ICONE_CONFERIDO,
  ICONE_CURSOS,
  ICONE_ENCONTRO,
  ICONE_MAIS,
  ICONE_SETA,
  ICONE_OFICINA,
  ICONE_POS,
} from "@/componentes/base/icones";
import { CHAVE_LISTA_CURSOS, useMinhaLista } from "@/componentes/base/minha-lista";
import { CapaSemImagem } from "@/componentes/capa-sem-imagem";
import { Grafismo } from "@/componentes/grafismo";
import {
  correspondeABusca,
  diaParaIso,
  diaParaTexto,
  type CatalogoDeCursos,
  type CursoNoCliente,
  type FormatoCurso,
} from "@/dados/cursos-wire";

/**
 * cursos.tsx — a vitrine de formação (funcionalidade 42, reformulação 2026-08).
 *
 * A FORMA é a de um catálogo de escola digital: busca no alto, categorias com
 * capa, cartão 16:9, saída na fonte. A CARA é deste design system. O que a
 * referência teria de nota, preço e «mais vendido» não entra — o acervo não
 * declara nenhum dos três.
 *
 * A ficha da formação mora em `/cursos/[slug]`. A inscrição de outro sistema
 * não vira botão que não inscreve.
 *
 * DP-F: este arquivo NÃO alcança `@/dados/cursos` nem `@/dados/grafo`. O
 * catálogo chega por propriedade, montado no build.
 */

const SEM_RECORTE = "";

const ICONE_DO_FORMATO: Record<FormatoCurso, ReactNode> = {
  curso: ICONE_CURSOS,
  oficina: ICONE_OFICINA,
  pos: ICONE_POS,
  encontro: ICONE_ENCONTRO,
  formacao: ICONE_CURSOS,
};

function milhar(n: number): string {
  return new Intl.NumberFormat("pt-BR").format(n);
}

function rotuloDaFicha(curso: CursoNoCliente): string {
  return `Abrir a ficha de «${curso.titulo}»`;
}

function BotaoDaLista({
  curso,
  naLista,
  aoAlternar,
  className,
}: {
  curso: CursoNoCliente;
  naLista: boolean;
  aoAlternar: () => void;
  className: string;
}) {
  return (
    <button
      type="button"
      data-na-lista={naLista ? "sim" : "nao"}
      aria-pressed={naLista}
      aria-label={naLista ? `Tirar ${curso.titulo} da minha lista` : `Pôr ${curso.titulo} na minha lista`}
      onClick={aoAlternar}
      className={`cartaz-acao cartaz-acao--lista ${className}`}
    >
      {naLista ? ICONE_CONFERIDO : ICONE_MAIS}
    </button>
  );
}

function Linguas({ curso }: { curso: CursoNoCliente }) {
  if (!curso.linguagens.length) return null;
  return (
    <ul className="cursos-cartao-linguas">
      {curso.linguagens.map((l) => (
        <li
          key={l.id}
          className="cursos-cartao-lingua tipo-legenda"
          style={{ "--cor-chip": `var(${l.cor})` } as React.CSSProperties}
        >
          <span aria-hidden className="cursos-cartao-lingua-ponto" />
          {l.rotulo}
        </li>
      ))}
    </ul>
  );
}

function Cartao({
  curso,
  naLista,
  aoAlternarLista,
}: {
  curso: CursoNoCliente;
  naLista: boolean;
  aoAlternarLista: () => void;
}) {
  return (
    <article className="cursos-cartao" data-curso={curso.slug} data-formato={curso.formato}>
      <span className="cursos-cartao-quadro">
        {/* `alt=""`: o título está no link abaixo. Repeti-lo faria o leitor
            anunciar a mesma frase duas vezes por cartão, 54 vezes. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={curso.imagem} alt="" loading="lazy" decoding="async" className="cursos-cartao-foto" />
        <span className="cursos-cartao-selos">
          {curso.libras ? (
            <span className="cursos-cartao-selo tipo-micro">Libras</span>
          ) : null}
          {curso.gratuito ? (
            <span className="cursos-cartao-selo tipo-micro">Gratuito</span>
          ) : null}
          {curso.cancelado ? (
            <span className="cursos-cartao-selo tipo-micro" data-aviso="sim">
              Cancelado
            </span>
          ) : null}
        </span>
        <BotaoDaLista
          curso={curso}
          naLista={naLista}
          aoAlternar={aoAlternarLista}
          className="cursos-cartao-lista"
        />
      </span>
      <div className="cursos-cartao-corpo">
        <p className="cursos-cartao-meta tipo-micro">
          {curso.rotuloFormato}
          {curso.dia ? (
            <>
              {" · "}
              <time dateTime={diaParaIso(curso.dia)}>{diaParaTexto(curso.dia)}</time>
            </>
          ) : null}
        </p>
        <Link
          href={curso.rota}
          className="cursos-cartao-titulo tipo-destaque no-underline"
          aria-label={rotuloDaFicha(curso)}
        >
          {curso.titulo}
        </Link>
        <p className="cursos-cartao-resumo tipo-legenda">{curso.resumo}</p>
        <Linguas curso={curso} />
        <p className="cursos-cartao-pe" aria-hidden>
          <span className="cursos-acao cursos-acao--fantasma tipo-detalhe">
            Ver formação
            {ICONE_SETA}
          </span>
        </p>
      </div>
    </article>
  );
}

export function Cursos({ catalogo }: { catalogo: CatalogoDeCursos }) {
  const [consulta, setConsulta] = useState("");
  const [formato, setFormato] = useState<string>(SEM_RECORTE);
  const [linguagem, setLinguagem] = useState<string>(SEM_RECORTE);
  const [recurso, setRecurso] = useState<"" | "libras" | "subtitle">(SEM_RECORTE);
  const minhaLista = useMinhaLista(CHAVE_LISTA_CURSOS);

  const porSlug = useMemo(() => new Map(catalogo.itens.map((i) => [i.slug, i])), [catalogo.itens]);

  const naMinhaLista = useMemo(
    () => minhaLista.slugs.map((s) => porSlug.get(s)).filter((i): i is CursoNoCliente => i !== undefined),
    [minhaLista.slugs, porSlug],
  );

  const recortando = Boolean(consulta.trim() || formato || linguagem || recurso);

  const recorte = useMemo(() => {
    return catalogo.itens.filter((i) => {
      if (!correspondeABusca(i, consulta)) return false;
      if (formato && i.formato !== formato) return false;
      if (linguagem && !i.linguagens.some((l) => l.id === linguagem)) return false;
      if (recurso === "libras" && !i.libras) return false;
      if (recurso === "subtitle" && !i.legenda) return false;
      return true;
    });
  }, [catalogo.itens, consulta, formato, linguagem, recurso]);

  const partesDoRotulo = [
    consulta.trim() ? `«${consulta.trim()}»` : "",
    formato ? (catalogo.formatos.find((f) => f.valor === formato)?.rotulo ?? formato) : "",
    linguagem ? (catalogo.linguagens.find((l) => l.valor === linguagem)?.rotulo ?? linguagem) : "",
    recurso ? (catalogo.acessibilidade.find((a) => a.campo === recurso)?.rotulo ?? recurso) : "",
  ].filter(Boolean);

  function limpar() {
    setConsulta("");
    setFormato(SEM_RECORTE);
    setLinguagem(SEM_RECORTE);
    setRecurso(SEM_RECORTE);
  }

  function semNavegar(e: FormEvent) {
    e.preventDefault();
  }

  return (
    <div data-cursos className="cursos">
      {/* O QUE ESTE NAVEGADOR PUBLICOU pelo Studio. Fica ACIMA do conteúdo do build e
          declara que não está no acervo: o protótipo é um artefato estático e não tem
          servidor para receber publicação. Sem este bloco, a jornada do produtor terminaria
          no vazio — ele aperta publicar e a vitrine não muda. */}
      <PublicadoPeloProdutor pauta="cursos" titulo="Publicado por você nesta demonstração" />

      <header className="cursos-abertura">
        <p className="cursos-kicker tipo-micro">
          <Grafismo variacao="barra" className="h-[0.9em] w-auto" />
          Escola Itaú Cultural
        </p>
        <h1 className="cursos-titulo tipo-titulo-1">Cursos</h1>
        <p className="cursos-olho tipo-detalhe">
          As formações do acervo — cursos, oficinas e pós-graduação.
        </p>

        <form role="search" className="cursos-busca" onSubmit={semNavegar}>
          <label htmlFor="cursos-q" className="tipo-micro text-tinta-3">
            Buscar formação
          </label>
          <div className="cursos-busca-caixa">
            <span className="cursos-busca-lupa" aria-hidden>
              {ICONE_BUSCAR}
            </span>
            <input
              id="cursos-q"
              type="search"
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              placeholder="Nome, oficina, mestrado, cinema…"
              autoComplete="off"
              className="cursos-busca-campo"
            />
            {consulta ? (
              <button type="button" onClick={() => setConsulta("")} className="cursos-busca-limpar">
                Limpar
              </button>
            ) : null}
          </div>
        </form>
      </header>

      <section className="cursos-categorias">
        <h2 className="tipo-micro text-tinta-3">Formatos</h2>
        <div role="group" aria-label="Recortar por formato" className="cursos-categorias-trilho">
          {catalogo.formatos.map((f) => {
            const selecionado = formato === f.valor;
            return (
              <button
                key={f.valor}
                type="button"
                aria-pressed={selecionado}
                data-formato-faceta={f.valor}
                onClick={() => setFormato(selecionado ? SEM_RECORTE : f.valor)}
                className="cursos-categoria"
              >
                <span className="cursos-categoria-capa">
                  {f.imagem ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.imagem} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <CapaSemImagem
                      titulo={f.rotulo}
                      classe="formacao"
                      rotulo={f.rotulo}
                      linguagens={[]}
                      className="size-full"
                    />
                  )}
                </span>
                <span className="cursos-categoria-pe">
                  {ICONE_DO_FORMATO[f.valor as FormatoCurso]}
                  <span className="cursos-categoria-nome">
                    <span className="cursos-categoria-rotulo tipo-detalhe">{f.rotulo}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="cursos-recorte">
        <Estante titulo="Linguagens" rotulo="Recortar por linguagem">
          <Chip
            variante="explorar"
            selecionado={linguagem === SEM_RECORTE}
            onClick={() => setLinguagem(SEM_RECORTE)}
          >
            Todas
          </Chip>
          {catalogo.linguagens.map((l) => (
            <Chip
              key={l.valor}
              variante="explorar"
              cor={l.cor}
              data-linguagem={l.valor}
              selecionado={linguagem === l.valor}
              onClick={() => setLinguagem(linguagem === l.valor ? SEM_RECORTE : l.valor)}
            >
              {l.rotulo}
            </Chip>
          ))}
        </Estante>

        <Estante titulo="Recursos de acessibilidade" rotulo="Filtrar por recurso de acessibilidade">
          {catalogo.acessibilidade.map((a) => (
            <Chip
              key={a.campo}
              variante="explorar"
              data-acessibilidade-do-curso={a.campo}
              {...(a.n === 0 ? { "data-nao-sustenta": "sim" } : {})}
              selecionado={recurso === a.campo}
              onClick={() => setRecurso(recurso === a.campo ? SEM_RECORTE : a.campo)}
            >
              {a.rotulo}
            </Chip>
          ))}
        </Estante>
      </section>

      {!recortando ? (
        <article data-destaque={catalogo.destaque.slug} className="cursos-destaque">
          <span className="cursos-destaque-quadro">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={catalogo.destaque.imagem}
              alt=""
              decoding="async"
              className="cursos-destaque-foto"
            />
            {catalogo.destaque.creditoImagem ? (
              <span className="cursos-destaque-credito">Foto: {catalogo.destaque.creditoImagem}</span>
            ) : null}
          </span>
          <div className="cursos-destaque-corpo">
            <p className="cursos-destaque-kicker tipo-micro">Em destaque · a mais recente do acervo</p>
            <h2 className="cursos-destaque-titulo tipo-titulo-2">
              <Link href={catalogo.destaque.rota} className="no-underline">
                {catalogo.destaque.titulo}
              </Link>
            </h2>
            <p className="cursos-destaque-resumo tipo-detalhe">{catalogo.destaque.resumo}</p>
            <p className="cursos-destaque-meta tipo-legenda">
              {catalogo.destaque.rotuloFormato}
              {catalogo.destaque.dia ? (
                <>
                  {" · "}
                  <time dateTime={diaParaIso(catalogo.destaque.dia)}>
                    {diaParaTexto(catalogo.destaque.dia)}
                  </time>
                </>
              ) : null}
            </p>
            <Linguas curso={catalogo.destaque} />
            <Link
              href={catalogo.destaque.rota}
              className="cursos-acao tipo-detalhe"
              aria-label={rotuloDaFicha(catalogo.destaque)}
            >
              Ver formação
              {ICONE_SETA}
            </Link>
          </div>
        </article>
      ) : null}

      {minhaLista.hidratado && naMinhaLista.length ? (
        <section data-minha-lista={naMinhaLista.length} className="cursos-prateleira">
          <div className="cursos-prateleira-cabecalho">
            <h2 className="cursos-prateleira-titulo tipo-titulo-3">
              <Grafismo variacao="barra" className="h-[0.8em] w-auto text-acao-tinta" />
              Minha lista
              <span className="cursos-prateleira-n tipo-detalhe">{milhar(naMinhaLista.length)}</span>
            </h2>
          </div>
          {!minhaLista.persistida ? (
            <p className="cursos-aviso-lista tipo-legenda">
              Este navegador não deixou guardar a lista — ela vale só enquanto esta aba estiver aberta.
            </p>
          ) : null}
          <ul className="cursos-trilho">
            {naMinhaLista.map((i) => (
              <li key={i.slug}>
                <Cartao curso={i} naLista aoAlternarLista={() => minhaLista.alternar(i.slug)} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="cursos-prateleira">
        <div className="cursos-prateleira-cabecalho">
          <h2 className="cursos-prateleira-titulo tipo-titulo-3">
            <Grafismo variacao="barra" className="h-[0.8em] w-auto text-acao-tinta" />
            {recortando ? (
              <>
                <span data-recorte-n>{milhar(recorte.length)}</span>
                <span className="cursos-prateleira-n tipo-detalhe">
                  de {milhar(catalogo.total)}
                  {partesDoRotulo.length ? ` — ${partesDoRotulo.join(" · ")}` : ""}
                </span>
              </>
            ) : (
              <>
                Todas as formações
                <span className="cursos-prateleira-n tipo-detalhe">{milhar(catalogo.total)}</span>
              </>
            )}
          </h2>
          {recortando ? (
            <button type="button" data-limpar-recorte onClick={limpar} className="cursos-acao cursos-acao--fantasma tipo-detalhe">
              Limpar recorte
            </button>
          ) : null}
        </div>

        {recorte.length === 0 ? (
          <div data-recorte-vazio className="cursos-vazio">
            <p className="cursos-vazio-titulo tipo-destaque">Nenhuma formação neste recorte</p>
            <p className="cursos-vazio-olho tipo-detalhe">
              Nenhuma das {milhar(catalogo.total)} formações combina com o que você buscou. Limpe a
              busca ou solte um dos recortes acima.
            </p>
            <button type="button" onClick={limpar} className="cursos-acao tipo-detalhe">
              Limpar busca e recortes
            </button>
          </div>
        ) : (
          <ul className="cursos-grade">
            {recorte.map((i) => (
              <li key={i.slug}>
                <Cartao
                  curso={i}
                  naLista={minhaLista.tem(i.slug)}
                  aoAlternarLista={() => minhaLista.alternar(i.slug)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
