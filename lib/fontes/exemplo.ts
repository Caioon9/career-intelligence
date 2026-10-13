import type { VagaBruta } from "./tipos";

/**
 * Vagas fictícias para o app funcionar sem chave de API.
 * Empresas e links são inventados.
 */
const C = {
  sp: { local: "São Paulo, SP", lat: -23.5505, lon: -46.6333 },
  campinas: { local: "Campinas, SP", lat: -22.9056, lon: -47.0608 },
  jundiai: { local: "Jundiaí, SP", lat: -23.1857, lon: -46.8978 },
  santoAndre: { local: "Santo André, SP", lat: -23.6639, lon: -46.5383 },
  sorocaba: { local: "Sorocaba, SP", lat: -23.5015, lon: -47.4526 },
  rio: { local: "Rio de Janeiro, RJ", lat: -22.9068, lon: -43.1729 },
  bh: { local: "Belo Horizonte, MG", lat: -19.9167, lon: -43.9345 },
  curitiba: { local: "Curitiba, PR", lat: -25.4284, lon: -49.2733 },
  floripa: { local: "Florianópolis, SC", lat: -27.5954, lon: -48.548 },
  poa: { local: "Porto Alegre, RS", lat: -30.0346, lon: -51.2177 },
  recife: { local: "Recife, PE", lat: -8.0476, lon: -34.877 },
  brasilia: { local: "Brasília, DF", lat: -15.7939, lon: -47.8828 },
  remoto: { local: "Remoto (Brasil)" },
};

type Dados = [titulo: string, empresa: string, cidade: keyof typeof C, diasAtras: number, descricao: string, salario?: string];

const DADOS: Dados[] = [
  ["Estágio em Desenvolvimento Front-end", "Pixel Norte Software", "sp", 2,
    "Buscamos estudante de Ciência da Computação ou ADS para atuar com React, TypeScript, HTML e CSS. Desejável conhecimento em Git e Next.js. Modelo híbrido, 3x por semana no escritório. Bolsa-auxílio + VR.", "R$ 2.200"],
  ["Estágio em Desenvolvimento Back-end", "Rota Logística Digital", "campinas", 5,
    "Atuação no desenvolvimento de APIs REST com Node.js e PostgreSQL. Conhecimento em Git, Docker é diferencial. Inglês intermediário. Presencial.", "R$ 1.900"],
  ["Desenvolvedor(a) Júnior Java", "Banco Aurora", "sp", 1,
    "Desenvolvimento de microsserviços com Java e Spring Boot, banco de dados SQL Server, versionamento com Git, CI/CD com Jenkins. Metodologias ágeis (Scrum). Híbrido.", "R$ 4.500"],
  ["Jovem Aprendiz em TI", "Grupo Vale Verde", "jundiai", 3,
    "Programa Jovem Aprendiz para apoio ao time de suporte técnico: atendimento N1, instalação de softwares, Pacote Office, noções de hardware e redes. Ensino médio em andamento ou concluído.", "R$ 1.100"],
  ["Analista de Suporte Júnior (Help Desk)", "ServiçoTech Soluções", "santoAndre", 8,
    "Atendimento a usuários via service desk, Windows Server, Active Directory, Office 365, redes TCP/IP. Desejável ITIL. Presencial.", "R$ 2.800"],
  ["Estágio em Dados / BI", "Mercado Bom Preço", "sp", 4,
    "Apoio na construção de dashboards em Power BI, consultas SQL e tratamento de dados em Excel e Python (Pandas). Estatística básica. Híbrido.", "R$ 2.000"],
  ["Desenvolvedor(a) Full Stack Júnior", "Nuvem Clara Tecnologia", "remoto", 6,
    "100% remoto. Stack: React, Node.js, TypeScript, PostgreSQL, Docker, AWS. Experiência com Git e testes automatizados com Jest. Inglês técnico.", "R$ 5.000"],
  ["Estágio em QA (Qualidade de Software)", "AppFácil", "curitiba", 10,
    "Escrita de casos de teste, automação de testes com Cypress, apoio em testes de APIs REST. Conhecimento em JavaScript e Jira. Híbrido."],
  ["Trainee de Tecnologia 2027", "Energia Sul", "poa", 12,
    "Programa trainee para recém-formados em cursos de tecnologia. Rotação entre áreas de dados, cloud (Azure) e desenvolvimento (C#, .NET). Inglês avançado.", "R$ 6.000"],
  ["Estágio em Desenvolvimento Mobile", "Saúde em Mãos", "bh", 7,
    "Desenvolvimento de app em Flutter e Dart, integração com APIs REST e Firebase. Git. Presencial em BH."],
  ["Desenvolvedor(a) Python Júnior", "DataFlow Analytics", "floripa", 2,
    "Desenvolvimento de pipelines ETL com Python, SQL e AWS. Desejável Django ou FastAPI e Docker. Modelo híbrido.", "R$ 4.200"],
  ["Estágio em Infraestrutura e Cloud", "Conecta Telecom", "rio", 9,
    "Apoio na administração de servidores Linux, redes, Docker e Kubernetes. Noções de AWS ou Azure. Presencial."],
  ["Desenvolvedor(a) Front-end Júnior", "Loja Vitrine Online", "remoto", 3,
    "Trabalho remoto. React, Next.js, Tailwind, TypeScript. Consumo de APIs REST e GraphQL. Git e metodologias ágeis.", "R$ 4.000"],
  ["Estágio em Segurança da Informação", "Cofre Digital", "brasilia", 15,
    "Apoio ao time de segurança da informação: monitoramento, gestão de vulnerabilidades, noções de redes e Linux. Inglês intermediário."],
  ["Jovem Aprendiz - Desenvolvimento Web", "Escola Futuro Tech", "recife", 6,
    "Aprendiz para apoio no desenvolvimento de sites com HTML, CSS e JavaScript. Ensino médio em curso.", "R$ 950"],
  ["Desenvolvedor(a) PHP Júnior", "AgênciaWeb Sorocaba", "sorocaba", 11,
    "Manutenção de sistemas em PHP com Laravel e MySQL. HTML, CSS, JavaScript e Git. Presencial."],
  ["Estágio em Desenvolvimento .NET", "Sistemas Integrados Campinas", "campinas", 1,
    "Desenvolvimento com C# e .NET, SQL Server, Git. Desejável Angular. Híbrido em Campinas.", "R$ 2.100"],
  ["Analista de Dados Júnior", "Fintech Semente", "remoto", 5,
    "Remoto. SQL avançado, Python, Power BI, estatística. Desejável Machine Learning e Google Cloud.", "R$ 4.800"],
];

const hoje = Date.now();

export const VAGAS_EXEMPLO: VagaBruta[] = DADOS.map(([titulo, empresa, cidade, dias, descricao, salario], i) => {
  const c = C[cidade] as { local: string; lat?: number; lon?: number };
  return {
    idExterno: `ex-${i}`,
    titulo,
    empresa,
    local: c.local,
    lat: c.lat,
    lon: c.lon,
    descricao: cidade === "remoto" && !/remot/i.test(descricao) ? `${descricao} Remoto.` : descricao,
    url: "#",
    fonte: "exemplo",
    publicadaEm: new Date(hoje - dias * 86_400_000).toISOString(),
    salario,
  };
});
