"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { BotaoDoStudio } from "@/componentes/base/barra-de-acao";
import { CampoComProposta } from "@/componentes/base/campo-com-proposta";
import { CampoDeImagem } from "@/componentes/base/campo-de-imagem";
import { Campo, FichaEmAtos } from "@/componentes/base/ficha-em-atos";
import { FichaDeAcessibilidade } from "@/componentes/base/ficha-de-acessibilidade";
import { OpcaoDeSegmento, Segmento } from "@/componentes/base/segmento";
import { SeletorDeCatalogo } from "@/componentes/base/seletor-de-catalogo";
import { SeletorDeVisibilidade } from "@/componentes/base/seletor-de-visibilidade";
import { Previa } from "@/componentes/base/previa";
import {
  assinarCriacaoDaPauta,
  consumirAberturaDaFicha,
  consumirAberturaDoDetalhe,
  consumirCriacaoDaPauta,
  pautaPendenteDeCriacao,
  pautaPendenteNoServidor,
  useProdutor,
} from "@/componentes/produtor-estado";
import { PautaInicio } from "@/componentes/produtor-pauta-inicio";
import { RegistroDetalhe } from "@/componentes/produtor-registro-detalhe";
import { GradeDeSessoes } from "@/componentes/produtor-grade";
import { normalizar } from "@/dados/indice";
import {
  CANAIS_DE_INGRESSO,
  FAIXAS_ETARIAS,
  ROTULO_DA_FAIXA,
  ROTULO_DO_CANAL,
  chaveDoEvento,
} from "@/dados/tipos-acesso";
import {
  COBRANCAS,
  EXIGE_POR_MODALIDADE,
  EXPLICACAO_DA_PROGRAMACAO,
  FORMATOS_DE_EVENTO,
  MODALIDADES,
  PROGRAMACOES,
  ROTULO_DA_COBRANCA,
  ROTULO_DA_MODALIDADE,
  ROTULO_DA_PROGRAMACAO,
  ROTULO_DO_FORMATO_DE_EVENTO,
  emReais,
  impedimentosDe,
  podePublicar,
  scoreDoRegistro,
} from "@/dados/tipos-produtor";
import type { CatalogoDaAgenda } from "@/dados/mock/seed-produtor";
import type {
  ContextoDoProdutor,
  Registro,
  RegistroDeAgenda,
  TemporadaDoRascunho,
} from "@/dados/tipos-produtor";

/**
 * produtor-agenda.tsx, a ficha do EVENTO, em oito atos. **O molde das outras dez.**
 *
 * UMA FICHA, OITO ROTAS. As oito telas da jornada já existiam como rotas separadas, e cada
 * uma montava o próprio seletor de registro, o próprio cabeçalho e a própria leitura do
 * armazém. Aqui a ficha é uma só: cada rota renderiza este componente com `atoInicial`
 * diferente, e a navegação entre atos acontece DENTRO da página. É o que faz o link de um
 * impedimento levar ao ato que o resolve sem uma navegação de rota, e é o que faz o
 * progresso `2/8` significar alguma coisa.
 *
 * MÓDULO DE CLIENTE. O catálogo entra por PROP, vindo do componente de servidor que o leu
 * no build; `tipos-produtor` e `tipos-acesso` são client-seguros por construção (DP-F).
 *
 * A CHAVE DE IDENTIDADE É O ATO 1, e é ela que faz duas linhas serem a mesma coisa no
 * mundo: `evento = título normalizado + agente realizador + obra`. Temporada e sessão só
 * existem depois dela, é por isso que a ordem dos atos não é arbitrária.
 */

export interface PropsAgenda {
  semente: Registro[];
  contexto: ContextoDoProdutor;
  catalogo: CatalogoDaAgenda;
  /** Qual ato abre. Cada uma das oito rotas passa o seu. */
  atoInicial?: number;
  /** A frase de `duplicatas.ts` sobre o critério de identidade. */
  criterioDeIdentidade: string;
  /** `true` só na rota principal: abre no INÍCIO da pauta, e a ficha é pedida. */
  comInicio?: boolean;
}

export function FichaDaAgenda({
  semente,
  contexto,
  catalogo,
  atoInicial = 0,
  criterioDeIdentidade,
  comInicio = false,
}: PropsAgenda) {
  const router = useRouter();
  const armazem = useProdutor(semente, contexto);
  // Só a rota principal abre no início da pauta; as outras sete são atalhos fundos para
  // um ato específico e continuam abrindo direto na ficha.
  const [modo, setModo] = useState<"inicio" | "detalhe" | "ficha">("inicio");
  useEffect(() => {
    // AS DUAS SÃO CONSUMIDAS, sempre. Consumir só a vencedora deixava a outra bandeira
    // ligada num módulo global, e ela disparava sozinha na próxima ficha montada.
    const querDetalhe = consumirAberturaDoDetalhe();
    const querFicha = consumirAberturaDaFicha();
    if (querDetalhe) setModo("detalhe");
    else if (querFicha) setModo("ficha");
  }, []);

  // A CRIAÇÃO espera o armazém, como na ficha simples.
  // A pendência é assinada: marcar estando JÁ nesta rota re-renderiza e consome.
  const pendente = useSyncExternalStore(
    assinarCriacaoDaPauta,
    pautaPendenteDeCriacao,
    pautaPendenteNoServidor,
  );
  useEffect(() => {
    if (!armazem.pronto) return;
    if (pendente !== "agenda") return;
    const criar = consumirCriacaoDaPauta();
    if (criar === "agenda") {
      armazem.criar("agenda");
      setModo("ficha");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dispara na hidratação
  }, [armazem.pronto, pendente]);

  if (!armazem.pronto) {
    return (
      <div className="prod-corpo">
        <p className="prod-nota">Lendo o que está gravado neste navegador…</p>
      </div>
    );
  }

  const daAgenda = armazem.registros.filter(
    (r): r is RegistroDeAgenda => r.pauta === "agenda",
  );

  if (comInicio && modo === "inicio") {
    return (
      <PautaInicio
        pauta="agenda"
        registros={daAgenda}
        dataDeReferencia={contexto.dataDeReferencia}
        imagens={catalogo.imagens}
        aoAdicionar={() => {
          armazem.criar("agenda");
          setModo("ficha");
        }}
        aoAbrir={(id) => {
          armazem.escolher(id);
          // Publicado abre no DETALHE; rascunho vai direto às etapas.
          const alvo = daAgenda.find((r) => r.id === id);
          if (alvo?.situacao === "publicado") setModo("detalhe");
          else setModo("ficha");
        }}
      />
    );
  }

  const atual = armazem.atual?.pauta === "agenda" ? armazem.atual : (daAgenda[0] ?? null);

  if (!atual) {
    return (
      <div className="prod-corpo">
        <div className="prod-vazio">
          <p className="prod-vazio-frase">
            Nenhum evento ainda. A ficha da agenda é a mais completa do Studio, as outras
            dez reusam o mesmo maquinário.
          </p>
          <BotaoDoStudio
            primaria
            curto
            aoClicar={() => armazem.criar("agenda")}
            data-acao="criar-evento"
          >
            Criar o primeiro evento
          </BotaoDoStudio>
        </div>
      </div>
    );
  }

  if (comInicio && modo === "detalhe" && atual.situacao === "publicado") {
    return (
      <RegistroDetalhe
        registro={atual}
        dataDeReferencia={contexto.dataDeReferencia}
        imagens={catalogo.imagens}
        aoVoltar={() => setModo("inicio")}
        aoEditar={() => setModo("ficha")}
      />
    );
  }

  return (
    <Corpo
      key={atual.id}
      registro={atual}
      aoVoltar={
        comInicio
          ? () => setModo(atual.situacao === "publicado" ? "detalhe" : "inicio")
          : undefined
      }
      catalogo={catalogo}
      contexto={contexto}
      atoInicial={atoInicial}
      criterioDeIdentidade={criterioDeIdentidade}
      outros={daAgenda}
      aoAlterar={(m) => armazem.alterarId(atual.id, m as Partial<Registro>)}
      aoEscolher={armazem.escolher}
      aoCriar={() => armazem.criar("agenda")}
      aoPublicar={() => {
        const foi = armazem.publicar(atual.id);
        if (foi) router.push("/acontece/");
        return foi;
      }}
    />
  );
}

// ---------------------------------------------------------------------------

interface PropsCorpo {
  registro: RegistroDeAgenda;
  catalogo: CatalogoDaAgenda;
  contexto: ContextoDoProdutor;
  atoInicial: number;
  criterioDeIdentidade: string;
  outros: RegistroDeAgenda[];
  aoAlterar: (m: Partial<RegistroDeAgenda>) => void;
  aoEscolher: (id: string) => void;
  aoCriar: () => void;
  aoPublicar: () => boolean;
  /** Fecha a ficha e volta ao início da pauta, quando a rota o tem. */
  aoVoltar?: () => void;
}

function Corpo({
  registro,
  catalogo,
  contexto,
  atoInicial,
  criterioDeIdentidade,
  outros,
  aoAlterar,
  aoEscolher,
  aoCriar,
  aoPublicar,
  aoVoltar,
}: PropsCorpo) {
  const [atoPedido, setAtoPedido] = useState(atoInicial);
  const exige = EXIGE_POR_MODALIDADE[registro.modalidade];
  const score = scoreDoRegistro(registro, contexto);
  const impedimentos = impedimentosDe(registro);

  const atos = [
    {
      rotulo: "Identidade",
      fechado: registro.titulo.trim().length >= 3 && registro.linguagens.length > 0,
      conteudo: (
        <AtoIdentidade
          registro={registro}
          catalogo={catalogo}
          criterioDeIdentidade={criterioDeIdentidade}
          outros={outros}
          aoAlterar={aoAlterar}
          aoEscolher={aoEscolher}
          aoCriar={aoCriar}
        />
      ),
    },
    {
      rotulo: "Natureza",
      fechado: registro.formato !== null,
      conteudo: <AtoNatureza registro={registro} aoAlterar={aoAlterar} />,
    },
    {
      rotulo: "Elenco",
      fechado:
        registro.elenco.length > 0 && registro.elenco.every((v) => v.papel.trim() !== ""),
      conteudo: <AtoElenco registro={registro} catalogo={catalogo} aoAlterar={aoAlterar} />,
    },
    {
      rotulo: "Local e temporada",
      fechado: registro.temporadas.length > 0,
      conteudo: (
        <AtoTemporada registro={registro} catalogo={catalogo} aoAlterar={aoAlterar} />
      ),
    },
    {
      rotulo: "Grade de sessões",
      // A EXPOSIÇÃO NÃO TEM SESSÃO. Programação por vigência dispensa este ato inteiro, e a
      // dispensa é DECLARADA, sumir com um ato sem dizer por quê parece defeito.
      aplicavel: registro.programacao === "sessoes",
      porQueDispensado: EXPLICACAO_DA_PROGRAMACAO.vigencia,
      fechado: registro.sessoes.length > 0,
      conteudo: (
        <GradeDeSessoes registro={registro} catalogo={catalogo} aoAlterar={aoAlterar} />
      ),
    },
    {
      rotulo: "Comercial",
      fechado: registro.faixaEtaria !== null && registro.canalIngresso !== null,
      conteudo: <AtoComercial registro={registro} aoAlterar={aoAlterar} />,
    },
    {
      rotulo: "Acessibilidade",
      fechado: registro.declaraAcessibilidade,
      conteudo: (
        <AtoAcessibilidade
          registro={registro}
          temLugarFisico={exige.recursosFisicos}
          aoAlterar={aoAlterar}
        />
      ),
    },
    {
      rotulo: "Publicação",
      fechado: registro.situacao === "publicado",
      conteudo: (
        <AtoPublicacao
          registro={registro}
          contexto={contexto}
          aoAlterar={aoAlterar}
        />
      ),
    },
  ];

  return (
    <FichaEmAtos
      aoVoltar={aoVoltar}
      rotuloDaVolta="Eventos"
      titulo={registro.titulo.trim() === "" ? "Novo evento" : registro.titulo}
      objetivo="A chave de identidade antes de qualquer outra coisa: título normalizado, agente realizador e obra. Temporada e sessão só existem depois dela."
      atos={atos}
      atoInicial={atoPedido}
      noAr={registro.situacao === "publicado"}
      colunaColada={
        <>
          <ChaveViva registro={registro} />
          <Previa registro={registro} />
        </>
      }
      acaoFinal={
        <BotaoDoStudio
          primaria
          desabilitado={!podePublicar(registro)}
          porQueDesabilitado={`${impedimentos.filter((i) => i.bloqueia).length} impedimento(s): ${impedimentos
            .filter((i) => i.bloqueia)
            .map((i) => i.texto)
            .join(" · ")}`}
          aoClicar={aoPublicar}
          data-acao="publicar"
          data-bloqueiam={String(impedimentos.filter((i) => i.bloqueia).length)}
        >
          {score.podePublicar ? "Publicar" : `Falta ${score.bloqueiam}`}
        </BotaoDoStudio>
      }
    />
  );
}

// ---------------------------------------------------------------------------
// ATO 1 · IDENTIDADE, a chave viva
// ---------------------------------------------------------------------------

function AtoIdentidade({
  registro,
  catalogo,
  criterioDeIdentidade,
  outros,
  aoAlterar,
  aoEscolher,
  aoCriar,
}: {
  registro: RegistroDeAgenda;
  catalogo: CatalogoDaAgenda;
  criterioDeIdentidade: string;
  outros: RegistroDeAgenda[];
  aoAlterar: (m: Partial<RegistroDeAgenda>) => void;
  aoEscolher: (id: string) => void;
  aoCriar: () => void;
}) {
  // O AVISO DE DUPLICATA DISPARA ANTES DE SALVAR, contra os 300 eventos do acervo e contra
  // os outros registros do próprio produtor. É a MESMA `normalizar` do índice de busca e da
  // fila de duplicatas, uma normalização própria aqui faria o Studio gravar chave que a
  // fila não reconhece, e a fila passaria a acusar o próprio Studio.
  const parecidos = useMemo(() => {
    const t = normalizar(registro.titulo).trim();
    if (t.length < 4) return [];
    const doAcervo = catalogo.eventos
      .filter((e) => e.normalizado.includes(t) || t.includes(e.normalizado))
      .slice(0, 5)
      .map((e) => ({ titulo: e.titulo, onde: "no acervo" }));
    const meus = outros
      .filter((r) => r.id !== registro.id && normalizar(r.titulo).includes(t))
      .slice(0, 3)
      .map((r) => ({ titulo: r.titulo, onde: "nos seus registros" }));
    return [...meus, ...doAcervo];
  }, [registro.titulo, registro.id, catalogo.eventos, outros]);

  return (
    <>
      <SeletorDeRegistro
        registro={registro}
        outros={outros}
        aoEscolher={aoEscolher}
        aoCriar={aoCriar}
      />

      {/* A CHAVE VIVA. Os três terços acendem conforme fecham, o único progresso desta
          tela que não é o trilho, e o que explica por que a obra é um campo e não um
          enfeite. Na visão web ela aparece TAMBÉM na coluna colada, e é o MESMO componente:
          duas cópias divergiriam no primeiro ajuste, e o sintoma seria a coluna dizendo 2/3
          enquanto o ato diz 3/3. */}
      <ChaveViva registro={registro} criterio={criterioDeIdentidade} />

      <Campo rotulo="Título do evento" obrigatorio htmlFor="prod-titulo">
        <input
          id="prod-titulo"
          type="text"
          value={registro.titulo}
          onChange={(e) => aoAlterar({ titulo: e.target.value })}
          className="prod-campo-entrada"
          data-titulo-evento
          aria-invalid={registro.titulo.trim().length < 3}
        />
      </Campo>

      {/* O AVISO PERMANECE. Aviso que pisca é aviso perdido: ele fica enquanto o título
          continuar parecido, e não desaparece sozinho depois de dois segundos. */}
      {parecidos.length > 0 ? (
        <div
          className="prod-duplicata"
          data-duplicatas={String(parecidos.length)}
          role="status"
        >
          <strong>
            {parecidos.length === 1
              ? "1 registro parecido"
              : `${parecidos.length} registros parecidos`}
          </strong>
          <ul>
            {parecidos.map((p, i) => (
              <li key={`${p.titulo}-${i}`}>
                {p.titulo} <span className="prod-campo-nota">, {p.onde}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* QUEM REALIZA É CARIMBO, NÃO CAMPO. Quem publica é quem realiza, e deixar isto
          digitável abriria a porta para um produtor declarar realização alheia. */}
      <Campo
        rotulo="Quem realiza"
        nota="Carimbo do sistema, não campo de formulário, é a sua organização, e é ela o segundo componente da chave."
      >
        <p className="prod-carimbo" data-agente-realizador>
          {registro.fonte}
        </p>
      </Campo>

      <Campo
        rotulo="Obra"
        nota="O terceiro componente da chave. Hoje 300 de 300 eventos do acervo não a declaram, é dela que a jornada parte."
      >
        <CampoComProposta
          nome="Obra"
          acervo={catalogo.obras}
          porta="moderacao"
          escolha={{
            id: registro.obraId,
            titulo: registro.obraTitulo,
            proposto: registro.obraProposta,
          }}
          aoEscolher={(e) =>
            aoAlterar({ obraId: e.id, obraTitulo: e.titulo, obraProposta: e.proposto })
          }
        />
      </Campo>

      <Campo
        rotulo="Resumo"
        nota="27 dos 75 cartões de hoje não têm. Sem ele, o cartão mostra título e tags, e mais nada."
      >
        <textarea
          value={registro.resumo}
          onChange={(e) => aoAlterar({ resumo: e.target.value })}
          rows={4}
          className="prod-campo-entrada"
          data-resumo-evento
        />
      </Campo>

      <CampoDeImagem
        imagem={registro.imagem}
        aoMudar={(i) => aoAlterar({ imagem: i })}
        acervo={catalogo.imagens}
        obrigatoria={false}
      />

      <Campo rotulo="Linguagens">
        <SeletorDeCatalogo
          nome="Linguagens"
          termos={catalogo.linguagens}
          escolhidos={registro.linguagens}
          aoMudar={(ids) => aoAlterar({ linguagens: ids })}
          propostos={registro.termosPropostos}
          aoPropor={(t) => aoAlterar({ termosPropostos: t })}
        />
      </Campo>

      <Campo rotulo="Temas">
        <SeletorDeCatalogo
          nome="Temas"
          termos={catalogo.temas}
          escolhidos={registro.temas}
          aoMudar={(ids) => aoAlterar({ temas: ids })}
          propostos={[]}
          aoPropor={(t) =>
            aoAlterar({ termosPropostos: [...registro.termosPropostos, ...t] })
          }
        />
      </Campo>
    </>
  );
}

/** Qual registro a ficha edita. Cabeçalho de contexto, não filtro: a jornada atravessa oito
 *  atos, e quem chega na grade sem saber de qual evento ela é não tem como conferir nada. */
function SeletorDeRegistro({
  registro,
  outros,
  aoEscolher,
  aoCriar,
}: {
  registro: RegistroDeAgenda;
  outros: RegistroDeAgenda[];
  aoEscolher: (id: string) => void;
  aoCriar: () => void;
}) {
  return (
    <div className="prod-seletor-registro">
      <label className="prod-seletor-registro-rotulo" htmlFor="prod-seletor">
        Editando
      </label>
      <select
        id="prod-seletor"
        value={registro.id}
        onChange={(e) => aoEscolher(e.target.value)}
        className="prod-campo-entrada"
        data-seletor-registro
      >
        {outros.map((r) => (
          <option key={r.id} value={r.id}>
            {r.titulo.trim() === "" ? "(sem título)" : r.titulo}
          </option>
        ))}
      </select>
      <BotaoDoStudio curto aoClicar={aoCriar} data-acao="novo-evento">
        Novo
      </BotaoDoStudio>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ATO 2 · NATUREZA, tela nova
// ---------------------------------------------------------------------------

function AtoNatureza({
  registro,
  aoAlterar,
}: {
  registro: RegistroDeAgenda;
  aoAlterar: (m: Partial<RegistroDeAgenda>) => void;
}) {
  const exige = EXIGE_POR_MODALIDADE[registro.modalidade];

  return (
    <>
      <Campo
        rotulo="Modalidade"
        obrigatorio
        nota="Ela muda a ficha, e não só o rótulo: online dispensa espaço e pede plataforma; presencial faz o contrário."
      >
        <Segmento rotulo="modalidade do evento" data-seletor-modalidade>
          {MODALIDADES.map((m) => (
            <OpcaoDeSegmento
              key={m}
              selecionado={registro.modalidade === m}
              data-modalidade={m}
              onClick={() => aoAlterar({ modalidade: m })}
            >
              {ROTULO_DA_MODALIDADE[m]}
            </OpcaoDeSegmento>
          ))}
        </Segmento>
      </Campo>

      {/* ONLINE DISPENSA ESPAÇO e pede plataforma. A assimetria é o ponto: uma ficha que
          pedisse espaço para uma live ensinaria a ignorar campo obrigatório. */}
      {exige.plataforma ? (
        <>
          <Campo rotulo="Plataforma" obrigatorio>
            <input
              type="text"
              value={registro.plataforma}
              onChange={(e) => aoAlterar({ plataforma: e.target.value })}
              placeholder="YouTube, Itaú Cultural Play, Zoom…"
              className="prod-campo-entrada"
              data-plataforma
              aria-invalid={registro.plataforma.trim() === ""}
            />
          </Campo>
          <Campo rotulo="Link da transmissão">
            <input
              type="url"
              value={registro.linkDaTransmissao}
              onChange={(e) => aoAlterar({ linkDaTransmissao: e.target.value })}
              className="prod-campo-entrada"
              data-link-transmissao
            />
          </Campo>
          <Campo rotulo="Como acontece">
            <Segmento rotulo="ao vivo ou sob demanda">
              <OpcaoDeSegmento
                selecionado={registro.aoVivo}
                onClick={() => aoAlterar({ aoVivo: true })}
                data-ao-vivo="sim"
              >
                ao vivo
              </OpcaoDeSegmento>
              <OpcaoDeSegmento
                selecionado={!registro.aoVivo}
                onClick={() => aoAlterar({ aoVivo: false })}
                data-ao-vivo="nao"
              >
                sob demanda
              </OpcaoDeSegmento>
            </Segmento>
          </Campo>
        </>
      ) : (
        <p className="prod-campo-nota" data-sem-plataforma>
          Plataforma e link não aparecem porque a modalidade é presencial. O lugar entra no
          ato «Local e temporada».
        </p>
      )}

      <Campo rotulo="Formato">
        <SeletorDeCatalogo
          nome="Formato"
          unico
          termos={FORMATOS_DE_EVENTO.map((f) => ({
            id: f,
            rotulo: ROTULO_DO_FORMATO_DE_EVENTO[f],
          }))}
          escolhidos={registro.formato ? [registro.formato] : []}
          aoMudar={(ids) =>
            aoAlterar({ formato: (ids[0] as RegistroDeAgenda["formato"]) ?? null })
          }
          aceitaProposta={false}
          porQueFechado="Os oito formatos são o vocabulário do produto. Acrescentar um é decisão de catálogo, na tela de Catálogos."
        />
      </Campo>

      <Campo
        rotulo="Programação"
        obrigatorio
        nota="Exposição tem vigência, não sessão. Escolher «vigência contínua» dispensa a grade de sessões inteira."
      >
        <Segmento rotulo="como o evento acontece no tempo" data-seletor-programacao>
          {PROGRAMACOES.map((p) => (
            <OpcaoDeSegmento
              key={p}
              selecionado={registro.programacao === p}
              data-programacao={p}
              onClick={() => aoAlterar({ programacao: p })}
            >
              {ROTULO_DA_PROGRAMACAO[p]}
            </OpcaoDeSegmento>
          ))}
        </Segmento>
      </Campo>

      <p className="prod-campo-nota" data-explicacao-programacao={registro.programacao}>
        {EXPLICACAO_DA_PROGRAMACAO[registro.programacao]}
      </p>
    </>
  );
}

// ---------------------------------------------------------------------------
// ATO 3 · ELENCO, o papel vem ANTES da pessoa
// ---------------------------------------------------------------------------

function AtoElenco({
  registro,
  catalogo,
  aoAlterar,
}: {
  registro: RegistroDeAgenda;
  catalogo: CatalogoDaAgenda;
  aoAlterar: (m: Partial<RegistroDeAgenda>) => void;
}) {
  const [papel, setPapel] = useState("");

  return (
    <>

      {/* O PAPEL VEM ANTES. Escolher a pessoa primeiro e o papel depois produz o vínculo
          sem papel, que a aresta não aceita, e a tela teria de recusar o que ela mesma
          deixou montar. */}
      <Campo
        rotulo="Papel"
        obrigatorio
        nota="Lido das próprias arestas do acervo, com a contagem."
      >
        <SeletorDeCatalogo
          nome="Papel"
          unico
          termos={catalogo.papeis.map((p) => ({
            id: p.papel,
            rotulo: p.papel,
            usos: p.arestas,
          }))}
          escolhidos={papel ? [papel] : []}
          aoMudar={(ids) => setPapel(ids[0] ?? "")}
          propostos={[]}
          aoPropor={(t) => setPapel(t[t.length - 1] ?? "")}
        />
      </Campo>

      <Campo rotulo="Quem atua" obrigatorio>
        <CampoComProposta
          nome="Pessoa ou coletivo"
          acervo={catalogo.agentes}
          porta="moderacao"
          escolha={{ id: null, titulo: null, proposto: false }}
          aoEscolher={(e) => {
            if (!e.titulo || papel.trim() === "") return;
            aoAlterar({
              elenco: [
                ...registro.elenco,
                {
                  agenteId: e.id ?? `proposto:${normalizar(e.titulo)}`,
                  agenteTitulo: e.titulo,
                  agenteClasse: "pessoa",
                  papel,
                  proposto: e.proposto,
                },
              ],
            });
            setPapel("");
          }}
        />
        {papel.trim() === "" ? (
          <p className="prod-campo-nota" data-papel-antes>
            Escolha o papel primeiro. A aresta <code>atua_em</code> o exige, e um vínculo sem
            papel seria recusado depois de montado.
          </p>
        ) : null}
      </Campo>

      {registro.elenco.length > 0 ? (
        <ul className="prod-lista" data-elenco>
          {registro.elenco.map((v, i) => (
            <li key={`${v.agenteId}-${i}`}>
              <div className="prod-vinculo" data-proposto={v.proposto ? "sim" : "nao"}>
                <div className="prod-registro-corpo">
                  <strong className="prod-registro-titulo">{v.agenteTitulo}</strong>
                  <span className="prod-registro-meta">
                    {v.papel}
                    {v.proposto ? " · proposto à Enciclopédia (Moderador 117)" : ""}
                  </span>
                </div>
                <BotaoDoStudio
                  curto
                  aoClicar={() =>
                    aoAlterar({ elenco: registro.elenco.filter((_, n) => n !== i) })
                  }
                  data-acao="remover-vinculo"
                >
                  Remover
                </BotaoDoStudio>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// ATO 4 · LOCAL E TEMPORADA, o espaço vem ANTES do intervalo
// ---------------------------------------------------------------------------

function AtoTemporada({
  registro,
  catalogo,
  aoAlterar,
}: {
  registro: RegistroDeAgenda;
  catalogo: CatalogoDaAgenda;
  aoAlterar: (m: Partial<RegistroDeAgenda>) => void;
}) {
  const exige = EXIGE_POR_MODALIDADE[registro.modalidade];

  function alterarTemporada(id: string, m: Partial<TemporadaDoRascunho>) {
    aoAlterar({
      temporadas: registro.temporadas.map((t) => (t.id === id ? { ...t, ...m } : t)),
    });
  }

  function acrescentar() {
    // O SUFIXO SAI DO MAIOR JÁ EMITIDO, nunca do tamanho da lista: com [:1, :2, :3],
    // remover a do meio faria a próxima nascer :3 e colidir com a que ficou.
    const maior = registro.temporadas.reduce((maximo, t) => {
      const fim = Number.parseInt(t.id.slice(t.id.lastIndexOf(":") + 1), 10);
      return Number.isFinite(fim) && fim > maximo ? fim : maximo;
    }, 0);
    const n = maior + 1;
    aoAlterar({
      temporadas: [
        ...registro.temporadas,
        {
          id: `temporada:${registro.id}:${n}`,
          espacoId: null,
          espacoTitulo: null,
          inicio: "",
          fim: "",
          longaDuracao: registro.programacao === "vigencia",
          espacoPedido: false,
        },
      ],
    });
  }

  function remover(id: string) {
    aoAlterar({
      temporadas: registro.temporadas.filter((t) => t.id !== id),
      // AS SESSÕES DAQUELA TEMPORADA VÃO JUNTO. Deixá-las órfãs produziria sessão sem
      // temporada, e a chave da ocorrência é montada SOBRE a da temporada, então a sessão
      // órfã gravaria chave de duas partes em vez de três.
      sessoes: registro.sessoes.filter((s) => s.temporadaId !== id),
    });
  }

  return (
    <>
      {!exige.espaco ? (
        <p className="prod-campo-nota" data-sem-espaco>
          A modalidade é online: o espaço fica dispensado, e a temporada é só o período em
          que a transmissão fica disponível.
        </p>
      ) : null}

      {registro.temporadas.map((t) => {
        const sessoesDaTemporada = registro.sessoes.filter((s) => s.temporadaId === t.id);
        return (
          <div className="prod-temporada" key={t.id} data-temporada={t.id}>
            {/* O ESPAÇO VEM ANTES DO INTERVALO, e a ordem é da ontologia:
                `temporada = evento + espaço + intervalo`. Preencher o intervalo primeiro
                daria uma chave de duas partes esperando a terceira. */}
            {exige.espaco ? (
              <Campo rotulo="Espaço" nota="Segundo componente da chave da temporada.">
                <CampoComProposta
                  nome="Espaço"
                  acervo={catalogo.espacos.map((e) => ({
                    id: e.id,
                    titulo: e.titulo,
                    classe: "espaço",
                    resumo: [e.cidade, e.estado].filter(Boolean).join(", "),
                  }))}
                  porta="organizacao"
                  escolha={{
                    id: t.espacoId,
                    titulo: t.espacoTitulo,
                    proposto: t.espacoPedido,
                  }}
                  aoEscolher={(e) =>
                    alterarTemporada(t.id, {
                      espacoId: e.id,
                      espacoTitulo: e.titulo,
                      espacoPedido: e.proposto,
                    })
                  }
                  rotuloDeCriar="Cadastrar espaço agora"
                />
              </Campo>
            ) : null}

            <div className="prod-par">
              <Campo rotulo="Início" obrigatorio>
                <input
                  type="date"
                  value={t.inicio}
                  onChange={(e) => alterarTemporada(t.id, { inicio: e.target.value })}
                  className="prod-campo-entrada"
                  data-inicio-temporada
                />
              </Campo>
              <Campo rotulo="Fim" obrigatorio>
                <input
                  type="date"
                  value={t.fim}
                  min={t.inicio || undefined}
                  onChange={(e) => alterarTemporada(t.id, { fim: e.target.value })}
                  className="prod-campo-entrada"
                  data-fim-temporada
                />
              </Campo>
            </div>

            {/* REMOVER DECLARA QUANTAS SESSÕES VÃO JUNTO. Uma remoção que leva doze sessões
                em silêncio é a que a pessoa descobre depois, na tela pública. */}
            <BotaoDoStudio
              curto
              aoClicar={() => remover(t.id)}
              data-acao="remover-temporada"
            >
              {sessoesDaTemporada.length > 0
                ? `Remover, isto leva junto ${sessoesDaTemporada.length} ${sessoesDaTemporada.length === 1 ? "sessão" : "sessões"}`
                : "Remover temporada"}
            </BotaoDoStudio>
          </div>
        );
      })}

      <BotaoDoStudio aoClicar={acrescentar} data-acao="nova-temporada">
        {registro.temporadas.length === 0
          ? "Acrescentar temporada"
          : "+ outra temporada (turnê)"}
      </BotaoDoStudio>
    </>
  );
}

// ---------------------------------------------------------------------------
// ATO 6 · COMERCIAL, a tela P7, que nunca existiu
// ---------------------------------------------------------------------------

function AtoComercial({
  registro,
  aoAlterar,
}: {
  registro: RegistroDeAgenda;
  aoAlterar: (m: Partial<RegistroDeAgenda>) => void;
}) {
  return (
    <>

      <Campo rotulo="Cobrança" obrigatorio>
        <Segmento rotulo="como se paga" data-seletor-cobranca>
          {COBRANCAS.map((c) => (
            <OpcaoDeSegmento
              key={c}
              selecionado={registro.cobranca === c}
              data-cobranca={c}
              onClick={() => aoAlterar({ cobranca: c })}
            >
              {ROTULO_DA_COBRANCA[c]}
            </OpcaoDeSegmento>
          ))}
        </Segmento>
      </Campo>

      {registro.cobranca === "pago" ? (
        <div className="prod-preco">
          {/* EM CENTAVOS, e não em reais com casa decimal: `40.5` e `40.50` são o mesmo
              número em ponto flutuante e grafias diferentes na tela. */}
          <Campo
            rotulo="Inteira"
            nota={
              registro.preco.inteira !== null ? emReais(registro.preco.inteira) : undefined
            }
          >
            <input
              type="number"
              min={0}
              step={1}
              value={registro.preco.inteira === null ? "" : registro.preco.inteira / 100}
              onChange={(e) =>
                aoAlterar({
                  preco: {
                    ...registro.preco,
                    inteira:
                      e.target.value === ""
                        ? null
                        : Math.round(Number(e.target.value) * 100),
                  },
                })
              }
              className="prod-campo-entrada"
              data-preco-inteira
            />
          </Campo>
          <Campo
            rotulo="Meia"
            nota={registro.preco.meia !== null ? emReais(registro.preco.meia) : undefined}
          >
            <input
              type="number"
              min={0}
              step={1}
              value={registro.preco.meia === null ? "" : registro.preco.meia / 100}
              onChange={(e) =>
                aoAlterar({
                  preco: {
                    ...registro.preco,
                    meia:
                      e.target.value === ""
                        ? null
                        : Math.round(Number(e.target.value) * 100),
                  },
                })
              }
              className="prod-campo-entrada"
              data-preco-meia
            />
          </Campo>
        </div>
      ) : null}

      <Campo
        rotulo="Canal de ingresso"
        nota="Os três do contrato. «Link externo» pede o endereço, um canal que promete uma URL e não a tem manda o público para lugar nenhum."
      >
        <SeletorDeCatalogo
          nome="Canal de ingresso"
          unico
          termos={CANAIS_DE_INGRESSO.map((c) => ({ id: c, rotulo: ROTULO_DO_CANAL[c] }))}
          escolhidos={registro.canalIngresso ? [registro.canalIngresso] : []}
          aoMudar={(ids) =>
            aoAlterar({
              canalIngresso: (ids[0] as RegistroDeAgenda["canalIngresso"]) ?? null,
            })
          }
          aceitaProposta={false}
          porQueFechado="Os três canais são o vocabulário do contrato, lido pela tela pública do evento."
        />
      </Campo>

      {registro.canalIngresso === "link-externo" ? (
        <Campo rotulo="Link de venda" obrigatorio>
          <input
            type="url"
            value={registro.linkDeIngresso ?? ""}
            onChange={(e) => aoAlterar({ linkDeIngresso: e.target.value || null })}
            placeholder="https://www.sympla.com.br/evento/…"
            className="prod-campo-entrada"
            data-link-ingresso
            aria-invalid={!(registro.linkDeIngresso ?? "").trim()}
          />
        </Campo>
      ) : null}

      {registro.canalIngresso !== "link-externo" ? (
        <div className="prod-inscricao">
          <Campo
            rotulo="Instrução de inscrição"
            nota="O que fazer quando não há bilheteria."
          >
            <textarea
              value={registro.inscricao ?? ""}
              onChange={(e) => aoAlterar({ inscricao: e.target.value || null })}
              rows={2}
              className="prod-campo-entrada"
              data-inscricao
            />
          </Campo>
          <div className="prod-par">
            <Campo rotulo="Vagas">
              <input
                type="number"
                min={0}
                value={registro.vagas ?? ""}
                onChange={(e) =>
                  aoAlterar({ vagas: e.target.value === "" ? null : Number(e.target.value) })
                }
                className="prod-campo-entrada"
                data-vagas
              />
            </Campo>
            <Campo rotulo="Prazo">
              <input
                type="date"
                value={registro.prazoDeInscricao ?? ""}
                onChange={(e) => aoAlterar({ prazoDeInscricao: e.target.value || null })}
                className="prod-campo-entrada"
                data-prazo-inscricao
              />
            </Campo>
          </div>
        </div>
      ) : null}

      {/* SEM ELA A DISPOSIÇÃO «VOU COM CRIANÇA» MENTE. O filtro público está no ar com
          `campoLido: null` porque o acervo não declara faixa etária em campo nenhum. */}
      <Campo
        rotulo="Faixa etária"
        nota="A disposição «vou com criança» está no ar e desligada porque o acervo não declara este campo. É ela que o liga."
      >
        <SeletorDeCatalogo
          nome="Faixa etária"
          unico
          termos={FAIXAS_ETARIAS.map((f) => ({ id: f, rotulo: ROTULO_DA_FAIXA[f] }))}
          escolhidos={registro.faixaEtaria ? [registro.faixaEtaria] : []}
          aoMudar={(ids) =>
            aoAlterar({ faixaEtaria: (ids[0] as RegistroDeAgenda["faixaEtaria"]) ?? null })
          }
          aceitaProposta={false}
          porQueFechado="Os seis valores são a tabela do Ministério da Justiça."
        />
      </Campo>
    </>
  );
}

// ---------------------------------------------------------------------------
// ATO 7 · ACESSIBILIDADE
// ---------------------------------------------------------------------------

function AtoAcessibilidade({
  registro,
  temLugarFisico,
  aoAlterar,
}: {
  registro: RegistroDeAgenda;
  temLugarFisico: boolean;
  aoAlterar: (m: Partial<RegistroDeAgenda>) => void;
}) {
  return (
    <>

      <FichaDeAcessibilidade
        dimensoes={registro.acessibilidade}
        fisicos={registro.fisicos}
        declarada={registro.declaraAcessibilidade}
        temLugarFisico={temLugarFisico}
        aoMudarDimensoes={(a) => aoAlterar({ acessibilidade: a })}
        aoMudarFisicos={(f) => aoAlterar({ fisicos: f })}
        aoDeclarar={() => aoAlterar({ declaraAcessibilidade: true })}
        aoDesfazer={() => aoAlterar({ declaraAcessibilidade: false })}
      />

      {registro.sessoes.length > 1 ? (
        <label className="prod-dimensao">
          <input
            type="checkbox"
            checked={registro.acessibilidadeVariaPorSessao}
            onChange={(e) => aoAlterar({ acessibilidadeVariaPorSessao: e.target.checked })}
            data-varia-por-sessao
          />
          <span className="prod-dimensao-rotulo">
            A acessibilidade varia entre sessões, a sessão com Libras não é toda sessão
          </span>
        </label>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// ATO 8 · PUBLICAÇÃO
// ---------------------------------------------------------------------------

function AtoPublicacao({
  registro,
  contexto,
  aoAlterar,
}: {
  registro: RegistroDeAgenda;
  contexto: ContextoDoProdutor;
  aoAlterar: (m: Partial<RegistroDeAgenda>) => void;
}) {
  // O ATO SÃO DUAS DECISÕES: para quem isto aparece, e como fica. O que falta não se
  // repete aqui: está no botão de publicar, que é quem barra.
  return (
    <>
      <SeletorDeVisibilidade
        visibilidade={registro.visibilidade}
        agendadoPara={registro.agendadoPara}
        aoMudar={(v, quando) => aoAlterar({ visibilidade: v, agendadoPara: quando })}
        hoje={contexto.dataDeReferencia}
      />

      <Previa registro={registro} />
    </>
  );
}

// ---------------------------------------------------------------------------

/**
 * A chave de identidade, viva, `evento = título + agente realizador + obra`.
 *
 * ELA APARECE EM DOIS LUGARES: dentro do ato 1, e na coluna colada da visão web. É o MESMO
 * componente nos dois. Duas cópias do mesmo quadro divergiriam no primeiro ajuste, e o
 * sintoma seria a coluna dizendo 2/3 enquanto o ato diz 3/3, sem que nenhuma das duas
 * esteja errada sobre si mesma.
 *
 * `criterio` é opcional porque a coluna colada não repete a frase longa do critério de
 * identidade: ali o espaço é curto, e a frase já foi lida no ato 1.
 */
function ChaveViva({
  registro,
  criterio,
}: {
  registro: RegistroDeAgenda;
  criterio?: string;
}) {
  const { componentes } = chaveDoEvento(
    registro.titulo,
    registro.fonte,
    registro.obraTitulo,
  );
  const fechados = componentes.filter((c) => c.sustentado).length;

  return (
    <div className="prod-chave" data-chave={`${fechados}/3`}>
      <div className="prod-chave-conta">
        <strong>{fechados}</strong>
        <span>de 3 componentes da chave</span>
      </div>
      <ul className="prod-chave-lista">
        {componentes.map((c) => (
          <li
            key={c.campo}
            className="prod-chave-item"
            data-fechado={c.sustentado ? "sim" : "nao"}
          >
            <span className="prod-degrau-marca" aria-hidden />
            {c.rotulo}
          </li>
        ))}
      </ul>
      {criterio ? <p className="prod-campo-nota">{criterio}</p> : null}
    </div>
  );
}
