import Link from "next/link";
import {
  ICONE_ACONTECE,
  ICONE_IA,
  ICONE_MAPA,
  ICONE_ONDA,
  ICONE_SETA,
  ICONE_TOCAR,
} from "@/componentes/base/icones";
import { HubBastidor } from "@/componentes/hub-bastidor";
import {
  GRUPOS_APPS,
  TOTAL_APPS,
  type Atalho,
  type CapaApp,
  type Glifo,
  type Ritmo,
} from "@/dados/apps";

/**
 * hub-apps.tsx — a tela que o quinto botão da barra abre: os aplicativos que
 * moram dentro deste aplicativo.
 *
 * POR QUE CAPA E NÃO ÍCONE. Um hub de quinze itens desenhado com rótulo e
 * traço é uma lista de links com espaçamento generoso: quem chega aqui sem
 * saber o que procura sai do mesmo jeito, porque «Museu virtual» e «Cast» têm
 * exatamente o mesmo peso visual e nenhum dos dois mostra o que tem dentro. A
 * capa faz o trabalho que o rótulo não faz — ela é uma AMOSTRA do acervo
 * daquele app, não uma ilustração dele.
 *
 * A TELA ABRE COM UM CARTAZ, e não com um cabeçalho de texto (referência de
 * 23/08). O título e as duas linhas de instrução são os mesmos de antes; o que
 * mudou é que eles passaram a morar POR CIMA de uma fotografia, na mesma forma
 * dos cartazes que vêm logo abaixo. O cartaz de abertura não é link: ele diz
 * «toque para entrar em um deles» e quem cumpre isso são os cartazes.
 *
 * AGORA O TEXTO ENTRA POR CIMA DA FOTO EM TODOS OS CARTAZES. Antes só as faixas
 * largas faziam isso — o texto dos cartazes pequenos descia para baixo da imagem
 * porque parte do acervo tem TIPOGRAFIA GRAVADA na foto e título sobre título não
 * se resolve com véu. A referência de 23/08 pediu o contrário e o preço está
 * pago no dado, não no CSS: cada capa de `apps.ts` diz por onde o corte segura
 * (é isso que tira o letreiro do Mekukradjá do cartaz do Cast), e o único app
 * que não tinha o que amostrar perdeu a capa emprestada e virou gradiente.
 *
 * O CARTAZ NÃO MOSTRA O CRÉDITO DA FOTO. Aqui a imagem não é a obra, é a
 * AMOSTRA do que tem dentro do app — e onze «Foto: fulano» empilhados viravam
 * ruído embaixo de cada rótulo, num lugar onde ninguém está lendo procedência.
 * O nome de quem fez continua guardado em `src/dados/apps.ts` e continua visível
 * onde a imagem é o conteúdo: a capa do evento, o player, o catálogo de /play.
 *
 * BASTIDOR NÃO GANHA CAPA. Ver `src/dados/apps.ts`: ele é ferramenta, não
 * acervo, e uma foto ali prometeria conteúdo onde não há. Só aparece na web
 * porque no app cada uma dessas rotas se declara «só web» — anunciar no
 * telefone um caminho que termina em aviso é beco. Os atalhos de CONTA saíram
 * do hub em 23/08 e moram no menu do ícone de conta, no alto da tela.
 */

/** O traço de cada glifo. O que cada nome significa está em `apps.ts`. */
const GLIFOS: Record<Glifo, React.ReactNode> = {
  entrar: ICONE_SETA,
  tocar: ICONE_TOCAR,
  ouvir: ICONE_ONDA,
  agenda: ICONE_ACONTECE,
  mapa: ICONE_MAPA,
  ia: ICONE_IA,
};

/**
 * O porte de CADA cartaz do grupo, na ordem em que eles aparecem — derivado do
 * ritmo que o grupo declara. A forma de cada porte mora em `hub.css`.
 */
function portesDoGrupo(quantos: number, ritmo: Ritmo): string[] {
  if (ritmo === "faixa") return new Array<string>(quantos).fill("faixa");

  // Dois em linha, largura igual, ocupando a fileira inteira. Todos do mesmo porte de
  // propósito: «dividida exatamente em dois» só é verdade se nenhum for exceção.
  if (ritmo === "duo") return new Array<string>(quantos).fill("meio");

  // Três em linha, largura igual. Mesmo contrato do duo, com outro divisor.
  if (ritmo === "trio") return new Array<string>(quantos).fill("terco");

  // Cada cartaz com a forma da abertura do hub — faixa larga, foto à direita, texto sobre
  // o véu. A forma mora em `hub.css`, ao lado da própria abertura.
  if (ritmo === "abertura") return new Array<string>(quantos).fill("abertura");

  if (ritmo === "lado") {
    // O primeiro fica EM PÉ na coluna da esquerda e a altura dele vem do que se
    // empilha à direita. Os de trás alternam paisagem e larga, que é o que dá à
    // pilha da direita duas alturas diferentes em vez de dois blocos iguais.
    return Array.from({ length: quantos }, (_, i) =>
      i === 0 ? "alto" : i % 2 === 1 ? "paisagem" : "larga",
    );
  }

  // «par»: retratos aos pares. Contagem ímpar deixaria meia fileira vazia no
  // fim — o último vira faixa e fecha a linha.
  const portes = new Array<string>(quantos).fill("retrato");
  if (quantos % 2 === 1) portes[quantos - 1] = "faixa";
  return portes;
}

function Cartaz({
  href,
  rotulo,
  descricao,
  capa,
  selo,
  marca,
  porte,
}: {
  href: string;
  rotulo: string;
  descricao: string;
  capa?: CapaApp;
  selo: Glifo;
  marca?: Glifo;
  porte: string;
}) {
  // SEM CAPA O CARTAZ INTEIRO MUDA DE LADO, não só o fundo. O gradiente da marca
  // é CLARO, então o texto branco com véu escuro que serve à fotografia aqui
  // reprovaria o contraste — a tinta vira preta e o véu deixa de existir. O
  // porquê de um app não ter capa está em `apps.ts`.
  const claro = !capa;
  return (
    <li className={`hub-cartaz hub-cartaz--${porte}${claro ? " hub-cartaz--claro" : ""}`}>
      <Link href={href} className="hub-cartaz-link">
        {/* Sem capa não entra camada nenhuma: o gradiente é o fundo do próprio
            cartaz, em `hub.css`, e o porquê está lá. */}
        {capa ? (
          <>
            {/* `next/image` está fora do projeto por decisão registrada em
                capa-sem-imagem.tsx: sob `output: "export"` com
                `images.unoptimized`, ele só acrescentaria peso ao pacote. */}
            <img
              /* Caminho que começa com «/» é usado como está. É o que permite a um
                 cartaz trazer arte que NÃO saiu do acervo sem escondê-la dentro de
                 `/acervo/`, onde todo arquivo tem procedência de coleção. */
              src={capa.arquivo.startsWith("/") ? capa.arquivo : `/acervo/${capa.arquivo}`}
              alt={capa.alt}
              data-foco={capa.foco ?? "centro"}
              className="hub-cartaz-foto"
              loading="lazy"
            />
            <span className="hub-cartaz-veu" aria-hidden />
          </>
        ) : null}
        {marca ? (
          <span className="hub-cartaz-marca" aria-hidden>
            {GLIFOS[marca]}
          </span>
        ) : null}
        <span className="hub-cartaz-texto">
          <span className="hub-cartaz-rotulo tipo-titulo-3">{rotulo}</span>
          <span className="hub-cartaz-descricao tipo-legenda">{descricao}</span>
        </span>
        {/* O selo é decorativo: ele repete em desenho o que o rótulo do cartaz
            já diz em palavra, e o link inteiro é a área de toque. */}
        <span className="hub-cartaz-selo" aria-hidden>
          {GLIFOS[selo]}
        </span>
      </Link>
    </li>
  );
}

function ListaAtalhos({ atalhos }: { atalhos: readonly Atalho[] }) {
  return (
    <ul className="hub-atalhos">
      {atalhos.map((atalho) => (
        <li key={atalho.href}>
          <Link href={atalho.href} className="hub-atalho">
            <span className="hub-atalho-rotulo tipo-detalhe">{atalho.rotulo}</span>
            <span className="hub-atalho-descricao tipo-legenda">{atalho.descricao}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function HubApps() {
  return (
    <div className="hub">
      <header className="hub-abertura">
        <img src="/hub/heroi.jpg" alt="" className="hub-abertura-foto" />
        <span className="hub-abertura-veu" aria-hidden />
        <div className="hub-abertura-texto">
          <h1 className="tipo-cartaz font-bold">Tudo num lugar só</h1>
          <p className="tipo-detalhe">
            {TOTAL_APPS} aplicativos reunidos. Toque para entrar em um deles.
          </p>
        </div>
        <span className="hub-abertura-risco" aria-hidden />
      </header>

      {GRUPOS_APPS.map((grupo) => {
        const portes = portesDoGrupo(grupo.apps.length, grupo.ritmo);
        return (
          <section key={grupo.id} className="hub-grupo">
            {grupo.rotulo ? (
              <h2 className="tipo-titulo-3 font-bold">{grupo.rotulo}</h2>
            ) : null}
            <ul className="hub-grade" data-ritmo={grupo.ritmo}>
              {grupo.apps.map((app, n) => (
                <Cartaz
                  key={app.id}
                  href={app.href}
                  rotulo={app.rotulo}
                  descricao={app.descricao}
                  capa={app.capa}
                  selo={app.selo}
                  marca={app.marca}
                  porte={portes[n]}
                />
              ))}
            </ul>
          </section>
        );
      })}

      {/* «Sua conta» saiu daqui em 23/08: salvos, repertório e perfil moram no
          menu do ícone de conta, no alto da tela. Eles não são aplicativos — são
          o que é da pessoa —, e no fim de uma lista de capas ninguém os achava.

          O bastidor virou componente próprio em 2026-08: ele passou a ser recortado pelo
          PAPEL escolhido, e isso mora no navegador — filtrar aqui marcaria as 34 capas
          desta prateleira como conteúdo de cliente por causa de quatro links. */}
      <HubBastidor />
    </div>
  );
}
