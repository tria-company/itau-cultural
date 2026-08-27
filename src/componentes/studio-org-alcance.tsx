"use client";

import { useMemo } from "react";
import { StudioOrgNavegacao } from "./studio-org-navegacao";
import { useOrganizacao } from "./studio-org-estado";
import { O_QUE_O_ALCANCE_NAO_SUSTENTA, REGRA_DO_ALCANCE } from "@/dados/tipos-organizacao";
import type { EventoParaPrograma, InstituicaoDoAcervo } from "@/dados/organizacao";

/**
 * studio-org-alcance.tsx, O9 · Alcance consolidado (funcionalidade 152).
 *
 * É A TELA ONDE É MAIS FÁCIL MENTIR, e por isso metade dela é a lista do que ela se recusa a
 * exibir. Sinal de público real não existe no acervo: nenhuma ocorrência declara lotação,
 * bilheteria ou contagem de porta, e o contador de reprodução mora no serviço que serve o
 * arquivo, não há um. Um painel institucional com número de alcance inventado destrói o
 * argumento de procedência da proposta inteira, e num painel assim ninguém confere: é
 * exatamente isso que torna a mentira barata.
 *
 * O QUE ELA EXIBE É O QUE ELA CONTA. Eventos realizados, sessões somadas, linguagens e
 * territórios cobertos são arestas do grafo. O que não se conta aparece NOMEADO, com o
 * motivo, na mesma coluna e no mesmo tamanho do que se conta, porque a recusa é o conteúdo,
 * e não uma ressalva de rodapé.
 *
 * A INSTITUIÇÃO É A QUE A O1 ESCOLHEU. As duas telas leem o mesmo campo do mesmo estado, e
 * por isso o alcance é sempre o da organização que a ficha institucional declara, em vez de
 * um seletor próprio que pudesse discordar do outro.
 *
 * SÓ NA VISÃO WEB (D-67).
 */

interface Props {
  instituicoes: InstituicaoDoAcervo[];
  eventos: EventoParaPrograma[];
  inicial: string | null;
  ocorrencias: number;
  ocorrenciasComEspaco: number;
  organizacao: string;
  autor: string;
  gestorEAutorado: string;
  dataDeReferencia: string;
}

export function StudioOrgAlcance({
  instituicoes,
  eventos,
  inicial,
  ocorrencias,
  ocorrenciasComEspaco,
  organizacao,
  autor,
  gestorEAutorado,
  dataDeReferencia,
}: Props) {
  const contexto = useMemo(
    () => ({ dataDeReferencia, autor, organizacao }),
    [dataDeReferencia, autor, organizacao],
  );
  const semente = useMemo(() => ({ instituicaoId: inicial }), [inicial]);
  const org = useOrganizacao(contexto, semente);

  const atual =
    instituicoes.find((i) => i.id === org.atualInstituicaoId) ??
    instituicoes.find((i) => i.id === inicial) ??
    instituicoes[0] ??
    null;

  const meus = useMemo(
    () => (atual ? eventos.filter((e) => e.realizadoPorIds.includes(atual.id)) : []),
    [eventos, atual],
  );
  const sessoes = meus.reduce((s, e) => s + e.ocorrencias, 0);

  const porLinguagem = useMemo(() => {
    const conta = new Map<string, number>();
    for (const e of meus) for (const l of e.linguagens) conta.set(l, (conta.get(l) ?? 0) + 1);
    return [...conta.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [meus]);

  const porTerritorio = useMemo(() => {
    const conta = new Map<string, number>();
    for (const e of meus) {
      const t = e.territorio ?? "sem território declarado";
      conta.set(t, (conta.get(t) ?? 0) + 1);
    }
    return [...conta.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [meus]);

  const semEventos = instituicoes.filter((i) => i.eventosRealizados === 0).length;

  return (
    <div className="studio">
      <header className="studio-cabecalho">
        <div className="studio-superficie">
          <p className="studio-rotulo">Studio · Organização · nível 6</p>
          <h1 className="studio-titulo">Alcance consolidado</h1>
        </div>
        <p className="studio-objetivo">
          O retorno para quem publica. {organizacao} · {autor} · medido em {dataDeReferencia}.
        </p>
        <p className="studio-nota">{gestorEAutorado}</p>
        <StudioOrgNavegacao ativa="alcance" />
      </header>

      <section className="studio-painel">
        <h2 className="studio-painel-nome">A regra desta tela</h2>
        <div className="web-declaracao">
          <strong>Se o dado não sustenta, a tela diz</strong>
          <span>{REGRA_DO_ALCANCE}</span>
        </div>
      </section>

      {!org.pronto ? (
        <section className="studio-painel">
          <p className="studio-nota">Lendo o estado guardado neste navegador…</p>
        </section>
      ) : atual === null ? (
        <section className="studio-painel">
          <p className="studio-nota">O acervo não tem instituição nenhuma.</p>
        </section>
      ) : (
        <div className="web-duas-colunas">
          {/* -------- O que se conta, à esquerda -------- */}
          <div className="studio-forma">
            <section className="studio-painel">
              <div className="studio-painel-cabeca">
                <h2 className="studio-painel-nome">{atual.titulo}</h2>
                <span className="studio-pastilha">
                  a instituição que a ficha institucional declara
                </span>
              </div>
              <ul className="web-denominadores">
                <li className="web-denominador">
                  <span className="web-denominador-numero">{meus.length}</span>
                  <span className="web-denominador-rotulo">eventos que ela realiza</span>
                </li>
                <li className="web-denominador">
                  <span className="web-denominador-numero">{sessoes}</span>
                  <span className="web-denominador-rotulo">sessões somadas</span>
                </li>
                <li className="web-denominador">
                  <span className="web-denominador-numero">{porLinguagem.length}</span>
                  <span className="web-denominador-rotulo">linguagens cobertas</span>
                </li>
                <li className="web-denominador">
                  <span className="web-denominador-numero">{porTerritorio.length}</span>
                  <span className="web-denominador-rotulo">territórios cobertos</span>
                </li>
              </ul>
              <p className="studio-campo-nota">
                Estes quatro são arestas do grafo, contadas: «realiza» liga a instituição ao
                evento, e as sessões vêm de «ocorre_em». Nenhum deles mede público.
              </p>
              <p className="studio-campo-nota">
                «Realiza» é de MUITOS PARA MUITOS no acervo: o mesmo evento costuma ser
                realizado por várias instituições, e estes números são a fatia desta, não uma
                fatia exclusiva. Um campo único de realizador faria as outras instituições do
                mesmo evento verem zero aqui, cada uma achando que não realiza nada.
              </p>
            </section>

            <section className="studio-painel">
              <h2 className="studio-painel-nome">Por linguagem</h2>
              {porLinguagem.length === 0 ? (
                <p className="studio-campo-nota">
                  Esta instituição não realiza evento nenhum no acervo, e são {semEventos} de{" "}
                  {instituicoes.length} nessa situação.
                </p>
              ) : (
                <ul className="org-falta">
                  {porLinguagem.map(([rotulo, quantos]) => (
                    <li key={rotulo} className="org-falta-item" data-bloqueia="nao">
                      <span>{rotulo}</span>
                      <span className="org-falta-dono">
                        {quantos} de {meus.length} eventos
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="studio-painel">
              <h2 className="studio-painel-nome">Por território</h2>
              {porTerritorio.length === 0 ? (
                <p className="studio-campo-nota">Sem eventos, não há território a recortar.</p>
              ) : (
                <ul className="org-falta">
                  {porTerritorio.map(([rotulo, quantos]) => (
                    <li
                      key={rotulo}
                      className="org-falta-item"
                      data-bloqueia={rotulo === "sem território declarado" ? "sim" : "nao"}
                    >
                      <span>{rotulo}</span>
                      <span className="org-falta-dono">
                        {quantos} de {meus.length} eventos
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="studio-painel">
              <h2 className="studio-painel-nome">Por espaço</h2>
              <p className="studio-nota">
                Este recorte está vazio, e o vazio É a medida:{" "}
                <strong>
                  {ocorrenciasComEspaco} de {ocorrencias}
                </strong>{" "}
                ocorrências do acervo declaram espaço. Não é «ainda não há dado nesta
                instituição», é a ausência que a tela de espaços existe para converter.
              </p>
            </section>
          </div>

          {/* -------- O que NÃO se conta, à direita e do mesmo tamanho -------- */}
          <aside className="org-colada studio-forma">
            <section className="studio-painel">
              <div className="studio-painel-cabeca">
                <h2 className="studio-painel-nome">O que este painel não exibe</h2>
                <span className="studio-pastilha studio-pastilha-marca">
                  <span className="studio-pastilha-numero">
                    {O_QUE_O_ALCANCE_NAO_SUSTENTA.length}
                  </span>{" "}
                  medidas recusadas
                </span>
              </div>
              <p className="studio-nota">
                Cada linha abaixo é um número que este painel poderia exibir e escolhe não
                exibir, com a razão. Elas ocupam a mesma coluna e o mesmo tamanho do que a tela
                conta, porque a recusa é o conteúdo.
              </p>
              <ul className="org-falta">
                {O_QUE_O_ALCANCE_NAO_SUSTENTA.map((m) => (
                  <li key={m.medida} className="org-falta-item" data-bloqueia="sim">
                    <span>
                      <strong>{m.medida}</strong>, {m.porque}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
