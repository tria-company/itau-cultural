/**
 * estrela-xp.tsx — a estrela azul, símbolo do percurso.
 *
 * PERCURSO E FICHA PRECISAM SER DISTINGUÍVEIS SEM LER O NÚMERO. A ficha já tem a
 * moeda amarela (`pontos-base.tsx`); o percurso não tinha símbolo nenhum e
 * aparecia como texto solto — o que fazia as duas moedas se confundirem no
 * cabeçalho, onde ficam lado a lado.
 *
 * AZUL, e não amarelo: o amarelo já é a ficha. Duas moedas da mesma cor com
 * ícones diferentes é a combinação que ninguém decodifica de relance.
 */
export function EstrelaXp() {
  return (
    <svg viewBox="0 0 24 24" className="estrela-xp" aria-hidden="true" focusable="false">
      <path
        d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.05 1.1-6.5-4.7-4.6 6.5-.95z"
        fill="var(--ic-azul)"
        stroke="var(--ic-azul)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
