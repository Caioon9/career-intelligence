import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import pdfParseLegacy from "pdf-parse-legacy/lib/pdf-parse.js";

function pdfPrecisaSenha(error: unknown) {
  return error instanceof Error && (
    error.name === "PasswordException" ||
    /password required|incorrect password|encrypted/i.test(error.message)
  );
}

async function extrairTextoPdf(bytes: Buffer) {
  const parser = new PDFParse({ data: bytes });
  let erroParserAtual: unknown;
  try {
    const parsed = await parser.getText();
    if (parsed.text.trim()) return parsed.text;
  } catch (error) {
    erroParserAtual = error;
  } finally {
    try {
      await parser.destroy();
    } catch (error) {
      erroParserAtual ??= error;
    }
  }

  try {
    const parsed = await pdfParseLegacy(bytes);
    if (parsed.text.trim()) return parsed.text;
  } catch (erroParserLegado) {
    console.warn("[curriculo] Os parsers não conseguiram extrair texto do PDF", {
      parserAtual: erroParserAtual instanceof Error ? erroParserAtual.name : "sem texto extraível",
      parserLegado: erroParserLegado instanceof Error ? erroParserLegado.name : "erro desconhecido",
    });
    if (pdfPrecisaSenha(erroParserAtual) || pdfPrecisaSenha(erroParserLegado)) {
      throw new Error("O PDF está protegido por senha. Remova a proteção e envie novamente.");
    }
    throw new Error("Não foi possível ler o PDF. Tente salvá-lo novamente como PDF e envie o arquivo atualizado.");
  }

  return "";
}

export const MAX_TEXTO_CURRICULO = 20_000;

export async function extrairTextoCurriculo(file: File, maxBytes: number) {
  if (file.size === 0 || file.size > maxBytes) {
    const limiteMb = Number((maxBytes / 1024 / 1024).toFixed(2));
    throw new Error(file.size === 0 ? "O arquivo está vazio." : `O arquivo excede o limite de ${limiteMb} MB.`);
  }

  const nome = file.name.toLowerCase();
  const bytes = Buffer.from(await file.arrayBuffer());
  let text: string;

  if (nome.endsWith(".pdf") && bytes.subarray(0, 5).toString("ascii") === "%PDF-") {
    text = await extrairTextoPdf(bytes);
  } else if (
    nome.endsWith(".docx") &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    bytes[2] === 0x03 &&
    bytes[3] === 0x04
  ) {
    try {
      const parsed = await mammoth.extractRawText({ buffer: bytes });
      text = parsed.value;
    } catch {
      throw new Error("Não foi possível ler o DOCX. Verifique se o arquivo não está corrompido.");
    }
  } else {
    throw new Error("Envie um arquivo PDF ou DOCX válido.");
  }

  const normalized = text.replace(/\u0000/g, "").replace(/\s+/g, " ").trim();
  if (!normalized) {
    throw new Error(nome.endsWith(".pdf")
      ? "Não foi possível extrair texto do PDF. Se for digitalizado, será necessário OCR, que não está disponível."
      : "Não foi possível extrair texto do documento.");
  }
  if (normalized.length < 80 && nome.endsWith(".pdf")) {
    throw new Error("O PDF contém pouco texto extraível. Se for digitalizado, será necessário OCR, que não está disponível.");
  }

  return normalized.slice(0, MAX_TEXTO_CURRICULO);
}
