"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Sistema = "cria" | "recria" | "engorda";
type Sexo = "macho" | "femea";
type Raca = "nelore" | "angus" | "senepol" | "brangus";

type QuoteOption = {
  label: string;
  productSlug: string;
  city: string;
  state: string;
  price: number;
};

type Props = {
  quotes: QuoteOption[];
};

type BreedPreset = {
  label: string;
  cria: { macho: number; femea: number };
  recria: { entrada: number; macho: number; femea: number };
  engorda: { entrada: number; saida: number };
};

const BREEDS: Record<Raca, BreedPreset> = {
  nelore: {
    label: "Nelore",
    cria: { macho: 210, femea: 190 },
    recria: { entrada: 200, macho: 360, femea: 320 },
    engorda: { entrada: 360, saida: 540 },
  },
  angus: {
    label: "Angus",
    cria: { macho: 230, femea: 210 },
    recria: { entrada: 220, macho: 390, femea: 350 },
    engorda: { entrada: 390, saida: 570 },
  },
  senepol: {
    label: "Senepol",
    cria: { macho: 225, femea: 205 },
    recria: { entrada: 215, macho: 380, femea: 340 },
    engorda: { entrada: 380, saida: 560 },
  },
  brangus: {
    label: "Brangus",
    cria: { macho: 225, femea: 205 },
    recria: { entrada: 215, macho: 385, femea: 345 },
    engorda: { entrada: 385, saida: 565 },
  },
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

function Field({
  label,
  value,
  onChange,
  suffix,
  min = 0,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  min?: number;
  step?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-white/55">{label}</span>
      <div className="relative">
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value) || 0)}
          className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 pr-12 text-sm outline-none transition focus:border-green-500/50"
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/35">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

export default function CalculadoraPecuaria({ quotes }: Props) {
  const [sistema, setSistema] = useState<Sistema>("cria");
  const [raca, setRaca] = useState<Raca>("nelore");
  const [sexo, setSexo] = useState<Sexo>("macho");
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [quantidade, setQuantidade] = useState(100);
  const [meses, setMeses] = useState(12);
  const [mesesGestacao, setMesesGestacao] = useState(9);
  const [mesesAteVenda, setMesesAteVenda] = useState(8);
  const [pesoEntrada, setPesoEntrada] = useState(BREEDS.nelore.recria.entrada);
  const [pesoSaida, setPesoSaida] = useState(BREEDS.nelore.cria.macho);
  const [rendimentoCarcaca, setRendimentoCarcaca] = useState(52);
  const [taxaNatalidade, setTaxaNatalidade] = useState(80);
  const [mortalidade, setMortalidade] = useState(3);
  const [precoCompraCabeca, setPrecoCompraCabeca] = useState(0);
  const [premioLeilao, setPremioLeilao] = useState(0);

  const [sal, setSal] = useState(22);
  const [veterinario, setVeterinario] = useState(5);
  const [peao, setPeao] = useState(18);
  const [vacinas, setVacinas] = useState(8);
  const [vermifugo, setVermifugo] = useState(7);
  const [cercasPastagens, setCercasPastagens] = useState(0);
  const [estruturaAgua, setEstruturaAgua] = useState(0);
  const [outros, setOutros] = useState(0);

  const quote = quotes[quoteIndex] ?? {
    label: "Preço informado manualmente",
    productSlug: "boi-gordo",
    city: "",
    state: "",
    price: 300,
  };
  const [manualPrice, setManualPrice] = useState<number | null>(null);
  const arroba = manualPrice ?? quote.price;

  function applyPreset(nextRace: Raca, nextSystem = sistema, nextSex = sexo) {
    const preset = BREEDS[nextRace];
    setRaca(nextRace);
    if (nextSystem === "cria") {
      setPesoEntrada(0);
      setPesoSaida(preset.cria[nextSex]);
      setMesesGestacao(9);
      setMesesAteVenda(8);
    } else if (nextSystem === "recria") {
      setPesoEntrada(preset.recria.entrada);
      setPesoSaida(preset.recria[nextSex]);
      setMeses(12);
    } else {
      setPesoEntrada(preset.engorda.entrada);
      setPesoSaida(preset.engorda.saida);
      setMeses(8);
    }
  }

  function changeSystem(next: Sistema) {
    setSistema(next);
    applyPreset(raca, next, sexo);
  }

  function changeSex(next: Sexo) {
    setSexo(next);
    applyPreset(raca, sistema, next);
  }

  const result = useMemo(() => {
    const totalCycleMonths =
      sistema === "cria" ? mesesGestacao + mesesAteVenda : meses;
    const monthlyOperatingCosts =
      sal + veterinario + peao + vacinas + vermifugo + outros;
    const recurringCosts = monthlyOperatingCosts * totalCycleMonths;
    const optionalCosts = cercasPastagens + estruturaAgua;
    const purchaseCosts = sistema === "cria" ? 0 : precoCompraCabeca * quantidade;
    const totalCosts = recurringCosts + optionalCosts + purchaseCosts;

    const born = sistema === "cria" ? quantidade * (taxaNatalidade / 100) : quantidade;
    const saleAnimals = born * (1 - mortalidade / 100);
    const saleArrobas = (pesoSaida * (rendimentoCarcaca / 100)) / 15;
    const grossRevenue = saleAnimals * saleArrobas * arroba * (1 + premioLeilao / 100);
    const profit = grossRevenue - totalCosts;
    const margin = grossRevenue > 0 ? (profit / grossRevenue) * 100 : 0;
    const breakEvenArroba = saleAnimals * saleArrobas > 0
      ? totalCosts / (saleAnimals * saleArrobas * (1 + premioLeilao / 100))
      : 0;

    const chart = Array.from({ length: totalCycleMonths + 1 }, (_, month) => {
      const progress = totalCycleMonths === 0 ? 1 : month / totalCycleMonths;
      const accumulatedRecurring = recurringCosts * progress;
      const initialCosts = purchaseCosts + optionalCosts;
      const costs = initialCosts + accumulatedRecurring;
      const revenue = month === totalCycleMonths ? grossRevenue : 0;
      return {
        month: `Mês ${month}`,
        gastos: Math.round(costs),
        receitas: Math.round(revenue),
        resultado: Math.round(revenue - costs),
      };
    });

    return {
      totalCycleMonths,
      monthlyOperatingCosts,
      recurringCosts,
      purchaseCosts,
      totalCosts,
      saleAnimals,
      saleArrobas,
      grossRevenue,
      profit,
      margin,
      breakEvenArroba,
      chart,
    };
  }, [
    sal,
    veterinario,
    peao,
    vacinas,
    vermifugo,
    outros,
    meses,
    mesesGestacao,
    mesesAteVenda,
    cercasPastagens,
    estruturaAgua,
    sistema,
    precoCompraCabeca,
    quantidade,
    taxaNatalidade,
    mortalidade,
    pesoSaida,
    rendimentoCarcaca,
    arroba,
    premioLeilao,
  ]);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-white/55">Sistema produtivo</span>
            <select
              value={sistema}
              onChange={(event) => changeSystem(event.target.value as Sistema)}
              className="rounded-xl border border-white/10 bg-[#151a13] px-3 py-2.5 text-sm outline-none"
            >
              <option value="cria">Cria — venda de bezerros</option>
              <option value="recria">Recria — garrotes e novilhas</option>
              <option value="engorda">Engorda — animais para abate</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-white/55">Raça de referência</span>
            <select
              value={raca}
              onChange={(event) => applyPreset(event.target.value as Raca)}
              className="rounded-xl border border-white/10 bg-[#151a13] px-3 py-2.5 text-sm outline-none"
            >
              {Object.entries(BREEDS).map(([key, breed]) => (
                <option key={key} value={key}>{breed.label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-white/55">Sexo predominante</span>
            <select
              value={sexo}
              onChange={(event) => changeSex(event.target.value as Sexo)}
              className="rounded-xl border border-white/10 bg-[#151a13] px-3 py-2.5 text-sm outline-none"
            >
              <option value="macho">Machos</option>
              <option value="femea">Fêmeas</option>
            </select>
          </label>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-white/35">
          Os pesos são preenchidos com referências práticas da raça selecionada e podem ser alterados para refletir o seu rebanho.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold">Rebanho e comercialização</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label={sistema === "cria" ? "Matrizes expostas" : "Animais comprados"} value={quantidade} onChange={setQuantidade} suffix="cabeças" />
              {sistema === "cria" ? (
                <>
                  <Field label="Período de gestação" value={mesesGestacao} onChange={setMesesGestacao} suffix="meses" min={1} step={0.1} />
                  <Field label="Nascimento até a venda" value={mesesAteVenda} onChange={setMesesAteVenda} suffix="meses" min={0} step={0.1} />
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-white/55">Duração total do ciclo</span>
                    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold">
                      {number.format(result.totalCycleMonths)} meses
                    </div>
                  </div>
                </>
              ) : (
                <Field label="Duração do ciclo" value={meses} onChange={setMeses} suffix="meses" min={1} />
              )}
              {sistema !== "cria" && <Field label="Peso médio de entrada" value={pesoEntrada} onChange={setPesoEntrada} suffix="kg" />}
              <Field label="Peso médio de venda" value={pesoSaida} onChange={setPesoSaida} suffix="kg" />
              <Field label="Rendimento de carcaça" value={rendimentoCarcaca} onChange={setRendimentoCarcaca} suffix="%" step={0.5} />
              {sistema === "cria" && <Field label="Taxa de natalidade" value={taxaNatalidade} onChange={setTaxaNatalidade} suffix="%" />}
              <Field label="Mortalidade no ciclo" value={mortalidade} onChange={setMortalidade} suffix="%" step={0.1} />
              {sistema !== "cria" && <Field label="Compra por cabeça" value={precoCompraCabeca} onChange={setPrecoCompraCabeca} suffix="R$" />}
              <Field label="Ágio/deságio de leilão" value={premioLeilao} onChange={setPremioLeilao} suffix="%" step={0.5} min={-100} />
            </div>
            {sistema === "cria" && (
              <p className="mt-4 rounded-xl border border-amber-400/15 bg-amber-500/5 px-3 py-2.5 text-xs leading-relaxed text-amber-100/70">
                No sistema de cria, os custos mensais são calculados desde o início da gestação até a idade informada para venda do bezerro.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
            <h2 className="mb-1 text-lg font-semibold">Custos</h2>
            <p className="mb-4 text-xs text-white/35">
              Informe o valor mensal total de cada despesa para toda a operação. Esses valores não são multiplicados pela quantidade de animais.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Sal e suplementação" value={sal} onChange={setSal} suffix="R$/mês total" />
              <Field label="Veterinário" value={veterinario} onChange={setVeterinario} suffix="R$/mês total" />
              <Field label="Peão / mão de obra" value={peao} onChange={setPeao} suffix="R$/mês total" />
              <Field label="Vacinas" value={vacinas} onChange={setVacinas} suffix="R$/mês total" />
              <Field label="Vermífugo" value={vermifugo} onChange={setVermifugo} suffix="R$/mês total" />
              <Field label="Outros custos" value={outros} onChange={setOutros} suffix="R$/mês total" />
              <Field label="Cercas e pastagens (opcional)" value={cercasPastagens} onChange={setCercasPastagens} suffix="R$ total" />
              <Field label="Pilhetas, açudes e bebedouros (opcional)" value={estruturaAgua} onChange={setEstruturaAgua} suffix="R$ total" />
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold">Preço de referência</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-white/55">Cotação do site</span>
                <select
                  value={quoteIndex}
                  onChange={(event) => {
                    setQuoteIndex(Number(event.target.value));
                    setManualPrice(null);
                  }}
                  className="rounded-xl border border-white/10 bg-[#151a13] px-3 py-2.5 text-sm outline-none"
                >
                  {quotes.map((item, index) => (
                    <option key={`${item.productSlug}-${item.city}-${item.state}`} value={index}>
                      {item.label} — {item.city}/{item.state} — R$ {item.price.toFixed(2)}
                    </option>
                  ))}
                </select>
              </label>
              <Field label="Preço da arroba usado" value={arroba} onChange={(value) => setManualPrice(value)} suffix="R$/@" step={0.01} />
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className={`rounded-2xl border p-5 sm:p-6 ${result.profit >= 0 ? "border-green-500/25 bg-green-500/8" : "border-red-500/25 bg-red-500/8"}`}>
            <p className="text-xs font-medium uppercase tracking-wider text-white/45">Resultado projetado</p>
            <p className={`mt-2 text-4xl font-extrabold ${result.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
              {currency.format(result.profit)}
            </p>
            <p className="mt-2 text-sm text-white/55">
              {result.profit >= 0 ? "A operação fica no azul" : "A operação fica no vermelho"} com margem de {number.format(result.margin)}%.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-black/15 p-3">
                <p className="text-xs text-white/35">Receita bruta</p>
                <p className="mt-1 font-semibold">{currency.format(result.grossRevenue)}</p>
              </div>
              <div className="rounded-xl bg-black/15 p-3">
                <p className="text-xs text-white/35">Custo total</p>
                <p className="mt-1 font-semibold">{currency.format(result.totalCosts)}</p>
              </div>
              <div className="rounded-xl bg-black/15 p-3">
                <p className="text-xs text-white/35">Animais vendidos</p>
                <p className="mt-1 font-semibold">{number.format(result.saleAnimals)} cabeças</p>
              </div>
              <div className="rounded-xl bg-black/15 p-3">
                <p className="text-xs text-white/35">Ponto de equilíbrio</p>
                <p className="mt-1 font-semibold">R$ {result.breakEvenArroba.toFixed(2)}/@</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
            <h2 className="text-lg font-semibold">Gastos × receitas ao longo do ciclo</h2>
            <p className="mb-5 mt-1 text-xs text-white/35">A receita é reconhecida no mês da venda. A linha de resultado evidencia o momento em que a operação sai do vermelho.</p>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.chart} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tickFormatter={(value) => `R$ ${Math.round(Number(value) / 1000)}k`} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} width={58} />
                  <Tooltip formatter={(value) => currency.format(Number(value))} contentStyle={{ background: "#151a13", border: "1px solid rgba(255,255,255,.12)", borderRadius: 12 }} />
                  <Legend />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,.25)" />
                  <Line type="monotone" dataKey="gastos" name="Gastos acumulados" stroke="#f87171" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="receitas" name="Receitas acumuladas" stroke="#4ade80" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="resultado" name="Resultado" stroke="#facc15" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
            <h2 className="text-lg font-semibold">Composição dos custos</h2>
            <div className="mt-4 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { name: "Compra", valor: result.purchaseCosts },
                  { name: "Manejo", valor: result.recurringCosts },
                  { name: "Cercas/pasto", valor: cercasPastagens },
                  { name: "Água", valor: estruturaAgua },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} />
                  <YAxis tickFormatter={(value) => `R$ ${Math.round(Number(value) / 1000)}k`} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} width={58} />
                  <Tooltip formatter={(value) => currency.format(Number(value))} contentStyle={{ background: "#151a13", border: "1px solid rgba(255,255,255,.12)", borderRadius: 12 }} />
                  <Area type="monotone" dataKey="valor" name="Custo" stroke="#fb923c" fill="rgba(251,146,60,.22)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </div>

      <p className="text-center text-xs leading-relaxed text-white/30">
        Simulação estimativa. Pesos, rendimento de carcaça, mortalidade, taxas reprodutivas e preços variam conforme genética, manejo, região e modalidade de venda. Custos de terra, juros, impostos e frete devem ser incluídos em “Outros custos” quando aplicáveis.
      </p>
    </div>
  );
}
