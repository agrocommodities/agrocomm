import { states } from "@/config";

export function calculateVariation(currentPrice: number, previousPrice: number | null): number {
  if (!previousPrice || previousPrice === 0) return 0;
  // Variação em pontos base (1% = 100 pontos base)
  const variation = ((currentPrice - previousPrice) / previousPrice) * 10000;
  return Math.round(variation);
}

export function formatVariation(variation: number): string {
  // Converte pontos base para porcentagem
  const percentage = variation / 100;
  return `${percentage > 0 ? '+' : ''}${percentage.toFixed(2)}%`;
}

export function formatCommodityName(commodity: string): string {
  switch (commodity.toLowerCase()) {
    case "soja":
      return "Saca de Soja";
    case "milho":
      return "Saca de Milho";
    case "boi":
    case "arroba-boi":
      return "Arroba do Boi";
    case "vaca":
    case "arroba-vaca":
      return "Arroba da Vaca";
    default:
      return commodity.charAt(0).toUpperCase() + commodity.slice(1);
  }
}

// Nova função para formatar preços corretamente
export function formatPrice(priceInCents: number): string {
  return (priceInCents / 100).toFixed(2).replace(".", ",");
}

// export function calculateVariation(currentPrice: number, previousPrice: number | null): number {
//   if (!previousPrice || previousPrice === 0) return 0;
//   // Calcula a variação percentual e converte para inteiro (multiplicado por 100) Ex: 5% de variação = 500 (inteiro)
//   const variation = ((currentPrice - previousPrice) / previousPrice) * 10000;
//   return Math.round(variation);
// }

// export function formatVariation(variation: number): string {
//   const percentage = variation / 100;
//   return `${percentage > 0 ? '+' : ''}${percentage.toFixed(2)}%`;
// }

// export function formatCommodityName(commodity: string): string {
//   switch (commodity.toLowerCase()) {
//     case "soja":
//       return "Saca de Soja";
//     case "milho":
//       return "Saca de Milho";
//     case "boi":
//       return "Arroba do Boi";
//     case "vaca":
//       return "Arroba da Vaca";
//     default:
//       return commodity.charAt(0).toUpperCase() + commodity.slice(1);
//   }
// }

export function formatStateName(state: string, long = true) {
  if (long) return states.filter(item => item.abbr === state.toUpperCase())[0].name;
  return states.filter(item => item.abbr === state.toUpperCase())[0];
}

export function formatarReais(valor: number): string {
    const absValue = Math.abs(valor);
    let str = absValue.toString();
    if (str.length < 3) str = str.padStart(3, '0'); // Preenche com zeros à esquerda se necessário
    const reais = str.substring(0, str.length - 2);
    const centavos = str.substring(str.length - 2);
    const sinal = valor < 0 ? '-' : '';
    return sinal + reais + ',' + centavos;
}