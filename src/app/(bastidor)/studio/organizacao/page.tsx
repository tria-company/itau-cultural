import Link from "next/link";
import { SuperficieSoWeb } from "@/componentes/superficie-so-web";
import { StudioOrgNavegacao } from "@/componentes/studio-org-navegacao";
import { TELAS_DA_ORGANIZACAO } from "@/dados/tipos-organizacao";
import {
  DATA_DA_MEDIDA,
  GESTOR_DA_ORGANIZACAO,
  GESTOR_E_AUTORADO,
  ORGANIZACAO_DA_DEMONSTRACAO,
} from "@/dados/organizacao";

/**
 * Studio · Organização · o índice das dez telas.
 *
 * A PORTA DA SUPERFÍCIE, criada em 2026-08-27 junto com a mudança de endereço.
 *
 * As dez telas da Organização moravam sob `/studio/<tela>/`, e cinco delas empilhadas
 * embaixo da pauta do Produtor que trata do mesmo assunto: quem abria «Mídia» para
 * publicar um ativo recebia junto a fila institucional inteira, que ocupava 73% da altura
 * da página. Elas passaram a `/studio/organizacao/<tela>/`, e uma superfície precisa de
 * porta: sem esta página, as dez só se alcançariam pela barra de abas de dentro de uma
 * delas, e a primeira só por URL digitada.
 *
 * A SEPARAÇÃO É DE PERGUNTA, e não de tecnologia: a Organização responde «quem é esta
 * instituição, quem fala por ela e o que o acervo mede»; o Produtor responde «o que eu
 * publico hoje». As duas continuam no mesmo Studio porque a demonstração é uma só.
 *
 * O CABEÇALHO É O MESMO das outras dez, classe por classe (`studio-cabecalho`,
 * `studio-rotulo`, `studio-titulo`, `studio-objetivo`, `studio-nota`): uma porta que não
 * se parece com o cômodo não parece porta.
 *
 * SÓ NA WEB (D-67): ninguém resolve uma fila institucional em 390px.
 */
export default function Pagina() {
  return (
    <SuperficieSoWeb>
      <div className="studio">
        <header className="studio-cabecalho">
          <div className="studio-superficie">
            <p className="studio-rotulo">Studio · Organização · nível 6</p>
            <h1 className="studio-titulo">Organização</h1>
          </div>
          <p className="studio-objetivo">
            As dez telas da instituição: ficha, equipe, acervo medido e conformidade.{" "}
            {ORGANIZACAO_DA_DEMONSTRACAO} · {GESTOR_DA_ORGANIZACAO} · medido em{" "}
            {DATA_DA_MEDIDA}.
          </p>
          <p className="studio-nota">{GESTOR_E_AUTORADO}</p>
          <StudioOrgNavegacao ativa="" />
        </header>

        <section className="studio-painel">
          <h2 className="studio-painel-nome">As dez telas</h2>
          <ul className="web-lista-densa" data-indice-da-organizacao>
            {TELAS_DA_ORGANIZACAO.map((t) => (
              <li key={t.id}>
                <Link href={`${t.rota}/`} className="org-falta-item" data-tela={t.id}>
                  <strong>{t.rotulo}</strong>{" "}
                  <span className="studio-nota">{t.objetivo}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </SuperficieSoWeb>
  );
}
