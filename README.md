# Agenda Cultural BR

Protótipo navegável da proposta ao **RFP da Fundação Itaú / Itaú Cultural** para construir a
principal infraestrutura digital de descoberta da cultura brasileira.

Não é uma agenda com mapa. É um sistema que transforma o acervo cultural brasileiro em um
grafo de sentido e usa esse grafo para levar cada pessoa a uma experiência que ela não
sabia que procurava.

---

## Rodar

```bash
npm install
npm run dev
```

Abre em `http://localhost:3000` e cai em `/descobrir`.

Para o artefato estático, que é o que vai ao ar:

```bash
npm run build     # gera out/, export estático, 2.463 páginas
npx http-server out -p 3000
```

**Um controle no canto inferior direito.** O par **App / Web** alterna as duas visões ao
vivo. O tema acompanha o sistema operacional — claro ou escuro, sem botão.

**Comece por `/roteiro`** (visão Web). É a tela feita para conduzir uma apresentação: os
cenários do RFP, cada um com um botão que põe a visão certa, semeia a persona e leva à
primeira tela.

---

## O perfil Produtor (2026-08)

**Quem alimenta o produto.** Até aqui o protótipo mostrava o que o público vê e o que o
acervo sustenta. O perfil Produtor mostra a outra metade: **como o conteúdo chega lá.**

```
/entrar  →  «Perfis de demonstração»  →  Produtor  →  /studio
```

**Onze pautas, um Studio.** Agenda, Play, Cast, Museu, Cursos, Editorial, Curadoria,
Programa, Editais, Espaços e Mídia — cada uma com ficha própria, e todas com os mesmos três
atos: identidade, acessibilidade e publicação.

**Publicação direta, fiscalização posterior.** O produtor publica e o registro vai ao ar; a
Moderação passou a decidir sobre o que já está público — por amostragem, duplicata e
denúncia. Suspender e vetar continuam cobrando motivo escrito, e agora isso pesa mais:
suspender tira do ar algo que o público já viu.

**O Studio é mobile-first**, e é a única exceção a D-67: quem produz cultura no Brasil
produz do telefone. Moderação, Redação, Observatório e Administração continuam sendo
superfícies de desktop, e continuam declarando isso. Ver `docs/ARQUITETURA.md` §2.

**Sem banco.** Tudo vive no `localStorage`, sob a chave `produtor.v1`, com semente
determinística e um botão de **reiniciar demonstração** — uma apresentação roda duas vezes.
O que o produtor publica aparece na vitrine numa seção que DECLARA o que é: «publicado por
você nesta demonstração — não está no acervo». O artefato é estático e não há servidor para
receber publicação; dizer isso é melhor do que fingir.

**O que ele NÃO faz:** reescrever verbete de artista real na Enciclopédia. Ali ele
referencia, vincula com papel e propõe — e quem decide é a Moderação. É regra ética, não
limitação técnica.

| Portão | O que mede |
|---|---|
| `npm run verificar-produtor` | D-67 nas duas metades · nenhum `fixed` na moldura · a dobra · a dupla trava de publicar · a colisão da grade forçada · cada pauta chegando à sua vitrine · determinismo e reinício · console limpo |
| `npm run verificar-produtor -- --provar-ausencias` | injeta cinco defeitos, um a um, reconstrói e confere que cada gate fica VERMELHO. Custa um `next build` por defeito |
| `npm run testar-semente-produtor` | a semente é byte a byte igual em duas leituras, cobre as onze pautas, e nada semeado como «publicado» tem impedimento |

---

## O que este projeto é, em números

| | |
|---|---|
| Telas | 37 no inventário, 29 construídas nas fases 1–5 |
| Páginas exportadas | 2.463 |
| Entidades no grafo | 7.810 em 19 classes |
| Arestas | 66.563, todas com motivo legível |
| Portões de verificação | mais de 500 verdes em seis suítes |
| Requisições externas em execução | **zero** |
| Acervo coletado | 2.534 do site + 110.390 da Enciclopédia |

---

## A tese

O Itaú Cultural **já tem** um grafo cultural, mantido há décadas: a Enciclopédia, com
`/pessoas/`, `/obras/`, `/grupos/`, `/instituicoes/`, `/eventos/` e `/termos/`, mais de 100
mil registros, território e datas estruturados.

E **já tem** uma agenda, no CMS do site.

O que não existe é **conexão entre as duas**. A Enciclopédia sabe quem é o artista, mas não
sabe que ele se apresenta sábado. O site sabe do evento de sábado, mas não sabe quem é o
artista.

**O produto é essa ponte.** O fato de as duas metades já existirem é o que torna a escala
nacional viável em prazo real, em vez de aspiração.

---

## A disciplina que atravessa tudo

**Ausência é declarada, com denominador. Nunca escondida, nunca preenchida com valor
plausível.**

Exemplos que estão na tela, não em nota de rodapé:

- *"0 de 300 eventos declaram ingresso"* — por isso gratuidade não recorta
- *"2.425 de 2.425 ocorrências sem espaço declarado"*
- *"9 eventos têm sessão futura, 158 têm território, interseção 0"*
- *"48 dos 158 eventos situados têm coordenada fora do Brasil"*
- *"a ausência é do registro, não do palco — alguém subiu, e quem foi é o que a fonte não
  publica"*

Toda entidade carrega `procedencia`: `ic` (veio do acervo), `derivado` (inferido
deterministicamente) ou `autorado` (escrito por nós). O Observatório mostra a distribuição
como tela de primeira classe — **4.826 `ic`, 2.937 `derivado`, 47 `autorado`** — e revela
algo que só o painel expõe: nas entidades, 61,8% vêm do acervo; nas **ligações**, só 22,4%.
O acervo deu as coisas; a maior parte das conexões é leitura nossa.

**O que nunca foi fabricado:** nenhuma data futura, nenhuma aresta de elenco. Autorar uma
ponte cultural entre dois conceitos é afirmação editorial, rotulada e defensável. Autorar
"fulano atuou na montagem X" seria afirmação factual falsa sobre pessoas reais.

---

## Mapa do repositório

```
src/
  app/            31 rotas — (app) é o produto, (bastidor) é Studio/Redação/Observatório
  componentes/    41 componentes; um serve as duas visões, nunca há irmão "Web"
  dados/          29 módulos — grafo, travessia, índice, e um por superfície
  estilos/        21 folhas, todas importadas de globals.css (bundle único)
scripts/
  gerar-grafo.mjs      transforma dados/ em src/dados/gerado/
  verificar-fase*.mjs  as quatro suítes que dirigem Chrome sobre o out/
  verificar-ds.mjs     regras estruturais do design system (estática)
  verificar-tema.mjs   contraste medido nos dois temas (contra next dev)
  navegador.mjs        cliente CDP compartilhado pelas suítes
dados/
  bruto/          o que foi coletado, sem tratamento
  normalizado/    2.534 entidades do CMS no formato do grafo
  amostra/        1.766 entidades da Enciclopédia, saneadas
  taxonomia/      vocabulário de linguagens e temas
  imagens/        2.382 capas locais + índice de procedência
docs/             PRD, inventário de telas, funcionalidades, arquitetura
.planning/        o histórico completo: 28 planos, 28 relatórios, todas as decisões
```

---

## Documentação

| Documento | Para quê |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | A proposta: visão, ontologia, cenários, métricas, roadmap |
| [`docs/TELAS-DETALHADO.md`](docs/TELAS-DETALHADO.md) | Cada rota, seus dados, seus contratos e o que declara ausente |
| [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) | Como funciona por dentro, e o que não mexer |
| [`docs/telas.md`](docs/telas.md) | O inventário das 37 telas, com o conteúdo planejado de cada |
| [`docs/funcionalidades.md`](docs/funcionalidades.md) | As 86 funcionalidades numeradas, 57 no MVP |
| [`dados/inventario/mapa-conteudo.md`](dados/inventario/mapa-conteudo.md) | A varredura do acervo do Itaú Cultural |
| [`ESTADO.md`](ESTADO.md) | Onde as coisas pararam e o que espera decisão |
| [`.planning/`](.planning/) | Por que cada decisão foi tomada, plano a plano |

**Para entender *por que* algo é como é, leia os `SUMMARY.md` em `.planning/phases/`.** Eles
registram o que foi medido, o que falhou e o que se decidiu — inclusive erros e correções.

---

## O que fica fora deste repositório

Três PDFs de referência não foram publicados: o edital do RFP e os dois manuais de marca
(Itaú Cultural e Fundação Itaú). São documentos de terceiros num processo em andamento.
Quem assumir o projeto precisa recebê-los por canal privado — a paleta e a tipografia já
estão extraídas em `src/app/globals.css` e documentadas.

---

## Escopo

Isto é **protótipo de front-end**. Não há backend, banco, CMS, API real, IA em produção,
analytics, observabilidade nem infraestrutura — tudo isso é a fase seguinte, com o time de
produto do cliente.

Os dados são mockados, mas **no formato do grafo**, e é isso que permite as telas
demonstrarem o comportamento que o RFP avalia. O JSON gerado é, na prática, o contrato de
API para quem construir o backend.
