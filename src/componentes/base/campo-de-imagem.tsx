"use client";

import { useRef, useState } from "react";
import { Campo } from "@/componentes/base/ficha-em-atos";
import { Folha } from "@/componentes/base/folha";
import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { imagemVazia } from "@/dados/tipos-produtor";
import type { ImagemDeclarada } from "@/dados/tipos-produtor";

/**
 * base/campo-de-imagem.tsx, a foto em evidência, com crédito e alt bloqueantes.
 *
 * A FOTO É O CAMPO, e o resto vem abaixo. O desenho anterior punha uma miniatura de 96px
 * ao lado de dois botões e um campo de caminho: quem escolhe uma capa está decidindo o que
 * o público vai ver primeiro, e decidia isso olhando um selo. Agora a imagem ocupa a
 * largura inteira, e os campos que ela exige ficam embaixo.
 *
 * SUBIR DO APARELHO FUNCIONA, E NÃO HÁ SERVIDOR NENHUM. O arquivo é lido no próprio
 * navegador (`FileReader`), reduzido num `canvas` e guardado como `data:` URL junto do
 * registro. Ele não sai deste aparelho, e é isso que a nota diz em uma linha. A redução
 * não é enfeite: sem ela uma foto de 4 MB estoura a cota do `localStorage` e derruba o
 * armazém inteiro, levando junto o que já estava escrito.
 *
 * IMAGEM SEM CRÉDITO NÃO SALVA (165), e sem alt também não. Publicar foto sem crédito é
 * publicar o trabalho de alguém sem o nome de quem o fez; sem alt, para quem usa leitor de
 * tela a imagem simplesmente não existe.
 */

export interface ImagemDoAcervo {
  caminho: string;
  /** O `creditoImagem` da entidade de origem. Nunca vazio. */
  credito: string;
  /** O `imagemAlt` da entidade de origem, quando o CMS o publica. */
  alt: string;
  /** O título da entidade de onde a imagem veio, a trilha de conferência. */
  de: string;
}

/** A maior aresta que uma foto enviada guarda. Acima disto, a cota do navegador reclama. */
const MAIOR_ARESTA = 1280;

/**
 * Reduz a foto no `canvas` e devolve uma `data:` URL. Se a redução falhar, ou sair maior
 * que o original (acontece com imagem já pequena), devolve o original: reduzir é uma
 * otimização, e uma otimização que piora não vale a perda de qualidade.
 */
function reduzir(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const escala = Math.min(1, MAIOR_ARESTA / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * escala));
        canvas.height = Math.max(1, Math.round(img.height * escala));
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(dataUrl);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const reduzida = canvas.toDataURL("image/jpeg", 0.78);
        resolve(reduzida.length < dataUrl.length ? reduzida : dataUrl);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function CampoDeImagem({
  imagem,
  aoMudar,
  acervo,
  rotulo = "Capa",
  obrigatoria = false,
}: {
  imagem: ImagemDeclarada | null;
  aoMudar: (i: ImagemDeclarada | null) => void;
  acervo: readonly ImagemDoAcervo[];
  rotulo?: string;
  obrigatoria?: boolean;
}) {
  const [aberta, setAberta] = useState(false);
  const [lendo, setLendo] = useState(false);
  const entradaDeArquivo = useRef<HTMLInputElement | null>(null);
  const atual = imagem ?? imagemVazia();
  const temCaminho = atual.caminho.trim() !== "";
  const veioDoAparelho = atual.caminho.startsWith("data:");

  function mudar(parte: Partial<ImagemDeclarada>) {
    aoMudar({ ...atual, ...parte });
  }

  function enviar(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    // Limpar o valor deixa a pessoa reenviar o MESMO arquivo depois de remover; sem isto
    // o segundo `change` nunca dispara, e o botão parece quebrado.
    evento.target.value = "";
    if (!arquivo) return;
    setLendo(true);
    const leitor = new FileReader();
    leitor.onload = () => {
      void reduzir(String(leitor.result ?? "")).then((pronta) => {
        mudar({ caminho: pronta });
        setLendo(false);
      });
    };
    leitor.onerror = () => setLendo(false);
    leitor.readAsDataURL(arquivo);
  }

  return (
    <div className="prod-imagem">
      <Campo
        rotulo={rotulo}
        obrigatorio={obrigatoria}
        nota="A foto enviada fica só neste aparelho: não há servidor para recebê-la."
      >
        {/* O PALCO: a foto em tamanho de decisão, ou o vazio dizendo o que fazer. */}
        <div className="prod-imagem-palco" data-palco-imagem>
          {temCaminho ? (
            // eslint-disable-next-line @next/next/no-img-element -- imagem local ou data:;
            // `next/image` sob `output: export` exigiria loader e não acrescenta nada aqui.
            <img
              src={atual.caminho}
              alt={atual.alt || ""}
              className="prod-imagem-grande"
              data-previa-imagem
            />
          ) : (
            <span className="prod-imagem-vazia">
              {lendo ? "lendo a foto…" : "nenhuma foto ainda"}
            </span>
          )}
          {veioDoAparelho ? (
            <span className="prod-imagem-selo" data-imagem-do-aparelho>
              deste aparelho
            </span>
          ) : null}
        </div>

        <div className="prod-imagem-acoes">
          <input
            ref={entradaDeArquivo}
            type="file"
            accept="image/*"
            onChange={enviar}
            className="sr-only"
            data-enviar-imagem
            aria-label="enviar uma foto do aparelho"
          />
          <BotaoDoStudio
            primaria={!temCaminho}
            curto
            aoClicar={() => entradaDeArquivo.current?.click()}
            data-abrir-envio-imagem
          >
            {lendo ? "Lendo…" : "Enviar foto"}
          </BotaoDoStudio>
          <BotaoDoStudio curto aoClicar={() => setAberta(true)} data-abrir-acervo-imagem>
            Acervo
          </BotaoDoStudio>
          {temCaminho ? (
            <BotaoDoStudio curto aoClicar={() => aoMudar(null)} data-remover-imagem>
              Remover
            </BotaoDoStudio>
          ) : null}
        </div>
      </Campo>

      {/* OS DOIS CAMPOS BLOQUEANTES aparecem assim que há imagem, e não antes: pedir crédito
          de uma imagem que não existe é pedir por pedir. */}
      {temCaminho ? (
        <>
          <Campo
            rotulo="Crédito da imagem"
            obrigatorio
            nota="Sem crédito o registro não publica."
          >
            <input
              type="text"
              value={atual.credito}
              onChange={(e) => mudar({ credito: e.target.value })}
              placeholder="Foto: nome de quem fez / instituição"
              className="prod-campo-entrada"
              data-credito-imagem
              aria-invalid={atual.credito.trim() === ""}
            />
          </Campo>

          <Campo
            rotulo="Texto alternativo"
            obrigatorio
            nota="O que a imagem mostra, para quem não a vê."
          >
            <textarea
              value={atual.alt}
              onChange={(e) => mudar({ alt: e.target.value })}
              rows={2}
              placeholder="descreva o que aparece na imagem"
              className="prod-campo-entrada"
              data-alt-imagem
              aria-invalid={atual.alt.trim() === ""}
            />
          </Campo>

          <Campo rotulo="Licença" nota="Quando houver.">
            <input
              type="text"
              value={atual.licenca ?? ""}
              onChange={(e) => mudar({ licenca: e.target.value || null })}
              placeholder="CC BY-SA 4.0, uso autorizado, domínio público…"
              className="prod-campo-entrada"
              data-licenca-imagem
            />
          </Campo>
        </>
      ) : null}

      <Folha
        aberta={aberta}
        titulo="Imagens do acervo"
        descricao={`${acervo.length} imagens, com o alt e o crédito que o CMS publica.`}
        aoFechar={() => setAberta(false)}
      >
        <ul className="prod-galeria">
          {acervo.map((i) => (
            <li key={i.caminho}>
              <button
                type="button"
                className="prod-galeria-item"
                data-imagem-do-acervo={i.caminho}
                onClick={() => {
                  // O CRÉDITO E O ALT VÊM JUNTO, e é o que faz a escolha nascer publicável.
                  // Copiar só o caminho obrigaria a pessoa a redigitar o que o acervo já
                  // publica, e a redigitação é onde o crédito vira «Divulgação».
                  aoMudar({
                    caminho: i.caminho,
                    credito: i.credito,
                    alt: i.alt || atual.alt,
                    licenca: atual.licenca,
                  });
                  setAberta(false);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- idem acima */}
                <img src={i.caminho} alt="" className="prod-galeria-foto" loading="lazy" />
                <span className="prod-galeria-de">{i.de}</span>
                <span className="prod-galeria-credito">{i.credito}</span>
              </button>
            </li>
          ))}
        </ul>
      </Folha>
    </div>
  );
}
