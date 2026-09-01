"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

/**
 * criar-conta.tsx — o cadastro, com quatro campos e nenhum a mais.
 *
 * QUATRO DADOS, E A LISTA É FECHADA: e-mail, CPF, telefone e senha — esta última em dois
 * campos, porque senha é o único campo do formulário que a pessoa não vê enquanto digita,
 * e errar nele custa uma recuperação de conta. Nome, data de nascimento, gênero e endereço
 * ficam de fora: cada campo a mais é uma pessoa a menos que termina, e nenhum dos quatro
 * que ficaram é dispensável — o e-mail identifica, o CPF liga a conta a benefício e a
 * edital público, o telefone é o canal de alerta de sessão, e a senha fecha.
 *
 * A VALIDAÇÃO É DE FORMA, NÃO DE VERDADE. O protótipo confere que o CPF tem 11 dígitos e
 * dígito verificador válido — a conta de módulo 11, que é determinística e roda no
 * cliente —, mas não consulta base nenhuma. É a mesma disciplina do resto da obra: o que
 * dá para provar sem servidor a tela prova; o que não dá, ela não finge.
 *
 * O BOTÃO SÓ HABILITA COM OS QUATRO VÁLIDOS. Formulário que deixa enviar para depois
 * dizer o que faltou é o defeito que a revisão de fluxo existe para pegar.
 */

/** Dígito verificador de CPF, por módulo 11. Determinístico e conferível a olho. */
function cpfValido(bruto: string): boolean {
  const d = bruto.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const digito = (ate: number) => {
    let soma = 0;
    for (let i = 0; i < ate; i += 1) soma += Number(d[i]) * (ate + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}

/** "12345678901" → "123.456.789-01". A máscara é de leitura; o valor guardado é o dígito. */
function mascararCpf(bruto: string): string {
  const d = bruto.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

/** "11987654321" → "(11) 98765-4321". Aceita fixo de 10 dígitos e celular de 11. */
function mascararTelefone(bruto: string): string {
  const d = bruto.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  const corte = d.length > 10 ? 7 : 6;
  return `(${d.slice(0, 2)}) ${d.slice(2, corte)}-${d.slice(corte)}`;
}

const MINIMO_DA_SENHA = 8;

export function CriarConta() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [tocado, setTocado] = useState<Record<string, boolean>>({});
  const [enviando, setEnviando] = useState(false);

  const erros = useMemo(() => {
    const digitosTelefone = telefone.replace(/\D/g, "").length;
    return {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? null : "Escreva um e-mail válido.",
      cpf: cpfValido(cpf) ? null : "CPF inválido — confira os 11 dígitos.",
      telefone:
        digitosTelefone === 10 || digitosTelefone === 11
          ? null
          : "Telefone com DDD, 10 ou 11 dígitos.",
      senha:
        senha.length >= MINIMO_DA_SENHA
          ? null
          : `A senha precisa de ao menos ${MINIMO_DA_SENHA} caracteres.`,
      confirmacao: confirmacao === senha ? null : "As duas senhas não são iguais.",
    };
  }, [email, cpf, telefone, senha, confirmacao]);

  const valido = Object.values(erros).every((e) => e === null);

  const enviar = useCallback(() => {
    if (!valido) return;
    setEnviando(true);
    router.push("/descobrir/");
  }, [valido, router]);

  const campo = (
    id: "email" | "cpf" | "telefone" | "senha" | "confirmacao",
    rotulo: string,
    entrada: React.ReactNode,
  ) => (
    <label className="entrar-campo" data-erro={tocado[id] && erros[id] ? "sim" : "nao"}>
      <span className="entrar-campo-rotulo">{rotulo}</span>
      {entrada}
      {tocado[id] && erros[id] ? (
        <span className="entrar-erro" role="alert">
          {erros[id]}
        </span>
      ) : null}
    </label>
  );

  const marcar = (id: string) => () => setTocado((t) => ({ ...t, [id]: true }));

  return (
    <div className="entrar">
      {/* MOTION DE FUNDO, ARQUIVO LOCAL. Nada de `<iframe>` de terceiro: o README declara
          «requisições externas em execução: zero», e a entrada não pode ser a tela que
          quebra a afirmação. O `poster` é a capa do acervo — ela aparece enquanto o vídeo
          carrega e fica no lugar dele em `prefers-reduced-motion`. */}
      <video
        className="entrar-fundo"
        src="/entrada/motion.mp4"
        poster="/hub/heroi.jpg"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        tabIndex={-1}
      />
      <div className="entrar-veu" />

      <div className="entrar-painel">
        <header className="entrar-marca">
          <img
            src="/marca/itau-cultural-negativo.svg"
            alt="Itaú Cultural"
            className="entrar-logo"
          />
        </header>

        <h1 className="entrar-titulo">Criar conta</h1>

        <form
          className="entrar-forma"
          onSubmit={(e) => {
            e.preventDefault();
            setTocado({ email: true, cpf: true, telefone: true, senha: true, confirmacao: true });
            enviar();
          }}
        >
          {campo(
            "email",
            "E-mail",
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="seu@email.com"
              className="entrar-entrada"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={marcar("email")}
            />,
          )}

          {campo(
            "cpf",
            "CPF",
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="000.000.000-00"
              className="entrar-entrada"
              value={cpf}
              onChange={(e) => setCpf(mascararCpf(e.target.value))}
              onBlur={marcar("cpf")}
            />,
          )}

          {campo(
            "telefone",
            "Telefone",
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(11) 90000-0000"
              className="entrar-entrada"
              value={telefone}
              onChange={(e) => setTelefone(mascararTelefone(e.target.value))}
              onBlur={marcar("telefone")}
            />,
          )}

          {campo(
            "senha",
            "Senha",
            <input
              type="password"
              autoComplete="new-password"
              placeholder="ao menos 8 caracteres"
              className="entrar-entrada"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onBlur={marcar("senha")}
            />,
          )}

          {campo(
            "confirmacao",
            "Confirmar senha",
            <input
              type="password"
              autoComplete="new-password"
              placeholder="repita a senha"
              className="entrar-entrada"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              onBlur={marcar("confirmacao")}
            />,
          )}

          <button type="submit" className="entrar-primario" disabled={!valido || enviando}>
            {enviando ? "Criando…" : "Criar conta"}
          </button>
        </form>

        <p className="entrar-criar">
          Já tem conta?{" "}
          <button type="button" className="entrar-elo" onClick={() => router.push("/entrar/")}>
            Entrar
          </button>
        </p>
      </div>
    </div>
  );
}
