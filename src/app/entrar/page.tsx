import Link from "next/link";
import { EsqueletoBloco, TelaEsqueleto } from "@/componentes/esqueleto";
import { Grafismo } from "@/componentes/grafismo";
import { SelecaoPapel } from "@/componentes/selecao-papel";
import { SelecaoPersona, type PersonaExibivel } from "@/componentes/selecao-persona";
import { PAPEL_NAO_E_SEGURANCA } from "@/contexto/papel";
import personasJson from "@/dados/gerado/personas.json";

/**
 * Leitura defensiva: se o arquivo gerado mudar de forma ou vier sem personas, a tela cai
 * para a lista vazia com aviso em vez de derrubar o build (D-24).
 */
const bruto = personasJson as { personas?: Array<{ id: string; nome: string; resumo: string }> };
const personas: PersonaExibivel[] = Array.isArray(bruto?.personas)
  ? bruto.personas.map((p) => ({ id: p.id, nome: p.nome, resumo: p.resumo }))
  : [];

export default function Entrar() {
  return (
    <TelaEsqueleto
      nome="Entrada"
      objetivo="Ser a primeira parte da experiência, não um pedágio antes dela: marca sobre imagem do acervo, a frase de proposta e a escolha de quem está entrando."
    >
      <EsqueletoBloco altura="9rem" rotulo="imagem do acervo, com a marca por cima" />

      <p className="flex items-center gap-2 text-lg leading-snug font-bold">
        <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
        Descubra a cultura brasileira pelo que te move
      </p>

      {/* D-25 exige que o mock esteja rotulado como tal NA PRÓPRIA TELA. */}
      <p className="rounded-lg border border-acao bg-acao/10 p-3 text-xs font-semibold">
        Mock explícito: este protótipo não tem autenticação. Escolher uma persona só grava a
        escolha no navegador, não há cadastro, senha, sessão nem dado pessoal.
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold tracking-wide text-tinta-2 uppercase">
          Entrar como
        </h2>
        <SelecaoPersona personas={personas} />
      </section>

      {/* Os perfis de demonstração. Vêm DEPOIS das personas de propósito: quem entra pela
          primeira vez está escolhendo o que quer ver, não em que mesa quer sentar. */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold tracking-wide text-tinta-2 uppercase">
          Perfis de demonstração
        </h2>
        <p className="text-xs text-tinta-2">
          Cinco perfis, e cada um abre uma superfície diferente. O Produtor alimenta as onze
          pautas do produto e publica direto ao ar; a Moderação fiscaliza depois; o
          Observatório mede; a Administração governa a plataforma.
        </p>
        {/* D-25 exige que o mock esteja rotulado como tal NA PRÓPRIA TELA, e aqui a
            ressalva é mais forte que a das personas, porque «perfil de acesso» é
            exatamente o tipo de coisa que uma banca poderia ler como segurança. */}
        <p className="rounded-lg border border-acao bg-acao/10 p-3 text-xs font-semibold">
          {PAPEL_NAO_E_SEGURANCA}
        </p>
        <SelecaoPapel />
      </section>

      <EsqueletoBloco altura="4rem" rotulo="consentimento LGPD com escopo explícito e link para a política" />

      <Link
        href="/descobrir"
        className="w-fit text-sm font-semibold text-acao-tinta underline underline-offset-2"
      >
        Pular para Descobrir
      </Link>
    </TelaEsqueleto>
  );
}
