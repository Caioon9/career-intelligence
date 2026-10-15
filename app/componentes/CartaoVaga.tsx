import type { VagaResultado } from "@/lib/types";
import { FONTES, MODELOS, NIVEIS, ROTULO_AREA } from "../rotulos";

function haQuanto(iso?: string) {
  if (!iso) return null;
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  return `há ${dias} dias`;
}

function corDoMatch(m: number) {
  if (m >= 70) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
  if (m >= 40) return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
  return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
}

export function CartaoVaga({ vaga }: { vaga: VagaResultado }) {
  const quando = haQuanto(vaga.publicadaEm);
  return (
    <article className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold leading-snug">{vaga.titulo}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{vaga.empresa}</p>
        </div>
        {vaga.match !== null && (
          <span className={`shrink-0 rounded-lg px-2 py-1 text-sm font-semibold tabular-nums ${corDoMatch(vaga.match)}`} title="Compatibilidade com seu perfil">
            {vaga.match}%
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
        <span>📍 {vaga.local || "Local não informado"}</span>
        {vaga.distanciaKm !== undefined && <span>{vaga.distanciaKm} km de você</span>}
        {quando && <span>{quando}</span>}
        {vaga.salario && <span>{vaga.salario}</span>}
        {vaga.fonte !== "exemplo" && <span>via {FONTES[vaga.fonte]}</span>}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
        <span className="rounded bg-indigo-100 px-2 py-0.5 font-medium text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">{NIVEIS[vaga.nivel]}</span>
        <span className="rounded bg-sky-100 px-2 py-0.5 font-medium text-sky-800 dark:bg-sky-900/40 dark:text-sky-300">{MODELOS[vaga.modelo]}</span>
        <span className="rounded bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">{ROTULO_AREA(vaga.area)}</span>
        {vaga.fonte === "exemplo" && (
          <span className="rounded border border-dashed border-zinc-400 px-2 py-0.5 text-zinc-500">vaga de exemplo</span>
        )}
      </div>

      {vaga.skills.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs text-zinc-500">Requisitos</p>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {vaga.skillsQueSabe.map((s) => (
              <span key={s} className="rounded-full bg-emerald-600 px-2 py-0.5 text-white" title="Você já sabe">
                ✓ {s}
              </span>
            ))}
            {vaga.skillsQueFaltam.map((s) => (
              <span key={s} className="rounded-full border border-zinc-300 px-2 py-0.5 dark:border-zinc-700" title="Para estudar">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">Descrição</summary>
        <p className="mt-2 whitespace-pre-line text-zinc-700 dark:text-zinc-300">{vaga.descricao}</p>
      </details>

      {vaga.url !== "#" && (
        <a
          href={vaga.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Ver vaga original ↗
        </a>
      )}
    </article>
  );
}
