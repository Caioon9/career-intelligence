"use client";

import Link from "next/link";
import { useRef, useState, type DragEvent, type FormEvent } from "react";
import type { RelatorioCurriculo } from "@/lib/curriculo/schema";

const MAX_BYTES = 5 * 1024 * 1024;
const NOMES_CATEGORIA: Record<string, string> = {
  clarity: "Clareza e organização",
  experience: "Experiência profissional",
  technicalSkills: "Competências técnicas",
  education: "Formação acadêmica",
  projects: "Projetos e realizações",
  jobMatch: "Compatibilidade com a vaga",
};
const NOMES_SECAO_CURRICULO: Record<string, string> = {
  profile: "Perfil e contato",
  experience: "Experiência profissional",
  education: "Formação acadêmica",
  courses: "Cursos",
  skills: "Competências",
  projects: "Projetos",
  certifications: "Certificações",
  languages: "Idiomas",
  additional: "Informações adicionais",
};

function textoDoErro(payload: unknown) {
  if (payload && typeof payload === "object" && "erro" in payload && typeof payload.erro === "string") {
    return payload.erro;
  }
  return "Não foi possível analisar o currículo agora. Tente novamente.";
}

function tamanhoArquivo(bytes: number) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function Nota({ valor }: { valor: number }) {
  return (
    <div
      className="grid size-28 shrink-0 place-items-center rounded-full"
      style={{ background: `conic-gradient(#4f46e5 ${valor * 3.6}deg, #e4e4e7 0deg)` }}
      aria-label={`Pontuação geral: ${valor} de 100`}
      role="img"
    >
      <div className="grid size-24 place-items-center rounded-full bg-white dark:bg-zinc-950">
        <span className="text-3xl font-bold tabular-nums">{valor}</span>
      </div>
    </div>
  );
}

export default function CurriculoPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [cargo, setCargo] = useState("");
  const [descricaoVaga, setDescricaoVaga] = useState("");
  const [consentimento, setConsentimento] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [exportando, setExportando] = useState<"relatorio" | "curriculo" | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [relatorio, setRelatorio] = useState<RelatorioCurriculo | null>(null);

  const exportarPdf = async (tipo: "relatorio" | "curriculo") => {
    if (!relatorio || exportando) return;
    setErro(null);
    setExportando(tipo);
    try {
      const response = await fetch("/api/curriculo/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relatorio, cargo: cargo.trim(), tipo }),
      });
      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        setErro(textoDoErro(payload));
        return;
      }

      const arquivo = await response.blob();
      if (arquivo.size === 0 || arquivo.type !== "application/pdf") {
        throw new Error("O servidor retornou um arquivo PDF inválido.");
      }
      const url = URL.createObjectURL(arquivo);
      const link = document.createElement("a");
      const cargoArquivo = cargo.trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      link.href = url;
      link.download = tipo === "relatorio"
        ? "relatorio-de-analise-curricular.pdf"
        : `curriculo${cargoArquivo ? `-${cargoArquivo}` : "-reorganizado"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setErro("Não foi possível gerar o PDF agora. Verifique sua conexão e tente novamente.");
    } finally {
      setExportando(null);
    }
  };

  const selecionarArquivo = (file?: File) => {
    setErro(null);
    if (!file) return;
    if (!/\.(pdf|docx)$/i.test(file.name)) {
      setArquivo(null);
      if (inputRef.current) inputRef.current.value = "";
      setErro("Escolha um arquivo com extensão PDF ou DOCX.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setArquivo(null);
      if (inputRef.current) inputRef.current.value = "";
      setErro("O arquivo deve ter no máximo 5 MB.");
      return;
    }
    setArquivo(file);
  };

  const aoSoltar = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setArrastando(false);
    selecionarArquivo(event.dataTransfer.files[0]);
  };

  const analisar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErro(null);
    if (!arquivo) {
      setErro("Selecione um currículo PDF ou DOCX.");
      return;
    }
    if (!consentimento) {
      setErro("Confirme que autoriza o processamento externo do currículo.");
      return;
    }

    const dados = new FormData();
    dados.set("file", arquivo);
    dados.set("cargo", cargo.trim());
    dados.set("descricaoVaga", descricaoVaga.trim());
    dados.set("consent", "true");
    setCarregando(true);
    try {
      const response = await fetch("/api/curriculo/analisar", { method: "POST", body: dados });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(textoDoErro(payload));
      setRelatorio(payload as RelatorioCurriculo);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível analisar o currículo agora.");
    } finally {
      setCarregando(false);
    }
  };

  const novaAnalise = () => {
    setRelatorio(null);
    setArquivo(null);
    setCargo("");
    setDescricaoVaga("");
    setConsentimento(false);
    setErro(null);
    if (inputRef.current) inputRef.current.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="no-print mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/" className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">← Voltar às vagas</Link>
          <h1 className="mt-3 text-2xl font-bold">Análise de currículo</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Receba sugestões práticas com base no conteúdo que você compartilhou.
          </p>
        </div>
        {relatorio && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => exportarPdf("curriculo")}
              disabled={relatorio.formattedResume.sections.length === 0 || exportando !== null}
              className="rounded-lg border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
            >
              {exportando === "curriculo" ? "Gerando currículo…" : "Baixar currículo em PDF"}
            </button>
            <button
              type="button"
              onClick={() => exportarPdf("relatorio")}
              disabled={exportando !== null}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 disabled:cursor-wait disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              {exportando === "relatorio" ? "Gerando relatório…" : "Baixar relatório em PDF"}
            </button>
            <button type="button" onClick={novaAnalise} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
              Nova análise
            </button>
          </div>
        )}
      </header>

      {erro && <p role="alert" className="no-print mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">{erro}</p>}

      {!relatorio ? (
        <form onSubmit={analisar} className="no-print max-w-3xl space-y-6">
          <section className="space-y-3">
            <label className="block text-sm font-semibold" htmlFor="curriculo">Currículo</label>
            <div
              onDragOver={(event) => { event.preventDefault(); setArrastando(true); }}
              onDragLeave={() => setArrastando(false)}
              onDrop={aoSoltar}
              className={`rounded-xl border-2 border-dashed p-7 text-center transition ${arrastando ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30" : "border-zinc-300 dark:border-zinc-700"}`}
            >
              <input
                ref={inputRef}
                id="curriculo"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                onChange={(event) => selecionarArquivo(event.target.files?.[0])}
              />
              {arquivo ? (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <span className="min-w-0 break-all font-medium">{arquivo.name}</span>
                  <span className="text-sm text-zinc-500">{tamanhoArquivo(arquivo.size)}</span>
                  <button type="button" onClick={() => inputRef.current?.click()} className="text-sm font-medium text-indigo-700 hover:underline dark:text-indigo-300">
                    Substituir
                  </button>
                  <button type="button" onClick={() => { setArquivo(null); if (inputRef.current) inputRef.current.value = ""; }} className="text-sm font-medium text-red-700 hover:underline dark:text-red-300">
                    Remover
                  </button>
                </div>
              ) : (
                <>
                  <p className="font-medium">Arraste seu currículo até aqui</p>
                  <p className="mt-1 text-sm text-zinc-500">PDF ou DOCX · até 5 MB</p>
                  <label htmlFor="curriculo" className="mt-4 inline-block cursor-pointer rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900">
                    Selecionar arquivo
                  </label>
                </>
              )}
            </div>
          </section>

          <div className="space-y-2">
            <label htmlFor="cargo" className="block text-sm font-semibold">Cargo desejado <span className="font-normal text-zinc-500">(opcional)</span></label>
            <input id="cargo" maxLength={120} value={cargo} onChange={(event) => setCargo(event.target.value)} placeholder="Ex.: Desenvolvedor front-end júnior" className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 outline-none focus:border-indigo-500 dark:border-zinc-700" />
          </div>

          <div className="space-y-2">
            <label htmlFor="vaga" className="block text-sm font-semibold">Descrição da vaga <span className="font-normal text-zinc-500">(opcional)</span></label>
            <textarea id="vaga" maxLength={10_000} rows={6} value={descricaoVaga} onChange={(event) => setDescricaoVaga(event.target.value)} placeholder="Cole aqui a descrição para comparar requisitos e palavras-chave…" className="w-full resize-y rounded-lg border border-zinc-300 bg-transparent px-3 py-2 outline-none focus:border-indigo-500 dark:border-zinc-700" />
            <p className="text-right text-xs text-zinc-500">{descricaoVaga.length}/10.000</p>
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
            <input type="checkbox" checked={consentimento} onChange={(event) => setConsentimento(event.target.checked)} className="mt-0.5 accent-indigo-600" />
            <span>Estou ciente e autorizo que o texto extraído do currículo e os dados de vaga informados sejam enviados à Groq para esta análise. O arquivo não será armazenado pelo aplicativo.</span>
          </label>

          <button type="submit" disabled={carregando} className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-60">
            {carregando ? "Analisando currículo…" : "Analisar currículo"}
          </button>
          {carregando && <p role="status" className="text-sm text-zinc-500">Extraindo o texto e preparando seu relatório. Isso pode levar alguns instantes.</p>}
        </form>
      ) : (
        <article className="relatorio-analise space-y-8">
          <header className="hidden print:block">
            <h1 className="text-2xl font-bold">Relatório de análise curricular</h1>
            <p className="mt-1 text-sm text-zinc-600">Análise orientativa baseada no texto fornecido.</p>
          </header>
          <section className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
            <div className="flex flex-wrap items-center gap-5">
              <Nota valor={relatorio.overallScore} />
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold">Pontuação geral</h2>
                <p className="mt-2 text-zinc-700 dark:text-zinc-300">{relatorio.summary}</p>
                <p className="mt-3 text-sm text-zinc-500">Nota orientativa baseada apenas no texto fornecido; não representa uma probabilidade de contratação.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">Indicadores por categoria</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {relatorio.categories.map((category) => (
                <div key={category.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold">{NOMES_CATEGORIA[category.id]}</h3>
                    <span className="font-bold tabular-nums">{category.score === null ? "Sem nota" : `${category.score}/100`}</span>
                  </div>
                  {category.score !== null && (
                    <div className="mt-2 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${category.score}%` }} />
                    </div>
                  )}
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{category.explanation}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">Pontos fortes</h2>
            {relatorio.strengths.length ? <div className="grid gap-3 sm:grid-cols-2">{relatorio.strengths.map((item, index) => <div key={`${item.title}-${index}`} className="rounded-xl border border-emerald-200 p-4 dark:border-emerald-900"><h3 className="font-semibold">{item.title}</h3><p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{item.explanation}</p></div>)}</div> : <p className="text-sm text-zinc-500">A análise não identificou pontos fortes específicos com evidência suficiente.</p>}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">Oportunidades de melhoria</h2>
            {relatorio.improvements.length ? <div className="space-y-3">{relatorio.improvements.map((item, index) => <div key={`${item.title}-${index}`} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{item.title}</h3><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${item.priority === "high" ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200" : item.priority === "medium" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"}`}>{item.priority === "high" ? "Prioridade alta" : item.priority === "medium" ? "Prioridade média" : "Prioridade baixa"}</span></div><p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{item.description}</p><p className="mt-2 text-sm"><strong>Sugestão:</strong> {item.suggestion}</p></div>)}</div> : <p className="text-sm text-zinc-500">Nenhuma oportunidade específica foi identificada.</p>}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">Seções do currículo</h2>
            {relatorio.sections.length ? <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">{relatorio.sections.map((item, index) => <div key={`${item.name}-${index}`} className="flex flex-wrap items-start justify-between gap-2 p-4"><div><h3 className="font-semibold">{item.name}</h3><p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{item.explanation}</p></div><span className="shrink-0 text-sm font-semibold">{item.score === null ? "Sem nota" : `${item.score}/100`}</span></div>)}</div> : <p className="text-sm text-zinc-500">Não foi possível avaliar seções específicas.</p>}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">Compatibilidade e palavras-chave</h2>
            <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{relatorio.keywords.note}</p>
              {relatorio.keywords.found.length > 0 && <div className="mt-4"><h3 className="text-sm font-semibold">Encontradas no currículo</h3><div className="mt-2 flex flex-wrap gap-2">{relatorio.keywords.found.map((keyword) => <span key={keyword} className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">{keyword}</span>)}</div></div>}
              {relatorio.keywords.missing.length > 0 && <div className="mt-4"><h3 className="text-sm font-semibold">Não encontradas no texto</h3><div className="mt-2 flex flex-wrap gap-2">{relatorio.keywords.missing.map((keyword) => <span key={keyword} className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">{keyword}</span>)}</div><p className="mt-2 text-xs text-zinc-500">A ausência no currículo não significa que você não tenha essa competência.</p></div>}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">Sugestões de reescrita</h2>
            {relatorio.rewrites.length ? <div className="space-y-3">{relatorio.rewrites.map((item, index) => <div key={`${item.original}-${index}`} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"><h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Original</h3><p className="mt-1 text-sm">{item.original}</p><h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Sugestão</h3><p className="mt-1 text-sm">{item.suggested}</p><p className="mt-2 text-xs text-zinc-500">{item.justification}</p></div>)}</div> : <p className="text-sm text-zinc-500">Não houve trechos com evidência suficiente para sugerir uma reescrita fiel.</p>}
          </section>

          <section className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
            <h2 className="text-lg font-bold">Prévia do currículo reorganizado</h2>
            <p className="mt-1 text-sm text-zinc-500">O texto foi reorganizado a partir de trechos verificados do documento original. Não foram acrescentados fatos ou experiências.</p>
            {relatorio.formattedResume.sections.length ? (
              <div className="mt-4 space-y-4">
                {relatorio.formattedResume.sections.map((section) => (
                  <div key={section.id}>
                    <h3 className="border-b border-zinc-200 pb-1 text-sm font-semibold uppercase tracking-wide dark:border-zinc-800">{NOMES_SECAO_CURRICULO[section.id]}</h3>
                    <ul className="mt-2 space-y-1.5 text-sm">
                      {section.entries.map((entry, index) => <li key={`${section.id}-${index}`} className="whitespace-pre-line">{entry}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">Não foram encontrados trechos que pudessem ser organizados com segurança; nenhum conteúdo foi inventado e o PDF não está disponível para esta análise.</p>
            )}
            <p className="mt-4 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200">A seção de experiência só é incluída quando há evidência explícita no currículo original. Projetos e estudos não são apresentados como empregos.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">Plano de ação</h2>
            {relatorio.actionPlan.length ? <ol className="space-y-2">{relatorio.actionPlan.map((item, index) => <li key={`${item.action}-${index}`} className="flex gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">{index + 1}</span><div><p className="text-sm">{item.action}</p><p className="mt-1 text-xs text-zinc-500">Prioridade {item.priority === "high" ? "alta" : item.priority === "medium" ? "média" : "baixa"}</p></div></li>)}</ol> : <p className="text-sm text-zinc-500">Nenhuma ação específica foi sugerida.</p>}
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold">Limitações da análise</h2>
            <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">{relatorio.limitations.map((limitation, index) => <li key={`${limitation}-${index}`}>{limitation}</li>)}</ul>
          </section>

          <footer className="border-t border-zinc-200 pt-4 text-xs text-zinc-500 dark:border-zinc-800">
            Relatório gerado a partir do texto fornecido. Revise as sugestões e confirme que qualquer informação adicionada é verdadeira.
          </footer>
        </article>
      )}
    </main>
  );
}
