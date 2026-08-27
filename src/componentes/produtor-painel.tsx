"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { BarraDoStudio } from "@/componentes/produtor-barra";
import { Folha } from "@/componentes/base/folha";
import { iniciaisDe, usePerfil } from "@/componentes/perfil-estado";
import { marcarAberturaDaFicha, useProdutor } from "@/componentes/produtor-estado";
import { PORTAS, ROTULO_DA_SITUACAO, SITUACOES } from "@/dados/tipos-acesso";
import { GraficoDaSerie } from "@/componentes/base/grafico-da-serie";
import {
  DESEMPENHO_E_AUTORADO,
  DIAS_DA_SERIE,
  desempenhoDe,
  minutosLegiveis,
  variacaoSemanal,
} from "@/dados/desempenho-produtor";
import {
  DESCRICAO_DA_PAUTA,
  PAUTAS,
  casaComBusca,
  emReais,
  impedimentosDe,
  minutosEntre,
  podePublicar,
  semTravessao,
} from "@/dados/tipos-produtor";
import type {
  ContextoDoProdutor,
  Pauta,
  Registro,
  Situacao,
} from "@/dados/tipos-produtor";

/**
 * produtor-painel.tsx, P1, a raiz do Studio, no desenho 2.0.
 *
 * O DESENHO ANTERIOR ERA UMA LISTA COM FILTROS, e a revisão a olho o reprovou: quem entrava
 * via tudo de uma vez (pendências, busca, dois trilhos de chips, lista, avisos) e não via
 * por onde começar. A regra do redesenho: a primeira tela ORIENTA, e o detalhe mora em
 * folhas que abrem quando pedidas.
 *
 * A ESTRUTURA NOVA, de cima para baixo:
 *   1. HERO com imagem, o nome da casa e três números.
 *   2. UMA linha de pendência, se houver, que abre a folha com o detalhe.
 *   3. DESEMPENHO da última publicação, na métrica da própria pauta: evento em
 *      ingressos, receita e dias para a próxima sessão; audiovisual em plays, tempo
 *      médio e conclusão. Números autorados (desempenho-produtor.ts), declarados na
 *      legenda do gráfico.
 *   4. ATALHOS com imagem, um por pauta: o painel É a navegação. O trilho de
 *      pastilhas não aparece na raiz, porque seria a mesma navegação duas vezes.
 *   5. GERENCIAR: linhas para Sessões, Perfil e Catálogos.
 *   6. RECENTES: quatro registros, e o resto numa folha com busca e seletores.
 *   7. Rodapé de dois links discretos: sobre a demonstração, e reiniciar.
 *
 * O «Criar» virou uma FOLHA EM DOIS PASSOS: escolher a pauta, ver o caminho, começar.
 * Guiado e direto, sem menu espremido dentro da barra.
 *
 * MÓDULO DE CLIENTE (DP-F): a semente e as imagens entram por PROP, vindas do servidor.
 */

export interface ImagemDeAtalho {
  caminho: string;
  credito: string;
  alt: string;
  de: string;
}

const TODAS = "todas";

type FolhaAberta = null | "criar" | "todos" | "pendencias" | "sobre";

export interface PainelProps {
  semente: Registro[];
  contexto: ContextoDoProdutor;
  /** A frase que declara o que na semente é autorado. Vive na folha «sobre». */
  sementeEAutorada: string;
  /** A frase do que este perfil alimenta. Vive na folha «sobre». */
  produtorAlimentaTudo: string;
  /** As pautas cuja ficha já responde. Fora desta lista o atalho diz «em breve». */
  pautasComFicha: readonly Pauta[];
  /** Imagens reais do acervo, com crédito, para os atalhos e o passo de criação. */
  imagens: ImagemDeAtalho[];
}

export function ProdutorPainel({
  semente,
  contexto,
  sementeEAutorada,
  produtorAlimentaTudo,
  pautasComFicha,
  imagens,
}: PainelProps) {
  const router = useRouter();
  const armazem = useProdutor(semente, contexto);
  const { perfil } = usePerfil();
  const [folha, setFolha] = useState<FolhaAberta>(null);
  const [pautaEscolhida, setPautaEscolhida] = useState<Pauta | null>(null);

  const prontas = useMemo(() => new Set(pautasComFicha), [pautasComFicha]);

  /** A imagem de cada pauta, determinística: a n-ésima do catálogo para a n-ésima pauta. */
  const imagemDaPauta = (p: Pauta): ImagemDeAtalho | null => {
    if (imagens.length === 0) return null;
    return imagens[PAUTAS.indexOf(p) % imagens.length] ?? null;
  };

  // As pendências, agrupadas pela porta que as resolve. Recalculadas do próprio estado.
  const porPorta = useMemo(() => {
    const mapa = new Map<string, { registro: Registro; texto: string }[]>();
    for (const r of armazem.registros) {
      for (const p of r.pendencias) {
        const lista = mapa.get(p.porta) ?? [];
        lista.push({ registro: r, texto: p.texto });
        mapa.set(p.porta, lista);
      }
    }
    return mapa;
  }, [armazem.registros]);

  const totalDePendencias = useMemo(
    () => [...porPorta.values()].reduce((n, l) => n + l.length, 0),
    [porPorta],
  );

  const noAr = armazem.registros.filter((r) => r.situacao === "publicado").length;
  const emEdicao = armazem.registros.filter(
    (r) => r.situacao === "rascunho" || r.situacao === "devolvido",
  ).length;

  const recentes = armazem.ordenados.slice(0, 4);

  function comecarCriacao(p: Pauta) {
    armazem.criar(p);
    setFolha(null);
    setPautaEscolhida(null);
    // A rota da pauta abre no início da categoria; quem veio do «Criar» já pediu a ficha.
    marcarAberturaDaFicha();
    router.push(DESCRICAO_DA_PAUTA[p].rota);
  }

  function fecharFolha() {
    setFolha(null);
    setPautaEscolhida(null);
  }

  if (!armazem.pronto) {
    return (
      <div className="prod-corpo prod-painel">
        <Hero organizacao={contexto.organizacao} noAr={null} emEdicao={null} pendencias={null} foto={null} iniciais="" />
        <p className="prod-nota">Lendo o que está gravado neste navegador.</p>
      </div>
    );
  }

  return (
    <>
      <div className="prod-corpo prod-painel" data-painel-produtor>
        {/* ---- 1 · o hero ---- */}
        <Hero
          organizacao={contexto.organizacao}
          noAr={noAr}
          emEdicao={emEdicao}
          pendencias={totalDePendencias}
          foto={perfil.foto}
          iniciais={iniciaisDe(perfil.nome, contexto.organizacao)}
        />

        {/* ---- 2 · a pendência, numa linha só ---- */}
        {totalDePendencias > 0 ? (
          <button
            type="button"
            className="prod-aviso-pendencia"
            data-abrir-pendencias
            onClick={() => setFolha("pendencias")}
          >
            <span aria-hidden>⚠</span>
            <span>
              <strong>
                {totalDePendencias} {totalDePendencias === 1 ? "pendência" : "pendências"}
              </strong>{" "}
              com outra equipe
            </span>
            <span className="prod-aviso-seta" aria-hidden>
              ▸
            </span>
          </button>
        ) : null}

        {/* ---- 3 · o desempenho da última publicação ---- */}
        <DesempenhoDaUltima
          registros={armazem.ordenados}
          dataDeReferencia={contexto.dataDeReferencia}
          imagens={imagens}
        />

        {/* ---- 4 · os atalhos: o painel é a navegação ---- */}
        <section className="prod-secao" aria-labelledby="prod-atalhos-titulo">
          <h2 className="prod-secao-titulo" id="prod-atalhos-titulo">
            Publicar
          </h2>
          <div className="prod-atalhos" data-atalhos-pautas>
            {PAUTAS.map((p) => {
              const d = DESCRICAO_DA_PAUTA[p];
              const img = imagemDaPauta(p);
              const capa = (
                <span className="prod-atalho-capa">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element -- capa local do acervo
                    <img src={img.caminho} alt="" loading="lazy" />
                  ) : null}
                  {img ? <span className="prod-atalho-credito">{img.credito}</span> : null}
                </span>
              );
              if (!prontas.has(p)) {
                return (
                  <div
                    key={p}
                    className="prod-atalho"
                    data-atalho={p}
                    data-pronta="nao"
                    title={`${d.objetivo} Ficha ainda não construída.`}
                  >
                    {capa}
                    <span className="prod-atalho-rotulo">
                      {d.rotulo}
                      <span className="prod-atalho-breve">em breve</span>
                    </span>
                  </div>
                );
              }
              return (
                <Link key={p} href={d.rota} className="prod-atalho" data-atalho={p} title={d.objetivo}>
                  {capa}
                  <span className="prod-atalho-rotulo">
                    {d.rotulo}
                    <span aria-hidden>▸</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ---- 5 · gerenciar ---- */}
        <section className="prod-secao" aria-labelledby="prod-gerenciar-titulo">
          <h2 className="prod-secao-titulo" id="prod-gerenciar-titulo">
            Gerenciar
          </h2>
          <Link href="/studio/ocorrencias/" className="prod-atalho-linha" data-atalho="sessoes">
            <span className="prod-atalho-linha-texto">
              <strong>Sessões publicadas</strong>
              <span>Horário, esgotado e cancelamento do que está no ar</span>
            </span>
            <span aria-hidden>▸</span>
          </Link>
          <Link href="/studio/perfil/" className="prod-atalho-linha" data-atalho="perfil">
            <span className="prod-atalho-linha-texto">
              <strong>Seu perfil</strong>
              <span>Dados pessoais, foto e o estado da conta</span>
            </span>
            <span aria-hidden>▸</span>
          </Link>
          <Link href="/studio/catalogos/" className="prod-atalho-linha" data-atalho="catalogos">
            <span className="prod-atalho-linha-texto">
              <strong>Catálogos</strong>
              <span>As listas de escolha das fichas: linguagens, temas, formatos</span>
            </span>
            <span aria-hidden>▸</span>
          </Link>
        </section>

        {/* ---- 6 · recentes ---- */}
        <section className="prod-secao" aria-labelledby="prod-recentes-titulo">
          <h2 className="prod-secao-titulo" id="prod-recentes-titulo">
            Recentes
          </h2>

          {recentes.length === 0 ? (
            <div className="prod-vazio">
              <p className="prod-vazio-frase">
                Nenhum registro ainda. Toque em Criar para começar pelo primeiro.
              </p>
            </div>
          ) : (
            <>
              <div className="prod-recentes">
                {recentes.map((r) => (
                  <Recente
                    key={r.id}
                    registro={r}
                    pronta={prontas.has(r.pauta)}
                    aoAbrir={() => {
                      armazem.escolher(r.id);
                      marcarAberturaDaFicha();
                      router.push(DESCRICAO_DA_PAUTA[r.pauta].rota);
                    }}
                    aoDuplicar={() => {
                      const novo = armazem.duplicar(r.id);
                      if (novo) {
                        marcarAberturaDaFicha();
                        router.push(DESCRICAO_DA_PAUTA[r.pauta].rota);
                      }
                    }}
                  />
                ))}
              </div>
              <BotaoDoStudio curto aoClicar={() => setFolha("todos")} data-abrir-todos>
                Todos os registros · {armazem.registros.length}
              </BotaoDoStudio>
            </>
          )}
        </section>

        {/* ---- 7 · rodapé discreto ---- */}
        <footer className="prod-rodape-limpo">
          <button
            type="button"
            className="prod-link"
            onClick={() => setFolha("sobre")}
            data-abrir-sobre
          >
            Sobre esta demonstração
          </button>
          <Reiniciar aoReiniciar={armazem.reiniciar} />
        </footer>
      </div>

      {/* A ação primária: uma só, no pé, dentro da moldura. */}
      <BarraDoStudio pautasComFicha={pautasComFicha} imagens={imagens} />

      {/* ---- a folha de criação, em dois passos ---- */}
      <Folha
        aberta={folha === "criar"}
        titulo={
          pautaEscolhida
            ? DESCRICAO_DA_PAUTA[pautaEscolhida].singular
            : "O que você quer publicar?"
        }
        descricao={pautaEscolhida ? undefined : "Escolha a pauta. São dois passos."}
        aoFechar={fecharFolha}
        rodape={
          pautaEscolhida ? (
            <BotaoDoStudio
              primaria
              aoClicar={() => comecarCriacao(pautaEscolhida)}
              data-acao="comecar-criacao"
            >
              Começar
            </BotaoDoStudio>
          ) : undefined
        }
      >
        {pautaEscolhida === null ? (
          <div className="prod-opcoes-pauta" data-passo="1">
            {PAUTAS.map((p) => {
              const d = DESCRICAO_DA_PAUTA[p];
              const img = imagemDaPauta(p);
              const pode = prontas.has(p);
              return (
                <button
                  key={p}
                  type="button"
                  className="prod-atalho"
                  data-criar={p}
                  data-pronta={pode ? "sim" : "nao"}
                  disabled={!pode}
                  title={pode ? d.objetivo : `${d.objetivo} Ficha ainda não construída.`}
                  onClick={() => setPautaEscolhida(p)}
                >
                  <span className="prod-atalho-capa">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element -- capa local do acervo
                      <img src={img.caminho} alt="" loading="lazy" />
                    ) : null}
                  </span>
                  <span className="prod-atalho-rotulo">
                    {d.rotulo}
                    {!pode ? <span className="prod-atalho-breve">em breve</span> : null}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <PassoDois
            pauta={pautaEscolhida}
            imagem={imagemDaPauta(pautaEscolhida)}
            aoVoltar={() => setPautaEscolhida(null)}
          />
        )}
      </Folha>

      {/* ---- a folha de pendências ---- */}
      <Folha
        aberta={folha === "pendencias"}
        titulo="Pendente de você"
        descricao="O que espera por outra equipe. Nada aqui impede publicar."
        aoFechar={fecharFolha}
      >
        {(["moderacao", "organizacao", "editor"] as const).map((porta) => {
          const itens = porPorta.get(porta) ?? [];
          if (itens.length === 0) return null;
          return (
            <div className="prod-pendencia" key={porta} data-porta={porta}>
              <span className="prod-pendencia-dono">{PORTAS[porta].nivel}</span>
              {itens.map((i, n) => (
                <p className="prod-pendencia-texto" key={`${i.registro.id}-${n}`}>
                  <strong>{i.registro.titulo || "(sem título)"}</strong> ·{" "}
                  {semTravessao(i.texto)}
                </p>
              ))}
              <p className="prod-pendencia-texto">
                <em>Sem esperar: {semTravessao(PORTAS[porta].saida)}</em>
              </p>
            </div>
          );
        })}
      </Folha>

      {/* ---- a folha com todos os registros ---- */}
      <FolhaDeRegistros
        aberta={folha === "todos"}
        aoFechar={fecharFolha}
        armazem={armazem}
        prontas={prontas}
        aoNavegar={(rota) => {
          marcarAberturaDaFicha();
          fecharFolha();
          router.push(rota);
        }}
      />

      {/* ---- a folha sobre a demonstração ---- */}
      <Folha aberta={folha === "sobre"} titulo="Sobre esta demonstração" aoFechar={fecharFolha}>
        <p className="prod-nota">{semTravessao(produtorAlimentaTudo)}</p>
        <p className="prod-nota">{semTravessao(sementeEAutorada)}</p>
        {armazem.migradoDe.length > 0 ? (
          <p className="prod-nota">
            Este armazém absorveu o que estava gravado em{" "}
            <strong>{armazem.migradoDe.join(", ")}</strong>. As chaves antigas continuam no
            navegador: a migração lê e não apaga.
          </p>
        ) : null}
      </Folha>
    </>
  );
}

// ---------------------------------------------------------------------------
// O HERO
// ---------------------------------------------------------------------------

function Hero({
  organizacao,
  noAr,
  emEdicao,
  pendencias,
  foto,
  iniciais,
}: {
  organizacao: string;
  noAr: number | null;
  emEdicao: number | null;
  pendencias: number | null;
  foto: string | null;
  iniciais: string;
}) {
  return (
    <header className="prod-hero" data-hero-produtor>
      {/* O ACESSO AO PERFIL, no canto do hero: a foto da pessoa, ou as iniciais. */}
      <Link
        href="/studio/perfil/"
        className="prod-hero-perfil"
        aria-label="abrir o seu perfil"
        data-abrir-perfil
      >
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element -- foto local do acervo
          <img src={foto} alt="" />
        ) : (
          <span aria-hidden>{iniciais || "?"}</span>
        )}
      </Link>
      {/* A MESMA foto do hub: local, sem requisição externa, já parte da identidade. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- imagem local, decorativa */}
      <img src="/hub/heroi.jpg" alt="" className="prod-hero-foto" />
      <span className="prod-hero-veu" aria-hidden />
      <p className="prod-hero-kicker">Studio</p>
      <h1 className="prod-hero-titulo">{organizacao}</h1>
      <p className="prod-hero-sub">Você publica. O aplicativo mostra.</p>
      <div className="prod-hero-stats">
        <span className="prod-stat" data-stat="no-ar">
          <strong>{noAr ?? "…"}</strong>
          <span>no ar</span>
        </span>
        <span className="prod-stat" data-stat="em-edicao">
          <strong>{emEdicao ?? "…"}</strong>
          <span>em edição</span>
        </span>
        <span className="prod-stat" data-stat="pendencias">
          <strong>{pendencias ?? "…"}</strong>
          <span>{pendencias === 1 ? "pendência" : "pendências"}</span>
        </span>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// O PASSO 2 DA CRIAÇÃO
// ---------------------------------------------------------------------------

const PASSOS_DA_FICHA = [
  "Identidade: título, resumo e capa",
  "Os detalhes da pauta",
  "Acessibilidade declarada",
  "Prévia e publicação",
] as const;

function PassoDois({
  pauta,
  imagem,
  aoVoltar,
}: {
  pauta: Pauta;
  imagem: ImagemDeAtalho | null;
  aoVoltar: () => void;
}) {
  const d = DESCRICAO_DA_PAUTA[pauta];
  return (
    <div className="prod-criacao" data-passo="2">
      {imagem ? (
        <span className="prod-atalho-capa prod-criacao-capa">
          {/* eslint-disable-next-line @next/next/no-img-element -- capa local do acervo */}
          <img src={imagem.caminho} alt="" />
          <span className="prod-atalho-credito">{imagem.credito}</span>
        </span>
      ) : null}
      <p className="prod-nota">{semTravessao(d.objetivo)}</p>
      <ol className="prod-passos">
        {PASSOS_DA_FICHA.map((p, i) => (
          <li className="prod-passo" key={p}>
            <span className="prod-passo-numero" aria-hidden>
              {i + 1}
            </span>
            {p}
          </li>
        ))}
      </ol>
      <BotaoDoStudio curto aoClicar={aoVoltar} data-acao="voltar-escolha">
        Escolher outra pauta
      </BotaoDoStudio>
    </div>
  );
}

// ---------------------------------------------------------------------------
// UM RECENTE
// ---------------------------------------------------------------------------

function Recente({
  registro,
  pronta,
  aoAbrir,
  aoDuplicar,
}: {
  registro: Registro;
  pronta: boolean;
  aoAbrir: () => void;
  aoDuplicar: () => void;
}) {
  const d = DESCRICAO_DA_PAUTA[registro.pauta];
  return (
    <div className="prod-recente" data-registro={registro.id}>
      {registro.imagem?.caminho ? (
        // eslint-disable-next-line @next/next/no-img-element -- capa local do acervo
        <img src={registro.imagem.caminho} alt="" className="prod-recente-capa" loading="lazy" />
      ) : (
        <span className="prod-recente-capa prod-capa-vazia" aria-hidden />
      )}
      <div className="prod-recente-corpo">
        <span className="prod-recente-titulo">{registro.titulo || "(sem título)"}</span>
        <span className="prod-registro-meta">
          <span className="prod-situacao" data-situacao={registro.situacao}>
            {ROTULO_DA_SITUACAO[registro.situacao]}
          </span>
          <span>{d.rotulo}</span>
        </span>
      </div>
      <div className="prod-recente-acoes">
        <BotaoDoStudio
          curto
          aoClicar={aoAbrir}
          desabilitado={!pronta}
          porQueDesabilitado={`A ficha de ${d.rotulo} ainda não foi construída.`}
          data-acao="abrir"
        >
          Editar
        </BotaoDoStudio>
        <BotaoDoStudio curto aoClicar={aoDuplicar} data-acao="duplicar">
          Duplicar
        </BotaoDoStudio>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// A FOLHA COM TODOS OS REGISTROS
// ---------------------------------------------------------------------------

function FolhaDeRegistros({
  aberta,
  aoFechar,
  armazem,
  prontas,
  aoNavegar,
}: {
  aberta: boolean;
  aoFechar: () => void;
  armazem: ReturnType<typeof useProdutor>;
  prontas: ReadonlySet<Pauta>;
  aoNavegar: (rota: string) => void;
}) {
  const [busca, setBusca] = useState("");
  const [pauta, setPauta] = useState<Pauta | typeof TODAS>(TODAS);
  const [situacao, setSituacao] = useState<Situacao | typeof TODAS>(TODAS);
  const [mostrarArquivados, setMostrarArquivados] = useState(false);
  const [selecionados, setSelecionados] = useState<ReadonlySet<string>>(new Set());
  const [resultado, setResultado] = useState<string | null>(null);

  const porPauta = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const r of armazem.registros) mapa.set(r.pauta, (mapa.get(r.pauta) ?? 0) + 1);
    return mapa;
  }, [armazem.registros]);

  const porSituacao = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const r of armazem.registros) mapa.set(r.situacao, (mapa.get(r.situacao) ?? 0) + 1);
    return mapa;
  }, [armazem.registros]);

  const filtrados = useMemo(
    () =>
      armazem.ordenados.filter(
        (r) =>
          (pauta === TODAS || r.pauta === pauta) &&
          (situacao === TODAS || r.situacao === situacao) &&
          // Arquivado é suspenso SEM publicadoEm: a combinação que só o arquivamento produz.
          (mostrarArquivados
            ? true
            : !(r.situacao === "suspenso" && r.publicadoEm === null)) &&
          casaComBusca(r, busca),
      ),
    [armazem.ordenados, pauta, situacao, busca, mostrarArquivados],
  );

  const escolhidos = armazem.registros.filter((r) => selecionados.has(r.id));
  const podem = escolhidos.filter((r) => podePublicar(r)).length;
  const noAr = escolhidos.filter((r) => r.situacao === "publicado").length;

  function alternar(id: string) {
    setSelecionados((atual) => {
      const proxima = new Set(atual);
      if (proxima.has(id)) proxima.delete(id);
      else proxima.add(id);
      return proxima;
    });
  }

  return (
    <Folha
      aberta={aberta}
      titulo="Todos os registros"
      descricao={`${armazem.registros.length} neste navegador.`}
      aoFechar={aoFechar}
    >
      <input
        type="search"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="buscar por título"
        className="prod-campo-entrada"
        data-busca-registros
        aria-label="buscar por título"
      />

      {/* Seletores compactos no lugar dos trilhos de chips: dois toques, sem rolagem. */}
      <div className="prod-filtros-linha">
        <select
          value={pauta}
          onChange={(e) => setPauta(e.target.value as Pauta | typeof TODAS)}
          className="prod-campo-entrada"
          data-filtro-pauta-select
          aria-label="filtrar por pauta"
        >
          <option value={TODAS}>Todas as pautas · {armazem.registros.length}</option>
          {PAUTAS.filter((p) => (porPauta.get(p) ?? 0) > 0).map((p) => (
            <option key={p} value={p}>
              {DESCRICAO_DA_PAUTA[p].rotulo} · {porPauta.get(p)}
            </option>
          ))}
        </select>
        <select
          value={situacao}
          onChange={(e) => setSituacao(e.target.value as Situacao | typeof TODAS)}
          className="prod-campo-entrada"
          data-filtro-situacao-select
          aria-label="filtrar por situação"
        >
          <option value={TODAS}>Qualquer situação</option>
          {SITUACOES.filter((s) => (porSituacao.get(s) ?? 0) > 0).map((s) => (
            <option key={s} value={s}>
              {ROTULO_DA_SITUACAO[s]} · {porSituacao.get(s)}
            </option>
          ))}
        </select>
      </div>

      <label className="prod-dimensao">
        <input
          type="checkbox"
          checked={mostrarArquivados}
          onChange={(e) => setMostrarArquivados(e.target.checked)}
          data-mostrar-arquivados
        />
        <span className="prod-dimensao-rotulo">mostrar arquivados</span>
      </label>

      {selecionados.size > 0 ? (
        <div className="prod-massa" data-acoes-em-massa={String(selecionados.size)}>
          <p className="prod-impedimentos-frase">
            {selecionados.size} selecionados · {podem} podem publicar · {noAr} no ar
          </p>
          <div className="prod-registro-acoes">
            <BotaoDoStudio
              curto
              primaria
              desabilitado={podem === 0}
              porQueDesabilitado="Nenhum dos selecionados pode publicar: todos têm impedimento."
              aoClicar={() => {
                let foram = 0;
                for (const id of selecionados) if (armazem.publicar(id)) foram += 1;
                setResultado(
                  foram === selecionados.size
                    ? `${foram} publicados.`
                    : `${foram} de ${selecionados.size} publicados. ${selecionados.size - foram} recusados por impedimento.`,
                );
              }}
              data-acao="publicar-em-massa"
            >
              Publicar
            </BotaoDoStudio>
            <BotaoDoStudio
              curto
              desabilitado={noAr === 0}
              porQueDesabilitado="Nenhum dos selecionados está no ar."
              aoClicar={() => {
                for (const id of selecionados) {
                  armazem.mudarSituacao(id, "suspenso", "Retirado do ar em lote pelo produtor.");
                }
                setResultado(`${noAr} retirados do ar.`);
              }}
              data-acao="despublicar-em-massa"
            >
              Tirar do ar
            </BotaoDoStudio>
            <BotaoDoStudio
              curto
              aoClicar={() => setSelecionados(new Set())}
              data-acao="limpar-selecao"
            >
              Limpar
            </BotaoDoStudio>
          </div>
          {resultado ? (
            <p className="prod-campo-nota" data-resultado-massa role="status">
              {resultado}
            </p>
          ) : null}
        </div>
      ) : null}

      <ul className="prod-lista" data-lista-registros>
        {filtrados.map((r) => {
          const d = DESCRICAO_DA_PAUTA[r.pauta];
          const bloqueiam = impedimentosDe(r).filter((i) => i.bloqueia).length;
          const estaNoAr = r.situacao === "publicado";
          return (
            <li key={r.id}>
              <div
                className="prod-registro"
                data-registro={r.id}
                data-pauta={r.pauta}
                data-selecionado={selecionados.has(r.id) ? "sim" : "nao"}
              >
                <label className="prod-selecao">
                  <input
                    type="checkbox"
                    checked={selecionados.has(r.id)}
                    onChange={() => alternar(r.id)}
                    data-selecionar={r.id}
                    aria-label={`selecionar ${r.titulo || r.id}`}
                  />
                </label>
                {r.imagem?.caminho ? (
                  // eslint-disable-next-line @next/next/no-img-element -- capa local
                  <img src={r.imagem.caminho} alt="" className="prod-capa" loading="lazy" />
                ) : (
                  <span className="prod-capa prod-capa-vazia" aria-hidden />
                )}
                <div className="prod-registro-corpo">
                  <h3 className="prod-registro-titulo">{r.titulo || "(sem título)"}</h3>
                  <div className="prod-registro-meta">
                    <span className="prod-situacao" data-situacao={r.situacao}>
                      {ROTULO_DA_SITUACAO[r.situacao]}
                    </span>
                    <span>{d.rotulo}</span>
                    {bloqueiam > 0 ? (
                      <span data-impedimentos={String(bloqueiam)}>
                        · {bloqueiam} {bloqueiam === 1 ? "impedimento" : "impedimentos"}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="prod-registro-acoes">
                  <BotaoDoStudio
                    curto
                    aoClicar={() => {
                      armazem.escolher(r.id);
                      aoNavegar(d.rota);
                    }}
                    desabilitado={!prontas.has(r.pauta)}
                    porQueDesabilitado={`A ficha de ${d.rotulo} ainda não foi construída.`}
                    data-acao="abrir"
                  >
                    Editar
                  </BotaoDoStudio>
                  {estaNoAr ? (
                    <BotaoDoStudio
                      curto
                      aoClicar={() =>
                        armazem.mudarSituacao(r.id, "suspenso", "Retirado do ar pelo produtor.")
                      }
                      data-acao="despublicar"
                    >
                      Tirar do ar
                    </BotaoDoStudio>
                  ) : (
                    <>
                      <BotaoDoStudio
                        curto
                        aoClicar={() => armazem.publicar(r.id)}
                        desabilitado={bloqueiam > 0}
                        porQueDesabilitado={`${bloqueiam} impedimentos. Abra a ficha para ver quais.`}
                        data-acao="publicar-da-lista"
                      >
                        Publicar
                      </BotaoDoStudio>
                      <BotaoDoStudio
                        curto
                        aoClicar={() =>
                          armazem.alterarId(r.id, {
                            situacao: "suspenso",
                            publicadoEm: null,
                            motivoDaDevolucao: "Arquivado pelo produtor.",
                          })
                        }
                        data-acao="arquivar"
                      >
                        Arquivar
                      </BotaoDoStudio>
                    </>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Folha>
  );
}

// ---------------------------------------------------------------------------
// REINICIAR, com confirmação própria
// ---------------------------------------------------------------------------

function Reiniciar({ aoReiniciar }: { aoReiniciar: () => void }) {
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <button
        type="button"
        className="prod-link"
        onClick={() => setConfirmando(true)}
        data-acao="reiniciar"
      >
        Reiniciar demonstração
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2" data-confirmando-reinicio>
      <p className="prod-nota">
        Isto apaga tudo o que foi escrito nesta sessão e devolve os registros semeados. Não
        há como desfazer.
      </p>
      <div className="flex gap-2">
        <BotaoDoStudio
          curto
          aoClicar={() => {
            aoReiniciar();
            setConfirmando(false);
          }}
          // SEM `primaria`: o Criar da barra flutuante continua à vista, e duas ações
          // laranja na mesma dobra quebram a regra de UMA por tela. Confirmar destrutivo
          // aqui segue a norma da casa (ato-de-declarar e studio-publicar também não o usam).
          data-acao="confirmar-reinicio"
        >
          Apagar e recomeçar
        </BotaoDoStudio>
        <BotaoDoStudio curto aoClicar={() => setConfirmando(false)}>
          Cancelar
        </BotaoDoStudio>
      </div>
    </div>
  );
}

/** Milhar com ponto, sem `toLocaleString`: o export estático exige o mesmo texto no build e no navegador. */
function milhar(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * A última publicação, medida na métrica da PRÓPRIA pauta e lida como uma frase: a capa
 * e o título dizem O QUÊ, um número grande com a variação semanal diz COMO VAI, a curva
 * mostra a forma dos catorze dias, e uma linha de texto entrega o resto (receita e
 * próxima sessão para evento; tempo médio e conclusão para audiovisual). O desenho
 * anterior eram três caixas de KPI e barras soltas, e a revisão a olho o reprovou:
 * caixa dentro de caixa, sem hierarquia, sem contexto. Números autorados e
 * determinísticos (desempenho-produtor.ts), declarados na legenda.
 */
function DesempenhoDaUltima({
  registros,
  dataDeReferencia,
  imagens,
}: {
  registros: Registro[];
  dataDeReferencia: string;
  imagens: ImagemDeAtalho[];
}) {
  const ultima = registros.find((r) => r.situacao === "publicado") ?? null;
  const numeros = useMemo(
    () => (ultima ? desempenhoDe(ultima, dataDeReferencia) : null),
    [ultima, dataDeReferencia],
  );
  if (ultima === null || numeros === null) return null;

  const d = DESCRICAO_DA_PAUTA[ultima.pauta];

  // A capa do próprio registro; sem ela, a imagem que o atalho da pauta já usa.
  const caminhoDaCapa =
    ultima.imagem?.caminho ??
    imagens[PAUTAS.indexOf(ultima.pauta) % Math.max(1, imagens.length)]?.caminho ??
    null;

  const minutosNoAr = ultima.publicadoEm
    ? minutosEntre(`${ultima.publicadoEm.slice(0, 10)}T00:00`, `${dataDeReferencia}T00:00`)
    : null;
  const diasNoAr = minutosNoAr === null ? null : Math.floor(minutosNoAr / 1440);
  const quando =
    diasNoAr === null
      ? ""
      : diasNoAr <= 0
        ? "publicado hoje"
        : diasNoAr === 1
          ? "publicado ontem"
          : `publicado há ${diasNoAr} dias`;

  let numero: number;
  let legenda: string;
  let secundario: string;
  if (numeros.familia === "evento") {
    numero = numeros.ingressos;
    legenda = `ingressos nos últimos ${DIAS_DA_SERIE} dias`;
    const receita = numeros.gratuito
      ? "evento gratuito"
      : numeros.receita === null
        ? "receita a declarar"
        : `${emReais(numeros.receita)} de receita`;
    const proxima = numeros.vigencia
      ? "em cartaz, visita livre"
      : numeros.proximaEmDias === null
        ? "temporada encerrada"
        : numeros.proximaEmDias === 0
          ? "próxima sessão hoje"
          : `próxima sessão em ${numeros.proximaEmDias} ${numeros.proximaEmDias === 1 ? "dia" : "dias"}`;
    secundario = `${receita} · ${proxima}`;
  } else if (numeros.familia === "audiovisual") {
    numero = numeros.plays;
    legenda = `plays nos últimos ${DIAS_DA_SERIE} dias`;
    secundario = `${minutosLegiveis(numeros.tempoMedioMinutos)} de tempo médio · ${numeros.conclusao}% assistem até o fim`;
  } else if (numeros.familia === "leitura") {
    numero = numeros.leituras;
    legenda = `leituras nos últimos ${DIAS_DA_SERIE} dias`;
    secundario = `${minutosLegiveis(numeros.tempoMedioMinutos)} de leitura média · ${numeros.ateOFim}% leem até o fim`;
  } else {
    numero = numeros.vistas;
    legenda = `visualizações nos últimos ${DIAS_DA_SERIE} dias`;
    secundario = `${milhar(numeros.salvos)} salvos · ${milhar(numeros.compartilhamentos)} compartilhados`;
  }

  const delta = variacaoSemanal(numeros.serie);


  return (
    <section className="prod-secao" aria-labelledby="prod-desempenho-titulo">
      <h2 className="prod-secao-titulo" id="prod-desempenho-titulo">
        Desempenho
      </h2>
      <div className="prod-desempenho" data-desempenho-da-ultima={ultima.id}>
        <Link href={d.rota} className="prod-desempenho-cabeca" data-abrir-desempenho>
          {caminhoDaCapa ? (
            // eslint-disable-next-line @next/next/no-img-element -- capa local do acervo
            <img src={caminhoDaCapa} alt="" className="prod-desempenho-capa" />
          ) : null}
          <span className="prod-desempenho-texto">
            <span className="prod-desempenho-meta">
              {d.rotulo}
              {quando ? ` · ${quando}` : ""}
            </span>
            <strong className="prod-desempenho-nome">
              {semTravessao(ultima.titulo) || d.singular}
            </strong>
          </span>
          <span className="prod-desempenho-seta" aria-hidden>
            ▸
          </span>
        </Link>

        <div className="prod-desempenho-numero">
          <strong>{milhar(numero)}</strong>
          <span className="prod-desempenho-delta" data-sobe={delta >= 0 ? "sim" : "nao"}>
            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}% na semana
          </span>
        </div>
        <span className="prod-desempenho-legenda">{legenda}</span>

        <GraficoDaSerie serie={numeros.serie} dataDeReferencia={dataDeReferencia} />

        <p className="prod-desempenho-secundario">{secundario}</p>
        <span className="prod-grafico-legenda" title={DESEMPENHO_E_AUTORADO}>
          números autorados da demonstração
        </span>
      </div>
    </section>
  );
}
