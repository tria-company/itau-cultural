import Image from "next/image";

/**
 * selo-nivel.tsx — o selo do nível.
 *
 * SÃO DEZOITO ARTES, uma por degrau, em `public/selos/`. Elas substituíram o
 * desenho procedural que existia aqui — seis faixas de cor com três pontos —, que
 * era o que dava para fazer sem arte e nunca foi a intenção final.
 *
 * A ORDEM DO ARQUIVO É A ORDEM DA ESCADA, e o mapa abaixo é explícito em vez de
 * derivado do nome do nível: derivar por slug faria a arte sumir em silêncio no
 * dia em que alguém trocasse «Farol» por outro nome — e um selo que some não
 * quebra build nenhum, só aparece vazio na tela de alguém.
 *
 * A COR NÃO ACOMPANHA O TEMA, e é uma escolha: são artes chapadas de contorno
 * escuro, legíveis sobre o claro e sobre o escuro, exatamente como os selos de
 * marca do resto do projeto. Uma segunda versão por tema seria 36 arquivos para
 * manter.
 */

const ARTES = [
  "selo-01-curioso.png",
  "selo-02-visitante.png",
  "selo-03-frequentador.png",
  "selo-04-presenca-certa.png",
  "selo-05-andarilho.png",
  "selo-06-caminhante.png",
  "selo-07-trilheiro.png",
  "selo-08-atravessador.png",
  "selo-09-cartografo.png",
  "selo-10-colecionador-de-olhares.png",
  "selo-11-guia-de-sala.png",
  "selo-12-anfitriao.png",
  "selo-13-contador-de-historias.png",
  "selo-14-curador-de-bolso.png",
  "selo-15-mestre-de-trilha.png",
  "selo-16-farol.png",
  "selo-17-memoria-viva.png",
  "selo-18-repertorio-vivo.png",
] as const;

/** As seis faixas de três degraus — o agrupamento que a tela da escada usa. */
const DEGRAUS_POR_FAIXA = 3;

export function faixaDoNivel(nivel: number) {
  const indice = Math.min(5, Math.floor((nivel - 1) / DEGRAUS_POR_FAIXA));
  const degrau = ((nivel - 1) % DEGRAUS_POR_FAIXA) + 1;
  return { indice, degrau };
}

export function SeloDeNivel({
  nivel,
  porte = "grande",
}: {
  nivel: number;
  /** `pequeno` é o selo grudado no canto do ícone de perfil. */
  porte?: "grande" | "pequeno";
}) {
  // Nível fora da escada não derruba a tela: cai no primeiro selo. Um `undefined`
  // aqui viraria `src` vazio e um ícone quebrado no cabeçalho de todas as telas.
  const arte = ARTES[Math.min(ARTES.length, Math.max(1, nivel)) - 1] ?? ARTES[0];

  return (
    <Image
      src={`/selos/${arte}`}
      alt=""
      width={256}
      height={256}
      className="selo-nivel"
      data-porte={porte}
      unoptimized
    />
  );
}
