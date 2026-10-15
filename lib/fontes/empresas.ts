import { detectarNivel, ehVagaDeTI, limparHtml } from "../classificar";
import type { Modelo } from "../types";
import type { FonteDeVagas, VagaBruta } from "./tipos";

/**
 * Vagas publicadas direto pelas empresas nos sistemas de recrutamento delas
 * (Greenhouse, Lever, Ashby). São APIs públicas e oficiais, grátis e sem chave.
 * Trazem poucas vagas de entrada, mas com descrição completa.
 *
 * Para incluir uma empresa: descubra a plataforma e o "slug" (o nome no endereço
 * da página de vagas, ex.: boards.greenhouse.io/<slug>) e adicione aqui.
 */
type Plataforma = "greenhouse" | "lever" | "ashby";

const EMPRESAS: { slug: string; plataforma: Plataforma }[] = [
  { slug: "quintoandar", plataforma: "greenhouse" },
  { slug: "stone", plataforma: "greenhouse" },
  { slug: "ebanx", plataforma: "greenhouse" },
  { slug: "wildlifestudios", plataforma: "greenhouse" },
  { slug: "vtex", plataforma: "greenhouse" },
  { slug: "gympass", plataforma: "greenhouse" },
  { slug: "c6bank", plataforma: "greenhouse" },
  { slug: "zupinnovation", plataforma: "greenhouse" },
  { slug: "rdstation", plataforma: "greenhouse" },
  { slug: "jusbrasil", plataforma: "greenhouse" },
  { slug: "neon", plataforma: "lever" },
  { slug: "nubank", plataforma: "ashby" },
];

// Só vagas no Brasil (as empresas também publicam vagas de outros países).
const NO_BRASIL = /brasil|brazil|são paulo|sao paulo|rio de janeiro|belo horizonte|curitiba|campinas|florian|porto alegre|recife|bras[ií]lia|\bsp\b|\brj\b/i;

const decodificar = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");

function modeloDe(texto?: string): Modelo | undefined {
  if (!texto) return undefined;
  if (/remote/i.test(texto)) return "remoto";
  if (/hybrid/i.test(texto)) return "hibrido";
  if (/on-?site/i.test(texto)) return "presencial";
  return undefined;
}

async function json<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`respondeu ${res.status}`);
  return (await res.json()) as T;
}

async function greenhouse(slug: string): Promise<VagaBruta[]> {
  type Vaga = { id: number; title: string; content?: string; absolute_url: string; updated_at?: string; location?: { name?: string } };
  const { jobs = [] } = await json<{ jobs?: Vaga[] }>(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`);
  return jobs.map((v) => {
    const local = v.location?.name ?? "";
    const modelo = modeloDe(local);
    return {
      idExterno: `${slug}-${v.id}`, titulo: v.title, empresa: slug, local, descricao: decodificar(v.content ?? ""),
      url: v.absolute_url, fonte: "greenhouse", publicadaEm: v.updated_at, modelo, remoto: modelo ? modelo === "remoto" : undefined,
    };
  });
}

async function lever(slug: string): Promise<VagaBruta[]> {
  type Vaga = {
    id: string; text: string; hostedUrl: string; createdAt?: number; workplaceType?: string; descriptionPlain?: string;
    categories?: { location?: string }; lists?: { text: string; content: string }[];
  };
  const vagas = await json<Vaga[]>(`https://api.lever.co/v0/postings/${slug}?mode=json`);
  return vagas.map((v) => {
    const modelo = modeloDe(v.workplaceType);
    const listas = (v.lists ?? []).map((l) => `${l.text}: ${l.content}`).join(" ");
    return {
      idExterno: v.id, titulo: v.text, empresa: slug, local: v.categories?.location ?? "", descricao: `${v.descriptionPlain ?? ""} ${listas}`,
      url: v.hostedUrl, fonte: "lever", publicadaEm: v.createdAt ? new Date(v.createdAt).toISOString() : undefined,
      modelo, remoto: modelo ? modelo === "remoto" : undefined,
    };
  });
}

async function ashby(slug: string): Promise<VagaBruta[]> {
  type Vaga = { id: string; title: string; location?: string; isRemote?: boolean; workplaceType?: string; jobUrl: string; publishedAt?: string; descriptionPlain?: string };
  const { jobs = [] } = await json<{ jobs?: Vaga[] }>(`https://api.ashbyhq.com/posting-api/job-board/${slug}`);
  return jobs.map((v) => {
    const modelo = modeloDe(v.workplaceType) ?? (v.isRemote ? "remoto" : undefined);
    return {
      idExterno: v.id, titulo: v.title, empresa: slug, local: v.location ?? "", descricao: v.descriptionPlain ?? "",
      url: v.jobUrl, fonte: "ashby", publicadaEm: v.publishedAt, modelo, remoto: modelo ? modelo === "remoto" : undefined,
    };
  });
}

const COLETOR: Record<Plataforma, (slug: string) => Promise<VagaBruta[]>> = { greenhouse, lever, ashby };

// Essas páginas trazem centenas de vagas pleno/sênior e de outras áreas; só guarda as que o app mostraria.
const interessa = (v: VagaBruta) => {
  const titulo = limparHtml(v.titulo);
  return ehVagaDeTI(titulo) && detectarNivel(titulo, limparHtml(v.descricao)) !== null;
};

// O nome bonito da empresa vem do slug ("c6bank" → "C6bank"); bom o suficiente para o MVP.
const nomeDaEmpresa = (slug: string) => slug.charAt(0).toUpperCase() + slug.slice(1);

export const fonteEmpresas: FonteDeVagas = {
  nome: "empresas",
  ativa: () => true, // APIs públicas, sem chave
  async coletar() {
    const resultados = await Promise.allSettled(EMPRESAS.map((e) => COLETOR[e.plataforma](e.slug)));
    const vagas: VagaBruta[] = [];
    const falharam: string[] = [];
    resultados.forEach((r, i) => {
      if (r.status === "rejected") return void falharam.push(EMPRESAS[i].slug);
      for (const v of r.value) if (NO_BRASIL.test(v.local) && interessa(v)) vagas.push({ ...v, empresa: nomeDaEmpresa(v.empresa) });
    });
    if (vagas.length === 0 && falharam.length === EMPRESAS.length) throw new Error("nenhuma página de empresa respondeu");
    return { vagas, falhas: falharam.length ? [`Páginas de empresas sem resposta: ${falharam.join(", ")}.`] : [] };
  },
};
