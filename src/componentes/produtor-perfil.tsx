"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { Campo } from "@/componentes/base/ficha-em-atos";
import { Folha } from "@/componentes/base/folha";
import { iniciaisDe, usePerfil } from "@/componentes/perfil-estado";
import { useProdutor } from "@/componentes/produtor-estado";
import { TrocaDeAcesso } from "@/componentes/troca-de-acesso";
import { usePapel } from "@/contexto/papel";
import { CHAVE_DO_PRODUTOR, semTravessao } from "@/dados/tipos-produtor";
import type { ContextoDoProdutor, Registro } from "@/dados/tipos-produtor";

/**
 * produtor-perfil.tsx, a tela do perfil: quem é a pessoa, e o estado da conta.
 *
 * DUAS METADES, e a separação é deliberada:
 *
 *   · DADOS PESSOAIS vivem em `produtor.perfil.v1`: nome, função, contato, bio e a foto.
 *     Tudo editável, salvo a cada tecla, e o reinício da demonstração NÃO os apaga,
 *     porque reiniciar é sobre o conteúdo, nunca sobre quem está na cadeira.
 *
 *   · A CONTA é leitura: o papel escolhido, a organização carimbada, os números do
 *     armazém e a data de referência. O que dá para agir aparece como ação, com o
 *     alcance dito antes.
 *
 * A FOTO VEM DO ACERVO. Não há upload num artefato estático, e a tela diz isso: a escolha
 * é entre imagens reais, e o crédito acompanha a foto para onde ela for.
 *
 * MÓDULO DE CLIENTE (DP-F): semente, contexto e imagens entram por PROP.
 */

export interface ImagemParaFoto {
  caminho: string;
  credito: string;
  alt: string;
  de: string;
}

export function PerfilDoProdutorTela({
  semente,
  contexto,
  imagens,
}: {
  semente: Registro[];
  contexto: ContextoDoProdutor;
  imagens: ImagemParaFoto[];
}) {
  const router = useRouter();
  const armazem = useProdutor(semente, contexto);
  const { pronto, perfil, alterar, limpar } = usePerfil();
  const { papel, definirPapel } = usePapel();
  const [escolhendoFoto, setEscolhendoFoto] = useState(false);

  const noAr = armazem.registros.filter((r) => r.situacao === "publicado").length;
  const emEdicao = armazem.registros.filter(
    (r) => r.situacao === "rascunho" || r.situacao === "devolvido",
  ).length;
  const pendencias = armazem.registros.reduce((n, r) => n + r.pendencias.length, 0);

  const nomeExibido = perfil.nome.trim() || "Você";

  function sair() {
    definirPapel("publico");
    router.push("/entrar/");
  }


  return (
    <>
      <header className="prod-cabecalho">
        <div className="prod-cabecalho-linha">
          <Link href="/studio/" className="prod-superficie prod-voltar" data-voltar-studio>
            ‹ Studio
          </Link>
        </div>
        <h1 className="prod-titulo">Seu perfil</h1>
        <p className="prod-objetivo">
          Quem você é para quem lê o que você publica, e o estado da sua conta.
        </p>
      </header>

      <div className="prod-corpo" data-perfil-produtor>
        {/* ---- o cartão de apresentação ---- */}
        <section className="prod-perfil-cabeca">
          <button
            type="button"
            className="prod-avatar"
            onClick={() => setEscolhendoFoto(true)}
            aria-label="trocar a foto do perfil"
            data-trocar-foto
          >
            {pronto && perfil.foto ? (
              // eslint-disable-next-line @next/next/no-img-element -- foto local do acervo
              <img src={perfil.foto} alt="" />
            ) : (
              <span className="prod-avatar-iniciais" aria-hidden>
                {iniciaisDe(perfil.nome, contexto.organizacao)}
              </span>
            )}
          </button>
          <div className="prod-perfil-cabeca-texto">
            <strong className="prod-perfil-nome">{nomeExibido}</strong>
            <span className="prod-perfil-funcao">
              {perfil.funcao.trim() || "Produção de conteúdo"}
            </span>
            <span className="prod-perfil-organizacao">{contexto.organizacao}</span>
          </div>
        </section>
        {pronto && perfil.foto && perfil.fotoCredito ? (
          <p className="prod-campo-nota" data-credito-da-foto>
            Foto: {perfil.fotoCredito}
          </p>
        ) : null}

        {/* ---- dados pessoais ---- */}
        <section className="prod-secao" aria-labelledby="prod-perfil-dados">
          <h2 className="prod-secao-titulo" id="prod-perfil-dados">
            Dados pessoais
          </h2>

          <Campo rotulo="Nome">
            <input
              type="text"
              value={perfil.nome}
              onChange={(e) => alterar({ nome: e.target.value })}
              placeholder="Seu nome, como você assina"
              className="prod-campo-entrada"
              data-perfil-nome
            />
          </Campo>

          <Campo rotulo="Função">
            <input
              type="text"
              value={perfil.funcao}
              onChange={(e) => alterar({ funcao: e.target.value })}
              placeholder="produção de programação, curadoria, comunicação"
              className="prod-campo-entrada"
              data-perfil-funcao
            />
          </Campo>

          <div className="prod-par">
            <Campo rotulo="E-mail">
              <input
                type="email"
                value={perfil.email}
                onChange={(e) => alterar({ email: e.target.value })}
                placeholder="voce@instituicao.org.br"
                className="prod-campo-entrada"
                data-perfil-email
              />
            </Campo>
            <Campo rotulo="Telefone">
              <input
                type="tel"
                value={perfil.telefone}
                onChange={(e) => alterar({ telefone: e.target.value })}
                placeholder="(11) 99999-0000"
                className="prod-campo-entrada"
                data-perfil-telefone
              />
            </Campo>
          </div>

          <Campo
            rotulo="Sobre você"
            nota="Uma linha de apresentação. Aparece junto do que você assina."
          >
            <textarea
              value={perfil.bio}
              onChange={(e) => alterar({ bio: e.target.value })}
              rows={3}
              className="prod-campo-entrada"
              data-perfil-bio
            />
          </Campo>

        </section>

        {/* ---- a conta ---- */}
        <section className="prod-secao" aria-labelledby="prod-perfil-conta">
          <h2 className="prod-secao-titulo" id="prod-perfil-conta">
            Conta
          </h2>

          <div className="prod-conta">
            <div className="prod-conta-linha">
              <span className="prod-conta-rotulo">Assina como</span>
              <span className="prod-conta-valor">{contexto.autor}</span>
            </div>
            <div className="prod-conta-linha">
              <span className="prod-conta-rotulo">Organização</span>
              <span className="prod-conta-valor">{contexto.organizacao}</span>
            </div>
            <div className="prod-conta-linha">
              <span className="prod-conta-rotulo">Registros no ar</span>
              <span className="prod-conta-valor">{noAr}</span>
            </div>
            <div className="prod-conta-linha">
              <span className="prod-conta-rotulo">Em edição</span>
              <span className="prod-conta-valor">{emEdicao}</span>
            </div>
            <div className="prod-conta-linha">
              <span className="prod-conta-rotulo">Pendências</span>
              <span className="prod-conta-valor">{pendencias}</span>
            </div>
            <div className="prod-conta-linha">
              <span className="prod-conta-rotulo">Data de referência</span>
              <span className="prod-conta-valor">{contexto.dataDeReferencia}</span>
            </div>
            <div className="prod-conta-linha">
              <span className="prod-conta-rotulo">Armazém</span>
              <span className="prod-conta-valor">
                <code>{CHAVE_DO_PRODUTOR}</code>
              </span>
            </div>
            {armazem.migradoDe.length > 0 ? (
              <div className="prod-conta-linha">
                <span className="prod-conta-rotulo">Migrado de</span>
                <span className="prod-conta-valor">{armazem.migradoDe.join(", ")}</span>
              </div>
            ) : null}
          </div>

        </section>

        <TrocaDeAcesso />

        {/* ---- sessão ---- */}
        <section className="prod-secao" aria-labelledby="prod-perfil-sessao">
          <h2 className="prod-secao-titulo" id="prod-perfil-sessao">
            Sessão
          </h2>
          <div className="prod-registro-acoes">
            <BotaoDoStudio curto aoClicar={sair} data-acao="sair">
              Sair da demonstração
            </BotaoDoStudio>
            <LimparPerfil aoLimpar={limpar} />
          </div>
          <p className="prod-campo-nota">
            Sair volta à tela de entrada com o perfil de público. Papel atual:{" "}
            <strong>{papel}</strong>.
          </p>
        </section>
      </div>

      {/* ---- a folha de escolha da foto ---- */}
      <Folha
        aberta={escolhendoFoto}
        titulo="Foto do perfil"
        descricao="Imagens reais do acervo, com o crédito de quem as fez. Não há upload num artefato estático."
        aoFechar={() => setEscolhendoFoto(false)}
        rodape={
          perfil.foto ? (
            <BotaoDoStudio
              curto
              aoClicar={() => {
                alterar({ foto: null, fotoCredito: null });
                setEscolhendoFoto(false);
              }}
              data-acao="remover-foto"
            >
              Usar as iniciais
            </BotaoDoStudio>
          ) : undefined
        }
      >
        <ul className="prod-galeria">
          {imagens.map((i) => (
            <li key={i.caminho}>
              <button
                type="button"
                className="prod-galeria-item"
                data-foto-do-acervo={i.caminho}
                onClick={() => {
                  alterar({ foto: i.caminho, fotoCredito: i.credito });
                  setEscolhendoFoto(false);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- foto local */}
                <img src={i.caminho} alt="" className="prod-galeria-foto" loading="lazy" />
                <span className="prod-galeria-de">{i.de}</span>
                <span className="prod-galeria-credito">{i.credito}</span>
              </button>
            </li>
          ))}
        </ul>
      </Folha>
    </>
  );
}

/** Limpar o perfil pede confirmação: apaga o que a pessoa digitou, e não tem desfazer. */
function LimparPerfil({ aoLimpar }: { aoLimpar: () => void }) {
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <BotaoDoStudio curto aoClicar={() => setConfirmando(true)} data-acao="limpar-perfil">
        Limpar dados pessoais
      </BotaoDoStudio>
    );
  }

  return (
    <div className="flex flex-col gap-2" data-confirmando-limpeza>
      <p className="prod-nota">
        Isto apaga nome, contato, bio e foto. Os registros publicados não são tocados.
      </p>
      <div className="flex gap-2">
        <BotaoDoStudio
          curto
          primaria
          aoClicar={() => {
            aoLimpar();
            setConfirmando(false);
          }}
          data-acao="confirmar-limpeza"
        >
          Apagar
        </BotaoDoStudio>
        <BotaoDoStudio curto aoClicar={() => setConfirmando(false)}>
          Cancelar
        </BotaoDoStudio>
      </div>
    </div>
  );
}
