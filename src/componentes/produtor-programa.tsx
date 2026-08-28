"use client";

import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { CampoComProposta } from "@/componentes/base/campo-com-proposta";
import { Campo } from "@/componentes/base/ficha-em-atos";
import { SeletorDeCatalogo } from "@/componentes/base/seletor-de-catalogo";
import { FichaSimples } from "@/componentes/produtor-ficha";
import { ESTADOS_DO_EDITAL, EXPLICACAO_DO_EDITAL, ROTULO_DO_EDITAL } from "@/dados/tipos-organizacao";
import type { CatalogoDoEdital, CatalogoDoPrograma } from "@/dados/mock/seed-produtor";
import type { EstadoDoEdital } from "@/dados/tipos-organizacao";
import type {
  ContextoDoProdutor,
  EdicaoDoPrograma,
  Registro,
  RegistroDeEdital,
  RegistroDePrograma,
} from "@/dados/tipos-produtor";

/**
 * produtor-programa.tsx, o programa e o edital.
 *
 * `programa` MEDE ZERO INSTÂNCIAS NO ACERVO. A classe existe na ontologia, o motor a
 * percorre, e nada a povoa: não há um único registro. Não é lacuna de tela, é lacuna de
 * dado, e é por isso que a ficha existe. Um programa é o guarda-chuva que agrupa eventos em
 * EDIÇÕES: «Rumos 2024», «Rumos 2026». Sem ele, dez eventos de uma mesma temporada aparecem
 * na agenda como dez coisas soltas.
 *
 * O EDITAL É A FORMA NOVA do que a Organização fazia (tela O6), e ele passou ao Produtor
 * pelo mesmo critério das outras seis. O casamento com o perfil de quem produz, linguagem,
 * território, público-alvo, é o que faz o alerta do painel valer alguma coisa.
 */
/**
 * O ACERVO VISTO DO PROGRAMA, medido no build e atravessado como primitivo (DP-F).
 *
 * Vinha da parede da Organização empilhada embaixo desta tela, que mudou de endereço em
 * 2026-08-27. O número que importa aqui é um ZERO: `programa` é a única das vinte classes
 * da ontologia sem nenhuma instância no acervo.
 */
export interface AcervoDoPrograma {
  programas: number;
  eventos: number;
  eventosComRealizador: number;
}

export function FichaDoPrograma({
  semente,
  contexto,
  catalogo,
  acervo,
}: {
  semente: Registro[];
  contexto: ContextoDoProdutor;
  catalogo: CatalogoDoPrograma;
  acervo: AcervoDoPrograma;
}) {
  return (
    <FichaSimples<"programa">
      pauta="programa"
      semente={semente}
      contexto={contexto}
      catalogo={catalogo}
      painelDaPauta={(daPauta) => {
        // `daPauta` traz a pauta INTEIRA; «em edição» é um recorte, e contar publicado
        // como rascunho era o defeito que a revisão adversarial pegou (2026-08-27).
        const emEdicao = daPauta.filter(
          (r) => r.situacao === "rascunho" || r.situacao === "devolvido",
        );
        const temEvento = (r: RegistroDePrograma) =>
          r.edicoes.some((e) => e.eventos.length > 0);
        const comEvento = emEdicao.filter(temEvento);
        const semEvento = emEdicao.filter((r) => !temEvento(r));
        return {
          contagem: `${acervo.programas} no acervo`,
          numeros: [
            { valor: String(acervo.programas), rotulo: "no acervo" },
            { valor: String(emEdicao.length), rotulo: "em edição" },
            { valor: String(acervo.eventos), rotulo: "eventos para reunir" },
          ],
          frase:
            "A classe programa é a única da ontologia sem nenhuma instância no acervo: estes são os primeiros.",
          cartoes: [
            {
              titulo: "Eventos com instituição realizadora",
              largura: 6,
              medidor: {
                porcento: Math.round(
                  (acervo.eventosComRealizador / Math.max(1, acervo.eventos)) * 100,
                ),
                rotulo: `de ${acervo.eventos}`,
              },
              nota: "Só esses já sabem quem responde por eles.",
            },
            {
              titulo: "Os rascunhos que já reúnem evento",
              largura: 6,
              medidor: {
                porcento: Math.round(
                  (comEvento.length / Math.max(1, emEdicao.length)) * 100,
                ),
                rotulo: `de ${emEdicao.length}`,
              },
              nota: "Um programa sem evento é um guarda-chuva sem nada embaixo.",
            },
          ],
          grupos: [
            { nome: "com evento reunido", registros: comEvento },
            { nome: "sem nenhum evento", registros: semEvento },
          ].filter((g) => g.registros.length > 0),
          tituloDosGrupos: "Em edição",
          subDe: (r) => {
            const p = r as RegistroDePrograma;
            const edicoes = p.edicoes.length;
            const eventos = p.edicoes.reduce(
              (n: number, e) => n + e.eventos.length,
              0,
            );
            return `${edicoes} ${edicoes === 1 ? "edição" : "edições"} · ${eventos} ${
              eventos === 1 ? "evento" : "eventos"
            }`;
          },
        };
      }}
      cabecalhoDaIdentidade={() => (
        <p className="prod-campo-nota" data-programa-mede-zero>
          A classe <code>programa</code> mede <strong>zero instâncias</strong> no acervo:
          lacuna de dado, não de tela.
        </p>
      )}
      atosProprios={(r, alterar) => [
        {
          rotulo: "Edições",
          fechado: r.edicoes.length > 0 && r.edicoes.every((e) => e.nome.trim() !== ""),
          conteudo: <AtoEdicoes registro={r} aoAlterar={alterar} />,
        },
        {
          rotulo: "Eventos",
          fechado: r.edicoes.some((e) => e.eventos.length > 0),
          conteudo: <AtoEventos registro={r} catalogo={catalogo} aoAlterar={alterar} />,
        },
      ]}
    />
  );
}

function AtoEdicoes({
  registro,
  aoAlterar,
}: {
  registro: RegistroDePrograma;
  aoAlterar: (m: Partial<RegistroDePrograma>) => void;
}) {
  function alterar(i: number, m: Partial<EdicaoDoPrograma>) {
    aoAlterar({ edicoes: registro.edicoes.map((x, n) => (n === i ? { ...x, ...m } : x)) });
  }

  return (
    <>

      {registro.edicoes.map((e, i) => (
        <div className="prod-temporada" key={`e${i}`} data-edicao={String(i)}>
          <Campo rotulo="Nome da edição" obrigatorio>
            <input
              type="text"
              value={e.nome}
              onChange={(x) => alterar(i, { nome: x.target.value })}
              className="prod-campo-entrada"
              data-nome-edicao
              aria-invalid={e.nome.trim() === ""}
            />
          </Campo>
          <div className="prod-par">
            <Campo rotulo="Início" obrigatorio>
              <input
                type="date"
                value={e.inicio}
                onChange={(x) => alterar(i, { inicio: x.target.value })}
                className="prod-campo-entrada"
                data-inicio-edicao
              />
            </Campo>
            <Campo rotulo="Fim">
              <input
                type="date"
                value={e.fim}
                min={e.inicio || undefined}
                onChange={(x) => alterar(i, { fim: x.target.value })}
                className="prod-campo-entrada"
                data-fim-edicao
              />
            </Campo>
          </div>
          <p className="prod-campo-nota">
            {e.eventos.length} evento(s) nesta edição.
          </p>
          <BotaoDoStudio
            curto
            aoClicar={() =>
              aoAlterar({ edicoes: registro.edicoes.filter((_, n) => n !== i) })
            }
            data-acao="remover-edicao"
          >
            {e.eventos.length > 0
              ? `Remover, isto solta ${e.eventos.length} evento(s)`
              : "Remover edição"}
          </BotaoDoStudio>
        </div>
      ))}

      <BotaoDoStudio
        aoClicar={() =>
          aoAlterar({
            edicoes: [...registro.edicoes, { nome: "", inicio: "", fim: "", eventos: [] }],
          })
        }
        data-acao="mais-edicao"
      >
        + edição
      </BotaoDoStudio>
    </>
  );
}

function AtoEventos({
  registro,
  catalogo,
  aoAlterar,
}: {
  registro: RegistroDePrograma;
  catalogo: CatalogoDoPrograma;
  aoAlterar: (m: Partial<RegistroDePrograma>) => void;
}) {
  if (registro.edicoes.length === 0) {
    return (
      <p className="prod-campo-nota">
        Sem edição não há onde pôr o evento: o programa agrupa por edição, e um evento solto
        no programa não teria período nenhum.
      </p>
    );
  }

  return (
    <>
      {registro.edicoes.map((e, i) => (
        <div className="prod-temporada" key={`ev${i}`}>
          <strong className="prod-registro-titulo">{e.nome || `Edição ${i + 1}`}</strong>
          <Campo rotulo="Acrescentar evento">
            <CampoComProposta
              nome="Evento"
              acervo={catalogo.eventosDoAcervo}
              porta="moderacao"
              escolha={{ id: null, titulo: null, proposto: false }}
              aoEscolher={(x) => {
                if (!x.id) return;
                aoAlterar({
                  edicoes: registro.edicoes.map((y, n) =>
                    n === i ? { ...y, eventos: [...y.eventos, x.id as string] } : y,
                  ),
                });
              }}
            />
          </Campo>
          {e.eventos.length > 0 ? (
            <ul className="prod-lista">
              {e.eventos.map((id, k) => {
                const ev = catalogo.eventosDoAcervo.find((x) => x.id === id);
                return (
                  <li key={`${id}-${k}`}>
                    <div className="prod-vinculo">
                      <span className="prod-registro-corpo">
                        <strong className="prod-registro-titulo">{ev?.titulo ?? id}</strong>
                      </span>
                      <BotaoDoStudio
                        curto
                        aoClicar={() =>
                          aoAlterar({
                            edicoes: registro.edicoes.map((y, n) =>
                              n === i
                                ? { ...y, eventos: y.eventos.filter((_, m) => m !== k) }
                                : y,
                            ),
                          })
                        }
                        data-acao="remover-evento-da-edicao"
                      >
                        Remover
                      </BotaoDoStudio>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------

/** O vocabulário do recorte, medido no build e atravessado como primitivo (DP-F). */
export interface AcervoDoEdital {
  linguagens: number;
  ufsComAcervo: number;
  ufs: number;
}

export function FichaDoEdital({
  semente,
  contexto,
  catalogo,
  acervo,
}: {
  semente: Registro[];
  contexto: ContextoDoProdutor;
  catalogo: CatalogoDoEdital;
  acervo: AcervoDoEdital;
}) {
  return (
    <FichaSimples<"editais">
      pauta="editais"
      semente={semente}
      contexto={contexto}
      catalogo={catalogo}
      painelDaPauta={(daPauta) => {
        const hoje = contexto.dataDeReferencia;
        const comPrazo = daPauta.filter((r) => r.prazo.trim() !== "");
        const abertos = daPauta.filter((r) => r.estado === "aberto");
        const vencidos = comPrazo.filter((r) => r.prazo < hoje);
        const porEstado = new Map<EstadoDoEdital, number>();
        for (const r of daPauta) {
          porEstado.set(r.estado, (porEstado.get(r.estado) ?? 0) + 1);
        }
        return {
          numeros: [
            { valor: String(daPauta.length), rotulo: "editais" },
            { valor: String(abertos.length), rotulo: "declarados abertos" },
            { valor: String(vencidos.length), rotulo: "com prazo vencido" },
          ],
          frase:
            "Um edital sem recorte casa com todo mundo, e alerta que vale para todos não vale para ninguém.",
          cartoes: [
            {
              titulo: "Em que estado eles estão",
              largura: 6,
              rosca: {
                fatias: [...porEstado.entries()].map(([estado, quantos]) => ({
                  rotulo: ROTULO_DO_EDITAL[estado] ?? estado,
                  valor: quantos,
                })),
                centroValor: String(daPauta.length),
                centroRotulo: "editais",
              },
            },
            {
              // O DENOMINADOR SÃO OS QUE TÊM PRAZO. Edital sem prazo não tem prazo à
               // frente nem atrás, e contá-lo como futuro inflava o número.
              titulo: "Prazo ainda à frente",
              largura: 6,
              medidor: {
                porcento: Math.round(
                  ((comPrazo.length - vencidos.length) / Math.max(1, comPrazo.length)) * 100,
                ),
                rotulo: `de ${comPrazo.length} com prazo`,
              },
              nota: `O recorte tem ${acervo.linguagens} linguagens e ${acervo.ufsComAcervo} das ${acervo.ufs} UFs com acervo.`,
            },
          ],
          subDe: (r) => {
            const e = r as RegistroDeEdital;
            const rotulo = ROTULO_DO_EDITAL[e.estado] ?? e.estado;
            if (e.prazo.trim() === "") return `${rotulo}, sem prazo`;
            const [ano, mes, dia] = e.prazo.split("-");
            const data = `${dia}.${mes}.${ano}`;
            return e.prazo < hoje ? `${rotulo} · prazo vencido em ${data}` : `${rotulo} · até ${data}`;
          },
        };
      }}
      cabecalhoDaIdentidade={() => (
        <p className="prod-campo-nota">
          O edital casa com o <strong>perfil</strong> de quem produz, e o casamento vira
          alerta no painel.
        </p>
      )}
      atosProprios={(r, alterar) => [
        {
          rotulo: "Prazo e estado",
          fechado: r.prazo.trim() !== "",
          conteudo: <AtoPrazo registro={r} aoAlterar={alterar} />,
        },
        {
          rotulo: "Recorte",
          fechado: r.linguagens.length > 0 || r.territorios.length > 0,
          conteudo: <AtoRecorte registro={r} catalogo={catalogo} aoAlterar={alterar} />,
        },
        {
          rotulo: "Link e anexos",
          fechado: r.link.trim() !== "",
          conteudo: <AtoLink registro={r} aoAlterar={alterar} />,
        },
      ]}
    />
  );
}

function AtoPrazo({
  registro,
  aoAlterar,
}: {
  registro: RegistroDeEdital;
  aoAlterar: (m: Partial<RegistroDeEdital>) => void;
}) {
  return (
    <>
      <Campo rotulo="Prazo de inscrição" obrigatorio>
        <input
          type="date"
          value={registro.prazo}
          onChange={(e) => aoAlterar({ prazo: e.target.value })}
          className="prod-campo-entrada"
          data-prazo
          aria-invalid={registro.prazo.trim() === ""}
        />
      </Campo>

      <Campo rotulo="Estado" obrigatorio>
        <SeletorDeCatalogo
          nome="Estado do edital"
          unico
          termos={ESTADOS_DO_EDITAL.map((e) => ({ id: e, rotulo: ROTULO_DO_EDITAL[e] }))}
          escolhidos={[registro.estado]}
          aoMudar={(ids) =>
            aoAlterar({ estado: (ids[0] as RegistroDeEdital["estado"]) ?? "aberto" })
          }
          aceitaProposta={false}
          porQueFechado="Os quatro estados são o vocabulário do contrato."
        />
      </Campo>

      <p className="prod-campo-nota" data-explicacao-estado={registro.estado}>
        {EXPLICACAO_DO_EDITAL[registro.estado]}
      </p>
    </>
  );
}

function AtoRecorte({
  registro,
  catalogo,
  aoAlterar,
}: {
  registro: RegistroDeEdital;
  catalogo: CatalogoDoEdital;
  aoAlterar: (m: Partial<RegistroDeEdital>) => void;
}) {
  return (
    <>
      <Campo rotulo="Territórios" nota="Só os estados: um edital recorta por UF, e uma lista com 359 municípios ofereceria «Aargau, Suíça».">
        <SeletorDeCatalogo
          nome="Territórios"
          termos={catalogo.territorios}
          escolhidos={registro.territorios}
          aoMudar={(ids) => aoAlterar({ territorios: ids })}
          aceitaProposta={false}
          porQueFechado="Território é governança da plataforma: só a Administração acrescenta."
        />
      </Campo>

      <Campo rotulo="Público-alvo">
        <textarea
          value={registro.publicoAlvo}
          onChange={(e) => aoAlterar({ publicoAlvo: e.target.value })}
          rows={3}
          className="prod-campo-entrada"
          data-publico-alvo
        />
      </Campo>
    </>
  );
}

function AtoLink({
  registro,
  aoAlterar,
}: {
  registro: RegistroDeEdital;
  aoAlterar: (m: Partial<RegistroDeEdital>) => void;
}) {
  return (
    <>
      <Campo rotulo="Link do edital" obrigatorio>
        <input
          type="url"
          value={registro.link}
          onChange={(e) => aoAlterar({ link: e.target.value })}
          className="prod-campo-entrada"
          data-link
          aria-invalid={registro.link.trim() === ""}
        />
      </Campo>

      <Campo rotulo="Anexos" nota="Um endereço por linha. Não há upload neste protótipo.">
        <textarea
          value={registro.anexos.join("\n")}
          onChange={(e) =>
            aoAlterar({
              anexos: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean),
            })
          }
          rows={3}
          className="prod-campo-entrada"
          data-anexos
        />
      </Campo>
    </>
  );
}
