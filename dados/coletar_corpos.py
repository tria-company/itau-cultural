#!/usr/bin/env python3
"""coletar_corpos.py — o corpo das materias, pela URL que o grafo ja conhece.

POR QUE ELE EXISTE. `coletar.py` descobre rotas pelo SITEMAP, e o sitemap do site
publica 56 rotas de conteudo. O grafo tem 1.851, cada uma com o campo `fonte`
preenchido: a URL existe, o indice e que nao a lista. Este script ignora o sitemap
e vai direto nas URLs que ja estao no grafo.

MESMO TRANSPORTE de `coletar.py`: o endpoint /_next/data/<buildId>/<rota>.json, que
e a mesma fonte que a propria pagina consome. Nada de raspar HTML renderizado.

EDUCADO POR CONSTRUCAO: uma requisicao por vez, pausa entre elas, e pula o que ja
esta em disco. Rodar de novo continua de onde parou em vez de refazer tudo.
"""
import json
import subprocess
import sys
import time
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
BRUTO = RAIZ / "dados" / "bruto" / "materias"
GRAFO = RAIZ / "src" / "dados" / "gerado" / "entidades.json"
BASE = "https://www.itaucultural.org.br"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36"
PAUSA = 0.35


def buscar(url):
    r = subprocess.run(
        ["curl", "-sS", "-L", "-m", "30", "-A", UA, "-w", "\n%{http_code}", url],
        capture_output=True, text=True,
    )
    if r.returncode != 0:
        return None, f"curl rc={r.returncode}"
    corpo, _, codigo = r.stdout.rpartition("\n")
    if codigo.strip() != "200":
        return None, f"http {codigo.strip()}"
    return corpo, None


def build_id():
    html, err = buscar(BASE + "/")
    if err:
        sys.exit(f"nao consegui abrir a home: {err}")
    marca = '"buildId":"'
    i = html.find(marca)
    if i == -1:
        sys.exit("buildId nao encontrado na home")
    j = html.find('"', i + len(marca))
    return html[i + len(marca):j]


def main():
    BRUTO.mkdir(parents=True, exist_ok=True)
    ent = json.loads(GRAFO.read_text())
    ent = ent.get("entidades", ent) if isinstance(ent, dict) else ent
    alvos = [
        (e["slug"], e["fonte"])
        for e in ent
        # `midia` ENTROU (27.08). A primeira passada filtrou so `conteudo` e `publicacao`,
        # e as 529 midias — que sao justamente as do Play e do Cast — ficaram de fora: 12
        # tinham arquivo por coincidencia de slug. E delas que sai o youtubeId do player.
        if e.get("classe") in ("conteudo", "publicacao", "midia", "formacao") and e.get("fonte")
    ]
    # Um slug pode repetir entre classes; a primeira ocorrencia basta.
    vistos, fila = set(), []
    for slug, fonte in alvos:
        if slug in vistos:
            continue
        vistos.add(slug)
        if (BRUTO / f"{slug}.json").exists():
            continue
        fila.append((slug, fonte))

    bid = build_id()
    print(f"buildId={bid} · {len(fila)} a coletar · {len(vistos) - len(fila)} ja em disco")

    ok = falhas = 0
    for i, (slug, fonte) in enumerate(fila, 1):
        # A ROTA E O SLUG NA RAIZ, e nao a URL do campo `fonte`.
        #
        # `fonte` guarda o endereco com a secao — /noticias/<slug>, /rumos/<slug> — e essa
        # forma devolve **500 no proprio site**: as materias moram na raiz. Medido nos tres
        # primeiros slugs da fila: com secao, 500; sem, 200. O campo `fonte` continua certo
        # como PROCEDENCIA (foi de la que o registro veio); ele so nao e a rota que o
        # endpoint de dados aceita hoje.
        obj, err = buscar(f"{BASE}/_next/data/{bid}/{slug}.json")
        if obj is None:
            falhas += 1
        else:
            try:
                json.loads(obj)
                (BRUTO / f"{slug}.json").write_text(obj)
                ok += 1
            except json.JSONDecodeError:
                falhas += 1
        if i % 50 == 0:
            print(f"  {i}/{len(fila)} · ok={ok} falhas={falhas}", flush=True)
        time.sleep(PAUSA)

    print(f"FIM. ok={ok} falhas={falhas} · em disco agora: {len(list(BRUTO.glob('*.json')))}")


if __name__ == "__main__":
    main()
