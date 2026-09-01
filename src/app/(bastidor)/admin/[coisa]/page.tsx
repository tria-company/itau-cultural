import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminLista } from "@/componentes/admin-lista";
import { DATA_DE_REFERENCIA } from "@/dados/alerta";
import { COISAS, TETO_DA_LISTA, descreverCoisa, linhasDe, type Coisa } from "@/dados/admin-area";
import { COMUNIDADES } from "@/dados/comunidade";

export function generateStaticParams() {
  return COISAS.map((coisa) => ({ coisa }));
}

/**
 * `/admin/[coisa]`, a lista de um tipo, com filtros e a tira em cada linha.
 *
 * O DTO É PRIMITIVO e o corte é declarado: `TETO_DA_LISTA` limita quantas linhas
 * atravessam, e a tela diz quantas ficaram de fora em vez de fingir que são todas.
 */
export default async function PaginaDaLista({ params }: { params: Promise<{ coisa: string }> }) {
  const { coisa } = await params;
  if (!(COISAS as readonly string[]).includes(coisa)) notFound();

  const descricao = descreverCoisa(coisa as Coisa);
  const { linhas, total } = linhasDe(coisa as Coisa);
  const destinos = COMUNIDADES.map((c) => ({ id: c.id, nome: c.nome }));

  return (
    <div className="flex flex-col gap-5 p-5 desk:p-8">
      <header className="flex flex-col gap-2">
        <Link href="/admin/" className="adm-volta">
          Administração
        </Link>
        <h1 className="text-2xl leading-tight font-bold desk:text-3xl">{descricao.rotulo}</h1>
      </header>
      <AdminLista
        descricao={descricao}
        linhas={linhas}
        total={total}
        teto={TETO_DA_LISTA}
        destinos={destinos}
        carimbo={DATA_DE_REFERENCIA}
      />
    </div>
  );
}
