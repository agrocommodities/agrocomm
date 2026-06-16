"use client";

import {
  useActionState,
  useState,
  useEffect,
  useTransition,
  useCallback,
} from "react";
import { updateProfileAction } from "@/actions/auth";
import {
  requestWhatsAppPhoneOtpAction,
  verifyWhatsAppPhoneOtpAction,
} from "@/actions/phone-verification";
import {
  COUNTRY_DIAL_CODES,
  formatAreaCodeInput,
  formatLocalNumberInput,
  splitNationalPhone,
  validatePhoneInput,
} from "@/lib/phone";
import { ChevronDown } from "lucide-react";

interface Props {
  defaultName: string;
  defaultEmail: string;
  defaultPhoneCountryCode: string | null;
  defaultPhoneNationalNumber: string | null;
  defaultPhoneE164: string | null;
  defaultPhoneVerifiedAt: string | null;
  defaultCountryId: number | null;
  defaultGeoStateId: number | null;
  defaultGeoCityId: number | null;
}

interface GeoCountry {
  id: number;
  name: string;
  iso2: string;
  emoji: string | null;
}
interface GeoState {
  id: number;
  name: string;
  iso2: string | null;
}
interface GeoCity {
  id: number;
  name: string;
}

const inputClass =
  "bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-green-400/50 transition";

const selectClass =
  "w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50 transition appearance-none text-white cursor-pointer";

export default function SettingsForm({
  defaultName,
  defaultEmail,
  defaultPhoneCountryCode,
  defaultPhoneNationalNumber,
  defaultPhoneE164,
  defaultPhoneVerifiedAt,
  defaultCountryId,
  defaultGeoStateId,
  defaultGeoCityId,
}: Props) {
  const [state, action, pending] = useActionState(updateProfileAction, null);
  const [sendingOtp, startSendingOtp] = useTransition();
  const [verifyingOtp, startVerifyingOtp] = useTransition();

  const [countries, setCountries] = useState<GeoCountry[]>([]);
  const [geoStates, setGeoStates] = useState<GeoState[]>([]);
  const [geoCities, setGeoCities] = useState<GeoCity[]>([]);

  const initialPhone = splitNationalPhone(
    defaultPhoneCountryCode,
    defaultPhoneNationalNumber,
  );

  const [phoneCountryCode, setPhoneCountryCode] = useState(
    defaultPhoneCountryCode ?? "+55",
  );
  const [areaCode, setAreaCode] = useState(initialPhone.areaCode);
  const [localNumber, setLocalNumber] = useState(initialPhone.localNumber);
  const [otpCode, setOtpCode] = useState("");
  const [otpRequestedFor, setOtpRequestedFor] = useState<string | null>(null);
  const [autoOtpAttemptedFor, setAutoOtpAttemptedFor] = useState<string | null>(
    null,
  );
  const [autoOtpInFlightFor, setAutoOtpInFlightFor] = useState<string | null>(
    null,
  );
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [otpVisible, setOtpVisible] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpInfo, setOtpInfo] = useState<string | null>(null);
  const [verifiedPhoneE164, setVerifiedPhoneE164] = useState<string | null>(
    defaultPhoneVerifiedAt && defaultPhoneE164 ? defaultPhoneE164 : null,
  );

  const [countryId, setCountryId] = useState<number | null>(defaultCountryId);
  const [geoStateId, setGeoStateId] = useState<number | null>(
    defaultGeoStateId,
  );
  const [geoCityId, setGeoCityId] = useState<number | null>(defaultGeoCityId);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Load countries on mount
  useEffect(() => {
    fetch("/api/geo?type=countries")
      .then((r) => r.json())
      .then(setCountries)
      .catch(() => {});
  }, []);

  // Load states when country changes
  useEffect(() => {
    if (!countryId) {
      setGeoStates([]);
      return;
    }
    setLoadingStates(true);
    fetch(`/api/geo?type=states&countryId=${countryId}`)
      .then((r) => r.json())
      .then((data) => {
        setGeoStates(data);
        setLoadingStates(false);
      })
      .catch(() => setLoadingStates(false));
  }, [countryId]);

  // Load cities when state changes
  useEffect(() => {
    if (!geoStateId) {
      setGeoCities([]);
      return;
    }
    setLoadingCities(true);
    fetch(`/api/geo?type=cities&stateId=${geoStateId}`)
      .then((r) => r.json())
      .then((data) => {
        setGeoCities(data);
        setLoadingCities(false);
      })
      .catch(() => setLoadingCities(false));
  }, [geoStateId]);

  const phoneValidation = validatePhoneInput(
    phoneCountryCode,
    areaCode,
    localNumber,
  );
  const currentE164 = phoneValidation.ok ? phoneValidation.e164 : null;
  const isCurrentPhoneVerified = Boolean(
    currentE164 && currentE164 === verifiedPhoneE164,
  );

  const doRequestOtp = useCallback(
    async (auto: boolean) => {
      if (!phoneValidation.ok) {
        if (!auto) {
          setOtpError(phoneValidation.error);
        }
        return;
      }

      if (auto) {
        setAutoOtpAttemptedFor(phoneValidation.e164);
        setAutoOtpInFlightFor(phoneValidation.e164);
      }

      try {
        const result = await requestWhatsAppPhoneOtpAction({
          countryCode: phoneCountryCode,
          areaCode,
          localNumber,
        });

        if (!result.success) {
          setOtpError(result.error);
          setOtpInfo(null);
          if (!auto) {
            setOtpVisible(true);
          }
          return;
        }

        setOtpRequestedFor(phoneValidation.e164);
        setOtpExpiresAt(result.expiresAt ?? null);
        setOtpVisible(true);
        setOtpError(null);
        setOtpInfo(result.message);
      } finally {
        if (auto) {
          setAutoOtpInFlightFor(null);
        }
      }
    },
    [phoneValidation, phoneCountryCode, areaCode, localNumber],
  );

  useEffect(() => {
    if (!phoneValidation.ok || !currentE164 || isCurrentPhoneVerified) {
      return;
    }

    if (
      otpRequestedFor === currentE164 ||
      autoOtpInFlightFor === currentE164 ||
      sendingOtp
    ) {
      return;
    }

    if (autoOtpAttemptedFor === currentE164) {
      return;
    }

    const timer = setTimeout(() => {
      startSendingOtp(async () => {
        await doRequestOtp(true);
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [
    phoneValidation.ok,
    currentE164,
    isCurrentPhoneVerified,
    otpRequestedFor,
    autoOtpAttemptedFor,
    autoOtpInFlightFor,
    sendingOtp,
    doRequestOtp,
  ]);

  useEffect(() => {
    if (!currentE164 || otpRequestedFor !== currentE164) {
      setOtpVisible(false);
      setOtpCode("");
      setOtpExpiresAt(null);
      setOtpError(null);
      if (currentE164 !== verifiedPhoneE164) {
        setOtpInfo(null);
      }
    }
  }, [currentE164, otpRequestedFor, verifiedPhoneE164]);

  function handleManualOtpRequest() {
    startSendingOtp(async () => {
      await doRequestOtp(false);
    });
  }

  function handleVerifyOtp() {
    if (!phoneValidation.ok) {
      setOtpError(phoneValidation.error);
      return;
    }

    startVerifyingOtp(async () => {
      const result = await verifyWhatsAppPhoneOtpAction({
        countryCode: phoneCountryCode,
        areaCode,
        localNumber,
        otpCode,
      });

      if (!result.success) {
        setOtpError(result.error);
        setOtpInfo(null);
        return;
      }

      setVerifiedPhoneE164(phoneValidation.e164);
      setOtpVisible(false);
      setOtpCode("");
      setOtpError(null);
      setOtpInfo(result.message);
    });
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-white/80">
          Nome
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultName}
          autoComplete="name"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-white/80">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={defaultEmail}
          autoComplete="email"
          className={inputClass}
        />
      </div>

      <hr className="border-white/10" />

      <p className="text-xs text-white/40">Endereço</p>

      {/* Country */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="countryId"
          className="text-sm font-medium text-white/80"
        >
          País
        </label>
        <div className="relative">
          <select
            id="countryId"
            name="countryId"
            value={countryId ?? ""}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : null;
              setCountryId(val);
              setGeoStateId(null);
              setGeoCityId(null);
            }}
            className={selectClass}
          >
            <option value="">Selecione o país</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji ? `${c.emoji} ` : ""}
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        </div>
      </div>

      {/* State */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="geoStateId"
          className="text-sm font-medium text-white/80"
        >
          Estado/Província
        </label>
        <div className="relative">
          <select
            id="geoStateId"
            name="geoStateId"
            value={geoStateId ?? ""}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : null;
              setGeoStateId(val);
              setGeoCityId(null);
            }}
            disabled={!countryId || loadingStates}
            className={`${selectClass} disabled:opacity-40`}
          >
            <option value="">
              {loadingStates ? "Carregando..." : "Selecione o estado"}
            </option>
            {geoStates.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.iso2 ? ` (${s.iso2})` : ""}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        </div>
      </div>

      {/* City */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="geoCityId"
          className="text-sm font-medium text-white/80"
        >
          Cidade
        </label>
        <div className="relative">
          <select
            id="geoCityId"
            name="geoCityId"
            value={geoCityId ?? ""}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : null;
              setGeoCityId(val);
            }}
            disabled={!geoStateId || loadingCities}
            className={`${selectClass} disabled:opacity-40`}
          >
            <option value="">
              {loadingCities ? "Carregando..." : "Selecione a cidade"}
            </option>
            {geoCities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        </div>
      </div>

      <hr className="border-white/10" />

      <p className="text-xs text-white/40">WhatsApp para confirmações</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="phoneCountryCode"
            className="text-sm font-medium text-white/80"
          >
            País / Prefixo
          </label>
          <div className="relative">
            <select
              id="phoneCountryCode"
              value={phoneCountryCode}
              onChange={(e) => {
                setPhoneCountryCode(e.target.value);
                setOtpRequestedFor(null);
                setAutoOtpAttemptedFor(null);
                setAutoOtpInFlightFor(null);
              }}
              className={selectClass}
            >
              {COUNTRY_DIAL_CODES.map((country) => (
                <option
                  key={`${country.iso2}-${country.dialCode}`}
                  value={country.dialCode}
                >
                  {country.flag} {country.name} ({country.dialCode})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="areaCode"
            className="text-sm font-medium text-white/80"
          >
            Código do estado
          </label>
          <input
            id="areaCode"
            type="text"
            value={areaCode}
            onChange={(e) => {
              setAreaCode(formatAreaCodeInput(e.target.value));
              setOtpRequestedFor(null);
              setAutoOtpAttemptedFor(null);
              setAutoOtpInFlightFor(null);
            }}
            inputMode="numeric"
            maxLength={3}
            placeholder="11"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="phoneNumber"
          className="text-sm font-medium text-white/80"
        >
          Número
        </label>
        <input
          id="phoneNumber"
          type="text"
          value={localNumber}
          onChange={(e) => {
            setLocalNumber(formatLocalNumberInput(e.target.value));
            setOtpRequestedFor(null);
            setAutoOtpAttemptedFor(null);
            setAutoOtpInFlightFor(null);
          }}
          inputMode="numeric"
          maxLength={10}
          placeholder="12345-6789"
          className={inputClass}
        />
        <p className="text-xs text-white/50">Formato: +55 (11) 12345-6789</p>
      </div>

      {isCurrentPhoneVerified ? (
        <p className="text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-4 py-2.5">
          Telefone verificado e salvo.
        </p>
      ) : (
        <p className="text-xs text-white/45">
          O código de confirmação é enviado automaticamente quando o número fica
          válido.
        </p>
      )}

      {sendingOtp && (
        <p className="text-xs text-white/45">Enviando código de confirmação…</p>
      )}

      {(otpVisible || otpRequestedFor === currentE164) &&
        !isCurrentPhoneVerified && (
          <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-4">
            <label
              htmlFor="otpCode"
              className="text-sm font-medium text-white/80"
            >
              Código OTP do WhatsApp
            </label>
            <div className="flex gap-2">
              <input
                id="otpCode"
                type="text"
                value={otpCode}
                onChange={(e) =>
                  setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                className={`${inputClass} flex-1`}
              />
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={verifyingOtp || otpCode.length !== 6}
                className="bg-green-600 hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
              >
                {verifyingOtp ? "Validando…" : "Confirmar"}
              </button>
            </div>

            <div className="flex justify-between items-center gap-3">
              <button
                type="button"
                onClick={handleManualOtpRequest}
                disabled={sendingOtp}
                className="text-xs text-green-300 hover:text-green-200 disabled:opacity-60"
              >
                Reenviar código
              </button>

              {otpExpiresAt && (
                <span className="text-[11px] text-white/45">
                  Expira em{" "}
                  {new Date(otpExpiresAt).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          </div>
        )}

      {otpError && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2.5">
          {otpError}
        </p>
      )}

      {otpInfo && !isCurrentPhoneVerified && (
        <p className="text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-4 py-2.5">
          {otpInfo}
        </p>
      )}

      <p className="text-xs text-white/40">
        Preencha os campos abaixo apenas se quiser alterar a senha.
      </p>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="currentPassword"
          className="text-sm font-medium text-white/80"
        >
          Senha atual
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="newPassword"
          className="text-sm font-medium text-white/80"
        >
          Nova senha
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="confirmPassword"
          className="text-sm font-medium text-white/80"
        >
          Confirmar nova senha
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          className={inputClass}
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2.5">
          {state.error}
        </p>
      )}

      {state?.success && (
        <p className="text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-4 py-2.5">
          Dados atualizados com sucesso!
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 bg-green-600 hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
      >
        {pending ? "Salvando…" : "Salvar alterações"}
      </button>
    </form>
  );
}
