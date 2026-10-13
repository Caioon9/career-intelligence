/**
 * Dicionário de skills usado para extrair requisitos das descrições.
 * É gratuito e determinístico; na etapa do roadmap a IA complementa o que
 * o dicionário não pegar.
 */
interface SkillDef {
  nome: string;
  categoria: string;
  aliases: string[];
}

const SKILLS: SkillDef[] = [
  // Linguagens
  { nome: "JavaScript", categoria: "Linguagens", aliases: ["javascript", "js", "es6"] },
  { nome: "TypeScript", categoria: "Linguagens", aliases: ["typescript", "ts"] },
  { nome: "Python", categoria: "Linguagens", aliases: ["python"] },
  { nome: "Java", categoria: "Linguagens", aliases: ["java"] },
  { nome: "C#", categoria: "Linguagens", aliases: ["c#", "csharp", "c sharp"] },
  { nome: "C++", categoria: "Linguagens", aliases: ["c++"] },
  { nome: "C", categoria: "Linguagens", aliases: ["linguagem c"] },
  { nome: "PHP", categoria: "Linguagens", aliases: ["php"] },
  { nome: "Go", categoria: "Linguagens", aliases: ["golang", "linguagem go"] },
  { nome: "Kotlin", categoria: "Linguagens", aliases: ["kotlin"] },
  { nome: "Swift", categoria: "Linguagens", aliases: ["swift"] },
  { nome: "Dart", categoria: "Linguagens", aliases: ["dart"] },
  { nome: "Ruby", categoria: "Linguagens", aliases: ["ruby", "rails", "ruby on rails"] },
  { nome: "SQL", categoria: "Banco de dados", aliases: ["sql"] },

  // Front-end
  { nome: "HTML", categoria: "Front-end", aliases: ["html", "html5"] },
  { nome: "CSS", categoria: "Front-end", aliases: ["css", "css3", "sass", "scss"] },
  { nome: "React", categoria: "Front-end", aliases: ["react", "react.js", "reactjs"] },
  { nome: "Angular", categoria: "Front-end", aliases: ["angular"] },
  { nome: "Vue.js", categoria: "Front-end", aliases: ["vue", "vue.js", "vuejs"] },
  { nome: "Next.js", categoria: "Front-end", aliases: ["next.js", "nextjs"] },
  { nome: "Tailwind", categoria: "Front-end", aliases: ["tailwind", "tailwindcss"] },

  // Back-end
  { nome: "Node.js", categoria: "Back-end", aliases: ["node", "node.js", "nodejs"] },
  { nome: "Spring", categoria: "Back-end", aliases: ["spring", "spring boot"] },
  { nome: ".NET", categoria: "Back-end", aliases: [".net", "dotnet", "asp.net"] },
  { nome: "Django", categoria: "Back-end", aliases: ["django"] },
  { nome: "Flask/FastAPI", categoria: "Back-end", aliases: ["flask", "fastapi"] },
  { nome: "Laravel", categoria: "Back-end", aliases: ["laravel"] },
  { nome: "NestJS", categoria: "Back-end", aliases: ["nestjs", "nest.js"] },
  { nome: "APIs REST", categoria: "Back-end", aliases: ["api rest", "apis rest", "restful", "rest api", "apis"] },
  { nome: "GraphQL", categoria: "Back-end", aliases: ["graphql"] },
  { nome: "Microsserviços", categoria: "Back-end", aliases: ["microsserviços", "microservices", "microsservicos"] },

  // Mobile
  { nome: "React Native", categoria: "Mobile", aliases: ["react native"] },
  { nome: "Flutter", categoria: "Mobile", aliases: ["flutter"] },
  { nome: "Android", categoria: "Mobile", aliases: ["android"] },
  { nome: "iOS", categoria: "Mobile", aliases: ["ios"] },

  // Banco de dados
  { nome: "MySQL", categoria: "Banco de dados", aliases: ["mysql"] },
  { nome: "PostgreSQL", categoria: "Banco de dados", aliases: ["postgresql", "postgres"] },
  { nome: "SQL Server", categoria: "Banco de dados", aliases: ["sql server", "sqlserver"] },
  { nome: "Oracle", categoria: "Banco de dados", aliases: ["oracle", "pl/sql"] },
  { nome: "MongoDB", categoria: "Banco de dados", aliases: ["mongodb", "mongo"] },

  // Dados
  { nome: "Excel", categoria: "Dados", aliases: ["excel"] },
  { nome: "Power BI", categoria: "Dados", aliases: ["power bi", "powerbi"] },
  { nome: "Tableau", categoria: "Dados", aliases: ["tableau"] },
  { nome: "Pandas", categoria: "Dados", aliases: ["pandas"] },
  { nome: "Machine Learning", categoria: "Dados", aliases: ["machine learning", "aprendizado de máquina"] },
  { nome: "ETL", categoria: "Dados", aliases: ["etl"] },
  { nome: "Estatística", categoria: "Dados", aliases: ["estatística", "estatistica"] },

  // DevOps / Cloud
  { nome: "Git", categoria: "Ferramentas", aliases: ["git", "github", "gitlab", "versionamento"] },
  { nome: "Docker", categoria: "DevOps & Cloud", aliases: ["docker", "containers"] },
  { nome: "Kubernetes", categoria: "DevOps & Cloud", aliases: ["kubernetes", "k8s"] },
  { nome: "AWS", categoria: "DevOps & Cloud", aliases: ["aws", "amazon web services"] },
  { nome: "Azure", categoria: "DevOps & Cloud", aliases: ["azure"] },
  { nome: "Google Cloud", categoria: "DevOps & Cloud", aliases: ["gcp", "google cloud"] },
  { nome: "CI/CD", categoria: "DevOps & Cloud", aliases: ["ci/cd", "pipelines", "github actions", "jenkins"] },
  { nome: "Linux", categoria: "Infraestrutura", aliases: ["linux", "shell script", "bash"] },

  // Infra / suporte
  { nome: "Redes", categoria: "Infraestrutura", aliases: ["redes", "tcp/ip", "networking", "cabeamento"] },
  { nome: "Windows Server", categoria: "Infraestrutura", aliases: ["windows server", "active directory"] },
  { nome: "Hardware", categoria: "Infraestrutura", aliases: ["hardware", "manutenção de computadores", "montagem de computadores"] },
  { nome: "Help Desk", categoria: "Infraestrutura", aliases: ["help desk", "helpdesk", "service desk", "suporte técnico", "atendimento n1"] },
  { nome: "ITIL", categoria: "Infraestrutura", aliases: ["itil"] },
  { nome: "Office 365", categoria: "Infraestrutura", aliases: ["office 365", "microsoft 365", "pacote office"] },

  // QA
  { nome: "Testes automatizados", categoria: "Qualidade (QA)", aliases: ["testes automatizados", "automação de testes", "testes unitários", "tdd"] },
  { nome: "Cypress", categoria: "Qualidade (QA)", aliases: ["cypress"] },
  { nome: "Selenium", categoria: "Qualidade (QA)", aliases: ["selenium"] },
  { nome: "Jest", categoria: "Qualidade (QA)", aliases: ["jest"] },

  // Segurança
  { nome: "Segurança da informação", categoria: "Segurança", aliases: ["segurança da informação", "cibersegurança", "cybersecurity", "pentest"] },

  // Metodologias
  { nome: "Metodologias ágeis", categoria: "Metodologias", aliases: ["scrum", "kanban", "metodologias ágeis", "metodologia ágil", "agile"] },
  { nome: "Jira", categoria: "Metodologias", aliases: ["jira"] },

  // Idiomas
  { nome: "Inglês", categoria: "Idiomas", aliases: ["inglês", "ingles", "english"] },
  { nome: "Espanhol", categoria: "Idiomas", aliases: ["espanhol"] },
];

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Uma regex por skill, com "bordas" que funcionam para C#, C++, .NET etc.
const REGEX = SKILLS.map((s) => ({
  def: s,
  re: new RegExp(
    `(?<![\\p{L}\\d])(?:${s.aliases.map(escapar).join("|")})(?![\\p{L}\\d+#])`,
    "iu",
  ),
}));

export const CATEGORIA_POR_SKILL: Record<string, string> = Object.fromEntries(
  SKILLS.map((s) => [s.nome, s.categoria]),
);

export const TODAS_SKILLS = SKILLS.map((s) => s.nome);

export function extrairSkills(texto: string): string[] {
  const achadas = REGEX.filter(({ re }) => re.test(texto)).map(({ def }) => def.nome);
  // "React Native" também casa "React"; só mantém React se aparecer sozinho.
  if (achadas.includes("React Native") && achadas.includes("React")) {
    const semNative = texto.replace(/react native/gi, "");
    if (!REGEX.find((r) => r.def.nome === "React")!.re.test(semNative)) {
      return achadas.filter((s) => s !== "React");
    }
  }
  return achadas;
}
