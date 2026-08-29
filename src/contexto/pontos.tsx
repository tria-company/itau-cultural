"use client";

/**
 * pontos.tsx — o binding React do motor de pontos.
 *
 * SEGUE O MOLDE DE `sessao.tsx`, e isso não é gosto: aquele arquivo já resolveu
 * os dois problemas que este teria de resolver de novo. O primeiro é a hidratação
 * sob `output: "export"` — o HTML sai do build, então ler `localStorage` no
 * primeiro render divergiria dele; a leitura mora no efeito e há um sinalizador
 * `hidratado` para as telas não pintarem um saldo errado por um quadro. O segundo
 * é storage editável pelo avaliador: leitura tolerante, valor estranho vira estado
 * novo em vez de derrubar a tela.
 *
 * TROCAR DE PERSONA CONSTRÓI UM MOTOR NOVO. Nenhum resquício do percurso da Maria
 * atravessa para o Carlos — é a mesma garantia que a aplicação de origem tinha ao
 * trocar de tenant, e aqui ela importa mais ainda, porque a demonstração inteira
 * depende de alternar entre as três personas ao vivo.
 *
 * O MOTOR VIVE FORA DO REACT e é assinado por `useSyncExternalStore`. Sem isso,
 * cada tela guardaria uma cópia do estado e duas telas abertas discordariam do
 * saldo — que é exatamente o que um livro-razão existe para impedir.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useSessao } from "@/contexto/sessao";
import { PROGRAMA } from "@/dados/programa";
import { Motor } from "@/lib/pontos/motor";
import type { EfeitoDoMotor, EstadoDoMotor } from "@/lib/pontos/tipos";

const PREFIXO = "agenda-cultural:pontos:";

/**
 * A versão do formato guardado. Mudou a forma do estado, SOBE O NÚMERO — e o que
 * estava salvo é descartado em vez de hidratar um objeto meio velho meio novo.
 *
 * Esquecer de subir custou uma tela: `publicacoesSalvas` nasceu na versão 2 e o
 * estado da versão 1 hidratava sem o campo, derrubando a comunidade em
 * `guardadas.length`. Campo novo no estado é sempre um degrau aqui.
 *
 * A versão 3 veio da troca de `loja.resgate.efetuado` por `recompensa.resgatada`:
 * as chaves de `itensPontuados` guardadas antes carregam o nome velho e nunca
 * mais casariam.
 *
 * A versão 4 é o módulo de desafios de 2026-08: `comprovacoes` e `tags` nasceram
 * no estado, e um estado da versão 3 hidrataria sem os dois — derrubando a tela
 * da missão em `comprovacoes.filter`, que é exatamente o erro que a versão 2 já
 * tinha ensinado com `publicacoesSalvas`.
 *
 * A versão 5 é a saída de `publicacoesSalvas`, em 29/08/2026: guardar publicação saiu do
 * produto inteiro. O campo some do estado, e um estado da versão 4 hidratando aqui traria
 * de volta uma lista que ninguém mais lê nem limpa. Campo que SAI é degrau tanto quanto
 * campo que entra.
 */
const VERSAO_DO_FORMATO = 5;

interface Guardado {
  versao: number;
  estado: EstadoDoMotor;
}

function chaveDe(personaId: string): string {
  return PREFIXO + personaId;
}

/**
 * As listas do estado, normalizadas na leitura.
 *
 * A versão do formato protege contra o estado ANTIGO conhecido; isto protege
 * contra o estado que ninguém previu — storage editado à mão, gravação
 * interrompida no meio, um campo que nasceu depois. Uma lista ausente vira lista
 * vazia e a tela continua de pé; sem isto, um único campo faltando derruba a
 * comunidade inteira com «cannot read properties of undefined».
 */
const LISTAS = [
  "livro",
  "emblemas",
  "resgates",
  "publicacoes",
  "assinadas",
  "presencas",
  "linguagensAlcancadas",
  "ufsAlcancadas",
  "diasDistintos",
  "comprovacoes",
  "tags",
] as const;

const MAPAS = ["missoes", "reacoesDadas", "execucoesPorRegra", "execucoesHoje", "itensPontuados"] as const;

function normalizar(estado: EstadoDoMotor): EstadoDoMotor {
  for (const chave of LISTAS) {
    if (!Array.isArray(estado[chave])) {
      (estado as unknown as Record<string, unknown>)[chave] = [];
    }
  }
  for (const chave of MAPAS) {
    const valor = estado[chave] as unknown;
    if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
      (estado as unknown as Record<string, unknown>)[chave] = {};
    }
  }
  return estado;
}

function ler(personaId: string): EstadoDoMotor | undefined {
  try {
    const bruto = window.localStorage.getItem(chaveDe(personaId));
    if (!bruto) return undefined;
    const valor: unknown = JSON.parse(bruto);
    if (!valor || typeof valor !== "object") return undefined;
    const guardado = valor as Partial<Guardado>;
    if (guardado.versao !== VERSAO_DO_FORMATO) return undefined;
    if (!guardado.estado || !Array.isArray(guardado.estado.livro)) return undefined;
    if (!guardado.estado.sequencia || typeof guardado.estado.sequencia !== "object") return undefined;
    return normalizar(guardado.estado);
  } catch {
    // Storage bloqueado ou JSON corrompido. Os dois querem dizer «não há nada
    // guardado», que é um motor novo — nunca uma tela quebrada.
    return undefined;
  }
}

function gravar(personaId: string, estado: EstadoDoMotor): boolean {
  try {
    const guardado: Guardado = { versao: VERSAO_DO_FORMATO, estado };
    window.localStorage.setItem(chaveDe(personaId), JSON.stringify(guardado));
    return true;
  } catch {
    // Modo privado, iframe ou cota estourada: persistir é conveniência, não
    // requisito. A sessão continua valendo em memória.
    return false;
  }
}

interface ContextoDePontos {
  motor: Motor;
  /** Falso até o `localStorage` ter sido lido. Nenhum saldo pinta antes disso. */
  hidratado: boolean;
  /** Falso quando o storage recusou a última escrita — a tela avisa em uma linha. */
  persistido: boolean;
}

const Contexto = createContext<ContextoDePontos | null>(null);

export function PontosProvider({ children }: { children: ReactNode }) {
  const { personaId } = useSessao();

  const motorRef = useRef<Motor | null>(null);
  const construidoPara = useRef<string | null>(null);
  const [hidratado, setHidratado] = useState(false);
  const [persistido, setPersistido] = useState(true);
  const [geracao, setGeracao] = useState(0);

  // Construção síncrona no render: o primeiro render precisa de um motor, e ele
  // nasce SEM o storage — determinístico, igual ao HTML do build. A restauração
  // vem no efeito abaixo, que só roda no cliente.
  if (construidoPara.current !== personaId) {
    motorRef.current = new Motor(personaId, PROGRAMA);
    construidoPara.current = personaId;
  }

  useEffect(() => {
    const restaurado = ler(personaId);
    if (restaurado) {
      motorRef.current = new Motor(personaId, PROGRAMA, restaurado);
      construidoPara.current = personaId;
      setGeracao((g) => g + 1);
    }
    setHidratado(true);
  }, [personaId]);

  // Grava a cada commit do motor. Assinar é mais barato que gravar em toda tela
  // que emite: um lugar só escreve, e nenhuma tela pode esquecer de salvar.
  useEffect(() => {
    const motor = motorRef.current;
    if (!motor || !hidratado) return;
    return motor.assinar(() => {
      setPersistido(gravar(personaId, motor.atual));
    });
  }, [personaId, hidratado, geracao]);

  const valor = useMemo<ContextoDePontos>(
    () => ({ motor: motorRef.current as Motor, hidratado, persistido }),
    // `geracao` entra porque a troca do motor não é observável de outro jeito:
    // a referência muda dentro de um ref, que por definição não dispara render.
    [hidratado, persistido, geracao],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

function usarContexto(): ContextoDePontos {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("usePontos precisa estar dentro de <PontosProvider>");
  return ctx;
}

/**
 * O motor, já assinado. Toda tela que lê saldo, nível ou missão chama isto — e
 * re-renderiza sozinha quando qualquer outra tela emitir um evento.
 */
export function usePontos() {
  const { motor, hidratado, persistido } = usarContexto();

  useSyncExternalStore(motor.assinar, motor.lerVersao, motor.lerVersao);

  return { motor, hidratado, persistido };
}

/**
 * Assina os EFEITOS — subida de nível, emblema, travessia, teto atingido. Serve a
 * quem desenha comemoração, e é separado do render de propósito: um efeito é um
 * acontecimento pontual, não um estado, e tratá-lo como estado faria a
 * comemoração reaparecer a cada re-render.
 */
export function useEfeitosDePontos(aoReceber: (efeitos: EfeitoDoMotor[]) => void) {
  const { motor } = usarContexto();
  const ref = useRef(aoReceber);
  ref.current = aoReceber;

  const estavel = useCallback((efeitos: EfeitoDoMotor[]) => ref.current(efeitos), []);

  useEffect(() => motor.aoEfeito(estavel), [motor, estavel]);
}
