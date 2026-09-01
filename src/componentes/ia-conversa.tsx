"use client";

import {
  cloneElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactElement,
} from "react";
import { Chip, TrilhoDeChips } from "@/componentes/base/chip";
import {
  ICONE_BUSCAR,
  ICONE_CONFERIDO,
  ICONE_ENVIAR,
  ICONE_FICHA,
  ICONE_IA,
  ICONE_MAIS,
  ICONE_PAINEL,
  ICONE_MAPA,
  ICONE_RELOGIO,
} from "@/componentes/base/icones";
import {
  guardarConversa,
  lerConversas,
  quandoPorExtenso,
  removerConversa,
  semearExemplos,
  TETO_DE_CONVERSAS,
  type ConversaGuardada,
} from "@/lib/ia-historico";
import {
  RoteirosSalvos,
  type OpcaoDaEntrevista,
} from "@/componentes/entrevista-estrelinha";

/**
 * ia-conversa.tsx — a entrevista da estrelinha desenhada como conversa.
 *
 * A entrevista NÃO computa nada: cada resposta completa vira o endereço de
 * uma página pré-computada. O compositor e as sugestões só preenchem as
 * quatro peças (gosto, companhia, dias, cidade); o artefato de «pensamento»
 * é encenação com números reais do acervo, e no fim a tela NAVEGA.
 *
 * DP-F: tudo chega por props; nenhum import de `@/dados/estrelinha` por valor.
 */

export type SugestaoDeRoteiro = {
  id: string;
  texto: string;
  gosto: string;
  companhia: string;
  dias: number;
  cidade: string;
  capa: string | null;
  creditoCapa: string | null;
  altCapa: string;
};

type Pedido = {
  gosto: string | null;
  companhia: string | null;
  dias: number | null;
  cidade: string | null;
  pediuData: boolean;
};

type Campo = "gosto" | "companhia" | "dias" | "cidade";

type MensagemUsuario = { id: string; papel: "usuario"; texto: string };
type DestinoDoRoteiro = {
  href: string;
  titulo: string;
  meta: string;
  capa: string | null;
};

type MensagemAssistente = {
  id: string;
  papel: "assistente";
  texto: string;
  pergunta?: Campo;
  pensar?: boolean;
  destino?: DestinoDoRoteiro;
};
type Mensagem = MensagemUsuario | MensagemAssistente;

/** Uma conversa guardada, com os tipos deste arquivo. Ver `lib/ia-historico.ts`. */
type Conversa = ConversaGuardada<Mensagem, Pedido>;

/**
 * Cinco conversas de DEMONSTRAÇÃO, semeadas só quando o histórico está vazio.
 *
 * Elas existem porque uma lista vazia não mostra o que a lista faz — e a tela do histórico
 * é justamente uma que só se entende cheia. Somem no instante em que existe uma conversa
 * de verdade, e enquanto estão ali a folha DIZ que são exemplo: histórico cheio sem
 * ninguém ter conversado é plausível e falso, e o que é nosso se declara.
 *
 * As perguntas são sobre o acervo REAL — São Paulo, Belém, teatro, fotografia — porque
 * exemplo com conteúdo inventado ensina a pessoa a pedir o que o produto não tem.
 */
const DIA = 24 * 60 * 60 * 1000;

const EXEMPLOS: readonly { titulo: string; resposta: string; dias: number; pedido: Pedido }[] = [
  {
    titulo: "Quatro dias em São Paulo, com música",
    resposta:
      "Montei quatro dias em São Paulo puxando pela música: shows, casas de escuta e o que o acervo tem de gravação por perto.",
    dias: 0,
    pedido: { gosto: "musica", companhia: null, dias: 4, cidade: "sao-paulo", pediuData: true },
  },
  {
    titulo: "O que ver em Belém num fim de semana?",
    resposta:
      "Dois dias em Belém, começando pelos espaços do acervo na cidade e fechando com o que há de artes visuais por lá.",
    dias: 1,
    pedido: { gosto: "artes-visuais", companhia: null, dias: 2, cidade: "belem", pediuData: true },
  },
  {
    titulo: "Um roteiro de teatro para levar quem não vai ao teatro",
    resposta:
      "Puxei pelo teatro, mas começando pelo que costuma converter quem nunca foi: montagem curta, casa pequena e algo para conversar depois.",
    dias: 3,
    pedido: { gosto: "teatro", companhia: "amigos", dias: 1, cidade: "sao-paulo", pediuData: false },
  },
  {
    titulo: "Fotografia no Rio, com criança junto",
    resposta:
      "Roteiro de fotografia no Rio pensado para ir com criança: percursos curtos, com parada entre um lugar e outro.",
    dias: 5,
    pedido: { gosto: "fotografia", companhia: "familia", dias: 2, cidade: "rio-de-janeiro", pediuData: true },
  },
  {
    titulo: "Tenho uma tarde livre e queria descobrir algo novo",
    resposta:
      "Sem cidade e sem gosto fechado, fui pelo que o acervo tem de mais atravessável numa tarde — e deixei uma coisa fora do seu repertório no meio.",
    dias: 12,
    pedido: { gosto: null, companhia: null, dias: 1, cidade: null, pediuData: false },
  },
];

function exemplosDoHistorico(agora: number): Conversa[] {
  return EXEMPLOS.map((e, i) => ({
    id: `exemplo-${i}`,
    exemplo: true,
    quando: agora - e.dias * DIA,
    titulo: e.titulo,
    mensagens: [
      { id: `exemplo-${i}-u`, papel: "usuario", texto: e.titulo },
      { id: `exemplo-${i}-a`, papel: "assistente", texto: e.resposta },
    ] as Mensagem[],
    pedido: e.pedido,
  }));
}

function ehAssistente(m: Mensagem): m is MensagemAssistente {
  return m.papel === "assistente";
}

type Props = {
  gostos: OpcaoDaEntrevista[];
  companhias: OpcaoDaEntrevista[];
  dias: number[];
  cidades: OpcaoDaEntrevista[];
  sugestoes: SugestaoDeRoteiro[];
};

const PEDIDO_VAZIO: Pedido = {
  gosto: null,
  companhia: null,
  dias: null,
  cidade: null,
  pediuData: false,
};

function glifo(icone: ReactElement<{ className?: string }>, classe = "ia-glifo") {
  return cloneElement(icone, { className: classe });
}

function semAcento(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function rotuloDe(opcoes: readonly OpcaoDaEntrevista[], slug: string | null): string {
  if (!slug) return "";
  return opcoes.find((o) => o.slug === slug)?.rotulo ?? slug;
}

function proximoCampo(p: Pedido): Campo | null {
  if (!p.gosto) return "gosto";
  if (!p.companhia) return "companhia";
  if (p.dias === null) return "dias";
  if (!p.cidade) return "cidade";
  return null;
}

function interpretar(
  texto: string,
  {
    cidades,
    gostos,
    diasOpcoes,
  }: {
    cidades: readonly OpcaoDaEntrevista[];
    gostos: readonly OpcaoDaEntrevista[];
    diasOpcoes: readonly number[];
  },
): Partial<Pedido> {
  const t = semAcento(texto);
  const saida: Partial<Pedido> = {
    pediuData: /\b(hoje|amanha|a noite|esta noite|nesta noite)\b/.test(t),
  };

  let melhor = 0;
  for (const c of cidades) {
    const nome = semAcento(c.rotulo);
    if (nome.length >= 4 && t.includes(nome) && nome.length > melhor) {
      saida.cidade = c.slug;
      melhor = nome.length;
    }
  }

  const gostoAlias: Array<{ slug: string; chaves: string[] }> = [
    { slug: "artes-visuais", chaves: ["artes visuais", "exposicao", "galeria"] },
    { slug: "literatura", chaves: ["literatura", "poesia", "livro"] },
    { slug: "musica", chaves: ["musica", "show", "concerto", "samba"] },
    { slug: "teatro", chaves: ["teatro", "espetaculo"] },
    { slug: "cinema", chaves: ["cinema", "filme"] },
    { slug: "surpresa", chaves: ["surpreenda", "surpresa", "qualquer"] },
  ];
  for (const g of gostoAlias) {
    if (!gostos.some((x) => x.slug === g.slug)) continue;
    if (g.chaves.some((k) => t.includes(k))) {
      saida.gosto = g.slug;
      break;
    }
  }

  if (/\b(sozinho|sozinha|vou so|eu so)\b/.test(t)) saida.companhia = "sozinho";
  else if (/\b(a dois|adoidos|casal|namoro)\b/.test(t)) saida.companhia = "a-dois";
  else if (/\b(crianca|filho|filha|familia)\b/.test(t)) saida.companhia = "com-crianca";
  else if (/\b(grupo|amigos)\b/.test(t)) saida.companhia = "em-grupo";

  const mDias = t.match(/\b(\d+)\s*dias?\b/);
  if (mDias) {
    const n = Number(mDias[1]);
    if (diasOpcoes.includes(n)) saida.dias = n;
  } else if (/\bfim de semana\b/.test(t) && diasOpcoes.includes(2)) {
    saida.dias = 2;
  } else if (/\buma semana\b/.test(t) && diasOpcoes.includes(5)) {
    saida.dias = 5;
  }

  return saida;
}

function fraseDaPergunta(campo: Campo, pediuData: boolean): string {
  if (campo === "gosto") return "O que te chama?";
  if (campo === "companhia") return "Com quem você vai?";
  if (campo === "dias") {
    return pediuData
      ? "O acervo não tem programação de data futura com lugar — o roteiro é pelo que existe na cidade. Quantos dias você fica?"
      : "Quantos dias você fica?";
  }
  return "Em que cidade?";
}

function MapaEsquema() {
  return (
    <svg viewBox="0 0 240 140" className="ia-mapa-esquema" aria-hidden focusable="false">
      <rect width="240" height="140" fill="var(--cor-acao-lavada)" />
      <g stroke="var(--cor-borda-forte)" strokeWidth="1.25">
        <path d="M0 28h240M0 56h240M0 84h240M0 112h240" />
        <path d="M30 0v140M60 0v140M90 0v140M120 0v140M150 0v140M180 0v140M210 0v140" />
      </g>
      <path
        d="M36 108 C70 100, 90 64, 118 58 S170 70, 204 36"
        fill="none"
        stroke="var(--cor-acao)"
        strokeWidth="2"
        strokeDasharray="5 5"
        strokeLinecap="round"
      />
      {[
        [36, 108, "1"],
        [118, 56, "2"],
        [204, 36, "3"],
      ].map(([x, y, n]) => (
        <g key={String(n)}>
          <circle cx={x} cy={y} r="11" fill="var(--cor-acao)" />
          <text
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--cor-sobre-acao)"
            fontSize="11"
            fontWeight="700"
          >
            {n}
          </text>
        </g>
      ))}
    </svg>
  );
}

function ArtefatoPensar({
  passo,
  pedido,
  gostos,
  companhias,
  cidades,
}: {
  passo: 0 | 1 | 2;
  pedido: Pedido;
  gostos: readonly OpcaoDaEntrevista[];
  companhias: readonly OpcaoDaEntrevista[];
  cidades: readonly OpcaoDaEntrevista[];
}) {
  const cidade = cidades.find((c) => c.slug === pedido.cidade);
  const passos: Array<{ id: string; rotulo: string; icone: ReactElement<{ className?: string }> }> = [
    { id: "buscar", rotulo: "Buscando no acervo", icone: ICONE_BUSCAR },
    { id: "cruzar", rotulo: "Cruzando com o pedido", icone: ICONE_FICHA },
    { id: "montar", rotulo: "Montando o percurso", icone: ICONE_MAPA },
  ];
  const estado = (i: number): "feito" | "ativo" | "fila" =>
    i < passo ? "feito" : i === passo ? "ativo" : "fila";

  return (
    <div className="ia-pensar" data-pensar="" aria-busy="true" aria-live="polite">
      <div className="ia-passos" role="list">
        {passos.map((p, i) => (
          <span key={p.id} className="contents">
            {i > 0 ? <span className="ia-passo-risco" data-estado={estado(i - 1)} aria-hidden /> : null}
            <span className="ia-passo" data-estado={estado(i)} role="listitem">
              <span className="ia-passo-marca">
                {estado(i) === "feito" ? glifo(ICONE_CONFERIDO) : glifo(p.icone)}
              </span>
              {p.rotulo}
            </span>
          </span>
        ))}
      </div>

      <div className="ia-paineis">
        <section className="ia-painel">
          <p className="ia-painel-titulo">
            {glifo(ICONE_FICHA)} Critérios usados
          </p>
          <p className="ia-criterio">
            <span className="ia-criterio-rotulo">O que</span>
            {rotuloDe(gostos, pedido.gosto) || "—"}
          </p>
          <p className="ia-criterio">
            <span className="ia-criterio-rotulo">Com quem</span>
            {rotuloDe(companhias, pedido.companhia) || "—"}
          </p>
          <p className="ia-criterio">
            <span className="ia-criterio-rotulo">Quando</span>
            {pedido.dias !== null ? `${pedido.dias} dias` : "—"}
          </p>
          <p className="ia-criterio">
            <span className="ia-criterio-rotulo">Onde</span>
            {cidade?.rotulo ?? "—"}
          </p>
        </section>

        <section className="ia-painel">
          <p className="ia-painel-titulo">{glifo(ICONE_MAPA)} Mapa de exploração</p>
          <MapaEsquema />
          <p className="ia-mapa-legenda tipo-legenda">
            Esquema das paradas — o percurso real, com coordenada do acervo, aparece no
            roteiro.
          </p>
        </section>

        <section className="ia-painel">
          <p className="ia-painel-titulo">{glifo(ICONE_RELOGIO)} Avaliando opções</p>
          <ul className="ia-aval">
            <li>
              {cidade?.total != null
                ? `${cidade.total} registros no acervo de ${cidade.rotulo}`
                : "Acervo do território em leitura"}
            </li>
            <li>
              {pedido.gosto === "surpresa" || !pedido.gosto
                ? "Sem promoção de linguagem — o acervo inteiro concorre"
                : `Itens de ${rotuloDe(gostos, pedido.gosto)} sobem na fila da classe`}
            </li>
            <li>
              {pedido.dias !== null
                ? `Percurso de ${pedido.dias} dias por proximidade`
                : "Janela ainda sem duração"}
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function Fala({
  texto,
  animar,
  onFim,
}: {
  texto: string;
  animar: boolean;
  onFim?: () => void;
}) {
  const [visto, setVisto] = useState(animar ? "" : texto);
  const fim = useRef(onFim);
  fim.current = onFim;

  useEffect(() => {
    if (!animar || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisto(texto);
      fim.current?.();
      return;
    }
    setVisto("");
    let n = 0;
    const id = window.setInterval(() => {
      n += 2;
      const corte = Math.min(texto.length, n);
      setVisto(texto.slice(0, corte));
      if (corte >= texto.length) {
        window.clearInterval(id);
        fim.current?.();
      }
    }, 16);
    return () => window.clearInterval(id);
  }, [texto, animar]);

  const escrevendo = animar && visto.length < texto.length;
  return (
    <p className="ia-fala">
      {visto}
      {escrevendo ? <span className="ia-cursor" aria-hidden /> : null}
    </p>
  );
}

export function ConversaDaIa({ gostos, companhias, dias, cidades, sugestoes }: Props) {
  const campoId = useId();
  const [pedido, setPedido] = useState<Pedido>(PEDIDO_VAZIO);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [rascunho, setRascunho] = useState("");
  const [passo, setPasso] = useState<0 | 1 | 2>(0);
  const [pensando, setPensando] = useState(false);
  const [artefatoVisivel, setArtefatoVisivel] = useState(false);
  /** As conversas anteriores e a folha que as mostra. Ver `lib/ia-historico.ts`. */
  const [historico, setHistorico] = useState<Conversa[]>([]);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  /** O id da conversa CORRENTE. Criado no primeiro turno e mantido até «Nova conversa». */
  const idDaConversa = useRef<string | null>(null);
  const timers = useRef<number[]>([]);
  const seq = useRef(0);
  const fim = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);

  const nid = () => {
    seq.current += 1;
    return `m${seq.current}`;
  };

  useEffect(() => {
    return () => {
      for (const t of timers.current) window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    const alvo = document.querySelector(".ia-destino") ?? fim.current;
    alvo?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [mensagens, passo, pensando]);

  const iniciarPensamento = useCallback(
    (p: Pedido) => {
      if (pensando) return;
      if (!p.gosto || !p.companhia || p.dias === null || !p.cidade) return;
      const cidadeNome = rotuloDe(cidades, p.cidade);
      const gostoNome = rotuloDe(gostos, p.gosto);
      const capa = sugestoes.find((s) => s.cidade === p.cidade && s.gosto === p.gosto)?.capa ?? null;
      const destino: DestinoDoRoteiro = {
        href: `/ia/roteiro/${p.cidade}--${p.dias}-dias--${p.gosto}/#companhia=${p.companhia}`,
        titulo: `${gostoNome} em ${cidadeNome}`,
        meta: `${p.dias} dias`,
        capa,
      };
      setPensando(true);
      setPasso(0);
      setArtefatoVisivel(false);
      setMensagens((m) => [
        ...m,
        {
          id: nid(),
          papel: "assistente",
          texto: `Perfeito. Vou cruzar o acervo de ${cidadeNome} com o que você pediu.`,
          pensar: true,
        },
      ]);

      const entregar = () => {
        setPensando(false);
        setMensagens((m) => [
          ...m,
          {
            id: nid(),
            papel: "assistente",
            texto: `Pronto. Montei o roteiro: ${gostoNome} em ${cidadeNome}, ${p.dias} dias.`,
            destino,
          },
        ]);
        campo.current?.focus();
      };

      const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduzir) {
        setArtefatoVisivel(true);
        entregar();
        return;
      }

      const t1 = window.setTimeout(() => setPasso(1), 900);
      const t2 = window.setTimeout(() => setPasso(2), 1800);
      const t3 = window.setTimeout(entregar, 2800);
      timers.current.push(t1, t2, t3);
    },
    [cidades, gostos, pensando, sugestoes],
  );

  const seguir = useCallback(
    (proximo: Pedido, falaUsuario: string | null) => {
      const campoSeguinte = proximoCampo(proximo);
      setPedido(proximo);
      setMensagens((m) => {
        const extra: Mensagem[] = [];
        if (falaUsuario) extra.push({ id: nid(), papel: "usuario", texto: falaUsuario });
        if (campoSeguinte) {
          extra.push({
            id: nid(),
            papel: "assistente",
            texto: fraseDaPergunta(campoSeguinte, proximo.pediuData),
            pergunta: campoSeguinte,
          });
        }
        return extra.length ? [...m, ...extra] : m;
      });
      if (!campoSeguinte) iniciarPensamento(proximo);
    },
    [iniciarPensamento],
  );

  function enviarTexto(texto: string) {
    const aparado = texto.trim();
    if (!aparado || pensando) return;
    const lido = interpretar(aparado, { cidades, gostos, diasOpcoes: dias });
    const proximo: Pedido = {
      gosto: lido.gosto ?? pedido.gosto,
      companhia: lido.companhia ?? pedido.companhia,
      dias: lido.dias ?? pedido.dias,
      cidade: lido.cidade ?? pedido.cidade,
      pediuData: lido.pediuData === true || pedido.pediuData,
    };
    const avançou =
      proximo.gosto !== pedido.gosto ||
      proximo.companhia !== pedido.companhia ||
      proximo.dias !== pedido.dias ||
      proximo.cidade !== pedido.cidade;

    setRascunho("");
    if (campo.current) campo.current.style.height = "auto";

    if (!avançou && proximoCampo(proximo)) {
      setMensagens((m) => [
        ...m,
        { id: nid(), papel: "usuario", texto: aparado },
        {
          id: nid(),
          papel: "assistente",
          texto:
            "Não identifiquei cidade, linguagem ou duração nisso. Escolha abaixo, ou descreva de outro jeito.",
          pergunta: proximoCampo(proximo) ?? "gosto",
        },
      ]);
      setPedido(proximo);
      return;
    }
    seguir(proximo, aparado);
  }

  function escolher(campo: Campo, slug: string, rotulo: string) {
    if (pensando) return;
    const proximo: Pedido = {
      ...pedido,
      [campo]: campo === "dias" ? Number(slug) : slug,
    };
    seguir(proximo, rotulo);
  }

  function escolherSugestao(s: SugestaoDeRoteiro) {
    if (pensando) return;
    const proximo: Pedido = {
      gosto: s.gosto,
      companhia: s.companhia,
      dias: s.dias,
      cidade: s.cidade,
      pediuData: false,
    };
    seguir(proximo, s.texto);
  }

  // O histórico só pode ser lido no cliente: sob `output: "export"` o HTML sai do build e
  // ler `localStorage` no primeiro render divergiria da hidratação (o mesmo motivo de
  // `sessao.tsx` guardar `hidratado`).
  useEffect(() => {
    const guardadas = lerConversas<Mensagem, Pedido>();
    // Semeia os exemplos SÓ no histórico vazio — quem já conversou fica com o dele.
    setHistorico(guardadas.length ? guardadas : semearExemplos(exemplosDoHistorico(Date.now())));
  }, []);

  /**
   * Guarda a conversa a cada turno, e não só no fim.
   *
   * Guardar no fim exigiria saber quando o fim acontece — e uma conversa não termina, ela
   * é abandonada: a pessoa fecha a aba, troca de app, some. O que ela vai procurar depois
   * é o que estava na tela no último momento em que olhou.
   */
  useEffect(() => {
    if (!mensagens.length) return;
    const primeira = mensagens.find((m) => m.papel === "usuario");
    if (!primeira) return;
    // O ID VEM DA PRIMEIRA MENSAGEM, e não do relógio.
    //
    // Com `Date.now()` a mesma conversa ganhava ids diferentes a cada montagem do
    // componente — em desenvolvimento o React monta duas vezes de propósito — e a lista
    // aparecia com duas entradas idênticas, mesma pergunta e mesma hora. Derivar do id da
    // primeira mensagem torna a identidade da conversa uma propriedade dela, não do
    // instante em que alguém olhou para ela.
    if (!idDaConversa.current) idDaConversa.current = `c-${primeira.id}`;
    setHistorico(
      guardarConversa<Mensagem, Pedido>({
        id: idDaConversa.current,
        quando: Date.now(),
        titulo: primeira.texto.trim().slice(0, 90),
        mensagens,
        pedido,
      }),
    );
  }, [mensagens, pedido]);

  function abrirConversa(c: Conversa) {
    for (const t of timers.current) window.clearTimeout(t);
    timers.current = [];
    idDaConversa.current = c.id;
    setMensagens(c.mensagens);
    setPedido(c.pedido);
    setPensando(false);
    setArtefatoVisivel(true);
    setHistoricoAberto(false);
  }

  function novaConversa() {
    idDaConversa.current = null;
    for (const t of timers.current) window.clearTimeout(t);
    timers.current = [];
    setMensagens([]);
    setPedido(PEDIDO_VAZIO);
    setPensando(false);
    setPasso(0);
    setArtefatoVisivel(false);
    setRascunho("");
    campo.current?.focus();
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    enviarTexto(rascunho);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();
    enviarTexto(rascunho);
  }

  const conversando = mensagens.length > 0;
  const podeEnviar = rascunho.trim().length > 0 && !pensando;
  const perguntaAtiva = [...mensagens].reverse().find(ehAssistente)?.pergunta;

  const opcoesDaPergunta = (campo: Campo): OpcaoDaEntrevista[] => {
    if (campo === "gosto") return gostos;
    if (campo === "companhia") return companhias;
    if (campo === "cidade") return cidades;
    return dias.map((d) => ({ slug: String(d), rotulo: `${d} dias` }));
  };

  return (
    <div className="ia" data-fase={conversando ? "conversa" : "vazio"}>
      {/* SEM LOGO E SEM TÍTULO (27.08). A marca já está na barra do topo do app e o nome
          da tela já está na aba que trouxe a pessoa até aqui — repetir os dois consumia a
          primeira dobra de uma tela cujo assunto é o campo de escrever. */}
      <header className="ia-topo">
        <div className="ia-topo-acoes">
          {/* O HISTÓRICO É O PRIMEIRO BOTÃO e existe nos dois estados da tela.
              Antes, «Nova conversa» apagava a anterior sem deixar rastro: não havia onde
              procurá-la, porque não havia o que procurar. Um botão que só aparecesse
              durante a conversa seria inútil justamente para quem já saiu dela. */}
          {historico.length ? (
            <button
              type="button"
              className="ia-historico-botao"
              aria-expanded={historicoAberto}
              aria-label={`Conversas anteriores (${historico.length})`}
              onClick={() => setHistoricoAberto(true)}
            >
              {glifo(ICONE_PAINEL, "ia-historico-seta")}
            </button>
          ) : null}

          {conversando ? (
            <button type="button" className="ia-nova" onClick={novaConversa}>
              {glifo(ICONE_MAIS)} Nova conversa
            </button>
          ) : null}
        </div>
      </header>

      {historicoAberto ? (
        <>
          {/* O VÉU FECHA A GAVETA. Sem ele, sair do menu exigiria mirar num botão pequeno
              — e gaveta que só fecha pelo botão é gaveta que prende. */}
          <button
            type="button"
            className="ia-gaveta-veu"
            aria-label="Fechar as conversas anteriores"
            onClick={() => setHistoricoAberto(false)}
          />
          <aside className="ia-historico ia-gaveta" aria-label="Conversas anteriores">
            <div className="ia-gaveta-topo">
              <span className="ia-gaveta-titulo">Roteiros</span>
              <button
                type="button"
                className="ia-historico-remover"
                aria-label="Fechar"
                onClick={() => setHistoricoAberto(false)}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          <p className="ia-gaveta-secao">Recentes</p>
          <ul className="ia-historico-lista">
            {historico.map((c) => (
              <li key={c.id} className="ia-historico-item">
                <button
                  type="button"
                  className="ia-historico-abrir"
                  onClick={() => abrirConversa(c)}
                >
                  <span className="ia-historico-titulo">{c.titulo}</span>
                  <span className="ia-historico-quando tipo-legenda">
                    {c.exemplo ? (
                      <span className="ia-historico-selo">exemplo</span>
                    ) : null}
                    {quandoPorExtenso(c.quando, Date.now())}
                  </span>
                </button>
                <button
                  type="button"
                  className="ia-historico-remover"
                  aria-label={`Apagar a conversa «${c.titulo}»`}
                  onClick={() => setHistorico(removerConversa<Mensagem, Pedido>(c.id))}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </li>
            ))}
          </ul>
          {/* O teto é DITO, não escondido: lista que corta em silêncio faz a conversa
              antiga «sumir» sem explicação. */}
          {historico.some((c) => c.exemplo) ? (
            <p className="ia-historico-teto tipo-legenda">
              Estas conversas são exemplo, escritas por nós para mostrar como a lista fica.
              Elas somem assim que você tiver a sua primeira.
            </p>
          ) : null}
          {historico.length >= TETO_DE_CONVERSAS ? (
            <p className="ia-historico-teto tipo-legenda">
              As {TETO_DE_CONVERSAS} conversas mais recentes ficam guardadas aqui, neste
              aparelho. A mais antiga sai quando uma nova entra.
            </p>
          ) : null}

          {/* OS ROTEIROS SALVOS MORAM AQUI (27.08), e não mais no cabeçalho da tela.
              Conversa e roteiro são as duas coisas que a pessoa guarda desta tela, e
              estavam em lugares diferentes: a conversa na gaveta, o roteiro num
              «details» que só aparecia antes de começar a conversar — ou seja, sumia
              justo depois de você gerar um. */}
          <details className="ia-gaveta-salvos">
            <summary className="ia-gaveta-secao">Roteiros salvos</summary>
            <RoteirosSalvos cidades={cidades} gostos={gostos} />
          </details>
          </aside>
        </>
      ) : null}

      <div className="ia-fio">
        {conversando ? (
          <div className="ia-msgs" aria-live="polite">
            {mensagens.map((m, i) => {
              if (m.papel === "usuario") {
                return (
                  <div key={m.id} className="ia-msg ia-msg-usuario">
                    <p className="ia-balao ia-balao-usuario">{m.texto}</p>
                  </div>
                );
              }
              const campoPergunta = m.pergunta;
              const ultima = i === mensagens.length - 1;
              return (
                <div key={m.id} className="ia-msg">
                  <span className="ia-avatar" aria-hidden>
                    {glifo(ICONE_IA)}
                  </span>
                  <div className="ia-msg-corpo">
                    <div className="ia-balao ia-balao-assistente">
                      <Fala
                        texto={m.texto}
                        animar={ultima}
                        onFim={
                          m.pensar && !artefatoVisivel
                            ? () => setArtefatoVisivel(true)
                            : undefined
                        }
                      />
                    </div>
                    {campoPergunta ? (
                      <div>
                        <TrilhoDeChips rotulo={fraseDaPergunta(campoPergunta, pedido.pediuData)}>
                          {opcoesDaPergunta(campoPergunta).map((o) => (
                            <Chip
                              key={o.slug}
                              selecionado={
                                campoPergunta === "dias"
                                  ? pedido.dias === Number(o.slug)
                                  : pedido[campoPergunta] === o.slug
                              }
                              disabled={pensando || perguntaAtiva !== campoPergunta}
                              onClick={() => escolher(campoPergunta, o.slug, o.rotulo)}
                            >
                              {o.rotulo}
                              {o.detalhe ? <span className="ml-1 opacity-60">{o.detalhe}</span> : null}
                            </Chip>
                          ))}
                        </TrilhoDeChips>
                        {campoPergunta === "companhia" ? (
                          <p className="ia-nota tipo-legenda">
                            Esta resposta não filtra o acervo — ele não declara classificação
                            etária, e o roteiro diz isso em vez de fingir o recorte.
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    {m.pensar && artefatoVisivel ? (
                      <ArtefatoPensar
                        passo={passo}
                        pedido={pedido}
                        gostos={gostos}
                        companhias={companhias}
                        cidades={cidades}
                      />
                    ) : null}
                    {m.destino ? (
                      <a href={m.destino.href} className="ia-destino">
                        {m.destino.capa ? (
                          <span className="ia-destino-capa">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={m.destino.capa} alt="" />
                          </span>
                        ) : null}
                        <span className="ia-destino-texto">
                          <span className="ia-destino-titulo">{m.destino.titulo}</span>
                          <span className="ia-destino-meta tipo-legenda">{m.destino.meta}</span>
                        </span>
                        <span className="ia-destino-acao">Abrir roteiro</span>
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })}
            <div ref={fim} className="ia-fim" />
          </div>
        ) : (
          <div className="ia-vazio">
            <span className="ia-vazio-marca" aria-hidden>
              {glifo(ICONE_IA, "ia-vazio-glifo")}
            </span>
            <p className="ia-vazio-titulo tipo-titulo-2">Como posso ajudar?</p>
            {sugestoes.length > 0 ? (
              <div className="ia-sugestoes">
                {sugestoes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="ia-sugestao"
                    onClick={() => escolherSugestao(s)}
                  >
                    {s.capa ? (
                      <span className="ia-sugestao-capa">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.capa} alt="" />
                      </span>
                    ) : null}
                    <span className="ia-sugestao-texto">
                      <span className="ia-sugestao-pedido">{s.texto}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <form className="ia-compositor" onSubmit={onSubmit}>
        <label htmlFor={campoId} className="ia-compositor-rotulo">
          Mensagem
        </label>
        <div className="ia-compositor-caixa">
          <textarea
            id={campoId}
            ref={campo}
            rows={1}
            className="ia-compositor-campo"
            placeholder="Pergunte sobre um roteiro…"
            value={rascunho}
            disabled={pensando}
            autoFocus
            onChange={(e) => {
              setRascunho(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={onKeyDown}
          />
          <button type="submit" className="ia-enviar" disabled={!podeEnviar} aria-label="Enviar mensagem">
            {glifo(ICONE_ENVIAR)}
          </button>
        </div>
        {/* A nota só existe ENQUANTO PENSA, e virou feedback em vez de rodapé fixo.
            O texto parado — «Nenhum modelo é chamado. Enter envia.» — ocupava uma linha
            embaixo do campo em toda visita e empurrava o campo para longe da barra.

            SAIU DO PRODUTO, e não mudou de lugar: hoje nenhuma tela declara que aqui não
            se chama modelo nenhum. Foi decisão do cliente em 27.08, e fica registrado
            aqui porque a informação era verdadeira e continua sendo — quem quiser repor,
            o lugar natural é a tela vazia, não o rodapé do campo. */}
        {pensando ? (
          <p className="ia-compositor-nota tipo-legenda">Montando o percurso no acervo…</p>
        ) : null}
      </form>
    </div>
  );
}
