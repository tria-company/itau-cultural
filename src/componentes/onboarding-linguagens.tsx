"use client";

import { useState } from "react";
import Image from "next/image";
import { useSessao } from "@/contexto/sessao";
import { LASTRO_FORTE, type LinguagemDeSemente } from "@/dados/sementes-wire";

/**
 * onboarding-linguagens.tsx — o passo 2 do onboarding cultural (S8).
 *
 * A pergunta é «por onde você entra?». Ela vem DEPOIS da disposição de propósito: o passo
 * 1 captura intenção («o que te move hoje»), este captura território cultural, e os dois
 * fazem trabalho diferente no motor — disposição pondera e corta o feed, linguagem é
 * SEMENTE, o ponto de onde a caminhada parte.
 *
 * A CARTA É UM CARTAZ, e a foto é AMOSTRA do acervo daquela linguagem — o mesmo princípio
 * do hub de apps: a imagem mostra o que tem dentro, não ilustra o rótulo. É por isso que
 * ela sai de uma entidade que realmente pertence à linguagem, e por isso não há foto
 * emprestada: linguagem sem imagem no próprio acervo cairia no gradiente da cor.
 *
 * O nome vai POR CIMA da foto, com véu. Sem o véu, uma parede de 19 fotografias com
 * assunto e luz diferentes deixa metade dos nomes ilegíveis — e o nome é a única coisa
 * que precisa ser lida aqui.
 *
 * A CARTA NÃO MOSTRA CONTAGEM (pedido de 27.08). O número do acervo estava colado no
 * rótulo como evidência do tamanho de cada linguagem — mas ele não decidia nada para quem
 * escolhe: MEDIDO, até «culinária», que tem 2 registros, alcança 15 cartões, porque a
 * caminhada atravessa a linguagem para fora dela. Um número que não muda a escolha e não
 * avisa de risco é ruído em cima do nome, que é o que a pessoa lê.
 *
 * A contagem continua no dado (`LinguagemDeSemente.entidades`) e continua ordenando a
 * grade — o que saiu foi a exibição, não a medição.
 *
 * AS FRACAS NÃO SÃO ESCONDIDAS, SÃO ADIADAS. A grade abre com as de 50 registros ou mais
 * e as demais ficam atrás de «ver todas». Cortar a cauda seria decidir pela pessoa que ela
 * não pode se interessar por circo ou por feminismo.
 */
export function OnboardingLinguagens({ linguagens }: { linguagens: LinguagemDeSemente[] }) {
  const { sementes, alternarSemente, hidratado } = useSessao();
  const [verTodas, setVerTodas] = useState(false);

  const fortes = linguagens.filter((l) => l.entidades >= LASTRO_FORTE);
  const fracas = linguagens.filter((l) => l.entidades < LASTRO_FORTE);
  const mostradas = verTodas ? linguagens : fortes;

  return (
    <section className="flex flex-col gap-4">
      <div className="onb-cabeca">
        <h2 className="onb-pergunta">Por onde você entra?</h2>
      </div>

      <div className="onb-grade">
        {mostradas.map((linguagem) => {
          const ativa = hidratado && sementes.includes(linguagem.chave);
          return (
            <button
              key={linguagem.chave}
              type="button"
              aria-pressed={ativa}
              onClick={() => alternarSemente(linguagem.chave)}
              className="onb-lingua"
              style={{ ["--cor-linguagem" as string]: `var(${linguagem.cor})` }}
            >
              {linguagem.capa ? (
                <Image
                  className="onb-lingua-foto"
                  src={linguagem.capa.arquivo}
                  alt={linguagem.capa.alt}
                  width={320}
                  height={240}
                  unoptimized
                />
              ) : null}
              <span className="onb-rotulo">{linguagem.rotulo}</span>
            </button>
          );
        })}
      </div>

      {fracas.length ? (
        <button type="button" className="onb-texto-acao" onClick={() => setVerTodas((v) => !v)}>
          {verTodas ? "Mostrar só as principais" : "Ver todas as linguagens"}
        </button>
      ) : null}

    </section>
  );
}
