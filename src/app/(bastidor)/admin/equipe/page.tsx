import Link from "next/link";
import { AdminEquipe } from "@/componentes/admin-equipe";
import { DATA_DE_REFERENCIA } from "@/dados/alerta";

/**
 * `/admin/equipe`, quem é o quê na plataforma.
 *
 * PÁGINA DE SERVIDOR SEM DADO PESADO: o quadro é constante de módulo, autorado, e a tela é
 * de cliente porque troca papel e acesso ali mesmo.
 */
export const metadata = {
  title: "Equipe",
  description: "Quem modera, quem produz, e o que cada papel alcança.",
};

export default function PaginaDaEquipe() {
  return (
    <div className="flex flex-col gap-5 p-5 desk:p-8">
      <header className="flex flex-col gap-2">
        <Link href="/admin/" className="adm-volta">
          Administração
        </Link>
        <h1 className="text-2xl leading-tight font-bold desk:text-3xl">Equipe</h1>
      </header>
      <AdminEquipe carimbo={DATA_DE_REFERENCIA} />
    </div>
  );
}
