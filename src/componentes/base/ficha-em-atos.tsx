"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { BarraDeAcao, BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { Folha } from "@/componentes/base/folha";

/**
 * base/ficha-em-atos.tsx, o maquinário que as onze fichas reusam.
 *
 * UM ATO POR TELA. Em 370px de largura útil e 824px de altura, um formulário de oito
 * seções vira uma coluna de dois mil pixels: quem preenche perde a noção de quanto falta e
 * o botão de publicar mora num lugar que ninguém alcança sem rolar às cegas. Um ato por
 * tela devolve as duas coisas, o progresso é visível e a ação primária cabe acima da dobra.
 *
 * O TRILHO DE PROGRESSO É A NAVEGAÇÃO, e não um enfeite. Ele mostra `2/8`, deixa saltar
 * para qualquer ato já visitado, e ACENDE em `--cor-acao` conforme os atos fecham, o único
 * uso de laranja da ficha que não é o botão, e é legítimo porque progresso é ação em curso.
 *
 * SAIR NO MEIO NÃO PERDE. Não há botão «salvar»: cada mudança escreve no armazém, e o
 * armazém escreve no `localStorage`. Um formulário que só grava no fim é um formulário que
 * perde o trabalho de quem trocou de aba, e num protótipo que roda numa apresentação,
 * perder o trabalho no meio é perder a apresentação.
 *
 * O ATO ATIVO MORA NA URL? NÃO. Ele mora aqui, em estado de componente, e o motivo é o
 * export estático: uma rota por ato multiplicaria oito páginas por onze pautas, e o
 * `?ato=3` não sobrevive ao `trailingSlash` sem um roteador que este artefato não tem. O
 * preço é que recarregar volta ao primeiro ato, e o preço é aceitável porque o CONTEÚDO
 * não se perde, só a posição.
 */

export const AVISO_NO_AR =
  "Este registro está no ar: toda alteração vale imediatamente para quem estiver lendo, " +
  "e mudar horário, preço, esgotado ou cancelar dispara alerta a quem salvou.";

export interface Ato {
  /** O rótulo do ato, o que o trilho mostra. */
  rotulo: string;
  /** `true` quando este ato está resolvido, é ele que acende o trilho. */
  fechado: boolean;
  /** `false` quando a natureza do registro dispensa este ato (exposição não tem grade). */
  aplicavel?: boolean;
  /** O motivo da dispensa, dito na tela. Dispensa sem motivo parece defeito. */
  porQueDispensado?: string;
  conteudo: ReactNode;
}

export interface PropsFicha {
  /** O nome do que se está escrevendo, «Novo evento», «Episódio de podcast». */
  titulo: string;
  /**
   * `true` quando o registro está publicado.
   *
   * EDITAR O QUE ESTÁ NO AR É DIFERENTE DE EDITAR UM RASCUNHO, e a ficha tem de dizer isso.
   * Num rascunho, escrever é ensaiar; num publicado, cada tecla muda o que alguém pode
   * estar lendo agora. A ficha é a MESMA, abrir uma segunda para o publicado produziria
   * dois formulários para divergir, o que muda é o aviso.
   */
  noAr?: boolean;
  /** Uma linha do que a ficha alimenta. */
  objetivo?: string;
  atos: Ato[];
  /** O que a barra de ação mostra no ÚLTIMO ato. Nos outros ela mostra «Continuar». */
  acaoFinal: ReactNode;
  /** Chamado quando o ato muda, usado para rolar ao topo. */
  aoTrocarDeAto?: (indice: number) => void;
  /** O ato inicial. Usado por quem chega de um link de impedimento. */
  atoInicial?: number;
  /** Fecha a ficha e volta ao início da pauta. Sem ele, a volta é o link para /studio/. */
  aoVoltar?: () => void;
  /** O rótulo da volta quando `aoVoltar` existe, «Agenda», «Play». */
  rotuloDaVolta?: string;
  /**
   * O que fica na COLUNA COLADA da visão web, chave viva, score, impedimentos, prévia.
   *
   * NO APP ELE NÃO EXISTE. Em 370px o que a coluna mostra vive dentro dos atos, e duplicá-lo
   * faria a mesma informação aparecer duas vezes na mesma tela. Em 1440 ela fica à vista o
   * tempo todo, e ficar à vista muda o que a pessoa faz: ela resolve enquanto preenche, em
   * vez de descobrir no fim.
   *
   * A ÁRVORE É A MESMA nas duas visões; quem esconde a coluna é o CSS (D-05).
   */
  colunaColada?: ReactNode;
}

export function FichaEmAtos({
  titulo,
  objetivo,
  atos,
  acaoFinal,
  aoTrocarDeAto,
  atoInicial = 0,
  noAr = false,
  aoVoltar,
  rotuloDaVolta,
  colunaColada,
}: PropsFicha) {
  const aplicaveis = atos.filter((a) => a.aplicavel !== false);
  const [indice, setIndice] = useState(() => Math.min(atoInicial, atos.length - 1));
  const [mostrandoPassos, setMostrandoPassos] = useState(false);

  // Se a natureza do registro mudar e o ato atual deixar de ser aplicável, sair dele. Sem
  // isto, escolher «vigência contínua» no ato 2 deixaria a pessoa presa numa grade de
  // sessões que a própria escolha acabou de dispensar.
  useEffect(() => {
    if (atos[indice]?.aplicavel === false) {
      const proximo = atos.findIndex((a, i) => i > indice && a.aplicavel !== false);
      setIndice(proximo >= 0 ? proximo : Math.max(0, indice - 1));
    }
  }, [atos, indice]);

  function ir(proximo: number) {
    const limitado = Math.max(0, Math.min(proximo, atos.length - 1));
    setIndice(limitado);
    aoTrocarDeAto?.(limitado);
    // O topo da ficha, não o topo do documento: dentro da moldura quem rola é
    // `.moldura-rolagem`, e `window.scrollTo` não a alcança.
    document.querySelector(".moldura-rolagem")?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function anterior() {
    for (let i = indice - 1; i >= 0; i -= 1) {
      if (atos[i]?.aplicavel !== false) return ir(i);
    }
  }

  function proximo() {
    for (let i = indice + 1; i < atos.length; i += 1) {
      if (atos[i]?.aplicavel !== false) return ir(i);
    }
  }

  const atoAtual = atos[indice];
  const ehUltimoAplicavel = !atos.some((a, i) => i > indice && a.aplicavel !== false);
  const posicao = aplicaveis.indexOf(atoAtual as Ato) + 1;

  // A CAMADA E A JANELA existem PARA A WEB: lá a ficha é um POPUP central sobre a
  // tela, com os mesmos passos. No app as duas são `display: contents` e não geram
  // caixa nenhuma: a ficha continua sendo a página, e D-03 continua de pé.
  return (
    <div className="prod-ficha-camada" data-ficha-em-atos>
      <div className="prod-ficha-janela">
      {/* O CABEÇALHO COMPACTO. A revisão a olho reprovou o anterior: kicker, título em
          duas linhas, parágrafo de objetivo, aviso de quatro linhas e um trilho de pontos
          com rótulo ocupavam metade da tela antes do primeiro campo. Agora: uma linha de
          contexto, o título numa linha, e a barra de segmentos. O resto (rótulos dos
          atos, objetivo, aviso completo) mora na FOLHA DE PASSOS, aberta pelo contador. */}
      <header className="prod-cabecalho prod-cabecalho-ficha">
        <div className="prod-cabecalho-linha">
          {aoVoltar ? (
            <button
              type="button"
              className="prod-superficie prod-voltar"
              data-voltar-studio
              onClick={aoVoltar}
            >
              ‹ {rotuloDaVolta ?? "Voltar"}
            </button>
          ) : (
            <Link href="/studio/" className="prod-superficie prod-voltar" data-voltar-studio>
              ‹ Studio
            </Link>
          )}
          <span className="prod-cabecalho-direita">
            {noAr ? (
              <span className="prod-no-ar" data-no-ar role="status" title={AVISO_NO_AR}>
                no ar
              </span>
            ) : null}
            <button
              type="button"
              className="prod-contagem prod-abrir-passos"
              data-progresso={`${posicao}/${aplicaveis.length}`}
              data-abrir-passos
              onClick={() => setMostrandoPassos(true)}
            >
              {posicao} de {aplicaveis.length} ▾
            </button>
          </span>
        </div>
        {/* O TÍTULO É O ATO, não o registro: o título do registro é editável no campo
            «Editando» do primeiro ato, e repeti-lo aqui truncado era ruído. */}
        <h1 className="prod-titulo">{atoAtual?.rotulo}</h1>

        {/* O TRILHO é uma barra de segmentos, um por ato: fechado acende em laranja
            (progresso é ação em curso, o uso legítimo), o atual fica mais alto. Cada
            segmento continua um BOTÃO que salta para o ato. */}
        <nav className="prod-progresso" aria-label={`os ${aplicaveis.length} atos de ${titulo}`}>
          {atos.map((a, i) => {
            if (a.aplicavel === false) return null;
            const n = aplicaveis.indexOf(a) + 1;
            return (
              <button
                key={a.rotulo}
                type="button"
                className="prod-degrau"
                data-ato={String(i)}
                data-atual={i === indice ? "sim" : "nao"}
                data-fechado={a.fechado ? "sim" : "nao"}
                data-passado={n <= posicao ? "sim" : "nao"}
                aria-current={i === indice ? "step" : undefined}
                onClick={() => ir(i)}
                title={a.rotulo}
              >
                <span className="prod-degrau-marca" aria-hidden />
                <span className="prod-degrau-rotulo">{a.rotulo}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <div className="prod-corpo">
        <div className="prod-ficha-duas-colunas">
          <div className="prod-lado-do-ato">
            {/* `key` no índice: é o que faz o React remontar e a animação de entrada rodar
                de novo a cada troca. Sem ela o conteúdo trocaria sem movimento nenhum, e a
                pessoa não teria sinal de que mudou de ato. */}
            <section className="prod-ato" key={indice} aria-label={atoAtual?.rotulo}>
              {atoAtual?.conteudo}
            </section>
          </div>

          {/* A COLUNA COLADA. `display: none` no app, em CSS, não um ramo em JavaScript:
              o conteúdo já sai pronto no artefato estático e não depende de hidratação. */}
          {colunaColada ? (
            <aside className="prod-lado-fixo" data-coluna-colada aria-label="o que falta">
              {colunaColada}
            </aside>
          ) : null}
        </div>
      </div>

      <BarraDeAcao>
        <BotaoDoStudio
          curto
          aoClicar={anterior}
          desabilitado={indice === 0}
          porQueDesabilitado="Este é o primeiro ato."
          data-acao="ato-anterior"
        >
          Voltar
        </BotaoDoStudio>
        {ehUltimoAplicavel ? (
          acaoFinal
        ) : (
          <BotaoDoStudio primaria aoClicar={proximo} data-acao="ato-proximo">
            Continuar
          </BotaoDoStudio>
        )}
      </BarraDeAcao>
      </div>

      {/* A FOLHA DE PASSOS: o mapa da ficha, com rótulo, estado e salto por ato. É para
          onde foi tudo o que disputava espaço no cabeçalho. */}
      <Folha
        aberta={mostrandoPassos}
        titulo="Os passos da ficha"
        descricao={objetivo}
        aoFechar={() => setMostrandoPassos(false)}
      >
        {noAr ? (
          <p className="prod-nota" data-aviso-no-ar>
            {AVISO_NO_AR}
          </p>
        ) : null}
        <ol className="prod-passos">
          {atos.map((a, i) => {
            if (a.aplicavel === false) {
              return (
                <li className="prod-passo" data-dispensado="sim" key={a.rotulo}>
                  <span className="prod-passo-numero" aria-hidden>
                    ·
                  </span>
                  <span className="prod-passo-texto">
                    {a.rotulo}
                    <span className="prod-passo-estado">
                      {a.porQueDispensado ?? "dispensado pela natureza do registro"}
                    </span>
                  </span>
                </li>
              );
            }
            const n = aplicaveis.indexOf(a) + 1;
            return (
              <li key={a.rotulo}>
                <button
                  type="button"
                  className="prod-passo prod-passo-botao"
                  data-ir-para-ato={String(i)}
                  onClick={() => {
                    setMostrandoPassos(false);
                    ir(i);
                  }}
                >
                  <span
                    className="prod-passo-numero"
                    data-fechado={a.fechado ? "sim" : "nao"}
                    aria-hidden
                  >
                    {a.fechado ? "✓" : n}
                  </span>
                  <span className="prod-passo-texto">
                    {a.rotulo}
                    <span className="prod-passo-estado">
                      {i === indice ? "você está aqui" : a.fechado ? "resolvido" : "a fazer"}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </Folha>

    </div>
  );
}

/**
 * O bloco de um campo: rótulo, obrigatoriedade, controle e nota.
 *
 * ELE EXISTE PARA A OBRIGATORIEDADE SER UMA COISA SÓ. Espalhada, ela vira asterisco numa
 * tela, a palavra «obrigatório» noutra, e borda vermelha na terceira, e quem preenche
 * aprende três gramáticas para a mesma informação.
 */
export function Campo({
  rotulo,
  obrigatorio = false,
  nota,
  children,
  htmlFor,
}: {
  rotulo: string;
  obrigatorio?: boolean;
  nota?: ReactNode;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="prod-campo">
      <label className="prod-campo-rotulo" htmlFor={htmlFor}>
        {rotulo}
        {obrigatorio ? <span className="prod-campo-exigido">obrigatório</span> : null}
      </label>
      {children}
      {nota ? <p className="prod-campo-nota">{nota}</p> : null}
    </div>
  );
}
