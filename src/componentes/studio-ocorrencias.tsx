"use client";

import { useCallback, useMemo, useState } from "react";
import { useSessao } from "@/contexto/sessao";
import { PERSONAS, personaPorId } from "@/dados/personas";
import type {
  DeclaracaoHonesta,
  EntradaDeHistorico,
  EventoDoStudio,
  NumerosDoAcervo,
  ParDoStudio,
} from "@/dados/ocorrencias-studio";

/**
 * studio-ocorrencias.tsx, Studio, gestão de ocorrências (`docs/telas.md` tela 32, STUD-02).
 * **A outra metade do Cenário 4**, o lado de quem CAUSA a mudança.
 *
 * A AFIRMAÇÃO QUE ESTA TELA EXISTE PARA TORNAR VISÍVEL (D-73). Alterar uma sessão não
 * invalida o evento. O evento fica no topo, imutável, sem um único controle que o alcance; as
 * sessões ficam abaixo, editáveis uma a uma. Confirmar uma alteração muda UMA linha e deixa a
 * ficha do topo e as outras 52 sessões byte a byte iguais, e isso não é cuidado de
 * implementação, é consequência de Evento, Temporada e Ocorrência serem registros próprios
 * (DADO-02). Num modelo de catálogo, com as datas aninhadas dentro do evento, mudar um
 * horário reescreveria o evento e o aviso só poderia ser do evento inteiro.
 *
 * O NÚMERO QUE FECHA O CENÁRIO (D-74). Antes de confirmar, a tela diz quantas pessoas salvaram
 * AQUELA sessão e serão avisadas. Ele é um CONJUNTO DE PESSOAS, nunca uma soma: as personas do
 * protótipo entram pelo que `personas.json` semeou, e a persona ativa entra também pelo que
 * está em `agenda-cultural:salvos` neste navegador, porque é ali que o app grava o que ela
 * salvou. Quem aparecer pelos dois caminhos conta uma vez. A origem de cada pessoa contada vai
 * junto, em `data-impacto-fonte`: um número sem procedência, numa tela cuja tese É a
 * procedência do dado, seria a contradição mais cara da fase.
 *
 * T-04-13. O id que vem de `localStorage` é editável por quem avalia. Ele é RESOLVIDO contra o
 * índice de sessões do build antes de contar, id desconhecido não incrementa o número, é
 * descartado e a quantidade de descartes aparece na tela.
 *
 * DP-F: tudo que vem de `@/dados/ocorrencias-studio` entra como `import type`. O módulo
 * alcança `grafo.ts`, e uma importação de valor arrastaria 23 MB de JSON para o navegador.
 * `@/dados/personas` entra como VALOR porque são 3,4 KB de configuração, e é assim que o
 * provedor de sessão já o importa.
 *
 * D-67: esta superfície só existe na visão web. Na visão app o layout de bastidor mostra o
 * aviso de superfície de desktop, este componente não precisa saber disso, e não sabe.
 *
 * T-03-10: nenhuma leitura de relógio. O carimbo de tempo vem do build, em `carimbo`.
 */

// ---------------------------------------------------------------------------
// Helpers de string, sem `Date`, sem locale
// ---------------------------------------------------------------------------

/** "2026-08-22T12:00" → "22.08.2026". A conversão acontece na SAÍDA; comparar `DD.MM.AAAA`
 * com ISO como string é comparação quebrada, e a ordenação abaixo usa o ISO. */
function dataCurta(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}.${mes}.${ano}` : iso;
}

/**
 * A chave de uma ocorrência dentro do índice semeado.
 *
 * A MESMA regra do servidor, dirigida pelo `prefixo` que veio JUNTO com o DTO,
 * `chaveDeOcorrencia` não pode ser importada aqui porque o módulo dela arrasta `grafo.ts`
 * para o cliente (DP-F). É o mesmo arranjo que `salvos.tsx` já usa, de propósito: uma segunda
 * regra de chave é como o salvo some de uma tela e aparece na outra.
 */
function chaveDa(id: string, prefixo: string): string {
  return prefixo && id.startsWith(prefixo) ? id.slice(prefixo.length) : id;
}

function comSeparador(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function plural(n: number, um: string, muitos: string): string {
  return n === 1 ? um : muitos;
}

// ---------------------------------------------------------------------------
// Tipos locais
// ---------------------------------------------------------------------------

/**
 * A string compacta de um evento de volta em sessões.
 *
 * A regra de recomposição é a MESMA do servidor, dirigida pelos dois prefixos que vieram no
 * DTO: `PREFIXO_DA_OCORRENCIA` e o `prefixoLocal` do evento. Escrever aqui uma segunda regra
 * de id, «o id é `ocorrencia:derivado:` mais o sufixo», seria a mesma armadilha da chave de
 * ocorrência: funciona até o dia em que um dos dois lados muda.
 */
function decodificar(
  evento: EventoDoStudio,
  prefixo: string,
): Array<{ id: string; inicio: string; gratuito: boolean }> {
  if (!evento.sessoes) return [];
  return evento.sessoes.split(";").map((bruto) => {
    const [resto = "", inicio = "", grat = "0"] = bruto.split("|");
    return {
      id: prefixo + evento.prefixoLocal + resto,
      inicio,
      gratuito: grat === "1",
    };
  });
}

interface Linha {
  id: string;
  ordem: number;
  inicio: string;
  dataCurta: string;
  /** A hora VIGENTE, a do acervo, ou a que uma confirmação desta sessão substituiu. */
  hora: string;
  /** A hora original, quando esta linha foi alterada nesta sessão de trabalho. */
  horaOriginal: string | null;
  gratuito: boolean;
}

interface PessoaAvisada {
  nome: string;
  origens: string[];
}

// ---------------------------------------------------------------------------
// A ficha imutável do evento, T-04-15
// ---------------------------------------------------------------------------

/**
 * O evento, no topo, SEM CAMINHO DE ESCRITA.
 *
 * Não existe aqui nem um `input`, nem um `button` que altere campo do evento, e essa
 * ausência é o conteúdo do bloco, não um esquecimento. A palavra «imutável» está dita e
 * explicada porque a tela inteira é a demonstração dela.
 */
function FichaDoEvento({ evento }: { evento: EventoDoStudio }) {
  return (
    <section className="studio-painel oco-ficha" data-evento-imutavel={evento.id}>
      <div className="studio-painel-cabeca">
        <span className="oco-selo-imutavel">imutável nesta tela</span>
        <span className="studio-rotulo">{evento.procedencia}</span>
        <span className="studio-pastilha">
          <span className="studio-pastilha-numero">{comSeparador(evento.totalDeSessoes)}</span>
          {plural(evento.totalDeSessoes, "sessão", "sessões")}
        </span>
        <span className="studio-pastilha">
          <span className="studio-pastilha-numero">{evento.temporadas}</span>
          {plural(evento.temporadas, "temporada", "temporadas")}
        </span>
      </div>

      <h2 className="oco-ficha-titulo">{evento.titulo}</h2>

      <p className="oco-ficha-imutavel">
        Os campos deste bloco <strong>não são editáveis aqui</strong>, e não porque a tela
        ainda não os implementou: alterar uma sessão não altera o evento. Evento, Temporada e
        Ocorrência são registros próprios, e é essa separação que dá ao aviso alguém a quem
        ser endereçado, quem salvou uma sessão, e não quem se interessou pelo evento.
      </p>

      <dl className="oco-ficha-campos">
        <div className="oco-ficha-campo">
          <dt className="studio-rotulo">período declarado</dt>
          <dd>{evento.periodo}</dd>
        </div>
        <div className="oco-ficha-campo">
          <dt className="studio-rotulo">identificador</dt>
          <dd>
            <code className="studio-literal">{evento.id}</code>
          </dd>
        </div>
        <div className="oco-ficha-campo">
          <dt className="studio-rotulo">linguagens</dt>
          <dd>
            {evento.linguagens.length ? (
              evento.linguagens.join(" · ")
            ) : (
              <span className="oco-ausente">o acervo não declara linguagem neste evento</span>
            )}
          </dd>
        </div>
        <div className="oco-ficha-campo">
          <dt className="studio-rotulo">procedência</dt>
          <dd>
            {evento.procedencia}
            {evento.fonte ? (
              <>
                {" · "}
                <span className="studio-literal oco-fonte">{evento.fonte}</span>
              </>
            ) : (
              <span className="oco-ausente"> · sem fonte declarada</span>
            )}
          </dd>
        </div>
        <div className="oco-ficha-campo oco-ficha-campo-largo">
          <dt className="studio-rotulo">resumo</dt>
          <dd>
            {evento.resumo || (
              <span className="oco-ausente">o acervo não declara resumo neste evento</span>
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}

// ---------------------------------------------------------------------------
// A prévia de impacto, D-74
// ---------------------------------------------------------------------------

function PreviaDeImpacto({
  pessoas,
  fonte,
  totalDePersonas,
  outrasSessoes,
  salvaramOutras,
  naoAlcancados,
  descartados,
}: {
  pessoas: PessoaAvisada[];
  fonte: string;
  totalDePersonas: number;
  outrasSessoes: number;
  /** Quantas pessoas salvaram alguma das OUTRAS sessões deste evento. */
  salvaramOutras: number;
  /** Dentre elas, quantas esta alteração não avisa. */
  naoAlcancados: number;
  descartados: number;
}) {
  return (
    <div className="oco-impacto">
      <div className="oco-impacto-numeros">
        <span className="oco-impacto-pastilha" data-impacto={pessoas.length}>
          <strong className="oco-impacto-numero">{pessoas.length}</strong>
          <span>
            de {totalDePersonas} {plural(totalDePersonas, "pessoa", "pessoas")}{" "}
            {plural(pessoas.length, "será avisada", "serão avisadas")}
          </span>
        </span>
        <span className="oco-impacto-contraste">
          as outras <strong>{comSeparador(outrasSessoes)}</strong>{" "}
          {plural(outrasSessoes, "sessão deste evento não é tocada", "sessões deste evento não são tocadas")}
          {salvaramOutras === 0 ? (
            <>, e ninguém salvou nenhuma delas, então não há mais ninguém a avisar</>
          ) : naoAlcancados > 0 ? (
            <>
              {" "}, e {naoAlcancados}{" "}
              {plural(naoAlcancados, "pessoa que salvou", "pessoas que salvaram")} uma delas{" "}
              {plural(naoAlcancados, "não recebe", "não recebem")} nada
            </>
          ) : (
            <>
              {" "}, {salvaramOutras}{" "}
              {plural(salvaramOutras, "pessoa salvou", "pessoas salvaram")} alguma delas, e{" "}
              {plural(salvaramOutras, "ela já está", "elas já estão")} na conta acima por ter
              salvo também esta sessão
            </>
          )}
        </span>
      </div>

      <p className="oco-impacto-fonte" data-impacto-fonte>
        {fonte}
      </p>

      {descartados > 0 ? (
        <p className="oco-impacto-descarte">
          {descartados} {plural(descartados, "id salvo neste navegador não foi reconhecido", "ids salvos neste navegador não foram reconhecidos")}{" "}
          contra o índice de sessões do build e {plural(descartados, "ficou", "ficaram")} de fora
          da conta. O número não cresce com id que o acervo não tem.
        </p>
      ) : null}

      {pessoas.length ? (
        <ul className="oco-impacto-lista">
          {pessoas.map((p) => (
            <li key={p.nome} className="oco-impacto-pessoa">
              <strong>{p.nome}</strong>
              <span>{p.origens.join(" · ")}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// A tela
// ---------------------------------------------------------------------------

export function StudioOcorrencias({
  eventos,
  eventoPadrao,
  prefixo,
  semeados,
  historicoAutorado,
  propostas,
  par,
  numeros,
  declaracoes,
  operador,
  operadorFrase,
  carimbo,
  fraseDeD73,
  fraseDasDuasMetades,
}: {
  /** Os 129 eventos com sessão, com as sessões já achatadas em tupla de primitivo. */
  eventos: EventoDoStudio[];
  eventoPadrao: string;
  /** O prefixo comum dos ids de ocorrência. Viaja uma vez. */
  prefixo: string;
  /** Chave da ocorrência → nomes das personas que a têm no repertório semeado. */
  semeados: Record<string, string[]>;
  /** As duas alterações de `alerta.ts`, as MESMAS que `/salvos` exibe. */
  historicoAutorado: EntradaDeHistorico[];
  /** Ocorrência → horário que o formulário propõe, vindo de `alerta.ts`. */
  propostas: Record<string, string>;
  par: ParDoStudio;
  numeros: NumerosDoAcervo;
  declaracoes: DeclaracaoHonesta[];
  operador: string;
  operadorFrase: string;
  /** O carimbo de tempo, derivado da data de referência do build (T-03-10). */
  carimbo: string;
  fraseDeD73: string;
  fraseDasDuasMetades: string;
}) {
  const { salvos, alternarSalvo, personaId, hidratado } = useSessao();

  const [eventoId, setEventoId] = useState(eventoPadrao);
  const [editando, setEditando] = useState<string | null>(null);
  const [horaProposta, setHoraProposta] = useState("");
  /** As alterações confirmadas NESTA sessão de trabalho. Chave: id da ocorrência. */
  const [aplicadas, setAplicadas] = useState<Record<string, { de: string; para: string }>>({});
  const [registradas, setRegistradas] = useState<EntradaDeHistorico[]>([]);

  const evento = useMemo(
    () => eventos.find((e) => e.id === eventoId) ?? eventos[0],
    [eventos, eventoId],
  );

  /**
   * T-04-13. Todos os ids de sessão que o build conhece, as 2.425 dos 129 eventos.
   * É contra este conjunto que um id vindo de `localStorage` é resolvido antes de contar.
   */
  const idsConhecidos = useMemo(() => {
    const set = new Set<string>();
    for (const e of eventos) for (const s of decodificar(e, prefixo)) set.add(s.id);
    return set;
  }, [eventos, prefixo]);

  const salvosResolvidos = useMemo(() => {
    const set = new Set<string>();
    let descartados = 0;
    for (const id of salvos) {
      if (idsConhecidos.has(id)) set.add(id);
      // Trilha marcada na fase 2 vive na mesma lista e não é sessão: ela não é «descarte»,
      // é outro tipo de coisa, e contá-la como id inválido acusaria um defeito que não há.
      else if (!id.startsWith("trilha:")) descartados += 1;
    }
    return { set, descartados };
  }, [salvos, idsConhecidos]);

  const personaAtiva = useMemo(() => personaPorId(personaId) ?? PERSONAS[0], [personaId]);

  const linhas = useMemo<Linha[]>(
    () =>
      (evento ? decodificar(evento, prefixo) : []).map((s, i) => {
        const aplicada = aplicadas[s.id];
        return {
          id: s.id,
          ordem: i + 1,
          inicio: s.inicio,
          dataCurta: dataCurta(s.inicio),
          hora: aplicada ? aplicada.para : s.inicio.slice(11, 16),
          horaOriginal: aplicada ? aplicada.de : null,
          gratuito: s.gratuito,
        };
      }),
    [evento, prefixo, aplicadas],
  );

  /**
   * D-74, a regra inteira num lugar só.
   *
   * CONJUNTO DE PESSOAS, e nunca soma. Quem aparece pelo repertório semeado E pelo storage
   * deste navegador conta UMA vez, com as duas origens declaradas ao lado do nome.
   */
  const pessoasQueSalvaram = useCallback(
    (ocorrenciaId: string): PessoaAvisada[] => {
      const mapa = new Map<string, PessoaAvisada>();

      const juntar = (nome: string, origem: string) => {
        const atual = mapa.get(nome);
        if (atual) {
          if (!atual.origens.includes(origem)) atual.origens.push(origem);
          return;
        }
        mapa.set(nome, { nome, origens: [origem] });
      };

      for (const nome of semeados[chaveDa(ocorrenciaId, prefixo)] ?? []) {
        juntar(nome, "repertório semeado em personas.json");
      }

      if (salvosResolvidos.set.has(ocorrenciaId) && personaAtiva) {
        juntar(personaAtiva.nome, "agenda-cultural:salvos deste navegador (persona ativa)");
      }

      return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome));
    },
    [semeados, prefixo, salvosResolvidos, personaAtiva],
  );

  const linhaEditada = useMemo(
    () => linhas.find((l) => l.id === editando) ?? null,
    [linhas, editando],
  );

  const avisados = useMemo(
    () => (linhaEditada ? pessoasQueSalvaram(linhaEditada.id) : []),
    [linhaEditada, pessoasQueSalvaram],
  );

  /**
   * O contraste, e ele precisa distinguir três situações que um número só achataria.
   *
   * `salvaramOutras` é quem salvou ALGUMA das outras sessões deste evento; `naoAlcancados` é
   * quem, dentre eles, esta alteração não avisa. Os dois podem divergir: se a mesma pessoa
   * salvou esta sessão E uma irmã, ela é avisada por esta e continua sem ser avisada sobre a
   * irmã, que não mudou. Dizer «e quem salvou uma delas não recebe nada» quando ninguém
   * salvou nenhuma seria afirmar que existe alguém que não existe, numa tela cuja tese é a
   * procedência do número.
   */
  const contraste = useMemo(() => {
    if (!linhaEditada) return { salvaramOutras: 0, naoAlcancados: 0 };
    const nesta = new Set(avisados.map((p) => p.nome));
    const outras = new Set<string>();
    let naoAlcancados = 0;
    for (const l of linhas) {
      if (l.id === linhaEditada.id) continue;
      for (const p of pessoasQueSalvaram(l.id)) outras.add(p.nome);
    }
    for (const nome of outras) if (!nesta.has(nome)) naoAlcancados += 1;
    return { salvaramOutras: outras.size, naoAlcancados };
  }, [linhaEditada, linhas, avisados, pessoasQueSalvaram]);

  const fonteDoImpacto = useMemo(() => {
    if (!linhaEditada) return "";
    if (!avisados.length) {
      return (
        `Ninguém salvou esta sessão. Nenhuma das ${numeros.personas} personas do protótipo a ` +
        `tem no repertório semeado em personas.json, e agenda-cultural:salvos deste navegador ` +
        `não a contém. O número é 0 porque o estado salvo é 0, salve esta sessão e ele passa ` +
        `a 1 sem que nada mais mude na tela.`
      );
    }
    return (
      `${avisados.length} de ${numeros.personas} ${plural(numeros.personas, "pessoa", "pessoas")}. ` +
      avisados.map((p) => `${p.nome}, ${p.origens.join(" e ")}`).join("; ") +
      `. O conjunto é de pessoas, não de salvamentos: quem aparece pelos dois caminhos conta uma vez.`
    );
  }, [linhaEditada, avisados, numeros.personas]);

  const historico = useMemo(() => {
    const doEvento = historicoAutorado.filter((h) => h.eventoId === eventoId);
    const minhas = registradas.filter((h) => h.eventoId === eventoId);
    return [...doEvento, ...minhas];
  }, [historicoAutorado, registradas, eventoId]);

  // -------------------------------------------------------------------------
  // Ações
  // -------------------------------------------------------------------------

  const abrirEdicao = useCallback(
    (linha: Linha) => {
      setEditando(linha.id);
      // O formulário abre com a mudança do roteiro já preenchida quando a sessão é a do
      // Cenário 4: o `para` vem de `alerta.ts`, então confirmar aqui produz EXATAMENTE a
      // alteração que /salvos exibe do outro lado, e não uma parecida.
      setHoraProposta(propostas[linha.id] ?? linha.hora);
    },
    [propostas],
  );

  const cancelar = useCallback(() => {
    setEditando(null);
    setHoraProposta("");
  }, []);

  /**
   * Confirmar, e NADA acontece antes deste clique.
   *
   * A alteração é aplicada à linha editada e a nenhuma outra: o estado é indexado pelo id da
   * OCORRÊNCIA, então não existe caminho pelo qual ela alcance uma sessão irmã. A ficha do
   * evento não é tocada porque nenhuma escrita aqui a alcança (T-04-15).
   */
  const confirmar = useCallback(() => {
    if (!linhaEditada || !evento) return;
    const de = linhaEditada.hora;
    const para = horaProposta;
    if (!para || para === de) return;

    setAplicadas((atual) => ({
      ...atual,
      [linhaEditada.id]: { de: linhaEditada.horaOriginal ?? de, para },
    }));

    setRegistradas((atual) => [
      ...atual,
      {
        ocorrenciaId: linhaEditada.id,
        eventoId: evento.id,
        eventoTitulo: evento.titulo,
        campo: "horario",
        campoRotulo: "horário alterado",
        de,
        para,
        dataDaSessao: linhaEditada.dataCurta,
        quem: operador,
        quando: carimbo,
        origem: "operador",
        frase: null,
        rotaDoOutroLado: "/salvos/",
      },
    ]);

    setEditando(null);
    setHoraProposta("");
  }, [linhaEditada, evento, horaProposta, operador, carimbo]);

  /**
   * A semeadura do Cenário 4, para o roteiro não morrer na logística.
   *
   * Salva as DUAS sessões do par com os mesmos ids que `/salvos` semeia, vindos do DTO. Sem
   * ela, quem apresenta teria de sair daqui, achar o evento certo entre 300 e as duas sessões
   * certas entre 53, e voltar. `alternarSalvo` ALTERNA, então salvar o que já está salvo
   * removeria, daí a conferência antes de cada chamada.
   */
  const semear = useCallback(() => {
    for (const id of [par.atingida.id, par.intacta.id]) {
      if (!salvos.includes(id)) alternarSalvo(id);
    }
  }, [par, salvos, alternarSalvo]);

  const parSemeado =
    salvos.includes(par.atingida.id) && salvos.includes(par.intacta.id);

  const opcoes = useMemo(
    () => [...eventos].sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR")),
    [eventos],
  );

  if (!evento) return null;

  const semMudanca = !horaProposta || horaProposta === linhaEditada?.hora;

  return (
    <div className="studio oco">
      {/* ------------------------------------------------------------------ */}
      {/* O cabeçalho da superfície                                           */}
      {/* ------------------------------------------------------------------ */}
      <header className="studio-cabecalho">
        <span className="studio-superficie">Studio · gestão de ocorrências</span>
        <h1 className="studio-titulo">Sessões de um evento</h1>
        <p className="studio-objetivo">
          O evento fica no topo, imutável. As sessões dele ficam abaixo, editáveis uma a uma.
          Antes de confirmar qualquer alteração, a tela diz quantas pessoas salvaram aquela
          sessão e serão avisadas, e quantas não serão.
        </p>
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="studio-pastilha studio-pastilha-marca">
            <span className="studio-pastilha-numero">{comSeparador(numeros.eventosComSessao)}</span>
            eventos com sessão
          </span>
          <span className="studio-pastilha">
            <span className="studio-pastilha-numero">{comSeparador(numeros.ocorrencias)}</span>
            sessões no acervo
          </span>
          <span className="studio-pastilha">
            <span className="studio-pastilha-numero">{comSeparador(numeros.ocorrenciasComEspaco)}</span>
            delas declaram espaço
          </span>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* O seletor, trocar de evento NÃO navega                             */}
      {/* ------------------------------------------------------------------ */}
      <section className="oco-seletor">
        <label className="oco-seletor-rotulo" htmlFor="oco-evento">
          evento em operação
        </label>
        <select
          id="oco-evento"
          className="oco-seletor-campo"
          value={eventoId}
          onChange={(e) => {
            setEventoId(e.target.value);
            // Trocar de evento fecha a edição: uma linha em edição de OUTRO evento seria um
            // formulário apontando para uma sessão que não está mais na tabela.
            setEditando(null);
            setHoraProposta("");
          }}
        >
          {opcoes.map((e) => (
            <option key={e.id} value={e.id}>
              {e.titulo}, {e.totalDeSessoes} {plural(e.totalDeSessoes, "sessão", "sessões")}
            </option>
          ))}
        </select>
        <span className="oco-seletor-nota">
          Trocar de evento não muda a URL: a tabela é remontada aqui mesmo, e quem opera não
          perde o lugar. Os {comSeparador(numeros.eventosComSessao)} eventos da lista são os que
          têm sessão.
        </span>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* D-73, a ficha imutável                                             */}
      {/* ------------------------------------------------------------------ */}
      <FichaDoEvento evento={evento} />

      {/* ------------------------------------------------------------------ */}
      {/* A semeadura do Cenário 4                                            */}
      {/* ------------------------------------------------------------------ */}
      <section className="oco-semeadura">
        <div className="oco-semeadura-texto">
          <strong className="oco-semeadura-titulo">cenário 4, sem sair da tela</strong>
          <p>
            O botão salva neste navegador as duas sessões do par,{" "}
            {par.atingida.dataCurta} às {par.atingida.hora} e {par.intacta.dataCurta} às{" "}
            {par.intacta.hora}, do mesmo evento,, que são exatamente os mesmos ids que a tela
            de Salvos semeia. Com elas salvas, a prévia de impacto desta sessão sai de 0 e vai
            a 1: o número acompanha o estado, em vez de estar pintado na tela.
          </p>
        </div>
        <button
          type="button"
          className="studio-botao"
          data-semear-cenario-4-studio
          onClick={semear}
          disabled={!hidratado || parSemeado}
        >
          {parSemeado ? "Par do cenário 4 já salvo" : "Salvar o par do cenário 4"}
        </button>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* A tabela de sessões                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="studio-painel oco-painel-tabela">
        <div className="studio-painel-cabeca">
          <span className="studio-painel-nome">Sessões</span>
          <span className="studio-pastilha">
            <span className="studio-pastilha-numero">{comSeparador(linhas.length)}</span>
            {plural(linhas.length, "linha", "linhas")}
          </span>
          <span className="studio-rotulo">uma linha por ocorrência · derivado</span>
        </div>

        <div className="oco-tabela">
          <div className="oco-linha oco-linha-cabecalho">
            <span>#</span>
            <span>data</span>
            <span>hora</span>
            <span>entrada</span>
            <span>espaço</span>
            <span>alterar</span>
          </div>

          <ul className="oco-corpo">
            {linhas.map((linha) => {
              const emEdicao = editando === linha.id;
              return (
                <li
                  key={linha.id}
                  className="oco-item"
                  data-ocorrencia={linha.id}
                  {...(emEdicao ? { "data-editando": linha.id } : {})}
                >
                  <div className="oco-linha">
                    <span className="oco-celula-ordem">{linha.ordem}</span>
                    <span>{linha.dataCurta}</span>
                    <span className="oco-celula-hora">
                      <strong>{linha.hora}</strong>
                      {linha.horaOriginal ? (
                        <span className="oco-marca-alterada">era {linha.horaOriginal}</span>
                      ) : null}
                    </span>
                    <span className="oco-celula-entrada">
                      {linha.gratuito ? "entrada franca declarada" : "ingresso declarado"}
                    </span>
                    <span className="oco-ausente">não declarado</span>
                    <span className="oco-celula-acao">
                      {emEdicao ? (
                        <span className="studio-rotulo">em edição</span>
                      ) : (
                        <button
                          type="button"
                          className="oco-botao-editar"
                          onClick={() => abrirEdicao(linha)}
                        >
                          alterar horário
                        </button>
                      )}
                    </span>
                  </div>

                  {emEdicao ? (
                    <div className="oco-edicao">
                      <div className="oco-edicao-campos">
                        <span className="studio-rotulo">
                          {linha.dataCurta}, a data fica; remarcar de dia é outra operação
                        </span>
                        <label className="oco-edicao-campo">
                          <span className="studio-rotulo">novo horário</span>
                          <input
                            type="time"
                            className="oco-edicao-hora"
                            value={horaProposta}
                            onChange={(e) => setHoraProposta(e.target.value)}
                          />
                        </label>
                        <span className="oco-edicao-de-para">
                          {linha.hora} <span aria-hidden="true">→</span> {horaProposta || "—"}
                        </span>
                      </div>

                      <PreviaDeImpacto
                        pessoas={avisados}
                        fonte={fonteDoImpacto}
                        totalDePersonas={numeros.personas}
                        outrasSessoes={linhas.length - 1}
                        salvaramOutras={contraste.salvaramOutras}
                        naoAlcancados={contraste.naoAlcancados}
                        descartados={salvosResolvidos.descartados}
                      />

                      <div className="studio-acoes">
                        <button
                          type="button"
                          className="studio-botao studio-botao-primario"
                          data-confirmar
                          onClick={confirmar}
                          disabled={semMudanca}
                        >
                          Confirmar alteração
                        </button>
                        <button
                          type="button"
                          className="studio-botao"
                          data-cancelar
                          onClick={cancelar}
                        >
                          Cancelar
                        </button>
                        <span className="oco-acoes-nota">
                          {semMudanca
                            ? "escolha um horário diferente do atual, confirmar sem mudança não registraria nada"
                            : "nada foi alterado ainda: nem a linha, nem o histórico, até o clique em confirmar"}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>

        <p className="oco-nota-d73">{fraseDeD73}</p>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* D-75, quem alterou, quando, e o histórico                          */}
      {/* ------------------------------------------------------------------ */}
      <section className="studio-painel oco-historico" data-historico={historico.length}>
        <div className="studio-painel-cabeca">
          <span className="studio-painel-nome">Histórico de alterações</span>
          <span className="studio-pastilha studio-pastilha-marca">
            <span className="studio-pastilha-numero">{historico.length}</span>
            {plural(historico.length, "entrada", "entradas")}
          </span>
          <span className="studio-rotulo">deste evento</span>
        </div>

        <p className="oco-historico-amarra">{fraseDasDuasMetades}</p>

        {historico.length ? (
          <ol className="oco-historico-lista">
            {historico.map((h, i) => (
              <li
                key={`${h.ocorrenciaId}-${h.origem}-${i}`}
                className="oco-historico-item"
                data-historico-item={h.ocorrenciaId}
              >
                <div className="oco-historico-cabeca">
                  <span className="oco-historico-selo" data-origem-alteracao={h.origem}>
                    {h.origem === "autorado" ? "autorado" : "alterado agora, neste navegador"}
                  </span>
                  <span className="studio-rotulo">{h.campoRotulo}</span>
                  <span className="oco-historico-quando">{h.quando}</span>
                </div>
                <p className="oco-historico-mudanca">
                  Sessão de <strong>{h.dataDaSessao}</strong>: {h.de}{" "}
                  <span aria-hidden="true">→</span> <strong>{h.para}</strong>
                </p>
                <p className="oco-historico-quem">
                  <span className="studio-rotulo">quem alterou</span> {h.quem}
                </p>
                <code className="studio-literal">{h.ocorrenciaId}</code>
                {h.origem === "autorado" ? (
                  <p className="oco-historico-frase">
                    {h.frase} Esta é a MESMA alteração que a tela de Salvos exibe em{" "}
                    <span className="studio-literal">{h.rotaDoOutroLado}</span>, do lado de quem
                    recebe o aviso.
                  </p>
                ) : (
                  <p className="oco-historico-frase">
                    Registrada nesta sessão de trabalho e mantida em memória do navegador: o
                    protótipo é estático e não escreve em servidor nenhum. O que a tela prova é
                    que a alteração fica com autor, valor de antes, valor de depois e carimbo,
                    e é exatamente esse registro que hoje não existe em lugar nenhum.
                  </p>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="studio-nota">
            Nenhuma alteração registrada neste evento. As duas alterações autoradas do protótipo
            caem em {par.eventoTitulo} e no evento do cancelamento, selecione um deles para vê-las.
          </p>
        )}

        <p className="oco-operador">
          <span className="studio-rotulo">quem opera</span> {operador} · {operadorFrase}
        </p>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* O que o acervo NÃO sustenta, produto, e não comentário             */}
      {/* ------------------------------------------------------------------ */}
      <section className="studio-painel oco-honesto">
        <div className="studio-painel-cabeca">
          <span className="studio-painel-nome">O que o acervo não sustenta</span>
        </div>

        <ul className="oco-honesto-lista">
          {declaracoes.map((d) => (
            <li key={d.chave} className="studio-nao-sustenta" data-nao-sustenta={d.chave}>
              <span className="studio-nao-sustenta-rotulo">{d.rotulo}</span>
              <p>{d.texto}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
