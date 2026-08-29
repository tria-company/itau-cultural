import { Grafismo } from "@/componentes/grafismo";
import { Recompensas } from "@/componentes/recompensas";
import { SaldoDaLoja } from "@/componentes/loja-saldo";
import { BarraDoStudio } from "@/componentes/produtor-barra";
import { PAUTAS_COM_FICHA } from "@/dados/produtor-rotas";
import { CONTEXTO_DO_PRODUTOR, catalogoComum } from "@/dados/mock/seed-produtor";

/**
 * Studio · Loja de pontos, a vitrine.
 *
 * PORTADA DO OUTRO RAMO em 2026-08-28, do repositorio Apogeunexus/bid-itau. O corpo e o de
 * la, palavra por palavra: o pedido foi que ficassem EXATAMENTE iguais.
 *
 * ELA VOLTOU A SER SO VITRINE EM 29/08/2026. Entre 28 e 29 ela carregou tambem a gestao —
 * um lapis sobre cada cartao e um «+ Novo item» no alto —, e servia a duas pessoas ao mesmo
 * tempo. Cadastrar e editar item mudaram para `/studio/minha-loja/`. Aqui so se gasta ficha.
 *
 * O SALDO NO TOPO E A PORTA DA CARTEIRA, que deixou de ser sub-menu na coluna: a pergunta
 * que leva alguem a abrir a carteira e «quanto eu tenho», e ela se responde onde a pessoa ja
 * esta olhando para precos.
 */
export default function PaginaRecompensas() {
  return (
    <div
      className="flex flex-col gap-5 px-1 py-4 desk:px-2 desk:py-6"
      data-margem-quase-nula
    >
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <Grafismo variacao="barra" className="h-5 w-auto shrink-0 text-acao-tinta" />
          <h1 className="text-2xl leading-tight font-bold desk:text-3xl">Recompensas</h1>
        </div>
      </header>

      <SaldoDaLoja />

      <Recompensas hoje={CONTEXTO_DO_PRODUTOR.dataDeReferencia} />

      <BarraDoStudio pautasComFicha={PAUTAS_COM_FICHA} imagens={catalogoComum().imagens} />
    </div>
  );
}
