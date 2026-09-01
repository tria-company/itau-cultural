/**
 * admin-destinos.ts, para onde o «editar» do administrador leva.
 *
 * ZERO IMPORT DE DADO, e é a razão do arquivo existir separado. Quem consulta este mapa é
 * `admin-controles.tsx`, que é de cliente; `admin-area.ts` alcança o grafo de 24 MB em um
 * salto, e importar dele por valor mandaria o acervo inteiro para o navegador (DP-F). Aqui
 * só há rótulo e rota.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * O PROBLEMA QUE ESTA PONTE RESOLVE, e que não é de navegação. O Admin lista ENTIDADES DO
 * ACERVO: 300 eventos, 529 mídias, 246 instituições, tudo vindo do grafo. O Studio edita
 * REGISTROS DO PRODUTOR, guardados em `produtor.v1`. As duas formas não têm chave em comum:
 * a identidade da entidade usa o realizador dela, a do registro usa a organização de quem
 * produz. Então «abrir a ficha daquele evento» quase nunca é ABRIR, é ADOTAR: criar uma
 * ficha já preenchida com o que a entidade tem, e é isso que a ponte faz.
 *
 * O QUE VAI PELA SESSÃO, e não por um índice no build. A tela do item já tem título, resumo
 * e linguagens desenhados; ela guarda esses três na sessão do navegador e navega. A
 * alternativa era um índice de milhares de esboços dentro da página da ponte, que pesaria
 * centenas de KB para entregar, por vez, um registro só.
 *
 * A PAUTA DIZ QUE TELA ELA ALIMENTA, em `DESCRICAO_DA_PAUTA[p].telaPublica`. Este mapa é a
 * volta desse caminho: da tela pública para a ficha que a alimenta. Nada aqui é invenção,
 * é a mesma tabela lida ao contrário.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** As onze pautas do Studio. Repetida como união de texto para não importar o módulo. */
export type PautaDoStudio =
  | "agenda"
  | "play"
  | "cast"
  | "museu"
  | "cursos"
  | "editorial"
  | "curadoria"
  | "programa"
  | "editais"
  | "espacos"
  | "midia";

/**
 * A rota da ficha de cada pauta.
 *
 * `cursos` mora em `/studio/formacao/` e não em `/studio/cursos/`: a pauta e a rota têm
 * nomes diferentes, e é o tipo de detalhe que só se descobre abrindo a pasta.
 */
export const ROTA_DA_FICHA: Record<PautaDoStudio, string> = {
  agenda: "/studio/publicar/",
  play: "/studio/play/",
  cast: "/studio/cast/",
  museu: "/studio/museu/",
  cursos: "/studio/formacao/",
  editorial: "/studio/editorial/",
  curadoria: "/studio/curadoria/",
  programa: "/studio/programa/",
  editais: "/studio/editais/",
  espacos: "/studio/espacos/",
  midia: "/studio/midia/",
};

/** O nome da ficha, para a tela da ponte dizer o que está abrindo. */
export const NOME_DA_PAUTA: Record<PautaDoStudio, string> = {
  agenda: "Agenda",
  play: "Play",
  cast: "Cast",
  museu: "Museu",
  cursos: "Cursos",
  editorial: "Editorial",
  curadoria: "Curadoria",
  programa: "Programa",
  editais: "Editais",
  espacos: "Espaços",
  midia: "Mídia",
};

/**
 * A pauta que alimenta cada coisa que o Admin lista.
 *
 * `null` NÃO É OMISSÃO, é resposta. Pessoa, coletivo e instituição vêm da Enciclopédia e o
 * Studio não tem ficha para elas: não existe pauta de pessoa, o elenco vive dentro da ficha
 * de agenda. Publicação e comunidade têm o poder completo na tela delas, onde o
 * administrador já apaga post e remove comentário, então o «editar» leva para lá em vez de
 * para uma ficha. Fabricar uma pauta para qualquer uma das cinco seria mentir sobre o
 * produto.
 */
export const PAUTA_DA_COISA: Record<string, PautaDoStudio | null> = {
  eventos: "agenda",
  espacos: "espacos",
  pessoas: null,
  coletivos: null,
  instituicoes: null,
  comunidades: null,
  publicacoes: null,
  loja: null,
};

/** O que o «editar» faz, por coisa. */
export type Destino =
  | { tipo: "ficha"; pauta: PautaDoStudio }
  | { tipo: "rota"; rota: string }
  | { tipo: "sem-ficha"; porque: string };

const SEM_FICHA_DA_ENCICLOPEDIA =
  "Este item vem da Enciclopédia. O Studio não tem ficha de pessoa, coletivo ou instituição: o elenco se edita dentro da ficha do evento.";

export function destinoDaCoisa(coisa: string, rotaDoItem: string): Destino {
  const pauta = PAUTA_DA_COISA[coisa];
  if (pauta) return { tipo: "ficha", pauta };
  if (coisa === "pessoas" || coisa === "coletivos" || coisa === "instituicoes") {
    return { tipo: "sem-ficha", porque: SEM_FICHA_DA_ENCICLOPEDIA };
  }
  if (coisa === "loja") return { tipo: "rota", rota: "/studio/minha-loja/" };
  // Publicação e comunidade: a tela delas já tem o poder inteiro.
  return { tipo: "rota", rota: rotaDoItem };
}

/** O que a tela do item guarda antes de mandar para a ponte. */
export interface AlvoParaEditar {
  pauta: PautaDoStudio;
  /** O identificador do item no acervo, só para a tela da ponte poder declarar de onde veio. */
  alvo: string;
  titulo: string;
  resumo: string;
  linguagens: string[];
  /** Para onde voltar se a pessoa desistir. */
  volta: string;
}

export const CHAVE_DO_ALVO = "admin.editar.v1";

export const ROTA_DA_PONTE = "/admin/abrir/";

/**
 * Guarda o alvo na sessão e devolve a rota da ponte.
 *
 * SESSÃO, E NÃO ENDEREÇO. Título e resumo de um evento passam de duzentos caracteres, e
 * pendurá-los na query deixaria a barra de endereço ilegível e o limite de tamanho perto.
 * A sessão morre com a aba, que é exatamente o tempo de vida deste salto.
 */
export function guardarAlvoParaEditar(alvo: AlvoParaEditar): string {
  try {
    window.sessionStorage.setItem(CHAVE_DO_ALVO, JSON.stringify(alvo));
  } catch {
    // Sessão indisponível (aba privada com armazenamento negado). A ponte declara o que
    // faltou em vez de abrir uma ficha em branco fingindo que deu certo.
  }
  return ROTA_DA_PONTE;
}

export function lerAlvoParaEditar(): AlvoParaEditar | null {
  try {
    const bruto = window.sessionStorage.getItem(CHAVE_DO_ALVO);
    if (!bruto) return null;
    const lido = JSON.parse(bruto) as AlvoParaEditar;
    if (!lido || typeof lido.pauta !== "string" || !ROTA_DA_FICHA[lido.pauta]) return null;
    return {
      pauta: lido.pauta,
      alvo: String(lido.alvo ?? ""),
      titulo: String(lido.titulo ?? ""),
      resumo: String(lido.resumo ?? ""),
      linguagens: Array.isArray(lido.linguagens) ? lido.linguagens.map(String) : [],
      volta: String(lido.volta ?? "/admin/"),
    };
  } catch {
    return null;
  }
}

export function esquecerAlvoParaEditar(): void {
  try {
    window.sessionStorage.removeItem(CHAVE_DO_ALVO);
  } catch {
    // Nada a fazer: se não deu para gravar, também não há o que apagar.
  }
}
