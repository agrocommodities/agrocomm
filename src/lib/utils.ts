export function convertTimeToSeconds(exp: string): number {
  const match = exp.match(/^(\d+)([dms])$/);
  if (!match) throw new Error(`Formato de tempo inválido: ${exp}. Use formato como "30d", "15m" ou "60s"`);

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'd': // dias
      return value * 24 * 60 * 60;
    case 'm': // minutos
      return value * 60;
    case 's': // segundos
      return value;
    default:
      throw new Error(`Unidade de tempo desconhecida: ${unit}. Use "d", "m" ou "s"`);
  }
}