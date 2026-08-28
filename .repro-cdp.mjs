import path from "node:path";
import { servir } from "./scripts/servir-out.mjs";
import { abrirNavegador } from "./scripts/navegador.mjs";

const RAIZ = path.resolve(import.meta.dirname);
const servidor = await servir({ raiz: path.join(RAIZ, "out") });
const cdp = await abrirNavegador();
try {
  await cdp.navegar(`${servidor.url}/studio/midia/`);
  await cdp.avaliar(`localStorage.setItem("agenda-cultural:visao","web")`);
  await cdp.recarregar();
  await cdp.avaliar(
    `new Promise((r)=>{const t=()=>document.querySelector('[data-hidratado="sim"]')?r(1):setTimeout(t,50);t();})`,
  );
  const r = await cdp.avaliar(`(() => {
    const painel = document.querySelector('[data-panorama-da-pauta]');
    const stats = document.querySelector('[data-numeros-da-pauta]');
    const contagem = document.querySelector('.prod-contagem');
    const cartoes = [...(painel ? painel.querySelectorAll('.prod-cartao-dash') : [])].map(s => ({
      titulo: s.querySelector('.prod-cartao-dash-titulo')?.textContent,
      medidorCentro: s.querySelector('.prod-medidor-centro')?.textContent ?? null,
      medidorRotulo: s.querySelector('.prod-medidor-rotulo')?.textContent ?? null,
      tituloSvg: s.querySelector('.prod-medidor svg title')?.textContent ?? null,
      nota: s.querySelector('.prod-cartao-dash-nota')?.textContent ?? null,
    }));
    return JSON.stringify({
      contagem: contagem?.textContent ?? null,
      stats: stats?.textContent ?? null,
      cartoes,
      textoTemBarra529: (document.body.textContent||'').includes('/529'),
      textoTem529: (document.body.textContent||'').includes('529'),
    }, null, 2);
  })()`);
  console.log(typeof r === "string" ? r : JSON.stringify(r, null, 2));
} finally {
  await cdp.fechar?.();
  servidor.fechar?.();
}
