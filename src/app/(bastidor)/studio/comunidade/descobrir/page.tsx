import { ComunidadesParaLer } from "@/componentes/comunidades-para-ler";
import { BarraDoStudio } from "@/componentes/produtor-barra";
import { PAUTAS_COM_FICHA } from "@/dados/produtor-rotas";
import { catalogoComum } from "@/dados/mock/seed-produtor";

/**
 * Studio · Comunidade · descobrir.
 *
 * A GALERIA, PARA QUEM JÁ TEM FEED. `/studio/comunidade/` abre na galeria enquanto ele não
 * segue ninguém, e passa a abrir no feed próprio assim que ele segue a primeira. A partir
 * daí a galeria precisa de endereço, senão ela fica inalcançável no dia seguinte ao
 * primeiro «Seguir».
 */
export default function Pagina() {
  return (
    <div
      className="flex flex-col gap-5 px-1 py-4 desk:px-2 desk:py-6"
      data-margem-quase-nula
    >
      <header className="prod-cabecalho" data-coluna-de-leitura>
        <h1 className="prod-titulo">Descobrir comunidades</h1>
      </header>

      <ComunidadesParaLer />

      <BarraDoStudio pautasComFicha={PAUTAS_COM_FICHA} imagens={catalogoComum().imagens} />
    </div>
  );
}
