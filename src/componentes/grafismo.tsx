/**
 * grafismo.tsx — o `\` do Itaú Cultural, nas três variações do manual (D-11, FUND-03).
 *
 * O manual usa a barra invertida como MARCADOR DE SEÇÃO, colada na palavra:
 * `\Sólido`, `\Plural`, `\Digital`. É esse o uso previsto aqui — não é ícone, não é
 * botão, não é ornamento de canto. Toda tela desta fase em diante abre suas seções com
 * ele, o que dá ritmo de marca sem precisar de nenhum outro elemento gráfico.
 *
 * Desenhado como SVG inline com `currentColor`: herda a cor de onde for usado e serve
 * tanto sobre fundo claro quanto sobre fundo escuro, sem uma segunda cópia do arquivo.
 *
 * As três variações:
 *   - "completo"  o `\C` — a assinatura fechada
 *   - "barra"     só o `\` — o marcador de seção, o uso mais frequente
 *   - "espacado"  o `\C` com respiro entre os dois sinais, para aplicação em destaque
 */

export type VariacaoGrafismo = "completo" | "barra" | "espacado";

interface PropsGrafismo {
  variacao?: VariacaoGrafismo;
  className?: string;
  /**
   * Rótulo para leitor de tela. Quando ausente — que é o caso do marcador de seção,
   * porque o título ao lado já diz tudo — o SVG é marcado como decorativo.
   */
  rotulo?: string;
}

/** Geometria por variação. A barra é sempre a mesma; o que muda é o `C` e o respiro. */
const CAIXA: Record<VariacaoGrafismo, { largura: number; centroC: number | null }> = {
  barra: { largura: 24, centroC: null },
  completo: { largura: 46, centroC: 32 },
  espacado: { largura: 58, centroC: 44 },
};

export function Grafismo({ variacao = "barra", className, rotulo }: PropsGrafismo) {
  const { largura, centroC } = CAIXA[variacao];
  const decorativo = !rotulo;

  return (
    <svg
      viewBox={`0 0 ${largura} 24`}
      width={largura}
      height={24}
      className={className}
      role={decorativo ? undefined : "img"}
      aria-hidden={decorativo ? true : undefined}
      focusable="false"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {rotulo ? <title>{rotulo}</title> : null}
      {/* A barra invertida, como sólido — no manual ela é forma, não traço de fonte. */}
      <path d="M2 1.5H8.6L22 22.5H15.4L2 1.5Z" fill="currentColor" />
      {centroC === null ? null : (
        /* O `C` aberto à direita, com a mesma espessura visual da barra.
         *
         * A COR DELE NÃO É A DA BARRA (27.08). Os dois usavam `currentColor` e saíam
         * laranja juntos; na marca, o C é a tinta e a barra é a cor de ação. Ele lê
         * `--cor-do-c`, que cai em `--cor-tinta` — branco no tema escuro, preto no claro —
         * e continua podendo ser sobrescrito onde a marca precisar dos dois na mesma cor.
         */
        <path
          d={`M${centroC + 6.2} 5.4A8.6 8.6 0 1 0 ${centroC + 6.2} 18.6`}
          stroke="var(--cor-do-c, var(--cor-tinta))"
          strokeWidth={4.2}
        />
      )}
    </svg>
  );
}

/**
 * O uso canônico: `\Título`. Junta grafismo e palavra do jeito que o manual faz, para
 * as fases 2 a 6 não reinventarem o espaçamento em cada tela.
 */
export function TituloComGrafismo({
  children,
  nivel = 2,
  className,
}: {
  children: React.ReactNode;
  nivel?: 1 | 2 | 3;
  className?: string;
}) {
  const Tag = (["h1", "h2", "h3"] as const)[nivel - 1];
  return (
    <Tag className={`flex items-center gap-1.5 font-bold ${className ?? ""}`}>
      <Grafismo variacao="barra" className="h-[0.9em] w-auto text-acao-tinta" />
      <span>{children}</span>
    </Tag>
  );
}
