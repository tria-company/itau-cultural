import { AvisoDesktop } from "@/componentes/aviso-desktop";

/**
 * superficie-so-web.tsx, o envelope das superfícies de bastidor que continuam só na web.
 *
 * POR QUE ELE EXISTE AGORA. Até 2026-08, `(bastidor)/layout.tsx` escondia as **52 rotas**
 * de bastidor na visão app, de uma vez, com um `app:hidden` só. Isso valia enquanto o
 * bastidor inteiro era mesa de trabalho densa. O perfil Produtor inverteu a regra para UMA
 * superfície: o Studio passou a ser mobile-first, dentro da moldura, porque quem produz
 * cultura no Brasil produz do telefone.
 *
 * A INVERSÃO É NOMEADA E ESTREITA. Moderação, Redação, Observatório, Administração e o
 * roteiro guiado continuam web-only, e continuam declarando isso: ninguém resolve uma fila
 * de mil duplicatas em 390px, e a tela diz por quê em vez de espremer a tabela. O que mudou
 * é que a regra passou a ser aplicada POR SUPERFÍCIE, num layout de cada uma, em vez de por
 * atacado no layout do grupo.
 *
 * A DIVERGÊNCIA CONTINUA EM CSS PURO. `app:hidden` é utilitário do Tailwind sobre
 * `[data-view="mobile"]`: o conteúdo já sai escondido no artefato estático e não depende de
 * hidratação para desaparecer (D-02, D-05). Um ramo em JavaScript aqui faria a tela piscar
 * o conteúdo denso antes de escondê-lo, no telefone, que é justamente onde ele não cabe.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A DIV TEM DE FICAR NUA, e isto não é estilo, é mecânica do cascade.
 *
 * Medido no bundle exportado, em 2026-08:
 *
 *     .app\:hidden  →  @layer utilities
 *     .prod-tela     →  (SEM CAMADA)
 *
 * **CSS sem camada vence `@layer`, independentemente da especificidade.** Um utilitário
 * do Tailwind mora em `@layer utilities`; toda folha de `src/estilos/` é importada sem
 * camada nenhuma. Basta esta div ganhar uma classe semântica que declare `display`,
 * `.studio`, `.prod-tela`, qualquer uma, para o `display: none` do `app:hidden` perder,
 * e as cinco superfícies web-only voltarem a aparecer no telefone SEM QUE NADA ACUSE.
 *
 * A descoberta veio de `--provar-ausencias`: a injeção que punha `app:hidden` numa div
 * que já tinha `.prod-tela` não escondia nada, e o portão ficava verde com razão. O
 * defeito nunca acontecia.
 *
 * Quem protege isto hoje é `verificar-produtor.mjs`, que mede a VISIBILIDADE do envelope
 * nas cinco superfícies, não a presença da classe. Medir a classe deixaria passar
 * exatamente este caso.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function SuperficieSoWeb({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AvisoDesktop />
      <div className="app:hidden" data-superficie="so-web">
        {children}
      </div>
    </>
  );
}
