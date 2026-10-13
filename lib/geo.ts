import { promises as fs } from "fs";
import path from "path";

export interface Coordenadas {
  lat: number;
  lon: number;
  nome: string;
}

// Cache em arquivo: cada cidade é consultada no Nominatim uma única vez.
const ARQUIVO_CACHE = path.join(process.cwd(), ".cache", "geo.json");
let cache: Record<string, Coordenadas | null> | null = null;

async function carregarCache() {
  if (cache) return cache;
  try {
    cache = JSON.parse(await fs.readFile(ARQUIVO_CACHE, "utf8"));
  } catch {
    cache = {};
  }
  return cache!;
}

async function salvarCache() {
  await fs.mkdir(path.dirname(ARQUIVO_CACHE), { recursive: true });
  await fs.writeFile(ARQUIVO_CACHE, JSON.stringify(cache, null, 2));
}

// A política de uso do Nominatim pede no máximo 1 requisição por segundo.
let fila: Promise<unknown> = Promise.resolve();
function comLimite<T>(fn: () => Promise<T>): Promise<T> {
  const p = fila.then(fn);
  fila = p.catch(() => {}).then(() => new Promise((r) => setTimeout(r, 1100)));
  return p;
}

const USER_AGENT = "vagas-ti-prototipo/0.1";

async function nominatim(consulta: string): Promise<Coordenadas | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", consulta);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "br");
  const res = await comLimite(() => fetch(url, { headers: { "User-Agent": USER_AGENT } }));
  if (!res.ok) return null;
  const [r] = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  return r ? { lat: Number(r.lat), lon: Number(r.lon), nome: r.display_name.split(",").slice(0, 2).join(",") } : null;
}

async function cidadeDoCep(cep: string): Promise<string | null> {
  const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  if (!res.ok) return null;
  const d = (await res.json()) as { localidade?: string; uf?: string; erro?: boolean };
  return d.erro || !d.localidade ? null : `${d.localidade}, ${d.uf}`;
}

/** Aceita "Campinas, SP" ou um CEP ("13010-000"). */
export async function geocodificar(local: string): Promise<Coordenadas | null> {
  const chave = local.trim().toLowerCase();
  if (!chave) return null;
  const c = await carregarCache();
  if (chave in c) return c[chave];

  let consulta = local;
  const cep = local.replace(/\D/g, "");
  if (/^\d{8}$/.test(cep)) consulta = (await cidadeDoCep(cep)) ?? local;

  const r = await nominatim(`${consulta}, Brasil`).catch(() => null);
  c[chave] = r && { ...r, nome: consulta.trim() };
  await salvarCache();
  return c[chave];
}

/** Distância em linha reta (fórmula de Haversine), em km. */
export function distanciaKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
