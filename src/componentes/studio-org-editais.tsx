"use client";

import { useMemo, useState } from "react";
import { StudioOrgNavegacao } from "./studio-org-navegacao";
import { useOrganizacao } from "./studio-org-estado";
import {
  EDITAL_E_FORMA_NOVA,
  ESTADOS_DO_EDITAL,
  EXPLICACAO_DO_EDITAL,
  ROTULO_DO_EDITAL,
  casaComPerfil,
  faltasDoEdital,
} from "@/dados/tipos-organizacao";
import type { EstadoDoEdital } from "@/dados/tipos-organizacao";
import type { DeclaracaoDaTela, VocabularioDoEdital } from "@/dados/organizacao";

/**
 * studio-org-editais.tsx, O6 · Editais e oportunidades (funcionalidades 46, 48 e 49).
 *
 * A FUNCIONALIDADE QUE NÃO TINHA CLASSE NEM MÓDULO. Um grep por edital em `src/dados/` não
 * retorna nada, e três funcionalidades do catálogo o pressupõem no grafo: o produtor RECEBE
 * alerta de edital compatível, e nunca existiu quem publica. A forma foi criada antes da
 * tela, por extensão aditiva, `tipos.ts` não foi tocado, e edital não foi forçado dentro de
 * `formacao` nem de `programa`, que não carregam prazo, critério estruturado nem estado de
 * julgamento.
 *
 * OS CRITÉRIOS SÃO DADO, E É ISSO QUE FAZ O CASAMENTO EXISTIR. «Edital para dança no Pará»
 * só encontra quem faz dança no Pará se «dança» e «Pará» forem valores de vocabulário dos
 * dois lados. Um campo de texto com «voltado a companhias de dança da região Norte» é
 * legível para uma pessoa e mudo para o sistema. A tela tem um painel que roda o casamento
 * ao vivo contra um perfil, porque a alegação «isto casa com o perfil do produtor» precisa
 * ser demonstrável e não afirmada.
 *
 * CRITÉRIO VAZIO É «SERVE PARA TODOS». Um edital sem recorte de território é nacional, e
 * tratá-lo como sem correspondência esconderia dele exatamente quem ele quer alcançar.
 *
 * E A LISTA DE TERRITÓRIOS TEM AS 27, NÃO AS 25 DO ACERVO. Um edital que não pode mirar
 * Sergipe e Tocantins é o mecanismo exato pelo qual o deserto se perpetua, e a tela marca
 * quais das 27 o acervo ainda não cobre.
 *
 * SÓ NA VISÃO WEB (D-67).
 */

interface Props {
  vocabulario: VocabularioDoEdital;
  declaracoes: DeclaracaoDaTela[];
  organizacao: string;
  autor: string;
  gestorEAutorado: string;
  dataDeReferencia: string;
}

export function StudioOrgEditais({
  vocabulario,
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
  const semente = useMemo(() => ({}), []);
  const org = useOrganizacao(contexto, semente);

  const [titulo, setTitulo] = useState("");
  const [proponente, setProponente] = useState("");
  const [perfilTerritorio, setPerfilTerritorio] = useState(vocabulario.territorios[0]?.nome ?? "");
  const [perfilLinguagem, setPerfilLinguagem] = useState(vocabulario.linguagens[0]?.id ?? "");

  const atual = org.editais.find((e) => e.id === org.atualEditalId) ?? org.editais[0] ?? null;
  const perfil = useMemo(
    () => ({ territorio: perfilTerritorio, linguagem: perfilLinguagem }),
    [perfilTerritorio, perfilLinguagem],
  );
  const casamento = atual ? casaComPerfil(atual, perfil) : null;
  const casaInteiro = casamento?.territorioCasa === true && casamento?.linguagemCasa === true;

  const rotuloDaLinguagem = (id: string) =>
    vocabulario.linguagens.find((l) => l.id === id)?.rotulo ?? id;

  return (
    <div className="studio">
      <header className="studio-cabecalho">
        <div className="studio-superficie">
          <p className="studio-rotulo">Studio · Organização · nível 6</p>
          <h1 className="studio-titulo">Editais e oportunidades</h1>
        </div>
        <p className="studio-objetivo">
          A funcionalidade que não tinha classe nem módulo. {organizacao} · {autor} ·{" "}
          {dataDeReferencia}.
        </p>
        <p className="studio-nota">{gestorEAutorado}</p>
        <StudioOrgNavegacao ativa="editais" />
      </header>

      <section className="studio-painel">
        <h2 className="studio-painel-nome">A forma antes da tela</h2>
        <p className="studio-nota">{EDITAL_E_FORMA_NOVA}</p>
        <ul className="web-denominadores">
          <li className="web-denominador">
            <span className="web-denominador-numero">{org.editais.length}</span>
            <span className="web-denominador-rotulo">editais nesta demonstração</span>
          </li>
          <li className="web-denominador">
            <span className="web-denominador-numero">{vocabulario.linguagens.length}</span>
            <span className="web-denominador-rotulo">linguagens de critério</span>
          </li>
          <li className="web-denominador">
            <span className="web-denominador-numero">
              {vocabulario.territorios.filter((t) => t.noAcervo).length}/27
            </span>
            <span className="web-denominador-rotulo">UFs com acervo</span>
          </li>
          <li className="web-denominador">
            <span className="web-denominador-numero">
              {org.editais.reduce((s, e) => s + e.inscricoes.length, 0)}
            </span>
            <span className="web-denominador-rotulo">inscrições recebidas</span>
          </li>
        </ul>
        {declaracoes.map((d) => (
          <div key={d.titulo} className="web-declaracao">
            <strong>{d.titulo}</strong>
            <span>{d.texto}</span>
          </div>
        ))}
      </section>

      {!org.pronto ? (
        <section className="studio-painel">
          <p className="studio-nota">Lendo os editais guardados neste navegador…</p>
        </section>
      ) : (
        <div className="web-duas-colunas">
          {/* -------- Editais e critérios, à esquerda -------- */}
          <div className="studio-forma">
            <section className="studio-painel">
              <h2 className="studio-painel-nome">Abrir edital</h2>
              <label className="studio-campo">
                <span className="studio-campo-rotulo">
                  Título
                  <em className="studio-campo-exigido">obrigatório</em>
                </span>
                <input
                  type="text"
                  className="studio-campo-entrada"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Rumos 2026, Chamamento audiovisual…"
                />
              </label>
              <div className="studio-acoes">
                <button
                  type="button"
                  className="studio-botao studio-botao-primario"
                  disabled={titulo.trim().length === 0}
                  onClick={() => {
                    org.criarEdital(titulo.trim());
                    setTitulo("");
                  }}
                >
                  Abrir
                </button>
              </div>
            </section>

            {org.editais.length > 0 ? (
              <section className="studio-painel">
                <h2 className="studio-painel-nome">Editais desta organização</h2>
                <ul className="web-lista-densa">
                  {org.editais.map((e) => (
                    <li key={e.id}>
                      <button
                        type="button"
                        className="web-linha studio-botao"
                        aria-pressed={atual?.id === e.id}
                        onClick={() => org.escolherEdital(e.id)}
                      >
                        <span className="web-linha-titulo">{e.titulo}</span>
                        <span className="web-linha-meta">
                          {ROTULO_DO_EDITAL[e.estado]} · {e.inscricoes.length} inscrição(ões) ·{" "}
                          {e.linguagens.length + e.territorios.length} critério(s)
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {atual ? (
              <>
                <section className="studio-painel">
                  <div className="studio-painel-cabeca">
                    <h2 className="studio-painel-nome">{atual.titulo}</h2>
                    <span className="studio-pastilha studio-pastilha-marca">
                      {ROTULO_DO_EDITAL[atual.estado]}
                    </span>
                  </div>
                  <p className="studio-nota">{EXPLICACAO_DO_EDITAL[atual.estado]}</p>

                  <label className="studio-campo">
                    <span className="studio-campo-rotulo">Resumo</span>
                    <textarea
                      className="studio-campo-entrada"
                      rows={2}
                      value={atual.resumo}
                      onChange={(e) => org.alterarEdital(atual.id, { resumo: e.target.value })}
                    />
                  </label>
                  <label className="studio-campo">
                    <span className="studio-campo-rotulo">
                      Prazo
                      <em className="studio-campo-exigido">obrigatório</em>
                    </span>
                    <input
                      type="text"
                      className="studio-campo-entrada studio-campo-entrada-curta"
                      value={atual.prazo}
                      onChange={(e) => org.alterarEdital(atual.id, { prazo: e.target.value })}
                      placeholder="30.09.2026"
                    />
                  </label>
                  <label className="studio-campo">
                    <span className="studio-campo-rotulo">Público-alvo</span>
                    <input
                      type="text"
                      className="studio-campo-entrada"
                      value={atual.publicoAlvo}
                      onChange={(e) => org.alterarEdital(atual.id, { publicoAlvo: e.target.value })}
                      placeholder="Coletivos com pelo menos dois anos de atuação"
                    />
                  </label>

                  <div className="studio-acoes">
                    {ESTADOS_DO_EDITAL.map((e) => (
                      <button
                        key={e}
                        type="button"
                        className={
                          atual.estado === e ? "studio-botao studio-botao-primario" : "studio-botao"
                        }
                        onClick={() => org.mudarEstadoDoEdital(atual.id, e as EstadoDoEdital)}
                      >
                        {ROTULO_DO_EDITAL[e]}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="studio-painel">
                  <h2 className="studio-painel-nome">Critérios, como dado</h2>
                  <p className="studio-nota">
                    Estes são os valores que o alerta de edital compatível compara. Nenhum
                    critério marcado significa «serve para todos», e não «não serve para
                    ninguém».
                  </p>

                  <div>
                    <p className="studio-rotulo">
                      Linguagem ({atual.linguagens.length} de {vocabulario.linguagens.length})
                    </p>
                    <ul className="org-caixas">
                      {vocabulario.linguagens.map((l) => (
                        <li
                          key={l.id}
                          className="org-caixa"
                          data-estado={
                            atual.linguagens.includes(l.id) ? "oferece" : "declarado-ausente"
                          }
                        >
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={atual.linguagens.includes(l.id)}
                              onChange={() => org.alternarCriterio(atual.id, "linguagens", l.id)}
                            />
                            {l.rotulo}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="studio-rotulo">
                      Território ({atual.territorios.length} de 27)
                    </p>
                    <ul className="org-caixas">
                      {vocabulario.territorios.map((t) => (
                        <li
                          key={t.nome}
                          className="org-caixa"
                          data-estado={
                            atual.territorios.includes(t.nome)
                              ? "oferece"
                              : t.noAcervo
                                ? "declarado-ausente"
                                : "nao-declarado"
                          }
                        >
                          <label
                            className="flex items-center gap-2"
                            title={
                              t.noAcervo
                                ? "o acervo já tem registro nesta UF"
                                : "o acervo ainda não tem nenhum registro nesta UF"
                            }
                          >
                            <input
                              type="checkbox"
                              checked={atual.territorios.includes(t.nome)}
                              onChange={() => org.alternarCriterio(atual.id, "territorios", t.nome)}
                            />
                            {t.nome}
                            {t.noAcervo ? "" : ", sem acervo"}
                          </label>
                        </li>
                      ))}
                    </ul>
                    <p className="studio-campo-nota">
                      As 27 aparecem, e não as{" "}
                      {vocabulario.territorios.filter((t) => t.noAcervo).length} que o acervo
                      cobre. Faltam {vocabulario.ufsAusentes.join(" e ")}, e um edital que não
                      pode mirar onde não há acervo é o mecanismo exato pelo qual o deserto se
                      perpetua.
                    </p>
                  </div>
                </section>
              </>
            ) : null}
          </div>

          {/* -------- Casamento e inscritos, à direita -------- */}
          <aside className="org-colada studio-forma">
            {atual === null ? (
              <section className="studio-painel">
                <p className="studio-nota">
                  Nenhum edital aberto ainda. A lista começa vazia porque a classe não existe
                  no acervo, e não porque a tela é nova.
                </p>
              </section>
            ) : (
              <>
                <section className="studio-painel">
                  <div className="studio-painel-cabeca">
                    <h2 className="studio-painel-nome">Casamento com um perfil</h2>
                    <span
                      className={
                        casaInteiro
                          ? "studio-pastilha studio-pastilha-marca"
                          : "studio-pastilha"
                      }
                    >
                      {casaInteiro ? "casa" : "não casa"}
                    </span>
                  </div>
                  <p className="studio-nota">
                    A alegação «isto casa com o perfil do produtor» precisa ser demonstrável, e
                    não afirmada. Escolha um perfil e veja o critério responder.
                  </p>
                  <label className="studio-campo">
                    <span className="studio-campo-rotulo">Território do proponente</span>
                    <select
                      className="studio-campo-entrada studio-campo-entrada-curta"
                      value={perfilTerritorio}
                      onChange={(e) => setPerfilTerritorio(e.target.value)}
                    >
                      {vocabulario.territorios.map((t) => (
                        <option key={t.nome} value={t.nome}>
                          {t.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="studio-campo">
                    <span className="studio-campo-rotulo">Linguagem do proponente</span>
                    <select
                      className="studio-campo-entrada studio-campo-entrada-curta"
                      value={perfilLinguagem}
                      onChange={(e) => setPerfilLinguagem(e.target.value)}
                    >
                      {vocabulario.linguagens.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.rotulo}
                        </option>
                      ))}
                    </select>
                  </label>
                  {casamento ? (
                    <ul className="org-caixas">
                      <li
                        className="org-caixa"
                        data-estado={casamento.territorioCasa ? "oferece" : "declarado-ausente"}
                      >
                        <span>
                          território{" "}
                          {casamento.territorioAberto
                            ? ", sem recorte, serve para todos"
                            : casamento.territorioCasa
                              ? ", casa"
                              : ", fora do recorte"}
                        </span>
                      </li>
                      <li
                        className="org-caixa"
                        data-estado={casamento.linguagemCasa ? "oferece" : "declarado-ausente"}
                      >
                        <span>
                          linguagem{" "}
                          {casamento.linguagemAberto
                            ? ", sem recorte, serve para todos"
                            : casamento.linguagemCasa
                              ? ", casa"
                              : ", fora do recorte"}
                        </span>
                      </li>
                    </ul>
                  ) : null}
                </section>

                <section className="studio-painel">
                  <div className="studio-painel-cabeca">
                    <h2 className="studio-painel-nome">Inscritos</h2>
                    <span className="studio-pastilha">
                      <span className="studio-pastilha-numero">{atual.inscricoes.length}</span>{" "}
                      inscrições
                    </span>
                  </div>
                  <p className="studio-nota">
                    Quem se inscreve entra no grafo como agente proposto e passa por
                    reconciliação na moderação. É o funil que a proposta descreve, e ele só
                    existe porque alguém publica o edital.
                  </p>

                  {atual.estado === "aberto" ? (
                    <>
                      <label className="studio-campo">
                        <span className="studio-campo-rotulo">Proponente</span>
                        <input
                          type="text"
                          className="studio-campo-entrada"
                          value={proponente}
                          onChange={(e) => setProponente(e.target.value)}
                          placeholder="Nome do coletivo ou da pessoa"
                        />
                        <span className="studio-campo-nota">
                          A inscrição usa o perfil escolhido acima: {perfilTerritorio} ·{" "}
                          {rotuloDaLinguagem(perfilLinguagem)}.
                        </span>
                      </label>
                      <div className="studio-acoes">
                        <button
                          type="button"
                          className="studio-botao studio-botao-primario"
                          disabled={proponente.trim().length === 0}
                          onClick={() => {
                            org.inscrever(atual.id, {
                              proponente: proponente.trim(),
                              territorio: perfilTerritorio,
                              linguagem: perfilLinguagem,
                              viraAgente: true,
                            });
                            setProponente("");
                          }}
                        >
                          Inscrever
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="studio-travado">
                      O edital está {ROTULO_DO_EDITAL[atual.estado]}: a lista de inscritos só
                      cresce enquanto ele está aberto.
                    </p>
                  )}

                  {atual.inscricoes.length > 0 ? (
                    <ul className="org-falta">
                      {atual.inscricoes.map((i) => (
                        <li key={i.id} className="org-falta-item" data-bloqueia="nao">
                          <span>
                            {i.proponente} · {i.territorio} · {rotuloDaLinguagem(i.linguagem)}
                            {i.viraAgente ? ", vira agente no grafo" : ""}
                          </span>
                          <span className="org-falta-dono">
                            {i.autor} · {i.quando}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>

                <section className="studio-painel">
                  <h2 className="studio-painel-nome">O que falta neste edital</h2>
                  <ul className="org-falta">
                    {faltasDoEdital(atual).map((f) => (
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
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
