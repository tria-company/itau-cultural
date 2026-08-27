"use client";

import { useRouter } from "next/navigation";
import { DESCRICAO_DO_PAPEL, PAPEIS, chegadaDe, usePapel } from "@/contexto/papel";
import type { Papel } from "@/contexto/papel";
import { PAPEL_NAO_E_SEGURANCA } from "@/contexto/papel";
import { semTravessao } from "@/dados/tipos-produtor";

/**
 * troca-de-acesso.tsx, o seletor de tipo de acesso, em qualquer perfil.
 *
 * UM SÓ CONTROLE, EM TODAS AS TELAS DE PERFIL. Ele nasceu dentro do perfil do Produtor
 * e ficou preso lá: quem estava como Público não tinha por onde voltar ao Studio sem
 * digitar a URL de `/entrar`. Extraí-lo é o que faz a troca existir nos dois lugares sem
 * duas cópias para divergirem no primeiro ajuste.
 *
 * TROCAR NAVEGA. O seletor antigo (`TrocaDePapel`, o `<select>` do menu) mudava o papel e
 * deixava a pessoa parada, olhando uma navegação que passara a oferecer outra coisa. Aqui
 * a escolha leva à rota de chegada do perfil, como a tela de entrada faz: quem escolhe
 * «Moderação» quer a fila, não a mesma tela com menu diferente.
 *
 * A SUPERFÍCIE DE DESKTOP É DITA ANTES DO TOQUE. Três dos cinco perfis chegam em telas que
 * só existem na visão web (D-67), e descobrir isso depois do toque é perder o lugar para
 * aprender uma regra que a lista podia ter dito. Quem declara é o contrato: `soWeb`.
 *
 * NÃO É AUTENTICAÇÃO, e o rodapé diz isso com todas as letras (D-25).
 */
export function TrocaDeAcesso({ titulo = "Tipo de acesso" }: { titulo?: string }) {
  const router = useRouter();
  const { papel, definirPapel, hidratado } = usePapel();

  function trocar(escolhido: Papel) {
    if (escolhido === papel) return;
    definirPapel(escolhido);
    router.push(chegadaDe(escolhido));
  }

  return (
    <section className="acesso-secao" aria-labelledby="troca-de-acesso-titulo">
      <h2 className="acesso-titulo" id="troca-de-acesso-titulo">
        {titulo}
      </h2>
      <p className="acesso-nota">
        Cada perfil oferece uma navegação diferente. Trocar leva você para onde ele abre, e
        voltar é só escolher outro aqui.
      </p>

      <div className="acesso-lista" data-tipos-de-acesso>
        {PAPEIS.map((p) => {
          const d = DESCRICAO_DO_PAPEL[p];
          // Antes de hidratar nenhum aparece marcado: o HTML do build não sabe o que o
          // navegador guardou, e fingir que sabe divergiria na hidratação.
          const atual = hidratado && papel === p;
          return (
            <button
              key={p}
              type="button"
              className="acesso-linha"
              data-acesso={p}
              data-atual={atual ? "sim" : "nao"}
              aria-pressed={atual}
              onClick={() => trocar(p)}
            >
              <span className="acesso-marca" aria-hidden>
                {atual ? "✓" : ""}
              </span>
              <span className="acesso-texto">
                <strong>{d.rotulo}</strong>
                <span className="acesso-resumo">{semTravessao(d.resumo)}</span>
                <span className="acesso-rota">
                  {atual
                    ? "você está aqui"
                    : d.soWeb
                      ? `${d.chegada} · só na visão web`
                      : `abre em ${d.chegada}`}
                </span>
              </span>
              <span className="acesso-seta" aria-hidden>
                ▸
              </span>
            </button>
          );
        })}
      </div>

      <p className="acesso-nota" data-mock-do-acesso>
        {semTravessao(PAPEL_NAO_E_SEGURANCA)}
      </p>
    </section>
  );
}
