"use client";

import { useMemo, useState } from "react";
import { EditorDeAcessibilidade } from "./studio-org-acessibilidade";
import { StudioOrgNavegacao } from "./studio-org-navegacao";
import { useOrganizacao } from "./studio-org-estado";
import {
  FORMATOS_DE_MIDIA,
  FRASE_DO_DIREITO,
  POR_QUE_OFFLINE_IMPORTA,
  ROTULO_DO_FORMATO,
  acessibilidadeDeEspacoVazia,
  direitoVazio,
  faltasDaMidia,
  fichaTecnicaVazia,
  midiaPublica,
} from "@/dados/tipos-organizacao";
import type { FormatoDeMidia } from "@/dados/tipos-organizacao";
import type { DeclaracaoDaTela, MidiaDoAcervo, NumerosDasMidias } from "@/dados/organizacao";

/**
 * studio-org-midia.tsx, O5 · Mídia (funcionalidades 147 e 148): o acervo de ativos, com
 * direito declarado.
 *
 * ELA ABRE PELA FILA, E NÃO PELO CATÁLOGO. Das 529 mídias, 9 têm imagem e não têm crédito,
 * e crédito é bloqueante, então essas 9 não publicam. A lista vem ordenada com elas em
 * primeiro lugar, e isso é decisão e não acaso: uma fila de trabalho que abre no meio da
 * ordem alfabética não é uma fila, é um catálogo com um aviso em cima.
 *
 * O NÚMERO MAIS DURO DA TELA. As 529 mídias DECLARAM a ficha de acessibilidade, o ato foi
 * feito em 100% do acervo, e mesmo assim sete das oito dimensões estão em ZERO itens:
 * audiodescrição, legenda descritiva, closed caption, legenda aberta, tradução simultânea,
 * estenotipia e legenda. Só Libras aparece, em três. **Ficha preenchida não é ficha
 * atendida**, e a distância entre as duas coisas é o que esta tela existe para encurtar.
 *
 * DUAS FORMAS NOVAS, E A SEGUNDA REPETE UMA REGRA DE PROPÓSITO. A ficha técnica destrava o
 * player com retomada (26); o direito de distribuição destrava o download e o modo offline
 * (30). E o direito tem `declarado` pela MESMA razão que a acessibilidade tem: dois
 * booleanos em `false` significam «não permite» e «ninguém declarou» ao mesmo tempo, e
 * distribuir um ativo porque ninguém disse que não seria a leitura mais cara possível de um
 * silêncio.
 *
 * CATEGORIA NÃO É FORMATO, e a tela não confunde as duas. Mapear «podcasts → áudio»
 * preencheria 336 itens de uma vez e seria uma inferência apresentada como declaração.
 *
 * SÓ NA VISÃO WEB (D-67).
 */

interface Props {
  midias: MidiaDoAcervo[];
  numeros: NumerosDasMidias;
  declaracoes: DeclaracaoDaTela[];
  organizacao: string;
  autor: string;
  gestorEAutorado: string;
  dataDeReferencia: string;
}

type Recorte = "fila" | "todas";

export function StudioOrgMidia({
  midias,
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
  const semente = useMemo(() => ({ midiaId: midias[0]?.id ?? null }), [midias]);
  const org = useOrganizacao(contexto, semente);

  const [recorte, setRecorte] = useState<Recorte>("fila");
  const [busca, setBusca] = useState("");
  const [capituloTitulo, setCapituloTitulo] = useState("");
  const [capituloInicio, setCapituloInicio] = useState("");

  const naFila = useMemo(
    () => midias.filter((m) => !midiaPublica(m.creditoImagem, org.midias[m.id])),
    [midias, org.midias],
  );

  const lista = useMemo(() => {
    const base = recorte === "fila" ? naFila : midias;
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    if (termo.length === 0) return base;
    return base.filter(
      (m) =>
        m.titulo.toLocaleLowerCase("pt-BR").includes(termo) ||
        m.categoria.toLocaleLowerCase("pt-BR").includes(termo),
    );
  }, [recorte, naFila, midias, busca]);

  const atual = midias.find((m) => m.id === org.atualMidiaId) ?? midias[0] ?? null;
  const cadastro = atual ? org.midias[atual.id] : undefined;
  const ficha = cadastro?.fichaTecnica ?? fichaTecnicaVazia();
  const direito = cadastro?.direito ?? direitoVazio();
  const publica = atual ? midiaPublica(atual.creditoImagem, cadastro) : false;

  return (
    <div className="studio">
      <header className="studio-cabecalho">
        <div className="studio-superficie">
          <p className="studio-rotulo">Studio · Organização · nível 6</p>
          <h1 className="studio-titulo">Mídia</h1>
        </div>
        <p className="studio-objetivo">
          O acervo de ativos, com o crédito como campo bloqueante. {organizacao} · {autor} ·
          medido em {dataDeReferencia}.
        </p>
        <p className="studio-nota">{gestorEAutorado}</p>
        <StudioOrgNavegacao ativa="midia" />
      </header>

      <section className="studio-painel">
        <h2 className="studio-painel-nome">O estado do acervo, medido</h2>
        <ul className="web-denominadores">
          <li className="web-denominador">
            <span className="web-denominador-numero">
              {numeros.comCredito}/{numeros.total}
            </span>
            <span className="web-denominador-rotulo">com crédito</span>
          </li>
          <li className="web-denominador">
            <span className="web-denominador-numero">{naFila.length}</span>
            <span className="web-denominador-rotulo">na fila, sem publicar</span>
          </li>
          <li className="web-denominador">
            <span className="web-denominador-numero">
              {numeros.declaramAcessibilidade}/{numeros.total}
            </span>
            <span className="web-denominador-rotulo">declaram a ficha</span>
          </li>
          <li className="web-denominador">
            <span className="web-denominador-numero">
              {numeros.comImagemAlt}/{numeros.total}
            </span>
            <span className="web-denominador-rotulo">com descrição alternativa</span>
          </li>
        </ul>

        {/* As 8 dimensões medidas no acervo. É o número mais duro da sessão, e ele merece
            ficar no topo em vez de virar nota de rodapé de uma ficha. */}
        <div>
          <p className="studio-rotulo">As 8 dimensões, contadas nos {numeros.total} itens</p>
          <ul className="org-caixas">
            {numeros.porDimensao.map((d) => (
              <li
                key={d.chave}
                className="org-caixa"
                data-estado={d.quantos > 0 ? "oferece" : "declarado-ausente"}
              >
                <span>
                  {d.rotulo}, {d.quantos}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {declaracoes.map((d) => (
          <div key={d.titulo} className="web-declaracao">
            <strong>{d.titulo}</strong>
            <span>{d.texto}</span>
          </div>
        ))}
      </section>

      {!org.pronto ? (
        <section className="studio-painel">
          <p className="studio-nota">Lendo o acervo guardado neste navegador…</p>
        </section>
      ) : atual === null ? (
        <section className="studio-painel">
          <p className="studio-nota">O acervo não tem mídia nenhuma.</p>
        </section>
      ) : (
        <div className="web-duas-colunas">
          {/* ---------------- A grade, à esquerda ---------------- */}
          <section className="studio-painel">
            <div className="studio-painel-cabeca">
              <h2 className="studio-painel-nome">
                {recorte === "fila" ? "A fila do crédito" : `As ${numeros.total} mídias`}
              </h2>
              <span className="studio-pastilha">
                <span className="studio-pastilha-numero">{lista.length}</span> em vista
              </span>
            </div>

            <div className="studio-acoes">
              <button
                type="button"
                className={recorte === "fila" ? "studio-botao studio-botao-primario" : "studio-botao"}
                onClick={() => setRecorte("fila")}
              >
                Só as que não publicam ({naFila.length})
              </button>
              <button
                type="button"
                className={recorte === "todas" ? "studio-botao studio-botao-primario" : "studio-botao"}
                onClick={() => setRecorte("todas")}
              >
                Todas ({numeros.total})
              </button>
            </div>

            <label className="studio-campo">
              <span className="studio-campo-rotulo">Buscar por título ou categoria</span>
              <input
                type="search"
                className="studio-campo-entrada"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="podcasts, séries, Paiol Literário…"
              />
            </label>

            {lista.length === 0 ? (
              <p className="studio-nota">
                {recorte === "fila"
                  ? "A fila esvaziou: todas as mídias em vista têm crédito e publicam."
                  : "Nenhuma mídia neste termo."}
              </p>
            ) : (
              <ul className="web-lista-densa">
                {lista.slice(0, 120).map((m) => {
                  const ok = midiaPublica(m.creditoImagem, org.midias[m.id]);
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        className="web-linha studio-botao"
                        aria-pressed={atual.id === m.id}
                        onClick={() => org.escolherMidia(m.id)}
                      >
                        <span className="web-linha-titulo">{m.titulo}</span>
                        <span className="web-linha-meta">
                          {m.categoria} · {ok ? "publica" : "sem crédito, não publica"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {lista.length > 120 ? (
              <p className="studio-campo-nota">
                Mostrando 120 de {lista.length}. O corte é da lista, não do acervo, refine a
                busca para chegar nas outras {lista.length - 120}.
              </p>
            ) : null}
          </section>

          {/* -------- Ficha técnica e direitos, à direita -------- */}
          <aside className="org-colada studio-forma">
            <section className="studio-painel">
              <div className="studio-painel-cabeca">
                <h2 className="studio-painel-nome">{atual.titulo}</h2>
                <span
                  className={publica ? "studio-pastilha" : "studio-pastilha studio-pastilha-marca"}
                >
                  {publica ? "publica" : "não publica"}
                </span>
              </div>
              {atual.resumo.length > 0 ? <p className="studio-nota">{atual.resumo}</p> : null}
              <p className="studio-literal">
                {atual.categoria}
                {atual.publicadoEm ? ` · publicado em ${atual.publicadoEm}` : ""}
                {atual.linguagens.length > 0 ? ` · ${atual.linguagens.join(", ")}` : ""}
              </p>

              {atual.creditoImagem ? (
                <p className="studio-nota">
                  <span className="studio-rotulo">Crédito do acervo</span> {atual.creditoImagem}
                </p>
              ) : (
                <label className="studio-campo">
                  <span className="studio-campo-rotulo">
                    Crédito
                    <em className="studio-campo-exigido">bloqueante</em>
                  </span>
                  <input
                    type="text"
                    className="studio-campo-entrada"
                    value={cadastro?.creditoImagem ?? ""}
                    onChange={(e) => org.creditar(atual.id, e.target.value)}
                    placeholder="Foto de …"
                  />
                  <span className="studio-campo-nota">
                    Esta é uma das {numeros.semCredito} mídias sem crédito no acervo. Enquanto
                    o campo estiver vazio, ela não publica.
                  </span>
                </label>
              )}

              {atual.imagemAlt ? (
                <p className="studio-campo-nota">
                  <span className="studio-rotulo">Descrição alternativa</span> {atual.imagemAlt}
                </p>
              ) : (
                <p className="studio-campo-nota">
                  Sem descrição alternativa da imagem, leitor de tela não lê esta capa. São{" "}
                  {numeros.total - numeros.comImagemAlt} assim no acervo.
                </p>
              )}
            </section>

            <section className="studio-painel">
              <h2 className="studio-painel-nome">Ficha técnica</h2>
              <p className="studio-nota">
                Sem duração não há barra de progresso honesta, e sem capítulo não há retomada
                que signifique alguma coisa: retomar aos 43% de um podcast de duas horas é
                retomar no meio de uma frase.
              </p>

              <label className="studio-campo">
                <span className="studio-campo-rotulo">Duração</span>
                <input
                  type="text"
                  className="studio-campo-entrada studio-campo-entrada-curta"
                  value={ficha.duracao}
                  onChange={(e) =>
                    org.alterarFichaTecnica(atual.id, { ...ficha, duracao: e.target.value })
                  }
                  placeholder="01:12:30"
                />
              </label>

              <label className="studio-campo">
                <span className="studio-campo-rotulo">Formato</span>
                <select
                  className="studio-campo-entrada studio-campo-entrada-curta"
                  value={ficha.formato ?? ""}
                  onChange={(e) =>
                    org.alterarFichaTecnica(atual.id, {
                      ...ficha,
                      formato: e.target.value === "" ? null : (e.target.value as FormatoDeMidia),
                    })
                  }
                >
                  <option value="">não declarado</option>
                  {FORMATOS_DE_MIDIA.map((f) => (
                    <option key={f} value={f}>
                      {ROTULO_DO_FORMATO[f]}
                    </option>
                  ))}
                </select>
                <span className="studio-campo-nota">
                  O acervo publica «{atual.categoria}», que é ONDE o item está e não o que ele
                  é. O formato é declaração, e por isso abre em «não declarado».
                </span>
              </label>

              <div>
                <p className="studio-rotulo">Capítulos ({ficha.capitulos.length})</p>
                {ficha.capitulos.length > 0 ? (
                  <ul className="org-falta">
                    {ficha.capitulos.map((c, i) => (
                      <li key={`${c.inicio}-${i}`} className="org-falta-item" data-bloqueia="nao">
                        <span>
                          {c.inicio}, {c.titulo}
                        </span>
                        <button
                          type="button"
                          className="studio-botao"
                          onClick={() =>
                            org.alterarFichaTecnica(atual.id, {
                              ...ficha,
                              capitulos: ficha.capitulos.filter((_, j) => j !== i),
                            })
                          }
                        >
                          remover
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <label className="studio-campo">
                  <span className="studio-campo-rotulo">Novo capítulo</span>
                  <input
                    type="text"
                    className="studio-campo-entrada studio-campo-entrada-curta"
                    value={capituloInicio}
                    onChange={(e) => setCapituloInicio(e.target.value)}
                    placeholder="12:30"
                  />
                  <input
                    type="text"
                    className="studio-campo-entrada"
                    value={capituloTitulo}
                    onChange={(e) => setCapituloTitulo(e.target.value)}
                    placeholder="Título do capítulo"
                  />
                </label>
                <div className="studio-acoes">
                  <button
                    type="button"
                    className="studio-botao"
                    disabled={capituloInicio.trim() === "" || capituloTitulo.trim() === ""}
                    onClick={() => {
                      org.alterarFichaTecnica(atual.id, {
                        ...ficha,
                        capitulos: [
                          ...ficha.capitulos,
                          { inicio: capituloInicio.trim(), titulo: capituloTitulo.trim() },
                        ],
                      });
                      setCapituloInicio("");
                      setCapituloTitulo("");
                    }}
                  >
                    Acrescentar capítulo
                  </button>
                </div>
              </div>
            </section>

            <section className="studio-painel">
              <h2 className="studio-painel-nome">Direito de distribuição</h2>
              <p className="studio-nota">{FRASE_DO_DIREITO}</p>
              <p className="studio-campo-nota">{POR_QUE_OFFLINE_IMPORTA}</p>

              <label className="studio-campo">
                <span className="studio-campo-rotulo">Quem detém o direito</span>
                <input
                  type="text"
                  className="studio-campo-entrada"
                  value={direito.titular}
                  onChange={(e) =>
                    org.alterarDireito(atual.id, { ...direito, titular: e.target.value })
                  }
                />
              </label>

              <ul className="org-caixas">
                <li
                  className="org-caixa"
                  data-estado={
                    direito.permiteOffline
                      ? "oferece"
                      : direito.declarado
                        ? "declarado-ausente"
                        : "nao-declarado"
                  }
                >
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={direito.permiteOffline}
                      onChange={(e) =>
                        org.alterarDireito(atual.id, {
                          ...direito,
                          permiteOffline: e.target.checked,
                        })
                      }
                    />
                    permite baixar e ouvir offline
                  </label>
                </li>
                <li
                  className="org-caixa"
                  data-estado={
                    direito.permiteIncorporar
                      ? "oferece"
                      : direito.declarado
                        ? "declarado-ausente"
                        : "nao-declarado"
                  }
                >
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={direito.permiteIncorporar}
                      onChange={(e) =>
                        org.alterarDireito(atual.id, {
                          ...direito,
                          permiteIncorporar: e.target.checked,
                        })
                      }
                    />
                    permite incorporar em outro site
                  </label>
                </li>
              </ul>

              <div className="org-ato" data-declarado={direito.declarado ? "sim" : "nao"}>
                <span className="org-ato-texto">
                  {direito.declarado
                    ? direito.permiteOffline || direito.permiteIncorporar
                      ? "Direito declarado, com permissões marcadas."
                      : "Declarado: este item não permite nenhuma das duas."
                    : "Sem declaração, «false» significaria «não permite» e «ninguém disse» ao mesmo tempo. O item não baixa."}
                </span>
                <button
                  type="button"
                  className="studio-botao studio-botao-primario"
                  onClick={() => org.declararSemDireito(atual.id)}
                >
                  Declaro que não permite nenhuma das duas.
                </button>
              </div>
            </section>

            <section className="studio-painel">
              <h2 className="studio-painel-nome">Acessibilidade do ativo</h2>
              <p className="studio-nota">
                Só as oito. Os cinco recursos do lugar não aparecem aqui, e a ausência é
                deliberada: rampa e elevador são atributos de um lugar onde se entra, e um
                podcast não é um lugar. Caixa marcável que não se aplica é convite para
                alguém marcá-la.
              </p>
              <EditorDeAcessibilidade
                mostrarFisicos={false}
                ficha={cadastro?.acessibilidade}
                aoAlterar={(nova) => org.alterarAcessibilidadeDaMidia(atual.id, nova)}
                aoDeclararAusencia={() =>
                  org.alterarAcessibilidadeDaMidia(atual.id, {
                    ...acessibilidadeDeEspacoVazia(),
                    declarada: true,
                  })
                }
              />
            </section>

            <section className="studio-painel">
              <h2 className="studio-painel-nome">O que falta neste ativo</h2>
              <ul className="org-falta">
                {faltasDaMidia(atual.creditoImagem, cadastro).map((f) => (
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

            {cadastro ? (
              <p className="studio-literal">
                escrito por {cadastro.autor} em {cadastro.quando}
              </p>
            ) : null}
          </aside>
        </div>
      )}
    </div>
  );
}
