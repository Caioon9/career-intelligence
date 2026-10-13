import type { Area, Modelo, Nivel } from "@/lib/types";

export const NIVEIS: Record<Nivel, string> = {
  estagio: "Estágio",
  aprendiz: "Jovem aprendiz",
  trainee: "Trainee",
  junior: "Júnior",
};

export const MODELOS: Record<Modelo, string> = {
  presencial: "Presencial",
  hibrido: "Híbrido",
  remoto: "Remoto",
};

export const AREAS: Record<Exclude<Area, "geral">, string> = {
  frontend: "Front-end",
  backend: "Back-end",
  fullstack: "Full stack",
  mobile: "Mobile",
  dados: "Dados / BI",
  infra: "Suporte / Infra",
  qa: "QA / Testes",
  devops: "DevOps / Cloud",
  seguranca: "Segurança",
};

export const ROTULO_AREA = (a: Area) => (a === "geral" ? "TI geral" : AREAS[a]);
