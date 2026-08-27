"use client";

/**
 * studio-org-estado.ts, o estado do nível 6 · Organização, no navegador.
 *
 * POR QUE ELE NÃO É `useStudio()`. A loja da S7 existe e o padrão dela é reusado aqui
 * linha a linha, loja de módulo, `useSyncExternalStore`, hidratação dentro de
 * `useEffect`, validação estreita do que veio do armazenamento. O que NÃO dá para reusar é
 * a instância: `useStudio()` guarda `RascunhoDoProdutor` sob a chave `studio.v1`, e a
 * Organização escreve outras entidades, espaço, instituição, mídia, colaborador, edital,
 * lote. Duas sessões gravando sob a mesma chave apagariam o trabalho uma da outra no
 * primeiro salvamento, e o defeito só apareceria com as duas telas abertas.
 *
 * MÓDULO DE CLIENTE, E POR ISSO SEM IMPORT DE DADO POR VALOR (DP-F). O catálogo e a data
 * chegam por PARÂMETRO, vindos do componente de servidor que os leu no build.
 *
 * `localStorage` SÓ DEPOIS DE MONTAR. O estado nasce `null` e só vira objeto quando
 * `hidratar` roda dentro de um `useEffect`. Ler o armazenamento durante o render faria o
 * HTML exportado e a página hidratada divergirem, e o conteúdo divergente seria o
 * trabalho de quem está cadastrando.
 *
 * SEM RELÓGIO. O carimbo é a data de referência do build, que chega junto com o contexto.
 */

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  acessibilidadeDeEspacoVazia,
  direitoVazio,
  fichaTecnicaVazia,
} from "@/dados/tipos-organizacao";
import type {
  AcessibilidadeDeEspaco,
  Alcada,
  CadastroDeEspaco,
  CadastroDeInstituicao,
  CadastroDeMidia,
  Colaborador,
  DireitoDeDistribuicao,
  EntradaDeEquipe,
  CadastroDeFormacao,
  EdicaoDePrograma,
  ChaveDeIntegracao,
  Edital,
  EstadoDoEdital,
  InscricaoNoEdital,
  Lote,
  FichaTecnicaDeMidia,
  MaterialDidatico,
  Programa,
  VisitaEducativa,
} from "@/dados/tipos-organizacao";

/**
 * A chave versionada da Organização, irmã de `studio.v1` e separada dela de propósito.
 *
 * Versionada porque a forma do cadastro vai crescer a cada tela desta sessão, e um estado
 * antigo lido com forma nova quebraria a demonstração em silêncio no navegador de quem já
 * tinha aberto a página, que é pior do que quebrar alto, porque ninguém veria.
 */
export const CHAVE_DA_ORGANIZACAO = "studio.org.v1";

const VERSAO = 1;

interface EstadoPersistido {
  versao: number;
  /** Os cadastros por id de espaço. Mapa e não lista: a tela pergunta «este espaço já foi
   *  cadastrado?» a cada linha das 113, e uma busca linear por linha seria O(n²) à toa. */
  cadastros: Record<string, CadastroDeEspaco>;
  /** Qual espaço a ficha da direita está mostrando. Mora aqui e não na URL porque trocar
   *  de espaço não é navegar: a lista inteira fica montada, e uma rota por espaço geraria
   *  113 páginas. */
  atualId: string | null;
  /**
   * As fichas institucionais, por id, a O1.
   *
   * ENTROU POR EXTENSÃO ADITIVA, e a versão NÃO subiu junto: quem já tinha estado gravado
   * pela tela de espaços continua com o cadastro dele, e o campo novo nasce vazio. Subir a
   * versão aqui apagaria o trabalho de quem estava no meio da demonstração para acrescentar
   * um campo que ninguém tinha preenchido ainda, o custo seria real e o ganho, nenhum.
   * A versão sobe quando a forma de um campo EXISTENTE mudar, que é quando ler o antigo com
   * o código novo quebra de verdade.
   */
  instituicoes: Record<string, CadastroDeInstituicao>;
  atualInstituicaoId: string | null;
  /** A equipe e o histórico dela, a O7. Também aditivo, também sem subir a versão. */
  equipe: Colaborador[];
  historicoDaEquipe: EntradaDeEquipe[];
  /** O acervo de ativos, a O5. Aditivo, como os anteriores. */
  midias: Record<string, CadastroDeMidia>;
  atualMidiaId: string | null;
  /** Os programas criados na demonstração, a O3. Lista e não mapa: eles NASCEM aqui, e
   *  não existe id de acervo para servir de chave. */
  programas: Programa[];
  atualProgramaId: string | null;
  /** A O4: o que a organização acrescenta às 54 formações, e a agenda de visitas. */
  formacoes: Record<string, CadastroDeFormacao>;
  atualFormacaoId: string | null;
  visitas: VisitaEducativa[];
  /** Os editais, a O6. Lista, como os programas: eles NASCEM aqui, porque a classe não
   *  existe no acervo. */
  editais: Edital[];
  atualEditalId: string | null;
  /** A O8: o histórico de importações e as chaves que o Admin emitiu. */
  lotes: Lote[];
  chaves: ChaveDeIntegracao[];
}

export interface ContextoDaOrganizacao {
  dataDeReferencia: string;
  autor: string;
  organizacao: string;
}

// ---------------------------------------------------------------------------
// A loja, módulo, e não `useState` por tela
// ---------------------------------------------------------------------------

let estado: EstadoPersistido | null = null;
let contexto: ContextoDaOrganizacao = { dataDeReferencia: "", autor: "", organizacao: "" };
/**
 * O que o servidor semeia, e que a loja não sabe produzir sozinha.
 *
 * Chega por PARÂMETRO e não por import porque este é módulo de cliente: a data de
 * referência, o autor e a equipe autorada são lidos no build (DP-F).
 */
export interface SementeDaOrganizacao {
  espacoId?: string | null;
  instituicaoId?: string | null;
  equipe?: Colaborador[];
  midiaId?: string | null;
  formacaoId?: string | null;
  /** As chaves que o Admin emitiu. Chegam prontas: a O8 não tem como criar uma. */
  chaves?: ChaveDeIntegracao[];
}

let primeiroId: string | null = null;
let primeiraInstituicaoId: string | null = null;
let equipeSemeada: Colaborador[] = [];
let primeiraMidiaId: string | null = null;
let primeiraFormacaoId: string | null = null;
let chavesSemeadas: ChaveDeIntegracao[] = [];

const ouvintes = new Set<() => void>();

function avisar() {
  for (const o of ouvintes) o();
}

function assinar(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

function lerLoja(): EstadoPersistido | null {
  return estado;
}

/** O que o servidor «vê». Sempre `null`: no build não existe armazenamento, e devolver
 *  qualquer outra coisa faria o HTML exportado afirmar um estado que o navegador pode
 *  contradizer um quadro depois. */
function lerNoServidor(): EstadoPersistido | null {
  return null;
}

// ---------------------------------------------------------------------------
// Leitura e escrita do armazenamento
// ---------------------------------------------------------------------------

function pareceAcessibilidade(v: unknown): v is AcessibilidadeDeEspaco {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.declarada === "boolean" &&
    typeof o.dimensoes === "object" &&
    o.dimensoes !== null &&
    typeof o.fisicos === "object" &&
    o.fisicos !== null
  );
}

/**
 * O que veio do `localStorage` tem a forma que este código espera?
 *
 * É ENTRADA EXTERNA: foi escrito por uma versão anterior desta página, ou por qualquer
 * coisa com acesso ao mesmo domínio. Objeto com forma errada aceito aqui viraria
 * `undefined.dimensoes` duas telas adiante, longe da causa. O projeto não tem zod entre as
 * dependências e acrescentá-la é mudança fora desta sessão, então a checagem é manual e
 * ESTREITA de propósito: confere o que a tela realmente lê, e descarta o resto.
 */
function pareceEstado(v: unknown): v is EstadoPersistido {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  if (o.versao !== VERSAO) return false;
  if (o.atualId !== null && typeof o.atualId !== "string") return false;
  if (typeof o.cadastros !== "object" || o.cadastros === null) return false;
  // `instituicoes` é o campo aditivo: ausente é legítimo, é o estado que a tela de espaços
  // gravou antes de a O1 existir,, mas presente com forma errada não é.
  if (o.instituicoes !== undefined && (typeof o.instituicoes !== "object" || o.instituicoes === null)) {
    return false;
  }
  if (o.equipe !== undefined && !Array.isArray(o.equipe)) return false;
  if (o.midias !== undefined && (typeof o.midias !== "object" || o.midias === null)) return false;
  if (o.programas !== undefined && !Array.isArray(o.programas)) return false;
  if (o.formacoes !== undefined && (typeof o.formacoes !== "object" || o.formacoes === null)) return false;
  if (o.visitas !== undefined && !Array.isArray(o.visitas)) return false;
  if (o.editais !== undefined && !Array.isArray(o.editais)) return false;
  if (o.lotes !== undefined && !Array.isArray(o.lotes)) return false;
  if (o.chaves !== undefined && !Array.isArray(o.chaves)) return false;
  if (o.historicoDaEquipe !== undefined && !Array.isArray(o.historicoDaEquipe)) return false;
  return Object.values(o.cadastros as Record<string, unknown>).every((c) => {
    if (typeof c !== "object" || c === null) return false;
    const x = c as Record<string, unknown>;
    return (
      typeof x.espacoId === "string" &&
      typeof x.endereco === "string" &&
      typeof x.bairro === "string" &&
      (x.capacidade === null || typeof x.capacidade === "number") &&
      typeof x.autor === "string" &&
      typeof x.quando === "string" &&
      pareceAcessibilidade(x.acessibilidade)
    );
  });
}

function doZero(): EstadoPersistido {
  return {
    versao: VERSAO,
    cadastros: {},
    atualId: primeiroId,
    instituicoes: {},
    atualInstituicaoId: primeiraInstituicaoId,
    equipe: equipeSemeada.map((c) => ({ ...c })),
    historicoDaEquipe: [],
    midias: {},
    atualMidiaId: primeiraMidiaId,
    programas: [],
    atualProgramaId: null,
    formacoes: {},
    atualFormacaoId: primeiraFormacaoId,
    visitas: [],
    editais: [],
    atualEditalId: null,
    lotes: [],
    chaves: chavesSemeadas.map((c) => ({ ...c })),
  };
}

function gravar(proximo: EstadoPersistido) {
  estado = proximo;
  try {
    window.localStorage.setItem(CHAVE_DA_ORGANIZACAO, JSON.stringify(proximo));
  } catch (erro) {
    // Não engolir: em janela anônima ou com cota estourada a gravação falha, e a tela
    // continua funcionando NA SESSÃO, o que se perde é o «recarregar preserva». Quem
    // depura precisa ver isso; quem apresenta não pode ser interrompido por um alerta.
    console.error("Organização: não foi possível gravar o cadastro.", erro);
  }
  avisar();
}

/**
 * Lê o armazenamento e liga a loja. Idempotente: chamar de novo não relê nem sobrescreve
 *, as dez telas montam o mesmo gancho, e a segunda não pode desfazer o que a primeira leu.
 */
function hidratar(contextoNovo: ContextoDaOrganizacao, semente: SementeDaOrganizacao) {
  contexto = contextoNovo;
  if (semente.espacoId != null) primeiroId = semente.espacoId;
  if (semente.instituicaoId != null) primeiraInstituicaoId = semente.instituicaoId;
  if (semente.equipe && semente.equipe.length > 0) equipeSemeada = semente.equipe;
  if (semente.midiaId != null) primeiraMidiaId = semente.midiaId;
  if (semente.formacaoId != null) primeiraFormacaoId = semente.formacaoId;
  if (semente.chaves && semente.chaves.length > 0) chavesSemeadas = semente.chaves;
  if (estado !== null) return;

  let cru: string | null = null;
  try {
    cru = window.localStorage.getItem(CHAVE_DA_ORGANIZACAO);
  } catch (erro) {
    console.error("Organização: não foi possível ler o cadastro.", erro);
  }

  if (cru === null) {
    gravar(doZero());
    return;
  }

  let lido: unknown = null;
  try {
    lido = JSON.parse(cru);
  } catch (erro) {
    console.warn("Organização: estado ilegível no armazenamento; recomeçando do zero.", erro);
  }

  if (!pareceEstado(lido)) {
    // Versão antiga ou conteúdo estranho: recomeça, e DIZ que recomeçou. Migrar em
    // silêncio faria a demonstração perder trabalho sem ninguém entender por quê.
    console.warn("Organização: estado com forma inesperada; a demonstração recomeçou do zero.");
    gravar(doZero());
    return;
  }

  // Normaliza o campo aditivo: estado gravado antes da O1 não tem `instituicoes`, e o resto
  // do código não deve ter que perguntar se ele existe a cada leitura.
  estado = {
    ...lido,
    instituicoes: lido.instituicoes ?? {},
    atualInstituicaoId: lido.atualInstituicaoId ?? primeiraInstituicaoId,
    equipe: lido.equipe?.length ? lido.equipe : equipeSemeada.map((c) => ({ ...c })),
    historicoDaEquipe: lido.historicoDaEquipe ?? [],
    midias: lido.midias ?? {},
    atualMidiaId: lido.atualMidiaId ?? primeiraMidiaId,
    programas: lido.programas ?? [],
    atualProgramaId: lido.atualProgramaId ?? null,
    formacoes: lido.formacoes ?? {},
    atualFormacaoId: lido.atualFormacaoId ?? primeiraFormacaoId,
    visitas: lido.visitas ?? [],
    editais: lido.editais ?? [],
    atualEditalId: lido.atualEditalId ?? null,
    lotes: lido.lotes ?? [],
    chaves: lido.chaves?.length ? lido.chaves : chavesSemeadas.map((c) => ({ ...c })),
  };
  avisar();
}

// ---------------------------------------------------------------------------
// Operações
// ---------------------------------------------------------------------------

/** O cadastro que ainda não existe, já com autor e carimbo. Nunca anônimo, nunca sem
 *  data: §3 da ontologia proíbe escrita sem autor, e o carimbo vem do servidor. */
function cadastroVazio(espacoId: string): CadastroDeEspaco {
  return {
    espacoId,
    endereco: "",
    bairro: "",
    capacidade: null,
    acessibilidade: acessibilidadeDeEspacoVazia(),
    autor: contexto.autor,
    quando: contexto.dataDeReferencia,
  };
}

function comCadastro(
  espacoId: string,
  transformar: (c: CadastroDeEspaco) => CadastroDeEspaco,
) {
  if (estado === null) return;
  const atual = estado.cadastros[espacoId] ?? cadastroVazio(espacoId);
  // O carimbo é reescrito a cada alteração, e é isso que se quer: ele registra a ÚLTIMA
  // escrita, não a primeira. Com data única no build os dois valores coincidem hoje; a
  // regra é que vale quando houver relógio de verdade.
  const proximo = { ...transformar(atual), autor: contexto.autor, quando: contexto.dataDeReferencia };
  gravar({ ...estado, cadastros: { ...estado.cadastros, [espacoId]: proximo } });
}

/** A ficha institucional que ainda não existe, já com autor, carimbo e o estado em que as
 *  246 do acervo estão hoje: não verificada. */
function fichaVazia(instituicaoId: string): CadastroDeInstituicao {
  return {
    instituicaoId,
    contato: "",
    endereco: "",
    creditoImagem: "",
    acessibilidade: acessibilidadeDeEspacoVazia(),
    verificacao: "nao-verificada",
    autor: contexto.autor,
    quando: contexto.dataDeReferencia,
  };
}

function comFicha(
  instituicaoId: string,
  transformar: (c: CadastroDeInstituicao) => CadastroDeInstituicao,
) {
  if (estado === null) return;
  const atual = estado.instituicoes[instituicaoId] ?? fichaVazia(instituicaoId);
  const proximo = {
    ...transformar(atual),
    autor: contexto.autor,
    quando: contexto.dataDeReferencia,
  };
  gravar({ ...estado, instituicoes: { ...estado.instituicoes, [instituicaoId]: proximo } });
}

/**
 * Aplica uma mudança na equipe E registra a linha de histórico no MESMO passo.
 *
 * As duas coisas juntas, e não em dois métodos, porque separá-las tornaria possível mudar
 * alçada sem deixar rastro, e §3 da ontologia proíbe escrita sem autor. Uma concessão que
 * não aparece no histórico não é registro, é rumor.
 */
function comEquipe(
  transformar: (equipe: Colaborador[]) => Colaborador[],
  texto: string,
) {
  if (estado === null) return;
  gravar({
    ...estado,
    equipe: transformar(estado.equipe),
    historicoDaEquipe: [
      { quando: contexto.dataDeReferencia, autor: contexto.autor, texto },
      ...estado.historicoDaEquipe,
    ],
  });
}

/** O próximo id, determinístico: o maior sufixo numérico usado, mais um. Nada de sorteio,
 *  dois navegadores rodando a mesma demonstração produzem a mesma sequência. */
function proximoIdDeColaborador(equipe: Colaborador[]): string {
  let maior = 0;
  for (const c of equipe) {
    const n = Number(c.id.replace(/^colab-/, ""));
    if (Number.isFinite(n) && n > maior) maior = n;
  }
  return `colab-${maior + 1}`;
}

/** O cadastro de mídia que ainda não existe. As três formas novas nascem VAZIAS e não
 *  «permitindo»: um direito em branco não é permissão, é silêncio. */
function midiaVazia(midiaId: string): CadastroDeMidia {
  return {
    midiaId,
    creditoImagem: "",
    fichaTecnica: fichaTecnicaVazia(),
    direito: direitoVazio(),
    acessibilidade: acessibilidadeDeEspacoVazia(),
    autor: contexto.autor,
    quando: contexto.dataDeReferencia,
  };
}

function comMidia(midiaId: string, transformar: (c: CadastroDeMidia) => CadastroDeMidia) {
  if (estado === null) return;
  const atual = estado.midias[midiaId] ?? midiaVazia(midiaId);
  const proximo = {
    ...transformar(atual),
    autor: contexto.autor,
    quando: contexto.dataDeReferencia,
  };
  gravar({ ...estado, midias: { ...estado.midias, [midiaId]: proximo } });
}

function comPrograma(id: string, transformar: (p: Programa) => Programa) {
  if (estado === null) return;
  gravar({
    ...estado,
    programas: estado.programas.map((p) =>
      p.id === id
        ? { ...transformar(p), autor: contexto.autor, quando: contexto.dataDeReferencia }
        : p,
    ),
  });
}

function formacaoVazia(formacaoId: string): CadastroDeFormacao {
  return {
    formacaoId,
    inscricaoAberta: false,
    vagas: null,
    materiais: [],
    autor: contexto.autor,
    quando: contexto.dataDeReferencia,
  };
}

function comFormacao(
  formacaoId: string,
  transformar: (c: CadastroDeFormacao) => CadastroDeFormacao,
) {
  if (estado === null) return;
  const atual = estado.formacoes[formacaoId] ?? formacaoVazia(formacaoId);
  const proximo = {
    ...transformar(atual),
    autor: contexto.autor,
    quando: contexto.dataDeReferencia,
  };
  gravar({ ...estado, formacoes: { ...estado.formacoes, [formacaoId]: proximo } });
}

function comEdital(id: string, transformar: (e: Edital) => Edital) {
  if (estado === null) return;
  gravar({
    ...estado,
    editais: estado.editais.map((e) =>
      e.id === id
        ? { ...transformar(e), autor: contexto.autor, quando: contexto.dataDeReferencia }
        : e,
    ),
  });
}

// ---------------------------------------------------------------------------
// O gancho
// ---------------------------------------------------------------------------

export interface Organizacao {
  /** `false` até o armazenamento ter sido lido. A tela mostra carregamento, e não um
   *  estado vazio que troca um quadro depois. */
  pronto: boolean;
  cadastros: Record<string, CadastroDeEspaco>;
  atualId: string | null;
  contexto: ContextoDaOrganizacao;
  escolher: (espacoId: string) => void;
  /** Altera o cadastro de um espaço. Cria em branco se ainda não existir. */
  alterar: (espacoId: string, mudanca: Partial<Omit<CadastroDeEspaco, "espacoId">>) => void;
  /** O ATO: declara que o espaço não oferece nenhum dos recursos. Zera as treze caixas e
   *  marca `declarada`, as duas coisas juntas, porque «declarei que não tem» com uma
   *  caixa marcada seria uma contradição gravada. */
  declararSemRecursos: (espacoId: string) => void;
  /** O outro lado do ato: marcar qualquer recurso também declara a ficha, porque quem
   *  marca preencheu. */
  alterarAcessibilidade: (espacoId: string, ficha: AcessibilidadeDeEspaco) => void;
  /** Devolve a demonstração ao estado inicial. Uma apresentação roda duas vezes. */
  reiniciar: () => void;

  // --- O1 · a ficha institucional -----------------------------------------
  instituicoes: Record<string, CadastroDeInstituicao>;
  atualInstituicaoId: string | null;
  escolherInstituicao: (id: string) => void;
  alterarInstituicao: (
    id: string,
    mudanca: Partial<Omit<CadastroDeInstituicao, "instituicaoId">>,
  ) => void;
  declararInstituicaoSemRecursos: (id: string) => void;
  alterarAcessibilidadeDaInstituicao: (id: string, ficha: AcessibilidadeDeEspaco) => void;
  /** Encaminha a verificação ao Admin (92). A Organização NÃO se verifica, este método
   *  não sabe escrever `"verificada"`, e essa impossibilidade é o ponto. */
  solicitarVerificacao: (id: string) => void;

  // --- O7 · equipe e alçadas ----------------------------------------------
  equipe: Colaborador[];
  historicoDaEquipe: EntradaDeEquipe[];
  convidar: (nome: string, email: string, alcadas: Alcada[]) => void;
  aceitarConvite: (id: string) => void;
  remover: (id: string) => void;
  alterarAlcadas: (id: string, alcadas: Alcada[]) => void;
  /** Sucessão de titularidade (140). Nunca por abandono: ela move o título de um para
   *  outro num passo só, e grava autor e carimbo. */
  transferirTitularidade: (paraId: string) => void;

  // --- O5 · mídia ----------------------------------------------------------
  midias: Record<string, CadastroDeMidia>;
  atualMidiaId: string | null;
  escolherMidia: (id: string) => void;
  creditar: (id: string, credito: string) => void;
  alterarFichaTecnica: (id: string, ficha: FichaTecnicaDeMidia) => void;
  alterarDireito: (id: string, direito: DireitoDeDistribuicao) => void;
  /** O ato do direito, irmão do ato da acessibilidade: declara que NÃO permite, em vez de
   *  deixar dois booleanos em `false` significando duas coisas ao mesmo tempo. */
  declararSemDireito: (id: string) => void;
  alterarAcessibilidadeDaMidia: (id: string, ficha: AcessibilidadeDeEspaco) => void;

  // --- O3 · programa -------------------------------------------------------
  programas: Programa[];
  atualProgramaId: string | null;
  escolherPrograma: (id: string) => void;
  criarPrograma: (titulo: string) => void;
  alterarPrograma: (id: string, mudanca: Partial<Omit<Programa, "id">>) => void;
  /** Liga ou desliga um evento REAL do acervo do guarda-chuva autorado. */
  alternarEvento: (id: string, eventoId: string) => void;
  acrescentarEdicao: (id: string, edicao: EdicaoDePrograma) => void;
  removerEdicao: (id: string, indice: number) => void;

  // --- O4 · formação, biblioteca e visita educativa ------------------------
  formacoes: Record<string, CadastroDeFormacao>;
  atualFormacaoId: string | null;
  visitas: VisitaEducativa[];
  escolherFormacao: (id: string) => void;
  alterarFormacao: (id: string, mudanca: Partial<Omit<CadastroDeFormacao, "formacaoId">>) => void;
  acrescentarMaterial: (id: string, material: MaterialDidatico) => void;
  removerMaterial: (id: string, indice: number) => void;
  solicitarVisita: (visita: Omit<VisitaEducativa, "id" | "estado" | "autor" | "quando">) => void;
  /** Responder é DECIDIR, e a decisão carimba. Confirmar não confere teto aqui: quem
   *  confere é a tela, que já mostra o motivo de não caber antes de deixar clicar. */
  responderVisita: (id: string, estado: "confirmada" | "recusada") => void;

  // --- O6 · editais --------------------------------------------------------
  editais: Edital[];
  atualEditalId: string | null;
  escolherEdital: (id: string) => void;
  criarEdital: (titulo: string) => void;
  alterarEdital: (id: string, mudanca: Partial<Omit<Edital, "id" | "inscricoes">>) => void;
  alternarCriterio: (id: string, eixo: "linguagens" | "territorios", valor: string) => void;
  /** A inscrição do funil da 49: quem se inscreve entra no grafo como agente proposto. */
  inscrever: (id: string, inscricao: Omit<InscricaoNoEdital, "id" | "autor" | "quando">) => void;
  mudarEstadoDoEdital: (id: string, estado: EstadoDoEdital) => void;

  // --- O8 · integração -----------------------------------------------------
  lotes: Lote[];
  chaves: ChaveDeIntegracao[];
  /** Guarda a prévia. Ela ainda não gravou nada: aplicar é outro ato. */
  registrarLote: (lote: Omit<Lote, "id" | "aplicadoEm" | "autor" | "quando">) => void;
  aplicarLote: (id: string) => void;
  /** Revogar é o ÚNICO verbo da organização sobre a chave. Não existe `emitirChave` neste
   *  módulo, e a ausência é a segregação. */
  revogarChave: (id: string) => void;
}

export function useOrganizacao(
  contextoDoServidor: ContextoDaOrganizacao,
  semente: SementeDaOrganizacao,
): Organizacao {
  useEffect(() => {
    hidratar(contextoDoServidor, semente);
  }, [contextoDoServidor, semente]);

  const atualEstado = useSyncExternalStore(assinar, lerLoja, lerNoServidor);

  const escolher = useCallback((espacoId: string) => {
    if (estado === null) return;
    gravar({ ...estado, atualId: espacoId });
  }, []);

  const alterar = useCallback(
    (espacoId: string, mudanca: Partial<Omit<CadastroDeEspaco, "espacoId">>) => {
      comCadastro(espacoId, (c) => ({ ...c, ...mudanca }));
    },
    [],
  );

  const declararSemRecursos = useCallback((espacoId: string) => {
    comCadastro(espacoId, (c) => ({
      ...c,
      acessibilidade: { ...acessibilidadeDeEspacoVazia(), declarada: true },
    }));
  }, []);

  const alterarAcessibilidade = useCallback(
    (espacoId: string, ficha: AcessibilidadeDeEspaco) => {
      comCadastro(espacoId, (c) => ({ ...c, acessibilidade: ficha }));
    },
    [],
  );

  const escolherInstituicao = useCallback((id: string) => {
    if (estado === null) return;
    gravar({ ...estado, atualInstituicaoId: id });
  }, []);

  const alterarInstituicao = useCallback(
    (id: string, mudanca: Partial<Omit<CadastroDeInstituicao, "instituicaoId">>) => {
      comFicha(id, (c) => ({ ...c, ...mudanca }));
    },
    [],
  );

  const declararInstituicaoSemRecursos = useCallback((id: string) => {
    comFicha(id, (c) => ({
      ...c,
      acessibilidade: { ...acessibilidadeDeEspacoVazia(), declarada: true },
    }));
  }, []);

  const alterarAcessibilidadeDaInstituicao = useCallback(
    (id: string, ficha: AcessibilidadeDeEspaco) => {
      comFicha(id, (c) => ({ ...c, acessibilidade: ficha }));
    },
    [],
  );

  const solicitarVerificacao = useCallback((id: string) => {
    comFicha(id, (c) => ({ ...c, verificacao: "solicitada" }));
  }, []);

  const convidar = useCallback((nome: string, email: string, alcadas: Alcada[]) => {
    if (estado === null) return;
    const id = proximoIdDeColaborador(estado.equipe);
    comEquipe(
      (equipe) => [
        ...equipe,
        {
          id,
          nome,
          email,
          alcadas,
          estado: "convidado",
          titular: false,
          autor: contexto.autor,
          quando: contexto.dataDeReferencia,
        },
      ],
      `convidou ${nome} (${email}) com ${alcadas.length} alçada(s)`,
    );
  }, []);

  const aceitarConvite = useCallback((id: string) => {
    if (estado === null) return;
    const alvo = estado.equipe.find((c) => c.id === id);
    comEquipe(
      (equipe) => equipe.map((c) => (c.id === id ? { ...c, estado: "ativo" as const } : c)),
      `${alvo?.nome ?? id} aceitou o convite`,
    );
  }, []);

  const remover = useCallback((id: string) => {
    if (estado === null) return;
    const alvo = estado.equipe.find((c) => c.id === id);
    // O titular não sai por aqui, e a checagem é no MÉTODO e não só no botão: um botão
    // desabilitado é sugestão; um método que recusa é regra.
    if (!alvo || alvo.titular) return;
    comEquipe(
      (equipe) => equipe.map((c) => (c.id === id ? { ...c, estado: "removido" as const, alcadas: [] } : c)),
      `removeu ${alvo.nome}; o que ela publicou continua publicado`,
    );
  }, []);

  const alterarAlcadas = useCallback((id: string, alcadas: Alcada[]) => {
    if (estado === null) return;
    const alvo = estado.equipe.find((c) => c.id === id);
    comEquipe(
      (equipe) => equipe.map((c) => (c.id === id ? { ...c, alcadas } : c)),
      `mudou as alçadas de ${alvo?.nome ?? id} para ${alcadas.length === 0 ? "nenhuma" : alcadas.join(", ")}`,
    );
  }, []);

  const transferirTitularidade = useCallback((paraId: string) => {
    if (estado === null) return;
    const de = estado.equipe.find((c) => c.titular);
    const para = estado.equipe.find((c) => c.id === paraId);
    if (!para || para.estado !== "ativo" || para.titular) return;
    comEquipe(
      (equipe) =>
        equipe.map((c) =>
          c.id === paraId
            ? // Quem recebe o título recebe junto a alçada de gerir a equipe: titular sem
              // ela seria dono que não pode conceder nada, e a organização travaria.
              { ...c, titular: true, alcadas: [...new Set([...c.alcadas, "gerir_equipe" as const])] }
            : { ...c, titular: false },
        ),
      `transferiu a titularidade de ${de?.nome ?? "—"} para ${para.nome}`,
    );
  }, []);

  const escolherMidia = useCallback((id: string) => {
    if (estado === null) return;
    gravar({ ...estado, atualMidiaId: id });
  }, []);

  const creditar = useCallback((id: string, credito: string) => {
    comMidia(id, (c) => ({ ...c, creditoImagem: credito }));
  }, []);

  const alterarFichaTecnica = useCallback((id: string, fichaTecnica: FichaTecnicaDeMidia) => {
    comMidia(id, (c) => ({ ...c, fichaTecnica }));
  }, []);

  const alterarDireito = useCallback((id: string, direito: DireitoDeDistribuicao) => {
    comMidia(id, (c) => ({ ...c, direito: { ...direito, declarado: true } }));
  }, []);

  const declararSemDireito = useCallback((id: string) => {
    comMidia(id, (c) => ({
      ...c,
      direito: { ...direitoVazio(), titular: c.direito.titular, declarado: true },
    }));
  }, []);

  const alterarAcessibilidadeDaMidia = useCallback(
    (id: string, acessibilidade: AcessibilidadeDeEspaco) => {
      comMidia(id, (c) => ({ ...c, acessibilidade }));
    },
    [],
  );

  const escolherPrograma = useCallback((id: string) => {
    if (estado === null) return;
    gravar({ ...estado, atualProgramaId: id });
  }, []);

  const criarPrograma = useCallback((titulo: string) => {
    if (estado === null) return;
    // Id determinístico pela posição, e não sorteado: dois navegadores rodando a mesma
    // demonstração produzem a mesma sequência, e o HTML exportado não diverge do hidratado.
    const id = `programa:autorado:${estado.programas.length + 1}`;
    gravar({
      ...estado,
      programas: [
        ...estado.programas,
        {
          id,
          titulo,
          resumo: "",
          edicoes: [],
          eventoIds: [],
          autor: contexto.autor,
          quando: contexto.dataDeReferencia,
        },
      ],
      atualProgramaId: id,
    });
  }, []);

  const alterarPrograma = useCallback((id: string, mudanca: Partial<Omit<Programa, "id">>) => {
    comPrograma(id, (p) => ({ ...p, ...mudanca }));
  }, []);

  const alternarEvento = useCallback((id: string, eventoId: string) => {
    comPrograma(id, (p) => ({
      ...p,
      eventoIds: p.eventoIds.includes(eventoId)
        ? p.eventoIds.filter((x) => x !== eventoId)
        : [...p.eventoIds, eventoId],
    }));
  }, []);

  const acrescentarEdicao = useCallback((id: string, edicao: EdicaoDePrograma) => {
    comPrograma(id, (p) => ({ ...p, edicoes: [...p.edicoes, edicao] }));
  }, []);

  const removerEdicao = useCallback((id: string, indice: number) => {
    comPrograma(id, (p) => ({ ...p, edicoes: p.edicoes.filter((_, i) => i !== indice) }));
  }, []);

  const escolherFormacao = useCallback((id: string) => {
    if (estado === null) return;
    gravar({ ...estado, atualFormacaoId: id });
  }, []);

  const alterarFormacao = useCallback(
    (id: string, mudanca: Partial<Omit<CadastroDeFormacao, "formacaoId">>) => {
      comFormacao(id, (c) => ({ ...c, ...mudanca }));
    },
    [],
  );

  const acrescentarMaterial = useCallback((id: string, material: MaterialDidatico) => {
    comFormacao(id, (c) => ({ ...c, materiais: [...c.materiais, material] }));
  }, []);

  const removerMaterial = useCallback((id: string, indice: number) => {
    comFormacao(id, (c) => ({ ...c, materiais: c.materiais.filter((_, i) => i !== indice) }));
  }, []);

  const solicitarVisita = useCallback(
    (visita: Omit<VisitaEducativa, "id" | "estado" | "autor" | "quando">) => {
      if (estado === null) return;
      gravar({
        ...estado,
        visitas: [
          ...estado.visitas,
          {
            ...visita,
            id: `visita-${estado.visitas.length + 1}`,
            estado: "solicitada",
            autor: contexto.autor,
            quando: contexto.dataDeReferencia,
          },
        ],
      });
    },
    [],
  );

  const responderVisita = useCallback((id: string, novoEstado: "confirmada" | "recusada") => {
    if (estado === null) return;
    gravar({
      ...estado,
      visitas: estado.visitas.map((v) =>
        v.id === id
          ? { ...v, estado: novoEstado, autor: contexto.autor, quando: contexto.dataDeReferencia }
          : v,
      ),
    });
  }, []);

  const escolherEdital = useCallback((id: string) => {
    if (estado === null) return;
    gravar({ ...estado, atualEditalId: id });
  }, []);

  const criarEdital = useCallback((titulo: string) => {
    if (estado === null) return;
    const id = `edital:autorado:${estado.editais.length + 1}`;
    gravar({
      ...estado,
      editais: [
        ...estado.editais,
        {
          id,
          titulo,
          resumo: "",
          prazo: "",
          estado: "aberto",
          linguagens: [],
          territorios: [],
          publicoAlvo: "",
          inscricoes: [],
          autor: contexto.autor,
          quando: contexto.dataDeReferencia,
        },
      ],
      atualEditalId: id,
    });
  }, []);

  const alterarEdital = useCallback(
    (id: string, mudanca: Partial<Omit<Edital, "id" | "inscricoes">>) => {
      comEdital(id, (e) => ({ ...e, ...mudanca }));
    },
    [],
  );

  const alternarCriterio = useCallback(
    (id: string, eixo: "linguagens" | "territorios", valor: string) => {
      comEdital(id, (e) => ({
        ...e,
        [eixo]: e[eixo].includes(valor)
          ? e[eixo].filter((x) => x !== valor)
          : [...e[eixo], valor],
      }));
    },
    [],
  );

  const inscrever = useCallback(
    (id: string, inscricao: Omit<InscricaoNoEdital, "id" | "autor" | "quando">) => {
      comEdital(id, (e) => ({
        ...e,
        inscricoes: [
          ...e.inscricoes,
          {
            ...inscricao,
            id: `${e.id}-inscricao-${e.inscricoes.length + 1}`,
            autor: contexto.autor,
            quando: contexto.dataDeReferencia,
          },
        ],
      }));
    },
    [],
  );

  const mudarEstadoDoEdital = useCallback((id: string, novoEstado: EstadoDoEdital) => {
    comEdital(id, (e) => ({ ...e, estado: novoEstado }));
  }, []);

  const registrarLote = useCallback(
    (lote: Omit<Lote, "id" | "aplicadoEm" | "autor" | "quando">) => {
      if (estado === null) return;
      gravar({
        ...estado,
        lotes: [
          {
            ...lote,
            id: `lote-${estado.lotes.length + 1}`,
            aplicadoEm: null,
            autor: contexto.autor,
            quando: contexto.dataDeReferencia,
          },
          ...estado.lotes,
        ],
      });
    },
    [],
  );

  const aplicarLote = useCallback((id: string) => {
    if (estado === null) return;
    gravar({
      ...estado,
      lotes: estado.lotes.map((l) =>
        l.id === id && l.aplicadoEm === null
          ? { ...l, aplicadoEm: contexto.dataDeReferencia, autor: contexto.autor }
          : l,
      ),
    });
  }, []);

  const revogarChave = useCallback((id: string) => {
    if (estado === null) return;
    gravar({
      ...estado,
      chaves: estado.chaves.map((c) => (c.id === id ? { ...c, revogada: true } : c)),
    });
  }, []);

  const reiniciar = useCallback(() => {
    try {
      window.localStorage.removeItem(CHAVE_DA_ORGANIZACAO);
    } catch (erro) {
      console.error("Organização: não foi possível limpar o cadastro.", erro);
    }
    gravar(doZero());
  }, []);

  return {
    pronto: atualEstado !== null,
    cadastros: atualEstado?.cadastros ?? {},
    atualId: atualEstado?.atualId ?? null,
    contexto: contextoDoServidor,
    escolher,
    alterar,
    declararSemRecursos,
    alterarAcessibilidade,
    reiniciar,
    instituicoes: atualEstado?.instituicoes ?? {},
    atualInstituicaoId: atualEstado?.atualInstituicaoId ?? null,
    escolherInstituicao,
    alterarInstituicao,
    declararInstituicaoSemRecursos,
    alterarAcessibilidadeDaInstituicao,
    solicitarVerificacao,
    equipe: atualEstado?.equipe ?? [],
    historicoDaEquipe: atualEstado?.historicoDaEquipe ?? [],
    convidar,
    aceitarConvite,
    remover,
    alterarAlcadas,
    transferirTitularidade,
    midias: atualEstado?.midias ?? {},
    atualMidiaId: atualEstado?.atualMidiaId ?? null,
    escolherMidia,
    creditar,
    alterarFichaTecnica,
    alterarDireito,
    declararSemDireito,
    alterarAcessibilidadeDaMidia,
    programas: atualEstado?.programas ?? [],
    atualProgramaId: atualEstado?.atualProgramaId ?? null,
    escolherPrograma,
    criarPrograma,
    alterarPrograma,
    alternarEvento,
    acrescentarEdicao,
    removerEdicao,
    formacoes: atualEstado?.formacoes ?? {},
    atualFormacaoId: atualEstado?.atualFormacaoId ?? null,
    visitas: atualEstado?.visitas ?? [],
    escolherFormacao,
    alterarFormacao,
    acrescentarMaterial,
    removerMaterial,
    solicitarVisita,
    responderVisita,
    editais: atualEstado?.editais ?? [],
    atualEditalId: atualEstado?.atualEditalId ?? null,
    escolherEdital,
    criarEdital,
    alterarEdital,
    alternarCriterio,
    inscrever,
    mudarEstadoDoEdital,
    lotes: atualEstado?.lotes ?? [],
    chaves: atualEstado?.chaves ?? [],
    registrarLote,
    aplicarLote,
    revogarChave,
  };
}
