"use client";

import { useMemo, useState } from "react";
import { StudioOrgNavegacao } from "./studio-org-navegacao";
import { useOrganizacao } from "./studio-org-estado";
import {
  ALCADAS,
  EQUIPE_E_AUTORADA,
  EXPLICACAO_DA_ALCADA,
  LIMITE_DA_ALCADA,
  POR_QUE_A_SUCESSAO,
  ROTULO_DA_ALCADA,
  ROTULO_DO_VINCULO,
  equipeAutorada,
  faltasDaEquipe,
  podeRemover,
} from "@/dados/tipos-organizacao";
import type { Alcada } from "@/dados/tipos-organizacao";

/**
 * studio-org-equipe.tsx, O7 · Equipe e alçadas (funcionalidades 139 e 140).
 *
 * O QUE ELA IMPEDE. Sem esta tela, quem fez o cadastro é dono dele: o estagiário que criou
 * o perfil do teatro leva o teatro embora quando sai. A tela existe para que a organização
 *, e não a pessoa, seja quem responde, e é por isso que o PRD a marca como não-cortável.
 *
 * DUAS REGRAS DURAS, e as duas moram no MÉTODO e não no botão:
 *
 *  1. **O titular não é removível.** `remover()` recusa quem tem `titular: true`, e o botão
 *     nem aparece. Um botão desabilitado é sugestão; um método que recusa é regra. Se a
 *     remoção do titular fosse possível, a organização perderia o dono por ABANDONO, que é
 *     exatamente o problema que a tela existe para impedir.
 *  2. **Nenhuma alçada desta lista promove ninguém a moderador, editor ou admin.** A
 *     Organização concede DENTRO dela; conceder entre níveis é do Admin (87). A tela
 *     declara a fronteira em vez de deixar quem concede descobrir sozinho.
 *
 * OS PERFIS SÃO PAPÉIS, NÃO PESSOAS. O acervo tem 575 pessoas reais, e vincular qualquer
 * uma delas a uma instituição como colaboradora afirmaria um fato sobre uma pessoa real
 * que a fonte não afirma. Nomes inventados teriam o problema oposto e igualmente ruim:
 * pareceriam dado. É a mesma saída de `OPERADOR_DO_STUDIO`, o papel é o nome.
 *
 * SÓ NA VISÃO WEB (D-67).
 */

interface Props {
  organizacao: string;
  autor: string;
  gestorEAutorado: string;
  dataDeReferencia: string;
}

export function StudioOrgEquipe({
  organizacao,
  autor,
  gestorEAutorado,
  dataDeReferencia,
}: Props) {
  const contexto = useMemo(
    () => ({ dataDeReferencia, autor, organizacao }),
    [dataDeReferencia, autor, organizacao],
  );
  const semente = useMemo(
    () => ({ equipe: equipeAutorada(autor, dataDeReferencia) }),
    [autor, dataDeReferencia],
  );
  const org = useOrganizacao(contexto, semente);

  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [alcadasDoConvite, setAlcadasDoConvite] = useState<Alcada[]>(["rascunhar"]);

  const equipe = org.equipe;
  const selecionado =
    equipe.find((c) => c.id === selecionadoId) ?? equipe.find((c) => c.titular) ?? equipe[0] ?? null;

  const ativos = equipe.filter((c) => c.estado === "ativo").length;
  const convidados = equipe.filter((c) => c.estado === "convidado").length;
  const removidos = equipe.filter((c) => c.estado === "removido").length;

  // O convite só vale com e-mail e com pelo menos uma alçada: convidar alguém para «nada»
  // criaria um vínculo que não permite nem abrir um rascunho.
  const convitePronto = email.trim().length > 0 && nome.trim().length > 0 && alcadasDoConvite.length > 0;

  const sucessores = equipe.filter((c) => c.estado === "ativo" && !c.titular);

  return (
    <div className="studio">
      <header className="studio-cabecalho">
        <div className="studio-superficie">
          <p className="studio-rotulo">Studio · Organização · nível 6</p>
          <h1 className="studio-titulo">Equipe e alçadas</h1>
        </div>
        <p className="studio-objetivo">
          O que impede quem fez o cadastro de levar o perfil embora quando sai. {organizacao}{" "}
          · {autor} · {dataDeReferencia}.
        </p>
        <p className="studio-nota">{gestorEAutorado}</p>
        <StudioOrgNavegacao ativa="equipe" />
      </header>

      <section className="studio-painel">
        <h2 className="studio-painel-nome">A equipe, agora</h2>
        <ul className="web-denominadores">
          <li className="web-denominador">
            <span className="web-denominador-numero">{ativos}</span>
            <span className="web-denominador-rotulo">vínculos ativos</span>
          </li>
          <li className="web-denominador">
            <span className="web-denominador-numero">{convidados}</span>
            <span className="web-denominador-rotulo">convites não aceitos</span>
          </li>
          <li className="web-denominador">
            <span className="web-denominador-numero">{removidos}</span>
            <span className="web-denominador-rotulo">removidos, e ainda no histórico</span>
          </li>
          <li className="web-denominador">
            <span className="web-denominador-numero">{org.historicoDaEquipe.length}</span>
            <span className="web-denominador-rotulo">decisões carimbadas</span>
          </li>
        </ul>
        <div className="web-declaracao">
          <strong>A Organização concede dentro dela</strong>
          <span>{LIMITE_DA_ALCADA}</span>
        </div>
        <div className="web-declaracao">
          <strong>Os perfis são papéis, não pessoas</strong>
          <span>{EQUIPE_E_AUTORADA}</span>
        </div>
      </section>

      {!org.pronto ? (
        <section className="studio-painel">
          <p className="studio-nota">Lendo a equipe guardada neste navegador…</p>
        </section>
      ) : (
        <div className="web-duas-colunas">
          {/* ---------------- A equipe, à esquerda ---------------- */}
          <div className="studio-forma">
            <section className="studio-painel">
              <div className="studio-painel-cabeca">
                <h2 className="studio-painel-nome">Quem publica em nome da organização</h2>
              </div>
              <ul className="web-lista-densa">
                {equipe.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="web-linha studio-botao"
                      aria-pressed={selecionado?.id === c.id}
                      onClick={() => setSelecionadoId(c.id)}
                    >
                      <span className="web-linha-titulo">
                        {c.nome}
                        {c.titular ? ", titular" : ""}
                      </span>
                      <span className="web-linha-meta">
                        {c.email} · {ROTULO_DO_VINCULO[c.estado]} ·{" "}
                        {c.alcadas.length === 0
                          ? "sem alçada"
                          : c.alcadas.map((a) => ROTULO_DA_ALCADA[a]).join(", ")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="studio-painel">
              <h2 className="studio-painel-nome">Convidar colaborador</h2>
              <label className="studio-campo">
                <span className="studio-campo-rotulo">
                  Papel na organização
                  <em className="studio-campo-exigido">obrigatório</em>
                </span>
                <input
                  type="text"
                  className="studio-campo-entrada"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Curadoria, Produção, Educativo…"
                />
              </label>
              <label className="studio-campo">
                <span className="studio-campo-rotulo">
                  E-mail
                  <em className="studio-campo-exigido">obrigatório</em>
                </span>
                <input
                  type="email"
                  className="studio-campo-entrada"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@instituicao.org"
                />
              </label>
              <div>
                <p className="studio-rotulo">Alçadas do convite</p>
                <ul className="org-caixas">
                  {ALCADAS.filter((a) => a !== "gerir_equipe").map((a) => (
                    <li
                      key={a}
                      className="org-caixa"
                      data-estado={alcadasDoConvite.includes(a) ? "oferece" : "declarado-ausente"}
                    >
                      <label className="flex items-center gap-2" title={EXPLICACAO_DA_ALCADA[a]}>
                        <input
                          type="checkbox"
                          checked={alcadasDoConvite.includes(a)}
                          onChange={(e) =>
                            setAlcadasDoConvite((atual) =>
                              e.target.checked ? [...atual, a] : atual.filter((x) => x !== a),
                            )
                          }
                        />
                        {ROTULO_DA_ALCADA[a]}
                      </label>
                    </li>
                  ))}
                </ul>
                <p className="studio-campo-nota">
                  «Gerir a equipe» não aparece aqui: ela é do titular, e o caminho para ela é a
                  sucessão, não um convite que se concede a si mesmo.
                </p>
              </div>
              <div className="studio-acoes">
                <button
                  type="button"
                  className="studio-botao studio-botao-primario"
                  disabled={!convitePronto}
                  onClick={() => {
                    org.convidar(nome.trim(), email.trim(), alcadasDoConvite);
                    setNome("");
                    setEmail("");
                    setAlcadasDoConvite(["rascunhar"]);
                  }}
                >
                  Enviar convite
                </button>
              </div>
              {!convitePronto ? (
                <p className="studio-campo-nota">
                  Falta papel, e-mail ou pelo menos uma alçada. Convidar alguém para «nada»
                  criaria um vínculo que não permite nem abrir um rascunho.
                </p>
              ) : null}
            </section>
          </div>

          {/* -------- Alçadas, sucessão e histórico, à direita -------- */}
          <aside className="org-colada studio-forma">
            {selecionado ? (
              <section className="studio-painel">
                <div className="studio-painel-cabeca">
                  <h2 className="studio-painel-nome">{selecionado.nome}</h2>
                  <span
                    className={
                      selecionado.estado === "ativo"
                        ? "studio-pastilha studio-pastilha-marca"
                        : "studio-pastilha"
                    }
                  >
                    {ROTULO_DO_VINCULO[selecionado.estado]}
                  </span>
                </div>

                <ul className="org-caixas">
                  {ALCADAS.map((a) => (
                    <li
                      key={a}
                      className="org-caixa"
                      data-estado={
                        selecionado.alcadas.includes(a) ? "oferece" : "declarado-ausente"
                      }
                    >
                      <label className="flex items-center gap-2" title={EXPLICACAO_DA_ALCADA[a]}>
                        <input
                          type="checkbox"
                          checked={selecionado.alcadas.includes(a)}
                          disabled={selecionado.estado === "removido" || a === "gerir_equipe"}
                          onChange={(e) =>
                            org.alterarAlcadas(
                              selecionado.id,
                              e.target.checked
                                ? [...selecionado.alcadas, a]
                                : selecionado.alcadas.filter((x) => x !== a),
                            )
                          }
                        />
                        {ROTULO_DA_ALCADA[a]}
                      </label>
                    </li>
                  ))}
                </ul>
                <p className="studio-campo-nota">
                  {EXPLICACAO_DA_ALCADA[
                    selecionado.alcadas[selecionado.alcadas.length - 1] ?? "rascunhar"
                  ]}
                </p>

                <div className="studio-acoes">
                  {selecionado.estado === "convidado" ? (
                    <button
                      type="button"
                      className="studio-botao studio-botao-primario"
                      onClick={() => org.aceitarConvite(selecionado.id)}
                    >
                      Registrar aceite do convite
                    </button>
                  ) : null}
                  {podeRemover(selecionado) ? (
                    <button
                      type="button"
                      className="studio-botao"
                      onClick={() => org.remover(selecionado.id)}
                    >
                      Remover da equipe
                    </button>
                  ) : null}
                </div>

                {selecionado.titular ? (
                  <p className="studio-travado">{POR_QUE_A_SUCESSAO}</p>
                ) : null}
                <p className="studio-literal">
                  vínculo escrito por {selecionado.autor} em {selecionado.quando}
                </p>
              </section>
            ) : null}

            <section className="studio-painel">
              <h2 className="studio-painel-nome">Sucessão de titularidade</h2>
              <p className="studio-nota">{POR_QUE_A_SUCESSAO}</p>
              {sucessores.length === 0 ? (
                <p className="studio-campo-nota">
                  Não há para quem transferir: a sucessão só aceita vínculo ATIVO, e um
                  convite não aceito não pode receber a organização.
                </p>
              ) : (
                <ul className="web-lista-densa">
                  {sucessores.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="web-linha studio-botao"
                        onClick={() => org.transferirTitularidade(c.id)}
                      >
                        <span className="web-linha-titulo">Transferir para {c.nome}</span>
                        <span className="web-linha-meta">
                          recebe junto a alçada de gerir a equipe, titular sem ela seria dono
                          que não pode conceder nada
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="studio-painel">
              <h2 className="studio-painel-nome">O que falta nesta equipe</h2>
              <ul className="org-falta">
                {faltasDaEquipe(equipe).map((f) => (
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

            <section className="studio-painel">
              <div className="studio-painel-cabeca">
                <h2 className="studio-painel-nome">Histórico</h2>
                <span className="studio-pastilha">
                  <span className="studio-pastilha-numero">{org.historicoDaEquipe.length}</span>{" "}
                  decisões
                </span>
              </div>
              {org.historicoDaEquipe.length === 0 ? (
                <p className="studio-campo-nota">
                  Nenhuma decisão nesta sessão ainda. Toda concessão, remoção e sucessão
                  entra aqui com autor e carimbo, sem os dois, «a alçada mudou» é rumor.
                </p>
              ) : (
                <ul className="org-falta">
                  {org.historicoDaEquipe.map((h, i) => (
                    <li key={`${h.quando}-${i}`} className="org-falta-item" data-bloqueia="nao">
                      <span>{h.texto}</span>
                      <span className="org-falta-dono">
                        {h.autor} · {h.quando}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="studio-acoes">
              <button type="button" className="studio-botao" onClick={org.reiniciar}>
                Reiniciar a demonstração
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
