// src/lib/alerts.ts
interface AlertPlan {
  daily: boolean;
  weekly: boolean;
  monthly: boolean;
  priceAlerts: boolean;
  maxAlerts: number;
}

const ALERT_PLANS: Record<string, AlertPlan> = {
  free: {
    daily: false,
    weekly: true,
    monthly: true,
    priceAlerts: false,
    maxAlerts: 2,
  },
  basic: {
    daily: true,
    weekly: true,
    monthly: true,
    priceAlerts: true,
    maxAlerts: 10,
  },
  premium: {
    daily: true,
    weekly: true,
    monthly: true,
    priceAlerts: true,
    maxAlerts: 50,
  }
};

export async function sendDailyAlert(userId: number) {
  // Verificar plano do usuário
  // Buscar alertas ativos
  // Buscar cotações do dia
  // Enviar e-mail formatado
}