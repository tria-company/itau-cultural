import Link from "next/link";
import { Grafismo } from "@/componentes/grafismo";
import { SeletorDisposicao } from "@/componentes/seletor-disposicao";
import { TrocaPersona } from "@/componentes/troca-persona";
import { TrocaDeAcesso } from "@/componentes/troca-de-acesso";
import { repertorioDe } from "@/dados/repertorio";
import { PERSONAS } from "@/dados/personas";

/**
 * `/meu` — o PERFIL COMO HUB (reformulação 2026-08: o cliente reprovou a
 * organização da tela). A troca de persona no topo (D-45 — ela mora SÓ aqui e no
 * rodapé do menu) e quatro portas em cartão, cada uma dizendo o que entrega. O
 * mapa de repertório, que ocupava esta tela inteira, virou tela própria em
 * /meu/repertorio — aqui fica o resumo por persona, medido no build.
 */

/** O resumo do repertório das três personas, pré-computado (D-45). */
const resumos = Object.fromEntries(
  PERSONAS.map((p) => {
    const r = repertorioDe(p.id);
    return [
      p.id,
      { atravessadas: r.linguagensAtravessadas.length, aUmPasso: r.linguagensNovas.length },
    ];
  }),
);

export default function Meu() {
  return (
    <div className="flex flex-col gap-5 p-5 desk:p-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">Meu perfil</h1>
        </div>
      </header>

      {/* D-45 — trocar de persona é um toque, e vale para o produto inteiro. */}
      <TrocaPersona />

      <SeletorDisposicao permanente />

      {/* O TIPO DE ACESSO MORA EM TODA TELA DE PERFIL. Quem está como Público e quer
          voltar ao Studio não deveria precisar da URL de `/entrar`: o mesmo controle da
          tela do Produtor aparece aqui, com o mesmo componente. */}
      <TrocaDeAcesso />

      <nav aria-label="Atalhos do perfil" className="grid gap-3 desk:grid-cols-2">
        <Link href="/meu/repertorio" className="cartao no-underline">
          <span className="tipo-detalhe font-bold">Mapa de repertório</span>
          <span className="tipo-legenda text-tinta-2">
            As linguagens que cada persona atravessou e as que estão a um passo —{" "}
            {Object.values(resumos)
              .map((r) => r.atravessadas)
              .join("/")}{" "}
            atravessadas por Maria, Carlos e Joana.
          </span>
          <span className="tipo-legenda font-bold text-acao-tinta">abrir o mapa →</span>
        </Link>
        <Link href="/desafios" className="cartao no-underline">
          <span className="tipo-detalhe font-bold">Desafios</span>
          <span className="tipo-legenda text-tinta-2">
            As missões da semana, o seu nível e o que falta para o próximo.
          </span>
          <span className="tipo-legenda font-bold text-acao-tinta">abrir →</span>
        </Link>
        <Link href="/meu/carteira" className="cartao no-underline">
          <span className="tipo-detalhe font-bold">Carteira</span>
          <span className="tipo-legenda text-tinta-2">
            Suas fichas, o extrato de onde cada uma veio e as entregas do que você resgatou.
          </span>
          <span className="tipo-legenda font-bold text-acao-tinta">abrir →</span>
        </Link>
        <Link href="/meu/conquistas" className="cartao no-underline">
          <span className="tipo-detalhe font-bold">Conquistas</span>
          <span className="tipo-legenda text-tinta-2">
            As metas da semana, os emblemas e a tabela do que dá ficha.
          </span>
          <span className="tipo-legenda font-bold text-acao-tinta">ver →</span>
        </Link>
        <Link href="/salvos" className="cartao no-underline">
          <span className="tipo-detalhe font-bold">Salvos e alertas</span>
          <span className="tipo-legenda text-tinta-2">
            As sessões que você guardou, com aviso quando o produtor altera horário ou
            cancela.
          </span>
          <span className="tipo-legenda font-bold text-acao-tinta">abrir →</span>
        </Link>
        <Link href="/filtros" className="cartao no-underline">
          <span className="tipo-detalhe font-bold">Acessibilidade</span>
          <span className="tipo-legenda text-tinta-2">
            As 8 dimensões como critério que se marca uma vez e vale para toda a agenda.
          </span>
          <span className="tipo-legenda font-bold text-acao-tinta">configurar →</span>
        </Link>
        <Link href="/ia" className="cartao no-underline">
          <span className="tipo-detalhe font-bold">Roteiros</span>
          <span className="tipo-legenda text-tinta-2">
            Os roteiros que você montou a partir do acervo, guardados neste navegador.
          </span>
          <span className="tipo-legenda font-bold text-acao-tinta">ver →</span>
        </Link>
      </nav>
    </div>
  );
}
