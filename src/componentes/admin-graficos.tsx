import type { Fatia, Medida } from "@/dados/admin-area";

/**
 * admin-graficos.tsx, os tres desenhos do painel da plataforma.
 *
 * POR QUE NAO SAO OS DE `base/graficos`. Aquelas tres pecas foram escritas para as
 * perguntas do Produtor e respondem a elas muito bem, mas nao respondem a estas.
 * `FatiaDaRosca` nao tem campo de cor: a rosca de la tinge por ordem, o que serve quando
 * as fatias sao uma escala e nao serve quando sao tres procedencias com cor propria.
 * `BarrasVerticais` acende so a barra mais alta e apaga o resto, o que serve para achar o
 * pico de um mes e nao serve para comparar cinco classes. Passar `cor` para elas nao
 * quebra nada, e por isso o defeito era silencioso: o campo era ignorado e o painel saia
 * cinza.
 *
 * DESENHAR AQUI E MAIS BARATO QUE GENERALIZAR LA. Mexer em `base/graficos` moveria o
 * Studio, a Moderacao e a Redacao, que nao pediram nada. A regra da casa vale para o CSS
 * e vale para o componente: a divergencia da superficie mora na superficie.
 *
 * AS BARRAS SAO DEITADAS, e nao em pe. Em 370px de largura util, cinco barras verticais
 * dao 31px de rotulo para palavras como «instituicao». Deitada, a barra tem a largura
 * inteira e o rotulo tem a linha inteira.
 */

/** O raio e a circunferencia da rosca, em unidade de viewBox. */
const RAIO = 54;
const VOLTA = 2 * Math.PI * RAIO;

function comSeparador(n: number): string {
  return n.toLocaleString("pt-BR");
}

export function RoscaDoAdmin({
  fatias,
  centro,
  rotuloDoCentro,
}: {
  fatias: readonly Fatia[];
  centro: string;
  rotuloDoCentro: string;
}) {
  const total = fatias.reduce((a, f) => a + f.valor, 0) || 1;

  let percorrido = 0;
  const arcos = fatias.map((f) => {
    const comprimento = (f.valor / total) * VOLTA;
    const arco = { ...f, comprimento, deslocamento: -percorrido };
    percorrido += comprimento;
    return arco;
  });

  return (
    <div className="adm-rosca" data-rosca={fatias.length}>
      <svg viewBox="0 0 140 140" className="adm-rosca-desenho" role="presentation">
        <g transform="rotate(-90 70 70)">
          <circle cx="70" cy="70" r={RAIO} className="adm-rosca-trilho" />
          {arcos.map((a) => (
            <circle
              key={a.rotulo}
              cx="70"
              cy="70"
              r={RAIO}
              className="adm-rosca-arco"
              data-fatia={a.rotulo}
              stroke={a.cor}
              strokeDasharray={`${a.comprimento.toFixed(2)} ${(VOLTA - a.comprimento).toFixed(2)}`}
              strokeDashoffset={a.deslocamento.toFixed(2)}
            />
          ))}
        </g>
        <text x="70" y="66" className="adm-rosca-centro">
          {centro}
        </text>
        <text x="70" y="82" className="adm-rosca-centro-rotulo">
          {rotuloDoCentro}
        </text>
      </svg>

      <ul className="adm-legenda">
        {fatias.map((f) => (
          <li key={f.rotulo} data-legenda={f.rotulo}>
            <span className="adm-legenda-cor" style={{ background: f.cor }} />
            <span className="adm-legenda-rotulo">{f.rotulo}</span>
            <span className="adm-legenda-valor">
              {comSeparador(f.valor)}
              <em>{Math.round((f.valor / total) * 100)}%</em>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BarrasDoAdmin({ barras }: { barras: readonly { rotulo: string; valor: number }[] }) {
  const maior = Math.max(1, ...barras.map((b) => b.valor));

  return (
    <ul className="adm-barras" data-barras={barras.length}>
      {barras.map((b, i) => (
        <li key={b.rotulo} className="adm-barra" data-barra={b.rotulo}>
          <span className="adm-barra-rotulo">{b.rotulo}</span>
          <span className="adm-barra-trilho">
            <span
              className="adm-barra-cheia"
              data-posicao={i}
              style={{ width: `${Math.max(2, (b.valor / maior) * 100)}%` }}
            />
          </span>
          <span className="adm-barra-valor">{comSeparador(b.valor)}</span>
        </li>
      ))}
    </ul>
  );
}

export function MedidorDoAdmin({ medida }: { medida: Medida }) {
  const preso = Math.max(0, Math.min(100, medida.porcento));

  return (
    <div className="adm-medidor" data-medidor={medida.id}>
      <div className="adm-medidor-cima">
        <span className="adm-medidor-rotulo">{medida.rotulo}</span>
        <span className="adm-medidor-porcento">{preso}%</span>
      </div>
      <div
        className="adm-medidor-trilho"
        role="meter"
        aria-valuenow={preso}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={medida.rotulo}
      >
        <div className="adm-medidor-cheio" style={{ width: `${preso}%` }} />
      </div>
      <p className="adm-medidor-detalhe">{medida.detalhe}</p>
    </div>
  );
}
