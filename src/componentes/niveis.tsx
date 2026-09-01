"use client";

import { SeloDeNivel, faixaDoNivel } from "@/componentes/selo-nivel";
import { usePontos } from "@/contexto/pontos";

/**
 * niveis.tsx — a escada inteira, com o degrau da pessoa marcado.
 *
 * POR QUE ESTA TELA EXISTE. O cabeçalho mostra um número de percurso e um selo;
 * nenhum dos dois responde «o que eu ganho subindo» nem «quanto falta». Enquanto
 * a escada tinha cinco degraus dava para viver sem ela — com dezoito, um nível
 * sem mapa é um número que sobe sozinho e não significa nada.
 *
 * O QUE FALTA É DITO EM GESTO, NÃO EM PONTO. «Faltam 620 de percurso» exige que a
 * pessoa saiba de cor quanto vale um episódio; «cerca de 3 matérias ou 1 curso»
 * ela entende sem tabela. Os equivalentes saem das mesmas regras que pagam, então
 * não há um segundo número capaz de discordar do primeiro.
 */

/** Os gestos que a tela usa para traduzir percurso, e o que cada um paga. */
const EQUIVALENTES = [
  { rotulo: "matéria", plural: "matérias", percurso: 25 },
  { rotulo: "episódio", plural: "episódios", percurso: 40 },
  { rotulo: "filme", plural: "filmes", percurso: 50 },
  { rotulo: "presença em sessão", plural: "presenças em sessão", percurso: 150 },
  { rotulo: "curso inteiro", plural: "cursos inteiros", percurso: 200 },
];

/**
 * Traduz uma distância em percurso no gesto que a cobre em MENOS repetições, sem
 * cair no absurdo: 40 matérias é tecnicamente verdade e não ajuda ninguém.
 */
function emGestos(falta: number): string {
  for (const g of EQUIVALENTES.slice().reverse()) {
    const quantos = Math.ceil(falta / g.percurso);
    if (quantos <= 12) return `${quantos} ${quantos === 1 ? g.rotulo : g.plural}`;
  }
  const maior = EQUIVALENTES[EQUIVALENTES.length - 1];
  return `${Math.ceil(falta / maior.percurso)} ${maior.plural}`;
}

export function Niveis() {
  const { motor, hidratado } = usePontos();
  const { config } = motor.catalogo;
  const percurso = motor.saldoDe("percurso");
  const atual = motor.nivel().numero;

  return (
    <div className="flex flex-col gap-4">
      <div className="cartao">
        <span className="tipo-detalhe font-bold">
          {hidratado
            ? `Você está no nível ${atual} · ${config.nomesDeNivel[atual - 1]}`
            : "Carregando seu nível…"}
        </span>
        <span className="tipo-legenda text-tinta-2">
          {hidratado ? `${percurso.toLocaleString("pt-BR")} de percurso` : "—"}
        </span>
        <p className="tipo-legenda text-tinta-3">
          O percurso mede o quanto você andou pelo acervo e nunca é gasto — resgatar na loja
          não derruba seu nível. Quem gasta é a ficha.
        </p>
      </div>

      <ol className="escada">
        {config.nomesDeNivel.map((nome, i) => {
          const numero = i + 1;
          const limiar = config.limiaresDeNivel[i];
          const alcancado = hidratado && percurso >= limiar;
          const eOAtual = hidratado && numero === atual;
          const falta = limiar - percurso;
          const { indice: faixa, degrau } = faixaDoNivel(numero);
          // O rótulo da faixa só aparece no PRIMEIRO degrau dela: repeti-lo nos
          // três transformaria a lista em seis títulos e dezoito subtítulos.
          const abreFaixa = degrau === 1;

          return (
            <li key={nome}>
              {abreFaixa && (
                <span className="escada-faixa" data-faixa={faixa}>
                  Faixa {faixa + 1} de 6
                </span>
              )}

              <div
                className="escada-degrau"
                data-alcancado={alcancado ? "sim" : "nao"}
                data-atual={eOAtual ? "sim" : "nao"}
                aria-current={eOAtual ? "step" : undefined}
              >
                <SeloDeNivel nivel={numero} />

                <div className="flex flex-col gap-1">
                  <span className="tipo-detalhe font-bold">
                    {numero}. {nome}
                    {eOAtual && <span className="escada-voce">você está aqui</span>}
                  </span>
                  <span className="tipo-legenda text-tinta-2">
                    {limiar === 0
                      ? "O ponto de partida de todo mundo."
                      : `${limiar.toLocaleString("pt-BR")} de percurso`}
                  </span>
                  <span className="tipo-legenda text-tinta-3">
                    {!hidratado
                      ? "—"
                      : alcancado
                        ? "Alcançado"
                        : `Faltam ${falta.toLocaleString("pt-BR")} · cerca de ${emGestos(falta)}`}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="tipo-legenda text-tinta-3">
        O nível é permanente: ele não reinicia na virada da temporada e não cai por nada. O
        que reinicia é a contagem da temporada.
      </p>
    </div>
  );
}
