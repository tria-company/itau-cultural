import type { ReactNode } from "react";
import { PublicadoPeloProdutor } from "@/componentes/publicado-pelo-produtor";
import Link from "next/link";
import { ICONE_BUSCAR } from "@/componentes/base/icones";
import { CartaoLeitura, dataCurta, type PorteLeitura } from "@/componentes/cartao-leitura";
import { Grafismo } from "@/componentes/grafismo";
import { NoticiasEditorias } from "@/componentes/noticias-editorias";
import {
  leituras,
  milhar,
  secoesEditoriais,
  TOTAL_DE_CONTEUDOS,
  type Leitura,
  type SecaoEditorial,
} from "@/dados/leituras";

/**
 * noticias.tsx — a capa editorial.
 *
 * COMPONENTE DE SERVIDOR. `leituras.ts` varre o grafo no build (DP-F). A forma é
 * a de um jornal (manchete + laterais + cadernos); a escolha do que entra em
 * cada porta é ORDEM DE PUBLICAÇÃO, nunca curadoria inventada — o mesmo
 * compromisso do destaque do Play.
 */

const N_LATERAIS = 3;
const N_CHAMADAS = 3;
const N_FAIXA = 4;
const N_NOTICIAS = 3;
const N_COLUNAS = 4;
const N_ENTREVISTAS = 3;
const N_OPINIAO = 3;
const N_ULTIMAS = 8;

function pegar(
  fonte: readonly Leitura[],
  n: number,
  usados: Set<string>,
  preferirImagem: boolean,
): Leitura[] {
  const saida: Leitura[] = [];
  const tentar = (exigirImagem: boolean) => {
    for (const item of fonte) {
      if (saida.length >= n) return;
      if (usados.has(item.id)) continue;
      if (exigirImagem && !item.imagem) continue;
      saida.push(item);
      usados.add(item.id);
    }
  };
  if (preferirImagem) tentar(true);
  if (saida.length < n) tentar(false);
  return saida;
}

function Expediente({
  titulo,
  meta,
  children,
}: {
  titulo: string;
  meta: string;
  children?: ReactNode;
}) {
  return (
    <header className="noticias-expediente">
      <div className="noticias-expediente-linha">
        <div className="noticias-expediente-marca">
          <Grafismo variacao="barra" />
          <h1>{titulo}</h1>
        </div>
        <p className="noticias-expediente-meta tipo-legenda">{meta}</p>
      </div>
      {children ? (
        <p className="noticias-expediente-linha-baixa tipo-detalhe">{children}</p>
      ) : null}
    </header>
  );
}

function TopoDeSecao({ secao }: { secao: SecaoEditorial }) {
  return (
    <div className="noticias-secao-topo">
      <h2 className="noticias-secao-titulo">
        <Grafismo variacao="barra" />
        {secao.rotulo}
      </h2>
      <Link href={`/noticias/${secao.slug}/`} className="noticias-secao-tudo">
        ver as {milhar(secao.n)}
      </Link>
    </div>
  );
}

function ListaDeLeituras({
  itens,
  porte,
  rotulo,
  className,
}: {
  itens: readonly Leitura[];
  porte: PorteLeitura;
  rotulo: string;
  className: string;
}) {
  if (!itens.length) return null;
  return (
    <ul aria-label={rotulo} className={className}>
      {itens.map((leitura) => (
        <li key={leitura.id}>
          <CartaoLeitura leitura={leitura} porte={porte} />
        </li>
      ))}
    </ul>
  );
}

export function NoticiasHub() {
  const secoes = secoesEditoriais();
  const todas = leituras();
  const usados = new Set<string>();

  const [capa] = pegar(todas, 1, usados, true);
  const laterais = pegar(todas, N_LATERAIS, usados, true);
  const chamadas = pegar(todas, N_CHAMADAS, usados, false);
  const faixa = pegar(todas, N_FAIXA, usados, true);

  const secaoNoticias = secoes.find((s) => s.slug === "noticias");
  const secaoColunas = secoes.find((s) => s.slug === "colunas");
  const secaoEntrevistas = secoes.find((s) => s.slug === "entrevistas");
  const secaoOpiniao = secoes.find((s) => s.slug === "opiniao");

  const noticias = secaoNoticias
    ? pegar(
        todas.filter((i) => secaoNoticias.categorias.includes(i.categoria)),
        N_NOTICIAS,
        usados,
        true,
      )
    : [];
  const colunas = secaoColunas
    ? pegar(
        todas.filter((i) => secaoColunas.categorias.includes(i.categoria)),
        N_COLUNAS,
        usados,
        true,
      )
    : [];
  const entrevistas = secaoEntrevistas
    ? pegar(
        todas.filter((i) => secaoEntrevistas.categorias.includes(i.categoria)),
        N_ENTREVISTAS,
        usados,
        true,
      )
    : [];
  const opinioes = secaoOpiniao
    ? pegar(
        todas.filter((i) => secaoOpiniao.categorias.includes(i.categoria)),
        N_OPINIAO,
        usados,
        false,
      )
    : [];
  const ultimas = pegar(todas, N_ULTIMAS, usados, false);

  const nasQuatro = secoes.reduce((acc, s) => acc + s.n, 0);
  const fora = TOTAL_DE_CONTEUDOS - nasQuatro;
  const dataDaCapa = capa?.dia ? dataCurta(capa.dia) : "";

  return (
    <div className="noticias">
      {/* O QUE ESTE NAVEGADOR PUBLICOU pelo Studio. Fica ACIMA do conteúdo do build e
          declara que não está no acervo: o protótipo é um artefato estático e não tem
          servidor para receber publicação. Sem este bloco, a jornada do produtor terminaria
          no vazio — ele aperta publicar e a vitrine não muda. */}
      <PublicadoPeloProdutor pauta="editorial" titulo="Publicado por você nesta demonstração" />

      <Expediente
        titulo="Notícias"
        meta={dataDaCapa ? `Capa de ${dataDaCapa}` : "Capa editorial"}
      />

      <NoticiasEditorias
        atual="capa"
        secoes={secoes.map((s) => ({ slug: s.slug, rotulo: s.rotulo }))}
      />

      {capa ? (
        <section aria-label="Manchete" className="noticias-manchete">
          <div className="noticias-manchete-principal">
            <CartaoLeitura leitura={capa} porte="capa" />
          </div>
          <ListaDeLeituras
            itens={laterais}
            porte="lateral"
            rotulo="Outros destaques"
            className="noticias-laterais"
          />
          <ListaDeLeituras
            itens={chamadas}
            porte="chamada"
            rotulo="Outras chamadas"
            className="noticias-chamadas"
          />
        </section>
      ) : null}

      {faixa.length ? (
        <section aria-label="Mais da capa" className="noticias-secao">
          <h2 className="noticias-secao-titulo">
            <Grafismo variacao="barra" />
            Mais da capa
          </h2>
          <div className="noticias-faixa">
            {faixa.map((leitura) => (
              <CartaoLeitura key={leitura.id} leitura={leitura} porte="grade" />
            ))}
          </div>
        </section>
      ) : null}

      {secaoNoticias && noticias.length ? (
        <section className="noticias-secao">
          <TopoDeSecao secao={secaoNoticias} />
          <div className="noticias-grade">
            {noticias.map((leitura) => (
              <CartaoLeitura key={leitura.id} leitura={leitura} porte="grade" />
            ))}
          </div>
        </section>
      ) : null}

      {secaoColunas && colunas.length ? (
        <section className="noticias-secao">
          <TopoDeSecao secao={secaoColunas} />
          <div className="noticias-colunas">
            {colunas.map((leitura) => (
              <CartaoLeitura key={leitura.id} leitura={leitura} porte="coluna" />
            ))}
          </div>
        </section>
      ) : null}

      <div className="noticias-cadernos">
        {secaoEntrevistas && entrevistas.length ? (
          <section className="noticias-secao">
            <TopoDeSecao secao={secaoEntrevistas} />
            <ListaDeLeituras
              itens={entrevistas}
              porte="lista"
              rotulo={secaoEntrevistas.rotulo}
              className="noticias-entrevista-lista"
            />
          </section>
        ) : null}
        {secaoOpiniao && opinioes.length ? (
          <section className="noticias-secao">
            <TopoDeSecao secao={secaoOpiniao} />
            <ListaDeLeituras
              itens={opinioes}
              porte="opiniao"
              rotulo={secaoOpiniao.rotulo}
              className="noticias-opiniao-lista"
            />
          </section>
        ) : null}
      </div>

      {ultimas.length ? (
        <section className="noticias-secao">
          <h2 className="noticias-secao-titulo">
            <Grafismo variacao="barra" />
            Últimas
          </h2>
          <p className="noticias-corte tipo-legenda">
            Mais {milhar(ultimas.length)} textos, por data de publicação — o acervo tem{" "}
            {milhar(TOTAL_DE_CONTEUDOS)}.
          </p>
          <ListaDeLeituras
            itens={ultimas}
            porte="lista"
            rotulo="Últimas"
            className="noticias-lista"
          />
        </section>
      ) : null}

      {fora > 0 ? (
        <aside className="noticias-resto">
          <p className="tipo-detalhe">
            Fora destas seções há {milhar(fora)} textos — Rumos, formação, acervo e outras
            editorias. A busca os alcança.
          </p>
          <Link href="/buscar/#f=classe:conteudo" className="noticias-resto-acao">
            {ICONE_BUSCAR}
            Abrir a busca
          </Link>
        </aside>
      ) : null}
    </div>
  );
}

export function NoticiasSecao({
  secao,
  itens,
  teto,
}: {
  secao: SecaoEditorial;
  itens: Leitura[];
  teto: number;
}) {
  const usados = new Set<string>();
  const [capa] = pegar(itens, 1, usados, true);
  const laterais = pegar(itens, 2, usados, true);
  const resto = itens.filter((i) => !usados.has(i.id)).slice(0, Math.max(0, teto - usados.size));
  const exibidos = (capa ? 1 : 0) + laterais.length + resto.length;
  const dataDaCapa = capa?.dia ? dataCurta(capa.dia) : "";

  return (
    <div
      className="noticias"
      data-resultados-total={secao.n}
      data-resultados-exibidos={exibidos}
    >
      <Expediente titulo={secao.rotulo} meta={`${milhar(secao.n)} textos nesta seção`}>
        Por data de publicação
        {dataDaCapa ? `, a mais recente em ${dataDaCapa}` : ""}.
      </Expediente>

      <NoticiasEditorias
        atual={secao.slug}
        secoes={secoesEditoriais().map((s) => ({ slug: s.slug, rotulo: s.rotulo }))}
      />

      {capa ? (
        <section aria-label="Manchete" className="noticias-manchete">
          <div className="noticias-manchete-principal">
            <CartaoLeitura leitura={capa} porte="capa" />
          </div>
          <ListaDeLeituras
            itens={laterais}
            porte="lateral"
            rotulo="Outros destaques"
            className="noticias-laterais"
          />
        </section>
      ) : null}

      {exibidos < secao.n ? (
        <p className="noticias-corte tipo-legenda">
          Mostrando os {milhar(exibidos)} mais recentes de {milhar(secao.n)} — o corte é de
          exibição, e o total está dito aqui em vez de escondido.
        </p>
      ) : null}

      <ListaDeLeituras
        itens={resto}
        porte="lista"
        rotulo={secao.rotulo}
        className="noticias-lista"
      />
    </div>
  );
}
