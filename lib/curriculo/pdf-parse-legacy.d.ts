declare module "pdf-parse-legacy/lib/pdf-parse.js" {
  import type { Buffer } from "node:buffer";

  function pdfParseLegacy(buffer: Buffer): Promise<{ text: string }>;
  export default pdfParseLegacy;
}
