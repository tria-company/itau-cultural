# Onde as coisas estão

Escrito na madrugada de 22/08/2026, enquanto você dormia.

---

## Perfil Produtor — 26/08/2026

**Quem alimenta o produto**, que era a metade que o protótipo não mostrava.

O que existe hoje, e onde:

| | |
|---|---|
| Contrato | `src/dados/tipos-produtor.ts` — 11 pautas, união discriminada, `impedimentosDe` como função única |
| Armazém | `src/componentes/produtor-estado.ts` — chave `produtor.v1`, absorve `studio.v1` sem apagá-la |
| Semente | `src/dados/mock/seed-produtor.ts` — 16 registros, determinística, todos de entidades reais |
| Painel | `/studio` — a tela P1, que nunca existiu |
| Fichas | agenda (8 atos, 8 rotas), play, cast, museu, cursos, editorial, curadoria, programa, editais, espaços, mídia |
| Telas novas | `/studio` (P1), `/studio/comercial` (P7, que `tipos-acesso.ts:643` já referenciava), `/studio/natureza`, `/studio/catalogos` |
| Primitivas | `base/`: ficha em atos, folha, seletor de catálogo, campo com proposta, ato de declarar, ficha de acessibilidade, impedimentos, visibilidade, campo de imagem, seletores de tempo, prévia, editor de blocos, barra de ação |
| Folha | `src/estilos/studio-produtor.css` — prefixo `.prod-*` (o nome `produtor.css` já é da página pública `/produtor/[slug]`) |
| Portão | `npm run verificar-produtor` · 36 verdes · `--provar-ausencias` com 5 defeitos |

**As três decisões que mudaram o produto:**

1. **D-67 invertido para o Studio.** Ele é mobile-first e abre no telefone; as outras cinco
   superfícies de bastidor continuam web-only, cada uma com o próprio layout. Os dois
   portões que afirmavam a regra antiga foram REESCRITOS e passaram a medir mais — antes,
   uma afirmação; agora, duas.

2. **Publicação direta.** O produtor publica e o registro vai ao ar. A Moderação virou
   fiscalização posterior, e a fila declara isso na própria tela.

3. **A Organização foi separada.** Sete das dez telas dela descreviam ações que ela não fará
   — espaço, mídia, programa, formação, editais, lote, alcance — e passaram ao Produtor.
   Ficam com ela a ficha da instituição, a verificação, a equipe e as alçadas. Cada tela
   declara de que lado ficou. **A forma nova da Organização não está desenhada.**

**O que a demonstração NÃO sustenta, e diz que não sustenta:** não há banco, não há
autenticação e não há usuários. O que o produtor publica vive no `localStorage` deste
navegador e aparece na vitrine numa seção que declara isso. O número de «pessoas que serão
avisadas» é autorado e determinístico.

---

## O que está pronto

**Fase 1 — Fundação: concluída e verificada.**

O protótipo existe, roda e faz export estático. Tem a identidade do Itaú Cultural aplicada,
alterna ao vivo entre visão de app e visão web, e lê um grafo de verdade.

- Next.js + TypeScript + Tailwind, `npm run build` verde, 1.720 páginas exportadas
- 18 rotas navegáveis, 5 abas, mapa como lente e não como aba
- Paleta do manual, tipografia com as substitutas que o próprio manual prevê, grafismo `\`
- **Cada linguagem artística tem cor fixa vinda do dado**, não do CSS — a mesma cor no
  cartão, no mapa e no indicador
- A moldura de celular contém a barra de abas: medido em 370px de barra dentro de uma
  janela de 1440px

**O grafo: 7.810 entidades em 19 classes, 66.563 arestas.**

| | |
|---|---|
| ocorrência | 2.425 |
| conteúdo | 1.805 |
| pessoa | 575 |
| mídia | 529 |
| termo | 481 |
| território | 359 |
| evento | 300 |
| temporada | 287 |
| instituição | 246 |
| obra | 239 |
| coletivo | 217 |
| espaço | 113 |

Procedência em tudo: 4.826 `ic` (todas com fonte), 2.937 `derivado`, 47 `autorado`.
Nenhuma aresta sem motivo. Coordenadas em 472 lugares, todas marcadas como derivadas.

**Varredura da Enciclopédia: concluída — 110.390 entidades.**
43.614 pessoas · 37.401 obras · 20.270 eventos · 7.456 instituições · 1.168 grupos · 481
termos. O protótipo usa a amostra curada de 1.766, dimensionada para os cinco cenários, mas
a base inteira está em disco e o gerador aceita apontar para ela sem mudar código.

---

**Fase 2 — Descoberta: concluída e verificada.**

67 portões passando, zero erros de console em 26 navegações. O que existe hoje, navegável:

- **Descobrir** — 12 cartões, 11 classes distintas, nenhum par adjacente da mesma classe,
  cada um com o selo do motivo pelo qual apareceu
- **Por que isto apareceu** — o caminho no grafo passo a passo, com 188px de folga dentro
  da moldura. Remover um critério recalcula ao vivo e a cadeia *cresce* de 2 para 3 nós
- **Trilha do rap ao teatro documentário** — 3 passos, as 3 arestas autoradas rotuladas
- **Página do artista e do evento** — a ponte provada por clique real com hit-test
- **Meu Repertório** — Maria atravessou 8 linguagens e tem 4 a um passo; Carlos, 5 e 8;
  Joana, 10 e 9

O feed da Maria e o do Carlos compartilham **1 item em 12**. A personalização funciona.

**Duas melhorias que fiz por conta própria:**

*Modo comentado — feito em 22/08 e RETIRADO em 23/08.* As telas estavam se explicando em
vez de serem, então as anotações de spec viraram um interruptor no canto: produto limpo por
padrão, raciocínio a um toque. No dia seguinte você pediu para tirar — o interruptor
competia com o conteúdo e o protótipo precisa parecer produto, não spec anotada. As
anotações saíram junto; o que sustenta a proposta (selo de motivo, rótulo de procedência,
declaração de ausência com denominador) nunca esteve lá dentro e continua na tela.

*Cobertura de imagem de 22% para 62%.* Regenerei o grafo com as 2.382 capas baixadas. O
feed passou a ler como produto — fotografia real com crédito, misturada com as capas na cor
da linguagem.

**Dois bugs reais encontrados, ambos do mesmo tipo: código que acertava por coincidência.**
Um era meu, no normalizador. O outro decidia "declarado ausente" versus "não declarado"
olhando o prefixo do id — funcionava porque alguém tinha contado que os 100 eventos do CMS
declaram. Para os 20 registros sem o campo, teria afirmado em nome do Itaú Cultural que
alguém preencheu um formulário dizendo "não", quando ninguém preencheu nada.

## Fase 3 — em execução

Sete planos em três ondas. Quatro executores rodando em paralelo agora: Acontece, Salvos e
alertas, Mapa, e Buscar. Depois vêm Modo Cidade e busca em linguagem natural, e por último
a verificação.

**O número que o planejador achou e que muda o peso da proposta:** Sergipe e Tocantins não
existem no grafo. A tabela de centroides conhece as 27 unidades da federação; o acervo tem
25. Somado a São Paulo e Rio concentrando **59% de 773 entidades em dois estados de 27**, o
mapa de desertos culturais deixa de ser um recurso e vira o diagnóstico que justifica a
plataforma existir.

---

## Três decisões que tomei sozinha, e você pode reverter

**1. Não autoramos arestas de elenco.** O grafo revelou que eventos com data e eventos com
artista nunca se cruzam — dos 129 eventos datados, nenhum tem artista vinculado. A saída
fácil seria autorar "fulano atuou na montagem X". Não fiz: autorar a ponte cultural
rap→slam é uma afirmação editorial, rotulada e defensável; autorar elenco seria uma
**afirmação factual falsa sobre pessoas reais**. Numa proposta cujo argumento é procedência
honesta, essa linha não se cruza. A ponte se prova em outro par, com papel real.

**2. Quatro linguagens da Enciclopédia foram promovidas, não mapeadas.** `Arte`, `Gestão
cultural`, `Rádio` e `TV` não existem nas 29 do CMS. Mapear `Rádio → audiovisual` seria
fabricar classificação. Viraram linguagens próprias, marcadas com fonte na Enciclopédia.
São 33 linguagens, não 29.

**3. Ausência é declarada, não escondida.** Nenhuma ocorrência tem espaço na fonte. Em vez
de derivar "Itaú Cultural, São Paulo" da URL, as telas dizem que o acervo não publica o
espaço daquela sessão.

---

## Duas coisas que precisam de você

**A expansão do bastidor continua em aberto.** Você achou 36 telas pouco, e tinha razão:
são 29 para o público e 7 para produtor, curador e gestão somados. Um dimensionamento
honesto seria Studio ~11, Redação ~7, Observatório ~8 — total perto de 55. Não decidi
sozinha porque muda o roadmap.

**O Cenário 2 — eu decidi para não travar, e você reverte se discordar.** Território e data
não se cruzam: nenhum evento do acervo tem data futura e lugar ao mesmo tempo. Das três
saídas, escolhi a terceira: o Modo Cidade responde *"o que existe culturalmente neste
território"* em vez de *"o que acontece nesta semana"*. Para quem nunca esteve em Belém é a
pergunta mais útil de qualquer forma, e é a única que o acervo responde com verdade.

A tela declara o enquadramento e aponta que programação futura é o que entra quando
produtores publicarem — o que transforma a limitação em demonstração do Studio, que a fase 4
constrói. Não fabricamos datas, nem futuras nem derivadas com rótulo: inventar programação
é a única coisa que destruiria o argumento central da proposta.

---

## Um problema de máquina que custou tempo real

**O projeto está no iCloud Drive com o disco a 97%.** No meio da execução, o macOS despejou
arquivos de entrada: `stat` mostrava o tamanho, a leitura devolvia zero byte. Atingiu dados
de origem, 2.903 arquivos de `node_modules` e objetos do git. Recuperei tudo — 0 arquivos
ilegíveis agora — e liberei 9 GB.

**Recomendação: tirar o projeto do iCloud, ou desligar "Otimizar armazenamento do Mac".**
Isso causou perda de dados de verdade e não dá para resolver de dentro do código.

Também deixei o `caffeinate` ligado. A primeira tentativa de planejar a fase 1 morreu porque
o Mac dormiu no meio.

---

## Como ver o que existe

```bash
npm run dev
```

Depois abra `http://localhost:3000` — cai em `/descobrir`. O par de botões no canto
inferior direito alterna App e Web.

Os documentos: [PRD](docs/PRD.md) · [as 37 telas](docs/telas.md) ·
[as 86 funcionalidades](docs/funcionalidades.md) ·
[a varredura](dados/inventario/mapa-conteudo.md) · [o roadmap](.planning/ROADMAP.md)
