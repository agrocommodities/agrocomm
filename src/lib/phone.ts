export type CountryDialCode = {
  iso2: string;
  name: string;
  flag: string;
  dialCode: string;
};

export const COUNTRY_DIAL_CODES: CountryDialCode[] = [
  { iso2: "BR", name: "Brasil", flag: "🇧🇷", dialCode: "+55" },
  { iso2: "AR", name: "Argentina", flag: "🇦🇷", dialCode: "+54" },
  { iso2: "BO", name: "Bolívia", flag: "🇧🇴", dialCode: "+591" },
  { iso2: "CL", name: "Chile", flag: "🇨🇱", dialCode: "+56" },
  { iso2: "CO", name: "Colômbia", flag: "🇨🇴", dialCode: "+57" },
  { iso2: "PY", name: "Paraguai", flag: "🇵🇾", dialCode: "+595" },
  { iso2: "PE", name: "Peru", flag: "🇵🇪", dialCode: "+51" },
  { iso2: "UY", name: "Uruguai", flag: "🇺🇾", dialCode: "+598" },
  { iso2: "US", name: "Estados Unidos", flag: "🇺🇸", dialCode: "+1" },
  { iso2: "CA", name: "Canadá", flag: "🇨🇦", dialCode: "+1" },
  { iso2: "PT", name: "Portugal", flag: "🇵🇹", dialCode: "+351" },
  { iso2: "ES", name: "Espanha", flag: "🇪🇸", dialCode: "+34" },
  { iso2: "FR", name: "França", flag: "🇫🇷", dialCode: "+33" },
  { iso2: "DE", name: "Alemanha", flag: "🇩🇪", dialCode: "+49" },
  { iso2: "IT", name: "Itália", flag: "🇮🇹", dialCode: "+39" },
  { iso2: "GB", name: "Reino Unido", flag: "🇬🇧", dialCode: "+44" },
  { iso2: "MX", name: "México", flag: "🇲🇽", dialCode: "+52" },
  { iso2: "JP", name: "Japão", flag: "🇯🇵", dialCode: "+81" },
  { iso2: "CN", name: "China", flag: "🇨🇳", dialCode: "+86" },
  { iso2: "AU", name: "Austrália", flag: "🇦🇺", dialCode: "+61" },
];

export type PhoneValidationResult =
  | {
      ok: true;
      e164: string;
      countryCode: string;
      nationalNumber: string;
    }
  | {
      ok: false;
      error: string;
    };

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizeCountryCode(value: string): string {
  const digits = onlyDigits(value);
  return digits ? `+${digits}` : "";
}

export function formatAreaCodeInput(value: string): string {
  return onlyDigits(value).slice(0, 3);
}

export function formatLocalNumberInput(value: string): string {
  const digits = onlyDigits(value).slice(0, 9);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function splitNationalPhone(
  countryCode: string | null,
  nationalNumber: string | null,
): { areaCode: string; localNumber: string } {
  const normalizedCountryCode =
    normalizeCountryCode(countryCode ?? "") || "+55";
  const digits = onlyDigits(nationalNumber ?? "");

  if (!digits) {
    return { areaCode: "", localNumber: "" };
  }

  if (normalizedCountryCode === "+55") {
    const areaCode = digits.slice(0, 2);
    const local = digits.slice(2, 11);
    return {
      areaCode,
      localNumber: formatLocalNumberInput(local),
    };
  }

  const areaCode = digits.slice(0, Math.min(3, digits.length));
  const local = digits.slice(areaCode.length, areaCode.length + 9);
  return {
    areaCode,
    localNumber: formatLocalNumberInput(local),
  };
}

export function validatePhoneInput(
  countryCodeRaw: string,
  areaCodeRaw: string,
  localNumberRaw: string,
): PhoneValidationResult {
  const countryCode = normalizeCountryCode(countryCodeRaw);
  const areaCode = onlyDigits(areaCodeRaw);
  const localNumber = onlyDigits(localNumberRaw);

  if (!countryCode) {
    return { ok: false, error: "Selecione o prefixo do país." };
  }

  if (!areaCode) {
    return { ok: false, error: "Informe o código de área/estado." };
  }

  if (!localNumber) {
    return { ok: false, error: "Informe o número do WhatsApp." };
  }

  if (countryCode === "+55") {
    if (areaCode.length !== 2) {
      return { ok: false, error: "DDD inválido. Use 2 dígitos." };
    }

    if (localNumber.length !== 9) {
      return {
        ok: false,
        error: "Número inválido. Use o formato (11) 12345-6789.",
      };
    }
  } else {
    if (areaCode.length < 1 || areaCode.length > 4) {
      return {
        ok: false,
        error: "Código de área inválido para o país selecionado.",
      };
    }

    if (localNumber.length < 6 || localNumber.length > 10) {
      return {
        ok: false,
        error: "Número inválido para o país selecionado.",
      };
    }
  }

  const e164 = `${onlyDigits(countryCode)}${areaCode}${localNumber}`;

  if (e164.length < 10 || e164.length > 15) {
    return { ok: false, error: "Telefone inválido." };
  }

  return {
    ok: true,
    e164,
    countryCode,
    nationalNumber: `${areaCode}${localNumber}`,
  };
}

export function maskPhoneForDisplay(e164: string): string {
  const digits = onlyDigits(e164);
  if (digits.length < 8) return `+${digits}`;
  return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} *****-${digits.slice(-4)}`;
}
