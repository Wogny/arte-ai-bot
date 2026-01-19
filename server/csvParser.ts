import { z } from "zod";

/**
 * Schema de validação para linha do CSV
 * Campos esperados: name, platform, startDate, endDate (opcional), impressions, reach, engagement, clicks, conversions, spend
 */
const CampaignRowSchema = z.object({
  name: z.string().min(1, "Nome da campanha é obrigatório"),
  platform: z.string().refine(
    (val) => ["Facebook", "Instagram", "Facebook + Instagram", "Google Ads", "TikTok"].includes(val),
    { message: "Plataforma inválida. Use: Facebook, Instagram, Facebook + Instagram, Google Ads, TikTok" }
  ),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Data de início inválida (use YYYY-MM-DD)"),
  endDate: z.string().optional().refine(
    (date) => !date || !isNaN(Date.parse(date)),
    "Data de término inválida (use YYYY-MM-DD)"
  ),
  impressions: z.string().transform((val) => (val ? Number(val) : undefined)).optional(),
  reach: z.string().transform((val) => (val ? Number(val) : undefined)).optional(),
  engagement: z.string().transform((val) => (val ? Number(val) : undefined)).optional(),
  clicks: z.string().transform((val) => (val ? Number(val) : undefined)).optional(),
  conversions: z.string().transform((val) => (val ? Number(val) : undefined)).optional(),
  spend: z.string().transform((val) => (val ? Number(val) : undefined)).optional(),
});

export type CampaignRow = z.infer<typeof CampaignRowSchema>;

export interface ParseResult {
  success: boolean;
  campaigns: CampaignRow[];
  errors: Array<{
    row: number;
    field?: string;
    message: string;
  }>;
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
}

/**
 * Parser simples de CSV que funciona no servidor
 * Suporta linhas com quebras de linha dentro de aspas
 */
function parseCSVContent(content: string): string[][] {
  const lines: string[] = [];
  let currentLine = "";
  let insideQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        currentLine += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = "";
      // Skip \r\n combination
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
    } else {
      currentLine += char;
    }
  }

  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  // Parse each line into columns
  return lines.map((line) => {
    const columns: string[] = [];
    let currentColumn = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentColumn += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === "," && !insideQuotes) {
        columns.push(currentColumn.trim());
        currentColumn = "";
      } else {
        currentColumn += char;
      }
    }

    columns.push(currentColumn.trim());
    return columns;
  });
}

/**
 * Valida e parseia arquivo CSV de campanhas
 */
export function parseCSV(content: string): ParseResult {
  try {
    const rows = parseCSVContent(content);

    if (rows.length === 0) {
      return {
        success: false,
        campaigns: [],
        errors: [{ row: 0, message: "Arquivo CSV vazio" }],
        summary: { total: 0, valid: 0, invalid: 0 },
      };
    }

    // First row should be headers
    const headers = rows[0];
    const expectedHeaders = ["name", "platform", "startDate", "endDate", "impressions", "reach", "engagement", "clicks", "conversions", "spend"];

    // Normalize headers (lowercase, trim)
    const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

    // Check if required headers are present
    const requiredHeaders = ["name", "platform", "startdate"];
    const missingHeaders = requiredHeaders.filter((h) => !normalizedHeaders.includes(h));

    if (missingHeaders.length > 0) {
      return {
        success: false,
        campaigns: [],
        errors: [
          {
            row: 1,
            message: `Cabeçalhos obrigatórios ausentes: ${missingHeaders.join(", ")}. Use: ${expectedHeaders.join(", ")}`,
          },
        ],
        summary: { total: 0, valid: 0, invalid: 0 },
      };
    }

    // Create header index map
    const headerMap: Record<string, number> = {};
    normalizedHeaders.forEach((header, index) => {
      headerMap[header] = index;
    });

    const campaigns: CampaignRow[] = [];
    const errors: Array<{ row: number; field?: string; message: string }> = [];

    // Parse data rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      // Skip empty rows
      if (row.every((cell) => !cell.trim())) {
        continue;
      }

      try {
        const rowData = {
          name: row[headerMap["name"]] || "",
          platform: row[headerMap["platform"]] || "",
          startDate: row[headerMap["startdate"]] || "",
          endDate: row[headerMap["enddate"]] || "",
          impressions: row[headerMap["impressions"]] || "",
          reach: row[headerMap["reach"]] || "",
          engagement: row[headerMap["engagement"]] || "",
          clicks: row[headerMap["clicks"]] || "",
          conversions: row[headerMap["conversions"]] || "",
          spend: row[headerMap["spend"]] || "",
        };

        const validated = CampaignRowSchema.parse(rowData);
        campaigns.push(validated);
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.issues.forEach((issue) => {
            errors.push({
              row: i + 1,
              field: issue.path.join("."),
              message: issue.message,
            });
          });
        } else {
          errors.push({
            row: i + 1,
            message: "Erro ao processar linha",
          });
        }
      }
    }

    return {
      success: errors.length === 0,
      campaigns,
      errors,
      summary: {
        total: rows.length - 1, // Exclude header
        valid: campaigns.length,
        invalid: errors.length > 0 ? rows.length - 1 - campaigns.length : 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      campaigns: [],
      errors: [{ row: 0, message: `Erro ao ler arquivo: ${error instanceof Error ? error.message : "Erro desconhecido"}` }],
      summary: { total: 0, valid: 0, invalid: 0 },
    };
  }
}

/**
 * Gera exemplo de CSV para download
 */
export function generateCSVTemplate(): string {
  const headers = ["name", "platform", "startDate", "endDate", "impressions", "reach", "engagement", "clicks", "conversions", "spend"];
  const exampleRows = [
    ["Black Friday 2024", "Facebook + Instagram", "2024-11-29", "2024-12-01", "50000", "25000", "1250", "500", "50", "1000.00"],
    ["Campanha Verão", "Instagram", "2024-12-01", "2024-12-15", "30000", "15000", "900", "300", "30", "600.00"],
    ["Promoção Ano Novo", "Google Ads", "2024-12-20", "2024-12-31", "100000", "50000", "2500", "1000", "100", "2000.00"],
  ];

  const csvContent = [
    headers.join(","),
    ...exampleRows.map((row) => row.map((cell) => (cell.includes(",") ? `"${cell}"` : cell)).join(",")),
  ].join("\n");

  return csvContent;
}
