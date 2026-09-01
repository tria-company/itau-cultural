"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { usePoderDeAdmin } from "@/componentes/admin-estado";
import {
  CHAVE_DA_EQUIPE,
  EQUIPE_SEMEADA,
  O_QUE_O_PAPEL_DA,
  PAPEIS_DA_EQUIPE,
  PAUTAS_DA_EQUIPE,
  PROCEDENCIA_DA_EQUIPE,
  ROTULO_DO_PAPEL,
  equipeCom,
  type PapelDaEquipe,
  type PessoaDaEquipe,
  type SobreposicaoDaEquipe,
} from "@/dados/admin-equipe";

/**
 * admin-equipe.tsx, quem é o quê, e o que cada um alcança.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DUAS COISAS NUMA TELA SÓ, e é o que foi pedido: de um lado o quadro, onde se troca o papel
 * de alguém e se decide quem modera; do outro a subtela da pessoa, onde se vê e se mexe no
 * que um produtor publica, pauta por pauta.
 *
 * A SUBTELA NÃO É OUTRA ROTA. Ela é um painel ao lado, e a razão é o gesto: mudar acesso é
 * comparar duas pessoas, e uma rota por pessoa obrigaria a voltar e entrar de novo a cada
 * comparação. Na visão de app, onde não cabem duas colunas, ela vira a tela inteira e o
 * quadro dá lugar a ela.
 *
 * O ARMAZÉM É SOBREPOSIÇÃO. Só o que mudou é gravado, no molde de `loja-estado.ts` e da
 * própria `admin.acoes.v1`: gravar o quadro inteiro congelaria a semente na versão do dia.
 *
 * AS PAUTAS SÓ APARECEM PARA PRODUTOR. Um moderador com «Play» marcado seria um controle que
 * não governa nada, e um controle que não governa nada é a tela mentindo.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ---------------------------------------------------------------------------
// O armazém
// ---------------------------------------------------------------------------

let sobreposicao: SobreposicaoDaEquipe = {};
let hidratado = false;
const ouvintes = new Set<() => void>();

function avisar() {
  for (const o of ouvintes) o();
}

function hidratar() {
  if (hidratado) return;
  hidratado = true;
  try {
    const bruto = window.localStorage.getItem(CHAVE_DA_EQUIPE);
    if (bruto) sobreposicao = JSON.parse(bruto) as SobreposicaoDaEquipe;
  } catch {
    sobreposicao = {};
  }
}

function gravar(proxima: SobreposicaoDaEquipe) {
  sobreposicao = proxima;
  try {
    window.localStorage.setItem(CHAVE_DA_EQUIPE, JSON.stringify(proxima));
  } catch {
    // Armazenamento negado: a tela continua funcionando na sessão, e nada se perde em
    // silêncio porque nada havia para guardar.
  }
  avisar();
}

function assinar(ouvinte: () => void) {
  hidratar();
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

function lerCliente() {
  hidratar();
  return sobreposicao;
}

/** No servidor o quadro é o semeado: é o que o HTML do build carrega. */
const VAZIO: SobreposicaoDaEquipe = {};
function lerServidor() {
  return VAZIO;
}

// ---------------------------------------------------------------------------

export function AdminEquipe({ carimbo }: { carimbo: string }) {
  const poder = usePoderDeAdmin(carimbo);
  const sobre = useSyncExternalStore(assinar, lerCliente, lerServidor);
  const [aberta, definirAberta] = useState<string | null>(null);
  const [filtro, definirFiltro] = useState<PapelDaEquipe | "todos">("todos");

  const equipe = useMemo(() => equipeCom(sobre), [sobre]);
  const visiveis = useMemo(
    () => (filtro === "todos" ? equipe : equipe.filter((p) => p.papel === filtro)),
    [equipe, filtro],
  );
  const pessoa = useMemo(() => equipe.find((p) => p.id === aberta) ?? null, [equipe, aberta]);

  const porPapel = useMemo(() => {
    const conta: Record<string, number> = {};
    for (const p of equipe) conta[p.papel] = (conta[p.papel] ?? 0) + 1;
    return conta;
  }, [equipe]);

  const trocarPapel = useCallback((id: string, papel: PapelDaEquipe) => {
    const anterior = sobreposicao[id] ?? {};
    // Quem deixa de ser produtor perde as pautas: elas não governam nada nos outros papéis,
    // e deixá-las gravadas faria o acesso voltar sozinho se a pessoa virasse produtor de novo.
    const pautas = papel === "produtor" ? anterior.pautas : [];
    gravar({ ...sobreposicao, [id]: { ...anterior, papel, pautas } });
  }, []);

  const alternarPauta = useCallback(
    (p: PessoaDaEquipe, pauta: string) => {
      const atuais = new Set(p.pautas);
      if (atuais.has(pauta)) atuais.delete(pauta);
      else atuais.add(pauta);
      const anterior = sobreposicao[p.id] ?? {};
      gravar({ ...sobreposicao, [p.id]: { ...anterior, pautas: [...atuais] } });
    },
    [],
  );

  if (!poder.pronto) return null;

  if (!poder.ehAdmin) {
    return (
      <p className="adm-aviso" data-nao-e-admin>
        Esta área é da administração. Troque o perfil em <Link href="/meu/">Meu</Link>.
      </p>
    );
  }

  const mudou = Object.keys(sobre).length;

  return (
    <div className="adm-equipe" data-admin-equipe={equipe.length} data-aberta={pessoa ? "sim" : "nao"}>
      {/* ---- O quadro ---- */}
      <section className="adm-equipe-quadro">
        <ul className="adm-equipe-numeros">
          {PAPEIS_DA_EQUIPE.map((p) => (
            <li key={p}>
              <button
                type="button"
                className="adm-equipe-numero"
                data-papel={p}
                data-ativo={filtro === p ? "sim" : "nao"}
                aria-pressed={filtro === p}
                onClick={() => definirFiltro((f) => (f === p ? "todos" : p))}
              >
                <span className="adm-equipe-numero-valor">{porPapel[p] ?? 0}</span>
                <span className="adm-equipe-numero-rotulo">{ROTULO_DO_PAPEL[p]}</span>
              </button>
            </li>
          ))}
        </ul>

        <p className="adm-conta" data-conta={visiveis.length}>
          {visiveis.length} de {equipe.length}
          {filtro === "todos" ? "" : ` · só ${ROTULO_DO_PAPEL[filtro].toLowerCase()}`}
          {mudou > 0 ? ` · ${mudou} alterada${mudou === 1 ? "" : "s"} neste navegador` : ""}
        </p>

        <ul className="adm-linhas">
          {visiveis.map((p) => (
            <li key={p.id} className="adm-item adm-equipe-linha" data-pessoa={p.id}>
              <span className="adm-equipe-monograma" aria-hidden="true">
                {p.nome.slice(0, 1)}
              </span>
              <div className="adm-item-cima">
                <span className="adm-item-nome">{p.nome}</span>
                <span className="adm-item-descricao">{p.funcao}</span>
                <span className="adm-item-contexto">
                  Desde {p.desde}
                  {p.papel === "produtor" ? ` · ${p.pautas.length} de ${PAUTAS_DA_EQUIPE.length} pautas` : ""}
                </span>
              </div>

              <label className="adm-campo adm-equipe-papel">
                <span>Papel</span>
                <select
                  value={p.papel}
                  data-papel-de={p.id}
                  onChange={(e) => trocarPapel(p.id, e.target.value as PapelDaEquipe)}
                >
                  {PAPEIS_DA_EQUIPE.map((papel) => (
                    <option key={papel} value={papel}>
                      {ROTULO_DO_PAPEL[papel]}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                className="adm-botao"
                data-abrir-pessoa={p.id}
                aria-expanded={aberta === p.id}
                onClick={() => definirAberta((a) => (a === p.id ? null : p.id))}
              >
                Acessos
              </button>
            </li>
          ))}
        </ul>

        <p className="adm-equipe-procedencia">{PROCEDENCIA_DA_EQUIPE}</p>

        {mudou > 0 && (
          <button
            type="button"
            className="adm-botao"
            data-reiniciar-equipe
            onClick={() => gravar({})}
          >
            Devolver o quadro ao estado semeado
          </button>
        )}
      </section>

      {/* ---- A subtela da pessoa ---- */}
      {pessoa && (
        <aside className="adm-equipe-subtela" data-subtela={pessoa.id}>
          <header className="adm-equipe-subtela-topo">
            <div>
              <p className="adm-ponte-passo">Acessos</p>
              <h2 className="adm-ponte-titulo">{pessoa.nome}</h2>
              <p className="adm-ponte-onde">{pessoa.funcao}</p>
            </div>
            <button
              type="button"
              className="adm-botao"
              data-fechar-subtela
              aria-label="Fechar"
              onClick={() => definirAberta(null)}
            >
              Fechar
            </button>
          </header>

          <section className="adm-secao">
            <h3 className="adm-titulo">O que este papel alcança</h3>
            <ul className="adm-equipe-alcance">
              {O_QUE_O_PAPEL_DA[pessoa.papel].map((linha) => (
                <li key={linha}>{linha}</li>
              ))}
            </ul>
          </section>

          <section className="adm-secao">
            <h3 className="adm-titulo">Publicação por pauta</h3>
            {pessoa.papel === "produtor" ? (
              <>
                <ul className="adm-equipe-pautas">
                  {PAUTAS_DA_EQUIPE.map((pa) => {
                    const tem = pessoa.pautas.includes(pa.id);
                    return (
                      <li key={pa.id}>
                        <label className="msp-chave">
                          <input
                            type="checkbox"
                            checked={tem}
                            data-pauta={pa.id}
                            onChange={() => alternarPauta(pessoa, pa.id)}
                          />
                          <span className="msp-chave-trilho" aria-hidden="true" />
                          <span className="msp-chave-rotulo">
                            {pa.rotulo}
                            <em> alimenta {pa.alimenta}</em>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
                <p className="adm-equipe-nota">
                  Marcar uma pauta aqui é dizer que esta pessoa publica nela. As onze são as
                  do Studio, e cada uma alimenta a tela indicada ao lado.
                </p>
              </>
            ) : (
              <p className="adm-vazio">
                Só o papel de produtor publica pelo Studio. Troque o papel no quadro para
                liberar as pautas.
              </p>
            )}
          </section>
        </aside>
      )}
    </div>
  );
}

/** Quantas pessoas o quadro semeia. Serve à sonda, e não à tela. */
export const TAMANHO_DA_EQUIPE = EQUIPE_SEMEADA.length;
