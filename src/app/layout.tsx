import type { Metadata, Viewport } from "next";
import { Casca } from "@/componentes/casca";
import { PapelProvider } from "@/contexto/papel";
import { PontosProvider } from "@/contexto/pontos";
import { SessaoProvider } from "@/contexto/sessao";
import { ViewProvider } from "@/contexto/visao";
import { HEROIS } from "@/dados/heroi";
import { itauDisplay, itauText } from "./tipografia";
import "./globals.css";

export const metadata: Metadata = {
  title: "Itaú Cultural",
  description:
    "Protótipo de agenda cultural brasileira sobre o acervo do Itaú Cultural: uma visão app e uma visão web, do mesmo conjunto de componentes.",
  appleWebApp: {
    capable: true,
    title: "Itaú Cultural",
    statusBarStyle: "black-translucent",
  },
};

/**
 * `colorScheme` declara ao navegador que o documento serve os dois temas.
 *
 * O TEMA SEGUE O SISTEMA OPERACIONAL por padrão, e o menu da conta oferece a
 * escolha manual (23/08) — aplicada por `antes-da-pintura.js` antes do primeiro
 * pixel. Isto aqui não é redundante com o `color-scheme: dark` de `tokens.css`:
 * aquele só chega quando a folha chega, e esta é uma meta tag que o navegador lê
 * no cabeçalho — é ela que pinta o CANVAS na cor certa antes do primeiro byte de
 * CSS, matando o lampejo branco que apareceria entre a resposta e a folha em
 * conexão lenta. Também é o que faz barra de rolagem, campo de formulário e menu
 * de contexto nativos nascerem escuros em vez de brancos dentro de uma página
 * preta.
 *
 * Pela API de metadados do Next, e não por `<head>` escrito à mão — a regra do
 * App Router, e aqui também a única forma que não colide com os portões.
 */
export const viewport: Viewport = {
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // `suppressHydrationWarning` porque `antes-da-pintura.js` acrescenta
    // `data-heroi` a este elemento antes de o React existir. O aviso seria
    // legítimo em qualquer outro atributo; neste é o mecanismo funcionando.
    //
    // `data-heroi-total` sai da lista curada e é lido pelo script para sortear.
    // O total viaja pelo HTML em vez de ser repetido no JavaScript porque assim
    // não existe uma segunda contagem para ficar defasada.
    <html
      lang="pt-BR"
      className={`${itauText.variable} ${itauDisplay.variable}`}
      data-heroi-total={HEROIS.length}
      suppressHydrationWarning
    >
      <body className="antialiased">
        {/* Primeiro filho do body e SEM `async`, para bloquear o parser e rodar
            antes da primeira pintura — ver o cabeçalho do próprio arquivo. */}
        <script src="/antes-da-pintura.js" />
        <ViewProvider>
          <SessaoProvider>
            {/* O papel entra DENTRO da sessão e FORA da casca: ele não depende de
                persona, e a casca já é o primeiro consumidor — o menu lateral que ela
                monta filtra o grupo de bastidor por papel. */}
            <PapelProvider>
              {/* O MOTOR DE PONTOS entra por dentro da sessao, porque le a persona, e por
                  fora da casca, porque a Comunidade e a Carteira vivem dentro dela. Do
                  outro ramo ele SUBSTITUIA o papel neste slot; aqui os dois convivem, e
                  quem filtra o menu de bastidor continua sendo o papel. */}
              <PontosProvider>
                <Casca>{children}</Casca>
              </PontosProvider>
            </PapelProvider>
          </SessaoProvider>
        </ViewProvider>
      </body>
    </html>
  );
}
