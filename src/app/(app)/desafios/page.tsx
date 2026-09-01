import { Desafios } from "@/componentes/desafios";

/**
 * O TÍTULO MORA NO COMPONENTE, e não aqui. Ele divide a linha com o seletor de filtro, e
 * o filtro é estado de cliente — deixar o `<h1>` na página de servidor obrigaria a
 * duplicar a linha em dois lugares ou a levantar o estado para cá, que é pior: a página
 * passaria a existir para segurar um `useState`.
 */
export default function PaginaDesafios() {
  return (
    <div className="flex flex-col gap-5 p-5 desk:p-8">
      <Desafios />
    </div>
  );
}
