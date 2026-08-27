"use client";

import { useMemo, useState } from "react";
import { FichaDeAcessibilidade } from "./ficha-acessibilidade";
import { EditorDeAcessibilidade } from "./studio-org-acessibilidade";
import { StudioOrgNavegacao } from "./studio-org-navegacao";
import { useOrganizacao } from "./studio-org-estado";
import {
  METODO_APOS_ENDERECO,
  QUEM_VERIFICA,
  ROTULO_DA_VERIFICACAO,
  acessibilidadeDeEspacoVazia,
  faltasDaInstituicao,
} from "@/dados/tipos-organizacao";
import type { AcessibilidadeDeEspaco } from "@/dados/tipos-organizacao";
import type {
  DeclaracaoDaTela,
  InstituicaoDoAcervo,
  NumerosDasInstituicoes,
} from "@/dados/organizacao";

/**
 * studio-org-instituicao.tsx, O1 · Ficha da instituição (funcionalidades 141 e parte da
 * 142): a identidade que responde pelo que a organização publica.
 *
 * ELA HERDA O PADRÃO DA O2, e não o contrário. Começar pela ficha da instituição parece
 * natural e é um erro: é a tela de espaços que fixa o ato explícito de declarar ausência,
 * e a instituição copia o padrão já resolvido. Por isso o editor da ficha aqui é
 * literalmente o mesmo componente, `EditorDeAcessibilidade`,, e não uma segunda
 * implementação com os mesmos treze campos.
 *
 * O QUE ELA NÃO FAZ, e a ausência é o argumento:
 *
 *  - **Não se verifica.** Quem verifica é o Admin (92). A tela encaminha, mostra o que
 *    falta para o pedido ser aceito, e para aí. Uma organização que atestasse a si mesma
 *    produziria um selo que não afirma nada, e a tela diz isso em vez de esconder.
 *  - **Não reescreve o verbete.** As 246 instituições são 100% `ic`: nome, resumo e
 *    linguagem vêm da Enciclopédia, e o Studio referencia e propõe, nunca edita o verbete
 *    de um agente real. O que a O1 escreve é o que o verbete NÃO tem.
 *  - **Não digita latitude.** Mesma regra da O2: o tipo `Coordenada` fixa
 *    `procedencia: "derivado"` como literal, e o endereço troca só o método da derivação.
 *
 * DE ONDE VEM CADA NÚMERO. Tudo o que fala do acervo chega por props, contado no build
 * (DP-F). As 246 instituições, as 0 com coordenada, as 0 que declaram acessibilidade e as
 * que têm imagem sem crédito são medidas, não literais digitados aqui dentro.
 *
 * SÓ NA VISÃO WEB (D-67), como todo o bastidor.
 */

interface Props {
  instituicoes: InstituicaoDoAcervo[];
  inicial: string | null;
  numeros: NumerosDasInstituicoes;
  declaracoes: DeclaracaoDaTela[];
  organizacao: string;
  autor: string;
  gestorEAutorado: string;
  dataDeReferencia: string;
}

export function StudioOrgInstituicao({
  instituicoes,
  inicial,
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

  const semente = useMemo(() => ({ instituicaoId: inicial }), [inicial]);
  const org = useOrganizacao(contexto, semente);
  const [busca, setBusca] = useState("");

  const atual =
    instituicoes.find((i) => i.id === org.atualInstituicaoId) ??
    instituicoes.find((i) => i.id === inicial) ??
    instituicoes[0] ??
    null;

  const ficha = atual ? org.instituicoes[atual.id] : undefined;
  const acessibilidade: AcessibilidadeDeEspaco | undefined = ficha?.acessibilidade;
  const declarou = acessibilidade?.declarada ?? false;

  const opcoes = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    if (termo.length === 0) return instituicoes;
    return instituicoes.filter((i) => i.titulo.toLocaleLowerCase("pt-BR").includes(termo));
  }, [instituicoes, busca]);

  const creditoResolvido = atual?.creditoImagem ?? ficha?.creditoImagem ?? "";
  const imagemSemCredito = Boolean(atual?.imagem) && creditoResolvido.trim().length === 0;

  return (
    <div className="studio">
      <header className="studio-cabecalho">
        <div className="studio-superficie">
          <p className="studio-rotulo">Studio · Organização · nível 6</p>
          <h1 className="studio-titulo">Ficha da instituição</h1>
        </div>
        <p className="studio-objetivo">
          A identidade que responde pelo que a organização publica. {organizacao} · {autor} ·
          medido em {dataDeReferencia}.
        </p>
        <p className="studio-nota">{gestorEAutorado}</p>
        <StudioOrgNavegacao ativa="instituicao" />
      </header>

      <section className="studio-painel">
        <h2 className="studio-painel-nome">O estado do acervo, medido</h2>
        <ul className="web-denominadores">
          <li className="web-denominador">
            <span className="web-denominador-numero">
              {numeros.comCoordenada}/{numeros.total}
            </span>
            <span className="web-denominador-rotulo">com coordenada</span>
          </li>
          <li className="web-denominador">
            <span className="web-denominador-numero">
              {numeros.declaramAcessibilidade}/{numeros.total}
            </span>
            <span className="web-denominador-rotulo">declaram acessibilidade</span>
          </li>
          <li className="web-denominador">
            <span className="web-denominador-numero">
              {numeros.comImagem}/{numeros.total}
            </span>
            <span className="web-denominador-rotulo">com imagem</span>
          </li>
          <li className="web-denominador">
            <span className="web-denominador-numero">{numeros.comImagemSemCredito}</span>
            <span className="web-denominador-rotulo">com imagem e sem crédito</span>
          </li>
          <li className="web-denominador">
            <span className="web-denominador-numero">
              {numeros.queRealizam}/{numeros.total}
            </span>
            <span className="web-denominador-rotulo">realizam evento</span>
          </li>
        </ul>
        {declaracoes.map((d) => (
          <div key={d.titulo} className="web-declaracao">
            <strong>{d.titulo}</strong>
            <span>{d.texto}</span>
          </div>
        ))}
      </section>

      {/* O seletor fica ACIMA das duas colunas porque troca o assunto da tela inteira,
          enterrá-lo numa coluna faria parecer um filtro daquela coluna. */}
      <div className="studio-seletor">
        <label className="studio-seletor-campo">
          <span className="studio-campo-rotulo">Buscar instituição</span>
          <input
            type="search"
            className="studio-campo-entrada"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Centro Cultural, Museu, Galeria…"
          />
        </label>
        <label className="studio-seletor-campo">
          <span className="studio-campo-rotulo">Esta organização responde por</span>
          <select
            className="studio-campo-entrada"
            value={atual?.id ?? ""}
            onChange={(e) => org.escolherInstituicao(e.target.value)}
          >
            {opcoes.map((i) => (
              <option key={i.id} value={i.id}>
                {i.titulo}
                {i.eventosRealizados > 0 ? `, realiza ${i.eventosRealizados}` : ""}
              </option>
            ))}
          </select>
        </label>
        <p className="studio-campo-nota">
          O acervo não tem instituição chamada «{organizacao}»: as {numeros.total} vêm da
          Enciclopédia, e a demonstração abre por REGRA, a primeira em ordem de título entre
          as {numeros.queRealizam} que realizam evento. Escolha manual aqui seria mais um
          lugar dependendo de alguém lembrar de atualizar depois de uma regeração do grafo.
        </p>
      </div>

      {!org.pronto ? (
        <section className="studio-painel">
          <p className="studio-nota">Lendo a ficha guardada neste navegador…</p>
        </section>
      ) : atual === null ? (
        <section className="studio-painel">
          <p className="studio-nota">O acervo não tem instituição nenhuma.</p>
        </section>
      ) : (
        <div className="web-duas-colunas">
          {/* ---------------- A ficha, à esquerda ---------------- */}
          <div className="studio-forma">
            <section className="studio-painel">
              <div className="studio-painel-cabeca">
                <h2 className="studio-painel-nome">{atual.titulo}</h2>
                <span className="studio-pastilha">
                  <span className="studio-pastilha-numero">{atual.eventosRealizados}</span>{" "}
                  eventos que ela realiza
                </span>
              </div>

              {atual.resumo.length > 0 ? (
                <p className="studio-nota">{atual.resumo}</p>
              ) : (
                <p className="studio-nota">
                  O verbete desta instituição não traz resumo, {numeros.comResumo} de{" "}
                  {numeros.total} trazem.
                </p>
              )}

              {atual.linguagens.length > 0 ? (
                <p className="studio-nota">
                  <span className="studio-rotulo">Linguagens, do vocabulário</span>{" "}
                  {atual.linguagens.join(" · ")}
                </p>
              ) : null}

              {atual.territorio ? (
                <p className="studio-nota">
                  <span className="studio-rotulo">Território</span> {atual.territorio}
                </p>
              ) : null}

              {atual.locais.length > 0 ? (
                <p className="studio-nota">
                  <span className="studio-rotulo">Locais que o verbete cita</span>{" "}
                  {atual.locais
                    .map((l) => [l.cidade, l.estado, l.pais].filter(Boolean).join(", "))
                    .join(" · ")}
                </p>
              ) : null}

              {atual.fonte ? (
                <p className="studio-literal">{atual.fonte}</p>
              ) : null}

              <p className="studio-campo-nota">
                Nome, resumo e linguagem vêm da Enciclopédia e não se editam aqui. O Studio
                referencia e propõe; editar o verbete de um agente real é a violação que o
                projeto se proibiu. O que esta tela escreve é o que o verbete não tem.
              </p>
            </section>

            <section className="studio-painel">
              <h2 className="studio-painel-nome">Onde ela fica, e com quem falar</h2>
              <p className="studio-nota">
                {atual.temCoordenada
                  ? "Esta instituição tem coordenada própria."
                  : `Esta instituição não tem coordenada própria, nenhuma das ${numeros.total} tem. Ela ainda pode aparecer no mapa por herança do município; o que falta é o ponto ser da porta e não da cidade.`}
              </p>

              <label className="studio-campo">
                <span className="studio-campo-rotulo">Endereço</span>
                <input
                  type="text"
                  className="studio-campo-entrada"
                  value={ficha?.endereco ?? ""}
                  onChange={(e) => org.alterarInstituicao(atual.id, { endereco: e.target.value })}
                  placeholder="Rua, número"
                />
                <span className="studio-campo-nota">
                  A coordenada continua derivada depois do cadastro: o endereço troca o método
                  para «{METODO_APOS_ENDERECO}», e não a procedência. Latitude digitada não
                  existe neste produto.
                </span>
              </label>

              <label className="studio-campo">
                <span className="studio-campo-rotulo">Contato de quem responde</span>
                <input
                  type="text"
                  className="studio-campo-entrada"
                  value={ficha?.contato ?? ""}
                  onChange={(e) => org.alterarInstituicao(atual.id, { contato: e.target.value })}
                  placeholder="E-mail, telefone ou site"
                />
              </label>
            </section>

            <section className="studio-painel">
              <h2 className="studio-painel-nome">Imagem e crédito</h2>
              {atual.imagem ? (
                <>
                  <p className="studio-literal">{atual.imagem}</p>
                  {atual.creditoImagem ? (
                    <p className="studio-nota">
                      <span className="studio-rotulo">Crédito do acervo</span>{" "}
                      {atual.creditoImagem}
                    </p>
                  ) : (
                    <label className="studio-campo">
                      <span className="studio-campo-rotulo">
                        Crédito da imagem
                        <em className="studio-campo-exigido">bloqueante</em>
                      </span>
                      <input
                        type="text"
                        className="studio-campo-entrada"
                        value={ficha?.creditoImagem ?? ""}
                        onChange={(e) =>
                          org.alterarInstituicao(atual.id, { creditoImagem: e.target.value })
                        }
                        placeholder="Foto de …"
                      />
                      <span className="studio-campo-nota">
                        Esta é uma das {numeros.comImagemSemCredito} instituições com imagem e
                        sem crédito. Nenhuma imagem publica sem crédito (165), enquanto o
                        campo estiver vazio, esta não publica.
                      </span>
                    </label>
                  )}
                </>
              ) : (
                <p className="studio-nota">
                  Esta instituição não tem imagem no acervo, {numeros.comImagem} de{" "}
                  {numeros.total} têm. Não há upload neste protótipo, e a tela diz isso em vez
                  de simular um.
                </p>
              )}
            </section>

            <section className="studio-painel">
              <h2 className="studio-painel-nome">Acessibilidade da instituição</h2>
              <p className="studio-nota">
                O padrão é o mesmo da tela de espaços, e é o mesmo componente: a instituição
                também é um lugar onde se entra, e rampa e elevador significam aqui o que
                significam lá.
              </p>
              <EditorDeAcessibilidade
                ficha={acessibilidade}
                aoAlterar={(nova) => org.alterarAcessibilidadeDaInstituicao(atual.id, nova)}
                aoDeclararAusencia={() => org.declararInstituicaoSemRecursos(atual.id)}
              />
            </section>
          </div>

          {/* ------- Verificação e cobertura, à direita e coladas ------- */}
          <aside className="org-colada studio-forma">
            <section className="studio-painel">
              <div className="studio-painel-cabeca">
                <h2 className="studio-painel-nome">Verificação</h2>
                <span
                  className={
                    ficha?.verificacao === "solicitada"
                      ? "studio-pastilha studio-pastilha-marca"
                      : "studio-pastilha"
                  }
                >
                  {ROTULO_DA_VERIFICACAO[ficha?.verificacao ?? "nao-verificada"]}
                </span>
              </div>
              <p className="studio-nota">{QUEM_VERIFICA}</p>
              <div className="studio-acoes">
                <button
                  type="button"
                  className="studio-botao studio-botao-primario"
                  disabled={ficha?.verificacao === "solicitada"}
                  onClick={() => org.solicitarVerificacao(atual.id)}
                >
                  {ficha?.verificacao === "solicitada"
                    ? "Encaminhada ao Admin"
                    : "Solicitar verificação ao Admin"}
                </button>
              </div>
              {ficha?.verificacao === "solicitada" ? (
                <p className="studio-travado">
                  O pedido está com o Admin (92). Esta tela não tem como marcar «verificada»,
                  e não ter é o ponto.
                </p>
              ) : null}
            </section>

            <section className="studio-painel">
              <h2 className="studio-painel-nome">Como o app público lê esta instituição</h2>
              <FichaDeAcessibilidade
                acessibilidade={
                  acessibilidade?.dimensoes ?? acessibilidadeDeEspacoVazia().dimensoes
                }
                declaraDimensoes={declarou || atual.declaraAcessibilidade}
                fonteDaDeclaracao={
                  declarou
                    ? `declarado por ${autor}, ${ficha?.quando ?? dataDeReferencia}`
                    : "o acervo não traz ficha de acessibilidade para instituições"
                }
              />
            </section>

            <section className="studio-painel">
              <h2 className="studio-painel-nome">O que falta nesta ficha</h2>
              <ul className="org-falta">
                {faltasDaInstituicao(
                  ficha,
                  Boolean(atual.imagem),
                  Boolean(atual.creditoImagem),
                  atual.declaraAcessibilidade,
                ).map((f) => (
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
              {imagemSemCredito ? (
                <p className="studio-campo-nota">
                  Enquanto o crédito não for preenchido, a imagem desta instituição não
                  publica.
                </p>
              ) : null}
            </section>

            {ficha ? (
              <p className="studio-literal">
                escrito por {ficha.autor} em {ficha.quando}
              </p>
            ) : null}
          </aside>
        </div>
      )}
    </div>
  );
}
