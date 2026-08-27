"use client";

import {
  FRASE_DO_ATO,
  POR_QUE_O_ATO,
  RECURSOS_FISICOS,
  ROTULO_DO_RECURSO,
  acessibilidadeDeEspacoVazia,
  algumRecursoMarcado,
} from "@/dados/tipos-organizacao";
import { DIMENSOES_DE_ACESSIBILIDADE } from "@/dados/tipos-acesso";
import type { AcessibilidadeDeEspaco } from "@/dados/tipos-organizacao";

/**
 * studio-org-acessibilidade.tsx, o EDITOR da ficha, escrito uma vez para as telas da
 * Organização que coletam acessibilidade.
 *
 * POR QUE ELE EXISTE. A O2 (espaços) e a O1 (instituição) coletam exatamente a mesma ficha:
 * cinco recursos do lugar, oito dimensões de mídia e um ato. Duas cópias deste JSX
 * divergiriam na primeira correção, e o sintoma seria a tela de espaços aceitando um ato
 * que a tela de instituição não aceita, o defeito que o portão «nenhuma segunda ficha de
 * acessibilidade» existe para impedir.
 *
 * ELE NÃO É A FICHA DO APP PÚBLICO, e a distinção é de papel e não de aparência.
 * `FichaDeAcessibilidade` EXIBE o resultado, com os três estados de D-43; este componente
 * ESCREVE. As duas convivem na mesma tela em lugares separados de propósito: lado a lado
 * pareceriam duas fichas concorrentes.
 *
 * OS TRÊS ESTADOS SÃO OS MESMOS DE D-43, e por isso o atributo `data-estado` tem os mesmos
 * três valores da ficha pública. Marcado é «oferece». Desmarcado com a ficha declarada é
 * «declarado ausente». Desmarcado sem declaração é «não declarado», e ele NUNCA é uma
 * variação do «não»: um espaço que não fala de rampa não afirma que não tem rampa.
 */
export function EditorDeAcessibilidade({
  ficha,
  aoAlterar,
  aoDeclararAusencia,
  mostrarFisicos = true,
}: {
  ficha: AcessibilidadeDeEspaco | undefined;
  aoAlterar: (ficha: AcessibilidadeDeEspaco) => void;
  aoDeclararAusencia: () => void;
  /**
   * Mostrar os cinco recursos do LUGAR?
   *
   * `false` na tela de mídia, e a razão é a mesma que separou as duas metades da ficha:
   * rampa e elevador são atributos de um lugar onde se entra, e um podcast não é um lugar.
   * Exibi-los ali pediria uma declaração sobre algo que não existe, e uma caixa marcável
   * que não se aplica é convite para alguém marcá-la.
   */
  mostrarFisicos?: boolean;
}) {
  const atual = ficha ?? acessibilidadeDeEspacoVazia();
  const declarou = atual.declarada;

  const estadoDe = (marcado: boolean) =>
    marcado ? "oferece" : declarou ? "declarado-ausente" : "nao-declarado";

  return (
    <>
      {mostrarFisicos ? (
      <div>
        <p className="studio-rotulo">Recursos do lugar</p>
        <ul className="org-caixas">
          {RECURSOS_FISICOS.map((r) => (
            <li key={r} className="org-caixa" data-estado={estadoDe(atual.fisicos[r])}>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={atual.fisicos[r]}
                  onChange={(e) =>
                    aoAlterar({
                      ...atual,
                      fisicos: { ...atual.fisicos, [r]: e.target.checked },
                      // Marcar É declarar: quem marca uma caixa preencheu a ficha, e um
                      // recurso marcado com `declarada: false` seria uma contradição gravada.
                      declarada: true,
                    })
                  }
                />
                {ROTULO_DO_RECURSO[r]}
              </label>
            </li>
          ))}
        </ul>
        <p className="studio-campo-nota">
          Rampa, elevador, banheiro adaptado, piso tátil e vaga reservada não cabem nas 8
          dimensões de acessibilidade, que são de mídia. Eles estão em estrutura própria,
          forçar rampa dentro de «closed caption» seria fabricar classificação.
        </p>
      </div>
      ) : null}

      <div>
        <p className="studio-rotulo">As 8 dimensões de mídia</p>
        <ul className="org-caixas">
          {DIMENSOES_DE_ACESSIBILIDADE.map((d) => (
            <li
              key={d.chave}
              className="org-caixa"
              data-estado={estadoDe(atual.dimensoes[d.chave])}
            >
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={atual.dimensoes[d.chave]}
                  onChange={(e) =>
                    aoAlterar({
                      ...atual,
                      dimensoes: { ...atual.dimensoes, [d.chave]: e.target.checked },
                      declarada: true,
                    })
                  }
                />
                {d.rotulo}
              </label>
            </li>
          ))}
        </ul>
      </div>

      {/* O ATO. Peso igual ao de salvar, e por isso contêiner próprio: um checkbox no meio
          dos treze seria lido como a décima quarta caixa. */}
      <div className="org-ato" data-declarado={declarou ? "sim" : "nao"}>
        <span className="org-ato-texto">
          {declarou
            ? algumRecursoMarcado(atual.fisicos)
              ? "Ficha declarada, com recursos marcados."
              : "Declarado: não oferece nenhum destes recursos."
            : POR_QUE_O_ATO}
        </span>
        <button
          type="button"
          className="studio-botao studio-botao-primario"
          onClick={aoDeclararAusencia}
        >
          {FRASE_DO_ATO}
        </button>
      </div>
    </>
  );
}
