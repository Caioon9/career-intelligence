import { NextResponse } from "next/server";
import { buscarVagas, RAIO_MAXIMO_KM } from "@/lib/buscar";
import type { Area, Modelo, Nivel, Perfil } from "@/lib/types";

const lista = <T extends string>(v: string | null) => (v ? (v.split(",").filter(Boolean) as T[]) : []);

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const perfil: Perfil = {
    local: q.get("local") ?? "",
    raioKm: Math.min(Number(q.get("raio") ?? 50) || 50, RAIO_MAXIMO_KM),
    niveis: lista<Nivel>(q.get("niveis")),
    modelos: lista<Modelo>(q.get("modelos")),
    areas: lista<Area>(q.get("areas")),
    skills: lista<string>(q.get("skills")),
  };

  try {
    return NextResponse.json(await buscarVagas(perfil));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: "Falha ao buscar vagas" }, { status: 500 });
  }
}
