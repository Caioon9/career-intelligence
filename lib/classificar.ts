import { CATEGORIA_POR_SKILL } from "./skills";
import type { Area, Modelo, Nivel, Trilha } from "./types";

// Bordas de palavra que entendem acentos (o \b do JS não entende).
const A = "(?<![\\p{L}\\d])";
const Z = "(?![\\p{L}\\d])";
const palavras = (lista: string[]) => new RegExp(lista.map((p) => A + "(?:" + p + ")" + Z).join("|"), "iu");

const TI_NO_TITULO = palavras([
  "t\\.?\\s?i\\.?", "tic", "tecnologias?", "inform[áa]tica", "computa[çc][ãa]o",
  "desenvolv\\p{L}*", "develop\\p{L}*", "dev", "devs", "programa(?:dor|dora|dor\\(a\\)|[çc][ãa]o)", "software", "sistemas?",
  "front[- ]?end", "back[- ]?end", "full[- ]?stack", "web", "mobile", "android", "ios", "app",
  "dados", "data", "bi", "business intelligence", "analytics", "banco de dados", "dba", "big data",
  "ci[êe]ncia de dados", "cientista de dados", "machine learning", "ml", "ia", "ai", "intelig[êe]ncia artificial",
  "suporte(?: t[ée]cnico| de ti| de sistemas| tecnol\\p{L}*)?", "n[123]", "help ?desk", "service ?desk", "field service",
  "infraestrutura", "infra", "redes", "network\\p{L}*", "telecom", "cloud", "nuvem", "devops", "sre",
  "qa", "tester", "testes?", "quality assurance", "qualidade de software",
  "seguran[çc]a da informa[çc][ãa]o", "ciberseguran[çc]a", "cyber\\p{L}*", "soc",
  "ux", "ui", "ux/ui", "ui/ux", "erp", "sap", "rpa", "automa[çc][ãa]o", "governan[çc]a de ti",
  "engenh(?:eiro|eira|aria)(?:\\(a\\))? de (?:software|dados|computa[çc][ãa]o|sistemas)", "software engineer",
  "python", "java", "javascript", "typescript", "react", "node(?:\\.?js)?", "\\.net", "c#", "php", "sql", "golang", "flutter",
]);

const NIVEIS_ENTRADA: [RegExp, Nivel][] = [
  [palavras(["jovem aprendiz", "menor aprendiz", "aprendiz", "apprentice"]), "aprendiz"],
  [palavras(["est[áa]gi\\p{L}*", "estag\\.?", "estagi[áa]ri[oa@]\\p{L}*", "intern", "internship", "estudante"]), "estagio"],
  [palavras(["trainee", "programa de forma[çc][ãa]o"]), "trainee"],
  [
    palavras([
      "j[úu]nior", "jr\\.?", "junior", "entry[- ]level", "primeiro emprego", "sem experi[êe]ncia",
      "auxiliar", "assistente", "n[íi]vel (?:i|1)", "level (?:i|1)",
      "(?:analista|desenvolvedor|programador|engenheir[oa]|t[ée]cnic[oa]|suporte)(?:\\(a\\))? (?:i|1)",
    ]),
    "junior",
  ],
];

const NAO_ENTRADA = palavras([
  "pleno", "pl", "s[êe]nior", "sr\\.?", "especialista", "coordenador\\p{L}*", "gerente", "l[íi]der", "lead", "head",
  "diretor\\p{L}*", "arquitet[oa]", "staff", "principal", "manager", "supervisor\\p{L}*",
]);

export function ehVagaDeTI(titulo: string): boolean {
  return TI_NO_TITULO.test(titulo);
}

const nivelNoTexto = (texto: string) => NIVEIS_ENTRADA.find(([re]) => re.test(texto))?.[1] ?? null;

/** Retorna o nível de entrada, ou null se a vaga não for para iniciantes. */
export function detectarNivel(titulo: string, descricao: string): Nivel | null {
  // "Júnior/Pleno" conta como júnior: só descarta se não houver nenhum nível de entrada.
  const noTitulo = nivelNoTexto(titulo);
  if (noTitulo) return noTitulo;
  if (NAO_ENTRADA.test(titulo)) return null;

  // Título neutro ("Desenvolvedor Python"): olha a descrição, com termos mais específicos.
  const d = descricao.toLowerCase();
  if (/jovem aprendiz|menor aprendiz|programa de aprendizagem/.test(d)) return "aprendiz";
  if (/vaga de est[aá]gio|bolsa[- ]?aux[ií]lio|estar cursando|cursando (?:o )?ensino superior/.test(d)) return "estagio";
  if (/programa de trainee/.test(d)) return "trainee";
  if (/j[uú]nior|primeiro emprego|sem experi[eê]ncia|n[aã]o exige experi[eê]ncia/.test(d)) return "junior";
  return null;
}

const HIBRIDO = palavras([
  "h[íi]brid[oa]", "hybrid", "modelo misto", "semipresencial", "semi[- ]presencial",
  // remoto só em alguns dias, ou benefício de home office numa vaga com escritório
  "(?:remot[oa]|home[- ]?office)s? (?:[àa]s|nas|aos|às) (?:segundas?|ter[çc]as?|quartas?|quintas?|sextas?)(?:-feiras?)?",
  "\\d+ ?x? ?dias? (?:presenciais|presencial|remotos?|de home[- ]?office|em home[- ]?office|no escrit[óo]rio)",
  "(?:aux[íi]lio|ajuda de custo|vale)(?: de)? home[- ]?office",
]);

// "Acesso remoto", "suporte remoto" etc. descrevem a tarefa, não o modelo de trabalho.
const REMOTO_TECNICO =
  /(acesso|suporte|atendimento|assist[eê]ncia|conex[aã]o|monitoramento|gerenciamento|ferramentas?|[áa]rea de trabalho|controle|manuten[cç][aã]o|instala[cç][aã]o|configura[cç][aã]o|administra[cç][aã]o)\s+(?:de\s+|em\s+|via\s+)?remot[oa]s?|presencial e remot[oa]|remot[oa] e presencial|remote (?:desktop|access|support)/giu;

const REMOTO = palavras([
  "remot[oa]s?", "remote", "home[- ]?office", "teletrabalho", "anywhere", "work from home", "wfh",
  "trabalho (?:a|à) dist[âa]ncia", "trabalho de casa", "100% online", "full[- ]remote", "anywhere office",
]);

export function detectarModelo(titulo: string, descricao: string, remotoNaApi = false): Modelo {
  const texto = titulo + " " + descricao.replace(REMOTO_TECNICO, " ");
  if (HIBRIDO.test(texto)) return "hibrido";
  if (remotoNaApi || REMOTO.test(texto)) return "remoto";
  return "presencial";
}

const AREA_POR_TITULO: [RegExp, Area][] = [
  [/full[- ]?stack/i, "fullstack"],
  [/front[- ]?end|\bui\b|web designer/i, "frontend"],
  [/back[- ]?end|\bapi\b/i, "backend"],
  [/mobile|android|ios|flutter/i, "mobile"],
  [/dados|\bdata\b|\bbi\b|business intelligence|analytics/i, "dados"],
  [/\.net|\bjava\b|python|php|node|c#|golang|ruby/i, "backend"],
  [/\bqa\b|qualidade|testes/i, "qa"],
  [/devops|cloud|\bsre\b/i, "devops"],
  [/seguran[çc]a|ciber|cyber/i, "seguranca"],
  [/suporte|help ?desk|service desk|infra|redes|inform[áa]tica/i, "infra"],
];

const AREA_POR_CATEGORIA: Record<string, Area> = {
  "Front-end": "frontend",
  "Back-end": "backend",
  Mobile: "mobile",
  Dados: "dados",
  "Qualidade (QA)": "qa",
  "DevOps & Cloud": "devops",
  Segurança: "seguranca",
  Infraestrutura: "infra",
};

export function detectarArea(titulo: string, skills: string[]): Area {
  for (const [re, area] of AREA_POR_TITULO) if (re.test(titulo)) return area;

  const contagem = new Map<Area, number>();
  for (const s of skills) {
    const area = AREA_POR_CATEGORIA[CATEGORIA_POR_SKILL[s]];
    if (area) contagem.set(area, (contagem.get(area) ?? 0) + 1);
  }
  const front = contagem.get("frontend") ?? 0;
  const back = contagem.get("backend") ?? 0;
  if (front >= 2 && back >= 2) return "fullstack";
  const [melhor] = [...contagem.entries()].sort((a, b) => b[1] - a[1]);
  return melhor?.[0] ?? "geral";
}

// Títulos de quem escreve código no dia a dia (inclui engenharia de dados).
const DESENVOLVIMENTO = palavras([
  "desenvolv\\p{L}*", "develop\\p{L}*", "programa(?:dor|dora|dor\\(a\\)|[çc][ãa]o)", "dev", "devs", "software",
  "engenh(?:eiro|eira|aria)(?:\\(a\\))? de (?:software|dados|computa[çc][ãa]o|sistemas)", "software engineer",
  "data engineer", "engenheir[oa] de dados", "front[- ]?end", "back[- ]?end", "full[- ]?stack",
  "mobile", "android", "ios", "flutter",
]);

const TRILHA_POR_AREA: Record<Area, Trilha> = {
  frontend: "desenvolvimento",
  backend: "desenvolvimento",
  fullstack: "desenvolvimento",
  mobile: "desenvolvimento",
  dados: "dados",
  infra: "infra",
  qa: "qa",
  devops: "devops",
  seguranca: "seguranca",
  geral: "outros",
};

export function detectarTrilha(titulo: string, area: Area): Trilha {
  return DESENVOLVIMENTO.test(titulo) ? "desenvolvimento" : TRILHA_POR_AREA[area];
}

export function limparHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
