import { NextResponse } from "next/server";
import { buscarVagas, RAIO_MAXIMO_KM } from "@/lib/buscar";
import type { Area, Modelo, Nivel, Perfil, Trilha } from "@/lib/types";

const lista = <T extends string>(v: string | null) =>
  v ? (v.split(",").map((item) => item.trim()).filter(Boolean) as T[]) : [];

const raioValido = (valor: string | null, padrao = 50) => {
  const numero = Number(valor ?? padrao);
  if (!Number.isFinite(numero)) return padrao;
  return Math.min(Math.max(numero, 0), RAIO_MAXIMO_KM);
};

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const perfil: Perfil = {
    local: (q.get("local") ?? "").trim(),
    raioKm: raioValido(q.get("raio"), 50),
    niveis: lista<Nivel>(q.get("niveis")),
    modelos: lista<Modelo>(q.get("modelos")),
    areas: lista<Area>(q.get("areas")),
    trilhas: lista<Trilha>(q.get("trilhas")),
    soBigTechs: q.get("bigtechs") === "1",
    skills: lista<string>(q.get("skills")),
  };

  try {
    return NextResponse.json(await buscarVagas(perfil));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: "Falha ao buscar vagas" }, { status: 500 });
  }
}
