import { ehBigTech } from "./bigtechs";
import { detectarArea, detectarModelo, detectarNivel, detectarTrilha, ehVagaDeTI, limparHtml } from "./classificar";
import { fonteEmpresas } from "./fontes/empresas";
import { VAGAS_EXEMPLO } from "./fontes/exemplo";
import { fonteGupy } from "./fontes/gupy";
import { fonteJSearch, jsearchConfigurada, usoDaCota } from "./fontes/jsearch";
import type { FonteDeVagas, RegiaoBusca, VagaBruta } from "./fontes/tipos";
import { marcarRegiaoAtualizada, regiaoAtualizadaEm, salvarVagas, vagasVistasDesde } from "./db";
import { type Coordenadas, distanciaKm, geocodificar } from "./geo";
import { CATEGORIA_POR_SKILL, extrairSkills } from "./skills";
import type { Area, Perfil, RespostaVagas, SkillFrequencia, Vaga, VagaResultado } from "./types";

/**
 * Regiões atendidas. A API é consultada pela região inteira e tudo vai para o
 * banco; a distância até a pessoa é calculada no site. Por enquanto, só a
 * Grande São Paulo.
 */
interface Regiao extends RegiaoBusca {
  centro: { lat: number; lon: number };
  alcanceKm: number; // quem pesquisa até essa distância do centro usa esta região
}

const REGIOES: Regiao[] = [
  {
    nome: "Grande São Paulo",
    consulta: "São Paulo, SP",
    estado: "São Paulo",
    centro: { lat: -23.5505, lon: -46.6333 },
    alcanceKm: 70,
  },
];

export const RAIO_MAXIMO_KM = 100;
// A Gupy informa só a cidade; cada cidade nova vira coordenadas uma vez (1 por segundo) e fica em cache.
const MAX_GEOCODIFICACOES_POR_BUSCA = 40;
// Região atualizada há mais que isso volta à API; vaga não vista há mais que isso é considerada encerrada.
const VALIDADE_HORAS = 48;

// Fontes de vagas. Cada uma é independente: se uma falhar, as outras continuam.
const FONTES: FonteDeVagas[] = [fonteJSearch, fonteGupy, fonteEmpresas];

function classificar(b: VagaBruta): Vaga | null {
  const descricao = limparHtml(b.descricao);
  const titulo = limparHtml(b.titulo);
  if (!ehVagaDeTI(titulo)) return null;
  // Se a fonte já informa o nível (a Gupy informa), ele vale mais que a dedução pelo texto.
  const nivel = b.nivel ?? detectarNivel(titulo, descricao);
  if (!nivel) return null;

  const texto = `${titulo} ${descricao}`;
  const skills = extrairSkills(texto);
  const area = detectarArea(titulo, skills);
  return {
    id: `${b.fonte}-${b.idExterno}`,
    titulo,
    empresa: b.empresa,
    local: b.local,
    lat: b.lat,
    lon: b.lon,
    modelo: b.modelo ?? detectarModelo(titulo, descricao, b.remoto ?? /^remot/i.test(b.local)),
    nivel,
    area,
    trilha: detectarTrilha(titulo, area),
    descricao,
    url: b.url,
    fonte: b.fonte,
    publicadaEm: b.publicadaEm,
    salario: b.salario,
    skills,
  };
}

const normalizar = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

function removerDuplicadas(vagas: Vaga[]) {
  const vistas = new Set<string>();
  return vagas.filter((v) => {
    const chave = `${normalizar(v.titulo)}|${normalizar(v.empresa)}|${normalizar(v.local)}`;
    if (vistas.has(chave)) return false;
    vistas.add(chave);
    return true;
  });
}

function areaCombina(area: Area, preferidas: Area[]) {
  if (preferidas.length === 0 || preferidas.includes(area)) return 1;
  if (area === "fullstack" && (preferidas.includes("frontend") || preferidas.includes("backend"))) return 1;
  if ((area === "frontend" || area === "backend") && preferidas.includes("fullstack")) return 1;
  return area === "geral" ? 0.6 : 0.2;
}

function calcularResultado(v: Vaga, perfil: Perfil, origem: { lat: number; lon: number } | null): VagaResultado {
  const sabe = new Set(perfil.skills.map((s) => s.toLowerCase()));
  const skillsQueSabe = v.skills.filter((s) => sabe.has(s.toLowerCase()));
  const skillsQueFaltam = v.skills.filter((s) => !sabe.has(s.toLowerCase()));
  // Sem skills marcadas não dá para medir compatibilidade; vaga sem requisitos detectados vale pouco.
  const notaSkills = v.skills.length ? skillsQueSabe.length / v.skills.length : 0.2;
  const match = perfil.skills.length
    ? Math.round(100 * (0.4 * areaCombina(v.area, perfil.areas) + 0.6 * notaSkills))
    : null;

  const distancia =
    origem && v.lat != null && v.lon != null && v.modelo !== "remoto"
      ? Math.round(distanciaKm(origem, { lat: v.lat, lon: v.lon }))
      : undefined;

  return { ...v, distanciaKm: distancia, match, skillsQueSabe, skillsQueFaltam };
}

function requisitosMaisPedidos(vagas: VagaResultado[], perfil: Perfil): SkillFrequencia[] {
  const contagem = new Map<string, number>();
  for (const v of vagas) for (const s of v.skills) contagem.set(s, (contagem.get(s) ?? 0) + 1);
  const sabe = new Set(perfil.skills.map((s) => s.toLowerCase()));
  return [...contagem.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([skill, n]) => ({
      skill,
      categoria: CATEGORIA_POR_SKILL[skill] ?? "Outros",
      vagas: n,
      percentual: Math.round((100 * n) / vagas.length),
      sabe: sabe.has(skill.toLowerCase()),
    }));
}

/** Completa lat/lon das vagas presenciais/híbridas que vieram sem coordenadas, pelo nome da cidade. */
async function completarCoordenadas(vagas: VagaBruta[]) {
  const semCoord = vagas.filter((v) => v.lat == null && v.local && !(v.remoto ?? /^remot/i.test(v.local)));
  const locais = [...new Set(semCoord.map((v) => v.local))].slice(0, MAX_GEOCODIFICACOES_POR_BUSCA);
  for (const local of locais) {
    const c = await geocodificar(local);
    if (c) for (const v of semCoord) if (v.local === local) Object.assign(v, { lat: c.lat, lon: c.lon });
  }
}

// Se duas pessoas pedirem a mesma região ao mesmo tempo, só uma busca vai à API.
const mapeandoAgora = new Map<string, Promise<string[]>>();

/** Busca a região na API e salva no banco. Devolve os avisos (falhas, cota). */
function atualizarRegiao(regiao: Regiao, fontes: typeof FONTES): Promise<string[]> {
  const emAndamento = mapeandoAgora.get(regiao.nome);
  if (emAndamento) return emAndamento;

  const tarefa = (async () => {
    // Todas as fontes ao mesmo tempo; cada uma cuida dos próprios termos e pausas.
    const resultados = await Promise.allSettled(fontes.map((f) => f.coletar(regiao)));

    const brutas: VagaBruta[] = [];
    const falhas: string[] = [];
    resultados.forEach((r, i) => {
      if (r.status === "fulfilled") {
        brutas.push(...r.value.vagas);
        falhas.push(...r.value.falhas);
      } else falhas.push(`Falha ao buscar em ${fontes[i].nome}: ${(r.reason as Error).message}`);
    });

    await completarCoordenadas(brutas);
    const agora = Date.now();
    salvarVagas(brutas, agora);
    // Só marca a região como atualizada se ao menos uma busca deu certo.
    if (resultados.some((r) => r.status === "fulfilled")) marcarRegiaoAtualizada(regiao.nome, agora);
    return falhas;
  })();

  mapeandoAgora.set(regiao.nome, tarefa);
  return tarefa.finally(() => mapeandoAgora.delete(regiao.nome));
}

function filtrarPeloPerfil(brutas: VagaBruta[], perfil: Perfil, origem: Coordenadas | null) {
  return removerDuplicadas(brutas.map(classificar).filter((v): v is Vaga => v !== null))
    .map((v) => calcularResultado(v, perfil, origem))
    .filter((v) => perfil.niveis.length === 0 || perfil.niveis.includes(v.nivel))
    .filter((v) => perfil.modelos.length === 0 || perfil.modelos.includes(v.modelo))
    .filter((v) => perfil.trilhas.length === 0 || perfil.trilhas.includes(v.trilha))
    .filter((v) => !perfil.soBigTechs || ehBigTech(v.empresa));
}

export async function buscarVagas(perfil: Perfil): Promise<RespostaVagas> {
  const avisos: string[] = [];
  const ativas = FONTES.filter((f) => f.ativa());
  const origem = perfil.local ? await geocodificar(perfil.local) : null;

  // Sem API configurada: vagas de exemplo, como antes.
  if (ativas.length === 0) {
    avisos.push("Nenhuma API de vagas configurada: mostrando vagas de EXEMPLO. Veja o README para ativar a JSearch.");
    if (perfil.local && !origem) avisos.push(`Não encontrei a localização "${perfil.local}". Mostrando vagas sem filtro de distância.`);
    const vagas = filtrarPeloPerfil(VAGAS_EXEMPLO, perfil, origem).filter(
      (v) => v.modelo === "remoto" || v.distanciaKm === undefined || v.distanciaKm <= perfil.raioKm,
    );
    return { vagas, requisitosMaisPedidos: requisitosMaisPedidos(vagas, perfil), origem, fontes: ["exemplo"], avisos };
  }

  if (!origem) {
    avisos.push(
      perfil.local
        ? `Não encontrei a localização "${perfil.local}". Confira a cidade ou o CEP.`
        : "Digite sua cidade ou CEP para buscar vagas perto de você.",
    );
    return { vagas: [], requisitosMaisPedidos: [], origem, fontes: ativas.map((f) => f.nome), avisos, cota: jsearchConfigurada() ? await usoDaCota() : undefined };
  }

  // 1. Qual região atende quem está pesquisando?
  const regiao = REGIOES.find((r) => distanciaKm(origem, r.centro) <= r.alcanceKm);
  if (!regiao) {
    avisos.push(`Por enquanto o app só cobre: ${REGIOES.map((r) => r.nome).join(", ")}. Mostrando só vagas remotas.`);
  }

  // 2. Região desatualizada (ou nunca buscada)? Atualiza pela API; senão, tudo sai do banco.
  const desde = Date.now() - VALIDADE_HORAS * 3_600_000;
  if (regiao && (regiaoAtualizadaEm(regiao.nome) ?? 0) < desde) avisos.push(...(await atualizarRegiao(regiao, ativas)));

  // 3. Vagas do banco: remotas, ou presenciais/híbridas dentro do raio escolhido.
  const vagas = filtrarPeloPerfil(vagasVistasDesde(desde), perfil, origem).filter(
    (v) => v.modelo === "remoto" || (v.distanciaKm !== undefined && v.distanciaKm <= perfil.raioKm),
  );

  return {
    vagas,
    requisitosMaisPedidos: requisitosMaisPedidos(vagas, perfil),
    origem,
    fontes: ativas.map((f) => f.nome),
    avisos,
    cota: jsearchConfigurada() ? await usoDaCota() : undefined,
  };
}
