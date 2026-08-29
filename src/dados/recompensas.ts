/**
 * recompensas.ts — o catálogo de resgate.
 *
 * A REGRA QUE DEFINE ESTE ARQUIVO: o prêmio é cultura, não brinde. Caneca, chaveiro
 * e camiseta com logotipo matam um programa cultural em duas semanas — eles dizem
 * que o valor do que a pessoa fez é um objeto promocional. O que o Itaú Cultural
 * tem de melhor para dar é justamente o que ele já produz: acesso, publicação,
 * bastidor. Custa menos e vale mais.
 *
 * ESCALA ÚNICA, e é a correção do defeito mais caro da aplicação de origem, que
 * tinha uma vitrine de 4.800 a 120.000 e uma carteira de 120 a 700 — o mesmo saldo
 * destravava uma tela e travava a outra. Aqui tudo vive entre 90 e 520, ancorado
 * num mês de uso engajado (~140 fichas). O item mais barato é meio mês; o mais
 * caro, pouco menos de quatro.
 *
 * AS IMAGENS SÃO DO ACERVO, com o alt e o crédito que o CMS publica. Escolher uma
 * foto bonita e escrever a descrição por conta própria poria palavra nossa na boca
 * do Itaú Cultural; aqui cada capa carrega a autoria de quem a fez.
 *
 * ESTOQUE `null` NÃO É LACUNA. As famílias `poder` e `devolver` não consomem nada
 * físico: destacar a própria publicação ou apoiar um produtor pode acontecer mil
 * vezes. Fingir um estoque ali seria escassez inventada.
 */

import type { RecompensaDefinida } from "@/lib/pontos/tipos";

export const RECOMPENSAS: RecompensaDefinida[] = [
  /* ── Acesso — o que o IC já faz e não custa estoque novo ───────────────── */
  {
    id: "rec-exposicao",
    familia: "acesso",
    titulo: "Ingresso para exposição",
    descricao: "Uma entrada para a exposição em cartaz no Itaú Cultural.",
    custo: 90,
    estoque: 120,
    entrega: "presencial",
    imagem: "/acervo/e893d47abc83a790.jpg",
    imagemAlt: "Sala de exposição mostra um tambor em cima de uma estrutura de madeira, deitado. Há quadros no canto esquerdo, com imagens pintadas e retratadas de pessoas negras. No fundo, em cima de um altar com toalha roxa, há três imagens de santos.",
    imagemCredito: "Leticia Vieira",
  },
  {
    id: "rec-visita",
    familia: "acesso",
    titulo: "Visita mediada",
    descricao: "Percurso com educador pela mostra, em grupo pequeno.",
    custo: 120,
    estoque: 40,
    entrega: "presencial",
    imagem: "/acervo/5ebf5166d88119df.jpeg",
    imagemAlt: "Fotografia colorida de um homem e uma mulher analisando objetos em cima de uma mesa branca. A mulher tira foto de um livro aberto, sobre um pano impresso com uma fotografia da abertura de uma exposição. O homem olha para a capa de outro livro.",
    imagemCredito: "Brunno Covello",
  },
  {
    id: "rec-cortesia",
    familia: "acesso",
    titulo: "Cortesia para uma sessão",
    descricao: "Um lugar em espetáculo, show ou sessão de cinema da programação.",
    custo: 180,
    estoque: 60,
    entrega: "presencial",
    imagem: "/acervo/3af29611d6cc095d.jpeg",
    imagemAlt: "Jorge Mautner no palco do Auditório Ibirapuera, em 2014. Ele veste uma roupa vermelha e está tocando violino. Atrás dele é possível ver alguns três pontos de luz.",
    imagemCredito: "divulgação",
  },
  {
    id: "rec-rumos",
    familia: "acesso",
    titulo: "Acesso antecipado ao Rumos",
    descricao: "Veja os selecionados e a programação antes do anúncio público.",
    custo: 260,
    estoque: null,
    entrega: "digital",
    imagem: "/acervo/798c532ee14c2b47.jpeg",
    imagemAlt: "Imagem na cor laranja com a frase Rumos Itaú Cultural em branco.",
    imagemCredito: "Itaú Cultural",
  },
  {
    id: "rec-oficina",
    familia: "acesso",
    titulo: "Vaga em oficina",
    descricao: "Uma vaga numa formação do Itaú Cultural, presencial ou on-line.",
    custo: 320,
    estoque: 25,
    entrega: "presencial",
    imagem: "/acervo/e7d4efb648fd72c9.jpeg",
    imagemAlt: "Dois dançarinos dançam juntos, sorrindo.",
    imagemCredito: "Fernanda Abdo",
  },
  {
    id: "rec-encontro",
    familia: "acesso",
    titulo: "Encontro com artista",
    descricao: "Conversa fechada com um artista da programação, para poucas pessoas.",
    custo: 450,
    estoque: 12,
    entrega: "presencial",
    imagem: "/acervo/62900cb44f608102.jpg",
    imagemAlt: "Frame de episódio da série O segredo delas. Na imagem, a atriz Zezé Motta sorri enquanto é entrevistada pela atriz Virginia Cavendish. Zezé é uma mulher negra, de cabelos castanho escuros, crespos e longos. Ela veste uma blusa preta e quimono estampado em preto e branco. Do lado direito da imagem, quase fora do quadro, vemos Virginia Cavendish de perfil. Ela é uma mulher branca, de cabelos pretos e usa roupa estampada colorida.",
    imagemCredito: "frame de video",
  },

  /* ── Editorial — o acervo publicado vira objeto ────────────────────────── */
  {
    id: "rec-cartaz",
    familia: "editorial",
    titulo: "Cartaz de exposição",
    descricao: "Impressão do cartaz original, enviada pelo correio.",
    custo: 140,
    estoque: 80,
    entrega: "correio",
    imagem: "/acervo/4f4780bcd7ff34bb.jpg",
    imagemAlt: "Imagem com cor de fundo avermelhada e o logotipo da exposição Um século de agora no centro, na cor branca.",
    imagemCredito: "divulgação",
  },
  {
    id: "rec-publicacao",
    familia: "editorial",
    titulo: "Publicação do Itaú Cultural",
    descricao: "Um dos títulos do catálogo editorial, à sua escolha.",
    custo: 220,
    estoque: 50,
    entrega: "correio",
    imagem: "/acervo/185da8ff0eaf5905.jpeg",
    imagemAlt: "A imagem colorida mostra um apanhado de livros em um sebo.",
    imagemCredito: "Shutterstock",
  },
  {
    id: "rec-catalogo",
    familia: "editorial",
    titulo: "Catálogo de exposição",
    descricao: "O catálogo completo da mostra, com os textos críticos.",
    custo: 280,
    estoque: 30,
    entrega: "correio",
    imagem: "/acervo/aa94b82d449c4722.jpeg",
    imagemAlt: "Imagem do retirada do catálogo Brazil Builds, Architecture New and Old, 1652-1942. Foto em preto e branco, com o título Brazil Builds escrito em letras garrafais e em branco e amarelo.",
    imagemCredito: "G. E. Kidder Smith/retirada do catálogo Brazil Builds, Architecture New and Old, 1652-1942",
  },

  /* ── Bastidor — o que não está aberto ao público ───────────────────────── */
  {
    id: "rec-tecnica",
    familia: "bastidor",
    titulo: "Visita técnica ao Espaço Olavo Setubal",
    descricao: "A coleção numismática vista de perto, com quem cuida dela.",
    custo: 300,
    estoque: 15,
    entrega: "presencial",
    imagem: "/acervo/389b3933b7ea9b3a.jpeg",
    imagemAlt: "A escada do espaço Olavo Setubal, no Itaú Cultural.",
    imagemCredito: "Edouard Fraipont",
  },
  {
    id: "rec-ensaio",
    familia: "bastidor",
    titulo: "Ensaio aberto",
    descricao: "Assista à montagem de um espetáculo antes da estreia.",
    custo: 380,
    estoque: 20,
    entrega: "presencial",
    imagem: "/acervo/5c12cc78b91c728d.jpeg",
    imagemAlt: "Foto preto e branco da atriz Denise Weinberg. Ela olha para frente, está com a mão esquerda levantada. No canto direito superior da imagem está inserido o logo do programa Camarim em Cena.",
    imagemCredito: "André Seiti",
  },
  {
    id: "rec-curador",
    familia: "bastidor",
    titulo: "Conversa com curador",
    descricao: "Como uma mostra é pensada, contado por quem a pensou.",
    custo: 520,
    estoque: 8,
    entrega: "presencial",
    imagem: "/acervo/798522c2527d1961.jpg",
    imagemAlt: "Fotografia colorida de Carol Barreto e Hanayrá Negreiros. Elas estão lado a lado, vestem camisa branca e posam para a foto. CArol Barreto e uma mulher negra de pele clara, tem cabelos ruivos e encaracolados. Hanayrá é uma mulher negra de pele escura e tem cabelos pretos raspados.",
    imagemCredito: "Letícia Vieira/Itaú Cultural",
  },

  /* ── Poder dentro do produto — estoque infinito, valor alto ────────────── */
  {
    id: "rec-destaque",
    familia: "poder",
    titulo: "Destaque para sua publicação",
    descricao: "Sua publicação no topo da comunidade por uma semana.",
    custo: 200,
    estoque: null,
    entrega: "no-produto",
    imagem: "/acervo/591fd7806fc7956a.jpeg",
    imagemAlt: "Zé Celso está em pé, com um microfone no rosto, ao lado de outros artistas do Oficina. A janela do teatro é grande e através dela entra a luz do sol, responsável pela iluminação intensa do local.",
    imagemCredito: "divulgação",
  },
  {
    id: "rec-verbete",
    familia: "poder",
    titulo: "Indique um verbete",
    descricao: "Proponha à Redação um artista ou coletivo que falta na Enciclopédia.",
    custo: 350,
    estoque: null,
    entrega: "no-produto",
    imagem: "/acervo/e6a2623d6ec917da.jpeg",
    imagemAlt: "Imagem com fundo laranja e o logo da Enciclopédia Itaú Cultural na cor branca, no centro da tela.",
    imagemCredito: "Itaú Cultural",
  },
  {
    id: "rec-trilha",
    familia: "poder",
    titulo: "Proponha uma trilha",
    descricao:
      "Monte um percurso entre obras do acervo e mande para a Redação avaliar. Se entrar, leva sua assinatura.",
    custo: 400,
    estoque: null,
    entrega: "no-produto",
    imagem: "/acervo/c54619379be0e016.jpeg",
    imagemAlt: "Foto da biblioteca da FAUUSP que mostra um pouco do acervo da faculdade.",
    imagemCredito: "Acervo da Biblioteca da FAUUSP",
  },

  /* ── Devolver — a família que dá sentido ao resto ──────────────────────── */
  {
    id: "rec-produtor",
    familia: "devolver",
    titulo: "Apoie um produtor cultural",
    descricao:
      "Suas fichas viram apoio direto a um produtor do marketplace de comunidades. Você escolhe quem.",
    custo: 100,
    estoque: null,
    entrega: "no-produto",
    imagem: "/acervo/8d2a67790df56b9c.jpeg",
    imagemAlt: "Homem está deitado, com uma das mãos apoiada na cabeça, e seu corpo aparece pintado com tintas verde, amarela e azul.",
    imagemCredito: "Agência Ophelia",
  },
  {
    id: "rec-deserto",
    familia: "devolver",
    titulo: "Apoie um território sem acervo",
    descricao:
      "Dois estados não têm nenhuma entidade no acervo e dois concentram 59% dele. Suas fichas vão para produção cultural onde não há.",
    custo: 100,
    estoque: null,
    entrega: "no-produto",
    imagem: "/acervo/4c70721927fbceb1.jpeg",
    imagemAlt: "Um grupo de pessoas, entre homens, mulheres, crianças, todos negros, caminham em uma rua de terra. alguns dançam, carregam instrumentos musicais de percussão, vestem roupas coloridas.",
    imagemCredito: "divulgação",
  },

  /* ── Um item de retirada FORA, para a demonstração ter o que mostrar ────────
   *
   * O produtor cola um endereço de afiliado e um cupom que zera o carrinho; quem resgata
   * termina a compra na loja de fora, de graça. O endereço aqui é de EXEMPLO e não aponta
   * para conta de afiliado de ninguém: um link real de afiliado neste arquivo seria receita
   * de alguém dentro de um protótipo de proposta.
   *
   * Zero rede continua valendo. É um `<a href>` que a pessoa CLICA, não uma requisição que
   * o protótipo faz — a mesma distinção que `dados/ingressos.ts` já escreveu para o botão
   * da Sympla, e que os dois portões de rede medem sem observar âncora.
   * ---------------------------------------------------------------------- */
  {
    id: "rec-livro-parceiro",
    familia: "editorial",
    titulo: "Livro na livraria parceira",
    descricao:
      "Um título do catálogo, retirado na livraria parceira. O cupom zera o carrinho: você paga em fichas, não em dinheiro.",
    custo: 160,
    estoque: 25,
    entrega: "link",
    link: "https://exemplo.livrariaparceira.com.br/catalogo/um-seculo-de-agora",
    lojaDeFora: "Livraria parceira",
    cupom: "CULTURA100",
    imagem: "/acervo/185da8ff0eaf5905.jpeg",
    imagemAlt: "A imagem colorida mostra um apanhado de livros em um sebo.",
    imagemCredito: "Shutterstock",
  },
];

export const FAMILIAS: { id: RecompensaDefinida["familia"]; rotulo: string; resumo: string }[] = [
  { id: "acesso", rotulo: "Acesso", resumo: "Entradas, cortesias e vagas na programação" },
  { id: "editorial", rotulo: "Editorial", resumo: "Publicações, catálogos e cartazes" },
  { id: "bastidor", rotulo: "Bastidor", resumo: "O que normalmente não está aberto" },
  { id: "poder", rotulo: "Dentro do app", resumo: "Espaço e voz no próprio produto" },
  { id: "devolver", rotulo: "Devolver", resumo: "Suas fichas viram cultura para outra pessoa" },
];

const POR_ID = new Map(RECOMPENSAS.map((r) => [r.id, r]));

export function recompensaPorId(id: string): RecompensaDefinida | undefined {
  return POR_ID.get(id);
}

export function recompensasDaFamilia(familia: RecompensaDefinida["familia"]) {
  return RECOMPENSAS.filter((r) => r.familia === familia);
}

/** Os cinco rótulos da esteira de entrega, na ordem. */
export const FASES_DE_ENTREGA = [
  { id: "resgatado", rotulo: "Resgatado" },
  { id: "processando", rotulo: "Processando" },
  { id: "separado", rotulo: "Separado" },
  { id: "enviado", rotulo: "Enviado" },
  { id: "entregue", rotulo: "Entregue" },
] as const;
