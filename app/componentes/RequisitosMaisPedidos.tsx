import type { SkillFrequencia } from "@/lib/types";

export function RequisitosMaisPedidos({ itens, totalVagas }: { itens: SkillFrequencia[]; totalVagas: number }) {
  if (itens.length === 0) return null;
  const top = itens.slice(0, 12);
  const faltam = top.filter((i) => !i.sabe).slice(0, 3);

  return (
    <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-semibold">O que essas {totalVagas} vagas mais pedem</h2>
      {faltam.length > 0 && (
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Prioridade de estudo: <strong>{faltam.map((f) => f.skill).join(", ")}</strong>
        </p>
      )}
      <ul className="mt-3 space-y-1.5">
        {top.map((i) => (
          <li key={i.skill} className="grid grid-cols-[7.5rem_1fr_3rem] items-center gap-2 text-sm">
            <span className="truncate" title={i.categoria}>
              {i.sabe ? "✓ " : ""}
              {i.skill}
            </span>
            <span className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <span
                className={`block h-full rounded-full ${i.sabe ? "bg-emerald-500" : "bg-indigo-500"}`}
                style={{ width: `${i.percentual}%` }}
              />
            </span>
            <span className="text-right tabular-nums text-zinc-500">{i.percentual}%</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-zinc-500">
        <span className="text-emerald-600">■</span> você já sabe · <span className="text-indigo-500">■</span> para estudar
      </p>
    </section>
  );
}
