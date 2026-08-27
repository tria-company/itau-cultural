"use client";

import { useMemo, useState } from "react";
import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { Folha } from "@/componentes/base/folha";
import { normalizar } from "@/dados/indice";
import { NENHUMA_PORTA_BLOQUEIA, PORTAS } from "@/dados/tipos-acesso";
import { semTravessao } from "@/dados/tipos-produtor";
import type { Porta } from "@/dados/tipos-acesso";

/**
 * base/campo-com-proposta.tsx, buscar no acervo; achou vincula, não achou PROPÕE e segue.
 *
 * O PADRÃO QUE ATRAVESSA A FICHA INTEIRA. Obra, pessoa, coletivo, espaço, série, programa:
 * em todos, o produtor precisa apontar para algo que ou já existe no acervo, e aí o
 * vínculo é real, ou ainda não existe, e aí ele não pode ficar parado esperando outro nível
 * criar. Um campo que só aceita o que já existe trava a jornada; um que aceita texto livre
 * enche o acervo de nomes que ninguém reconciliou.
 *
 * A PROPOSTA NÃO BLOQUEIA, e isso é decisão de produto, não frouxidão. Uma porta que
 * travasse faria o produtor esperar por um nível que ele não controla, e a demonstração
 * pararia no meio. Ela aparece NOMEADA na revisão, com o nível responsável, e a saída vem
 * junto (`NENHUMA_PORTA_BLOQUEIA`, §8 da ontologia).
 *
 * O VERBETE VAI EMBUTIDO NA CONFERÊNCIA. «Maria Silva» pode ser cinco pessoas no acervo, e
 * vincular a errada é pior do que não vincular: o resumo cortado aparece dentro do resultado,
 * antes do toque, e é o que permite escolher com informação em vez de por ordem alfabética.
 */

export interface ItemDoAcervo {
  id: string;
  titulo: string;
  /** «pessoa», «coletivo», «obra», «espaço», o que aparece na pastilha do resultado. */
  classe: string;
  /** O verbete cortado. Vazio quando o acervo não traz. */
  resumo?: string;
}

export interface EscolhaDoCampo {
  id: string | null;
  titulo: string | null;
  /** `true` quando o título foi PROPOSTO em vez de vinculado. */
  proposto: boolean;
}

export interface PropsCampo {
  /** O que se procura, «Obra», «Pessoa do elenco», «Espaço». Vira o título da folha. */
  nome: string;
  acervo: readonly ItemDoAcervo[];
  escolha: EscolhaDoCampo;
  aoEscolher: (e: EscolhaDoCampo) => void;
  /** Para qual nível a proposta escala. */
  porta: Porta;
  /** Uma saída EXTRA, além de propor, «cadastrar espaço aqui mesmo». */
  aoCriarNoLugar?: () => void;
  rotuloDeCriar?: string;
}

/** O acervo é grande (792 agentes, 239 obras). Mostrar tudo antes de digitar seria uma
 *  lista que ninguém percorre; o teto existe para a folha abrir instantânea. */
const TETO_DE_RESULTADOS = 40;

export function CampoComProposta({
  nome,
  acervo,
  escolha,
  aoEscolher,
  porta,
  aoCriarNoLugar,
  rotuloDeCriar,
}: PropsCampo) {
  const [aberta, setAberta] = useState(false);
  const [busca, setBusca] = useState("");

  const resultados = useMemo(() => {
    const t = normalizar(busca).trim();
    if (t === "") return acervo.slice(0, TETO_DE_RESULTADOS);
    return acervo.filter((x) => normalizar(x.titulo).includes(t)).slice(0, TETO_DE_RESULTADOS);
  }, [acervo, busca]);

  const quantosCasam = useMemo(() => {
    const t = normalizar(busca).trim();
    if (t === "") return acervo.length;
    return acervo.filter((x) => normalizar(x.titulo).includes(t)).length;
  }, [acervo, busca]);

  const candidato = useMemo(() => {
    const cru = busca.trim();
    if (cru.length < 2) return null;
    return acervo.some((x) => normalizar(x.titulo) === normalizar(cru)) ? null : cru;
  }, [busca, acervo]);

  function fechar() {
    setAberta(false);
    setBusca("");
  }

  return (
    <>
      <button
        type="button"
        className="prod-abrir-catalogo"
        onClick={() => setAberta(true)}
        data-abrir-acervo={nome}
      >
        <span className="prod-abrir-catalogo-rotulo">
          {escolha.titulo ?? `Buscar ${nome.toLowerCase()} no acervo`}
        </span>
        <span className="prod-abrir-catalogo-seta" aria-hidden>
          ▸
        </span>
      </button>

      {escolha.titulo ? (
        <div className="prod-escolhido" data-proposto={escolha.proposto ? "sim" : "nao"}>
          <span className="prod-escolhido-nome">{escolha.titulo}</span>
          {escolha.proposto ? (
            <span className="prod-pendencia-dono">
              proposto, {PORTAS[porta].nivel}
            </span>
          ) : (
            <span className="prod-campo-nota">vinculado ao acervo</span>
          )}
          <BotaoDoStudio
            curto
            aoClicar={() => aoEscolher({ id: null, titulo: null, proposto: false })}
            data-acao="desvincular"
          >
            Trocar
          </BotaoDoStudio>
        </div>
      ) : null}

      <Folha
        aberta={aberta}
        titulo={nome}
        descricao={`${acervo.length} no acervo. Não achou? Proponha, não trava nada.`}
        aoFechar={fechar}
      >
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder={`buscar em ${acervo.length} registros`}
          className="prod-campo-entrada"
          data-busca-acervo
          aria-label={`buscar ${nome} no acervo`}
        />

        {/* O DENOMINADOR, SEMPRE. «12 de 792» diz que a busca funcionou e que o resto
            existe; «12 resultados» deixa a pessoa sem saber se procurou no lugar certo. */}
        <p className="prod-campo-nota">
          {resultados.length === quantosCasam
            ? `${quantosCasam} de ${acervo.length}`
            : `mostrando ${resultados.length} de ${quantosCasam} que casam · ${acervo.length} no acervo`}
        </p>

        <ul className="prod-opcoes">
          {resultados.map((x) => (
            <li key={x.id}>
              <button
                type="button"
                className="prod-resultado"
                data-resultado={x.id}
                onClick={() => {
                  aoEscolher({ id: x.id, titulo: x.titulo, proposto: false });
                  fechar();
                }}
              >
                <span className="prod-resultado-cabeca">
                  <strong className="prod-resultado-nome">{x.titulo}</strong>
                  <span className="prod-resultado-classe">{x.classe}</span>
                </span>
                {/* O VERBETE EMBUTIDO. Cinco «Maria Silva» no acervo, e vincular a errada é
                    pior do que não vincular. */}
                {x.resumo ? (
                  <span className="prod-resultado-resumo">{x.resumo}</span>
                ) : (
                  <span className="prod-resultado-resumo" data-sem-verbete>
                    o acervo não traz verbete para este registro
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>

        {candidato ? (
          <div className="prod-propor-bloco">
            <button
              type="button"
              className="prod-propor"
              onClick={() => {
                aoEscolher({ id: null, titulo: candidato, proposto: true });
                fechar();
              }}
              data-propor-acervo
            >
              <strong>Propor «{candidato}»</strong>
              <span>
                Ele segue junto com o registro, marcado como proposto. Quem decide é{" "}
                {PORTAS[porta].nivel}, e enquanto isso o estado é «{PORTAS[porta].estado}».
              </span>
            </button>
            <p className="prod-campo-nota">{semTravessao(NENHUMA_PORTA_BLOQUEIA)}</p>
            <p className="prod-campo-nota">
              <strong>Sem esperar:</strong> {semTravessao(PORTAS[porta].saida)}
            </p>
          </div>
        ) : null}

        {/* A SEGUNDA SAÍDA, quando ela existe: cadastrar ali mesmo em vez de propor. É o
            caso do espaço, a ficha dele abre dentro desta e volta com ele selecionado. */}
        {aoCriarNoLugar ? (
          <BotaoDoStudio
            aoClicar={() => {
              fechar();
              aoCriarNoLugar();
            }}
            data-criar-no-lugar
          >
            {rotuloDeCriar ?? `Cadastrar ${nome.toLowerCase()} agora`}
          </BotaoDoStudio>
        ) : null}
      </Folha>
    </>
  );
}
