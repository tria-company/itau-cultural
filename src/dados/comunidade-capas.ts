import { COMUNIDADE_OFICIAL } from "./comunidade";

/**
 * comunidade-capas.ts — a capa semeada de cada comunidade.
 *
 * EXISTE PORQUE `ComunidadeDefinida` NÃO TEM CAMPO DE IMAGEM, e aquele tipo mora em
 * `src/lib/pontos/tipos.ts`, arquivo que veio do outro ramo por cópia literal. Abrir um
 * campo lá custaria fidelidade em troca de um dado que só esta metade do produto usa.
 *
 * A CAPA É UMA FOTO DO ACERVO, com crédito e texto alternativo, como qualquer imagem que
 * este produto mostra. A do Itaú Cultural é a mesma do auditório que abre o feed da casa:
 * nenhuma cena inventada, nenhuma foto sem quem a fez.
 *
 * O produtor troca a capa pela gestão da comunidade, e a troca vive no armazém
 * `produtor.comunidade.v1`. Isto aqui é o ponto de partida, não o estado.
 */

/**
 * O PREFIXO E QUANTOS ENDEREÇOS O BUILD RESERVA para o que o Produtor ainda vai publicar.
 *
 * Moram AQUI, e não no armazém, por uma razão de fronteira: `comunidade-estado.ts` é
 * `"use client"`, e constante exportada de módulo de cliente não chega ao servidor — vira
 * referência de cliente. O `generateStaticParams` da rota da publicação lia `undefined` e
 * gerava zero página reservada, em silêncio (medido, 2026-08-28).
 *
 * Sob `output: "export"` não existe rota curinga: id sem HTML é 404 duro. Vinte é o teto
 * da demonstração, e a gestão recusa criar a vigésima primeira dizendo por quê.
 */
export const PREFIXO_DA_PUBLICACAO = "pub-produtor-";
export const SLUGS_RESERVADOS = 20;

export interface CapaDeComunidade {
  comunidadeId: string;
  /** Caminho no acervo, sempre local: não há requisição externa em runtime. */
  imagem: string;
  imagemAlt: string;
  imagemCredito: string;
  /** Uma linha sob o nome, na capa. Vazia quando não há o que dizer. */
  chamada: string;
}

export const CAPAS_DE_COMUNIDADE: CapaDeComunidade[] = [
  {
    comunidadeId: COMUNIDADE_OFICIAL,
    imagem: "/acervo/b7356adde1e249a7.jpeg",
    imagemAlt:
      "O auditório do Itaú Cultural visto do alto. No telão atrás do palco, está escrito Caminhada Rumos. No palco há duas pessoas sob a luz e a plateia está cheia e pouco iluminada.",
    imagemCredito: "Itaú Cultural",
    chamada: "Programação, bastidores e o que está sendo pensado.",
  },
];

const POR_ID = new Map(CAPAS_DE_COMUNIDADE.map((c) => [c.comunidadeId, c]));

/**
 * A capa semeada, ou `null` quando a comunidade não tem uma.
 *
 * As 21 comunidades do marketplace não têm capa própria de propósito: elas pertencem a
 * instituições, coletivos e pessoas reais, e escolher uma foto para representá-las seria
 * a mesma linha que este produto se recusa a cruzar ao não autorar elenco.
 */
export function capaSemeada(comunidadeId: string): CapaDeComunidade | null {
  return POR_ID.get(comunidadeId) ?? null;
}
