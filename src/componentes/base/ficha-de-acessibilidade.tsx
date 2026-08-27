"use client";

import { AtoDeDeclarar } from "@/componentes/base/ato-de-declarar";
import { DIMENSOES_DE_ACESSIBILIDADE, acessibilidadeVazia } from "@/dados/tipos-acesso";
import { RECURSOS_FISICOS, ROTULO_DO_RECURSO, recursosFisicosVazios } from "@/dados/tipos-organizacao";
import type { Acessibilidade, RecursosFisicos } from "@/dados/tipos-produtor";

/**
 * base/ficha-de-acessibilidade.tsx, as 8 dimensões e os 5 recursos, NUM ATO SÓ.
 *
 * NUM ATO SÓ, e a insistência tem causa medida. A ficha estava repartida entre três telas,
 * o evento declarava dimensões, o espaço declarava recursos físicos, e a mídia declarava
 * outra vez as mesmas oito. Três lugares para a mesma pergunta produzem três respostas
 * diferentes sobre o mesmo lugar, e o público lê uma delas sem saber qual.
 *
 * OS RECURSOS FÍSICOS SÓ APARECEM QUANDO HÁ LUGAR. Rampa e elevador não existem numa
 * transmissão, e perguntar por eles ensinaria a ignorar campo obrigatório. Quem decide é a
 * modalidade, e a ficha recebe isso por prop em vez de adivinhar.
 *
 * OS DOIS CATÁLOGOS SÃO FECHADOS, e a tela diz por quê. As 8 dimensões vêm do CMS do Itaú
 * Cultural e da norma de acessibilidade; os 5 recursos, da mesma norma. Um deles editável
 * faria a plataforma inventar uma categoria de acessibilidade, que é exatamente o tipo de
 * coisa que não se inventa.
 */

export const CATALOGO_FECHADO =
  "As 8 dimensões e os 5 recursos vêm do CMS do Itaú Cultural e da norma de " +
  "acessibilidade. Este é um dos três catálogos que o Studio não modela, inventar uma " +
  "categoria de acessibilidade seria inventar um direito.";

export function FichaDeAcessibilidade({
  dimensoes,
  fisicos,
  declarada,
  temLugarFisico,
  aoMudarDimensoes,
  aoMudarFisicos,
  aoDeclarar,
  aoDesfazer,
  /** O que o acervo já declarava sobre este registro. Mostrado como leitura. */
  herdadoDoAcervo,
}: {
  dimensoes: Acessibilidade;
  fisicos: RecursosFisicos;
  declarada: boolean;
  temLugarFisico: boolean;
  aoMudarDimensoes: (a: Acessibilidade) => void;
  aoMudarFisicos: (f: RecursosFisicos) => void;
  aoDeclarar: () => void;
  aoDesfazer: () => void;
  herdadoDoAcervo?: string;
}) {
  const algumaDimensao = DIMENSOES_DE_ACESSIBILIDADE.some((d) => dimensoes[d.chave]);
  const algumFisico = temLugarFisico && RECURSOS_FISICOS.some((r) => fisicos[r]);
  const algumMarcado = algumaDimensao || algumFisico;

  return (
    <div className="prod-acessibilidade" data-declarada={declarada ? "sim" : "nao"}>
      <fieldset className="prod-dimensoes">
        <legend className="prod-campo-rotulo">O que este registro oferece</legend>
        {DIMENSOES_DE_ACESSIBILIDADE.map((d) => (
          <label key={d.chave} className="prod-dimensao">
            <input
              type="checkbox"
              checked={dimensoes[d.chave]}
              data-dimensao={d.chave}
              onChange={(e) => {
                const proxima = { ...dimensoes, [d.chave]: e.target.checked };
                aoMudarDimensoes(proxima);
                // MARCAR JÁ DECLARA. Quem marca «Libras» está dizendo o que oferece.
                if (e.target.checked && !declarada) aoDeclarar();
              }}
            />
            <span className="prod-dimensao-rotulo">{d.rotulo}</span>
          </label>
        ))}
      </fieldset>

      {temLugarFisico ? (
        <fieldset className="prod-dimensoes">
          <legend className="prod-campo-rotulo">O que o lugar tem</legend>
          {RECURSOS_FISICOS.map((r) => (
            <label key={r} className="prod-dimensao">
              <input
                type="checkbox"
                checked={fisicos[r]}
                data-recurso={r}
                onChange={(e) => {
                  aoMudarFisicos({ ...fisicos, [r]: e.target.checked });
                  if (e.target.checked && !declarada) aoDeclarar();
                }}
              />
              <span className="prod-dimensao-rotulo">{ROTULO_DO_RECURSO[r]}</span>
            </label>
          ))}
        </fieldset>
      ) : (
        // A AUSÊNCIA É DECLARADA, numa linha: sumir com o bloco sem dizer nada faria
        // parecer que a ficha esqueceu metade das perguntas.
        <p className="prod-campo-nota">
          Os cinco recursos físicos não se aplicam: este registro não tem lugar físico.
        </p>
      )}

      <AtoDeDeclarar
        declarado={declarada}
        algumMarcado={algumMarcado}
        aoDeclarar={aoDeclarar}
        aoDesfazer={() => {
          // Devolver ao silêncio limpa TUDO: um registro «não declarado» com três caixas
          // marcadas seria uma terceira coisa que o contrato não tem nome para.
          aoMudarDimensoes(acessibilidadeVazia());
          aoMudarFisicos(recursosFisicosVazios());
          aoDesfazer();
        }}
      />

      {herdadoDoAcervo ? (
        <p className="prod-campo-nota" data-herdado>
          <strong>O acervo já declarava:</strong> {herdadoDoAcervo}
        </p>
      ) : null}

      <p className="prod-campo-nota">{CATALOGO_FECHADO}</p>
    </div>
  );
}
