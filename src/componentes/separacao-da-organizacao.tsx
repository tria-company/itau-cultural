/**
 * separacao-da-organizacao.tsx, o que passou ao Produtor, e o que fica.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A ORGANIZAÇÃO DESCREVIA AÇÕES QUE ELA NÃO FARÁ.
 *
 * As dez telas de `/studio/*` que a S6 construiu punham na instituição o trabalho de quem
 * PRODUZ: cadastrar o espaço onde o próprio evento acontece, subir a mídia do próprio
 * episódio, montar o programa da própria temporada, abrir a formação, publicar o edital,
 * importar o lote e medir o alcance. Nada disso é ação de uma instituição, é ação de quem
 * faz a programação, todo dia.
 *
 * SETE PASSARAM AO PRODUTOR, e cada uma virou ficha:
 *   · espaço e acessibilidade (142)  → /studio/espacos/
 *   · mídia com crédito (147, 148)   → /studio/midia/
 *   · programa e formação (143–146)  → /studio/programa/ e /studio/formacao/
 *   · editais (149)                  → /studio/editais/
 *   · lote e chave (150, 151)        → /studio/organizacao/integracao/
 *   · alcance e conformidade (152, 168)
 *
 * TRÊS FICAM COM ELA: a ficha da instituição e a verificação (141), a equipe (139) e as
 * alçadas e a sucessão (140). São as três que respondem à pergunta «quem é esta instituição
 * e quem fala por ela», e essa pergunta não é de quem produz.
 *
 * A FORMA NOVA DA ORGANIZAÇÃO NÃO ESTÁ DESENHADA, e este bloco não a inventa. Ele declara a
 * separação; desenhar a superfície dela é trabalho de outra sessão.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * COMPONENTE DE SERVIDOR, sem estado: ele é montado dentro de telas que já são de cliente e
 * viaja no mesmo pacote. O que ele NÃO arrasta junto é dado.
 */

export type LadoDaSeparacao = "passou-ao-produtor" | "fica-com-a-organizacao";

const FRASE: Record<LadoDaSeparacao, { titulo: string; corpo: string }> = {
  "passou-ao-produtor": {
    titulo: "Esta tela passou ao Produtor",
    corpo:
      "Ela descrevia uma ação que a Organização não fará: quem cadastra o espaço, sobe a " +
      "mídia, monta o programa, abre a formação, publica o edital e importa o lote é quem " +
      "produz a programação, todo dia, e não a instituição uma vez por ano. A ficha nova " +
      "mora no Studio, sob a mesma navegação de pautas.",
  },
  "fica-com-a-organizacao": {
    titulo: "Esta tela fica com a Organização",
    corpo:
      "Ela responde «quem é esta instituição e quem fala por ela», ficha, verificação, " +
      "equipe, alçadas e sucessão. Essa pergunta não é de quem produz. A forma nova da " +
      "Organização será desenhada à parte; até lá, a tela continua aqui e continua " +
      "funcionando.",
  },
};

export function SeparacaoDaOrganizacao({
  lado,
  /** Para onde a ficha nova foi, quando ela existe. */
  rotaNova,
  rotuloDaRotaNova,
}: {
  lado: LadoDaSeparacao;
  rotaNova?: string;
  rotuloDaRotaNova?: string;
}) {
  const f = FRASE[lado];
  return (
    <div className="fisc-declaracao" data-separacao={lado}>
      <p>
        <strong>{f.titulo}.</strong> {f.corpo}
      </p>
      {rotaNova ? (
        <p>
          <a className="prod-botao" data-porte="curto" href={rotaNova}>
            {rotuloDaRotaNova ?? "Abrir a ficha nova"} ▸
          </a>
        </p>
      ) : null}
    </div>
  );
}
