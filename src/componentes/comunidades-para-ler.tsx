"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { capaVigenteDe, nomeGerido } from "@/componentes/comunidade-estado";
import { usePontos } from "@/contexto/pontos";
import { COMUNIDADES, PRODUTOR_DA_CASA } from "@/dados/comunidade";
import type { ComunidadeDefinida, PublicacaoDefinida } from "@/lib/pontos/tipos";

/**
 * comunidades-para-ler.tsx — a porta da aba Comunidade: escolha uma para ler.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ATÉ 29/08/2026 A ABA ABRIA DIRETO NO FEED DA CASA, e trocar de comunidade era um seletor
 * no topo dele. Funcionava, e escondia o produto: quem chegava via a comunidade do Itaú e
 * precisava descobrir que existiam mais vinte e duas dentro de um menu suspenso.
 *
 * Agora ela abre numa galeria. Cada comunidade é um cartaz com a capa, o nome DENTRO da
 * capa, e quantas publicações ela tem. Escolher uma é entrar nela como integrante: sem
 * lápis, sem publicar, sem apagar. Quem mantém comunidade faz isso no Studio.
 *
 * A CAPA VEM DE ONDE HOUVER, e a ordem é declarada. Primeiro a que o produtor subiu pelo
 * lápis; depois a semeada, que só a comunidade da casa tem; depois a foto da primeira
 * publicação da própria comunidade, que é foto do acervo, com crédito e texto alternativo
 * que o CMS publicou. Sem nenhuma das três, o cartaz fica sem foto e diz o nome do mesmo
 * jeito: cartaz sem foto é honesto, foto inventada não.
 *
 * AS DELE NÃO ENTRAM AQUI. Esta aba é sobre comunidade dos outros: é onde ele lê, comenta
 * e segue, como integrante. As que ele mantém têm bancada própria, em
 * `/studio/minhas-comunidades/`, e mostrá-las nas duas telas era justamente a confusão que
 * este refinamento inteiro veio desfazer. A pergunta é feita ao dado, por `donoId`.
 *
 * AS QUE ELE SEGUE VÊM PRIMEIRO, e não misturadas. São duas perguntas diferentes: «para
 * onde eu volto» e «o que existe além». Misturadas, a segunda enterra a primeira. A seção
 * só aparece quando tem alguém: cabeçalho sobre lista vazia é ruído.
 *
 * A BUSCA FILTRA AS DUAS SEÇÕES DE UMA VEZ, por nome e por UF. São vinte e duas comunidades
 * numa grade de cartazes, e rolar até achar «Rendeiras de Bilro do Cariri» é o tipo de
 * trabalho que um campo de uma linha resolve. Ela some quando há menos de oito: campo de
 * busca sobre lista curta é enfeite.
 * ─────────────────────────────────────────────────────────────────────────────
 */

interface Cartaz {
  comunidade: ComunidadeDefinida;
  nome: string;
  imagem: string;
  imagemAlt: string;
  imagemCredito: string;
  publicacoes: number;
}

function Tijolo({ cartaz }: { cartaz: Cartaz }) {
  const { comunidade, nome, imagem, imagemAlt, publicacoes } = cartaz;
  return (
    <Link
      href={`/studio/comunidade/${comunidade.id}/`}
      className="comunidade-tijolo"
      data-comunidade-cartaz={comunidade.id}
    >
      <span className="comunidade-tijolo-capa">
        {imagem !== "" ? (
          // eslint-disable-next-line @next/next/no-img-element -- imagem local do acervo;
          // `next/image` sob `output: export` exigiria loader e não acrescenta nada aqui.
          <img src={imagem} alt={imagemAlt} loading="lazy" />
        ) : null}
        <span className="comunidade-tijolo-veu" aria-hidden />
        {/* O CRÉDITO ENTROU NA FOTO, no canto de cima. Solto embaixo do cartão ele virava
            uma quarta linha de texto competindo com a descrição, e crédito de foto pertence
            à foto: é o mesmo lugar em que a capa grande da comunidade já o põe. */}
        {cartaz.imagemCredito !== "" ? (
          <span className="comunidade-tijolo-credito">{cartaz.imagemCredito}</span>
        ) : null}
        <span className="comunidade-tijolo-texto">
          <strong className="comunidade-tijolo-nome">{nome}</strong>
          <span className="comunidade-tijolo-meta">
            {comunidade.assinantes.toLocaleString("pt-BR")}{" "}
            {comunidade.assinantes === 1 ? "pessoa" : "pessoas"} · {publicacoes}{" "}
            {publicacoes === 1 ? "publicação" : "publicações"}
            {comunidade.uf ? ` · ${comunidade.uf}` : ""}
          </span>
        </span>
      </span>

      {/* O CORPO É UM BLOCO, e não texto solto sob a foto. A descrição fica fora da capa
          de propósito: sobre a imagem ela disputaria contraste com o nome e viraria uma
          terceira linha branca; aqui ela lê como legenda, que é o que ela é. */}
      <span className="comunidade-tijolo-corpo">
        {comunidade.descricao !== "" ? (
          <span className="comunidade-tijolo-sobre">{comunidade.descricao}</span>
        ) : null}
      </span>
    </Link>
  );
}

export function ComunidadesParaLer() {
  const { motor, hidratado } = usePontos();
  const [busca, setBusca] = useState("");

  const publicacoes = motor.atual.publicacoes;

  const cartazes = useMemo(() => {
    /** A primeira publicação de cada comunidade, para servir de capa quando não houver. */
    const primeira = new Map<string, PublicacaoDefinida>();
    for (const p of publicacoes) if (!primeira.has(p.comunidadeId)) primeira.set(p.comunidadeId, p);

    const quantas = new Map<string, number>();
    for (const p of publicacoes) quantas.set(p.comunidadeId, (quantas.get(p.comunidadeId) ?? 0) + 1);

    // `donoId` decide: as dele ficam de fora desta aba inteira.
    return COMUNIDADES.filter((c) => c.donoId !== PRODUTOR_DA_CASA).map((c): Cartaz => {
      const propria = capaVigenteDe(c.id);
      const doFeed = primeira.get(c.id);
      return {
        comunidade: c,
        nome: nomeGerido(c.id) ?? c.nome,
        imagem: propria?.imagem ?? doFeed?.imagem ?? "",
        imagemAlt: propria?.alt ?? doFeed?.imagemAlt ?? "",
        imagemCredito: propria?.credito ?? doFeed?.imagemCredito ?? "",
        publicacoes: quantas.get(c.id) ?? 0,
      };
    });
  }, [publicacoes]);

  // Antes de hidratar não há assinatura nenhuma a declarar: a única que o estado traz de
  // fábrica é a da casa, e a casa não entra nesta tela.
  const seguidas = hidratado ? motor.atual.assinadas : [];

  // Sem acento e sem caixa: quem procura «brô» digita «bro», e ficar de fora por causa de
  // um circunflexo é a busca punindo o teclado da pessoa.
  const achatar = (t: string) =>
    t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const alvo = achatar(busca.trim());
  const casa = (c: Cartaz) =>
    alvo === "" ||
    achatar(c.nome).includes(alvo) ||
    achatar(c.comunidade.uf ?? "").includes(alvo);

  const filtrados = cartazes.filter(casa);
  const seguindo = filtrados.filter((c) => seguidas.includes(c.comunidade.id));
  const outras = filtrados.filter((c) => !seguidas.includes(c.comunidade.id));

  return (
    <div className="prod-corpo" data-comunidades-para-ler>
      {cartazes.length >= 8 ? (
        <label className="prod-campo">
          <span className="sr-only">Buscar comunidade</span>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={`Buscar entre ${cartazes.length} comunidades`}
            className="prod-campo-entrada"
            data-buscar-comunidade
          />
        </label>
      ) : null}

      {filtrados.length === 0 ? (
        <p className="prod-campo-nota" data-busca-sem-resultado>
          Nenhuma comunidade com «{busca.trim()}».
        </p>
      ) : null}
      {seguindo.length > 0 ? (
        <section className="prod-secao">
          <h2 className="prod-secao-titulo">Você segue</h2>
          <div className="comunidade-galeria" data-galeria="seguindo">
            {seguindo.map((c) => (
              <Tijolo key={c.comunidade.id} cartaz={c} />
            ))}
          </div>
        </section>
      ) : null}

      {outras.length > 0 ? (
        <section className="prod-secao">
          <h2 className="prod-secao-titulo">Para conhecer</h2>
          <div className="comunidade-galeria" data-galeria="outras">
            {outras.map((c) => (
              <Tijolo key={c.comunidade.id} cartaz={c} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
