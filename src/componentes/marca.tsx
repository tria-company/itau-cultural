import Image from "next/image";
import Link from "next/link";

/**
 * Assinatura Fix oficial do Itaú Cultural e chancela da Fundação Itaú.
 *
 * Os SVG em `/marca` são os arquivos dos sites oficiais — não é lettering
 * reconstruído em CSS. O manual (p. 6 e 10) manda usar o arquivo original e
 * não alterar proporção nem lettering. A versão negativa existe porque o
 * mesmo manual autoriza branco sobre fundo escuro.
 *
 * A chancela segue o guia da Fundação Itaú (fev/2026): logo na altura mínima
 * digital (5rem = 80 px no corpo de 16 px) e alinhada ao centro da régua.
 *
 * A RÉGUA TEM TRÊS CASAS DESDE 2026-08-25 — Fundação Itaú, Itaú Cultural e Noz, cada
 * uma com um terço da largura. A marca da Noz é PNG, e não SVG como as outras duas:
 * foi o que chegou. Vale a mesma regra de sempre — a forma é a do arquivo recebido,
 * ninguém redesenhou lettering. A versão escura é a MESMA silhueta em branco, gerada
 * da máscara de alfa: o azul da marca (#00289A) mede 1,58:1 sobre a superfície escura
 * e some; o branco mede 18,73:1. Se a Noz tiver uma negativa oficial, ela entra no
 * lugar sem tocar em código.
 */

function ParDeMarca({
  claro,
  escuro,
  largura,
  altura,
  classe,
  prioridade,
}: {
  claro: string;
  escuro: string;
  largura: number;
  altura: number;
  classe: string;
  prioridade?: boolean;
}) {
  return (
    <span className={classe} aria-hidden>
      <Image
        src={claro}
        alt=""
        width={largura}
        height={altura}
        className={`${classe}-positivo`}
        unoptimized
        priority={prioridade}
      />
      <Image
        src={escuro}
        alt=""
        width={largura}
        height={altura}
        className={`${classe}-negativo`}
        unoptimized
        priority={prioridade}
      />
    </span>
  );
}

export function AssinaturaIc({ prioridade = false }: { prioridade?: boolean }) {
  return (
    <Link href="/descobrir" className="marca-ic" aria-label="Itaú Cultural, início">
      <ParDeMarca
        claro="/marca/itau-cultural.svg"
        escuro="/marca/itau-cultural-negativo.svg"
        largura={518}
        altura={82}
        classe="marca-ic-arquivo"
        prioridade={prioridade}
      />
    </Link>
  );
}

export function Chancela() {
  return (
    <footer className="chancela">
      <p className="chancela-rotulo tipo-micro">Realização</p>
      <div className="chancela-regua">
        <a
          href="https://www.fundacaoitau.org.br/"
          className="chancela-fit"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Fundação Itaú, abre em nova aba"
        >
          <ParDeMarca
            claro="/marca/fundacao-itau.svg"
            escuro="/marca/fundacao-itau-inverso.svg"
            largura={652}
            altura={595}
            classe="chancela-fit-arquivo"
          />
        </a>
        <AssinaturaIc />
        {/* NOZ, a terceira realizadora (2026-08-25). Sem link: as outras duas apontam
            para endereços que eu conferi, e inventar uma URL para levar quem clica a
            um lugar errado é pior do que não levar a lugar nenhum. Assim que o endereço
            vier, isto vira um <a> igual ao da Fundação. */}
        <span className="chancela-noz">
          <ParDeMarca
            claro="/marca/noz.png"
            escuro="/marca/noz-negativo.png"
            largura={564}
            altura={206}
            classe="chancela-noz-arquivo"
          />
        </span>
      </div>
    </footer>
  );
}
