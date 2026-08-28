/**
 * verificar-pontos.ts — o portão do motor de pontos.
 *
 * Rodado por `npm run verificar-pontos` (tsx, nunca `node` puro — ver o cabeçalho
 * de `smoke-grafo.ts`). Ele NÃO testa tipo: testa comportamento. Cada portão
 * abaixo é uma promessa que o programa faz na tela e que quebraria em silêncio.
 *
 * O portão mais importante é o último: a soma das linhas do livro TEM que bater
 * com o saldo derivado. Se um dia deixar de bater, tudo que este motor promete
 * — extrato auditável, «por que tenho 840 de percurso» — deixa de valer junto.
 */

import { Motor } from "../src/lib/pontos/motor";
import { PROGRAMA } from "../src/dados/programa";
import { podeEnviar } from "../src/lib/pontos/comprovacoes";
import { saldo } from "../src/lib/pontos/livro";
import { LIMIAR_DE_CONFIANCA, validar } from "../src/lib/pontos/validacao";
import type { EstadoDoMotor } from "../src/lib/pontos/tipos";

let falhas = 0;
let portoes = 0;

function conferir(oQue: string, condicao: boolean, detalhe?: string) {
  portoes++;
  if (condicao) {
    console.log(`  ok   ${oQue}`);
  } else {
    falhas++;
    console.error(`  FALHOU  ${oQue}${detalhe ? ` — ${detalhe}` : ""}`);
  }
}

function titulo(t: string) {
  console.log(`\n${t}`);
}

function novoMotor(): Motor {
  return new Motor("persona-teste", PROGRAMA);
}

/**
 * Quantas linhas do livro têm este motivo, e quanto elas somam.
 *
 * OS PORTÕES CONFEREM LINHA, NÃO SALDO TOTAL, e a primeira versão deste arquivo
 * errou justamente aí: um `play.midia.concluida` credita 50 pela regra E até 120
 * pela missão semanal que ele fecha, então «o saldo subiu 50» é falso mesmo com a
 * regra perfeita. A linha isola a regra do ruído das missões; o saldo total tem o
 * portão 10 só para ele.
 */
function porMotivo(m: Motor, motivo: string, ativo: "ficha" | "percurso" | "reputacao") {
  const linhas = m.atual.livro.filter((l) => l.motivo === motivo && l.ativo === ativo);
  return { quantas: linhas.length, soma: linhas.reduce((s, l) => s + l.valor, 0) };
}

/* ── 1. Saldo de abertura entra como linha, não como número solto ────────── */

titulo("1. Saldo de abertura");
{
  const m = novoMotor();
  conferir("percurso abre em 180", m.saldoDe("percurso") === 180, String(m.saldoDe("percurso")));
  conferir("ficha abre em 45", m.saldoDe("ficha") === 45, String(m.saldoDe("ficha")));
  conferir("reputação abre em 12", m.saldoDe("reputacao") === 12, String(m.saldoDe("reputacao")));
  conferir(
    "as três aberturas são linhas do livro",
    m.atual.livro.filter((l) => l.eventoOrigemId === "evt_abertura").length === 3,
  );
}

/* ── 2. Consumo pontua, e pontua uma vez só ──────────────────────────────── */

titulo("2. Consumo pontua uma vez por item");
{
  const m = novoMotor();

  m.emitir("play.midia.concluida", { tipo: "midia", id: "doc-a" });
  conferir(
    "documentário credita 50 de percurso pela regra",
    porMotivo(m, "Audiovisual concluído", "percurso").soma === 50,
    String(porMotivo(m, "Audiovisual concluído", "percurso").soma),
  );
  conferir("e 5 fichas", porMotivo(m, "Audiovisual concluído", "ficha").soma === 5);

  const percursoDepois = m.saldoDe("percurso");
  const missoesFeitas = Object.values(m.atual.missoes).filter((x) => x.concluidaEm).length;

  const rastro = m.emitir("play.midia.concluida", { tipo: "midia", id: "doc-a" });
  conferir("o MESMO documentário não move saldo nenhum", m.saldoDe("percurso") === percursoDepois);
  conferir(
    "nem avança missão — era o bug do freio por regra",
    Object.values(m.atual.missoes).filter((x) => x.concluidaEm).length === missoesFeitas,
  );
  conferir(
    "e o motor diz por que ignorou",
    rastro.ignoradas.some((i) => i.motivo === "este item já pontuou"),
  );
  conferir("o item repetido não dispara regra alguma", rastro.dispararam.length === 0);

  m.emitir("play.midia.concluida", { tipo: "midia", id: "doc-b" });
  conferir(
    "outro documentário credita a segunda linha",
    porMotivo(m, "Audiovisual concluído", "percurso").quantas === 2,
  );
}

/* ── 3. O bônus de travessia — o coração da mecânica ─────────────────────── */

titulo("3. Bônus de travessia");
{
  const m = novoMotor();

  m.emitir("play.midia.concluida", { tipo: "midia", id: "doc-danca" }, { linguagemNova: "dança" });
  conferir(
    "linguagem nova credita 30 fichas numa linha própria",
    porMotivo(m, "Primeira vez em dança", "ficha").soma === 30,
    String(porMotivo(m, "Primeira vez em dança", "ficha").soma),
  );
  conferir("o item continua creditando as suas 5", porMotivo(m, "Audiovisual concluído", "ficha").soma === 5);
  conferir("a linguagem entra no repertório alcançado", m.atual.linguagensAlcancadas.includes("dança"));

  m.emitir("play.midia.concluida", { tipo: "midia", id: "doc-danca-2" }, { linguagemNova: "dança" });
  conferir(
    "a MESMA linguagem não paga bônus de novo",
    porMotivo(m, "Primeira vez em dança", "ficha").quantas === 1,
  );

  m.emitir("leitura.materia.concluida", { tipo: "conteudo", id: "mat-pa" }, { territorioNovo: "PA" });
  conferir("território novo credita 25", porMotivo(m, "Primeira vez em PA", "ficha").soma === 25);
  conferir("e entra no mapa alcançado", m.atual.ufsAlcancadas.includes("PA"));
}

/* ── 4. Teto diário de integridade ───────────────────────────────────────── */

titulo("4. Teto diário");
{
  const m = novoMotor();

  for (let i = 0; i < 8; i++) {
    m.emitir("leitura.materia.concluida", { tipo: "conteudo", id: "mat-" + i });
  }
  conferir(
    "8 matérias distintas no mesmo dia creditam só 5 linhas",
    porMotivo(m, "Matéria lida", "percurso").quantas === 5,
    String(porMotivo(m, "Matéria lida", "percurso").quantas),
  );
  conferir("que somam 125", porMotivo(m, "Matéria lida", "percurso").soma === 125);
}

/* ── 5. Nível sobe, e o efeito é emitido ─────────────────────────────────── */

titulo("5. Subida de nível");
{
  const m = novoMotor();
  conferir("começa no nível 1", m.nivel().numero === 1, m.nivel().nome);

  let subiu = false;
  for (let i = 0; i < 3; i++) {
    const r = m.emitir("curso.concluido", { tipo: "formacao", id: "curso-" + i });
    if (r.efeitos.some((e) => e.tipo === "subiuDeNivel")) subiu = true;
  }
  // O NÚMERO SAI DA ESCADA, e não de uma constante escrita aqui: a escada tem 18
  // degraus desde 2026-08 e vai ser rebalanceada de novo. O portão confere a
  // PROMESSA — «três cursos fazem o nível subir e o percurso bate com o degrau
  // declarado» —, que continua valendo qualquer que seja a curva.
  const esperado = PROGRAMA.config.limiaresDeNivel.filter((l) => l <= m.saldoDe("percurso")).length;
  conferir(
    "três cursos sobem o nível de acordo com a escada",
    m.nivel().numero === esperado && esperado > 1,
    `${m.saldoDe("percurso")} de percurso, nível ${m.nivel().numero}, esperado ${esperado}`,
  );
  conferir("o efeito de subida foi emitido", subiu);
  conferir("percurso NUNCA debita", m.atual.livro.every((l) => l.ativo !== "percurso" || l.sentido === "credito"));
}

/* ── 6. A escada da sequência, degrau por degrau ─────────────────────────── */

titulo("6. Escada da sequência");
{
  const m = novoMotor();
  m.emitir("play.midia.concluida", { tipo: "midia", id: "s-1" });
  conferir("gesto válido estende para 4", m.atual.sequencia.contagem === 4, String(m.atual.sequencia.contagem));
  conferir("fase segura", m.atual.sequencia.fase === "segura");

  // Esta semana TEVE gesto: a virada a registra como cumprida e a fase continua
  // segura. A escada só começa a descer na primeira semana de fato vazia.
  m.avancarDias(7);
  conferir("a semana com gesto vira cumprida", m.atual.sequencia.fase === "segura", m.atual.sequencia.fase);

  m.avancarDias(7);
  conferir("a primeira semana vazia vai para CARÊNCIA, não para zero", m.atual.sequencia.fase === "carencia", m.atual.sequencia.fase);
  conferir("a contagem sobrevive à carência", m.atual.sequencia.contagem === 4, String(m.atual.sequencia.contagem));

  m.avancarDias(7);
  conferir("a segunda falta CONGELA (consome proteção)", m.atual.sequencia.fase === "congelada", m.atual.sequencia.fase);
  conferir("uma proteção foi consumida", m.atual.sequencia.protecoes === 1, String(m.atual.sequencia.protecoes));

  m.avancarDias(7);
  conferir("a terceira falta QUEBRA", m.atual.sequencia.fase === "quebrada", m.atual.sequencia.fase);
  conferir("e só então zera", m.atual.sequencia.contagem === 0, String(m.atual.sequencia.contagem));
  conferir("foram três semanas de proteção antes de perder", m.atual.sequencia.historico.length >= 6);
}

titulo("7. Recuperação sem perder a contagem");
{
  const m = novoMotor();
  m.emitir("play.midia.concluida", { tipo: "midia", id: "r-1" });
  const contagem = m.atual.sequencia.contagem;

  m.avancarDias(14);
  conferir("caiu em carência depois de uma semana vazia", m.atual.sequencia.fase === "carencia", m.atual.sequencia.fase);

  m.emitir("ocorrencia.presenca.confirmada", { tipo: "ocorrencia", id: "oc-1" });
  conferir("um gesto na carência volta para segura", m.atual.sequencia.fase === "segura", m.atual.sequencia.fase);
  conferir(
    "e a contagem CRESCE em vez de zerar",
    m.atual.sequencia.contagem === contagem + 1,
    `${m.atual.sequencia.contagem} depois de ${contagem}`,
  );
  conferir("nenhuma proteção foi gasta na recuperação", m.atual.sequencia.protecoes === 2, String(m.atual.sequencia.protecoes));
}

/* ── 8. Resgate: saldo, estoque e esteira ────────────────────────────────── */

titulo("8. Resgate nas recompensas");
{
  const m = novoMotor();
  const caro = m.catalogo.recompensas.find((r) => r.custo === 520);
  if (!caro) throw new Error("catálogo sem a recompensa de 520 — o teste precisa dela");

  const fichasAntes = m.saldoDe("ficha");
  const rastro = m.emitir("recompensa.resgatada", { tipo: "recompensa", id: caro.id });
  conferir("saldo insuficiente NÃO debita", m.saldoDe("ficha") === fichasAntes);
  conferir("e o motor diz o motivo", rastro.efeitos.some((e) => e.tipo === "tetoAtingido"));
  conferir("nenhum resgate foi criado", m.atual.resgates.length === 0);

  const barato = m.catalogo.recompensas.find((r) => r.id === "rec-exposicao");
  if (!barato) throw new Error("catálogo sem rec-exposicao");
  const estoqueAntes = barato.estoque;

  // Percurso suficiente para pagar 90 fichas: dois cursos rendem 50 fichas.
  m.emitir("curso.concluido", { tipo: "formacao", id: "c-1" });
  m.emitir("curso.concluido", { tipo: "formacao", id: "c-2" });
  const antesDoResgate = m.saldoDe("ficha");
  conferir("juntou fichas suficientes", antesDoResgate >= barato.custo, String(antesDoResgate));

  m.emitir("recompensa.resgatada", { tipo: "recompensa", id: barato.id });
  // A LINHA, não o saldo — a regra do cabeçalho vale aqui também. Desde que a
  // trilha de abertura «O primeiro resgate» existe, o mesmo evento debita 90 E
  // credita 3 pela missão que fecha junto; medir pelo total daria falso com o
  // débito perfeitamente correto.
  const debito = porMotivo(m, "Resgate: " + barato.titulo, "ficha");
  conferir("o custo foi debitado", debito.quantas === 1 && debito.soma === barato.custo, String(debito.soma));
  conferir("o estoque DECREMENTOU", barato.estoque === (estoqueAntes ?? 0) - 1, String(barato.estoque));
  conferir("o resgate nasce em «resgatado»", m.atual.resgates[0]?.fase === "resgatado");

  m.avancarDias(2);
  conferir("e a esteira anda com o tempo", m.atual.resgates[0]?.fase === "separado", m.atual.resgates[0]?.fase);
}

/* ── 9. Comunidade ───────────────────────────────────────────────────────── */

titulo("9. Comunidade");
{
  const m = novoMotor();
  const alvo = m.atual.publicacoes[0];

  m.emitir("comunidade.reacao.dada", { tipo: "publicacao", id: alvo.id });
  conferir("a reação foi registrada", (m.atual.reacoesDadas[alvo.id] ?? 0) === 1);
  conferir("e contou na publicação", alvo.reacoes > 0);

  m.emitir("comunidade.comentario.criado", { tipo: "publicacao", id: alvo.id }, { corpo: "Boa!" });
  conferir("o comentário entrou na publicação certa", alvo.comentarios.some((c) => c.corpo === "Boa!"));
  conferir("e rende reputação", m.saldoDe("reputacao") > 12);

  m.emitir("comunidade.publicacao.salva", { tipo: "publicacao", id: alvo.id });
  conferir("guardou a publicação", m.atual.publicacoesSalvas.includes(alvo.id));
  m.emitir("comunidade.publicacao.salva", { tipo: "publicacao", id: alvo.id });
  conferir("o mesmo gesto devolve — guardar alterna", !m.atual.publicacoesSalvas.includes(alvo.id));

  m.emitir("comunidade.assinada", { tipo: "comunidade", id: "c-bro-mcs" });
  conferir("assinou a comunidade", m.atual.assinadas.includes("c-bro-mcs"));
  const contagem = m.atual.assinadas.length;
  m.emitir("comunidade.assinada", { tipo: "comunidade", id: "c-bro-mcs" });
  conferir("assinar duas vezes não duplica", m.atual.assinadas.length === contagem);
}

/* ── 10. O livro fecha ───────────────────────────────────────────────────── */

titulo("10. O livro fecha");
{
  const m = novoMotor();
  m.emitir("play.midia.concluida", { tipo: "midia", id: "f-1" }, { linguagemNova: "teatro" });
  m.emitir("cast.episodio.concluido", { tipo: "midia", id: "f-2" });
  m.emitir("curso.concluido", { tipo: "formacao", id: "f-3" });
  m.emitir("ocorrencia.presenca.confirmada", { tipo: "ocorrencia", id: "f-4" });
  m.emitir("recompensa.resgatada", { tipo: "recompensa", id: "rec-visita" });

  const estado: EstadoDoMotor = m.atual;
  for (const ativo of ["ficha", "percurso", "reputacao"] as const) {
    const somaManual = estado.livro
      .filter((l) => l.ativo === ativo)
      .reduce((soma, l) => soma + (l.sentido === "credito" ? l.valor : -l.valor), 0);
    conferir(
      `${ativo}: soma das linhas bate com o saldo derivado`,
      somaManual === saldo(estado, ativo),
      `${somaManual} ≠ ${saldo(estado, ativo)}`,
    );
    conferir(`${ativo}: saldo nunca fica negativo`, saldo(estado, ativo) >= 0, String(saldo(estado, ativo)));
  }

  conferir(
    "toda linha aponta para o evento que a originou",
    estado.livro.every((l) => Boolean(l.eventoOrigemId)),
  );
}

/* ── 11. Nenhum campo do estado nasce indefinido ─────────────────────────── */

titulo("11. O estado nasce inteiro");
{
  // O portão que faltava quando `publicacoesSalvas` entrou no estado sem valor
  // inicial: a comunidade caiu em `guardadas.length` de um campo indefinido.
  // Campo novo que nasce vazio quebra a tela em runtime, não no typecheck.
  const m = novoMotor();
  const estado = m.atual as unknown as Record<string, unknown>;

  const listas = [
    "livro",
    "emblemas",
    "resgates",
    "publicacoes",
    "assinadas",
    "publicacoesSalvas",
    "presencas",
    "linguagensAlcancadas",
    "ufsAlcancadas",
    "diasDistintos",
  ];
  const mapas = ["missoes", "reacoesDadas", "execucoesPorRegra", "execucoesHoje", "itensPontuados"];

  for (const chave of listas) {
    conferir(`${chave} nasce como lista`, Array.isArray(estado[chave]), typeof estado[chave]);
  }
  for (const chave of mapas) {
    const v = estado[chave];
    conferir(`${chave} nasce como objeto`, Boolean(v) && typeof v === "object" && !Array.isArray(v));
  }
  conferir("sequência nasce completa", Array.isArray(m.atual.sequencia.marcas));

  const indefinidos = Object.entries(estado)
    .filter(([, v]) => v === undefined)
    .map(([k]) => k);
  conferir(
    "nenhum campo do estado é undefined",
    indefinidos.length === 0,
    indefinidos.join(", "),
  );
}

/* ── 12. Nenhuma publicação repete id ────────────────────────────────────── */

titulo("12. Ids de publicação são únicos");
{
  // O portão que faltava quando o gerador do feed passou a produzir `pub-ic-1`,
  // que já era o id de uma publicação escrita à mão. Chave repetida quebra a
  // reconciliação do React: trocar de comunidade deixava as publicações antigas
  // na tela, e nenhuma linha do código parecia errada.
  const m = novoMotor();
  const ids = m.atual.publicacoes.map((p) => p.id);
  const vistos = new Set<string>();
  const duplicados = ids.filter((id) => (vistos.has(id) ? true : (vistos.add(id), false)));

  conferir(
    `${ids.length} publicações, ${vistos.size} ids distintos`,
    duplicados.length === 0,
    duplicados.join(", "),
  );

  // Toda publicação aponta para uma comunidade que existe — sem isso ela some da
  // tela sem erro nenhum, que é pior que quebrar.
  const comunidades = new Set(m.catalogo.comunidades.map((c) => c.id));
  const orfas = m.atual.publicacoes.filter((p) => !comunidades.has(p.comunidadeId));
  conferir("nenhuma publicação órfã", orfas.length === 0, orfas.map((p) => p.id).join(", "));

  // Cada comunidade tem pelo menos cinco: menos que isso e a tela parece morta.
  const magras = m.catalogo.comunidades.filter(
    (c) => m.atual.publicacoes.filter((p) => p.comunidadeId === c.id).length < 5,
  );
  conferir("toda comunidade tem 5 ou mais publicações", magras.length === 0, magras.map((c) => c.id).join(", "));
}

/* ── 13. Comprovações: o fato pendente não é ponto ───────────────────────── */

titulo("13. Comprovações");
{
  const m = novoMotor();
  const missao = m.catalogo.missoes.find((x) => x.id === "m-primeira-exposicao");
  if (!missao) throw new Error("catálogo sem m-primeira-exposicao — o teste precisa dela");

  const arquivo = { nome: "exposicao.jpg", miniatura: "", hash: "hash-a" };

  // 1. ENVIAR NÃO PAGA. É a promessa central do desenho: enquanto a análise não
  // decidiu, o saldo é bit a bit o mesmo de antes do envio.
  const fichasAntes = m.saldoDe("ficha");
  const percursoAntes = m.saldoDe("percurso");
  const linhasAntes = m.atual.livro.length;
  const cpv = m.registrarProva(missao.id, arquivo);
  conferir("prova enviada não credita ficha", m.saldoDe("ficha") === fichasAntes);
  conferir("prova enviada não credita percurso", m.saldoDe("percurso") === percursoAntes);
  conferir("prova enviada não escreve no livro", m.atual.livro.length === linhasAntes);
  conferir("e ela existe, esperando decisão", m.atual.comprovacoes.length === 1);

  // 2. MODERAÇÃO TAMBÉM NÃO PAGA. «Quase aprovado» é zero.
  m.decidirProva(cpv.id, {
    fase: "em-moderacao",
    aderencia: "indefinida",
    confianca: 58,
    leitura: "-",
  });
  conferir("em moderação não credita", m.saldoDe("ficha") === fichasAntes);
  conferir("em moderação não fecha a missão", !m.atual.missoes[missao.id]?.concluidaEm);

  // 3. APROVAR PAGA, UMA VEZ SÓ.
  const cpv2 = m.registrarProva(missao.id, { ...arquivo, hash: "hash-b" });
  m.decidirProva(cpv2.id, { fase: "aprovada", aderencia: "sim", confianca: 91, leitura: "-" });
  const pago = porMotivo(m, "Missão: " + missao.titulo, "ficha");
  conferir("aprovação paga a missão", pago.quantas === 1 && pago.soma === missao.fichas, String(pago.soma));
  conferir("e a missão fechou", Boolean(m.atual.missoes[missao.id]?.concluidaEm));

  // 4. A TAG ENTRA NO PERFIL, e o selo junto.
  conferir(
    "a tag da conclusão entrou",
    missao.tagAoConcluir !== undefined && m.atual.tags.includes(missao.tagAoConcluir),
    m.atual.tags.join(", "),
  );
  conferir(
    "o selo da missão foi concedido",
    m.atual.emblemas.some((e) => e.emblemaId === missao.emblemaId),
  );

  // 5. UMA PROVA APROVADA ANDA SÓ NA MISSÃO DELA. Sem o escopo, este mesmo
  // evento avançaria as outras sete missões de mídia do catálogo de uma vez.
  const outras = m.catalogo.missoes.filter(
    (x) => x.prova === "midia" && x.id !== missao.id,
  );
  const contaminadas = outras.filter((x) => (m.atual.missoes[x.id]?.progresso ?? 0) > 0);
  conferir(
    "a aprovação não contamina outras missões de mídia",
    contaminadas.length === 0,
    contaminadas.map((x) => x.id).join(", "),
  );
}

/* ── 14. Comprovações: as travas ─────────────────────────────────────────── */

titulo("14. Travas de envio");
{
  const m = novoMotor();
  const missao = m.catalogo.missoes.find((x) => x.id === "m-campo-brasil");
  if (!missao) throw new Error("catálogo sem m-campo-brasil");

  const regras = missao.regrasDeAceite ?? { vale: [], naoVale: [] };
  const base = { missaoId: missao.id, nome: "p.jpg", bytes: 1024, regras };

  // A duplicidade é a única antifraude que este protótipo consegue honrar de
  // verdade — então ela é conferida de verdade.
  const primeiro = await validar({ ...base, hash: "mesmo-arquivo", jaEnviados: [] });
  conferir("um arquivo inédito não é barrado por duplicidade", primeiro.fase !== "recusada" || primeiro.confianca !== 100);

  const repetido = await validar({ ...base, hash: "mesmo-arquivo", jaEnviados: ["mesmo-arquivo"] });
  conferir("o mesmo arquivo de novo é recusado", repetido.fase === "recusada");
  conferir("e a recusa diz por quê", Boolean(repetido.motivo));

  // O mesmo veredito para a mesma entrada: é o que permite ensaiar a demonstração.
  const outraVez = await validar({ ...base, hash: "mesmo-arquivo", jaEnviados: [] });
  conferir(
    "o veredito é estável para a mesma prova",
    outraVez.fase === primeiro.fase && outraVez.confianca === primeiro.confianca,
  );

  // Abaixo do limiar NUNCA aprova sozinho — é o corte de 80% do escopo.
  conferir(
    "nada abaixo do limiar é aprovado pela máquina",
    !(outraVez.confianca < LIMIAR_DE_CONFIANCA && outraVez.fase === "aprovada"),
  );

  // A trava diária: `m-campo-brasil` aceita 1 por dia.
  m.registrarProva(missao.id, { nome: "a.jpg", miniatura: "", hash: "h1" });
  m.decidirProva(m.atual.comprovacoes[0].id, {
    fase: "aprovada",
    aderencia: "sim",
    confianca: 90,
    leitura: "-",
    });
  const depois = podeEnviar(m.atual, missao, m.atual.agora);
  conferir("a trava diária barra o segundo envio do dia", !depois.pode);
  conferir("e o botão recebe a legenda do porquê", Boolean(depois.motivo), depois.motivo);

  // O ciclo fechado barra igual, e por outro motivo.
  m.avancarDias(30);
  const fechado = podeEnviar(m.atual, missao, m.atual.agora);
  conferir("ciclo encerrado barra o envio", !fechado.pode);
  conferir("com a legenda do ciclo", fechado.motivo?.includes("ciclo") === true, fechado.motivo);
}

/* ── Fecho ───────────────────────────────────────────────────────────────── */

console.log(`\n${portoes - falhas}/${portoes} portões passaram.`);
if (falhas > 0) {
  console.error(`${falhas} portão(ões) falharam.`);
  process.exit(1);
}
console.log("Motor de pontos: verde.");
