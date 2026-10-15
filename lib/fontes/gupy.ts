import type { Modelo, Nivel } from "../types";
import { esperar, type FonteDeVagas, type VagaBruta } from "./tipos";

/**
 * Gupy: plataforma onde muitas empresas brasileiras publicam estágio, aprendiz e
 * júnior. Usa a busca do portal público (portal.gupy.io), cujo robots.txt libera
 * robôs. Não é uma API documentada: pode mudar sem aviso, então qualquer erro
 * aqui só gera um aviso e as outras fontes seguem normalmente.
 */

interface GupyVaga {
  id: number;
  name: string;
  description?: string;
  careerPageName?: string;
  type?: string;
  publishedDate?: string;
  workplaceType?: string;
  city?: string;
  state?: string;
  jobUrl?: string;
}

const URL_BUSCA = "https://portal.gupy.io/api/job-search/jobs";
const PAUSA_MS = 2000; // entre uma chamada e outra, para não sobrecarregar o portal
const POR_PAGINA = 50;
const MAX_POR_CONSULTA = 100;

// Cada consulta é feita no estado da região; as remotas valem para o Brasil todo.
const CONSULTAS: { termo: string; remoto?: boolean }[] = [
  { termo: "estágio TI" },
  { termo: "estágio desenvolvimento" },
  { termo: "estágio dados" },
  { termo: "jovem aprendiz TI" },
  { termo: "desenvolvedor júnior" },
  { termo: "suporte técnico" },
  { termo: "estágio TI", remoto: true },
  { termo: "desenvolvedor júnior", remoto: true },
];

const NIVEL_POR_TIPO: Record<string, Nivel> = {
  vacancy_type_internship: "estagio",
  vacancy_type_apprentice: "aprendiz",
  vacancy_type_trainee: "trainee",
};

const MODELO_POR_TIPO: Record<string, Modelo> = {
  "on-site": "presencial",
  hybrid: "hibrido",
  remote: "remoto",
};

function normalizar(v: GupyVaga): VagaBruta {
  const modelo = v.workplaceType ? MODELO_POR_TIPO[v.workplaceType] : undefined;
  const local = v.city ? `${v.city}, ${v.state ?? ""}`.replace(/, $/, "") : modelo === "remoto" ? "Remoto" : v.state ?? "";
  return {
    idExterno: String(v.id),
    titulo: v.name,
    empresa: v.careerPageName || "Empresa não informada",
    local,
    descricao: v.description ?? "",
    url: v.jobUrl || "#",
    fonte: "gupy",
    publicadaEm: v.publishedDate,
    remoto: modelo ? modelo === "remoto" : undefined,
    nivel: v.type ? NIVEL_POR_TIPO[v.type] : undefined,
    modelo,
  };
}

async function buscarPagina(termo: string, estado: string | undefined, remoto: boolean, offset: number) {
  const url = new URL(URL_BUSCA);
  url.searchParams.set("jobName", termo);
  url.searchParams.set("limit", String(POR_PAGINA));
  url.searchParams.set("offset", String(offset));
  if (estado) url.searchParams.set("state", estado);
  if (remoto) url.searchParams.set("workplaceType", "remote");
  const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "vagas-ti/0.1 (projeto pessoal de estudo)" } });
  if (!res.ok) throw new Error(`Gupy respondeu ${res.status}`);
  return (await res.json()) as { data?: GupyVaga[]; pagination?: { total?: number } };
}

export const fonteGupy: FonteDeVagas = {
  nome: "gupy",
  ativa: () => true, // não precisa de chave
  async coletar(regiao) {
    const vagas: VagaBruta[] = [];
    const falhas: string[] = [];
    let primeira = true;
    for (const { termo, remoto = false } of CONSULTAS) {
      for (let offset = 0; offset < MAX_POR_CONSULTA; offset += POR_PAGINA) {
        if (!primeira) await esperar(PAUSA_MS);
        primeira = false;
        try {
          const { data = [], pagination } = await buscarPagina(termo, remoto ? undefined : regiao.estado, remoto, offset);
          vagas.push(...data.map(normalizar));
          if (offset + POR_PAGINA >= (pagination?.total ?? 0)) break;
        } catch (e) {
          falhas.push(`Gupy (“${termo}”): ${(e as Error).message}`);
          break;
        }
      }
    }
    if (vagas.length === 0 && falhas.length) throw new Error(falhas[0]);
    return { vagas, falhas: falhas.length ? [`Gupy: ${falhas.length} busca(s) falharam.`] : [] };
  },
};
