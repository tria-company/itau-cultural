import { cloneElement, type ReactElement } from "react";
import { PublicadoPeloProdutor } from "@/componentes/publicado-pelo-produtor";
import Link from "next/link";
import { Chip } from "@/componentes/base/chip";
import {
  ICONE_ACONTECE,
  ICONE_APPS,
  ICONE_CHEVRON_DIREITA,
  ICONE_FONES,
  ICONE_MAPA,
  ICONE_MUSEU,
  ICONE_PERFIL,
  ICONE_SETA,
} from "@/componentes/base/icones";
import { CapaDeCartao } from "@/componentes/capa-sem-imagem";
import { Grafismo } from "@/componentes/grafismo";
import {
  hubDoMuseu,
  TETO_DA_LISTA_DE_ESPACOS,
  type CartazDoMuseu,
  type EspacoDoMuseu,
  type PortaDoMuseu,
} from "@/dados/museu";
import type { ExposicaoPermanente } from "@/dados/exposicoes-permanentes";

/**
 * museu.tsx — o hub do Museu virtual.
 *
 * COMPONENTE DE SERVIDOR (DP-F). O recorte vive em `museu.ts`; daqui para baixo
 * só primitivo. A forma é a da referência de 23/08: abertura com as três portas,
 * mosaico de cartaz (um em pé, dois paisagem, o resto em faixa) e a lista dos
 * espaços-museu. O que a referência inventava — data de encerramento, «online»
 * em ocupação presencial — não atravessa. As fachadas dos espaços vêm da web
 * (Wikimedia Commons), não do acervo do IC, que não publica imagem de espaço.
 *
 * As duas exposições permanentes da sede (Olavo Setubal e Herculano Pires)
 * abrem a página: são o destaque, não um item da lista da Enciclopédia.
 *
 * Os chips NÃO recortam a grade. A referência pinta «Exposições» como ativo e
 * mesmo assim mostra ocupações embaixo: são atalhos, não filtro. Recortar de
 * verdade esconderia o Machado, que é o cartaz de abertura.
 */

const GLIFO_DA_PORTA: Record<PortaDoMuseu["id"], ReactElement<{ className?: string }>> = {
  permanentes: ICONE_MUSEU,
  exposicoes: ICONE_APPS,
  ocupacoes: ICONE_PERFIL,
  visitas: ICONE_FONES,
};

function glifo(icone: ReactElement<{ className?: string }>) {
  return cloneElement(icone, { className: "museu-glifo" });
}

function CartaoPermanente({ expo }: { expo: ExposicaoPermanente }) {
  return (
    <li>
      <Link href={expo.rota} className="museu-permanente" data-permanente={expo.slug}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={expo.imagem}
          alt={expo.altImagem}
          className="museu-permanente-foto"
          decoding="async"
        />
        <span className="museu-permanente-veu" aria-hidden />
        <span className="museu-permanente-miolo">
          <span className="museu-permanente-selos">
            <span className="museu-cartaz-selo museu-cartaz-selo--tipo tipo-micro">
              {expo.kicker}
            </span>
          </span>
          <span className="museu-permanente-titulo tipo-destaque">{expo.titulo}</span>
          <span className="museu-permanente-sub tipo-legenda">{expo.subtitulo}</span>
          <span className="museu-permanente-meta tipo-legenda">
            {glifo(ICONE_MAPA)}
            {expo.visita.andares} · {expo.visita.entrada}
          </span>
        </span>
        <span className="museu-cartaz-ir" aria-hidden>
          {glifo(ICONE_SETA)}
        </span>
      </Link>
    </li>
  );
}

function Cartaz({ item }: { item: CartazDoMuseu }) {
  return (
    <li className={`museu-cartaz museu-cartaz--${item.porte}`}>
      <Link href={item.rota} className="museu-cartaz-link" data-cartaz={item.slug}>
        {item.imagem ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imagem}
            alt={item.altImagem}
            className="museu-cartaz-foto"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <CapaDeCartao
            titulo={item.titulo}
            classe="evento"
            rotulo={item.rotuloCategoria}
            linguagens={item.linguagens}
            compacta
            className="museu-cartaz-foto"
          />
        )}
        <span className="museu-cartaz-veu" aria-hidden />
        <span className="museu-cartaz-miolo">
          <span className="museu-cartaz-selos">
            <span className="museu-cartaz-selo tipo-micro">Evento</span>
            <span className="museu-cartaz-selo museu-cartaz-selo--tipo tipo-micro">
              {item.rotuloCategoria}
            </span>
          </span>
          <span className="museu-cartaz-titulo tipo-destaque">{item.titulo}</span>
          {item.meta ? (
            <span className="museu-cartaz-meta tipo-legenda">
              {glifo(ICONE_ACONTECE)}
              {item.meta}
            </span>
          ) : null}
        </span>
        <span className="museu-cartaz-ir" aria-hidden>
          {glifo(ICONE_SETA)}
        </span>
      </Link>
    </li>
  );
}

function LinhaDeEspaco({ espaco }: { espaco: EspacoDoMuseu }) {
  return (
    <li>
      <Link href={espaco.rota} className="museu-espaco" data-espaco={espaco.slug}>
        <CapaDeCartao
          titulo={espaco.titulo}
          classe="espaco"
          rotulo="Museu"
          linguagens={espaco.linguagens}
          imagem={espaco.imagem}
          creditoImagem={espaco.creditoImagem}
          alt={espaco.altImagem}
          compacta
          className="museu-espaco-capa"
        />
        <span className="museu-espaco-texto">
          <span className="museu-espaco-titulo tipo-detalhe">{espaco.titulo}</span>
          {espaco.resumo ? (
            <span className="museu-espaco-resumo tipo-legenda">{espaco.resumo}</span>
          ) : null}
          {espaco.lugar ? (
            <span className="museu-espaco-lugar tipo-legenda">
              {glifo(ICONE_MAPA)}
              {espaco.lugar}
            </span>
          ) : null}
        </span>
        <span className="museu-espaco-ir" aria-hidden>
          {glifo(ICONE_CHEVRON_DIREITA)}
        </span>
      </Link>
    </li>
  );
}

export function Museu() {
  const hub = hubDoMuseu();
  const vitrine = hub.espacos.slice(0, TETO_DA_LISTA_DE_ESPACOS);
  const resto = hub.espacos.slice(TETO_DA_LISTA_DE_ESPACOS);

  return (
    <div className="museu">
      {/* O QUE ESTE NAVEGADOR PUBLICOU pelo Studio. Fica ACIMA do conteúdo do build e
          declara que não está no acervo: o protótipo é um artefato estático e não tem
          servidor para receber publicação. Sem este bloco, a jornada do produtor terminaria
          no vazio — ele aperta publicar e a vitrine não muda. */}
      <PublicadoPeloProdutor pauta="museu" titulo="Publicado por você nesta demonstração" />

      <header className="museu-abertura">
        <p className="museu-kicker tipo-micro">Museu</p>
        <h1 className="museu-titulo tipo-cartaz">Museu virtual</h1>
        <div role="group" aria-label="Portas do museu" className="museu-portas">
          {hub.portas.map((porta) => (
            <Chip key={porta.id} href={porta.href}>
              {glifo(GLIFO_DA_PORTA[porta.id])}
              {porta.rotulo}
            </Chip>
          ))}
        </div>
      </header>

      <section className="museu-secao" id="permanentes" aria-labelledby="museu-permanentes-titulo">
        <div className="museu-secao-cabecalho">
          <h2 id="museu-permanentes-titulo" className="museu-secao-titulo tipo-titulo-3">
            <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
            Exposições permanentes
          </h2>
        </div>
        <ul className="museu-permanentes">
          {hub.permanentes.map((expo) => (
            <CartaoPermanente key={expo.slug} expo={expo} />
          ))}
        </ul>
      </section>

      <section className="museu-secao" id="cartaz" aria-labelledby="museu-cartaz-titulo">
        <div className="museu-secao-cabecalho">
          <h2 id="museu-cartaz-titulo" className="museu-secao-titulo tipo-titulo-3">
            <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
            Em cartaz e ocupações
          </h2>
          <Link href="/museu/exposicoes/" className="museu-secao-tudo tipo-detalhe">
            Ver todas
          </Link>
        </div>
        <ul className="museu-grade">
          {hub.cartaz.map((item) => (
            <Cartaz key={item.slug} item={item} />
          ))}
        </ul>
      </section>

      <section className="museu-secao" id="espacos" aria-labelledby="museu-espacos-titulo">
        <div className="museu-secao-cabecalho">
          <h2 id="museu-espacos-titulo" className="museu-secao-titulo tipo-titulo-3">
            <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
            Espaços-museu do acervo
          </h2>
          <a href="#explorar-espacos" className="museu-secao-tudo tipo-detalhe">
            Ver todos
          </a>
        </div>
        <ul className="museu-espacos">
          {vitrine.map((espaco) => (
            <LinhaDeEspaco key={espaco.slug} espaco={espaco} />
          ))}
        </ul>
        {resto.length ? (
          <details id="explorar-espacos" className="museu-explorar">
            <summary>
              {glifo(ICONE_SETA)}
              Explorar todos os espaços
            </summary>
            <ul className="museu-espacos">
              {resto.map((espaco) => (
                <LinhaDeEspaco key={espaco.slug} espaco={espaco} />
              ))}
            </ul>
          </details>
        ) : null}
      </section>
    </div>
  );
}
