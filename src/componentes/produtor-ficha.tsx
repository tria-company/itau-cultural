"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { CampoDeImagem } from "@/componentes/base/campo-de-imagem";
import { Campo, FichaEmAtos } from "@/componentes/base/ficha-em-atos";
import type { Ato } from "@/componentes/base/ficha-em-atos";
import { FichaDeAcessibilidade } from "@/componentes/base/ficha-de-acessibilidade";
import { ListaDeImpedimentos } from "@/componentes/base/lista-de-impedimentos";
import { SeletorDeCatalogo } from "@/componentes/base/seletor-de-catalogo";
import { SeletorDeVisibilidade } from "@/componentes/base/seletor-de-visibilidade";
import { Previa } from "@/componentes/base/previa";
import {
  consumirAberturaDaFicha,
  consumirAberturaDoDetalhe,
  consumirCriacaoDaPauta,
  useProdutor,
} from "@/componentes/produtor-estado";
import { PautaInicio } from "@/componentes/produtor-pauta-inicio";
import { RegistroDetalhe } from "@/componentes/produtor-registro-detalhe";
import { DESCRICAO_DA_PAUTA, podePublicar, impedimentosDe, scoreDoRegistro } from "@/dados/tipos-produtor";
import type {
  ContextoDoProdutor,
  ImagemDeclarada,
  Pauta,
  PorPauta,
  Registro,
} from "@/dados/tipos-produtor";

/**
 * produtor-ficha.tsx, o CASCO que as dez fichas não-agenda compartilham.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUE ELE EXISTE, E O QUE ELE NÃO FAZ.
 *
 * As onze pautas têm três atos IGUAIS, identidade, acessibilidade e publicação, e de um a
 * seis atos próprios. Escrever os três iguais onze vezes produziria onze cópias do mesmo
 * formulário, e a décima primeira divergiria da primeira no primeiro ajuste: um campo de
 * crédito obrigatório numa e opcional noutra, sem que ninguém decidisse isso.
 *
 * ELE NÃO É UM GERADOR DE FORMULÁRIO. Cada ficha escreve os PRÓPRIOS atos, em código, com o
 * vocabulário da própria pauta, é ali que mora o que aquela pauta significa. O que este
 * casco entrega é o começo, o fim e o encanamento: leitura do armazém, escolha do registro,
 * criação, salvamento automático, impedimentos, visibilidade e prévia.
 *
 * A AGENDA NÃO O USA. Ela tem oito atos, chave de identidade viva, aviso de duplicata e um
 * gerador de sessões, e forçá-la aqui dentro faria o casco crescer para caber num caso e
 * ficar grande demais para os outros dez. `produtor-agenda.tsx` é o molde; este é o resumo
 * dele.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface CatalogoBasico {
  linguagens: { id: string; rotulo: string; cor: string | null }[];
  temas: { id: string; rotulo: string; cor: string | null }[];
  imagens: { caminho: string; credito: string; alt: string; de: string }[];
}

export interface PropsFichaSimples<P extends Pauta> {
  pauta: P;
  semente: Registro[];
  contexto: ContextoDoProdutor;
  catalogo: CatalogoBasico;
  /** O que abre o ato 1, acima dos campos comuns. */
  cabecalhoDaIdentidade?: (r: PorPauta<P>) => ReactNode;
  /** Os atos próprios da pauta, entre identidade e acessibilidade. */
  atosProprios: (
    r: PorPauta<P>,
    alterar: (m: Partial<PorPauta<P>>) => void,
  ) => Ato[];
  /** `true` quando esta pauta tem lugar físico, decide os 5 recursos. */
  temLugarFisico?: (r: PorPauta<P>) => boolean;
  /** A tela pública para onde publicar leva. Vazio: fica onde está. */
  destinoAoPublicar?: string;
}

export function FichaSimples<P extends Pauta>({
  pauta,
  semente,
  contexto,
  catalogo,
  cabecalhoDaIdentidade,
  atosProprios,
  temLugarFisico,
  destinoAoPublicar,
}: PropsFichaSimples<P>) {
  const router = useRouter();
  const armazem = useProdutor(semente, contexto);
  const [atoPedido, setAtoPedido] = useState(0);
  // A ROTA ABRE NO INÍCIO DA PAUTA, não na ficha: editar é um gesto pedido, nunca o
  // estado default. Quem já pediu antes de navegar («Criar», «Editar») marcou a
  // intenção, e o efeito a consome depois da hidratação.
  const [modo, setModo] = useState<"inicio" | "detalhe" | "ficha">("inicio");
  useEffect(() => {
    // AS DUAS SÃO CONSUMIDAS, sempre. Consumir só a vencedora deixava a outra bandeira
    // ligada num módulo global, e ela disparava sozinha na próxima ficha montada.
    const querDetalhe = consumirAberturaDoDetalhe();
    const querFicha = consumirAberturaDaFicha();
    if (querDetalhe) setModo("detalhe");
    else if (querFicha) setModo("ficha");
  }, []);

  // A CRIAÇÃO espera o armazém: criar antes de hidratar perderia o registro quando a
  // hidratação sobrescrevesse o estado. A folha de criação só marcou a pauta.
  useEffect(() => {
    if (!armazem.pronto) return;
    const criar = consumirCriacaoDaPauta();
    if (criar === pauta) {
      armazem.criar(pauta);
      setAtoPedido(0);
      setModo("ficha");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dispara na hidratação
  }, [armazem.pronto]);
  const d = DESCRICAO_DA_PAUTA[pauta];

  if (!armazem.pronto) {
    return (
      <div className="prod-corpo">
        <p className="prod-nota">Lendo o que está gravado neste navegador…</p>
      </div>
    );
  }

  const daPauta = armazem.registros.filter(
    (r): r is PorPauta<P> => r.pauta === pauta,
  );

  if (modo === "inicio") {
    return (
      <PautaInicio
        pauta={pauta}
        registros={daPauta}
        dataDeReferencia={contexto.dataDeReferencia}
        imagens={catalogo.imagens}
        aoAdicionar={() => {
          armazem.criar(pauta);
          setAtoPedido(0);
          setModo("ficha");
        }}
        aoAbrir={(id) => {
          armazem.escolher(id);
          // Publicado abre no DETALHE (capa, números, comentários); rascunho vai direto
          // às etapas, porque um rascunho ainda não tem o que mostrar.
          const alvo = daPauta.find((r) => r.id === id);
          if (alvo?.situacao === "publicado") {
            setModo("detalhe");
          } else {
            setAtoPedido(0);
            setModo("ficha");
          }
        }}
      />
    );
  }

  const atual =
    armazem.atual?.pauta === pauta ? (armazem.atual as PorPauta<P>) : (daPauta[0] ?? null);

  if (!atual) {
    return (
      <div className="prod-corpo">
        <div className="prod-vazio">
          <p className="prod-vazio-frase">{d.objetivo}</p>
          <BotaoDoStudio
            primaria
            curto
            aoClicar={() => armazem.criar(pauta)}
            data-acao="criar-registro"
          >
            {d.singular}
          </BotaoDoStudio>
        </div>
      </div>
    );
  }

  if (modo === "detalhe" && atual.situacao === "publicado") {
    return (
      <RegistroDetalhe
        registro={atual}
        dataDeReferencia={contexto.dataDeReferencia}
        imagens={catalogo.imagens}
        aoVoltar={() => setModo("inicio")}
        aoEditar={() => {
          setAtoPedido(0);
          setModo("ficha");
        }}
      />
    );
  }

  const alterar = (m: Partial<PorPauta<P>>) =>
    armazem.alterarId(atual.id, m as Partial<Registro>);

  const score = scoreDoRegistro(atual, contexto);
  const bloqueiam = impedimentosDe(atual).filter((i) => i.bloqueia);

  const atos: Ato[] = [
    {
      rotulo: "Identidade",
      fechado: atual.titulo.trim().length >= 3 && atual.resumo.trim().length >= 20,
      conteudo: (
        <>
          <SeletorDeRegistro
            pauta={pauta}
            atual={atual}
            todos={daPauta}
            aoEscolher={armazem.escolher}
            aoCriar={() => armazem.criar(pauta)}
          />
          {cabecalhoDaIdentidade?.(atual)}
          <Campo rotulo="Título" obrigatorio>
            <input
              type="text"
              value={atual.titulo}
              onChange={(e) => alterar({ titulo: e.target.value } as Partial<PorPauta<P>>)}
              className="prod-campo-entrada"
              data-titulo
              aria-invalid={atual.titulo.trim().length < 3}
            />
          </Campo>
          <Campo rotulo="Resumo" nota="É o que o cartão mostra na vitrine.">
            <textarea
              value={atual.resumo}
              onChange={(e) => alterar({ resumo: e.target.value } as Partial<PorPauta<P>>)}
              rows={4}
              className="prod-campo-entrada"
              data-resumo
            />
          </Campo>
          <CampoDeImagem
            imagem={atual.imagem}
            aoMudar={(i: ImagemDeclarada | null) =>
              alterar({ imagem: i } as Partial<PorPauta<P>>)
            }
            acervo={catalogo.imagens}
          />
          <Campo rotulo="Linguagens">
            <SeletorDeCatalogo
              nome="Linguagens"
              termos={catalogo.linguagens}
              escolhidos={atual.linguagens}
              aoMudar={(ids) => alterar({ linguagens: ids } as Partial<PorPauta<P>>)}
              propostos={atual.termosPropostos}
              aoPropor={(t) => alterar({ termosPropostos: t } as Partial<PorPauta<P>>)}
            />
          </Campo>
          <Campo rotulo="Temas">
            <SeletorDeCatalogo
              nome="Temas"
              termos={catalogo.temas}
              escolhidos={atual.temas}
              aoMudar={(ids) => alterar({ temas: ids } as Partial<PorPauta<P>>)}
              propostos={[]}
              aoPropor={(t) =>
                alterar({
                  termosPropostos: [...atual.termosPropostos, ...t],
                } as Partial<PorPauta<P>>)
              }
            />
          </Campo>
        </>
      ),
    },
    ...atosProprios(atual, alterar),
    {
      rotulo: "Acessibilidade",
      fechado: atual.declaraAcessibilidade,
      conteudo: (
        <FichaDeAcessibilidade
          dimensoes={atual.acessibilidade}
          fisicos={atual.fisicos}
          declarada={atual.declaraAcessibilidade}
          temLugarFisico={temLugarFisico?.(atual) ?? false}
          aoMudarDimensoes={(a) => alterar({ acessibilidade: a } as Partial<PorPauta<P>>)}
          aoMudarFisicos={(f) => alterar({ fisicos: f } as Partial<PorPauta<P>>)}
          aoDeclarar={() =>
            alterar({ declaraAcessibilidade: true } as Partial<PorPauta<P>>)
          }
          aoDesfazer={() =>
            alterar({ declaraAcessibilidade: false } as Partial<PorPauta<P>>)
          }
        />
      ),
    },
    {
      rotulo: "Publicação",
      fechado: atual.situacao === "publicado",
      conteudo: (
        <>
          <ListaDeImpedimentos
            impedimentos={score.impedimentos}
            total={score.total}
            aoIrParaAto={setAtoPedido}
          />
          <p className="prod-campo-nota">
            O que falta acima é <strong>o que o público não vai ver</strong>, não o que uma
            fila vai devolver. Publicar aqui é publicar: a fiscalização é posterior.
          </p>
          <SeletorDeVisibilidade
            visibilidade={atual.visibilidade}
            agendadoPara={atual.agendadoPara}
            aoMudar={(v, quando) =>
              alterar({ visibilidade: v, agendadoPara: quando } as Partial<PorPauta<P>>)
            }
            hoje={contexto.dataDeReferencia}
          />
          <Previa registro={atual} />
        </>
      ),
    },
  ];

  return (
    <FichaEmAtos
      titulo={atual.titulo.trim() === "" ? d.singular : atual.titulo}
      objetivo={d.objetivo}
      atos={atos}
      atoInicial={atoPedido}
      noAr={atual.situacao === "publicado"}
      aoVoltar={() => setModo(atual.situacao === "publicado" ? "detalhe" : "inicio")}
      rotuloDaVolta={d.rotulo}
      acaoFinal={
        <BotaoDoStudio
          primaria
          desabilitado={!podePublicar(atual)}
          porQueDesabilitado={`${bloqueiam.length} impedimento(s): ${bloqueiam.map((i) => i.texto).join(" · ")}`}
          aoClicar={() => {
            const foi = armazem.publicar(atual.id);
            if (foi && destinoAoPublicar) router.push(destinoAoPublicar);
          }}
          data-acao="publicar"
        >
          {score.podePublicar ? "Publicar" : `Falta ${score.bloqueiam}`}
        </BotaoDoStudio>
      }
    />
  );
}

// ---------------------------------------------------------------------------

/** Qual registro a ficha edita. Cabeçalho de contexto, não filtro. */
function SeletorDeRegistro<P extends Pauta>({
  pauta,
  atual,
  todos,
  aoEscolher,
  aoCriar,
}: {
  pauta: P;
  atual: PorPauta<P>;
  todos: PorPauta<P>[];
  aoEscolher: (id: string) => void;
  aoCriar: () => void;
}) {
  return (
    <div className="prod-seletor-registro">
      <label className="prod-seletor-registro-rotulo" htmlFor={`prod-seletor-${pauta}`}>
        Editando
      </label>
      <select
        id={`prod-seletor-${pauta}`}
        value={atual.id}
        onChange={(e) => aoEscolher(e.target.value)}
        className="prod-campo-entrada"
        data-seletor-registro
      >
        {todos.map((r) => (
          <option key={r.id} value={r.id}>
            {r.titulo.trim() === "" ? "(sem título)" : r.titulo}
          </option>
        ))}
      </select>
      <BotaoDoStudio curto aoClicar={aoCriar} data-acao="novo-registro">
        Novo
      </BotaoDoStudio>
    </div>
  );
}
