export function formatarReais(valor: number): string {
    const absValue = Math.abs(valor);
    let str = absValue.toString();
    
    // Preenche com zeros à esquerda se necessário
    if (str.length < 3) {
        str = str.padStart(3, '0');
    }
    
    const reais = str.substring(0, str.length - 2);
    const centavos = str.substring(str.length - 2);
    const sinal = valor < 0 ? '-' : '';
    
    return sinal + reais + ',' + centavos;
}