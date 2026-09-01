"use client";

import { useState } from "react";
import { usePoderDeAdmin, type Alvo } from "@/componentes/admin-estado";
import {
  ROTULO_DA_ACAO,
  ROTULO_DO_ALVO,
  motivoObrigatorio,
  oQueFalta,
  type Acao,
} from "@/dados/admin-acoes";

/**
 * admin-controles.tsx, o que o administrador pode fazer com o item que está na tela.
 *
 * ELE USA O MESMO APLICATIVO. Não existe console de governança: o administrador abre a
 * publicação, o evento ou a comunidade como qualquer pessoa, e ganha esta tira em cima do
 * item. Quem não é administrador não a vê, e a tela é idêntica à de todo mundo.
 *
 * A TIRA É CURTA DE PROPÓSITO. Cinco verbos e um campo. Nada de explicação: quem chegou
 * aqui sabe o que suspender significa.
 */

const ACOES_POR_TIPO: Record<string, Acao[]> = {
  publicacao: ["editar", "mover", "suspender", "apagar"],
  comentario: ["suspender", "apagar"],
  comunidade: ["editar", "suspender", "apagar"],
  evento: ["editar", "mover", "suspender", "apagar"],
  pessoa: ["suspender"],
};

export function ControlesDeAdmin({
  alvo,
  carimbo,
  /** Os destinos possíveis de `mover`, quando o tipo aceita. */
  destinos = [],
  aoAgir,
  compacto = false,
}: {
  alvo: Alvo;
  carimbo: string;
  destinos?: readonly { id: string; nome: string }[];
  aoAgir?: (acao: Acao) => void;
  /** Numa lista a tira perde a moldura e a marca: são dezenas por tela, e a moldura
   *  repetida vira ruído. Em cima de um item ela precisa se destacar do conteúdo. */
  compacto?: boolean;
}) {
  const poder = usePoderDeAdmin(carimbo);
  const [aberta, definirAberta] = useState<Acao | null>(null);
  const [motivo, definirMotivo] = useState("");
  const [destino, definirDestino] = useState("");

  if (!poder.ehAdmin) return null;

  const suspenso = poder.suspenso(alvo.id);
  const apagado = poder.apagado(alvo.id);
  const disponiveis = (ACOES_POR_TIPO[alvo.tipo] ?? ["suspender"]).map((a) =>
    a === "suspender" && suspenso ? "reativar" : a,
  ) as Acao[];

  function agir(acao: Acao) {
    poder.aplicar(acao, alvo, motivo.trim(), destino.trim());
    definirAberta(null);
    definirMotivo("");
    definirDestino("");
    aoAgir?.(acao);
  }

  function abrir(acao: Acao) {
    // Reativar não tira nada do ar e não pede nada. Vai direto.
    if (acao === "reativar") {
      agir(acao);
      return;
    }
    definirAberta(aberta === acao ? null : acao);
    definirMotivo("");
    definirDestino("");
  }

  const falta = aberta ? oQueFalta(aberta, motivo, destino) : [];

  return (
    <aside
      className={compacto ? "adm adm-compacto" : "adm"}
      data-admin-controles={alvo.id}
      data-tipo={alvo.tipo}
    >
      <div className="adm-linha">
        {!compacto && <span className="adm-marca">Admin</span>}
        {apagado ? (
          <span className="adm-estado" data-estado="apagado">
            Apagado
          </span>
        ) : suspenso ? (
          <span className="adm-estado" data-estado="suspenso">
            Suspenso
          </span>
        ) : null}
        {!apagado &&
          disponiveis.map((a) => (
            <button
              key={a}
              type="button"
              className="adm-botao"
              data-acao={a}
              data-aberta={aberta === a ? "sim" : "nao"}
              onClick={() => abrir(a)}
            >
              {ROTULO_DA_ACAO[a]}
            </button>
          ))}
      </div>

      {aberta && (
        <div className="adm-campos" data-campos-de={aberta}>
          {aberta === "editar" && (
            <label className="adm-campo">
              <span>Texto novo</span>
              <input
                value={destino}
                onChange={(e) => definirDestino(e.target.value)}
                data-campo="texto"
              />
            </label>
          )}

          {aberta === "mover" && (
            <label className="adm-campo">
              <span>Mover para</span>
              <select
                value={destino}
                onChange={(e) => definirDestino(e.target.value)}
                data-campo="destino"
              >
                <option value="">escolha</option>
                {destinos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome}
                  </option>
                ))}
              </select>
            </label>
          )}

          {motivoObrigatorio(aberta) && (
            <label className="adm-campo">
              <span>Motivo</span>
              <input
                value={motivo}
                onChange={(e) => definirMotivo(e.target.value)}
                data-campo="motivo"
              />
            </label>
          )}

          <div className="adm-linha">
            <button
              type="button"
              className="adm-botao"
              data-confirmar={aberta}
              disabled={falta.length > 0}
              onClick={() => agir(aberta)}
            >
              {ROTULO_DA_ACAO[aberta]} {ROTULO_DO_ALVO[alvo.tipo]}
            </button>
            <button type="button" className="adm-botao" onClick={() => definirAberta(null)}>
              Cancelar
            </button>
            {falta.length > 0 && (
              <span className="adm-falta" data-falta>
                falta {falta.join(" e ")}
              </span>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
