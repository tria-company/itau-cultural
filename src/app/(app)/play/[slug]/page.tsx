import { Player } from "@/componentes/player";
import { DATA_DE_REFERENCIA } from "@/dados/alerta";
import { slugsPorTipo, vizinhos } from "@/dados/grafo";
import { corpoPorSlug } from "@/dados/corpos";
import {
  colecaoDaMidia,
  eventosDaMidia,
  itemDoPlay,
  semelhantesDaMidia,
} from "@/dados/play";
import { rotaDaEntidade } from "@/dados/rotas";
import { limitarSlugs } from "@/dados/limite-paginas";

/**
 * A rota de uma mídia — **529 páginas**, o maior acréscimo desta fase (D-92).
 *
 * Reserva `sem-entidade` para o caso da classe vazia, no molde das rotas irmãs. Sob
 * `output: "export"` (D-24) um `generateStaticParams` que devolve lista vazia não exporta
 * página nenhuma e a rota deixaria de existir. Hoje a classe tem 529 mídias e o reserva
 * não é emitido.
 *
 * É PÁGINA DE SERVIDOR: é ela que toca `@/dados/play` e `@/dados/grafo`. O componente
 * recebe tudo por propriedade (DP-F).
 *
 * O DTO POR PÁGINA É ENXUTO DE PROPÓSITO. Ele não paga chunk — o payload de uma rota
 * exportada viaja no HTML da própria página, como 05-01 mediu —, mas paga HTML, e são
 * 529 arquivos. Vai daqui só o que ESTA página mostra, e nada de catálogo.
 *
 * EM 23/08 ENTRARAM DUAS LISTAS, e o cabeçalho antes dizia que nenhuma entraria. A página
 * do item era uma ficha e virou a página de um TÍTULO, no molde da referência: quem chega
 * nela precisa saber para onde ir depois. As duas foram medidas antes de entrar —
 * a coleção manda só campo de cartão (sem resumo), e os semelhantes têm teto de 12.
 */
export function generateStaticParams() {
  const slugs = slugsPorTipo("midia");
  const cortados = limitarSlugs(slugs);
  return (cortados.length ? cortados : ["sem-entidade"]).map((slug) => ({ slug }));
}

/**
 * Resolve o PARÂMETRO DE ROTA em item do catálogo — e não é `itemDoPlay(slug)` direto.
 *
 * O DEFEITO QUE ISTO CONSERTA, medido e não suposto: **8 das 529 mídias têm slug com
 * caractere fora de `[a-z0-9-]`** no acervo — aspas curvas, acento, travessão e até um
 * espaço de largura zero (U+200B). Um deles traz o TÍTULO INTEIRO enxertado no meio do
 * slug (`…-a-fo“17º In-Edit Brasil” leva à IC Play…rca-da-musica…`). É defeito do dado de
 * origem, não desta tela; `dados/` é somente-leitura aqui e o grafo não é regerado.
 *
 * Sob `output: "export"`, o Next ESCREVE o diretório com o nome decodificado e ENTREGA o
 * parâmetro percent-encodado. Comparar o parâmetro cru contra a chave do catálogo falha
 * exatamente nessas 8 — e o sintoma era o pior tipo: a rota EXISTIA, o build passava, e a
 * página servia «mídia não encontrada». 521 páginas certas e 8 mortas passariam em
 * qualquer contagem de rotas.
 *
 * A normalização Unicode entra pelo mesmo motivo: o sistema de arquivos do macOS pode
 * devolver a forma decomposta (NFD) de um nome gravado composto (NFC), e as duas são
 * strings diferentes para `Map.get` apesar de serem o mesmo texto na tela.
 *
 * Isto NÃO inventa dado nenhum: é o mesmo item, alcançado pela chave que ele já tem.
 */
function resolverParametro(param: string) {
  const tentativas = new Set<string>([param]);
  try {
    tentativas.add(decodeURIComponent(param));
  } catch {
    // Parâmetro com `%` solto não é decodificável — o valor cru segue valendo.
  }
  for (const t of [...tentativas]) {
    tentativas.add(t.normalize("NFC"));
    tentativas.add(t.normalize("NFD"));
  }
  for (const t of tentativas) {
    const achado = itemDoPlay(t);
    if (achado) return achado;
  }
  return undefined;
}

export default async function PaginaDaMidia({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = resolverParametro(slug);

  if (!item) {
    return (
      <main className="flex flex-col gap-2 p-4">
        <h1 className="text-lg font-bold">Mídia não encontrada</h1>
        <p className="text-sm">
          Nenhuma mídia do acervo responde por «{slug}».{" "}
          <a href="/play/" className="underline underline-offset-4">
            Voltar ao catálogo
          </a>
          .
        </p>
      </main>
    );
  }

  /**
   * `aprofunda` saindo desta mídia. **Medido no acervo: ZERO nas 529** — nenhuma mídia
   * tem essa aresta. A consulta fica aqui mesmo assim, e não substituída por uma lista
   * vazia escrita à mão: se o grafo for regerado com essas arestas, a tela passa a
   * mostrá-las sem que ninguém precise lembrar de voltar aqui.
   */
  const aprofunda = vizinhos(item.id, "aprofunda").flatMap((v) => {
    const rota = rotaDaEntidade(v.entidade.classe, v.entidade.slug);
    if (!rota) return [];
    return [
      {
        slug: v.entidade.slug,
        titulo: v.entidade.titulo,
        rota,
        motivo: v.aresta.motivo,
      },
    ];
  });
  const corpo = corpoPorSlug(item.slug);
  const spotify = corpo?.spotify;

  return (
    <Player
      midia={{
        slug: item.slug,
        titulo: item.titulo,
        rotuloCategoria: item.rotuloCategoria,
        resumo: item.resumo,
        imagem: item.imagem,
        imagemAlt: item.imagemAlt,
        creditoImagem: item.creditoImagem,
        dia: item.dia,
        linguagens: item.linguagens,
        temas: item.temas,
        fonte: item.fonte,
        acessibilidade: item.acessibilidade,
        declaraAcessibilidade: item.declaraAcessibilidade,
        procedencia: item.procedencia,
        youtubeId: corpo?.youtubeId,
        spotify,
      }}
      colecao={(() => {
        const c = colecaoDaMidia(item.slug);
        if (!c) return undefined;
        return {
          rotulo: c.rotulo,
          origem: c.origem,
          total: c.total,
          // SÓ CAMPO DE CARTÃO, sem resumo: são até 70 irmãs numa coleção grande, e um
          // resumo de ~200 bytes em cada multiplicaria o HTML de 529 páginas.
          irmas: c.irmas.map((o) => ({
            slug: o.slug,
            titulo: o.titulo,
            rota: o.rota,
            imagem: o.imagem,
            dia: o.dia,
            rotuloCategoria: o.rotuloCategoria,
            libras: o.acessibilidade.libras,
          })),
        };
      })()}
      semelhantes={semelhantesDaMidia(item.id).map((o) => ({
        slug: o.slug,
        titulo: o.titulo,
        rota: o.rota,
        imagem: o.imagem,
        rotuloCategoria: o.rotuloCategoria,
      }))}
      eventos={eventosDaMidia(item.slug)}
      aprofunda={aprofunda}
      dataDeReferencia={DATA_DE_REFERENCIA}
    />
  );
}
