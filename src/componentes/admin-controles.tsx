"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { usePoderDeAdmin, type Alvo } from "@/componentes/admin-estado";
import {
  ROTULO_DA_ACAO,
  ROTULO_DO_ALVO,
  motivoObrigatorio,
  oQueFalta,
  type Acao,
} from "@/dados/admin-acoes";
import {
  ROTA_DA_PONTE,
  destinoDaCoisa,
  guardarAlvoParaEditar,
  type PautaDoStudio,
} from "@/dados/admin-destinos";

/**
 * admin-controles.tsx, o que o administrador pode fazer com o item que esta na tela.
 *
 * ELE USA O MESMO APLICATIVO. Nao existe console de governanca: o administrador abre a
 * publicacao, o evento ou a comunidade como qualquer pessoa, e ganha esta tira em cima do
 * item. Quem nao e administrador nao a ve, e a tela e identica a de todo mundo.
 *
 * AGORA E UM MENU, e nao mais uma fileira de botoes. A fileira funcionava em cima de um
 * item, onde ela aparece uma vez; numa lista de trezentas linhas ela aparecia trezentas
 * vezes, quatro verbos por linha, e o que o olho via era ruido em vez de conteudo. O
 * gatilho e um so, o verbo esta a um toque, e a linha volta a ser sobre a coisa listada.
 *
 * ELE FECHA POR FORA E PELO ESC, que e o minimo que um menu sobreposto deve. Sem isso,
 * abrir o segundo deixaria o primeiro aberto atras dele.
 */

const ACOES_POR_TIPO: Record<string, Acao[]> = {
  publicacao: ["editar", "mover", "suspender", "apagar"],
  comentario: ["suspender", "apagar"],
  comunidade: ["editar", "suspender", "apagar"],
  evento: ["editar", "mover", "suspender", "apagar"],
  pessoa: ["editar", "suspender"],
  item: ["editar", "suspender", "apagar"],
};

/** Os verbos que tiram algo do ar ganham tratamento visual proprio no menu. */
const GRAVES: readonly Acao[] = ["suspender", "apagar"];

export function ControlesDeAdmin({
  alvo,
  carimbo,
  /** Os destinos possiveis de `mover`, quando o tipo aceita. */
  destinos = [],
  aoAgir,
  compacto = false,
  edicao,
}: {
  alvo: Alvo;
  carimbo: string;
  destinos?: readonly { id: string; nome: string }[];
  aoAgir?: (acao: Acao) => void;
  /**
   * O QUE O «EDITAR» PRECISA SABER para levar à ficha do Studio.
   *
   * A tela do item já tem título, resumo e linguagens desenhados; ela os empresta aqui, e a
   * ponte os usa para preencher a ficha nova quando o item ainda não tem uma. Sem isto o
   * verbo cai no campo de texto embutido, que era o que existia antes e não é edição.
   */
  edicao?: {
    /** A pauta do Studio que alimenta esta tela, quando existe. */
    pauta?: PautaDoStudio;
    /** A coisa do Admin, quando o gatilho vem de uma lista. */
    coisa?: string;
    resumo?: string;
    linguagens?: readonly string[];
    /** A rota pública do item, para onde voltar e para onde ir quando não há ficha. */
    rota?: string;
  };
  /** Numa lista a tira perde a moldura e a marca: sao dezenas por tela, e a moldura
   *  repetida vira ruido. Em cima de um item ela precisa se destacar do conteudo. */
  compacto?: boolean;
}) {
  const poder = usePoderDeAdmin(carimbo);
  const router = useRouter();
  const [semFicha, definirSemFicha] = useState<string | null>(null);
  const [menu, definirMenu] = useState(false);
  const [aberta, definirAberta] = useState<Acao | null>(null);
  const [motivo, definirMotivo] = useState("");
  const [destino, definirDestino] = useState("");
  const caixa = useRef<HTMLDivElement>(null);
  const idDoMenu = useId();

  useEffect(() => {
    if (!menu) return;

    function noDocumento(e: MouseEvent) {
      if (caixa.current && !caixa.current.contains(e.target as Node)) definirMenu(false);
    }
    function naTecla(e: KeyboardEvent) {
      if (e.key === "Escape") definirMenu(false);
    }

    document.addEventListener("mousedown", noDocumento);
    document.addEventListener("keydown", naTecla);
    return () => {
      document.removeEventListener("mousedown", noDocumento);
      document.removeEventListener("keydown", naTecla);
    };
  }, [menu]);

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

  /**
   * EDITAR NAVEGA, e não abre um campo.
   *
   * O que existia era uma caixa de «Texto novo» em cima do item: trocar o título de uma
   * coisa não é editar a coisa. Agora o verbo leva à ficha do Studio que alimenta aquela
   * tela, pela ponte de `/admin/abrir/`. Onde o Studio não tem ficha (pessoa, coletivo,
   * instituição) a tira DIZ isso, em vez de fabricar uma pauta; onde a própria tela do item
   * já tem o poder inteiro (publicação, comunidade), ela leva para lá.
   */
  function editar() {
    definirMenu(false);
    definirSemFicha(null);
    const rota = edicao?.rota ?? "";

    if (edicao?.pauta) {
      router.push(
        guardarAlvoParaEditar({
          pauta: edicao.pauta,
          alvo: alvo.id,
          titulo: alvo.titulo,
          resumo: edicao.resumo ?? "",
          linguagens: [...(edicao.linguagens ?? [])],
          volta: rota || "/admin/",
        }),
      );
      return;
    }

    const destino = destinoDaCoisa(edicao?.coisa ?? "", rota);
    if (destino.tipo === "ficha") {
      router.push(
        guardarAlvoParaEditar({
          pauta: destino.pauta,
          alvo: alvo.id,
          titulo: alvo.titulo,
          resumo: edicao?.resumo ?? "",
          linguagens: [...(edicao?.linguagens ?? [])],
          volta: rota || "/admin/",
        }),
      );
      return;
    }
    if (destino.tipo === "rota" && destino.rota) {
      router.push(destino.rota);
      return;
    }
    definirSemFicha(
      destino.tipo === "sem-ficha"
        ? destino.porque
        : "Não há ficha do Studio para este item.",
    );
  }

  function escolher(acao: Acao) {
    definirMenu(false);
    // Reativar nao tira nada do ar e nao pede nada. Vai direto.
    if (acao === "reativar") {
      agir(acao);
      return;
    }
    if (acao === "editar") {
      editar();
      return;
    }
    definirAberta(acao);
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
        {/* A MARCA «ADMIN» SAIU. Ela era metade da faixa laranja em cima do item, e a faixa
            existia para segurar um menu que hoje cabe num botão de três pontinhos. Quem vê
            o botão sabe de quem ele é: ninguém mais o vê. */}
        {apagado ? (
          <span className="adm-estado" data-estado="apagado">
            Apagado
          </span>
        ) : suspenso ? (
          <span className="adm-estado" data-estado="suspenso">
            Suspenso
          </span>
        ) : null}

        {!apagado && (
          <div className="adm-menu-caixa" ref={caixa}>
            {/* TRÊS PONTINHOS, e não uma faixa escrita «Ações». Em cima de um item a faixa
                tomava a largura da tela para oferecer um menu; o gesto é o mesmo e cabe num
                botão redondo, que é o que o resto do mundo usa para «mais opções». */}
            <button
              type="button"
              className="adm-botao adm-gatilho"
              data-menu-de={alvo.id}
              aria-haspopup="menu"
              aria-expanded={menu}
              aria-controls={menu ? idDoMenu : undefined}
              aria-label={`Ações de administração: ${alvo.titulo}`}
              title="Ações de administração"
              onClick={() => definirMenu((a) => !a)}
            >
              <span className="adm-gatilho-pontos" aria-hidden="true" />
            </button>

            {menu && (
              <ul className="adm-menu" id={idDoMenu} role="menu" data-menu-aberto={alvo.id}>
                {disponiveis.map((a) => (
                  <li key={a} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className="adm-menu-item"
                      data-acao={a}
                      data-grave={GRAVES.includes(a) ? "sim" : "nao"}
                      onClick={() => escolher(a)}
                    >
                      {ROTULO_DA_ACAO[a]}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {semFicha && (
        <p className="adm-sem-ficha" data-sem-ficha>
          {semFicha}
        </p>
      )}

      {aberta && (
        <div className="adm-campos" data-campos-de={aberta}>
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
              className="adm-botao adm-botao-forte"
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
