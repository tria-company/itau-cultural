"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ALTURA_SP,
  ANO_FIM_DO_PONTO,
  ANO_INICIO_DO_PONTO,
  ANO_MAX,
  ANO_MIN,
  CAIXA_SP,
  FONTE_DA_MALHA,
  FORTE_DO_PONTO,
  GRADE_COLUNAS,
  GRADE_LINHAS,
  GRUPO_DO_PONTO,
  KM_DO_DESERTO,
  LARGURA_SP,
  LAT_MAX,
  LON_MIN,
  MALHA_SP,
  MASCARA_DA_GRADE,
  MUNICIPIO_DO_PONTO,
  NOME_DO_PONTO,
  NUMEROS_DA_MALHA,
  PASSO_DA_GRADE,
  TIPOS_DE_EQUIPAMENTO,
  TIPO_DO_PONTO,
  UNIDADES,
  X_DO_PONTO,
  Y_DO_PONTO,
} from "@/dados/malha-sp";
import {
  COR,
  OPACIDADE_MINIMA_DO_CALOR,
  RAMPA_DO_CALOR,
  alfaDoIndice,
  corDaDistancia,
  corDaTaxa,
  corDoIndice,
  distanciaEmTexto,
  kmEntre,
  populacaoEmTexto,
  veredictoDaDistancia,
} from "@/dados/mapa-sp-escalas";

/**
 * mapa-sp.tsx, o mapa de equipamentos culturais de São Paulo.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * É O MAPA ENVIADO, com as mesmas cores e as mesmas funções, e sem uma requisição de rede.
 * O original é Leaflet: biblioteca de um CDN, tiles do Esri, `leaflet.heat` de um segundo
 * CDN, e 1,67 MB de geojson e pontos buscados em runtime. Cinco pedidos de rede, num projeto
 * cujos portões medem zero (D-60). O que atravessa é o DADO e a LEITURA, nunca o mecanismo:
 * o polígono é projetado no build, o ponto é projetado no build, e a aritmética das camadas
 * roda no navegador sobre vetores prontos.
 *
 * SÃO DUAS SUPERFÍCIES DE DESENHO, pela mesma razão que o original tem seis «panes». O SVG
 * carrega os 645 municípios, porque eles precisam responder ao ponteiro um a um e receber
 * contorno de seleção. O canvas carrega o resto (deserto, calor, 2.503 pontos e as linhas do
 * cursor), porque cinco mil nós de SVG travariam o ponteiro. O original faz esta mesma
 * divisão: `L.svg()` para coroplético e áreas, `L.canvas()` para pontos, calor e deserto.
 *
 * SÃO DOIS CANVAS, e não um. O de baixo guarda camadas caras que só mudam quando o filtro ou
 * o ano mudam; o de cima guarda as linhas do cursor, que mudam a cada movimento do mouse. Um
 * canvas só obrigaria a redesenhar a camada de calor sessenta vezes por segundo.
 *
 * LARANJA É MUSEU, e não rosa. A legenda do original tem uma classe chamada
 * `legend__dot--pink`, e o CSS dela pinta `--itau-orange`; o `app.js` desenha o ponto com
 * `#ff7800`. Quem confia no nome da classe pinta museu de rosa e erra. O rosa do mapa é o do
 * coroplético, que é outra camada.
 *
 * O QUE NÃO ATRAVESSOU, e é honesto dizer: não há tile de satélite atrás do mapa, porque
 * tile é rede. O fundo é o `#111111` que o original já declarava debaixo dele, e a silhueta
 * dos 645 municípios faz o papel da base cartográfica.
 *
 * A LINHA DO TEMPO É A MESMA SÉRIE. O original deriva abertura e fechamento de cada
 * equipamento de um FNV-1a de `nome|lat|lng|tipo`, que é determinístico; o gerador
 * reimplementa o mesmo hash, então o ano de cada equipamento aqui é o ano dele lá.
 * ─────────────────────────────────────────────────────────────────────────────
 */

type Filtro = "todos" | "museu_teatro" | "biblioteca_centro";

/** As seis camadas do original, na mesma ordem e com o mesmo estado inicial. */
const CAMADAS: readonly { id: string; rotulo: string; padrao: boolean }[] = [
  { id: "pontos", rotulo: "Equipamentos (pontos)", padrao: true },
  { id: "proximidade", rotulo: "Distância (3 mais próximos)", padrao: false },
  { id: "areas", rotulo: "Qtd equipamentos por município", padrao: false },
  { id: "coropletico", rotulo: "Qtd por 10.000 habitantes", padrao: false },
  { id: "calor", rotulo: "Camada de calor", padrao: false },
  { id: "deserto", rotulo: `Deserto cultural (${KM_DO_DESERTO} km ou mais)`, padrao: false },
];

const FILTROS: readonly { id: Filtro; rotulo: string }[] = [
  { id: "todos", rotulo: "Todos" },
  { id: "museu_teatro", rotulo: "Museus e teatros" },
  { id: "biblioteca_centro", rotulo: "Bibliotecas e centros" },
];

const TOTAL_DE_PONTOS = X_DO_PONTO.length;

/** De coordenada do desenho para coordenada do mundo. A projeção é linear e inversível. */
function paraLon(x: number): number {
  return LON_MIN + x / UNIDADES;
}
function paraLat(y: number): number {
  return LAT_MAX - y / UNIDADES;
}

interface Perto {
  media: number;
  cursorX: number;
  cursorY: number;
  itens: { i: number; km: number }[];
}

interface PinturaDoMunicipio {
  preenchimento: string;
  traco: string;
  peso: number;
}

// ---------------------------------------------------------------------------

/**
 * OS 645 CAMINHOS VIVEM AQUI DENTRO, e o componente é memoizado por isso. O cursor mexe no
 * estado da tela dezenas de vezes por segundo; sem esta fronteira, cada movimento pediria ao
 * React para reconciliar 645 elementos que não mudaram.
 */
const Municipios = memo(function Municipios({
  pintura,
  selecionado,
  aoEntrar,
  aoSair,
  aoClicar,
}: {
  pintura: readonly PinturaDoMunicipio[];
  selecionado: number | null;
  aoEntrar: (i: number, e: React.MouseEvent) => void;
  aoSair: () => void;
  aoClicar: (i: number) => void;
}) {
  return (
    <g className="msp-camada-base">
      {MALHA_SP.map((m, i) => (
        <path
          key={m.id}
          d={m.d}
          className="msp-municipio"
          data-municipio={m.id}
          data-faixa={m.equipamentos === 0 ? "vazio" : m.equipamentos === 1 ? "minimo" : "tem"}
          data-selecionado={selecionado === i ? "sim" : undefined}
          fill={pintura[i].preenchimento}
          stroke={pintura[i].traco}
          strokeWidth={pintura[i].peso}
          onMouseEnter={(e) => aoEntrar(i, e)}
          onMouseLeave={aoSair}
          onClick={() => aoClicar(i)}
        />
      ))}
    </g>
  );
});

// ---------------------------------------------------------------------------

export function MapaSP() {
  const [filtro, definirFiltro] = useState<Filtro>("todos");
  const [ano, definirAno] = useState(ANO_MAX);
  const [tocando, definirTocando] = useState(false);
  const [painelAberto, definirPainelAberto] = useState(true);
  const [selecionado, definirSelecionado] = useState<number | null>(null);
  const [ligadas, definirLigadas] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CAMADAS.map((c) => [c.id, c.padrao])),
  );
  const [dica, definirDica] = useState<{ x: number; y: number; linhas: string[] } | null>(null);
  const [perto, definirPerto] = useState<Perto | null>(null);
  const [medida, definirMedida] = useState({ largura: 0, altura: 0 });
  // A VISTA: quanto está ampliado, e sobre que ponto. O original é um mapa navegável, com
  // zoom de 6 a 14; sem zoom, os 519 equipamentos da capital viram uma mancha só.
  const [vista, definirVista] = useState({ z: 1, cx: LARGURA_SP / 2, cy: ALTURA_SP / 2 });
  const arraste = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);

  const moldura = useRef<HTMLDivElement>(null);
  const telaDeBaixo = useRef<HTMLCanvasElement>(null);
  const telaDeCima = useRef<HTMLCanvasElement>(null);

  /**
   * A JANELA DO DESENHO. Ela é o `viewBox` do SVG e é a mesma conta que o canvas usa, o que
   * mantém as duas superfícies alinhadas em qualquer nível de zoom. Como largura e altura
   * encolhem pelo mesmo fator, a razão nunca muda e um único `k` serve para os dois eixos.
   */
  const janela = useMemo(() => {
    const w = LARGURA_SP / vista.z;
    const h = ALTURA_SP / vista.z;
    return { x: vista.cx - w / 2, y: vista.cy - h / 2, w, h };
  }, [vista]);

  // ---- O que está ativo, pelo filtro e pelo ano ----
  const ativos = useMemo(() => {
    const excluir = filtro === "todos" ? "" : filtro === "museu_teatro" ? "1" : "0";
    const lista: number[] = [];
    for (let i = 0; i < TOTAL_DE_PONTOS; i += 1) {
      if (excluir !== "" && GRUPO_DO_PONTO[i] === excluir) continue;
      if (ANO_INICIO_DO_PONTO[i] > ano) continue;
      const fim = ANO_FIM_DO_PONTO[i];
      if (fim !== 0 && ano >= fim) continue;
      lista.push(i);
    }
    return lista;
  }, [filtro, ano]);

  // ---- A contagem por município, e a taxa que sai dela ----
  const { contagem, taxa, taxaMax, comDados } = useMemo(() => {
    const c = new Int32Array(MALHA_SP.length);
    for (const i of ativos) {
      const m = MUNICIPIO_DO_PONTO[i];
      if (m >= 0) c[m] += 1;
    }
    const t = new Float64Array(MALHA_SP.length);
    let maior = 0;
    let quantos = 0;
    for (let m = 0; m < MALHA_SP.length; m += 1) {
      const pop = MALHA_SP[m].populacao;
      t[m] = pop > 0 ? Math.round((c[m] * 10000 * 100) / pop) / 100 : 0;
      if (t[m] > maior) maior = t[m];
      if (c[m] > 0) quantos += 1;
    }
    return { contagem: c, taxa: t, taxaMax: maior, comDados: quantos };
  }, [ativos]);

  // ---- O ranking por 10 mil habitantes ----
  const ranking = useMemo(
    () =>
      MALHA_SP.map((_, i) => i)
        .filter((i) => MALHA_SP[i].populacao > 0)
        .sort((a, b) => taxa[b] - taxa[a] || contagem[b] - contagem[a]),
    [taxa, contagem],
  );

  // ---- Quantos abriram e fecharam no ano ----
  const movimento = useMemo(() => {
    const excluir = filtro === "todos" ? "" : filtro === "museu_teatro" ? "1" : "0";
    let abriram = 0;
    let fecharam = 0;
    for (let i = 0; i < TOTAL_DE_PONTOS; i += 1) {
      if (excluir !== "" && GRUPO_DO_PONTO[i] === excluir) continue;
      if (ANO_INICIO_DO_PONTO[i] === ano && ano >= ANO_MIN) abriram += 1;
      if (ANO_FIM_DO_PONTO[i] === ano) fecharam += 1;
    }
    return { abriram, fecharam };
  }, [filtro, ano]);

  // ---- A pintura dos 645, pela camada ligada ----
  const pintura = useMemo<PinturaDoMunicipio[]>(() => {
    const mostrarTaxa = ligadas.coropletico;
    const mostrarVolume = ligadas.areas;
    return MALHA_SP.map((m, i) => {
      const eleito = selecionado === i;
      if (mostrarTaxa) {
        if (m.populacao === 0) {
          return {
            preenchimento: "rgba(255,255,255,0.04)",
            traco: "rgba(255,255,255,0.1)",
            peso: 0.6,
          };
        }
        return {
          preenchimento: corDaTaxa(taxa[i], taxaMax, eleito ? 0.9 : 0.72),
          traco: eleito ? COR.rosa : "rgba(224, 75, 155, 0.35)",
          peso: eleito ? 2.4 : 0.9,
        };
      }
      if (mostrarVolume) {
        if (contagem[i] === 0) {
          return {
            preenchimento: "rgba(255,255,255,0.03)",
            traco: "rgba(255,255,255,0.08)",
            peso: 0.6,
          };
        }
        return {
          preenchimento: corDoIndice(m.indice, alfaDoIndice(m.indice, eleito)),
          traco: eleito ? COR.laranja : "rgba(255, 120, 0, 0.35)",
          peso: eleito ? 2.5 : 1,
        };
      }
      // A base, quando nenhuma das duas está ligada: a silhueta faz o papel do tile.
      return {
        preenchimento: eleito ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.05)",
        traco: eleito ? COR.branco : "rgba(255,255,255,0.12)",
        peso: eleito ? 2 : 0.5,
      };
    });
  }, [ligadas.coropletico, ligadas.areas, taxa, taxaMax, contagem, selecionado]);

  // ---- O tamanho real da tela de desenho ----
  useEffect(() => {
    const el = moldura.current;
    if (!el) return;
    const medir = () => {
      const r = el.getBoundingClientRect();
      definirMedida({ largura: Math.round(r.width), altura: Math.round(r.height) });
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ---- O canvas de baixo: deserto, calor e pontos ----
  useEffect(() => {
    const tela = telaDeBaixo.current;
    const { largura, altura } = medida;
    if (!tela || largura === 0 || altura === 0) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    tela.width = Math.round(largura * dpr);
    tela.height = Math.round(altura * dpr);
    const ctx = tela.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, largura, altura);

    // `k` é quantos pixels de tela vale uma unidade do desenho. Com a matriz montada uma vez
    // aqui, as funções de desenho falam a mesma língua do SVG e não precisam saber de zoom.
    const k = largura / janela.w;
    const escala = Math.min(1.5, Math.max(0.55, largura / 900));

    const comJanela = (desenhar: () => void) => {
      ctx.save();
      ctx.translate(-janela.x * k, -janela.y * k);
      ctx.scale(k, k);
      desenhar();
      ctx.restore();
    };

    if (ligadas.deserto) comJanela(() => desenharDeserto(ctx, ativos, k));
    // O calor mexe em pixel, não em unidade de desenho: ele lê e reescreve a imagem.
    if (ligadas.calor) desenharCalor(ctx, ativos, janela, largura, altura, escala);
    if (ligadas.pontos) comJanela(() => desenharPontos(ctx, ativos, k, escala));
  }, [medida, janela, ativos, ligadas.deserto, ligadas.calor, ligadas.pontos]);

  // ---- O canvas de cima: as linhas do cursor ----
  useEffect(() => {
    const tela = telaDeCima.current;
    const { largura, altura } = medida;
    if (!tela || largura === 0 || altura === 0) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    tela.width = Math.round(largura * dpr);
    tela.height = Math.round(altura * dpr);
    const ctx = tela.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, largura, altura);
    if (!perto || !ligadas.proximidade) return;

    const k = largura / janela.w;
    ctx.translate(-janela.x * k, -janela.y * k);
    ctx.scale(k, k);
    desenharProximidade(ctx, perto, k);
  }, [medida, janela, perto, ligadas.proximidade]);

  // ---- O ponteiro ----
  const noPonteiro = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = moldura.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      const xvb = janela.x + (px / r.width) * janela.w;
      const yvb = janela.y + (py / r.height) * janela.h;

      // Arrastando, o mapa anda em vez de medir: é o gesto de mapa de todo mundo.
      if (arraste.current) {
        const a = arraste.current;
        definirVista((v) => ({
          ...v,
          cx: a.cx - ((e.clientX - a.x) / r.width) * janela.w,
          cy: a.cy - ((e.clientY - a.y) / r.height) * janela.h,
        }));
        return;
      }

      // 1. Um equipamento embaixo do cursor ganha a dica, como no original.
      const raio = 4 * (janela.w / r.width);
      let achado = -1;
      let melhor = raio * raio;
      for (const i of ativos) {
        const dx = X_DO_PONTO[i] - xvb;
        if (dx > raio || dx < -raio) continue;
        const dy = Y_DO_PONTO[i] - yvb;
        if (dy > raio || dy < -raio) continue;
        const d2 = dx * dx + dy * dy;
        if (d2 < melhor) {
          melhor = d2;
          achado = i;
        }
      }
      if (achado >= 0) {
        const m = MUNICIPIO_DO_PONTO[achado];
        const fim = ANO_FIM_DO_PONTO[achado];
        definirDica({
          x: px,
          y: py,
          linhas: [
            NOME_DO_PONTO[achado],
            `${TIPOS_DE_EQUIPAMENTO[Number(TIPO_DO_PONTO[achado])]}${m >= 0 ? ` · ${MALHA_SP[m].nome}` : ""}`,
            fim !== 0
              ? `Ativo de ${ANO_INICIO_DO_PONTO[achado]} a ${fim - 1}`
              : `Ativo desde ${ANO_INICIO_DO_PONTO[achado]}`,
          ],
        });
      }

      // 2. A proximidade, que é o gesto que dá nome ao mapa.
      if (ligadas.proximidade && ativos.length > 0) {
        const lat = paraLat(yvb);
        const lon = paraLon(xvb);
        const marcados: { i: number; km: number }[] = [];
        for (const i of ativos) {
          const d = kmEntre(lat, lon, paraLat(Y_DO_PONTO[i]), paraLon(X_DO_PONTO[i]));
          if (marcados.length < 3) {
            marcados.push({ i, km: d });
            marcados.sort((a, b) => a.km - b.km);
          } else if (d < marcados[2].km) {
            marcados[2] = { i, km: d };
            marcados.sort((a, b) => a.km - b.km);
          }
        }
        definirPerto({
          media: marcados.reduce((s, p) => s + p.km, 0) / marcados.length,
          cursorX: xvb,
          cursorY: yvb,
          itens: marcados,
        });
      }
    },
    [ativos, ligadas.proximidade, janela],
  );

  const noMunicipio = useCallback((i: number, e: React.MouseEvent) => {
    const el = moldura.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const m = MALHA_SP[i];
    definirDica({
      x: e.clientX - r.left,
      y: e.clientY - r.top,
      linhas: [m.nome, m.regiao, `${populacaoEmTexto(m.populacao)} habitantes`],
    });
  }, []);

  /**
   * A RODA AMPLIA SOBRE O CURSOR, e não sobre o centro. Ampliar sobre o centro obriga a
   * pessoa a arrastar depois de cada passo para voltar ao que ela estava olhando.
   */
  const naRoda = useCallback(
    (e: WheelEvent) => {
      const el = moldura.current;
      if (!el) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      definirVista((v) => {
        const z = Math.min(24, Math.max(1, v.z * (e.deltaY < 0 ? 1.25 : 0.8)));
        if (z === v.z) return v;
        // O ponto sob o cursor tem que continuar sob o cursor depois do salto.
        const wA = LARGURA_SP / v.z;
        const hA = ALTURA_SP / v.z;
        const alvoX = v.cx - wA / 2 + px * wA;
        const alvoY = v.cy - hA / 2 + py * hA;
        const wD = LARGURA_SP / z;
        const hD = ALTURA_SP / z;
        return { z, cx: alvoX - (px - 0.5) * wD, cy: alvoY - (py - 0.5) * hD };
      });
    },
    [],
  );

  /**
   * A RODA PRECISA DE OUVINTE NATIVO. O React registra `wheel` como passivo, e num ouvinte
   * passivo `preventDefault()` não faz nada e ainda avisa no console: a página rolaria junto
   * com o zoom. Declarar `{ passive: false }` na mão é a única forma de segurar a rolagem.
   */
  useEffect(() => {
    const el = moldura.current;
    if (!el) return;
    el.addEventListener("wheel", naRoda, { passive: false });
    return () => el.removeEventListener("wheel", naRoda);
  }, [naRoda]);

  /** O clique no ranking leva o mapa até o município, como `focusMunicipio` do original. */
  const focar = useCallback((i: number) => {
    definirSelecionado((s) => (s === i ? null : i));
    definirVista((v) => ({ z: Math.max(v.z, 6), cx: MALHA_SP[i].cx, cy: MALHA_SP[i].cy }));
  }, []);

  // ---- O play da linha do tempo ----
  useEffect(() => {
    if (!tocando) return;
    const t = window.setInterval(() => {
      definirAno((a) => {
        if (a >= ANO_MAX) {
          definirTocando(false);
          return a;
        }
        return a + 1;
      });
    }, 900);
    return () => window.clearInterval(t);
  }, [tocando]);

  const n = NUMEROS_DA_MALHA;
  const topo = ranking.length > 0 ? taxa[ranking[0]] : 0;
  const corDaMedia = perto ? corDaDistancia(perto.media).hex : undefined;

  return (
    <div className="msp" data-mapa-sp>
      <div
        className="msp-palco"
        ref={moldura}
        data-arrastando={arraste.current ? "sim" : undefined}
        onMouseMove={noPonteiro}
        onMouseDown={(e) => {
          arraste.current = { x: e.clientX, y: e.clientY, cx: vista.cx, cy: vista.cy };
        }}
        onMouseUp={() => {
          arraste.current = null;
        }}
        onDoubleClick={() => definirVista({ z: 1, cx: LARGURA_SP / 2, cy: ALTURA_SP / 2 })}
        onMouseLeave={() => {
          arraste.current = null;
          definirDica(null);
          definirPerto(null);
        }}
      >
        <svg
          viewBox={`${janela.x} ${janela.y} ${janela.w} ${janela.h}`}
          role="img"
          aria-label={`Equipamentos culturais nos ${n.municipios} municípios de São Paulo`}
          className="msp-desenho"
        >
          <Municipios
            pintura={pintura}
            selecionado={selecionado}
            aoEntrar={noMunicipio}
            aoSair={() => definirDica(null)}
            aoClicar={focar}
          />
        </svg>

        <canvas ref={telaDeBaixo} className="msp-tela" aria-hidden="true" />
        <canvas ref={telaDeCima} className="msp-tela msp-tela-cima" aria-hidden="true" />

        {dica && (
          <div className="msp-dica" style={{ left: dica.x, top: dica.y }} role="presentation">
            <strong>{dica.linhas[0]}</strong>
            {dica.linhas.slice(1).map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
        )}

        <aside className="msp-painel" data-aberto={painelAberto ? "sim" : "nao"}>
          <header className="msp-painel-topo">
            <p className="msp-sobrancelha">Estado de São Paulo</p>
            <h3 className="msp-painel-titulo">Equipamentos Culturais</h3>
            <p className="msp-painel-guia">
              Mova o cursor no mapa: as linhas ligam você aos 3 equipamentos mais próximos e
              mostram a distância média.
            </p>
          </header>

          <section className="msp-acesso" aria-live="polite">
            <p className="msp-acesso-rotulo">Acesso cultural</p>
            {perto && ligadas.proximidade ? (
              <>
                <p className="msp-acesso-media" style={{ color: corDaMedia }}>
                  {distanciaEmTexto(perto.media)} <em>média</em>
                </p>
                <p className="msp-acesso-veredicto" style={{ color: corDaMedia }}>
                  {veredictoDaDistancia(perto.media).texto}
                </p>
                <ul className="msp-acesso-lista">
                  {perto.itens.map((p) => {
                    const m = MUNICIPIO_DO_PONTO[p.i];
                    return (
                      <li key={p.i}>
                        <span className="msp-acesso-quem">
                          <span className="msp-acesso-nome">{NOME_DO_PONTO[p.i]}</span>
                          <span className="msp-acesso-meta">
                            {TIPOS_DE_EQUIPAMENTO[Number(TIPO_DO_PONTO[p.i])]}
                            {m >= 0 ? ` · ${MALHA_SP[m].nome}` : ""}
                          </span>
                        </span>
                        <span
                          className="msp-acesso-km"
                          style={{ color: corDaDistancia(p.km).hex }}
                        >
                          {distanciaEmTexto(p.km)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <>
                <p className="msp-acesso-media">
                  0 <em>média</em>
                </p>
                <p className="msp-acesso-veredicto">
                  {ligadas.proximidade
                    ? "Passe o cursor pelo mapa"
                    : "Ligue a camada de distância"}
                </p>
              </>
            )}
          </section>

          <section className="msp-chips" aria-label="Filtros">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                type="button"
                className="msp-chip"
                data-chip={f.id}
                data-ativo={filtro === f.id ? "sim" : "nao"}
                aria-pressed={filtro === f.id}
                onClick={() => definirFiltro(f.id)}
              >
                {f.rotulo}
              </button>
            ))}
          </section>

          <section className="msp-camadas">
            {CAMADAS.map((c) => (
              <label key={c.id} className="msp-chave">
                <input
                  type="checkbox"
                  checked={ligadas[c.id] ?? false}
                  onChange={(e) => definirLigadas((l) => ({ ...l, [c.id]: e.target.checked }))}
                  data-camada={c.id}
                />
                <span className="msp-chave-trilho" aria-hidden="true" />
                <span className="msp-chave-rotulo">{c.rotulo}</span>
              </label>
            ))}
          </section>

          <section className="msp-estatisticas">
            <div>
              <span className="msp-estatistica-valor">
                {ativos.length.toLocaleString("pt-BR")}
              </span>
              <span className="msp-estatistica-rotulo">Equipamentos</span>
            </div>
            <div>
              <span className="msp-estatistica-valor">{comDados.toLocaleString("pt-BR")}</span>
              <span className="msp-estatistica-rotulo">Com dados</span>
            </div>
            <div>
              <span className="msp-estatistica-valor">{topo.toFixed(1).replace(".", ",")}</span>
              <span className="msp-estatistica-rotulo">Maior por 10 mil</span>
            </div>
          </section>

          <section className="msp-ranking">
            <div className="msp-ranking-topo">
              <h4>Por 10 mil habitantes</h4>
              <span>clique para focar</span>
            </div>
            <ol className="msp-ranking-lista">
              {ranking.slice(0, 40).map((i, pos) => (
                <li key={MALHA_SP[i].id}>
                  <button
                    type="button"
                    className="msp-ranking-item"
                    data-ranking={MALHA_SP[i].id}
                    data-selecionado={selecionado === i ? "sim" : undefined}
                    onClick={() => focar(i)}
                  >
                    <span className="msp-ranking-pos">{String(pos + 1).padStart(2, "0")}</span>
                    <span className="msp-ranking-corpo">
                      <span className="msp-ranking-nome">{MALHA_SP[i].nome}</span>
                      <span className="msp-ranking-meta">
                        {contagem[i]} eq · {populacaoEmTexto(MALHA_SP[i].populacao)} hab
                      </span>
                    </span>
                    <span className="msp-ranking-nota">
                      {taxa[i].toFixed(2).replace(".", ",")}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </section>

          <footer className="msp-painel-pe">{FONTE_DA_MALHA}</footer>
        </aside>

        <button
          type="button"
          className="msp-painel-chave"
          onClick={() => definirPainelAberto((a) => !a)}
          aria-expanded={painelAberto}
          aria-label={painelAberto ? "Fechar o painel" : "Abrir o painel"}
        >
          {painelAberto ? "×" : "☰"}
        </button>

        <div className="msp-legenda" data-legenda-do-mapa>
          <div className="msp-legenda-linha">
            <span className="msp-amostra" data-amostra="museu" />
            Museus, teatros, cinemas, galerias
          </div>
          <div className="msp-legenda-linha">
            <span className="msp-amostra" data-amostra="biblioteca" />
            Bibliotecas e centros culturais
          </div>
          <div className="msp-legenda-linha">
            <span className="msp-amostra" data-amostra="deserto" />
            Deserto cultural ({KM_DO_DESERTO} km ou mais)
          </div>
          <div className="msp-legenda-escala">
            <span>baixo</span>
            <span className="msp-escala-barra" aria-hidden="true" />
            <span>alto por 10 mil</span>
          </div>
        </div>

        <div className="msp-tempo">
          <button
            type="button"
            className="msp-tempo-play"
            onClick={() => {
              if (!tocando && ano >= ANO_MAX) definirAno(ANO_MIN);
              definirTocando((t) => !t);
            }}
            aria-label={tocando ? "Pausar" : "Tocar"}
          >
            {tocando ? "❙❙" : "▶"}
          </button>
          <div className="msp-tempo-corpo">
            <div className="msp-tempo-topo">
              <span className="msp-tempo-ano">{ano}</span>
              <span className="msp-tempo-meta">
                <strong>{ativos.length.toLocaleString("pt-BR")}</strong> ativos
                <span className="msp-tempo-mais"> +{movimento.abriram}</span>
                <span className="msp-tempo-menos"> −{movimento.fecharam}</span>
              </span>
            </div>
            <input
              type="range"
              className="msp-tempo-regua"
              min={ANO_MIN}
              max={ANO_MAX}
              step={1}
              value={ano}
              onChange={(e) => {
                definirTocando(false);
                definirAno(Number(e.target.value));
              }}
              aria-label="Ano"
            />
            <div className="msp-tempo-marcas" aria-hidden="true">
              {Array.from({ length: ANO_MAX - ANO_MIN + 1 }, (_, i) => ANO_MIN + i).map((a) => (
                <span key={a}>{a}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="msp-leitura" data-leitura-do-mapa>
        São {n.equipamentos.toLocaleString("pt-BR")} equipamentos culturais em{" "}
        {n.comEquipamento.toLocaleString("pt-BR")} dos {n.municipios.toLocaleString("pt-BR")}{" "}
        municípios de São Paulo, para {n.populacao.toLocaleString("pt-BR")} habitantes. Os
        outros {n.semEquipamento.toLocaleString("pt-BR")} não têm nenhum: quase metade do
        estado. A camada de deserto cobre {n.celulasDesertas.toLocaleString("pt-BR")} das{" "}
        {n.celulasDentro.toLocaleString("pt-BR")} células de 5,5 km que cabem no estado. O mapa
        mostra o que está mapeado, e não o que existe, que é uma diferença que ele não pode
        esconder.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// O desenho no canvas
// ---------------------------------------------------------------------------

/**
 * Os pontos, com o halo por baixo, nas cores do original.
 *
 * A MATRIZ JÁ ESTÁ MONTADA quando esta função roda: ela desenha em unidade do desenho, a
 * mesma do `viewBox`, e quem cuida do zoom é o `translate`/`scale` de quem chamou. O raio,
 * esse, é dividido por `k` de propósito: o ponto tem que manter o mesmo tamanho na tela em
 * qualquer ampliação, senão ampliar viraria só uma bolha maior em vez de mais detalhe.
 */
function desenharPontos(
  ctx: CanvasRenderingContext2D,
  ativos: readonly number[],
  k: number,
  escala: number,
) {
  // DUAS PASSADAS: todos os halos, depois todos os núcleos. Alternar as duas deixaria o halo
  // de um ponto por cima do núcleo do vizinho, e na capital isso vira mancha.
  for (const i of ativos) {
    const forte = FORTE_DO_PONTO[i] === "1";
    const r = ((forte ? 2.1 : 1.7) * escala) / k;
    ctx.beginPath();
    ctx.arc(X_DO_PONTO[i], Y_DO_PONTO[i], r * 1.9, 0, Math.PI * 2);
    ctx.fillStyle = GRUPO_DO_PONTO[i] === "0" ? COR.laranja : COR.ciano;
    ctx.globalAlpha = forte ? 0.14 : 0.1;
    ctx.fill();
  }
  for (const i of ativos) {
    const forte = FORTE_DO_PONTO[i] === "1";
    const r = ((forte ? 2.1 : 1.7) * escala) / k;
    const museu = GRUPO_DO_PONTO[i] === "0";
    ctx.beginPath();
    ctx.arc(X_DO_PONTO[i], Y_DO_PONTO[i], r, 0, Math.PI * 2);
    ctx.fillStyle = museu ? COR.laranja : COR.ciano;
    ctx.globalAlpha = 0.82;
    ctx.fill();
    ctx.globalAlpha = 0.95;
    ctx.lineWidth = (0.6 * escala) / k;
    ctx.strokeStyle = museu ? COR.laranjaSuave : COR.cianoSuave;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/**
 * O deserto cultural: célula de 0,05 grau a 20 km ou mais do equipamento mais próximo.
 *
 * A GRADE É A DO ORIGINAL, e o teste de «dentro do estado» já veio resolvido do build, numa
 * máscara de bits. O que sobra para o navegador é a distância, que muda com o filtro e com o
 * ano, e por isso não podia ser pré-calculada.
 *
 * OS PONTOS VÃO PARA BALDES antes da varredura. Sem isso, cada uma das 8.513 células compara
 * contra 2.503 pontos: 21 milhões de Haversines, e a camada demoraria a acender. Com balde de
 * 0,2 grau a célula olha só a vizinhança, e a resposta sai na hora.
 */
function desenharDeserto(
  ctx: CanvasRenderingContext2D,
  ativos: readonly number[],
  k: number,
) {
  const LADO = 0.2;
  const chave = (i: number, j: number) => i * 10000 + j;
  const baldes = new Map<number, number[]>();
  for (const p of ativos) {
    const k = chave(
      Math.floor(paraLat(Y_DO_PONTO[p]) / LADO),
      Math.floor(paraLon(X_DO_PONTO[p]) / LADO),
    );
    const b = baldes.get(k);
    if (b) b.push(p);
    else baldes.set(k, [p]);
  }
  // 20 km cabem em 0,18 grau de latitude; dois baldes de 0,2 grau cobrem isso com folga.
  const ALCANCE = 2;

  // A célula em unidade de desenho: 0,05 grau vezes as unidades por grau da projeção. Meio
  // pixel de folga fecha a costura entre células vizinhas em ampliações altas.
  const lado = PASSO_DA_GRADE * UNIDADES + 0.5 / k;

  ctx.fillStyle = COR.laranja;
  ctx.globalAlpha = 0.22;

  for (let li = 0; li < GRADE_LINHAS; li += 1) {
    for (let co = 0; co < GRADE_COLUNAS; co += 1) {
      if (MASCARA_DA_GRADE[li * GRADE_COLUNAS + co] !== "1") continue;
      const lat = CAIXA_SP.sul + li * PASSO_DA_GRADE + PASSO_DA_GRADE / 2;
      const lon = CAIXA_SP.oeste + co * PASSO_DA_GRADE + PASSO_DA_GRADE / 2;

      const bi = Math.floor(lat / LADO);
      const bj = Math.floor(lon / LADO);
      let deserto = true;
      busca: for (let di = -ALCANCE; di <= ALCANCE; di += 1) {
        for (let dj = -ALCANCE; dj <= ALCANCE; dj += 1) {
          const b = baldes.get(chave(bi + di, bj + dj));
          if (!b) continue;
          for (const p of b) {
            if (
              kmEntre(lat, lon, paraLat(Y_DO_PONTO[p]), paraLon(X_DO_PONTO[p])) < KM_DO_DESERTO
            ) {
              deserto = false;
              break busca;
            }
          }
        }
      }
      if (!deserto) continue;

      // O canto de cima da célula, em coordenada de desenho: latitude cresce para cima.
      const x = (lon - PASSO_DA_GRADE / 2 - LON_MIN) * UNIDADES;
      const y = (LAT_MAX - (lat + PASSO_DA_GRADE / 2)) * UNIDADES;
      ctx.fillRect(x, y, lado, lado);
    }
  }
  ctx.globalAlpha = 1;
}

/**
 * A camada de calor, reimplementada.
 *
 * O ORIGINAL USA `leaflet.heat`, que é um segundo CDN. O algoritmo dela é curto e público:
 * acumula um pincel radial em escala de alfa, e depois troca cada alfa pela cor de uma rampa
 * de 256 posições. São umas trinta linhas, e trocá-las por uma requisição de rede seria
 * trocar o que o projeto proíbe pelo que ele já sabe fazer.
 */
function desenharCalor(
  ctx: CanvasRenderingContext2D,
  ativos: readonly number[],
  janela: { x: number; y: number; w: number; h: number },
  largura: number,
  altura: number,
  escala: number,
) {
  // ESTA CAMADA TRABALHA EM PIXEL, e não em unidade de desenho, porque ela lê e reescreve a
  // imagem inteira. Por isso ela projeta o ponto na mão em vez de herdar a matriz.
  const px = (x: number) => ((x - janela.x) / janela.w) * largura;
  const py = (y: number) => ((y - janela.y) / janela.h) * altura;
  const raio = 26 * escala;
  const desfoque = 20 * escala;

  const pincel = document.createElement("canvas");
  const rp = Math.round(raio + desfoque);
  pincel.width = rp * 2;
  pincel.height = rp * 2;
  const pctx = pincel.getContext("2d");
  if (!pctx) return;
  const grad = pctx.createRadialGradient(rp, rp, 0, rp, rp, rp);
  grad.addColorStop(0, "rgba(0,0,0,1)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  pctx.fillStyle = grad;
  pctx.fillRect(0, 0, rp * 2, rp * 2);

  const fora = document.createElement("canvas");
  fora.width = Math.max(1, Math.round(largura));
  fora.height = Math.max(1, Math.round(altura));
  const fctx = fora.getContext("2d");
  if (!fctx) return;

  for (const i of ativos) {
    // O peso do original: museu e teatro pesam 1,25 vez mais que biblioteca e centro.
    const mag = FORTE_DO_PONTO[i] === "1" ? 0.55 : 0.4;
    const peso = Math.max(0.25, mag * (GRUPO_DO_PONTO[i] === "0" ? 1.25 : 1));
    fctx.globalAlpha = Math.min(1, peso);
    fctx.drawImage(pincel, px(X_DO_PONTO[i]) - rp, py(Y_DO_PONTO[i]) - rp);
  }

  // A rampa, em 256 posições, a partir das quatro paradas do original.
  const rampa = document.createElement("canvas");
  rampa.width = 256;
  rampa.height = 1;
  const rctx = rampa.getContext("2d");
  if (!rctx) return;
  const g2 = rctx.createLinearGradient(0, 0, 256, 0);
  for (const p of RAMPA_DO_CALOR) g2.addColorStop(p.parada, p.cor);
  rctx.fillStyle = g2;
  rctx.fillRect(0, 0, 256, 1);
  const cores = rctx.getImageData(0, 0, 256, 1).data;

  const img = fctx.getImageData(0, 0, fora.width, fora.height);
  const d = img.data;
  const piso = OPACIDADE_MINIMA_DO_CALOR * 255;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    if (a === 0) continue;
    const j = a * 4;
    d[i] = cores[j];
    d[i + 1] = cores[j + 1];
    d[i + 2] = cores[j + 2];
    d[i + 3] = Math.max(piso, a);
  }
  fctx.putImageData(img, 0, 0);
  ctx.drawImage(fora, 0, 0, largura, altura);
}

/** As linhas do cursor até os três mais próximos, com a distância em cada uma. */
function desenharProximidade(ctx: CanvasRenderingContext2D, perto: Perto, k: number) {
  if (perto.itens.length === 0) return;
  // Tudo aqui é medida de tela dividida por `k`: linha, etiqueta e pulso têm que manter a
  // mesma espessura em qualquer ampliação.
  const ax = perto.cursorX;
  const ay = perto.cursorY;

  perto.itens.forEach((p, ordem) => {
    const c = corDaDistancia(p.km);
    const bx = X_DO_PONTO[p.i];
    const by = Y_DO_PONTO[p.i];

    ctx.save();
    ctx.globalAlpha = 0.95 - ordem * 0.12;
    ctx.strokeStyle = c.hex;
    ctx.lineWidth = (ordem === 0 ? 2.6 : 1.8) / k;
    ctx.lineCap = "round";
    ctx.setLineDash(ordem === 0 ? [] : [5 / k, 7 / k]);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.restore();

    // A ponta, com o anel branco do original.
    ctx.beginPath();
    ctx.arc(bx, by, (ordem === 0 ? 6 : 4.5) / k, 0, Math.PI * 2);
    ctx.fillStyle = c.hex;
    ctx.globalAlpha = 0.95;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1.5 / k;
    ctx.strokeStyle = COR.branco;
    ctx.stroke();

    // A etiqueta, no meio, empurrada para o lado para as três não empilharem.
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    const dx = bx - ax;
    const dy = by - ay;
    const comprimento = Math.hypot(dx, dy) || 1;
    const empurrao = ((ordem - 1) * 11) / k;
    const lx = mx - (dy / comprimento) * empurrao;
    const ly = my + (dx / comprimento) * empurrao;
    const texto = distanciaEmTexto(p.km);
    ctx.font = `600 ${10 / k}px system-ui, sans-serif`;
    const larguraDaEtiqueta = ctx.measureText(texto).width + 12 / k;
    ctx.fillStyle = "rgba(17,17,17,0.92)";
    ctx.beginPath();
    ctx.roundRect(lx - larguraDaEtiqueta / 2, ly - 8 / k, larguraDaEtiqueta, 16 / k, 8 / k);
    ctx.fill();
    ctx.strokeStyle = c.hex;
    ctx.lineWidth = 1 / k;
    ctx.stroke();
    ctx.fillStyle = c.hex;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(texto, lx, ly);
  });

  // O pulso no cursor, por último, para ficar por cima de tudo.
  const c0 = corDaDistancia(perto.media);
  const halo = ctx.createRadialGradient(ax, ay, 0, ax, ay, 14 / k);
  halo.addColorStop(0, COR.branco);
  halo.addColorStop(0.45, c0.hex);
  halo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(ax, ay, 14 / k, 0, Math.PI * 2);
  ctx.fill();
}
