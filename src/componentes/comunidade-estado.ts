"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import {
  COMUNIDADES_RESERVADAS,
  PREFIXO_DA_COMUNIDADE,
  PREFIXO_DA_PUBLICACAO,
  SLUGS_RESERVADOS,
  capaSemeada,
} from "@/dados/comunidade-capas";
import { COMUNIDADES, PRODUTOR_DA_CASA, minhasComunidades } from "@/dados/comunidade";
import { imagemVazia } from "@/dados/tipos-produtor";
import type { ImagemDeclarada } from "@/dados/tipos-produtor";
import type { ComunidadeDefinida } from "@/lib/pontos/tipos";

/**
 * comunidade-estado.ts — o que o Produtor mudou na comunidade da casa.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ARMAZÉM PRÓPRIO, PELA MESMA RAZÃO DE `perfil-estado.ts`: o sujeito é outro. O
 * `produtor.v1` é sobre os REGISTROS que se publica nas onze pautas; este é sobre a
 * identidade da comunidade e o que se posta nela. Misturar faria o reinício de um apagar
 * o outro sem que ninguém tivesse pedido.
 *
 * SOBREPOSIÇÃO, NUNCA SUBSTITUIÇÃO. Campo vazio quer dizer «vale o que a semente diz».
 * É o que permite trocar só o nome sem herdar a responsabilidade de redigitar a descrição,
 * e é o que faz uma mudança futura na semente ainda chegar a quem não a sobrescreveu.
 *
 * O TEXTO DA PUBLICAÇÃO MORA AQUI, e a publicação em si mora no motor. Parecem duas
 * verdades e não são: o motor guarda o que está no ar, e este armazém guarda o rascunho,
 * que é o que permite reabrir a folha e editar sem reler o estado do motor.
 *
 * SEM RELÓGIO E SEM SORTEIO. O carimbo é `dataDeReferencia`, entregue pelo servidor; o id
 * é o maior sufixo numérico mais um. É o que faz a captura de ontem bater com a de hoje.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const CHAVE_DA_COMUNIDADE = "produtor.comunidade.v1";
const VERSAO = 1;

// O prefixo e o teto vivem em `@/dados/comunidade-capas`, que não é módulo de cliente:
// o `generateStaticParams` da rota precisa deles no servidor. Ver a nota de lá.
export { PREFIXO_DA_PUBLICACAO, SLUGS_RESERVADOS, PREFIXO_DA_COMUNIDADE, COMUNIDADES_RESERVADAS };

export interface PerfilDaComunidade {
  /** Vazio: vale o nome semeado. */
  nome: string;
  descricao: string;
  /** Uma linha sob o nome, na capa. */
  chamada: string;
  capa: ImagemDeclarada | null;
  uf: string;
  comentariosAbertos: boolean;
  atualizadoEm: string;
}

export interface RascunhoDePublicacao {
  id: string;
  comunidadeId: string;
  titulo: string;
  corpo: string;
  etiqueta: string;
  imagem: ImagemDeclarada | null;
  criadaEm: string;
  /** Já emitida no motor, isto é: está no ar. */
  publicada: boolean;
}

export interface EstadoDaComunidade {
  versao: number;
  perfis: Record<string, PerfilDaComunidade>;
  rascunhos: RascunhoDePublicacao[];
  /**
   * AS COMUNIDADES QUE ELE CRIOU, em forma completa.
   *
   * Mesma forma dos `criados` de `loja-estado.ts`, e pela mesma razão: item nascido aqui
   * não tem semente com que se sobrepor, então guarda-se ele inteiro. `aplicar` empurra
   * cada uma para dentro do array vivo `COMUNIDADES`, e a partir daí o resto do produto
   * não sabe que elas nasceram no navegador.
   *
   * `removidos` saiu em 29/08/2026 com a tela de membros, que era a única a escrevê-lo.
   */
  criadas: ComunidadeDefinida[];
  atualizadoEm: string;
}

function perfilVazio(): PerfilDaComunidade {
  return {
    nome: "",
    descricao: "",
    chamada: "",
    capa: null,
    uf: "",
    comentariosAbertos: true,
    atualizadoEm: "",
  };
}

let estado: EstadoDaComunidade | null = null;
let dataDeReferencia = "";
const ouvintes = new Set<() => void>();

function avisar() {
  for (const o of ouvintes) o();
}

function assinar(o: () => void) {
  ouvintes.add(o);
  return () => {
    ouvintes.delete(o);
  };
}

function lerLoja() {
  return estado;
}

/** No servidor não há armazém: devolver semente faria o HTML afirmar o que o cliente nega. */
function lerNoServidor(): EstadoDaComunidade | null {
  return null;
}

function doZero(): EstadoDaComunidade {
  return {
    versao: VERSAO,
    perfis: {},
    rascunhos: [],
    criadas: [],
    atualizadoEm: dataDeReferencia,
  };
}

/**
 * RECONCILIA O ARRAY VIVO `COMUNIDADES`, no lugar.
 *
 * Mesma tese de `loja-estado.ts:107`: o seletor, as rotas e `comunidadePorId` continuam
 * lendo o array exportado por `@/dados/comunidade`, e é este arquivo que o mantém em dia.
 * Sem isto, comunidade criada aqui existiria só dentro deste módulo, e a página de leitura
 * daria 404 num id que a lista de gestão mostra.
 *
 * Chamada dentro de `hidratar` e de `gravar`, SEMPRE antes de `avisar()`: quem assina
 * re-renderiza com o array já certo.
 */
function aplicar(e: EstadoDaComunidade) {
  for (const criada of e.criadas) {
    const viva = COMUNIDADES.find((c) => c.id === criada.id);
    if (viva) Object.assign(viva, criada);
    else COMUNIDADES.push({ ...criada });
  }
}

/** Uma comunidade nascida aqui, com os campos que o produto exige preenchidos. */
function comunidadeVazia(id: string): ComunidadeDefinida {
  return {
    id,
    // Ela não é entidade do grafo, e dizer que é seria inventar procedência.
    entidadeId: null,
    nome: "",
    descricao: "",
    // O único uso de `"produtor"`, que estava declarado no tipo e não era de ninguém.
    natureza: "produtor",
    linguagens: [],
    // Zero, e não um número de cenário: comunidade recém-criada não tem quem a assine.
    assinantes: 0,
    donoId: PRODUTOR_DA_CASA,
  };
}

/** Normaliza comunidade gravada por versão antiga: campo torto cai no vazio. */
function normalizarComunidade(bruto: unknown): ComunidadeDefinida | null {
  if (typeof bruto !== "object" || bruto === null) return null;
  const b = bruto as Record<string, unknown>;
  if (typeof b.id !== "string" || b.id === "") return null;
  const vazia = comunidadeVazia(b.id);
  return {
    ...vazia,
    nome: typeof b.nome === "string" ? b.nome : vazia.nome,
    descricao: typeof b.descricao === "string" ? b.descricao : vazia.descricao,
    uf: typeof b.uf === "string" ? b.uf : undefined,
    linguagens: Array.isArray(b.linguagens)
      ? b.linguagens.filter((x): x is string => typeof x === "string")
      : [],
    assinantes: typeof b.assinantes === "number" ? b.assinantes : 0,
  };
}

function pareceEstado(v: unknown): v is EstadoDaComunidade {
  if (typeof v !== "object" || v === null) return false;
  const e = v as Partial<EstadoDaComunidade>;
  return (
    e.versao === VERSAO &&
    typeof e.perfis === "object" &&
    e.perfis !== null &&
    Array.isArray(e.rascunhos)
  );
}

/**
 * NORMALIZAÇÃO POR FORMA, a mesma disciplina de `produtor-estado.ts`: cada campo lido
 * entra só se o tipo bater com o do vazio. Um `capa: "…"` gravado por versão antiga
 * derrubaria a tela no primeiro `capa.credito`, e é exatamente esse defeito que já
 * aconteceu neste projeto uma vez.
 */
function normalizarPerfil(bruto: unknown): PerfilDaComunidade {
  const vazio = perfilVazio();
  if (typeof bruto !== "object" || bruto === null) return vazio;
  const b = bruto as Record<string, unknown>;
  const saida = { ...vazio };
  for (const chave of Object.keys(vazio) as (keyof PerfilDaComunidade)[]) {
    const valor = b[chave];
    if (valor === undefined) continue;
    const padrao = vazio[chave];
    if (padrao === null) {
      if (valor === null || (typeof valor === "object" && !Array.isArray(valor))) {
        (saida[chave] as unknown) = valor;
      }
      continue;
    }
    if (typeof valor === typeof padrao) (saida[chave] as unknown) = valor;
  }
  return saida;
}

function normalizarRascunho(bruto: unknown): RascunhoDePublicacao | null {
  if (typeof bruto !== "object" || bruto === null) return null;
  const b = bruto as Record<string, unknown>;
  if (typeof b.id !== "string" || b.id === "") return null;
  const capa = b.imagem;
  return {
    id: b.id,
    comunidadeId: typeof b.comunidadeId === "string" ? b.comunidadeId : "",
    titulo: typeof b.titulo === "string" ? b.titulo : "",
    corpo: typeof b.corpo === "string" ? b.corpo : "",
    etiqueta: typeof b.etiqueta === "string" ? b.etiqueta : "",
    imagem:
      typeof capa === "object" && capa !== null && !Array.isArray(capa)
        ? (capa as ImagemDeclarada)
        : null,
    criadaEm: typeof b.criadaEm === "string" ? b.criadaEm : "",
    publicada: b.publicada === true,
  };
}

function lerChave(): unknown {
  let cru: string | null = null;
  try {
    cru = window.localStorage.getItem(CHAVE_DA_COMUNIDADE);
  } catch {
    return null;
  }
  if (!cru) return null;
  try {
    return JSON.parse(cru);
  } catch {
    return null;
  }
}

function gravar(proximo: EstadoDaComunidade) {
  estado = proximo;
  aplicar(proximo);
  try {
    window.localStorage.setItem(CHAVE_DA_COMUNIDADE, JSON.stringify(proximo));
  } catch (erro) {
    // Cota estourada custa o «recarregar preserva», nada além disso.
    console.error("comunidade-estado: não consegui gravar", erro);
  }
  avisar();
}

function hidratar(hoje: string) {
  dataDeReferencia = hoje;
  if (estado !== null) return;

  const bruto = lerChave();
  if (bruto === null || !pareceEstado(bruto)) {
    if (bruto !== null) {
      console.warn("comunidade-estado: forma inesperada no armazém, recomeçando do zero");
    }
    estado = doZero();
    aplicar(estado);
    avisar();
    return;
  }
  const perfis: Record<string, PerfilDaComunidade> = {};
  for (const [id, p] of Object.entries(bruto.perfis)) perfis[id] = normalizarPerfil(p);
  estado = {
    versao: VERSAO,
    perfis,
    rascunhos: bruto.rascunhos
      .map(normalizarRascunho)
      .filter((x): x is RascunhoDePublicacao => x !== null),
    // Campo novo em armazem antigo: entra com o default, e o que ja estava fica.
    criadas: Array.isArray((bruto as { criadas?: unknown }).criadas)
      ? ((bruto as { criadas: unknown[] }).criadas
          .map(normalizarComunidade)
          .filter((x): x is ComunidadeDefinida => x !== null))
      : [],
    atualizadoEm: typeof bruto.atualizadoEm === "string" ? bruto.atualizadoEm : hoje,
  };
  aplicar(estado);
  avisar();
}

/**
 * O PRÓXIMO ENDEREÇO RESERVADO, ou `null` quando os oito acabaram.
 *
 * Maior sufixo mais um, determinístico: duas sessões chegam ao mesmo id no mesmo passo, e
 * a captura de ontem bate com a de hoje.
 */
function proximaComunidade(): string | null {
  const usados = (estado?.criadas ?? [])
    .map((c) => Number(c.id.replace(PREFIXO_DA_COMUNIDADE, "")))
    .filter((n) => Number.isFinite(n));
  const proximo = (usados.length > 0 ? Math.max(...usados) : 0) + 1;
  if (proximo > COMUNIDADES_RESERVADAS) return null;
  return PREFIXO_DA_COMUNIDADE + String(proximo).padStart(3, "0");
}

// ---------------------------------------------------------------------------
// O nome vigente — o único ponto de contato com arquivo portado
// ---------------------------------------------------------------------------

/**
 * O NOME QUE O PRODUTOR DEU, ou `null` quando ele não deu nenhum.
 *
 * Função de módulo, e não gancho: `comunidade.tsx` a chama de dentro de `nomeDe`, que é
 * uma função pura usada em três telas. Antes de hidratar devolve `null`, e quem chama cai
 * no nome semeado — que é o mesmo que o HTML do build traz, então a hidratação não diverge.
 */
export function nomeGerido(comunidadeId: string): string | null {
  const nome = estado?.perfis[comunidadeId]?.nome?.trim();
  return nome ? nome : null;
}

/**
 * A COMUNIDADE ACEITA COMENTÁRIO?
 *
 * A chave existia desde 28/08 e era gravada por uma tela que ninguém mais tem — e NUNCA
 * lida por lugar nenhum. Um controle que grava e não faz nada é a tela mentindo, então ou
 * ele valia ou saía; `quemPublica`, que não tem como valer numa demonstração de persona
 * única, saiu. Este vale a partir de 29/08/2026: desligado, o campo de resposta some.
 *
 * Aberta por padrão, inclusive antes de hidratar, que é o que o HTML do build traz.
 */
export function comentariosAbertosDe(comunidadeId: string): boolean {
  return estado?.perfis[comunidadeId]?.comentariosAbertos ?? true;
}

// ---------------------------------------------------------------------------
// O gancho
// ---------------------------------------------------------------------------

/** O perfil vigente: a semente com o que o produtor mudou por cima. */
export interface PerfilVigente {
  nome: string;
  descricao: string;
  chamada: string;
  imagem: string;
  imagemAlt: string;
  imagemCredito: string;
  uf: string;
  comentariosAbertos: boolean;
}

export interface SementeDoPerfil {
  nome: string;
  descricao: string;
  chamada: string;
  imagem: string;
  imagemAlt: string;
  imagemCredito: string;
}

export function vigenteDe(
  semente: SementeDoPerfil,
  perfil: PerfilDaComunidade | undefined,
): PerfilVigente {
  const capaPropria =
    perfil?.capa && perfil.capa.caminho.trim() !== "" ? perfil.capa : null;
  return {
    nome: perfil?.nome?.trim() || semente.nome,
    descricao: perfil?.descricao?.trim() || semente.descricao,
    chamada: perfil?.chamada?.trim() || semente.chamada,
    imagem: capaPropria ? capaPropria.caminho : semente.imagem,
    imagemAlt: capaPropria ? capaPropria.alt : semente.imagemAlt,
    imagemCredito: capaPropria ? capaPropria.credito : semente.imagemCredito,
    uf: perfil?.uf ?? "",
    comentariosAbertos: perfil?.comentariosAbertos ?? true,
  };
}

export interface ArmazemDaComunidade {
  pronto: boolean;
  perfil: PerfilDaComunidade;
  vigente: PerfilVigente;
  rascunhos: RascunhoDePublicacao[];
  alterarPerfil: (mudanca: Partial<PerfilDaComunidade>) => void;
  criarRascunho: () => string | null;
  alterarRascunho: (id: string, mudanca: Partial<RascunhoDePublicacao>) => void;
  marcarPublicada: (id: string) => void;
  esquecerRascunho: (id: string) => void;
  /** As comunidades que ele mantém, já reconciliadas no array vivo. */
  minhas: ComunidadeDefinida[];
  /** Cria uma, ou devolve `null` quando os oito endereços reservados acabaram. */
  criarComunidade: (campos: { nome: string; descricao: string; uf?: string }) => string | null;
  alterarComunidade: (id: string, mudanca: Partial<ComunidadeDefinida>) => void;
  limpar: () => void;
}

export function useComunidadeGerida(
  comunidadeId: string,
  semente: SementeDoPerfil,
  hoje: string,
): ArmazemDaComunidade {
  useEffect(() => {
    hidratar(hoje);
  }, [hoje]);

  const atual = useSyncExternalStore(assinar, lerLoja, lerNoServidor);

  const alterarPerfil = useCallback(
    (mudanca: Partial<PerfilDaComunidade>) => {
      if (estado === null) return;
      const antes = estado.perfis[comunidadeId] ?? perfilVazio();
      gravar({
        ...estado,
        perfis: {
          ...estado.perfis,
          [comunidadeId]: { ...antes, ...mudanca, atualizadoEm: dataDeReferencia },
        },
        atualizadoEm: dataDeReferencia,
      });
    },
    [comunidadeId],
  );

  /** `null` quando os slugs reservados acabaram: melhor recusar do que gerar um 404. */
  const criarRascunho = useCallback((): string | null => {
    if (estado === null) return null;
    const usados = estado.rascunhos
      .map((r) => Number(r.id.replace(PREFIXO_DA_PUBLICACAO, "")))
      .filter((n) => Number.isFinite(n));
    const proximo = (usados.length > 0 ? Math.max(...usados) : 0) + 1;
    if (proximo > SLUGS_RESERVADOS) return null;
    const id = PREFIXO_DA_PUBLICACAO + String(proximo).padStart(3, "0");
    gravar({
      ...estado,
      rascunhos: [
        ...estado.rascunhos,
        {
          id,
          comunidadeId,
          titulo: "",
          corpo: "",
          etiqueta: "",
          imagem: imagemVazia(),
          criadaEm: dataDeReferencia,
          publicada: false,
        },
      ],
      atualizadoEm: dataDeReferencia,
    });
    return id;
  }, [comunidadeId]);

  const alterarRascunho = useCallback(
    (id: string, mudanca: Partial<RascunhoDePublicacao>) => {
      if (estado === null) return;
      gravar({
        ...estado,
        rascunhos: estado.rascunhos.map((r) => (r.id === id ? { ...r, ...mudanca } : r)),
        atualizadoEm: dataDeReferencia,
      });
    },
    [],
  );

  const marcarPublicada = useCallback((id: string) => {
    if (estado === null) return;
    gravar({
      ...estado,
      rascunhos: estado.rascunhos.map((r) => (r.id === id ? { ...r, publicada: true } : r)),
      atualizadoEm: dataDeReferencia,
    });
  }, []);

  const esquecerRascunho = useCallback((id: string) => {
    if (estado === null) return;
    gravar({
      ...estado,
      rascunhos: estado.rascunhos.filter((r) => r.id !== id),
      atualizadoEm: dataDeReferencia,
    });
  }, []);

  const criarComunidade = useCallback(
    (campos: { nome: string; descricao: string; uf?: string }): string | null => {
      if (estado === null) return null;
      const id = proximaComunidade();
      if (id === null) return null;
      const nova: ComunidadeDefinida = {
        ...comunidadeVazia(id),
        nome: campos.nome.trim(),
        descricao: campos.descricao.trim(),
        ...(campos.uf ? { uf: campos.uf } : {}),
      };
      gravar({
        ...estado,
        criadas: [...estado.criadas, nova],
        atualizadoEm: dataDeReferencia,
      });
      return id;
    },
    [],
  );

  const alterarComunidade = useCallback((id: string, mudanca: Partial<ComunidadeDefinida>) => {
    if (estado === null) return;
    // Só as criadas se alteram: as 22 do acervo são de gente real e não têm dono editável.
    if (!estado.criadas.some((c) => c.id === id)) return;
    gravar({
      ...estado,
      criadas: estado.criadas.map((c) => (c.id === id ? { ...c, ...mudanca } : c)),
      atualizadoEm: dataDeReferencia,
    });
  }, []);

  const limpar = useCallback(() => {
    gravar(doZero());
  }, []);

  // Depende de `atual` para recalcular quando o armazém muda: `aplicar` muta `COMUNIDADES`
  // no lugar, e a referência do array não muda nunca.
  const minhas = useMemo(() => (atual === null ? [] : minhasComunidades()), [atual]);

  const perfil = atual?.perfis[comunidadeId] ?? perfilVazio();
  const vigente = useMemo(() => vigenteDe(semente, atual?.perfis[comunidadeId]), [semente, atual, comunidadeId]);

  return {
    pronto: atual !== null,
    perfil,
    vigente,
    rascunhos: atual?.rascunhos ?? [],
    alterarPerfil,
    criarRascunho,
    alterarRascunho,
    marcarPublicada,
    esquecerRascunho,
    minhas,
    criarComunidade,
    alterarComunidade,
    limpar,
  };
}

/**
 * A LISTA DE «AS MINHAS», para a tela que não fala de uma comunidade só.
 *
 * `useComunidadeGerida` exige um `comunidadeId` e uma semente, porque ela é o armazém de UMA
 * comunidade. A lista não tem uma: ela é sobre todas. Gancho próprio, com a mesma hidratação
 * e a mesma assinatura do store externo.
 */
export function useMinhasComunidades(hoje: string): {
  pronto: boolean;
  minhas: ComunidadeDefinida[];
  /** `null` quando os oito endereços reservados acabaram. */
  criar: (campos: { nome: string; descricao: string; uf?: string }) => string | null;
  restam: number;
} {
  useEffect(() => {
    hidratar(hoje);
  }, [hoje]);

  const atual = useSyncExternalStore(assinar, lerLoja, lerNoServidor);

  const criar = useCallback(
    (campos: { nome: string; descricao: string; uf?: string }): string | null => {
      if (estado === null) return null;
      const id = proximaComunidade();
      if (id === null) return null;
      gravar({
        ...estado,
        criadas: [
          ...estado.criadas,
          {
            ...comunidadeVazia(id),
            nome: campos.nome.trim(),
            descricao: campos.descricao.trim(),
            ...(campos.uf ? { uf: campos.uf } : {}),
          },
        ],
        atualizadoEm: dataDeReferencia,
      });
      return id;
    },
    [],
  );

  // Depende de `atual`: `aplicar` muta `COMUNIDADES` no lugar, e a referência nunca muda.
  const minhas = useMemo(() => (atual === null ? [] : minhasComunidades()), [atual]);

  return {
    pronto: atual !== null,
    minhas,
    criar,
    restam: COMUNIDADES_RESERVADAS - (atual?.criadas.length ?? 0),
  };
}

/** A semente de perfil montada a partir do dado do build. Serve às duas telas. */
export function sementeDoPerfil(
  comunidadeId: string,
  nome: string,
  descricao: string,
): SementeDoPerfil {
  const capa = capaSemeada(comunidadeId);
  /**
   * COMUNIDADE CRIADA AQUI NÃO TEM SEMENTE NO SERVIDOR, e a página que chama esta função é
   * de servidor: em `/studio/minhas-comunidades/com-produtor-001/` ela passa `nome: ""`,
   * porque no build aquele endereço era um slug reservado e vazio. A capa abria sem nome
   * (medido por CDP, 29/08/2026).
   *
   * `aplicar` já pôs a comunidade dentro do array vivo `COMUNIDADES` na hidratação, então a
   * resposta está aqui, do lado do cliente. O que o servidor manda continua vencendo quando
   * existe: para as 23 do build nada muda.
   */
  const viva = nome.trim() === "" ? COMUNIDADES.find((c) => c.id === comunidadeId) : undefined;
  return {
    nome: nome.trim() || (viva?.nome ?? ""),
    descricao: descricao.trim() || (viva?.descricao ?? ""),
    chamada: capa?.chamada ?? "",
    imagem: capa?.imagem ?? "",
    imagemAlt: capa?.imagemAlt ?? "",
    imagemCredito: capa?.imagemCredito ?? "",
  };
}
