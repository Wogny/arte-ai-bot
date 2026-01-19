import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface ReportMetrics {
  impressions?: number;
  reach?: number;
  engagement?: number;
  clicks?: number;
  conversions?: number;
  spend?: number;
}

export interface ReportData {
  campaignName: string;
  platform: string;
  startDate: Date;
  endDate?: Date;
  metrics: ReportMetrics;
  insights?: string[];
}

export function generateReportHTML(data: ReportData): string {
  const formatNumber = (num?: number) => {
    if (!num) return "-";
    return new Intl.NumberFormat("pt-BR").format(num);
  };

  const formatCurrency = (num?: number) => {
    if (!num) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num);
  };

  const calculateROI = () => {
    if (!data.metrics.spend || !data.metrics.conversions) return 0;
    return ((data.metrics.conversions * 100) / data.metrics.spend).toFixed(2);
  };

  const calculateEngagementRate = () => {
    if (!data.metrics.reach || !data.metrics.engagement) return 0;
    return (
      ((data.metrics.engagement / data.metrics.reach) * 100).toFixed(2) || "0"
    );
  };

  const calculateCTR = () => {
    if (!data.metrics.impressions || !data.metrics.clicks) return 0;
    return (
      ((data.metrics.clicks / data.metrics.impressions) * 100).toFixed(2) || "0"
    );
  };

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório de Campanha - ${data.campaignName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { margin: 0 0 10px 0; color: #1f2937; font-size: 28px; }
        .header p { margin: 5px 0; color: #6b7280; }
        .section { margin-bottom: 30px; padding: 20px; background: #f9fafb; border-radius: 4px; }
        .section h2 { margin: 0 0 15px 0; color: #1f2937; font-size: 16px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 15px; }
        .metric-card { background: white; padding: 15px; border-left: 4px solid #3b82f6; }
        .metric-label { font-size: 12px; color: #6b7280; margin-bottom: 5px; }
        .metric-value { font-size: 18px; font-weight: bold; color: #1f2937; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background: #f3f4f6; padding: 10px; text-align: left; font-weight: bold; border-bottom: 1px solid #e5e7eb; }
        td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
        ul { margin: 10px 0; padding-left: 20px; }
        li { margin: 5px 0; }
        @media print { body { background: white; } .container { box-shadow: none; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Relatório de Campanha</h1>
          <p><strong>${data.campaignName}</strong></p>
          <p>${format(new Date(data.startDate), "dd 'de' MMMM 'de' yyyy", {
            locale: ptBR,
          })}${data.endDate ? ` - ${format(new Date(data.endDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}` : ""}</p>
        </div>

        <div class="section">
          <h2>Informações da Campanha</h2>
          <table>
            <tr>
              <th>Plataforma</th>
              <th>Período</th>
            </tr>
            <tr>
              <td>${data.platform}</td>
              <td>${data.endDate ? `${Math.ceil((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24))} dias` : "Em andamento"}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h2>Métricas Principais</h2>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">Impressões</div>
              <div class="metric-value">${formatNumber(data.metrics.impressions)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Alcance</div>
              <div class="metric-value">${formatNumber(data.metrics.reach)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Engajamento</div>
              <div class="metric-value">${formatNumber(data.metrics.engagement)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Cliques</div>
              <div class="metric-value">${formatNumber(data.metrics.clicks)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Conversões</div>
              <div class="metric-value">${formatNumber(data.metrics.conversions)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Investimento</div>
              <div class="metric-value">${formatCurrency(data.metrics.spend)}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Indicadores de Performance</h2>
          <table>
            <tr>
              <th>Indicador</th>
              <th>Valor</th>
            </tr>
            <tr>
              <td>Taxa de Engajamento</td>
              <td>${calculateEngagementRate()}%</td>
            </tr>
            <tr>
              <td>Taxa de Cliques (CTR)</td>
              <td>${calculateCTR()}%</td>
            </tr>
            <tr>
              <td>ROI (Conversões/Investimento)</td>
              <td>${calculateROI()}%</td>
            </tr>
          </table>
        </div>

        ${data.insights && data.insights.length > 0 ? `
        <div class="section">
          <h2>Insights e Recomendações</h2>
          <ul>
            ${data.insights.map(insight => `<li>${insight}</li>`).join("")}
          </ul>
        </div>
        ` : ""}

        <div class="footer">
          <p>Relatório gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          <p>Arte AI Bot - Sistema de Criação e Gestão de Conteúdo</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}

export function generateMultipleCampaignsReportHTML(campaigns: ReportData[]): string {
  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório Consolidado de Campanhas</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { margin: 0 0 10px 0; color: #1f2937; font-size: 28px; }
        .campaign-section { page-break-inside: avoid; margin-bottom: 40px; padding: 20px; background: #f9fafb; border-radius: 4px; }
        .campaign-title { font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 15px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 15px; }
        .metric-card { background: white; padding: 15px; border-left: 4px solid #3b82f6; }
        .metric-label { font-size: 12px; color: #6b7280; margin-bottom: 5px; }
        .metric-value { font-size: 18px; font-weight: bold; color: #1f2937; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
        @media print { body { background: white; } .container { box-shadow: none; } .campaign-section { page-break-inside: avoid; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Relatório Consolidado de Campanhas</h1>
          <p>Gerado em ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
        </div>

        ${campaigns.map(campaign => `
        <div class="campaign-section">
          <div class="campaign-title">${campaign.campaignName}</div>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">Impressões</div>
              <div class="metric-value">${new Intl.NumberFormat("pt-BR").format(campaign.metrics.impressions || 0)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Alcance</div>
              <div class="metric-value">${new Intl.NumberFormat("pt-BR").format(campaign.metrics.reach || 0)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Engajamento</div>
              <div class="metric-value">${new Intl.NumberFormat("pt-BR").format(campaign.metrics.engagement || 0)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Investimento</div>
              <div class="metric-value">${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(campaign.metrics.spend || 0)}</div>
            </div>
          </div>
        </div>
        `).join("")}

        <div class="footer">
          <p>Arte AI Bot - Sistema de Criação e Gestão de Conteúdo</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}
