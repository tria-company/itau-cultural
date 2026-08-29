import { notFound } from "next/navigation";
import { ComunidadeEmGestao } from "@/componentes/comunidade-em-gestao";
import { BarraDoStudio } from "@/componentes/produtor-barra";
import { PAUTAS_COM_FICHA } from "@/dados/produtor-rotas";
import { CONTEXTO_DO_PRODUTOR, catalogoComum } from "@/dados/mock/seed-produtor";
import { slugsDeComunidade } from "@/dados/comunidade-capas";
import { comunidadePorId, minhasComunidades } from "@/dados/comunidade";

/**
 * Studio · Comunidades · uma delas.
 *
 * A GESTÃO DE UMA COMUNIDADE: capa, nome, chamada, descrição, e o feed com publicar, editar
 * e apagar. É a tela que antes vivia embutida em `/studio/comunidade/`, atendendo ao mesmo
 * tempo quem lê e quem publica.
 *
 * AS ROTAS RESERVADAS ENTRAM AQUI TAMBÉM. Comunidade criada no navegador não tem HTML no
 * `out/`, e a saída é a que as 20 publicações já usam. As constantes moram em
 * `@/dados/comunidade-capas` porque `generateStaticParams` roda no servidor, e constante
 * exportada de módulo `"use client"` chega aqui como `undefined`.
 */
export function generateStaticParams() {
  return [
    ...minhasComunidades().map((c) => ({ id: c.id })),
    ...slugsDeComunidade().map((id) => ({ id })),
  ];
}

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const comunidade = comunidadePorId(id);
  // Endereço reservado ainda vazio: a página existe, e quem a preenche é o armazém no
  // cliente. Recusar aqui daria 404 na comunidade que o produtor acabou de criar.
  if (!comunidade && !slugsDeComunidade().includes(id)) notFound();

  return (
    <>
      <ComunidadeEmGestao
        comunidadeId={id}
        nome={comunidade?.nome ?? ""}
        descricao={comunidade?.descricao ?? ""}
        assinantes={comunidade?.assinantes ?? 0}
        hoje={CONTEXTO_DO_PRODUTOR.dataDeReferencia}
        imagens={catalogoComum().imagens}
      />

      <BarraDoStudio pautasComFicha={PAUTAS_COM_FICHA} imagens={catalogoComum().imagens} />
    </>
  );
}
