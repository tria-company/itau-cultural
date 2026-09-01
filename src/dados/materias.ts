/**
 * materias.ts — a ficha de uma matéria ou publicação, montada no BUILD.
 *
 * Junta o grafo (chamada, imagem, ligações) com o corpo parseado de
 * `corpos.ts` quando o coletor trouxe o HTML. Página de servidor só.
 */
import { corpoPorSlug, type AutorDoCorpo, type BlocoCorpo, type EspecieSpotify } from "./corpos";
import { porSlug, slugsPorTipo, vizinhos } from "./grafo";
import { capaDe } from "./imagem";
import { ROTULOS as ROTULOS_LEITURA } from "./leituras";
import { rotaDaEntidade } from "./rotas";
import type { ClasseEntidade, Entidade } from "./tipos";

export type FamiliaMateria = "noticia" | "entrevista" | "coluna" | "opiniao" | "publicacao";

export interface MateriaLigada {
  slug: string;
  titulo: string;
  rota: string;
  classe: ClasseEntidade;
  motivo?: string;
}

export interface MateriaCompleta {
  slug: string;
  classe: "conteudo" | "publicacao";
  titulo: string;
  categoria: string;
  rotuloCategoria: string;
  familia: FamiliaMateria;
  resumo: string;
  imagem?: string;
  creditoImagem?: string;
  imagemAlt?: string;
  dia: number;
  linguagens: string[];
  autor?: AutorDoCorpo;
  blocos: BlocoCorpo[];
  youtubeId?: string;
  spotify?: { url: string; especie: EspecieSpotify };
  relacionados: MateriaLigada[];
  relacionadosTotal: number;
}

/**
 * Quantas ligações a matéria oferece no fim.
 *
 * TRÊS, E NÃO OITO (27.08, pedido do cliente). Oito sugestões no pé de uma leitura é a
 * parede que faz ninguém clicar em nenhuma: quem terminou de ler quer um próximo passo,
 * não um menu. O grafo continua alcançando tudo — o que muda é quanto a tela oferece de
 * uma vez.
 */
const TETO_RELACIONADOS = 3;

function familiaDe(classe: "conteudo" | "publicacao", categoria: string): FamiliaMateria {
  if (classe === "publicacao") return "publicacao";
  if (categoria === "entrevista") return "entrevista";
  if (categoria === "colunistas") return "coluna";
  if (categoria === "opiniao") return "opiniao";
  return "noticia";
}

function diaDe(publicadoEm: string): number {
  if (!publicadoEm) return 0;
  const n = Number(publicadoEm.slice(0, 10).replace(/-/g, ""));
  return Number.isInteger(n) ? n : 0;
}

function relacionadosDe(id: string): { itens: MateriaLigada[]; total: number } {
  const vistos = new Set<string>();
  const itens: MateriaLigada[] = [];
  for (const v of vizinhos(id)) {
    if (vistos.has(v.entidade.id)) continue;
    const rota = rotaDaEntidade(v.entidade.classe, v.entidade.slug);
    if (!rota) continue;
    vistos.add(v.entidade.id);
    if (itens.length < TETO_RELACIONADOS) {
      itens.push({
        slug: v.entidade.slug,
        titulo: v.entidade.titulo,
        rota,
        classe: v.entidade.classe,
        motivo: v.aresta.motivo,
      });
    }
  }
  return { itens, total: vistos.size };
}

function deEntidade(e: Entidade, classe: "conteudo" | "publicacao"): MateriaCompleta {
  const categoria = String(e.extra?.categoria ?? "");
  const rotulo =
    classe === "publicacao"
      ? "Publicação"
      : (ROTULOS_LEITURA as Record<string, string>)[categoria] ?? "Texto";
  const publicadoEm = typeof e.extra?.publicadoEm === "string" ? e.extra.publicadoEm : "";
  const capa = capaDe(e);
  const corpo = corpoPorSlug(e.slug);
  const ligacoes = relacionadosDe(e.id);
  return {
    slug: e.slug,
    classe,
    titulo: e.titulo,
    categoria,
    rotuloCategoria: rotulo,
    familia: familiaDe(classe, categoria),
    resumo: e.resumo ?? "",
    imagem: capa.imagem,
    creditoImagem: capa.creditoImagem ?? e.creditoImagem,
    imagemAlt: typeof e.extra?.imagemAlt === "string" && e.extra.imagemAlt ? e.extra.imagemAlt : undefined,
    dia: diaDe(publicadoEm),
    linguagens: e.linguagens,
    autor: corpo?.autor,
    blocos: corpo?.blocos ?? [],
    youtubeId: corpo?.youtubeId,
    spotify: corpo?.spotify,
    relacionados: ligacoes.itens,
    relacionadosTotal: ligacoes.total,
  };
}

export function slugsDeMateria(): string[] {
  return [...slugsPorTipo("conteudo"), ...slugsPorTipo("publicacao")];
}

export function materiaPorSlug(slug: string): MateriaCompleta | undefined {
  const tentativas = new Set<string>([slug]);
  try {
    tentativas.add(decodeURIComponent(slug));
  } catch (erro) {
    if (!(erro instanceof URIError)) throw erro;
  }
  for (const t of [...tentativas]) {
    tentativas.add(t.normalize("NFC"));
    tentativas.add(t.normalize("NFD"));
  }
  for (const t of tentativas) {
    const conteudo = porSlug("conteudo", t);
    if (conteudo) return deEntidade(conteudo, "conteudo");
    const pub = porSlug("publicacao", t);
    if (pub) return deEntidade(pub, "publicacao");
  }
  return undefined;
}
