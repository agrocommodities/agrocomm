"use client";

import { useActionState, useState, useEffect } from "react";
import { updateProfileAction } from "@/actions/auth";
import { ChevronDown } from "lucide-react";

interface Props {
  defaultName: string;
  defaultEmail: string;
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
  defaultCountryId,
  defaultGeoStateId,
  defaultGeoCityId,
}: Props) {
  const [state, action, pending] = useActionState(updateProfileAction, null);

  const [countries, setCountries] = useState<GeoCountry[]>([]);
  const [geoStates, setGeoStates] = useState<GeoState[]>([]);
  const [geoCities, setGeoCities] = useState<GeoCity[]>([]);

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
