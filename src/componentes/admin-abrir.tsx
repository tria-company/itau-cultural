"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { usePoderDeAdmin } from "@/componentes/admin-estado";
import { marcarAberturaDaFicha, useProdutor } from "@/componentes/produtor-estado";
import {
  NOME_DA_PAUTA,
  ROTA_DA_FICHA,
  esquecerAlvoParaEditar,
  lerAlvoParaEditar,
  type AlvoParaEditar,
} from "@/dados/admin-destinos";
import type { ContextoDoProdutor, Registro } from "@/dados/tipos-produtor";

/**
 * admin-abrir.tsx, a ponte entre o item do acervo e a ficha do Studio.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ELA EXISTE PORQUE AS DUAS COISAS NÃO SÃO A MESMA. O administrador está olhando uma
 * ENTIDADE DO ACERVO, vinda do grafo; o Studio edita um REGISTRO DO PRODUTOR, guardado em
 * `produtor.v1`. Não há chave em comum entre as duas formas. Então esta tela faz uma de duas
 * coisas, e diz qual fez:
 *
 *   1. ACHOU uma ficha daquela pauta com o mesmo título: abre aquela;
 *   2. NÃO ACHOU: cria uma ficha nova já preenchida com o título, o resumo e as linguagens
 *      do item, e avisa que criou.
 *
 * O AVISO DE ADOÇÃO NÃO É ENFEITE. Criar registro é gravar no armazém do produtor, e um
 * gesto do administrador que aparece calado na lista de outro perfil é o tipo de coisa que
 * ninguém entende três telas depois.
 *
 * ELA NÃO TOCA EM NENHUM ARQUIVO DO PRODUTOR. Usa `useProdutor`, `marcarAberturaDaFicha` e
 * `ROTA_DA_FICHA`, que já são públicos, e escreve pelas funções deles.
 *
 * DUAS ARMADILHAS, as duas medidas antes de escrever:
 *
 * A SEMENTE TEM QUE SER A DE VERDADE. `hidratar()` reatribui as variáveis de módulo da
 * semente e do contexto ANTES do retorno antecipado, e `reiniciar()` lê essas variáveis.
 * Passar semente vazia aqui faria o «Reiniciar a demonstração» do Studio inteiro restaurar o
 * vazio. Por isso a página de servidor passa `registrosSemeados()` e `CONTEXTO_DO_PRODUTOR`
 * de verdade.
 *
 * ESPERAR `pronto` ANTES DE AGIR. `escolher` e `criar` desistem em silêncio enquanto o
 * armazém não leu o navegador, e a leitura só acontece num efeito. Agir antes perde o gesto
 * sem erro nenhum na tela.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Sem acento e sem caixa, para casar «Bienal» com «bienal». */
function simples(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

type Situacao =
  | { fase: "lendo" }
  | { fase: "sem-alvo" }
  | { fase: "abrindo"; alvo: AlvoParaEditar; adotou: boolean };

export function AdminAbrir({
  semente,
  contexto,
  carimbo,
}: {
  semente: Registro[];
  contexto: ContextoDoProdutor;
  carimbo: string;
}) {
  const router = useRouter();
  const poder = usePoderDeAdmin(carimbo);
  const armazem = useProdutor(semente, contexto);
  const [situacao, definirSituacao] = useState<Situacao>({ fase: "lendo" });
  const jaAgiu = useRef(false);
  /**
   * O ARMAZÉM POR REFERÊNCIA, e não por dependência.
   *
   * `useProdutor` devolve um objeto novo a cada render. Pô-lo na lista de dependências fazia
   * o efeito rodar de novo a cada quadro, e a limpeza dele matava o relógio da navegação
   * antes dos 900 ms: a ponte adotava a ficha, dizia que tinha adotado, e ficava parada.
   * Medido: a sonda via `/admin/abrir/` para sempre. A referência dá o valor mais novo sem
   * reexecutar nada.
   */
  const armazemAgora = useRef(armazem);
  armazemAgora.current = armazem;

  useEffect(() => {
    if (jaAgiu.current) return;
    if (!armazem.pronto || !poder.pronto) return;
    const loja = armazemAgora.current;

    const alvo = lerAlvoParaEditar();
    if (!alvo) {
      definirSituacao({ fase: "sem-alvo" });
      jaAgiu.current = true;
      return;
    }

    jaAgiu.current = true;
    esquecerAlvoParaEditar();

    // 1. Já existe ficha daquela pauta com este título?
    const procurado = simples(alvo.titulo);
    const achado = loja.registros.find(
      (r) => r.pauta === alvo.pauta && simples(r.titulo) === procurado,
    );

    if (achado) {
      loja.escolher(achado.id);
      definirSituacao({ fase: "abrindo", alvo, adotou: false });
    } else {
      // 2. Não existe: adota, criando a ficha já preenchida com o que o item tem.
      const id = loja.criar(alvo.pauta);
      loja.alterarId(id, {
        titulo: alvo.titulo,
        resumo: alvo.resumo,
        linguagens: alvo.linguagens,
      });
      definirSituacao({ fase: "abrindo", alvo, adotou: true });
    }

    // A ficha, e não o painel de início da pauta: é a bandeira que o casco consome.
    marcarAberturaDaFicha();
    // Um respiro para a tela declarar o que fez antes de sair dela. SEM LIMPEZA de
    // propósito: é um salto único, guardado por `jaAgiu`, e uma limpeza aqui seria
    // exatamente o que impedia a navegação de acontecer.
    window.setTimeout(() => router.replace(ROTA_DA_FICHA[alvo.pauta]), 900);
  }, [armazem.pronto, poder.pronto, router]);

  if (!poder.pronto) return null;

  if (!poder.ehAdmin) {
    return (
      <p className="adm-aviso" data-nao-e-admin>
        Esta área é da administração. Troque o perfil em <Link href="/meu/">Meu</Link>.
      </p>
    );
  }

  if (situacao.fase === "sem-alvo") {
    return (
      <div className="adm-ponte" data-ponte="sem-alvo">
        <h2 className="adm-titulo">Nada para abrir</h2>
        <p className="adm-vazio">
          Esta tela é a passagem para a ficha do Studio, e ela precisa de um item. Volte para
          a lista e use o menu de ações do item que você quer editar.
        </p>
        <Link href="/admin/" className="adm-botao adm-botao-forte">
          Voltar para a administração
        </Link>
      </div>
    );
  }

  if (situacao.fase === "abrindo") {
    const { alvo, adotou } = situacao;
    return (
      <div className="adm-ponte" data-ponte={adotou ? "adotou" : "achou"}>
        <p className="adm-ponte-passo">Abrindo no Studio</p>
        <h2 className="adm-ponte-titulo">{alvo.titulo}</h2>
        <p className="adm-ponte-onde">
          Ficha de <strong>{NOME_DA_PAUTA[alvo.pauta]}</strong>
        </p>
        {adotou ? (
          <p className="adm-ponte-aviso" data-adocao>
            Este item vinha do acervo e ainda não tinha ficha no Studio. Criamos uma a partir
            dele, com o título, o resumo e as linguagens já preenchidos. Ela passa a existir
            no Studio como qualquer outra.
          </p>
        ) : (
          <p className="adm-ponte-aviso">
            Já havia uma ficha com este título nesta pauta. Abrindo aquela, para não criar
            uma segunda.
          </p>
        )}
        <Link href={alvo.volta} className="adm-botao">
          Cancelar e voltar
        </Link>
      </div>
    );
  }

  return (
    <p className="adm-vazio" data-ponte="lendo">
      Lendo o que está gravado neste navegador…
    </p>
  );
}
