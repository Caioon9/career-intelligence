"use client";

import { useState } from "react";
import { BIG_TECHS } from "@/lib/bigtechs";
import { CATEGORIA_POR_SKILL, TODAS_SKILLS } from "@/lib/skills";
import type { Perfil } from "@/lib/types";
import { AREAS, MODELOS, NIVEIS, TRILHAS } from "../rotulos";

function alternar<T>(lista: T[], item: T) {
  return lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item];
}

function Chip({ ativo, onClick, children, desativado = false }: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
  desativado?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      disabled={desativado}
      className={`rounded-full border px-3 py-1 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
        ativo
          ? "border-indigo-600 bg-indigo-600 text-white"
          : "border-zinc-300 text-zinc-700 hover:border-indigo-400 dark:border-zinc-700 dark:text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}

function Grupo({ titulo, dica, children }: { titulo: string; dica?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{titulo}</legend>
      {dica && <p className="text-xs text-zinc-500">{dica}</p>}
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

const SKILLS_POR_CATEGORIA = TODAS_SKILLS.reduce<Record<string, string[]>>((acc, s) => {
  (acc[CATEGORIA_POR_SKILL[s]] ??= []).push(s);
  return acc;
}, {});

export function PainelPerfil({ perfil, onChange, onBuscar, carregando }: {
  perfil: Perfil;
  onChange: (p: Perfil) => void;
  onBuscar: () => void;
  carregando: boolean;
}) {
  const [skillsAbertas, setSkillsAbertas] = useState(false);
  const set = (parcial: Partial<Perfil>) => onChange({ ...perfil, ...parcial });

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        onBuscar();
      }}
    >
      <div className="space-y-2">
        <label htmlFor="local" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Onde você mora
        </label>
        <input
          id="local"
          value={perfil.local}
          onChange={(e) => set({ local: e.target.value })}
          placeholder="Cidade, UF ou CEP"
          className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 outline-none focus:border-indigo-500 dark:border-zinc-700"
        />
        <div className="flex items-center gap-3 text-sm">
          <input
            type="range"
            min={5}
            max={100}
            step={5}
            value={perfil.raioKm}
            onChange={(e) => set({ raioKm: Number(e.target.value) })}
            className="flex-1 accent-indigo-600"
            aria-label="Distância máxima"
          />
          <span className="w-20 text-right tabular-nums">até {perfil.raioKm} km</span>
        </div>
      </div>

      <Grupo titulo="Tipo de vaga">
        {Object.entries(NIVEIS).map(([k, v]) => (
          <Chip key={k} ativo={perfil.niveis.includes(k as never)} onClick={() => set({ niveis: alternar(perfil.niveis, k as never) })}>
            {v}
          </Chip>
        ))}
      </Grupo>

      <Grupo titulo="Modelo de trabalho">
        {Object.entries(MODELOS).map(([k, v]) => (
          <Chip key={k} ativo={perfil.modelos.includes(k as never)} onClick={() => set({ modelos: alternar(perfil.modelos, k as never) })}>
            {v}
          </Chip>
        ))}
      </Grupo>

      <Grupo titulo="Mostrar só" dica="Esconde as vagas de outros tipos. Nada marcado mostra todas.">
        {Object.entries(TRILHAS).map(([k, v]) => (
          <Chip key={k} ativo={perfil.trilhas.includes(k as never)} onClick={() => set({ trilhas: alternar(perfil.trilhas, k as never) })}>
            {v}
          </Chip>
        ))}
        <Chip
          ativo={perfil.soBigTechs && BIG_TECHS.length > 0}
          desativado={BIG_TECHS.length === 0}
          onClick={() => set({ soBigTechs: !perfil.soBigTechs })}
        >
          Só big techs{BIG_TECHS.length === 0 && " · em breve"}
        </Chip>
      </Grupo>

      <Grupo titulo="Áreas de interesse" dica="Não esconde vagas: só aumenta a compatibilidade das áreas escolhidas.">
        {Object.entries(AREAS).map(([k, v]) => (
          <Chip key={k} ativo={perfil.areas.includes(k as never)} onClick={() => set({ areas: alternar(perfil.areas, k as never) })}>
            {v}
          </Chip>
        ))}
      </Grupo>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setSkillsAbertas(!skillsAbertas)}
          className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-zinc-500"
          aria-expanded={skillsAbertas}
        >
          <span>O que você já sabe ({perfil.skills.length})</span>
          <span>{skillsAbertas ? "▲" : "▼"}</span>
        </button>
        {skillsAbertas && (
          <div className="space-y-3">
            {Object.entries(SKILLS_POR_CATEGORIA).map(([cat, skills]) => (
              <div key={cat}>
                <p className="mb-1 text-xs text-zinc-500">{cat}</p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <Chip key={s} ativo={perfil.skills.includes(s)} onClick={() => set({ skills: alternar(perfil.skills, s) })}>
                      {s}
                    </Chip>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={carregando}
        className="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {carregando ? "Buscando vagas…" : "Buscar vagas"}
      </button>
    </form>
  );
}
