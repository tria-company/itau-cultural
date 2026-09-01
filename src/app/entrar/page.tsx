import { Entrar } from "@/componentes/entrar";

/**
 * Entrada da plataforma.
 *
 * Página de servidor sem leitura do grafo: a tela não depende do acervo, e por isso não
 * há DTO a achatar aqui. Tudo o que ela precisa vive no componente de cliente, que só
 * toca a sessão do navegador.
 *
 * O SELETOR DE PERSONA SAIU (26.08). Escolher entre três perfis é ferramenta de
 * demonstração, e ela estava na porta de entrada do produto — a primeira coisa que a
 * banca via era uma decisão que usuário nenhum toma. As personas continuam por baixo,
 * alimentando repertório, feed e o indicador de impacto do Observatório; o que saiu foi
 * a escolha exposta. Quem entra, entra como uma pessoa só.
 */
export default function EntrarPagina() {
  return <Entrar />;
}
