import { AdminAbrir } from "@/componentes/admin-abrir";
import { DATA_DE_REFERENCIA } from "@/dados/alerta";
import { CONTEXTO_DO_PRODUTOR, registrosSemeados } from "@/dados/mock/seed-produtor";

/**
 * `/admin/abrir`, a passagem do item do acervo para a ficha do Studio.
 *
 * UMA PÁGINA SÓ, e sem parâmetro na rota. A alternativa seria uma rota por item, com
 * `generateStaticParams` sobre as milhares de linhas que o Admin lista; cada uma dessas
 * páginas carregaria a semente do Produtor, e as telas do Studio medem entre 441 e 520 KB no
 * `out/`. Só eventos e espaços dariam 413 páginas e perto de 200 MB. O alvo viaja pela
 * sessão do navegador, e a rota é uma.
 *
 * PÁGINA DE SERVIDOR, e é ela quem toca a semente. `registrosSemeados()` e
 * `CONTEXTO_DO_PRODUTOR` são lidos por valor no build e descem como DTO; o componente é de
 * cliente e não alcança o módulo (DP-F).
 *
 * A SEMENTE TEM QUE SER A DE VERDADE, e não uma lista vazia. `hidratar()` reatribui as
 * variáveis de módulo da semente antes do retorno antecipado, e `reiniciar()` lê essas
 * variáveis: uma semente sintética aqui faria o «Reiniciar a demonstração» do Studio inteiro
 * restaurar o vazio, e o portão do Produtor cairia junto.
 */
export const metadata = {
  title: "Abrindo no Studio",
  description: "A passagem do item do acervo para a ficha que o edita.",
};

export default function PaginaDaPonte() {
  return (
    <div className="flex flex-col gap-5 p-5 desk:p-8">
      <AdminAbrir
        semente={registrosSemeados()}
        contexto={CONTEXTO_DO_PRODUTOR}
        carimbo={DATA_DE_REFERENCIA}
      />
    </div>
  );
}
