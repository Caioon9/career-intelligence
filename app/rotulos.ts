import type { Area, Fonte, Modelo, Nivel, Trilha } from "@/lib/types";

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

export const TRILHAS: Record<Trilha, string> = {
  desenvolvimento: "Desenvolvimento (código)",
  dados: "Dados / BI",
  infra: "Suporte / Infra",
  qa: "QA / Testes",
  devops: "DevOps / Cloud",
  seguranca: "Segurança",
  outros: "Outros",
};

export const FONTES: Record<Fonte, string> = {
  jsearch: "Google Jobs",
  gupy: "Gupy",
  greenhouse: "site da empresa",
  lever: "site da empresa",
  ashby: "site da empresa",
  exemplo: "exemplo",
};
