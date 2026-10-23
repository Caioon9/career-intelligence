# Primeira Vaga em TI

Encontrar a primeira vaga em tecnologia é difícil: as oportunidades de **estágio, jovem aprendiz, trainee e júnior** ficam espalhadas por dezenas de sites, misturadas com vagas pleno/sênior, e quem está começando não sabe o que estudar para ser chamado.

Este projeto junta essas vagas num lugar só, filtra pelo seu perfil e pela distância de onde você mora, e mostra **o que as empresas mais estão pedindo**, para você saber onde focar os estudos.

> Projeto em desenvolvimento (MVP). Por enquanto cobre a **Grande São Paulo**, além de vagas remotas.

## O que ele faz

- **Busca vagas reais** de entrada em TI no Google for Jobs (que reúne LinkedIn, Indeed, Glassdoor, Gupy e outros).
- **Filtra só o que interessa**: vagas de tecnologia, de nível de entrada. Pleno, sênior e vagas de outras áreas ficam de fora.
- **Mostra a distância** de cada vaga até você (pela cidade ou pelo CEP) e permite filtrar por raio de até 100 km.
- **Separa presencial, híbrido e remoto.**
- **Lista os requisitos de cada vaga** (linguagens, ferramentas, idiomas...) e marca em verde o que você já sabe.
- **Calcula a compatibilidade** entre você e cada vaga.
- **Mostra os requisitos mais pedidos** no conjunto das vagas, ex.: "32% pedem Git", com uma prioridade de estudo.
- **Analisa currículos em PDF ou DOCX** com a API da Groq e permite salvar o relatório em PDF.
- **Organiza o texto original do currículo** em seções e permite baixar o currículo em PDF sem inventar experiências ou outras informações.

### Próximos passos

- Roadmap de estudos gerado por IA a partir dos requisitos das vagas.

## Como usar

### 1. Pré-requisitos

- [Node.js](https://nodejs.org/) **24** (ou 22.13+), que já traz o SQLite embutido, sem instalar banco de dados.
- Uma conta gratuita na [RapidAPI](https://rapidapi.com), para as vagas reais (opcional: sem ela, o app mostra vagas de exemplo).

### 2. Instalar e rodar

```bash
git clone <url-deste-repositorio>
cd vagas-ti
npm install
npm run dev
```

Abra http://localhost:3000.

### 3. Ativar as vagas reais (gratuito)

1. Na [RapidAPI](https://rapidapi.com), procure a API **JSearch** e assine o plano **Basic** (gratuito).
2. Copie o arquivo `.env.example` para `.env.local`.
3. Cole a sua chave (`X-RapidAPI-Key`) em `RAPIDAPI_KEY`.
4. Reinicie o `npm run dev`.

> O `.env.local` é ignorado pelo Git. **Nunca coloque a chave em outro arquivo.**

### 4. Ativar a análise de currículos

1. Crie uma chave de API na [Groq Console](https://console.groq.com/keys).
2. Configure `GROQ_API_KEY` no `.env.local`; opcionalmente escolha o modelo principal com `GROQ_MODEL` (padrão: `openai/gpt-oss-120b`) e uma lista de modelos alternativos em `GROQ_FALLBACK_MODELS`, separados por vírgula (padrão: `openai/gpt-oss-20b,qwen/qwen3.8-27b`).
3. `CURRICULO_MAX_UPLOAD_MB` controla o limite de upload (padrão: 5 MB; o máximo aceito é 5 MB).
4. Reinicie o servidor e abra **Analisar currículo** na página inicial.

Se o modelo principal estiver indisponível, limitado, retornar erro temporário ou uma resposta fora do formato esperado, o servidor tenta até dois fallbacks em sequência (no máximo três modelos por análise). Erros de autenticação e de solicitação não repetem a chamada. Configure apenas IDs de modelos disponíveis na sua conta Groq.

O arquivo é processado em memória pelo servidor e não é armazenado. Após consentimento, o texto extraído e a descrição de vaga fornecida são enviados à Groq para análise. O texto é limitado antes do envio; os registros do servidor não incluem o conteúdo do currículo. A extração tenta o parser PDF atual e usa um parser legado como alternativa para documentos incompatíveis; PDFs protegidos por senha precisam ser desbloqueados antes do envio. PDFs digitalizados que precisem de OCR não são analisados. A limitação de requisições é local ao processo e não substitui controles de infraestrutura em implantações com múltiplas instâncias. Este fluxo não constitui declaração de conformidade integral com a LGPD.

O currículo reorganizado usa somente trechos literais verificados no texto extraído; trechos que não puderem ser confirmados são omitidos, sem invalidar o restante da análise. Notas por categoria podem aparecer como “Sem nota” quando não houver evidência suficiente. O currículo também omite informações ausentes e a seção de experiência quando não há uma seção profissional explícita no documento. A organização prioriza estágio e nível júnior, com perfil e contato, formação, certificados, cursos, experiência (se houver), projetos, conhecimentos e informações adicionais, nessa ordem; busca ser concisa, idealmente em uma página e limitada a duas, com títulos claros e leitura adequada por ATS. Sugestões sobre dados que poderiam fortalecer o documento aparecem no plano de ação, sem serem inseridas como fatos no currículo. Os exemplos são apenas referências de apresentação: seus nomes, contatos, empresas, datas e resultados nunca são reutilizados. O currículo e o relatório são gerados no servidor do aplicativo como arquivos PDF baixados diretamente, sem abrir a janela de impressão ou armazenar os documentos.

### 5. Usando o site

1. Digite sua **cidade ou CEP** e escolha a **distância máxima**.
2. Escolha os **tipos de vaga**, o **modelo de trabalho** e as **áreas de interesse**.
3. Abra **"O que você já sabe"** e marque as tecnologias que você conhece, para ver a compatibilidade com cada vaga.
4. Clique em **Buscar vagas**. Seu perfil fica salvo no navegador.

## Como funciona

```
                     a cada 48 h, por região
JSearch (Google Jobs) ───────────────────────► banco SQLite (.data/vagas.db)
                                                      │
 você pesquisa ───► cidade/CEP → coordenadas          ▼
                                     classificar (é TI? nível? remoto?) ─► distância ─► filtros do perfil ─► tela
```

- **Busca por região, não por pessoa.** A API é consultada para a região inteira (hoje, a Grande São Paulo) e tudo vai para um banco local. Cada pesquisa no site lê do banco e calcula a distância até você, então mudar de cidade (dentro da região) ou de raio não gasta cota.
- **Atualização a cada 48 h.** Depois disso, a próxima pesquisa atualiza a região (5 chamadas à API).
- **Sem duplicadas.** Vaga que já está no banco (mesmo id, ou mesmo título + empresa + local) não é salva de novo, só tem a data de "vista" atualizada. Vaga que some da API por mais de 48 h deixa de aparecer.
- **Fora da região atendida**, o site mostra só as vagas remotas e não chama a API.

### Cota gratuita

O plano gratuito da JSearch tem um limite mensal de chamadas (200). Para nunca passar dele:

- o app conta as chamadas do mês (`.cache/jsearch-cota.json`) e **para de chamar a API** ao atingir `JSEARCH_LIMITE_MENSAL` (padrão 200);
- o uso aparece na tela, ao lado do número de vagas.

### Estrutura

| Arquivo | Responsabilidade |
| --- | --- |
| `lib/buscar.ts` | Orquestra tudo: regiões atendidas, termos de busca, filtros, compatibilidade, requisitos mais pedidos |
| `lib/db.ts` | Banco SQLite: vagas salvas e última atualização de cada região |
| `lib/fontes/jsearch.ts` | Chamada à JSearch, com trava de cota mensal |
| `lib/fontes/exemplo.ts` | Vagas fictícias, usadas quando não há chave |
| `lib/classificar.ts` | É vaga de TI? Qual nível? Presencial, híbrido ou remoto? Qual área? |
| `lib/skills.ts` | Dicionário de ~75 tecnologias com sinônimos; extrai os requisitos das descrições |
| `lib/geo.ts` | CEP → cidade (ViaCEP), cidade → coordenadas (Nominatim/OpenStreetMap), distância |
| `app/api/vagas/route.ts` | Endpoint `GET /api/vagas` |
| `app/page.tsx` | Interface |
| `app/curriculo/page.tsx` | Envio do currículo e relatório de análise |
| `app/api/curriculo/analisar/route.ts` | Validação do upload e endpoint da análise |
| `lib/curriculo/` | Extração de texto, validação e integração de servidor com a Groq |

### Adicionando uma região

Inclua um item em `REGIOES`, em `lib/buscar.ts`, com o nome, o texto usado na busca, o centro (lat/lon) e o alcance em km.

## Dados e privacidade

- O perfil (cidade, preferências, tecnologias) fica salvo só no seu navegador. Para calcular distâncias, a cidade ou o CEP digitado é enviado ao ViaCEP e ao OpenStreetMap (Nominatim).
- A chave da API fica no `.env.local` e é usada apenas no servidor; ela nunca é enviada ao navegador.
- O banco (`.data/`) e os caches (`.cache/`) ficam só na sua máquina e não vão para o repositório.

## Limitações conhecidas

- A busca por região prioriza a capital: cidades como Mogi das Cruzes e o ABC aparecem menos.
- O dicionário de tecnologias não reconhece tudo; o roadmap com IA vai complementar essa extração.
- A primeira pesquisa numa cidade nova pode levar alguns segundos (o serviço de mapas aceita 1 consulta por segundo; depois fica em cache).

## Tecnologias

Next.js 15, React 19, TypeScript, Tailwind CSS 4 e SQLite (`node:sqlite`).
