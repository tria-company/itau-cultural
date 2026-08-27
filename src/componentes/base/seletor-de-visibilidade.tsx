"use client";

import { OpcaoDeSegmento, Segmento } from "@/componentes/base/segmento";
import { Campo } from "@/componentes/base/ficha-em-atos";
import { SeletorDeData } from "@/componentes/base/seletores-de-tempo";
import {
  EXPLICACAO_DA_VISIBILIDADE,
  ROTULO_DA_VISIBILIDADE,
  VISIBILIDADES,
} from "@/dados/tipos-produtor";
import type { Visibilidade } from "@/dados/tipos-produtor";

/**
 * base/seletor-de-visibilidade.tsx, quem enxerga isto depois de publicado.
 *
 * VISIBILIDADE E SITUAÇÃO SÃO EIXOS DIFERENTES, e confundi-los é o erro clássico do
 * formulário de publicação. `Situacao` responde «onde este registro está na cadeia de
 * decisão»; `Visibilidade` responde «quem o vê quando ele está publicado». Um registro pode
 * estar publicado E privado ao mesmo tempo, é o pré-lançamento que se manda para a imprensa
 * antes de anunciar, e um campo só não diz as duas coisas.
 *
 * `Segmento` E NÃO CHIPS. A escolha é EXCLUSIVA e obrigatória: sempre exatamente uma das
 * três vale, e «nenhuma» não é estado válido. O chip ensinaria o contrário, que dá para
 * desmarcar tudo (ver o cabeçalho de `base/segmento.tsx`).
 *
 * A EXPLICAÇÃO APARECE SEMPRE, e não num `title`. «Privado por link» significa coisas
 * diferentes em produtos diferentes, e quem publica precisa saber qual delas é esta ANTES de
 * escolher, não depois, ao descobrir que o evento não entrou na busca.
 */
export function SeletorDeVisibilidade({
  visibilidade,
  agendadoPara,
  aoMudar,
  /** `DATA_DE_REFERENCIA`, o mínimo do agendamento. Nunca `new Date()`. */
  hoje,
}: {
  visibilidade: Visibilidade;
  agendadoPara: string | null;
  aoMudar: (v: Visibilidade, agendadoPara: string | null) => void;
  hoje: string;
}) {
  return (
    <div className="prod-visibilidade">
      <Campo rotulo="Visibilidade">
        <Segmento rotulo="visibilidade do registro" data-seletor-visibilidade>
          {VISIBILIDADES.map((v) => (
            <OpcaoDeSegmento
              key={v}
              selecionado={visibilidade === v}
              data-visibilidade={v}
              onClick={() =>
                aoMudar(v, v === "agendado" ? (agendadoPara ?? hoje) : null)
              }
            >
              {ROTULO_DA_VISIBILIDADE[v]}
            </OpcaoDeSegmento>
          ))}
        </Segmento>
      </Campo>

      <p className="prod-campo-nota" data-explicacao-visibilidade={visibilidade}>
        {EXPLICACAO_DA_VISIBILIDADE[visibilidade]}
      </p>

      {visibilidade === "agendado" ? (
        <Campo
          rotulo="Publicar em"
          obrigatorio
          nota="Até esta data o registro fica invisível. É o calendário editorial: escreve-se hoje, o público lê no dia."
        >
          <SeletorDeData
            valor={agendadoPara ?? hoje}
            min={hoje}
            aoMudar={(iso) => aoMudar("agendado", iso)}
            rotuloAria="data do agendamento"
          />
        </Campo>
      ) : null}
    </div>
  );
}
