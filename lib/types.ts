export type Nivel = "estagio" | "aprendiz" | "trainee" | "junior";
export type Modelo = "presencial" | "hibrido" | "remoto";
export type Area =
  | "frontend"
  | "backend"
  | "fullstack"
  | "mobile"
  | "dados"
  | "infra"
  | "qa"
  | "devops"
  | "seguranca"
  | "geral";

export type Fonte = "jsearch" | "exemplo";

/** Vaga já normalizada, independente da fonte de onde veio. */
export interface Vaga {
  id: string;
  titulo: string;
  empresa: string;
  local: string; // texto livre, ex.: "Campinas, SP"
  lat?: number;
  lon?: number;
  modelo: Modelo;
  nivel: Nivel;
  area: Area;
  descricao: string;
  url: string;
  fonte: Fonte;
  publicadaEm?: string; // ISO
  salario?: string;
  skills: string[];
}

/** Vaga devolvida ao front, com dados calculados para o perfil do usuário. */
export interface VagaResultado extends Vaga {
  distanciaKm?: number;
  match: number | null; // 0..100; null quando o usuário não marcou skills
  skillsQueSabe: string[];
  skillsQueFaltam: string[];
}

export interface Perfil {
  local: string; // cidade ou CEP
  raioKm: number;
  niveis: Nivel[];
  modelos: Modelo[];
  areas: Area[];
  skills: string[];
}

export interface SkillFrequencia {
  skill: string;
  categoria: string;
  vagas: number;
  percentual: number;
  sabe: boolean;
}

export interface RespostaVagas {
  vagas: VagaResultado[];
  requisitosMaisPedidos: SkillFrequencia[];
  origem: { lat: number; lon: number; nome: string } | null;
  fontes: Fonte[];
  avisos: string[];
  cota?: { usadas: number; limite: number };
}
