"use client";

import { useState } from "react";
import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { CampoDeImagem } from "@/componentes/base/campo-de-imagem";
import type { ImagemDoAcervo } from "@/componentes/base/campo-de-imagem";
import { Campo } from "@/componentes/base/ficha-em-atos";
import { Folha } from "@/componentes/base/folha";
import { ICONE_LAPIS } from "@/componentes/base/icones";
import { sementeDoPerfil, useComunidadeGerida } from "@/componentes/comunidade-estado";

/**
 * comunidade-capa.tsx — a foto grande com o nome da comunidade dentro, e o lápis.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * É a abertura da comunidade, no mesmo gesto do herói de Descobrir: a foto ocupa o topo,
 * um véu escuro sobe do pé para o texto ter contraste, e o nome vive dentro da imagem.
 *
 * EDITAR É UM LÁPIS, E ACONTECE AQUI (pedido de 2026-08-28). Antes havia um botão
 * «Gerenciar» que levava a outra tela para trocar o nome e a capa; agora o lápis abre a
 * caixa em cima da própria capa, com a foto, o nome, a chamada e a descrição. Quem edita
 * uma capa está olhando para ela: mandar essa pessoa para outro endereço é pedir que ela
 * guarde na cabeça o que estava vendo.
 *
 * O QUE ELA MOSTRA É O VIGENTE, não o semeado. Antes de o armazém hidratar vale a
 * semente — que é exatamente o que o HTML do build traz, e é por isso que a hidratação
 * não diverge.
 *
 * A foto entra como `<img>` e não como `background-image` porque aqui existe UMA imagem,
 * e ela é conteúdo: leva `alt` e leva crédito. O herói de Descobrir usa fundo pelo motivo
 * oposto, oito slides dos quais sete estão escondidos e não devem ser baixados.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function CapaDaComunidade({
  comunidadeId,
  nome,
  descricao,
  hoje,
  publicacoes,
  assinantes,
  imagens,
  /** A edição só existe para a comunidade da casa: as outras são de gente real. */
  gerenciavel = false,
}: {
  comunidadeId: string;
  nome: string;
  descricao: string;
  hoje: string;
  publicacoes: number;
  assinantes: number;
  imagens?: ImagemDoAcervo[];
  gerenciavel?: boolean;
}) {
  const semente = sementeDoPerfil(comunidadeId, nome, descricao);
  const { vigente, perfil, alterarPerfil, pronto } = useComunidadeGerida(
    comunidadeId,
    semente,
    hoje,
  );
  const [editando, setEditando] = useState(false);

  return (
    <>
    <section className="prod-comunidade-capa" data-capa-da-comunidade={comunidadeId}>
      {vigente.imagem !== "" ? (
        // eslint-disable-next-line @next/next/no-img-element -- imagem local ou data:;
        // `next/image` sob `output: export` exigiria loader e não acrescenta nada aqui.
        <img
          src={vigente.imagem}
          alt={vigente.imagemAlt}
          className="prod-comunidade-capa-foto"
          data-capa-foto
        />
      ) : null}
      <span className="prod-comunidade-capa-veu" aria-hidden />

      <div className="prod-comunidade-capa-texto">
        <p className="prod-hero-kicker">Comunidade</p>
        <h1 className="prod-comunidade-capa-titulo" data-nome-da-comunidade>
          {vigente.nome}
        </h1>
        {vigente.chamada !== "" ? (
          <p className="prod-comunidade-capa-linha">{vigente.chamada}</p>
        ) : null}

        <div className="prod-hero-stats">
          <span className="prod-stat">
            <strong>{assinantes.toLocaleString("pt-BR")}</strong>
            <span>assinantes</span>
          </span>
          <span className="prod-stat">
            <strong>{publicacoes}</strong>
            <span>publicações</span>
          </span>
        </div>
      </div>

      {/* O LÁPIS, no canto de cima: perto da coisa que ele edita e fora do caminho do
          texto. Ao lado dele, a porta de quem está na comunidade. */}
      {gerenciavel ? (
        <div className="prod-comunidade-capa-canto">
          <button
            type="button"
            className="prod-comunidade-capa-lapis"
            onClick={() => setEditando(true)}
            disabled={!pronto}
            aria-label="Editar a comunidade"
            title="Editar nome, chamada, descrição e capa"
            data-editar-comunidade
          >
            {ICONE_LAPIS}
          </button>
        </div>
      ) : null}

      {vigente.imagemCredito !== "" ? (
        <span className="prod-comunidade-capa-credito">{vigente.imagemCredito}</span>
      ) : null}

    </section>

      {/* A FOLHA É IRMÃ DA CAPA, e não filha: a capa é `relative` com `overflow: hidden`,
        e a folha, sendo `absolute`, ancorava NELA e saia cortada na altura da foto
        (visto em captura, 2026-08-28).

        A CAIXA DE EDIÇÃO, aqui mesmo. Sem botão de salvar: cada tecla escreve no
        armazém, a mesma disciplina da ficha em atos — formulário que só grava no fim é
        formulário que perde trabalho. Fechar é o único gesto que falta. */}
    <Folha
      aberta={editando}
      titulo="Editar a comunidade"
      descricao="Vale já, na capa e em cada publicação."
      aoFechar={() => setEditando(false)}
      rodape={
        <BotaoDoStudio primaria aoClicar={() => setEditando(false)} data-fechar-edicao>
          Pronto
        </BotaoDoStudio>
      }
    >
      {editando ? (
        <>
          <CampoDeImagem
            rotulo="Capa"
            imagem={perfil.capa}
            aoMudar={(i) => alterarPerfil({ capa: i })}
            acervo={imagens ?? []}
          />

          <Campo rotulo="Nome" obrigatorio nota="Assina cada publicação.">
            <input
              type="text"
              value={perfil.nome}
              placeholder={semente.nome}
              onChange={(e) => alterarPerfil({ nome: e.target.value })}
              className="prod-campo-entrada"
              data-nome-comunidade
            />
          </Campo>

          <Campo rotulo="Chamada" nota="Uma linha, sob o nome.">
            <input
              type="text"
              value={perfil.chamada}
              placeholder={semente.chamada}
              onChange={(e) => alterarPerfil({ chamada: e.target.value })}
              className="prod-campo-entrada"
              data-chamada-comunidade
            />
          </Campo>

          <Campo rotulo="Descrição">
            <textarea
              value={perfil.descricao}
              placeholder={semente.descricao}
              onChange={(e) => alterarPerfil({ descricao: e.target.value })}
              rows={3}
              className="prod-campo-entrada"
              data-descricao-comunidade
            />
          </Campo>

          {/* O ÚNICO INTERRUPTOR QUE SOBROU, e ele vale de verdade desde 29/08/2026.
              Ele vivia na tela de membros, que morreu; ficar sem lugar seria deixá-lo
              gravado e inalcançável, que é como ele passou a primeira semana. */}
          <label className="prod-dimensao">
            <input
              type="checkbox"
              checked={perfil.comentariosAbertos}
              onChange={(e) => alterarPerfil({ comentariosAbertos: e.target.checked })}
              data-comentarios-abertos
            />
            <span className="prod-dimensao-rotulo">Comentários abertos</span>
          </label>

          <p className="prod-campo-nota">
            Campo em branco volta para o que a semente diz.
          </p>
        </>
      ) : null}
    </Folha>
    </>
  );
}
