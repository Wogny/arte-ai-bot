/**
 * Envia alertas para Slack ou Discord via Webhooks
 */
export async function sendExternalAlert(webhookUrl: string, message: string, type: "slack" | "discord" = "slack") {
  try {
    let payload: any;

    if (type === "slack") {
      payload = {
        text: `🚀 *Arte AI Bot Alert*\n${message}`,
      };
    } else {
      payload = {
        content: `🚀 **Arte AI Bot Alert**\n${message}`,
      };
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    console.log(`[EXTERNAL-ALERT] Alerta enviado para ${type}`);
  } catch (error) {
    console.error(`[EXTERNAL-ALERT] Erro ao enviar alerta para ${type}:`, error);
  }
}
