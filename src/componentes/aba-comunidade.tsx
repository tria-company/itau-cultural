"use client";

import { useEffect, useRef, useState } from "react";
import { nomeDe } from "@/componentes/comunidade";
import { ComunidadesParaLer } from "@/componentes/comunidades-para-ler";
import { Explorar } from "@/componentes/comunidade-explorar";
import { MeuFeed } from "@/componentes/comunidade-meu-feed";
import { usePontos } from "@/contexto/pontos";
import { PRODUTOR_DA_CASA, comunidadePorId } from "@/dados/comunidade";

/**
 * aba-comunidade.tsx — as tres metades da aba Comunidade.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * MEU FEED, EXPLORAR E DESCOBRIR, no topo. As duas primeiras são feed de posts: o que as
 * comunidades que ele segue publicaram, e o resto, das que ele ainda NÃO segue, ordenado
 * pelo que ele já demonstrou interesse. Elas nunca mostram o mesmo post, e é isso que faz
 * valer a pena trocar. A terceira não é feed: é a galeria de comunidades, para escolher
 * quem seguir.
 *
 * DESCOBRIR VIROU ABA EM 31/08/2026. Ela era uma pastilha «Descobrir ›» dentro da linha de
 * resumo, um destino de terceira classe escondido no canto de um cartão. É uma das três
 * coisas que se faz aqui, e as três agora estão no mesmo lugar.
 *
 * A ABA QUE ABRE DEPENDE DE TER FEED. Quem não segue ninguém cai em DESCOBRIR, porque «meu
 * feed» vazio como primeira tela é uma porta fechada, e a pergunta de quem chega sem seguir
 * ninguém é «quais existem». Quem segue alguém cai no feed, que é o que ele voltou aqui para
 * ver. Trocar continua a um toque, nos dois casos.
 *
 * «MEU FEED» É TAMBÉM UM FILTRO (pedido de 31/08/2026). A aba abre um menu com as
 * comunidades que ele segue, e marcar uma ou mais restringe o feed a elas. Nada marcado quer
 * dizer todas, e não nenhuma: filtro que começa vazio e esconde tudo é uma tela quebrada no
 * primeiro toque.
 *
 * O TRILHO É `.prod-trilho-abas`, que já existe e já sabe desenhar aba ativa e inativa. Um
 * segmentado novo aqui seria uma terceira gramática para a mesma pergunta, e este projeto já
 * aposentou um por isso.
 *
 * QUEM DECIDE É O CLIENTE, porque quem sabe é o `localStorage`. No servidor não há
 * assinatura, o HTML do build sai em Explorar, e é o que uma pessoa sem estado vê.
 * ─────────────────────────────────────────────────────────────────────────────
 */
type Metade = "feed" | "explorar" | "descobrir";

const ABAS: { id: Metade; rotulo: string }[] = [
  { id: "feed", rotulo: "Meu feed" },
  { id: "explorar", rotulo: "Explorar" },
  { id: "descobrir", rotulo: "Descobrir" },
];

export function AbaComunidade({ inicial }: { inicial?: Metade }) {
  const { motor, hidratado } = usePontos();

  const segueAlguma =
    hidratado &&
    motor.atual.assinadas.some((id) => comunidadePorId(id)?.donoId !== PRODUTOR_DA_CASA);

  // `null` = ainda não escolheu à mão, e vale a regra. Assim que ele toca numa aba, a
  // escolha dele vence, inclusive a de ficar no feed vazio para ver que está vazio.
  const [escolhida, setEscolhida] = useState<Metade | null>(null);
  const atual = escolhida ?? inicial ?? (segueAlguma ? "feed" : "descobrir");

  /** As comunidades marcadas no filtro. Vazio quer dizer todas. */
  const [filtro, setFiltro] = useState<string[]>([]);
  const [menuAberto, setMenuAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);

  const seguidas = hidratado
    ? motor.atual.assinadas.filter(
        (id) => comunidadePorId(id)?.donoId !== PRODUTOR_DA_CASA,
      )
    : [];

  // Fecha ao clicar fora e no Escape: menu que só fecha pelo próprio gatilho prende quem
  // abriu por engano, e é o defeito clássico de dropdown escrito à mão.
  useEffect(() => {
    if (!menuAberto) return;
    const fora = (e: MouseEvent) => {
      if (!caixa.current?.contains(e.target as Node)) setMenuAberto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuAberto(false);
    };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", tecla);
    };
  }, [menuAberto]);

  // Comunidade que ele deixou de seguir não pode continuar filtrando um feed onde ela já
  // não entra: o filtro ficaria apontando para o vazio, sem ninguém para desmarcar.
  useEffect(() => {
    setFiltro((antes) => {
      const vivos = antes.filter((id) => seguidas.includes(id));
      return vivos.length === antes.length ? antes : vivos;
    });
  }, [seguidas]);

  function marcar(id: string) {
    setFiltro((antes) =>
      antes.includes(id) ? antes.filter((x) => x !== id) : [...antes, id],
    );
  }

  return (
    <div className="prod-corpo" data-aba-comunidade={atual}>
      <div className="prod-trilho-abas" role="tablist" aria-label="O que mostrar">
        {ABAS.map((a) =>
          a.id === "feed" ? (
            <div className="prod-aba-menu" ref={caixa} key={a.id}>
              <button
                type="button"
                role="tab"
                className="prod-pauta"
                data-ativa={atual === "feed" ? "sim" : "nao"}
                aria-selected={atual === "feed"}
                aria-expanded={menuAberto}
                onClick={() => {
                  if (atual !== "feed") setEscolhida("feed");
                  setMenuAberto((x) => !x);
                }}
                data-aba="feed"
              >
                {filtro.length === 0
                  ? "Meu feed"
                  : filtro.length === 1
                    ? nomeDe(filtro[0])
                    : `${filtro.length} comunidades`}
                <span className="prod-aba-seta" aria-hidden>
                  ›
                </span>
              </button>

              {menuAberto ? (
                <ul className="seletor-painel" data-menu-do-feed>
                  <li>
                    <button
                      type="button"
                      className="seletor-opcao"
                      aria-pressed={filtro.length === 0}
                      onClick={() => setFiltro([])}
                      data-filtro="todas"
                    >
                      Todas
                      {filtro.length === 0 ? <span aria-hidden>✓</span> : null}
                    </button>
                  </li>
                  {seguidas.length === 0 ? (
                    <li>
                      <span className="seletor-opcao" data-menu-vazio>
                        Você ainda não segue nenhuma
                      </span>
                    </li>
                  ) : (
                    seguidas.map((id) => (
                      <li key={id}>
                        <button
                          type="button"
                          className="seletor-opcao"
                          aria-pressed={filtro.includes(id)}
                          onClick={() => marcar(id)}
                          data-filtro={id}
                        >
                          {nomeDe(id)}
                          {filtro.includes(id) ? <span aria-hidden>✓</span> : null}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              ) : null}
            </div>
          ) : (
            <button
              key={a.id}
              type="button"
              role="tab"
              className="prod-pauta"
              data-ativa={atual === a.id ? "sim" : "nao"}
              aria-selected={atual === a.id}
              onClick={() => {
                setEscolhida(a.id);
                setMenuAberto(false);
              }}
              data-aba={a.id}
            >
              {a.rotulo}
            </button>
          ),
        )}
      </div>

      {atual === "feed" ? (
        <MeuFeed filtro={filtro} />
      ) : atual === "explorar" ? (
        <Explorar />
      ) : (
        <ComunidadesParaLer />
      )}
    </div>
  );
}
