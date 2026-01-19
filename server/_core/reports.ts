/**
 * Utilitário para geração de relatórios exportáveis
 */
export async function generateCSVReport(data: any[]): Promise<string> {
  if (data.length === 0) return "";
  
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map(obj => 
    Object.values(obj).map(val => `"${val}"`).join(",")
  ).join("\n");

  return `${headers}\n${rows}`;
}

/**
 * Simulação de geração de PDF (em produção usaria bibliotecas como puppeteer ou pdfkit)
 */
export async function generatePDFReport(title: string, metrics: any): Promise<Buffer> {
  console.log(`[REPORT] Gerando PDF: ${title}`);
  // Simulação de buffer de PDF
  return Buffer.from(`PDF Report: ${title}\nMetrics: ${JSON.stringify(metrics)}`);
}
