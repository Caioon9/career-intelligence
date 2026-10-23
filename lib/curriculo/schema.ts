import { z } from "zod";

const categoriaIds = ["clarity", "experience", "technicalSkills", "education", "projects", "jobMatch"] as const;
const secaoCurriculoIds = [
  "profile",
  "experience",
  "education",
  "courses",
  "skills",
  "projects",
  "certifications",
  "languages",
  "additional",
] as const;

export const relatorioCurriculoSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  summary: z.string().min(1).max(2000),
  categories: z.array(z.object({
    id: z.enum(categoriaIds),
    score: z.number().int().min(0).max(100).nullable(),
    explanation: z.string().min(1).max(1000),
  })).min(5).max(6),
  strengths: z.array(z.object({
    title: z.string().min(1).max(160),
    explanation: z.string().min(1).max(1000),
  })).max(12),
  improvements: z.array(z.object({
    title: z.string().min(1).max(160),
    description: z.string().min(1).max(1000),
    suggestion: z.string().min(1).max(1000),
    priority: z.enum(["high", "medium", "low"]),
  })).min(1).max(15),
  sections: z.array(z.object({
    name: z.string().min(1).max(100),
    score: z.number().int().min(0).max(100).nullable(),
    explanation: z.string().min(1).max(1000),
  })).min(1).max(15),
  keywords: z.object({
    found: z.array(z.string().min(1).max(100)).max(50),
    missing: z.array(z.string().min(1).max(100)).max(50),
    note: z.string().min(1).max(500),
  }),
  rewrites: z.array(z.object({
    original: z.string().min(1).max(1000),
    suggested: z.string().min(1).max(1200),
    justification: z.string().min(1).max(500),
  })).max(10),
  actionPlan: z.array(z.object({
    priority: z.enum(["high", "medium", "low"]),
    action: z.string().min(1).max(500),
  })).min(1).max(15),
  limitations: z.array(z.string().min(1).max(500)).min(1).max(10),
  formattedResume: z.object({
    sections: z.array(z.object({
      id: z.enum(secaoCurriculoIds),
      entries: z.array(z.string().min(1).max(2000)).min(1).max(30),
    })).max(8),
  }),
});

export type RelatorioCurriculo = z.infer<typeof relatorioCurriculoSchema>;

const categoriasObrigatorias = ["clarity", "experience", "technicalSkills", "education", "projects"] as const;

export function validarRelatorio(value: unknown): RelatorioCurriculo {
  const report = relatorioCurriculoSchema.parse(value);
  const ids = report.categories.map((category) => category.id);
  if (
    new Set(ids).size !== ids.length ||
    categoriasObrigatorias.some((id) => !ids.includes(id))
  ) {
    throw new Error("Relatório da análise incompleto ou inconsistente.");
  }
  return report;
}

function normalizarTrechoCurriculo(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function validarCurriculoFormatado(report: RelatorioCurriculo, textoOriginal: string) {
  const fonte = normalizarTrechoCurriculo(textoOriginal);
  const ids = report.formattedResume.sections.map((section) => section.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("O currículo formatado contém seções duplicadas.");
  }

  const experienciaPresente = /\b(experiencia profissional|experiencia de trabalho|historico profissional|historico de trabalho|professional experience|work experience|employment history|work history)\b/i
    .test(textoOriginal.normalize("NFD").replace(/\p{Diacritic}/gu, ""));
  if (!experienciaPresente && ids.includes("experience")) {
    throw new Error("A experiência profissional não aparece identificada no currículo original.");
  }

  const sections = report.formattedResume.sections
    .map((section) => ({
      ...section,
      entries: section.entries.filter((entry) => {
        const trecho = normalizarTrechoCurriculo(entry);
        return trecho.length >= 3 && fonte.includes(trecho);
      }),
    }))
    .filter((section) => section.entries.length > 0);

  return { ...report, formattedResume: { sections } };
}
