import type { ComponentPropsWithoutRef, ReactNode } from "react";

/**
 * segmento.tsx, o controle segmentado, a segunda primitiva de `base/`.
 *
 * POR QUE ELE NÃO É UM CHIP, e por que a distinção importa. O chip é um recorte
 * OPCIONAL e independente: nenhum, um ou vários podem estar ligados, e desligar
 * todos é um estado válido. O segmento é uma escolha EXCLUSIVA e obrigatória,
 * sempre exatamente um está ligado, e não existe «nenhum». Desenhá-los igual
 * ensinaria a coisa errada: que dá para desmarcar o recorte de uma lista que
 * precisa estar em algum recorte.
 *
 * A diferença fica no desenho: os chips são pílulas soltas com espaço entre
 * elas; o segmento é UMA pílula com divisões dentro, e o selecionado desliza no
 * lugar. Uma leitura diz «escolha quantos quiser», a outra diz «escolha um».
 *
 * O QUE ELE SUBSTITUI. `.web-alternador`, que existia só sob `[data-view="web"]`
 *, na visão app o mesmo JSX renderizava botões nus do navegador, sem borda e
 * sem estado visível. Nunca apareceu porque os três lugares que o usam ficam
 * escondidos no app; era um defeito esperando alguém usá-lo numa tela pública.
 * A primitiva serve as duas visões.
 */

type PropsSegmento = {
  /** O que o grupo escolhe, vira `aria-label`, que é o que o leitor anuncia. */
  rotulo: string;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"div">, "className" | "role" | "aria-label">;

export function Segmento({ rotulo, children, className, ...resto }: PropsSegmento) {
  return (
    <div
      role="group"
      aria-label={rotulo}
      className={`segmento${className ? ` ${className}` : ""}`}
      {...resto}
    >
      {children}
    </div>
  );
}

type PropsOpcao = {
  /** Vira `aria-pressed`. Exatamente uma opção do grupo deve receber `true`. */
  selecionado: boolean;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"button">, "className" | "children" | "type" | "aria-pressed">;

export function OpcaoDeSegmento({ selecionado, children, className, ...resto }: PropsOpcao) {
  return (
    <button
      type="button"
      aria-pressed={selecionado}
      className={`segmento-opcao${className ? ` ${className}` : ""}`}
      {...resto}
    >
      {children}
    </button>
  );
}
