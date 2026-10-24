import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { RelatorioCurriculo } from "@/lib/curriculo/schema";

type TipoPdf = "relatorio" | "curriculo";

const NOMES_CATEGORIA: Record<string, string> = {
  clarity: "Clareza e organização",
  experience: "Experiência profissional",
  technicalSkills: "Competências técnicas",
  education: "Formação acadêmica",
  courses: "Cursos",
  projects: "Projetos e realizações",
  jobMatch: "Compatibilidade com a vaga",
};

const NOMES_SECAO: Record<string, string> = {
  profile: "Perfil e contato",
  experience: "Experiência profissional",
  education: "Formação acadêmica",
  skills: "Competências",
  projects: "Projetos",
  certifications: "Certificações",
  languages: "Idiomas",
  additional: "Informações adicionais",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingBottom: 52,
    paddingHorizontal: 48,
    color: "#18181b",
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.45,
  },
  header: {
    marginBottom: 22,
    borderBottomWidth: 2,
    borderBottomColor: "#4f46e5",
    paddingBottom: 10,
  },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  subtitle: { color: "#52525b", fontSize: 9 },
  section: { marginTop: 16 },
  sectionTitle: {
    marginBottom: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#d4d4d8",
    paddingBottom: 4,
    color: "#3730a3",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
  },
  item: { marginBottom: 7 },
  itemTitle: { fontWeight: 700, marginBottom: 2 },
  muted: { color: "#52525b" },
  score: { fontSize: 16, fontWeight: 700, color: "#3730a3", marginBottom: 4 },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 48,
    right: 48,
    textAlign: "center",
    color: "#71717a",
    fontSize: 8,
  },
});

function TituloSecao({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function DocumentoPdf({
  relatorio,
  cargo,
  tipo,
}: {
  relatorio: RelatorioCurriculo;
  cargo: string;
  tipo: TipoPdf;
}) {
  const isCurriculo = tipo === "curriculo";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{isCurriculo ? "Currículo" : "Relatório de análise curricular"}</Text>
          {cargo.trim() && <Text style={styles.subtitle}>Cargo desejado: {cargo.trim()}</Text>}
          {!isCurriculo && <Text style={styles.subtitle}>Análise orientativa baseada apenas no texto fornecido.</Text>}
        </View>

        {isCurriculo ? (
          relatorio.formattedResume.sections.map((section) => (
            <View key={section.id} style={styles.section}>
              <TituloSecao>{NOMES_SECAO[section.id]}</TituloSecao>
              {section.entries.map((entry, index) => (
                <Text key={`${section.id}-${index}`} style={styles.item}>
                  {section.id === "projects" ? `• ${entry}` : entry}
                </Text>
              ))}
            </View>
          ))
        ) : (
          <>
            <View style={styles.section}>
              <TituloSecao>Pontuação geral</TituloSecao>
              <Text style={styles.score}>{relatorio.overallScore}/100</Text>
              <Text>{relatorio.summary}</Text>
              <Text style={[styles.muted, { marginTop: 5 }]}>
                A pontuação é orientativa e não representa uma probabilidade de contratação.
              </Text>
            </View>

            <View style={styles.section}>
              <TituloSecao>Indicadores por categoria</TituloSecao>
              {relatorio.categories.map((category) => (
                <View key={category.id} style={styles.item}>
                  <Text style={styles.itemTitle}>
                    {NOMES_CATEGORIA[category.id]} — {category.score === null ? "sem nota" : `${category.score}/100`}
                  </Text>
                  <Text>{category.explanation}</Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <TituloSecao>Pontos fortes</TituloSecao>
              {relatorio.strengths.length ? relatorio.strengths.map((item, index) => (
                <View key={`${item.title}-${index}`} style={styles.item}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text>{item.explanation}</Text>
                </View>
              )) : <Text style={styles.muted}>Nenhum ponto forte específico foi identificado.</Text>}
            </View>

            <View style={styles.section}>
              <TituloSecao>Oportunidades de melhoria</TituloSecao>
              {relatorio.improvements.map((item, index) => (
                <View key={`${item.title}-${index}`} style={styles.item}>
                  <Text style={styles.itemTitle}>{item.title} · prioridade {item.priority === "high" ? "alta" : item.priority === "medium" ? "média" : "baixa"}</Text>
                  <Text>{item.description}</Text>
                  <Text style={styles.muted}>Sugestão: {item.suggestion}</Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <TituloSecao>Seções do currículo</TituloSecao>
              {relatorio.sections.map((item, index) => (
                <View key={`${item.name}-${index}`} style={styles.item}>
                  <Text style={styles.itemTitle}>{item.name} — {item.score === null ? "sem nota" : `${item.score}/100`}</Text>
                  <Text>{item.explanation}</Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <TituloSecao>Compatibilidade e palavras-chave</TituloSecao>
              <Text>{relatorio.keywords.note}</Text>
              {relatorio.keywords.found.length > 0 && (
                <Text style={{ marginTop: 5 }}>Encontradas no currículo: {relatorio.keywords.found.join(", ")}</Text>
              )}
              {relatorio.keywords.missing.length > 0 && (
                <Text style={{ marginTop: 5 }}>Não encontradas no texto: {relatorio.keywords.missing.join(", ")}. A ausência no currículo não significa que você não tenha essas competências.</Text>
              )}
            </View>

            <View style={styles.section}>
              <TituloSecao>Sugestões de reescrita</TituloSecao>
              {relatorio.rewrites.length ? relatorio.rewrites.map((item, index) => (
                <View key={`${item.original}-${index}`} style={styles.item}>
                  <Text style={styles.itemTitle}>Original: {item.original}</Text>
                  <Text>Sugestão: {item.suggested}</Text>
                  <Text style={styles.muted}>{item.justification}</Text>
                </View>
              )) : <Text style={styles.muted}>Não houve sugestões de reescrita com evidência suficiente.</Text>}
            </View>

            <View style={styles.section}>
              <TituloSecao>Plano de ação</TituloSecao>
              {relatorio.actionPlan.map((item, index) => (
                <Text key={`${item.action}-${index}`} style={styles.item}>
                  {index + 1}. {item.action} (prioridade {item.priority === "high" ? "alta" : item.priority === "medium" ? "média" : "baixa"})
                </Text>
              ))}
            </View>

            <View style={styles.section}>
              <TituloSecao>Limitações da análise</TituloSecao>
              {relatorio.limitations.map((item, index) => <Text key={`${item}-${index}`} style={styles.item}>• {item}</Text>)}
            </View>
          </>
        )}

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        />
      </Page>
    </Document>
  );
}

export async function renderizarPdfCurriculo(
  relatorio: RelatorioCurriculo,
  cargo: string,
  tipo: TipoPdf,
) {
  return renderToBuffer(<DocumentoPdf relatorio={relatorio} cargo={cargo} tipo={tipo} />);
}
