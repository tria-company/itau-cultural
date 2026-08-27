"use client";

import Link from "next/link";
import { OpcaoDeSegmento, Segmento } from "./base/segmento";
import { useEffect, useMemo, useState } from "react";
import { ROTULO_DA_ACAO, decisaoCompleta, situacaoApos } from "@/dados/tipos-acesso";
import { CHAVE_DO_ARMAZEM, gravarArmazem, lerArmazem } from "./moderacao-armazem";
import type {
  AcaoDeclarada,
  AcaoDaModeracao,
  ComponenteDoScore,
  DeclaracaoDaModeracao,
  Escopo,
  FaixaDeScore,
  IdDoEscopo,
  ConcentracaoMedida,
  IdDaOrdenacao,
  DecisaoRegistrada,
  ItemDaFila,
  MotivoDeDenuncia,
  NumerosDaModeracao,
  Ordenacao,
  OrigemDeclarada,
  OrigemDoItem,
} from "@/dados/moderacao";

/**
 * moderacao-fila.tsx — a fila da Moderação (tela 34, D-82 a D-84 e D-86; funcionalidades
 * 108, 109 e 122). Migrada da Redação na tarefa 1 da S3.
 *
 * ESTA TELA É A RESPOSTA À PERGUNTA MAIS DIFÍCIL DO RFP: onde a IA não deve ser utilizada.
 * A resposta não é o rodapé — é a mecânica. A sugestão da IA chega marcada, com score e com
 * a regra do score do lado; ela não vira dado público sem um humano apertar «aprovar»; e o
 * botão de vetar **não conclui** com o campo de motivo vazio. A diferença entre curadoria e
 * moderação silenciosa é essa obrigatoriedade, e ela precisa ser demonstrável ao vivo em
 * vez de descrita.
 *
 * DUAS TRAVAS NO VETO, E NÃO UMA (T-05-14). O botão de confirmar está de fato `disabled` —
 * não apenas apagado — e `registrarVeto` recusa motivo em branco POR CONTA PRÓPRIA, mesmo
 * chamada por outro caminho. Só a aparência não basta: um botão que apenas parece apagado
 * ainda dispara por `Enter`, por `form.submit()` e por `el.click()`, e cada um desses
 * caminhos produziria uma decisão de veto sem motivo — que é exatamente a moderação
 * silenciosa que D-83 existe para impedir. `data-veto-bloqueado` lê a MESMA expressão que
 * `disabled`, e não um espelho de estado separado que pode divergir do botão.
 *
 * DP-F: este arquivo é `"use client"` e importa `@/dados/moderacao` **apenas por tipo**. O
 * módulo alcança 23 MB de grafo; o que atravessa a fronteira é o DTO, que é só primitivo, e
 * quem o monta é a página de servidor.
 *
 * O CARIMBO NÃO VEM DO RELÓGIO. `carimbo` chega por propriedade, derivado da data de
 * referência do build. Ler `new Date()` aqui faria o HTML exportado e a página hidratada
 * divergirem na primeira renderização e ainda exporia o fuso horário de quem avalia.
 */

// ---------------------------------------------------------------------------
// A decisão — D-84: nunca sem autor, nunca sem carimbo
// ---------------------------------------------------------------------------

/**
 * A decisão gravada é a do CONTRATO (`DecisaoRegistrada`, que estende `DecisaoDeModeracao`
 * de `tipos-acesso.ts`), e não um formato desta tela. É o mesmo objeto que o Studio lê para
 * mostrar ao produtor o que aconteceu com o registro dele — um formato próprio aqui
 * obrigaria uma tradução no meio, e tradução entre dois níveis é onde o motivo se perde.
 */
type Decisao = DecisaoRegistrada;

const ROTULO_ORIGEM: Record<OrigemDoItem, string> = {
  produtor: "produtor",
  ingestao: "ingestão automática",
  ia: "sugestão de IA",
  denuncia: "denúncia do público",
};

// ---------------------------------------------------------------------------
// O armazém — a decisão sobrevive ao recarregamento, e o reinício a apaga
// ---------------------------------------------------------------------------

function comSeparador(n: number): string {
  return n.toLocaleString("pt-BR");
}

/** "0.6" → "0,60". Vírgula porque a tela é em português e o número é lido em voz alta. */
function comoScore(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

// ---------------------------------------------------------------------------
// Pedaços
// ---------------------------------------------------------------------------

/**
 * O selo de origem. Ele é o primeiro elemento da linha de propósito: quem varre a fila
 * precisa saber DE ONDE veio o item antes de ler o título, porque é a origem que decide
 * quanto do resto merece confiança.
 */
function SeloOrigem({ origem }: { origem: OrigemDoItem }) {
  return (
    <span className="moderacao-selo-origem" data-origem={origem}>
      {ROTULO_ORIGEM[origem]}
    </span>
  );
}

function LinhaDaFila({
  item,
  escolhido,
  aoEscolher,
}: {
  item: ItemDaFila;
  escolhido: boolean;
  aoEscolher: () => void;
}) {
  return (
    <li
      className="web-linha web-realce moderacao-linha"
      data-item-fila={item.id}
      // D-82 — a origem vai na LINHA, não só no painel: a tela existe para que a
      // procedência de cada item seja legível varrendo a fila, sem abrir item nenhum.
      data-procedencia-item={item.origem}
      // 124 — o denominador da ordem, NA LINHA. Sem ele a fila estaria ordenada por um
      // critério invisível, e «prioridade por vazio» seria uma afirmação sobre a tela em
      // vez de uma propriedade dela. Vazio quando o acervo não resolve a UF do item.
      data-registros-uf={item.registrosNaUf ?? ""}
      data-realcado={escolhido ? "sim" : "nao"}
    >
      <button type="button" className="moderacao-linha-botao" onClick={aoEscolher}>
        <span className="moderacao-linha-topo">
          <SeloOrigem origem={item.origem} />
          {item.score !== null ? (
            <span className="moderacao-score" data-score-ia={item.score}>
              <span className="moderacao-score-rotulo">confiança</span>
              <span className="moderacao-score-numero">{comoScore(item.score)}</span>
            </span>
          ) : (
            // Produtor e ingestão AFIRMAM; a IA estima. A ausência de score é dita em
            // texto em vez de virar espaço em branco, que é o que D-90 pede.
            <span className="moderacao-sem-score">sem score — origem que afirma</span>
          )}
        </span>
        <span className="web-linha-titulo">{item.titulo}</span>
        <span className="web-linha-meta">
          <span className="moderacao-classe">{item.classe}</span>
          <span className="studio-rotulo">procedência {item.procedencia}</span>
          {item.territorio ? <span>{item.territorio}</span> : null}
          {/* O registro da UF fica À VISTA na linha: é o número que explica por que este
              item subiu, e uma ordem cujo critério não está na tela é indistinguível de
              uma ordem arbitrária. Quando o acervo não resolve a UF, a linha diz isso em
              texto em vez de deixar o espaço em branco. */}
          {item.uf ? (
            <span className="moderacao-registros-uf">
              {item.uf} · {comSeparador(item.registrosNaUf ?? 0)} registros no acervo
            </span>
          ) : (
            <span className="moderacao-registros-uf" data-nao-sustenta>
              sem UF no acervo
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

/** Os cinco componentes do score, marcados um a um. É isto que torna o número conferível. */
function ComponentesDoScore({
  componentes,
  atendidos,
}: {
  componentes: readonly ComponenteDoScore[];
  atendidos: string[];
}) {
  return (
    <ul className="moderacao-componentes">
      {componentes.map((c) => {
        const atende = atendidos.includes(c.id);
        return (
          <li key={c.id} className="moderacao-componente" data-atende={atende ? "sim" : "nao"}>
            <span className="moderacao-componente-marca" aria-hidden>
              {atende ? "●" : "○"}
            </span>
            <span className="moderacao-componente-texto">
              <strong>{c.rotulo}</strong>
              <span className="studio-nota">{c.observa}</span>
            </span>
            <span className="moderacao-componente-peso">
              {atende ? `+${comoScore(c.peso)}` : "0,00"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// A tela
// ---------------------------------------------------------------------------

export function ModeracaoFila({
  fila,
  numeros,
  escopos,
  origens,
  acoes,
  componentesDoScore,
  regraDoScore,
  regraDaAmostragem,
  porQueRodizio,
  distribuicao,
  fraseDaAssimetria,
  fraseDaAtribuicao,
  declaracoes,
  limites,
  moderador,
  moderadorEhAutorado,
  carimbo,
  itensPorOrigem,
  itemInicial,
  ordenacoes,
  concentracao,
  motivosDeDenuncia,
  regraDaDenuncia,
}: {
  /** Os 60 itens já achatados em primitivo. Nenhuma `Entidade` atravessa a fronteira. */
  fila: ItemDaFila[];
  numeros: NumerosDaModeracao;
  escopos: readonly Escopo[];
  origens: readonly OrigemDeclarada[];
  acoes: readonly AcaoDeclarada[];
  componentesDoScore: readonly ComponenteDoScore[];
  regraDoScore: string;
  regraDaAmostragem: string;
  porQueRodizio: string;
  distribuicao: FaixaDeScore[];
  fraseDaAssimetria: string;
  fraseDaAtribuicao: string;
  declaracoes: DeclaracaoDaModeracao[];
  limites: readonly string[];
  moderador: string;
  moderadorEhAutorado: string;
  /** Derivado da data de referência do build. Ver o cabeçalho deste arquivo. */
  carimbo: string;
  itensPorOrigem: number;
  /** Em que item a tela abre. Constante do módulo, e não sorteio a cada build. */
  itemInicial: string;
  /** As ordens possíveis, com o campo que cada uma observa e o porquê dela. */
  ordenacoes: readonly Ordenacao[];
  /** A concentração do acervo nas 27 unidades federativas. Medida, nunca digitada. */
  concentracao: ConcentracaoMedida;
  motivosDeDenuncia: readonly MotivoDeDenuncia[];
  regraDaDenuncia: string;
}) {
  const [escopo, setEscopo] = useState<IdDoEscopo>("nacional");
  /**
   * A fila abre ORDENADA POR VAZIO, e é a decisão de produto da funcionalidade 124: a
   * ordem padrão de uma fila é a política dela. Abrir por volume poria São Paulo no alto
   * todo dia, e ninguém precisaria escolher isso — bastaria não escolher nada.
   */
  const [ordenacao, setOrdenacao] = useState<IdDaOrdenacao>("vazio");
  const [escolhidoId, setEscolhidoId] = useState<string>(itemInicial);

  /**
   * As decisões desta sessão, no armazém do navegador. **Recarregar preserva**, e é
   * requisito: quem avalia a proposta decide um item, recarrega a página e precisa ver que
   * a decisão ficou — uma tela que esquece ao recarregar demonstra a forma da decisão e
   * não o registro dela, e o registro é o que a moderação existe para provar.
   *
   * Começa VAZIO no primeiro render, de propósito. O HTML sai do build sem armazém nenhum,
   * e o `useEffect` abaixo é que traz o que estava gravado — é essa ordem que faz a página
   * exportada e a hidratada coincidirem.
   */
  const [decisoes, setDecisoes] = useState<Decisao[]>([]);
  const [armazemLido, setArmazemLido] = useState(false);

  /** O que o navegador respondeu, quando recusou. Declarado na tela, nunca engolido. */
  const [falhaDoArmazem, setFalhaDoArmazem] = useState<string | null>(null);

  useEffect(() => {
    const lido = lerArmazem();
    setDecisoes(lido.decisoes);
    setFalhaDoArmazem(lido.falha);
    setArmazemLido(true);
  }, []);

  useEffect(() => {
    // Só grava DEPOIS de ter lido. Sem esta guarda, o primeiro efeito gravaria o array
    // vazio do estado inicial por cima do que estava no navegador — e o recarregamento
    // apagaria as decisões em vez de as preservar.
    if (armazemLido) setFalhaDoArmazem(gravarArmazem(decisoes));
  }, [decisoes, armazemLido]);

  /** O veto é a única ação com passo de confirmação. A assimetria é o conteúdo (D-83). */
  const [vetando, setVetando] = useState(false);
  const [motivoVeto, setMotivoVeto] = useState("");
  const [comentarioDevolucao, setComentarioDevolucao] = useState("");

  const decididos = useMemo(
    () => new Set(decisoes.map((d) => d.itemId)),
    [decisoes],
  );

  const escopoAtivo = useMemo(
    () => escopos.find((e) => e.id === escopo) ?? escopos[0],
    [escopos, escopo],
  );

  const ordenacaoAtiva = useMemo(
    () => ordenacoes.find((o) => o.id === ordenacao) ?? ordenacoes[0],
    [ordenacoes, ordenacao],
  );

  /**
   * O RECORTE. Despachado sobre `Escopo.campo`, que veio no DTO — a mesma decisão que
   * `itemNoEscopo` toma do lado do build. O nome do campo viaja em vez de a regra ser
   * copiada, porque duas cópias de uma regra de recorte divergem em silêncio e o sintoma
   * é um item com território à vista sumindo do escopo territorial.
   */
  const noEscopo = (item: ItemDaFila) => {
    if (escopoAtivo.campo === "territorio") return item.territorio !== null;
    if (escopoAtivo.campo === "linguagens") return item.linguagens.length > 0;
    return true;
  };

  /**
   * A ORDEM. Despachada sobre `Ordenacao.campo`, exatamente como o recorte — o nome do
   * campo viaja no DTO e o critério não é reescrito aqui.
   *
   * `por vazio` sobe quem o acervo menos documenta: o item de menor `registrosNaUf`
   * primeiro. Os itens SEM UF não vão para o fim nem para o começo — vão para um bloco
   * próprio, depois dos que têm, porque «não sei onde isto fica» não é o mesmo que «isto
   * fica num lugar bem documentado», e empurrá-los para qualquer uma das pontas afirmaria
   * uma das duas coisas. O número deles está declarado na tela.
   *
   * O desempate é sempre o `id`: sem ele, dois itens da mesma UF trocariam de lugar entre
   * renderizações e a fila pareceria embaralhar sozinha.
   */
  const ordenar = (a: ItemDaFila, b: ItemDaFila): number => {
    if (ordenacaoAtiva.campo === "registrosNaUf") {
      const ra = a.registrosNaUf;
      const rb = b.registrosNaUf;
      if (ra === null && rb !== null) return 1;
      if (rb === null && ra !== null) return -1;
      if (ra !== null && rb !== null && ra !== rb) return ra - rb;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    }
    const ia = origens.findIndex((o) => o.id === a.origem);
    const ib = origens.findIndex((o) => o.id === b.origem);
    if (ia !== ib) return ia - ib;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  };

  const pendentes = useMemo(
    () => fila.filter((i) => !decididos.has(i.id) && noEscopo(i)).sort(ordenar),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fila, decididos, escopoAtivo, ordenacaoAtiva],
  );

  /**
   * O item aberto. Se o escolhido saiu da fila — decidido, ou fora do recorte —, o painel
   * cai no primeiro pendente em vez de ficar vazio: a fila é o dado e a escolha é estado
   * de tela, e nenhuma das duas pode derrubar a outra.
   */
  const item = useMemo(
    () => pendentes.find((i) => i.id === escolhidoId) ?? pendentes[0],
    [pendentes, escolhidoId],
  );

  /**
   * Quantos itens pendentes o escopo ativo DEIXA DE FORA (122). Medido sobre a mesma fila,
   * e não estimado: é o número que impede o moderador de confundir o recorte dele com a
   * fila inteira. Conta só os pendentes — um item já decidido não está «fora do escopo»,
   * está resolvido.
   */
  const foraDoEscopo = useMemo(
    () => fila.filter((i) => !decididos.has(i.id) && !noEscopo(i)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fila, decididos, escopoAtivo],
  );

  const contadas = useMemo(() => {
    const c: Record<string, number> = { produtor: 0, ingestao: 0, ia: 0, denuncia: 0 };
    for (const i of pendentes) c[i.origem] = (c[i.origem] ?? 0) + 1;
    return c;
  }, [pendentes]);

  // -------------------------------------------------------------------------
  // As decisões. Só existe UM caminho para uma decisão nascer, e ele passa por aqui.
  // -------------------------------------------------------------------------

  const registrar = (acao: AcaoDaModeracao, motivo: string) => {
    if (!item) return;
    const decisao: Decisao = {
      itemId: item.id,
      itemTitulo: item.titulo,
      origem: item.origem,
      acao,
      // `null` e não `""`: o contrato distingue «não houve motivo» de «houve e é vazio», e
      // uma string vazia gravada faria `decisaoCompleta` recusar um `devolver` legítimo.
      motivo: motivo.trim() ? motivo.trim() : null,
      autor: moderador,
      quando: carimbo,
      escopo: escopoAtivo.id,
      // Gravada junto, e derivada — nunca digitada. É o que o Studio lê para dizer ao
      // produtor em que estado o registro dele ficou.
      situacao: situacaoApos(acao),
    };
    // A TERCEIRA TRAVA, e é a do CONTRATO. `decisaoCompleta` mora em `tipos-acesso.ts` e é
    // a mesma função que o Studio usa para conferir o que recebeu. Chamá-la aqui, em vez de
    // reescrever a regra, é o que garante que os dois lados concordem sobre o que é uma
    // decisão gravável — e não por boa vontade das duas telas.
    if (!decisaoCompleta(decisao)) return;
    setDecisoes((antes) => [decisao, ...antes.filter((d) => d.itemId !== item.id)]);
    setVetando(false);
    setMotivoVeto("");
    setComentarioDevolucao("");
  };

  /** Espaço em branco não é motivo. Aparado ANTES de avaliar, e não depois. */
  const motivoAparado = motivoVeto.trim();

  /**
   * A SEGUNDA TRAVA (T-05-14). O botão de confirmar está `disabled`, mas `disabled` é
   * aparência de um caminho só: `el.click()`, `Enter` sobre o formulário e `form.submit()`
   * ainda alcançam o manipulador em vários navegadores e em qualquer código que chame por
   * fora. Esta função recusa por conta própria, e é ela — não o atributo — que garante que
   * nenhuma decisão de veto nasça sem motivo escrito.
   */
  const registrarVeto = () => {
    if (!motivoAparado) return;
    registrar("vetar", motivoAparado);
  };
  // As três travas do veto, e cada uma cobre o que a anterior não cobre:
  //   1. `disabled` no botão — impede o clique de mouse
  //   2. `registrarVeto` recusa motivo vazio — cobre `el.click()`, `Enter` e `form.submit()`
  //   3. `decisaoCompleta`, do contrato — cobre qualquer caminho novo que alguém abra
  //      depois, inclusive um que não passe por `registrarVeto`

  const executar = (acao: AcaoDaModeracao) => {
    if (acao === "vetar") {
      setVetando(true);
      return;
    }
    if (acao === "devolver") {
      registrar("devolver", comentarioDevolucao.trim());
      return;
    }
    registrar(acao, "");
  };

  const desfazer = (itemId: string) =>
    setDecisoes((antes) => antes.filter((d) => d.itemId !== itemId));

  /**
   * Reinicia a demonstração: apaga o armazém e devolve a fila ao estado de abertura.
   *
   * Existe porque a mesma tela é aberta por várias pessoas em sequência numa avaliação, e
   * a segunda encontraria a fila já decidida pela primeira sem entender por quê. O
   * `setDecisoes([])` dispara o efeito de gravação e o armazém fica vazio pelo mesmo
   * caminho de sempre — não há segunda escrita em `localStorage` aqui, que seria a cópia
   * que diverge no dia em que a forma do registro mudar.
   */
  const [confirmandoReinicio, setConfirmandoReinicio] = useState(false);

  const reiniciar = () => {
    setDecisoes([]);
    setEscolhidoId(itemInicial);
    setEscopo("nacional");
    setOrdenacao("vazio");
    setVetando(false);
    setMotivoVeto("");
    setComentarioDevolucao("");
    setConfirmandoReinicio(false);
  };

  const acaoDoVeto = acoes.find((a) => a.id === "vetar");
  const acaoDeDevolver = acoes.find((a) => a.id === "devolver");

  return (
    <div className="studio moderacao" data-fila-moderacao>
      {/* ------------------------------------------------------------------ */}
      {/* Cabeçalho — quem opera, sobre o quê, e com qual ESCOPO (D-84).      */}
      {/* ------------------------------------------------------------------ */}
      <header className="studio-cabecalho">
        <span className="studio-superficie">Moderação · a fila</span>
        <h1 className="studio-titulo">
          {comSeparador(pendentes.length)} itens esperando decisão
        </h1>
        <p className="studio-objetivo">
          Cada item traz a ORIGEM de onde veio. Os de sugestão de IA trazem score de
          confiança e a regra que o produziu. Toda decisão fica com nome e carimbo.
        </p>

        {/* ------------------------------------------------------------------
            A FISCALIZAÇÃO POSTERIOR (2026-08) — o que mudou com o perfil Produtor.

            Até aqui esta fila era o PEDÁGIO: nada virava dado público sem alguém
            decidir. Com a publicação direta, o produtor publica e o registro vai ao
            ar — e a decisão desta tela passou a ser sobre o que JÁ ESTÁ NO AR.

            O QUE NÃO MUDOU, e é o que importa: as ações continuam sendo as mesmas seis,
            `situacaoApos` continua sendo o mapa único entre ação e situação, e
            `decisaoCompleta` continua cobrando motivo escrito em vetar e suspender. O
            que mudou é O MOMENTO — antes de aparecer, agora depois — e o significado de
            cada ação:

              · SUSPENDER retira do ar o que estava publicado. É a ação central agora.
              · VETAR continua barrando o que nunca entrou: as propostas de agente e de
                obra que o produtor manda junto com o registro.
              · DEVOLVER devolve a palavra a quem escreveu, com comentário.

            A assimetria de motivo obrigatório continua onde estava, e agora ela pesa
            mais: suspender tira do ar algo que o público já viu.
            ------------------------------------------------------------------ */}
        <div className="fisc-declaracao" data-fiscalizacao-posterior>
          <p>
            <strong>Fiscalização posterior.</strong> Desde o perfil Produtor, publicar não
            passa por esta fila: quem produz publica direto, e o registro vai ao ar. O que
            se decide aqui é sobre <strong>o que já está no ar</strong>, por amostragem,
            por duplicata suspeita e por denúncia.
          </p>
          <p>
            <strong>Suspender</strong> retira do ar o que foi publicado, com motivo escrito.{" "}
            <strong>Vetar</strong> continua barrando o que nunca entrou, as propostas de
            agente e de obra que chegam junto com o registro. <strong>Devolver</strong>{" "}
            devolve a palavra a quem escreveu.
          </p>
          <p>
            As duas que encerram o assunto sem devolver a palavra, vetar e suspender,
            continuam sendo as únicas que cobram motivo por escrito. Isso pesa mais agora do
            que pesava: suspender tira do ar algo que o público já viu.
          </p>
        </div>

        {/* AS OUTRAS TRÊS TELAS DA MODERAÇÃO. Sem estes links elas existem no artefato
            e não são alcançáveis por ninguém — tela sem entrada é tela que não existe
            para quem está na frente do produto. */}
        <nav className="moderacao-ficha-atalhos" aria-label="telas da moderação">
          <Link className="studio-botao" data-ir-para="ia" href="/moderacao/ia/">
            revisão da IA · {comSeparador(numeros.itensPorOrigem.ia)}
          </Link>
          <Link className="studio-botao" data-ir-para="duplicatas" href="/moderacao/duplicatas/">
            duplicatas
          </Link>
          <Link className="studio-botao" data-ir-para="similaridade" href="/moderacao/similaridade/">
            similaridade
          </Link>
          <Link className="studio-botao" data-ir-para="elenco" href="/moderacao/elenco/">
            elenco declarado
          </Link>
          <Link className="studio-botao" data-ir-para="escopo" href="/moderacao/escopo/">
            escopo e escalonamento
          </Link>
          <Link className="studio-botao" data-ir-para="historico" href="/moderacao/historico/">
            meu histórico
          </Link>
        </nav>

        <div className="moderacao-escopos">
          <span className="studio-rotulo">escopo do moderador</span>
          <Segmento rotulo="escopo de curadoria">
            {escopos.map((e) => (
              <OpcaoDeSegmento
                key={e.id}
                data-escopo-curador={e.id}
                selecionado={escopo === e.id}
                onClick={() => setEscopo(e.id)}
              >
                {/* O alcance vem do MÓDULO e é medido sobre a fila que existe. Um número
                    digitado aqui passaria a mentir na primeira regeração do grafo — e o
                    escopo é justamente o que precisa dizer quanto NÃO está sendo visto. */}
                {e.rotulo} · {comSeparador(e.alcance)}
              </OpcaoDeSegmento>
            ))}
          </Segmento>
          <span className="studio-pastilha">
            operando como <strong>{moderador}</strong>
          </span>
        </div>

        <p className="moderacao-escopo-descricao">{escopoAtivo.descricao}</p>

        {/* ---------------------------------------------------------------- */}
        {/* 122 — o escopo IMPRESSO: o que este recorte deixa de fora, contado */}
        {/* ---------------------------------------------------------------- */}
        <p className="moderacao-escopo-fora" data-escopo-fora={foraDoEscopo}>
          {foraDoEscopo > 0 ? (
            <>
              <strong>{comSeparador(foraDoEscopo)}</strong> {""}
              {foraDoEscopo === 1 ? "item pendente está" : "itens pendentes estão"} fora
              deste escopo e não {foraDoEscopo === 1 ? "aparece" : "aparecem"} na lista
              abaixo. Eles não sumiram — estão fora do corte, e trocar o escopo acima os
              devolve. Um moderador que não sabe o tamanho do que não vê acha que a fila
              dele é a fila inteira.
            </>
          ) : (
            <>Este escopo alcança todos os itens pendentes: nada está fora do corte.</>
          )}
        </p>

        {/* ---------------------------------------------------------------- */}
        {/* 124 — a ordem é política, e por isso ela é declarada e trocável    */}
        {/* ---------------------------------------------------------------- */}
        <div className="moderacao-ordenacoes">
          <span className="studio-rotulo">ordem da fila</span>
          <Segmento rotulo="ordem da fila">
            {ordenacoes.map((o) => (
              <OpcaoDeSegmento
                key={o.id}
                data-ordenacao-fila={o.id}
                selecionado={ordenacao === o.id}
                onClick={() => setOrdenacao(o.id)}
              >
                {o.rotulo}
              </OpcaoDeSegmento>
            ))}
          </Segmento>
        </div>
        <p className="moderacao-ordenacao-porque">{ordenacaoAtiva.porque}</p>

      </header>

      <div className="moderacao-colunas">
        {/* ---------------------------------------------------------------- */}
        {/* A fila                                                            */}
        {/* ---------------------------------------------------------------- */}
        <section className="web-painel moderacao-coluna-fila">
          <h2 className="web-painel-titulo">a fila</h2>

          <div className="moderacao-contagens">
            {origens.map((o) => (
              <span
                key={o.id}
                className={
                  o.id === "ia" ? "studio-pastilha studio-pastilha-marca" : "studio-pastilha"
                }
              >
                <span className="studio-pastilha-numero">
                  {comSeparador(contadas[o.id] ?? 0)}
                </span>
                {o.rotulo}
              </span>
            ))}
          </div>

          {pendentes.length ? (
            <ul className="web-lista-densa moderacao-lista">
              {pendentes.map((i) => (
                <LinhaDaFila
                  key={i.id}
                  item={i}
                  escolhido={item?.id === i.id}
                  aoEscolher={() => {
                    setEscolhidoId(i.id);
                    setVetando(false);
                    setMotivoVeto("");
                  }}
                />
              ))}
            </ul>
          ) : (
            <p className="studio-nota">
              Nenhum item pendente neste escopo. Trocar o escopo acima devolve os itens que
              o recorte deixou de fora — eles não sumiram, estão fora do corte.
            </p>
          )}

          <div className="studio-nao-sustenta" data-nao-sustenta>
            <span className="studio-nao-sustenta-rotulo">como esta fila foi montada</span>
            <p>{fraseDaAtribuicao}</p>
            <p>{regraDaAmostragem}</p>
            <p>
              São {comSeparador(itensPorOrigem)} itens por origem nas três de submissão,
              mais {comSeparador(numeros.itensPorOrigem.denuncia)} denúncias — {""}
              {comSeparador(numeros.itensNaFila)} no total.
            </p>
            <p>{regraDaDenuncia}</p>
            <p>
              A UF de cada item sai da hierarquia territorial do acervo, e {""}
              <strong>
                {comSeparador(numeros.itensNaFila - numeros.itensComUf)} dos {""}
                {comSeparador(numeros.itensNaFila)}
              </strong>{" "}
              não têm nenhuma — eles aparecem no fim da ordem por vazio, num bloco próprio,
              porque «o acervo não sabe onde isto fica» não é o mesmo que «isto fica num
              lugar bem documentado». Os que têm cobrem {comSeparador(numeros.ufsNaFila)} {""}
              das {comSeparador(concentracao.unidades)} unidades federativas.
            </p>
          </div>

          {/* -------------------------------------------------------------- */}
          {/* A SEGUNDA FONTE — declarada mesmo vazia, com o número            */}
          {/* -------------------------------------------------------------- */}
          <div className="studio-nao-sustenta" data-nao-sustenta data-registros-vivos={numeros.registrosVivos}>
            <span className="studio-nao-sustenta-rotulo">
              a segunda fonte da fila · {comSeparador(numeros.registrosVivos)} registros
            </span>
            <p>
              Esta fila tem <strong>duas fontes por desenho</strong>: os {""}
              {comSeparador(numeros.itensNaFila)} itens encenados do acervo, acima, e os
              registros que um produtor enviou do Studio e estão em moderação. A segunda
              está em <strong>{comSeparador(numeros.registrosVivos)}</strong> porque a
              ligação com o armazém do Studio ainda não foi construída — não porque nenhum
              produtor enviou.
            </p>
            <p>
              O número aparece declarado, e vazio, em vez de a tela omitir a fonte: uma fila
              que mostra só o que tem parece completa, e é assim que uma integração que
              falhou passa por uma fila sem trabalho.
            </p>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* O item escolhido — a ficha, o score conferível, as quatro ações   */}
        {/* ---------------------------------------------------------------- */}
        <div className="moderacao-coluna-painel">
          {item ? (
            <section
              className="web-painel moderacao-item"
              // `data-procedencia-item` NÃO se repete aqui: ele é atributo de LINHA da
              // fila, e um gate que conte 60 origens não pode encontrar 61 porque o
              // painel repetiu a do item aberto. O selo de origem abaixo diz a mesma
              // coisa em texto, que é o que o produto precisa.
              data-item-escolhido={item.id}
            >
              <div className="studio-painel-cabeca">
                <SeloOrigem origem={item.origem} />
                <span className="studio-pastilha">{item.classe}</span>
                <span className="studio-pastilha">procedência {item.procedencia}</span>
              </div>

              <h2 className="studio-painel-nome">{item.titulo}</h2>

              {item.resumo ? (
                <p className="studio-nota">{item.resumo}</p>
              ) : (
                <p className="studio-nota" data-nao-sustenta>
                  O acervo não publica resumo para este item. O campo aparece declarado
                  vazio em vez de sumir da ficha — quem decide precisa saber que a ausência
                  é do dado, e não da tela.
                </p>
              )}

              <div className="studio-tabela">
                <div className="studio-linha">
                  <div className="studio-celula studio-celula-rotulo">id no acervo</div>
                  <div className="studio-celula">
                    <code className="studio-literal">{item.entidadeId}</code>
                  </div>
                </div>
                <div className="studio-linha">
                  <div className="studio-celula studio-celula-rotulo">origem declarada</div>
                  <div className="studio-celula">
                    {origens.find((o) => o.id === item.origem)?.regra}
                  </div>
                </div>
                <div className="studio-linha">
                  <div className="studio-celula studio-celula-rotulo">fonte</div>
                  <div className="studio-celula">
                    {item.fonte ? (
                      <code className="studio-literal">{item.fonte}</code>
                    ) : (
                      <span data-nao-sustenta>
                        o acervo não declara URL de origem para este item
                      </span>
                    )}
                  </div>
                </div>
                <div className="studio-linha">
                  <div className="studio-celula studio-celula-rotulo">linguagens</div>
                  <div className="studio-celula">
                    {item.linguagens.length ? (
                      item.linguagens.join(" · ")
                    ) : (
                      <span data-nao-sustenta>não classificado no vocabulário controlado</span>
                    )}
                  </div>
                </div>
                <div className="studio-linha">
                  <div className="studio-celula studio-celula-rotulo">território</div>
                  <div className="studio-celula">
                    {item.territorio ?? (
                      <span data-nao-sustenta>o acervo não situa este item</span>
                    )}
                  </div>
                </div>
              </div>

              {/* ---- D-82: o score, e a regra que o produziu, lado a lado ---- */}
              {item.score !== null && item.componentes ? (
                <div className="moderacao-bloco-score">
                  <div className="studio-painel-cabeca">
                    <span className="studio-painel-nome">Score de confiança</span>
                    {/* SEM `data-score-ia` aqui. O atributo é de LINHA da fila, e
                        repeti-lo no painel faria a contagem no HTML exportado sair 21
                        quando os itens de IA são 20 — um gate de contagem quebraria por
                        causa do painel, não do dado. O número aparece em texto, que é o
                        que o produto precisa. */}
                    <span className="studio-pastilha studio-pastilha-marca">
                      <span className="studio-pastilha-numero">
                        {comoScore(item.score)}
                      </span>
                      de 1,00
                    </span>
                  </div>
                  <ComponentesDoScore
                    componentes={componentesDoScore}
                    atendidos={item.componentes}
                  />
                  {/* A regra fica na tela junto do número: score sem regra é o
                      recomendador opaco. */}
                  <p className="studio-nota moderacao-regra-score">{regraDoScore}</p>
                </div>
              ) : (
                <p className="studio-nota moderacao-sem-score-explicado">
                  Este item não tem score porque a origem dele não estima: {""}
                  {origens.find((o) => o.id === item.origem)?.rotulo} afirma. Pontuar as três
                  origens achataria a distinção que esta tela existe para fazer.
                </p>
              )}

              {/* ---- 120: a denúncia, com o que se confere e para onde vai ---- */}
              {item.denuncia ? (
                <div className="moderacao-denuncia" data-denuncia={item.denuncia.motivo}>
                  <span className="studio-nao-sustenta-rotulo">
                    denúncia do público · {item.denuncia.rotulo}
                  </span>
                  <p className="studio-nota">
                    <strong>
                      {comSeparador(item.denuncia.quantas)} {""}
                      {item.denuncia.quantas === 1 ? "pessoa denunciou" : "pessoas denunciaram"}
                    </strong>{" "}
                    este item pelo mesmo motivo. Ele <strong>já está publicado</strong> — o
                    que se decide aqui não é se entra, é se a afirmação de quem denunciou
                    procede.
                  </p>
                  {(() => {
                    const m = motivosDeDenuncia.find((x) => x.id === item.denuncia?.motivo);
                    return m ? (
                      <div className="studio-tabela">
                        <div className="studio-linha">
                          <div className="studio-celula studio-celula-rotulo">
                            o que se confere
                          </div>
                          <div className="studio-celula">{m.confere}</div>
                        </div>
                        <div className="studio-linha">
                          <div className="studio-celula studio-celula-rotulo">
                            se procede, vai para
                          </div>
                          {/* «Procede» não é o fim do caminho, é o começo do
                              encaminhamento. Uma fila que confirma a denúncia e não diz
                              para onde ela vai dá razão a quem reclamou e não conserta
                              nada — e quem denunciou continua vendo o mesmo item no ar. */}
                          <div className="studio-celula">{m.encaminha}</div>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              ) : null}

              {/* ---- D-86: a sugestão da IA, com a aresta que a produziu ---- */}
              {item.sugestao ? (
                <div className="moderacao-sugestao">
                  <span className="studio-rotulo">por que a IA sugeriu isto</span>
                  <p className="selo-motivo">
                    <span>{item.sugestao.motivo}</span>
                  </p>
                  <p className="studio-nota">
                    Travessia do acervo a partir de «{item.sugestao.deTitulo}», pela relação
                    «{item.sugestao.relacao}». A frase acima é a da própria ligação, com
                    procedência {item.sugestao.procedenciaAresta} — a IA não a escreveu.
                  </p>
                </div>
              ) : null}

              {/* A PORTA PARA A FICHA. A fila resolve o que é evidente; quando não é, a
                  conferência campo a campo é outra tela — e o link leva o item aberto no
                  endereço, para quem copiar o link chegar no mesmo registro. */}
              <div className="moderacao-ficha-atalhos">
                <Link
                  className="studio-botao"
                  data-abrir-ficha={item.id}
                  href={`/moderacao/item/?item=${encodeURIComponent(item.id)}`}
                >
                  conferir campo a campo →
                </Link>
                <span className="studio-rotulo">
                  a ficha traz a chave de identidade, os direitos de imagem e o que impede a
                  publicação
                </span>
              </div>

              {/* ---- D-83: as quatro ações ---- */}
              <div className="studio-acoes moderacao-acoes">
                {acoes.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    data-acao-moderacao={a.id}
                    className={
                      a.id === "aprovar" ? "studio-botao studio-botao-primario" : "studio-botao"
                    }
                    onClick={() => executar(a.id)}
                  >
                    {a.rotulo}
                    {a.motivo === "obrigatorio" ? " · exige motivo" : null}
                  </button>
                ))}
              </div>

              {/* ================================================================ */}
              {/* O VETO — a única ação que não conclui sem motivo escrito (D-83)   */}
              {/* ================================================================ */}
              {vetando ? (
                <form
                  className="moderacao-veto"
                  onSubmit={(e) => {
                    e.preventDefault();
                    registrarVeto();
                  }}
                >
                  <span className="studio-nao-sustenta-rotulo">
                    vetar «{item.titulo}» — motivo obrigatório
                  </span>
                  <label htmlFor="motivo-veto" className="studio-rotulo">
                    por que este item não entra
                  </label>
                  <textarea
                    id="motivo-veto"
                    data-motivo-veto
                    className="moderacao-textarea"
                    rows={3}
                    autoFocus
                    value={motivoVeto}
                    placeholder="Escreva o motivo. Sem ele o veto não conclui."
                    onChange={(e) => setMotivoVeto(e.target.value)}
                  />
                  <p className="studio-nota">{acaoDoVeto?.nota}</p>
                  <div className="studio-acoes">
                    <button
                      type="submit"
                      className="studio-botao studio-botao-primario"
                      // As DUAS travas lêem a MESMA expressão. Um espelho de estado
                      // separado poderia dizer «liberado» com o botão travado, e o gate
                      // passaria sobre uma tela que não faz o que o atributo afirma.
                      disabled={!motivoAparado}
                      data-veto-bloqueado={motivoAparado ? "nao" : "sim"}
                    >
                      Confirmar veto
                    </button>
                    <button
                      type="button"
                      className="studio-botao"
                      onClick={() => {
                        setVetando(false);
                        setMotivoVeto("");
                      }}
                    >
                      Cancelar
                    </button>
                    {!motivoAparado ? (
                      <span className="moderacao-aviso-veto">
                        O botão está desabilitado porque o motivo está vazio. Espaço em
                        branco não conta.
                      </span>
                    ) : null}
                  </div>
                </form>
              ) : null}
              <p className="studio-nota">{fraseDaAssimetria}</p>

              {/* ---- O comentário OPCIONAL de devolver, rotulado como opcional ---- */}
              <div className="moderacao-campo">
                <label htmlFor="comentario-devolucao" className="studio-rotulo">
                  comentário para quem submeteu — opcional
                </label>
                <textarea
                  id="comentario-devolucao"
                  className="moderacao-textarea"
                  rows={2}
                  value={comentarioDevolucao}
                  placeholder="Opcional. «Devolver» conclui com ou sem este texto."
                  onChange={(e) => setComentarioDevolucao(e.target.value)}
                />
                <p className="studio-nota">{acaoDeDevolver?.nota}</p>
              </div>

            </section>
          ) : (
            <section className="web-painel">
              <p className="studio-nota">
                Nada pendente neste escopo. As decisões tomadas continuam listadas abaixo,
                com autor e carimbo.
              </p>
            </section>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* D-84 — o registro: quem decidiu, quando, e o motivo quando houve  */}
          {/* ---------------------------------------------------------------- */}
          <section className="web-painel moderacao-registro">
            <div className="studio-painel-cabeca">
              <span className="studio-painel-nome">Decisões desta sessão</span>
              <span className="studio-pastilha">
                <span className="studio-pastilha-numero">{decisoes.length}</span>
                registrada(s)
              </span>
            </div>

            {decisoes.length ? (
              <ul className="moderacao-decisoes">
                {decisoes.map((d) => (
                  <li
                    key={d.itemId}
                    className="moderacao-decisao"
                    data-decisao-moderacao={d.itemId}
                    data-acao-registrada={d.acao}
                  >
                    <span className="moderacao-decisao-cabeca">
                      <strong>{ROTULO_DA_ACAO[d.acao]}</strong>
                      <SeloOrigem origem={d.origem} />
                    </span>
                    <span className="moderacao-decisao-titulo">{d.itemTitulo}</span>
                    {d.motivo ? (
                      <span className="moderacao-decisao-motivo">
                        <span className="studio-rotulo">
                          {d.acao === "vetar" ? "motivo do veto" : "comentário"}
                        </span>
                        {d.motivo}
                      </span>
                    ) : null}
                    <span className="moderacao-decisao-assinatura" data-carimbo={d.quando} data-autor={d.autor}>
                      {d.autor} · {d.quando}
                    </span>
                    <button
                      type="button"
                      className="studio-botao moderacao-desfazer"
                      onClick={() => desfazer(d.itemId)}
                    >
                      desfazer
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="studio-nota">
                Nenhuma decisão ainda. Nada nesta fila avança sozinho: sem alguém apertar um
                botão, o registro fica vazio — e é isso que a tela mostra ao abrir.
              </p>
            )}

            <div className="studio-nao-sustenta" data-nao-sustenta>
              <span className="studio-nao-sustenta-rotulo">sobre a autoria da decisão</span>
              <p>{moderadorEhAutorado}</p>
              {/* O navegador pode recusar guardar — janela privada, cota, site bloqueado.
                  Seguir aceitando decisões sem avisar faria quem opera descobrir só ao
                  recarregar, com tudo já perdido. */}
              {falhaDoArmazem ? (
                <p data-falha-armazem>{falhaDoArmazem}</p>
              ) : null}
              <p>
                As decisões ficam no navegador de quem opera, sob a chave{" "}
                <code className="studio-literal">{CHAVE_DO_ARMAZEM}</code>:{" "}
                <strong>recarregar a página preserva</strong>. Elas não vão para servidor
                nenhum — este protótipo não tem back-end, e o que ele demonstra é o registro
                da decisão, com autor e carimbo, não a infraestrutura que a guardaria.
              </p>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* Reiniciar a demonstração — a mesma tela é aberta em sequência */}
            {/* ------------------------------------------------------------ */}
            <div className="moderacao-reinicio">
              {confirmandoReinicio ? (
                <>
                  {/* Apagar decisão é destrutivo e não tem desfazer, então tem passo de
                      confirmação. Não é a mesma trava do veto: aqui a confirmação protege
                      o trabalho já feito, lá ela obriga a explicar. */}
                  <p className="studio-nota">
                    Isto apaga {comSeparador(decisoes.length)} {""}
                    {decisoes.length === 1 ? "decisão registrada" : "decisões registradas"} e
                    devolve a fila ao estado de abertura. Não há como desfazer.
                  </p>
                  <div className="studio-acoes">
                    <button
                      type="button"
                      className="studio-botao studio-botao-primario"
                      data-reiniciar-confirmado
                      onClick={reiniciar}
                    >
                      Apagar e reiniciar
                    </button>
                    <button
                      type="button"
                      className="studio-botao"
                      onClick={() => setConfirmandoReinicio(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  className="studio-botao"
                  data-reiniciar-demonstracao
                  disabled={decisoes.length === 0}
                  onClick={() => setConfirmandoReinicio(true)}
                >
                  Reiniciar a demonstração
                </button>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* A distribuição de score — o recorte E a população, nunca só o corte */}
      {/* ------------------------------------------------------------------ */}
      <section className="web-painel moderacao-distribuicao">
        <div className="studio-painel-cabeca">
          <span className="studio-painel-nome">A faixa de confiança, contada</span>
          <span className="studio-pastilha">
            <span className="studio-pastilha-numero">{numeros.itensComScore}</span>
            itens de IA na fila
          </span>
        </div>
        <div className="web-denominadores">
          {distribuicao.map((f) => (
            <span key={f.score} className="web-denominador" data-denominador={`score-${f.score}`}>
              <span className="web-denominador-numero">{f.naFila}</span>
              <span className="web-denominador-rotulo">
                score {comoScore(f.score)} · {comSeparador(f.naPopulacao)} na população
              </span>
            </span>
          ))}
        </div>
        <p className="studio-nota">{porQueRodizio}</p>
        {/* A REGRA DO SCORE APARECE DUAS VEZES, e é deliberado. Junto do número, no
            painel do item, porque é ali que alguém decide se acredita nele; e aqui,
            porque o painel do item só mostra score quando o item é de IA — e a regra
            precisa estar na tela mesmo quando o item aberto é de produtor. Score sem
            regra à vista é o recomendador opaco que esta tela existe para recusar. */}
        <p className="studio-nota moderacao-regra-score">{regraDoScore}</p>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* D-90 — o que o acervo não sustenta nesta tela                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="web-painel">
        <div className="studio-painel-cabeca">
          <span className="studio-painel-nome">O que o acervo não sustenta aqui</span>
        </div>
        {declaracoes.map((d) => (
          <div key={d.campo} className="studio-nao-sustenta" data-nao-sustenta>
            <span className="studio-nao-sustenta-rotulo">{d.campo}</span>
            <p>{d.texto}</p>
          </div>
        ))}
      </section>

      {/* ================================================================== */}
      {/* D-86 — OS TRÊS LIMITES. É produto: a resposta ao RFP, não uma nota */}
      {/* sobre o protótipo.                                                  */}
      {/* ================================================================== */}
      <footer className="moderacao-limites" data-limites-ia>
        <span className="studio-nao-sustenta-rotulo">onde a IA não é utilizada</span>
        <ul>
          {limites.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </footer>
    </div>
  );
}
