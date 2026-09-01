/**
 * estrelas-missao.tsx — as três estrelas de progresso de uma missão.
 *
 * TRÊS DEGRAUS, E NÃO UMA BARRA SÓ. A barra responde «quanto falta»; as estrelas
 * respondem «já cheguei em algum lugar». Numa missão de 5 estados ou de 14 dias,
 * a barra passa semanas parecendo vazia — a primeira estrela acende no primeiro
 * terço e transforma um número distante em três metas curtas.
 *
 * A COR É A DA FICHA (amarelo com contorno laranja), a mesma de `selo-nivel.tsx`,
 * nunca a cor de ação. Estrela é coisa que se ganhou, não botão que se aperta —
 * pintá-la de laranja de ação faria a pessoa tentar clicar.
 */
export function EstrelasDaMissao({
  progresso,
  alvo,
  concluida,
}: {
  progresso: number;
  alvo: number;
  concluida: boolean;
}) {
  // Concluída acende as três mesmo com alvo 1, que é o caso das missões únicas:
  // uma única estrela acesa num trio faria a conclusão parecer um terço do
  // caminho. Fechou é fechou.
  const acesas = concluida
    ? 3
    : alvo <= 0
      ? 0
      : Math.min(3, Math.floor((progresso / alvo) * 3));

  return (
    <span
      className="estrelas-missao"
      role="img"
      aria-label={`${acesas} de 3 estrelas`}
    >
      {[0, 1, 2].map((i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="estrela"
          data-acesa={i < acesas ? "sim" : "nao"}
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.05 1.1-6.5-4.7-4.6 6.5-.95z"
            fill={i < acesas ? "var(--ic-amarelo)" : "none"}
            stroke="var(--ic-laranja)"
            strokeWidth="1.4"
            strokeLinejoin="round"
            opacity={i < acesas ? 1 : 0.35}
          />
        </svg>
      ))}
    </span>
  );
}
