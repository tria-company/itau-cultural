"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ControlesDeAdmin } from "@/componentes/admin-controles";
import { usePoderDeAdmin } from "@/componentes/admin-estado";
import { CapaSemImagem } from "@/componentes/capa-sem-imagem";
import type { DescricaoDaCoisa, Linha } from "@/dados/admin-area";
import type { ClasseEntidade } from "@/dados/tipos";

/**
 * admin-lista.tsx, achar e agir em massa.
 *
 * É A OUTRA METADE DO PODER. Em cima do item ele age no que está vendo; aqui ele acha o que
 * não está vendo. Busca por texto, recorte por situação, e a mesma tira em cada linha.
 *
 * O FILTRO É DO NAVEGADOR, e tem que ser: o artefato é estático e não há servidor para
 * consultar. A lista inteira atravessa como primitivo, e o corte por teto é declarado.
 */

const SITUACOES = [
  { id: "todos", rotulo: "Todos" },
  { id: "suspensos", rotulo: "Suspensos" },
  { id: "apagados", rotulo: "Apagados" },
  { id: "editados", rotulo: "Editados" },
  { id: "movidos", rotulo: "Movidos" },
] as const;

type Situacao = (typeof SITUACOES)[number]["id"];

/** Sem acento e sem caixa: quem busca «brô» tem que achar «Bro». */
function simples(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function AdminLista({
  descricao,
  linhas,
  total,
  teto,
  destinos,
  carimbo,
}: {
  descricao: DescricaoDaCoisa;
  linhas: Linha[];
  total: number;
  teto: number;
  destinos: readonly { id: string; nome: string }[];
  carimbo: string;
}) {
  const poder = usePoderDeAdmin(carimbo);
  const [busca, definirBusca] = useState("");
  const [situacao, definirSituacao] = useState<Situacao>("todos");
  const [contexto, definirContexto] = useState("");

  const contextos = useMemo(
    () => [...new Set(linhas.map((l) => l.contexto).filter(Boolean))].sort(),
    [linhas],
  );

  const visiveis = useMemo(() => {
    const q = simples(busca.trim());
    return linhas.filter((l) => {
      if (q && !simples(`${l.titulo} ${l.contexto}`).includes(q)) return false;
      if (contexto && l.contexto !== contexto) return false;
      if (situacao === "suspensos" && !poder.suspenso(l.id)) return false;
      if (situacao === "apagados" && !poder.apagado(l.id)) return false;
      if (situacao === "editados" && poder.edicao(l.id) === null) return false;
      if (situacao === "movidos" && poder.destino(l.id) === null) return false;
      return true;
    });
  }, [linhas, busca, contexto, situacao, poder]);

  if (!poder.pronto) return null;

  if (!poder.ehAdmin) {
    return (
      <p className="adm-aviso" data-nao-e-admin>
        Esta área é da administração. Troque o perfil em <Link href="/meu/">Meu</Link>.
      </p>
    );
  }

  return (
    <div className="adm-lista" data-admin-lista={descricao.coisa}>
      <div className="adm-filtros">
        <label className="adm-campo">
          <span>Buscar</span>
          <input
            value={busca}
            onChange={(e) => definirBusca(e.target.value)}
            data-filtro="busca"
            placeholder={`nome ou ${descricao.colunaDois.toLowerCase()}`}
          />
        </label>

        <label className="adm-campo">
          <span>Situação</span>
          <select
            value={situacao}
            onChange={(e) => definirSituacao(e.target.value as Situacao)}
            data-filtro="situacao"
          >
            {SITUACOES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.rotulo}
              </option>
            ))}
          </select>
        </label>

        {contextos.length > 1 && contextos.length <= 40 && (
          <label className="adm-campo">
            <span>{descricao.colunaDois}</span>
            <select
              value={contexto}
              onChange={(e) => definirContexto(e.target.value)}
              data-filtro="contexto"
            >
              <option value="">todos</option>
              {contextos.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <p className="adm-conta" data-conta={visiveis.length}>
        {visiveis.length.toLocaleString("pt-BR")} de {linhas.length.toLocaleString("pt-BR")}
        {total > teto ? ` · a lista mostra ${teto} de ${total.toLocaleString("pt-BR")}` : ""}
      </p>

      <ul className="adm-linhas">
        {visiveis.map((l) => (
          <li key={l.id} className="adm-item" data-item={l.id}>
            {/* A CAPA SÓ APARECE ONDE ELA EXISTE NA TELA DA COISA. A loja tem foto nos 18
                itens; das comunidades, só a oficial tem. As outras 22 não têm capa em lugar
                nenhum do produto, e inventar uma aqui seria escolher um rosto para
                representar coletivos reais. `next/image` está fora do projeto por decisão
                registrada; sob `output: export` ele exigiria loader e não traria nada. */}
            {l.imagem ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="adm-item-capa" src={l.imagem} alt={l.alt ?? ""} loading="lazy" />
            ) : l.classe ? (
              <CapaSemImagem
                className="adm-item-capa"
                titulo={l.titulo}
                classe={l.classe as ClasseEntidade}
                linguagens={l.linguagens ?? []}
                compacta
              />
            ) : null}
            <div className="adm-item-cima">
              <span className="adm-item-nome">
                {l.rota ? <Link href={l.rota}>{l.titulo}</Link> : l.titulo}
                {l.selo ? <em className="adm-item-selo">{l.selo}</em> : null}
              </span>
              {l.descricao ? (
                <span className="adm-item-descricao">{l.descricao}</span>
              ) : null}
              <span className="adm-item-contexto">{l.contexto}</span>
            </div>
            <ControlesDeAdmin
              alvo={{ tipo: descricao.tipo, id: l.id, titulo: l.titulo }}
              carimbo={carimbo}
              destinos={destinos}
              compacto
            />
          </li>
        ))}
      </ul>

      {visiveis.length === 0 && (
        <p className="adm-vazio" data-lista-vazia>
          Nada com esse recorte.
        </p>
      )}
    </div>
  );
}
