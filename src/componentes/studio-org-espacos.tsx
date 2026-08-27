"use client";

import { useMemo, useState } from "react";
import { Segmento, OpcaoDeSegmento } from "./base/segmento";
import { FichaDeAcessibilidade } from "./ficha-acessibilidade";
import { EditorDeAcessibilidade } from "./studio-org-acessibilidade";
import { StudioOrgNavegacao } from "./studio-org-navegacao";
import { useOrganizacao } from "./studio-org-estado";
import {
  FRASE_DA_CONVERSAO,
  FRASE_DA_COORDENADA,
  METODO_APOS_ENDERECO,
  PROCEDENCIA_DA_ORGANIZACAO,
  acessibilidadeDeEspacoVazia,
  cadastrado,
  faltasDoEspaco,
} from "@/dados/tipos-organizacao";
import type { AcessibilidadeDeEspaco } from "@/dados/tipos-organizacao";
import type { DeclaracaoDaTela, EspacoDoAcervo, NumerosDosEspacos } from "@/dados/organizacao";
import type { Acessibilidade } from "@/dados/tipos";

/**
 * studio-org-espacos.tsx, O2 · Espaços, a tela da maior conversão de procedência da
 * sessão 6.
 *
 * O QUE ELA EXISTE PARA FAZER. Os 113 espaços do acervo são 100% `derivado`: nenhum vem da
 * fonte. Eles foram INFERIDOS por regra a partir do campo territorial da Enciclopédia, e a
 * coordenada de cada um é um deslocamento em torno da cidade. Esta tela é onde o espaço
 * deixa de ser inferência e passa a ser cadastro, e ela MOSTRA a passagem acontecendo, em
 * vez de só gravar o formulário.
 *
 * TRÊS REGRAS DURAS, e cada uma tem um lugar visível na tela:
 *
 *  1. **A coordenada continua `derivado`.** Não existe campo de latitude, e não é
 *     esquecimento: o tipo `Coordenada` fixa `procedencia: "derivado"` como literal de
 *     string, não como enum. O que o endereço muda é o MÉTODO da derivação, e a tela diz
 *     qual método e por quê.
 *  2. **A ficha de acessibilidade tem ato explícito.** Treze caixas desmarcadas seriam
 *     lidas como «não declarou», e a plataforma se proibiu de interpretar silêncio (§10 da
 *     ontologia). O botão de declarar ausência tem peso igual ao de salvar.
 *  3. **O selo mostra a conversão**, com a procedência de saída e a de chegada lado a lado.
 *
 * DE ONDE VEM CADA COISA. Tudo o que fala do acervo, os 113, os denominadores, as
 * declarações, chega por props, medido no build pelo componente de servidor (DP-F). Tudo
 * o que fala do CONTRATO, as 8 dimensões, os 5 recursos físicos, as frases do ato e da
 * coordenada, é importado por valor de módulos que não tocam em dado. Nenhum número está
 * escrito aqui dentro.
 *
 * SÓ NA VISÃO WEB (D-67). O layout de bastidor esconde o conteúdo inteiro sob `app:hidden`
 * e mostra o aviso de superfície; por isso não há aqui ramo de visão nem media query.
 *
 * REUSO E NÃO CÓPIA, em três camadas. A ficha das 8 dimensões em LEITURA é
 * `FichaDeAcessibilidade`, a mesma do app público, com os três estados de D-43. O EDITOR da
 * ficha é `EditorDeAcessibilidade`, escrito uma vez e compartilhado com a O1, a instituição
 * coleta exatamente os mesmos treze campos, e duas cópias divergiriam na primeira correção.
 * Superfície, painel, campo e botão vêm de `studio.css`, que é da S7.
 */

interface Props {
  espacos: EspacoDoAcervo[];
  numeros: NumerosDosEspacos;
  declaracoes: DeclaracaoDaTela[];
  organizacao: string;
  autor: string;
  gestorEAutorado: string;
  dataDeReferencia: string;
}

type Recorte = "todos" | "derivados" | "cadastrados";

const ROTULO_DO_RECORTE: Record<Recorte, string> = {
  todos: "todos",
  derivados: "ainda derivados",
  cadastrados: "cadastrados",
};

/** A ficha em LEITURA precisa das 8 dimensões separadas dos 5 recursos físicos: o
 *  componente do app público lê `Acessibilidade`, que é só as oito. */
function dimensoesDe(ficha: AcessibilidadeDeEspaco | undefined): Acessibilidade {
  return ficha?.dimensoes ?? acessibilidadeDeEspacoVazia().dimensoes;
}

export function StudioOrgEspacos({
  espacos,
  numeros,
  declaracoes,
  organizacao,
  autor,
  gestorEAutorado,
  dataDeReferencia,
}: Props) {
  const contexto = useMemo(
    () => ({ dataDeReferencia, autor, organizacao }),
    [dataDeReferencia, autor, organizacao],
  );

  const semente = useMemo(() => ({ espacoId: espacos[0]?.id ?? null }), [espacos]);
  const org = useOrganizacao(contexto, semente);

  const [busca, setBusca] = useState("");
  const [recorte, setRecorte] = useState<Recorte>("todos");

  const convertidos = useMemo(
    () => espacos.filter((e) => cadastrado(org.cadastros[e.id])).length,
    [espacos, org.cadastros],
  );

  const lista = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return espacos.filter((e) => {
      const foiCadastrado = cadastrado(org.cadastros[e.id]);
      if (recorte === "derivados" && foiCadastrado) return false;
      if (recorte === "cadastrados" && !foiCadastrado) return false;
      if (termo.length === 0) return true;
      return (
        e.titulo.toLocaleLowerCase("pt-BR").includes(termo) ||
        e.cidade.toLocaleLowerCase("pt-BR").includes(termo) ||
        e.estado.toLocaleLowerCase("pt-BR").includes(termo)
      );
    });
  }, [espacos, org.cadastros, busca, recorte]);

  const atual = espacos.find((e) => e.id === org.atualId) ?? espacos[0] ?? null;
  const cadastro = atual ? org.cadastros[atual.id] : undefined;
  const foiCadastrado = cadastrado(cadastro);
  const ficha = cadastro?.acessibilidade;
  const declarou = ficha?.declarada ?? false;

  return (
    <div className="studio">
      <header className="studio-cabecalho">
        <div className="studio-superficie">
          <p className="studio-rotulo">Studio · Organização · nível 6</p>
          <h1 className="studio-titulo">Espaços</h1>
        </div>
        <p className="studio-objetivo">
          Onde o espaço deixa de ser inferência e passa a ser cadastro. {organizacao} ·{" "}
          {autor} · medido em {dataDeReferencia}.
        </p>
        <p className="studio-nota">{gestorEAutorado}</p>
        <StudioOrgNavegacao ativa="espacos" />
      </header>

      {/* Os denominadores, primeiro. Quem abre a tela precisa saber por que ela existe
          antes de ver o formulário, e o número é o que sustenta a frase. */}
      <section className="studio-painel">
        <h2 className="studio-painel-nome">O estado do acervo, medido</h2>
        <ul className="web-denominadores">
          <li className="web-denominador">
            <span className="web-denominador-numero">
              {numeros.derivados}/{numeros.total}
            </span>
            <span className="web-denominador-rotulo">espaços derivados</span>
          </li>
          <li className="web-denominador">
            <span className="web-denominador-numero">
              {numeros.declaramAcessibilidade}/{numeros.total}
            </span>
            <span className="web-denominador-rotulo">declaram acessibilidade</span>
          </li>
          <li className="web-denominador">
            <span className="web-denominador-numero">
              {numeros.ocorrenciasComEspaco}/{numeros.ocorrencias}
            </span>
            <span className="web-denominador-rotulo">sessões com espaço declarado</span>
          </li>
          <li className="web-denominador">
            <span className="web-denominador-numero">
              {convertidos}/{numeros.total}
            </span>
            <span className="web-denominador-rotulo">convertidos nesta demonstração</span>
          </li>
        </ul>
        {declaracoes.map((d) => (
          <div key={d.titulo} className="web-declaracao">
            <strong>{d.titulo}</strong>
            <span>{d.texto}</span>
          </div>
        ))}
      </section>

      <div className="web-duas-colunas">
        {/* ---------------------------------------------------------------
            Coluna da esquerda: os 113, com o estado de cada um à vista.
            ------------------------------------------------------------ */}
        <section className="studio-painel">
          <div className="studio-painel-cabeca">
            <h2 className="studio-painel-nome">Os {numeros.total} espaços do acervo</h2>
            <span className="studio-pastilha">
              <span className="studio-pastilha-numero">{lista.length}</span> em vista
            </span>
          </div>

          <label className="studio-campo">
            <span className="studio-campo-rotulo">Buscar por nome, cidade ou estado</span>
            <input
              type="search"
              className="studio-campo-entrada"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Ágora Teatro, Salvador, Pará…"
            />
          </label>

          <Segmento rotulo="Recorte da lista">
            {(Object.keys(ROTULO_DO_RECORTE) as Recorte[]).map((r) => (
              <OpcaoDeSegmento
                key={r}
                selecionado={recorte === r}
                onClick={() => setRecorte(r)}
              >
                {ROTULO_DO_RECORTE[r]}
              </OpcaoDeSegmento>
            ))}
          </Segmento>

          {lista.length === 0 ? (
            <p className="studio-nota">
              Nenhum espaço neste recorte. O acervo tem {numeros.total} espaços em{" "}
              {numeros.cidades} lugares distintos, troque o termo ou volte para «todos».
            </p>
          ) : (
            <ul className="web-lista-densa">
              {lista.map((e) => {
                const convertido = cadastrado(org.cadastros[e.id]);
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      className="web-linha studio-botao"
                      aria-pressed={atual?.id === e.id}
                      onClick={() => org.escolher(e.id)}
                    >
                      <span className="web-linha-titulo">{e.titulo}</span>
                      <span className="web-linha-meta">
                        {[e.cidade, e.estado].filter(Boolean).join(" · ")}
                        {", "}
                        {convertido ? "cadastrado" : e.procedencia}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ---------------------------------------------------------------
            Coluna da direita: a ficha e, sempre visível, o que falta.
            ------------------------------------------------------------ */}
        <aside className="org-colada studio-forma">
          {!org.pronto ? (
            <section className="studio-painel">
              <p className="studio-nota">Lendo o cadastro guardado neste navegador…</p>
            </section>
          ) : atual === null ? (
            <section className="studio-painel">
              <p className="studio-nota">O acervo não tem espaço nenhum para cadastrar.</p>
            </section>
          ) : (
            <>
              <section className="studio-painel">
                <div className="studio-painel-cabeca">
                  <h2 className="studio-painel-nome">{atual.titulo}</h2>
                </div>

                {/* O selo da conversão, o argumento da tela em um elemento. */}
                <div className="org-conversao">
                  <span className="org-conversao-de">{atual.procedencia}</span>
                  <span className="org-conversao-seta" aria-hidden="true">
                    →
                  </span>
                  <span className="org-conversao-para">
                    {foiCadastrado ? PROCEDENCIA_DA_ORGANIZACAO : "aguardando cadastro"}
                  </span>
                </div>
                <p className="studio-nota">{FRASE_DA_CONVERSAO}</p>

                {atual.resumo.length > 0 ? (
                  <p className="studio-nota">
                    <span className="studio-rotulo">De onde ele foi inferido</span>{" "}
                    {atual.resumo}
                  </p>
                ) : null}
                {atual.derivadoDe ? (
                  <p className="studio-literal">derivado de {atual.derivadoDe}</p>
                ) : null}

                {/* O RESULTADO, e não o editor: esta é a ficha que o app público mostra
                    para este espaço, com os três estados de D-43. Ela fica AQUI, junto do
                    selo de conversão, e o editor fica no painel de baixo, de propósito.
                    Lado a lado, as duas leituras pareceriam duas fichas concorrentes; a
                    distância entre elas é o que deixa ver a conversão acontecendo, porque
                    marcar uma caixa lá embaixo muda o que este bloco afirma. */}
                <p className="studio-rotulo">Como o app público lê este espaço</p>
                <FichaDeAcessibilidade
                  acessibilidade={dimensoesDe(ficha)}
                  declaraDimensoes={declarou || atual.declaraAcessibilidade}
                  fonteDaDeclaracao={
                    declarou
                      ? `declarado por ${autor}, ${cadastro?.quando ?? dataDeReferencia}`
                      : "o acervo não traz ficha de acessibilidade para espaços"
                  }
                />
              </section>

              {/* A coordenada, e a regra que ela não quebra. */}
              <section className="studio-painel">
                <h2 className="studio-painel-nome">Coordenada</h2>
                {atual.lat !== null && atual.lon !== null ? (
                  <p className="studio-literal">
                    {atual.lat.toFixed(5)}, {atual.lon.toFixed(5)} · método{" "}
                    {foiCadastrado ? METODO_APOS_ENDERECO : (atual.metodoCoordenada ?? "—")} ·
                    procedência derivado
                  </p>
                ) : (
                  <p className="studio-nota">Este espaço não tem coordenada no acervo.</p>
                )}
                <p className="studio-nota">{FRASE_DA_COORDENADA}</p>
              </section>

              {/* O cadastro: o que a organização acrescenta ao que o acervo já diz. */}
              <section className="studio-painel">
                <h2 className="studio-painel-nome">Cadastro</h2>
                <p className="studio-nota">
                  Nome, cidade e estado continuam vindo do acervo e não se editam aqui:
                  reescrevê-los criaria um segundo nome para o mesmo lugar e um par novo na
                  fila de duplicatas. O que esta tela escreve é o que faltava.
                </p>

                <label className="studio-campo">
                  <span className="studio-campo-rotulo">
                    Endereço
                    <em className="studio-campo-exigido">obrigatório</em>
                  </span>
                  <input
                    type="text"
                    className="studio-campo-entrada"
                    value={cadastro?.endereco ?? ""}
                    onChange={(e) => org.alterar(atual.id, { endereco: e.target.value })}
                    placeholder="Rua, número"
                  />
                  <span className="studio-campo-nota">
                    Sem endereço o espaço continua sendo a inferência que já era.
                  </span>
                </label>

                <label className="studio-campo">
                  <span className="studio-campo-rotulo">Bairro</span>
                  <input
                    type="text"
                    className="studio-campo-entrada"
                    value={cadastro?.bairro ?? ""}
                    onChange={(e) => org.alterar(atual.id, { bairro: e.target.value })}
                  />
                </label>

                <label className="studio-campo">
                  <span className="studio-campo-rotulo">Capacidade</span>
                  <input
                    type="number"
                    min={0}
                    className="studio-campo-entrada studio-campo-entrada-curta"
                    value={cadastro?.capacidade ?? ""}
                    onChange={(e) =>
                      org.alterar(atual.id, {
                        capacidade: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                  <span className="studio-campo-nota">
                    Em branco é «não sei». Zero seria «cabe ninguém», que é outra afirmação.
                  </span>
                </label>

                {cadastro ? (
                  <p className="studio-literal">
                    escrito por {cadastro.autor} em {cadastro.quando}
                  </p>
                ) : null}
              </section>

              {/* A ficha de acessibilidade, as 5 do lugar, as 8 de mídia, e o ato. */}
              <section className="studio-painel">
                <h2 className="studio-painel-nome">Acessibilidade do espaço</h2>
                <p className="studio-nota">
                  A ocorrência lê a ficha do espaço: o que for declarado aqui aparece em toda
                  sessão que acontecer neste lugar, sem o produtor redigitar.
                </p>

                <EditorDeAcessibilidade
                  ficha={ficha}
                  aoAlterar={(nova) => org.alterarAcessibilidade(atual.id, nova)}
                  aoDeclararAusencia={() => org.declararSemRecursos(atual.id)}
                />
              </section>

              {/* O que falta, permanente, e é o inverso do cadastro comum. */}
              <section className="studio-painel">
                <h2 className="studio-painel-nome">O que falta neste espaço</h2>
                <ul className="org-falta">
                  {faltasDoEspaco(cadastro, atual.declaraAcessibilidade).map((f) => (
                    <li
                      key={f.texto}
                      className="org-falta-item"
                      data-bloqueia={f.bloqueia ? "sim" : "nao"}
                    >
                      <span>{f.texto}</span>
                      {f.dono ? <span className="org-falta-dono">{f.dono}</span> : null}
                    </li>
                  ))}
                </ul>
              </section>

              <div className="studio-acoes">
                <button type="button" className="studio-botao" onClick={org.reiniciar}>
                  Reiniciar a demonstração
                </button>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
