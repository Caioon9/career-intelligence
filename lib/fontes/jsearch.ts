import { promises as fs } from "fs";
import path from "path";
import type { FonteDeVagas, ParametrosBusca, VagaBruta } from "./tipos";

/**
 * JSearch (RapidAPI): vagas do Google for Jobs, que agrega LinkedIn, Indeed,
 * Glassdoor, Gupy etc. Plano gratuito com cota mensal: o app conta as chamadas
 * e para no limite. As respostas ficam guardadas no banco (lib/db.ts).
 */

interface JSearchVaga {
  job_id: string;
  job_title: string;
  employer_name?: string;
  job_description?: string;
  job_apply_link?: string;
  job_is_remote?: boolean;
  job_city?: string | null;
  job_state?: string | null;
  job_country?: string | null;
  job_latitude?: number | null;
  job_longitude?: number | null;
  job_posted_at_datetime_utc?: string | null;
  job_min_salary?: number | null;
  job_max_salary?: number | null;
  job_salary_period?: string | null;
}

const HOST = "jsearch.p.rapidapi.com";
const PASTA = path.join(process.cwd(), ".cache");
const ARQ_COTA = path.join(PASTA, "jsearch-cota.json");

export class CotaEsgotadaError extends Error {}

export function jsearchConfigurada() {
  return Boolean(process.env.RAPIDAPI_KEY);
}

const limiteMensal = () => Number(process.env.JSEARCH_LIMITE_MENSAL ?? 200);
const mesAtual = () => new Date().toISOString().slice(0, 7); // "2026-10"

async function lerJson<T>(arquivo: string, padrao: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(arquivo, "utf8"));
  } catch {
    return padrao;
  }
}

async function gravarJson(arquivo: string, dados: unknown) {
  await fs.mkdir(PASTA, { recursive: true });
  await fs.writeFile(arquivo, JSON.stringify(dados));
}

/** Quantas chamadas já foram feitas no mês e qual o limite. */
export async function usoDaCota() {
  const cota = await lerJson(ARQ_COTA, { mes: mesAtual(), chamadas: 0 });
  return { usadas: cota.mes === mesAtual() ? cota.chamadas : 0, limite: limiteMensal() };
}

async function registrarChamada() {
  const { usadas } = await usoDaCota();
  await gravarJson(ARQ_COTA, { mes: mesAtual(), chamadas: usadas + 1 });
}

function formatarSalario(v: JSearchVaga) {
  if (!v.job_min_salary) return undefined;
  const brl = (n: number) => `R$ ${Math.round(n).toLocaleString("pt-BR")}`;
  const faixa =
    v.job_max_salary && v.job_max_salary !== v.job_min_salary
      ? `${brl(v.job_min_salary)} – ${brl(v.job_max_salary)}`
      : brl(v.job_min_salary);
  return v.job_salary_period === "MONTH" || !v.job_salary_period ? faixa : `${faixa} (${v.job_salary_period.toLowerCase()})`;
}

function normalizar(v: JSearchVaga): VagaBruta {
  const local = v.job_is_remote
    ? "Remoto"
    : [v.job_city, v.job_state].filter(Boolean).join(", ") || v.job_country || "";
  return {
    idExterno: v.job_id,
    titulo: v.job_title,
    empresa: v.employer_name || "Empresa não informada",
    local,
    lat: v.job_latitude ?? undefined,
    lon: v.job_longitude ?? undefined,
    descricao: v.job_description ?? "",
    remoto: v.job_is_remote ?? undefined,
    url: v.job_apply_link || "#",
    fonte: "jsearch",
    publicadaEm: v.job_posted_at_datetime_utc ?? undefined,
    salario: formatarSalario(v),
  };
}

// Uma chamada por vez, para o contador da cota não se atropelar.
let fila: Promise<unknown> = Promise.resolve();
export function buscarJSearch(p: ParametrosBusca): Promise<VagaBruta[]> {
  const r = fila.then(() => buscar(p));
  fila = r.catch(() => {});
  return r;
}

async function buscar({ termo, cidade }: ParametrosBusca): Promise<VagaBruta[]> {
  const query = cidade ? `${termo} em ${cidade}` : termo;

  const { usadas, limite } = await usoDaCota();
  if (usadas >= limite) throw new CotaEsgotadaError(`Cota mensal da JSearch atingida (${usadas}/${limite}).`);

  const url = new URL(`https://${HOST}/search-v2`);
  url.searchParams.set("query", query);
  url.searchParams.set("country", "br");
  url.searchParams.set("language", "pt");
  url.searchParams.set("date_posted", "month");
  url.searchParams.set("num_pages", "1"); // cada página (até 10 vagas) = 1 crédito
  await registrarChamada(); // conta antes: requisição com erro também pode consumir cota
  const res = await fetch(url, {
    headers: { "X-RapidAPI-Key": process.env.RAPIDAPI_KEY!, "X-RapidAPI-Host": HOST },
  });
  if (res.status === 429) throw new CotaEsgotadaError("A JSearch recusou por limite de uso (429).");
  if (!res.ok) throw new Error(`JSearch respondeu ${res.status}`);

  const { data } = (await res.json()) as { data?: { jobs?: JSearchVaga[] } };
  return (data?.jobs ?? []).map(normalizar);
}

// Cada termo é 1 crédito da cota gratuita, então são poucos e amplos.
// Presencial, híbrido e remoto vêm juntos; os filtros são aplicados no site.
const TERMOS = ["estágio TI", "desenvolvedor júnior", "jovem aprendiz TI", "suporte técnico júnior", "analista de dados júnior"];

export const fonteJSearch: FonteDeVagas = {
  nome: "jsearch",
  ativa: jsearchConfigurada,
  async coletar(regiao) {
    const resultados = await Promise.allSettled(TERMOS.map((termo) => buscarJSearch({ termo, cidade: regiao.consulta })));
    const vagas: VagaBruta[] = [];
    const falhas = new Set<string>();
    for (const r of resultados) {
      if (r.status === "fulfilled") vagas.push(...r.value);
      else falhas.add(r.reason instanceof CotaEsgotadaError ? r.reason.message : `JSearch: ${(r.reason as Error).message}`);
    }
    if (vagas.length === 0 && falhas.size) throw new Error([...falhas].join(" "));
    return { vagas, falhas: [...falhas] };
  },
};
