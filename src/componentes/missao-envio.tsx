"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Moeda } from "@/componentes/pontos-base";
import { usePontos } from "@/contexto/pontos";
import { podeEnviar } from "@/lib/pontos/comprovacoes";
import { ETAPAS_DA_ANALISE, LIMIAR_DE_CONFIANCA, validar } from "@/lib/pontos/validacao";
import type { Comprovacao, MissaoDefinida } from "@/lib/pontos/tipos";

/**
 * missao-envio.tsx — a porta de enviar prova, a esteira de análise e a comemoração.
 *
 * A ESTEIRA NÃO É ENFEITE. Ela existe porque a decisão pode demorar e porque a
 * pessoa precisa saber O QUE está sendo conferido: quando a recusa chega depois
 * de cinco etapas nomeadas, ela é entendida como consequência de uma regra que
 * estava escrita na tela; quando chega de uma caixa preta, é entendida como
 * perseguição. As mesmas cinco etapas vivem em `validacao.ts` — uma fonte só.
 *
 * A FOTO NÃO SAI DO APARELHO E NÃO É GUARDADA INTEIRA. O que persiste é uma
 * miniatura de 320px e o hash do original: o estado mora em `localStorage`, com
 * cota da ordem de 5 MB, e três fotos de celular em dataURL levariam junto o
 * livro, os emblemas e a sequência. O hash é, de todo modo, o que a trava de
 * duplicidade compara.
 */

/** O lado maior da miniatura guardada. */
const LADO_DA_MINIATURA = 320;

/** Quanto cada etapa da esteira segura a tela. Cinco delas dão ~3s no total. */
const MS_POR_ETAPA = 620;

const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT",
  "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
];

/**
 * SHA-256 do arquivo original. `crypto.subtle` existe em todo navegador que este
 * projeto atende e não exige dependência nenhuma — o hash é identidade de
 * arquivo, não segredo, então não há nada a proteger além da colisão.
 */
async function hashDe(arquivo: File): Promise<string> {
  const bytes = await arquivo.arrayBuffer();
  const resumo = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(resumo)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Reduz a imagem para caber no armazenamento. Falhou, guarda vazio e segue. */
async function miniaturaDe(arquivo: File): Promise<string> {
  try {
    const bitmap = await createImageBitmap(arquivo);
    const escala = Math.min(1, LADO_DA_MINIATURA / Math.max(bitmap.width, bitmap.height));
    const tela = document.createElement("canvas");
    tela.width = Math.max(1, Math.round(bitmap.width * escala));
    tela.height = Math.max(1, Math.round(bitmap.height * escala));
    const pincel = tela.getContext("2d");
    if (!pincel) return "";
    pincel.drawImage(bitmap, 0, 0, tela.width, tela.height);
    bitmap.close();
    return tela.toDataURL("image/jpeg", 0.7);
  } catch {
    // Formato que o navegador não decodifica. A prova continua valendo pelo
    // hash; o que se perde é a miniatura no histórico, não o envio.
    return "";
  }
}

export function MissaoEnvio({ missao }: { missao: MissaoDefinida }) {
  const { motor, hidratado } = usePontos();
  const [etapa, setEtapa] = useState<number | null>(null);
  const [uf, setUf] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [decidida, setDecidida] = useState<Comprovacao | null>(null);
  const entrada = useRef<HTMLInputElement>(null);
  const vivo = useRef(true);

  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
    };
  }, []);

  const pedeUf = missao.ranking?.metrica === "territorios";
  const permissao = hidratado
    ? podeEnviar(motor.atual, missao, motor.atual.agora)
    : { pode: false, motivo: undefined };
  const analisando = etapa !== null;

  const enviar = useCallback(
    async (arquivo: File) => {
      setErro(null);
      setDecidida(null);

      let hash: string;
      try {
        hash = await hashDe(arquivo);
      } catch {
        setErro("Não consegui ler este arquivo. Tente outra imagem.");
        return;
      }

      const miniatura = await miniaturaDe(arquivo);
      const comprovacao = motor.registrarProva(
        missao.id,
        { nome: arquivo.name, miniatura, hash },
        pedeUf ? uf || undefined : undefined,
      );

      // A esteira roda ANTES da decisão porque a decisão é instantânea aqui. Num
      // servidor de verdade os dois andariam juntos e este laço viraria espera.
      for (let i = 0; i < ETAPAS_DA_ANALISE.length; i++) {
        if (!vivo.current) return;
        setEtapa(i);
        await new Promise((r) => setTimeout(r, MS_POR_ETAPA));
      }
      if (!vivo.current) return;

      const veredito = await validar({
        missaoId: missao.id,
        hash,
        nome: arquivo.name,
        bytes: arquivo.size,
        regras: missao.regrasDeAceite ?? { vale: [], naoVale: [] },
        // O próprio envio já está no estado: tirar ele da lista evita a prova
        // ser recusada por ser duplicata de si mesma.
        jaEnviados: motor.atual.comprovacoes
          .filter((c) => c.missaoId === missao.id && c.id !== comprovacao.id)
          .map((c) => c.arquivo.hash),
      });

      if (!vivo.current) return;
      const { comprovacao: decisao } = motor.decidirProva(comprovacao.id, veredito);
      setEtapa(null);
      setDecidida(decisao);
    },
    [missao, motor, pedeUf, uf],
  );

  if (missao.prova !== "midia") return null;

  return (
    <section className="flex flex-col gap-3">
      {analisando && (
        <div className="esteira-analise" role="status" aria-live="polite">
          <span className="tipo-detalhe font-bold">Analisando sua prova</span>
          <ol className="esteira-etapas">
            {ETAPAS_DA_ANALISE.map((nome, i) => (
              <li
                key={nome}
                className="esteira-passo"
                data-estado={i < etapa! ? "feita" : i === etapa ? "agora" : "espera"}
              >
                {nome}
              </li>
            ))}
          </ol>
          <p className="tipo-legenda text-tinta-3">
            Protótipo: a análise é encenada e nenhuma imagem sai do seu aparelho. O que é
            conferido de verdade aqui é a duplicidade do arquivo.
          </p>
        </div>
      )}

      {decidida && <ResultadoDoEnvio comprovacao={decidida} missao={missao} />}

      {pedeUf && !analisando && (
        <label className="flex flex-col gap-1">
          <span className="tipo-legenda text-tinta-2">De qual estado é este registro?</span>
          <select
            className="campo-selecao"
            value={uf}
            onChange={(e) => setUf(e.target.value)}
          >
            <option value="">Escolha o estado</option>
            {UFS.map((sigla) => (
              <option key={sigla} value={sigla}>
                {sigla}
              </option>
            ))}
          </select>
        </label>
      )}

      <input
        ref={entrada}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const arquivo = e.target.files?.[0];
          // Zera o valor para que escolher O MESMO arquivo de novo dispare o
          // evento — sem isto, reenviar depois de uma recusa não faz nada.
          e.target.value = "";
          if (arquivo) void enviar(arquivo);
        }}
      />

      <button
        type="button"
        className="botao-acao"
        disabled={!permissao.pode || analisando || (pedeUf && !uf)}
        onClick={() => entrada.current?.click()}
      >
        {analisando ? "Analisando…" : "Enviar comprovação"}
      </button>

      {/* A legenda do botão desabilitado é obrigatória: botão cinza sem motivo é
          a forma mais barata de fazer alguém achar que o aplicativo quebrou. */}
      {!permissao.pode && permissao.motivo && !analisando && (
        <p className="tipo-legenda text-tinta-3">{permissao.motivo}</p>
      )}
      {permissao.pode && pedeUf && !uf && (
        <p className="tipo-legenda text-tinta-3">Escolha o estado antes de enviar.</p>
      )}
      {erro && <p className="tipo-legenda text-acao-tinta">{erro}</p>}
    </section>
  );
}

/**
 * O desfecho, nos três sabores. A aprovação comemora; a moderação explica a
 * espera; a recusa diz o motivo E oferece o caminho de volta — recusa sem
 * próximo passo é beco, e beco é onde a pessoa larga a missão.
 */
function ResultadoDoEnvio({
  comprovacao,
  missao,
}: {
  comprovacao: Comprovacao;
  missao: MissaoDefinida;
}) {
  const ganho = missao.porEnvio ?? { percurso: missao.percurso, fichas: missao.fichas };

  if (comprovacao.fase === "aprovada") {
    return (
      <div className="desfecho" data-fase="aprovada" role="status">
        <span className="tipo-destaque font-bold">Aprovado!</span>
        <span className="saldo-linha font-bold">
          +{ganho.percurso} percurso
          {ganho.fichas > 0 && (
            <>
              {" · "}
              <Moeda />+{ganho.fichas}
            </>
          )}
        </span>
        <span className="tipo-legenda text-tinta-2">
          Confiança da análise: {comprovacao.confianca}% · {comprovacao.leitura}
        </span>
        <div className="flex flex-wrap gap-2">
          <Link href="/desafios/" className="botao-discreto no-underline">
            Outras missões
          </Link>
          <Link href="/meu/conquistas/" className="botao-discreto no-underline">
            Ver meus selos
          </Link>
        </div>
      </div>
    );
  }

  if (comprovacao.fase === "em-moderacao") {
    return (
      <div className="desfecho" data-fase="em-moderacao" role="status">
        <span className="tipo-destaque font-bold">Em moderação</span>
        <span className="tipo-legenda text-tinta-2">
          A análise ficou em {comprovacao.confianca}%, abaixo do limite de {LIMIAR_DE_CONFIANCA}%.
          Uma pessoa da equipe decide — e você recebe aviso quando isso acontecer. Nada foi
          creditado ainda.
        </span>
      </div>
    );
  }

  return (
    <div className="desfecho" data-fase="recusada" role="status">
      <span className="tipo-destaque font-bold">Não passou</span>
      <span className="tipo-legenda text-tinta-2">{comprovacao.motivo}</span>
      <span className="tipo-legenda text-tinta-3">
        Confira o que vale acima e envie outro registro. Nada foi descontado.
      </span>
    </div>
  );
}
