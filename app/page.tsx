"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Perfil, RespostaVagas, VagaResultado } from "@/lib/types";
import { CartaoVaga } from "./componentes/CartaoVaga";
import { PainelPerfil } from "./componentes/PainelPerfil";
import { RequisitosMaisPedidos } from "./componentes/RequisitosMaisPedidos";

const PERFIL_PADRAO: Perfil = {
  local: "",
  raioKm: 50,
  niveis: ["estagio", "aprendiz", "trainee", "junior"],
  modelos: ["presencial", "hibrido", "remoto"],
  areas: [],
  skills: [],
};

const CHAVE_STORAGE = "vagas-ti:perfil";

type Ordem = "match" | "distancia" | "recentes";

const ORDENAR: Record<Ordem, (a: VagaResultado, b: VagaResultado) => number> = {
  match: (a, b) => (b.match ?? 0) - (a.match ?? 0) || (a.distanciaKm ?? 1e9) - (b.distanciaKm ?? 1e9),
  distancia: (a, b) => (a.distanciaKm ?? (a.modelo === "remoto" ? 0 : 1e9)) - (b.distanciaKm ?? (b.modelo === "remoto" ? 0 : 1e9)),
  recentes: (a, b) => (b.publicadaEm ?? "").localeCompare(a.publicadaEm ?? ""),
};

export default function Home() {
  const [perfil, setPerfil] = useState<Perfil>(PERFIL_PADRAO);
  const [resposta, setResposta] = useState<RespostaVagas | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ordem, setOrdem] = useState<Ordem>("match");

  const buscar = useCallback(async (p: Perfil) => {
    setCarregando(true);
    setErro(null);
    try {
      const qs = new URLSearchParams({
        local: p.local,
        raio: String(p.raioKm),
        niveis: p.niveis.join(","),
        modelos: p.modelos.join(","),
        areas: p.areas.join(","),
        skills: p.skills.join(","),
      });
      const res = await fetch(`/api/vagas?${qs}`);
      if (!res.ok) throw new Error();
      setResposta(await res.json());
    } catch {
      setErro("Não foi possível buscar as vagas. Tente de novo.");
    } finally {
      setCarregando(false);
    }
  }, []);

  // Restaura o perfil salvo e faz a primeira busca.
  useEffect(() => {
    let salvo = PERFIL_PADRAO;
    try {
      const bruto = localStorage.getItem(CHAVE_STORAGE);
      if (bruto) salvo = { ...PERFIL_PADRAO, ...JSON.parse(bruto) };
    } catch {}
    setPerfil(salvo);
    buscar(salvo);
  }, [buscar]);

  const atualizarPerfil = (p: Perfil) => {
    setPerfil(p);
    try {
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(p));
    } catch {}
  };

  const vagas = useMemo(() => [...(resposta?.vagas ?? [])].sort(ORDENAR[ordem]), [resposta, ordem]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Primeira vaga em TI</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Estágio, jovem aprendiz, trainee e júnior perto de você, com os requisitos de cada vaga.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <PainelPerfil perfil={perfil} onChange={atualizarPerfil} onBuscar={() => buscar(perfil)} carregando={carregando} />
        </aside>

        <main className="min-w-0 space-y-4">
          {resposta?.avisos.map((a) => (
            <p key={a} className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              {a}
            </p>
          ))}
          {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">{erro}</p>}

          {resposta && (
            <>
              <RequisitosMaisPedidos itens={resposta.requisitosMaisPedidos} totalVagas={vagas.length} />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  <strong className="text-zinc-900 dark:text-zinc-100">{vagas.length}</strong> vagas
                  {resposta.origem && <> · a partir de {resposta.origem.nome}</>}
                  {" · "}fontes: {resposta.fontes.join(", ")}
                  {resposta.cota && <> · cota do mês: {resposta.cota.usadas}/{resposta.cota.limite} buscas</>}
                </p>
                <label className="flex items-center gap-2 text-sm">
                  Ordenar por
                  <select
                    value={ordem}
                    onChange={(e) => setOrdem(e.target.value as Ordem)}
                    className="rounded-md border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700"
                  >
                    <option value="match">Compatibilidade</option>
                    <option value="distancia">Distância</option>
                    <option value="recentes">Mais recentes</option>
                  </select>
                </label>
              </div>

              {perfil.skills.length === 0 && vagas.length > 0 && (
                <p className="text-sm text-zinc-500">
                  Dica: marque em <strong>“O que você já sabe”</strong> as tecnologias que você conhece para ver a compatibilidade com cada vaga.
                </p>
              )}

              {vagas.length === 0 ? (
                <p className="py-12 text-center text-zinc-500">Nenhuma vaga com esses filtros. Tente aumentar a distância ou incluir vagas remotas.</p>
              ) : (
                <div className="space-y-3">
                  {vagas.map((v) => (
                    <CartaoVaga key={v.id} vaga={v} />
                  ))}
                </div>
              )}
            </>
          )}
          {!resposta && carregando && <p className="py-12 text-center text-zinc-500">Buscando vagas…</p>}
        </main>
      </div>
    </div>
  );
}
