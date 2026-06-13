"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SystemId =
  | "cria-bezerro"
  | "cria-novilho"
  | "cria-abate"
  | "recria-vivo"
  | "recria-abate"
  | "engorda-vivo"
  | "engorda-abate";

type SaleChannel = "leilao" | "pecuarista";
type Sex = "macho" | "femea";

type QuoteOption = {
  label: string;
  productSlug: string;
  city: string;
  state: string;
  price: number;
};

type Props = { quotes: QuoteOption[] };

type SystemDefinition = {
  id: SystemId;
  label: string;
  group: "Cria" | "Recria" | "Engorda";
  liveSale: boolean;
  months: number;
  entryWeight: number;
  exitWeight: number;
  description: string;
};

type Result = {
  id: SystemId;
  label: string;
  revenue: number;
  totalCosts: number;
  profit: number;
  margin: number;
  monthlyProfit: number;
  buyerMarginRequired: number | null;
};

const SYSTEMS: SystemDefinition[] = [
  {
    id: "cria-bezerro",
    label: "Cria para venda como bezerro",
    group: "Cria",
    liveSale: true,
    months: 17,
    entryWeight: 0,
    exitWeight: 200,
    description:
      "Gestação mais criação até a desmama, com venda em leilão ou para pecuarista.",
  },
  {
    id: "cria-novilho",
    label: "Cria para venda como novilho/novilha",
    group: "Cria",
    liveSale: true,
    months: 33,
    entryWeight: 0,
    exitWeight: 390,
    description: "Gestação mais 24 meses até a venda como novilho ou novilha.",
  },
  {
    id: "cria-abate",
    label: "Cria até o abate final",
    group: "Cria",
    liveSale: false,
    months: 45,
    entryWeight: 0,
    exitWeight: 520,
    description: "Gestação mais 36 meses até a venda final para abate.",
  },
  {
    id: "recria-vivo",
    label: "Recria para venda de gado vivo",
    group: "Recria",
    liveSale: true,
    months: 18,
    entryWeight: 200,
    exitWeight: 400,
    description:
      "Compra de bezerro ou bezerra e venda como boi, vaca ou garrote.",
  },
  {
    id: "recria-abate",
    label: "Recria para abate",
    group: "Recria",
    liveSale: false,
    months: 24,
    entryWeight: 200,
    exitWeight: 500,
    description: "Compra de bezerro ou bezerra e terminação até o abate.",
  },
  {
    id: "engorda-vivo",
    label: "Engorda para venda de gado vivo",
    group: "Engorda",
    liveSale: true,
    months: 8,
    entryWeight: 380,
    exitWeight: 500,
    description:
      "Compra de adulto magro e venda gordo em leilão ou para pecuarista.",
  },
  {
    id: "engorda-abate",
    label: "Engorda para abate",
    group: "Engorda",
    liveSale: false,
    months: 8,
    entryWeight: 380,
    exitWeight: 520,
    description: "Compra de adulto magro e venda final ao frigorífico.",
  },
];

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});
const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

function NumberField({
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
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs font-medium text-white/55">{label}</span>
      <div className="relative min-w-0">
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value) || 0)}
          className="w-full min-w-0 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 pr-14 text-sm outline-none focus:border-green-500/50"
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

export default function SistemasProdutivosCalculator({ quotes }: Props) {
  const [systemId, setSystemId] = useState<SystemId>("cria-bezerro");
  const [saleChannel, setSaleChannel] = useState<SaleChannel>("leilao");
  const [sex, setSex] = useState<Sex>("macho");
  const [quantity, setQuantity] = useState(100);
  const [birthRate, setBirthRate] = useState(80);
  const [mortality, setMortality] = useState(3);
  const [months, setMonths] = useState(17);
  const [entryWeight, setEntryWeight] = useState(0);
  const [exitWeight, setExitWeight] = useState(200);
  const [purchasePriceHead, setPurchasePriceHead] = useState(0);
  const [livePriceMale, setLivePriceMale] = useState(12);
  const [livePriceFemale, setLivePriceFemale] = useState(10.5);
  const [carcassYield, setCarcassYield] = useState(52);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [monthlyCosts, setMonthlyCosts] = useState(5000);
  const [fixedCosts, setFixedCosts] = useState(0);
  const [freight, setFreight] = useState(0);
  const [auctionCommission, setAuctionCommission] = useState(3);
  const [brokerCommission, setBrokerCommission] = useState(2);
  const [invoiceTax, setInvoiceTax] = useState(1);
  const [buyerTargetMargin, setBuyerTargetMargin] = useState(15);

  const selected = SYSTEMS.find((item) => item.id === systemId) ?? SYSTEMS[0];
  const quote = quotes[quoteIndex] ?? {
    label: "Cotação manual",
    productSlug: "boi-gordo",
    city: "",
    state: "",
    price: 300,
  };

  function selectSystem(id: SystemId) {
    const next = SYSTEMS.find((item) => item.id === id) ?? SYSTEMS[0];
    setSystemId(id);
    setMonths(next.months);
    setEntryWeight(next.entryWeight);
    setExitWeight(next.exitWeight);
  }

  const results = useMemo(() => {
    const calculate = (system: SystemDefinition): Result => {
      const isCria = system.group === "Cria";
      const animalsBorn = isCria ? quantity * (birthRate / 100) : quantity;
      const animalsSold = animalsBorn * (1 - mortality / 100);
      const localMonths = system.id === systemId ? months : system.months;
      const localExitWeight =
        system.id === systemId ? exitWeight : system.exitWeight;
      const purchaseCosts = isCria ? 0 : purchasePriceHead * quantity;
      const productionCosts =
        monthlyCosts * localMonths + fixedCosts + purchaseCosts;

      const livePrice = sex === "macho" ? livePriceMale : livePriceFemale;
      const grossRevenue = system.liveSale
        ? animalsSold * localExitWeight * livePrice
        : animalsSold *
          ((localExitWeight * (carcassYield / 100)) / 15) *
          quote.price;

      const commercialCosts = system.liveSale
        ? grossRevenue *
            ((saleChannel === "leilao" ? auctionCommission : brokerCommission) /
              100) +
          grossRevenue * (invoiceTax / 100) +
          (saleChannel === "leilao" ? freight : 0)
        : grossRevenue * (invoiceTax / 100);

      const totalCosts = productionCosts + commercialCosts;
      const profit = grossRevenue - totalCosts;
      const margin = grossRevenue > 0 ? (profit / grossRevenue) * 100 : 0;

      let buyerMarginRequired: number | null = null;
      if (system.id === "engorda-vivo") {
        const buyerResaleRevenue =
          animalsSold *
          ((localExitWeight * (carcassYield / 100)) / 15) *
          quote.price;
        const maximumBuyerPurchase =
          buyerResaleRevenue * (1 - buyerTargetMargin / 100);
        buyerMarginRequired =
          grossRevenue > 0
            ? ((buyerResaleRevenue - grossRevenue) / buyerResaleRevenue) * 100
            : 0;
        if (maximumBuyerPurchase < grossRevenue)
          buyerMarginRequired = -Math.abs(buyerMarginRequired);
      }

      return {
        id: system.id,
        label: system.label,
        revenue: grossRevenue,
        totalCosts,
        profit,
        margin,
        monthlyProfit: profit / Math.max(1, localMonths),
        buyerMarginRequired,
      };
    };

    return SYSTEMS.map(calculate);
  }, [
    systemId,
    quantity,
    birthRate,
    mortality,
    months,
    exitWeight,
    purchasePriceHead,
    monthlyCosts,
    fixedCosts,
    sex,
    livePriceMale,
    livePriceFemale,
    carcassYield,
    quote.price,
    saleChannel,
    auctionCommission,
    brokerCommission,
    invoiceTax,
    freight,
    buyerTargetMargin,
  ]);

  const current = results.find((item) => item.id === systemId) ?? results[0];
  const chartData = results.map((item) => ({
    name: item.label.replace(" para venda", ""),
    lucro: Math.round(item.profit),
    margem: Number(item.margin.toFixed(1)),
    mensal: Math.round(item.monthlyProfit),
  }));

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Sistema produtivo</span>
          <select
            value={systemId}
            onChange={(event) => selectSystem(event.target.value as SystemId)}
            className="w-full rounded-xl border border-white/10 bg-[#151a13] px-3 py-3 text-sm outline-none"
          >
            {SYSTEMS.map((system) => (
              <option key={system.id} value={system.id}>
                {system.label}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-3 text-sm leading-relaxed text-white/45">
          {selected.description}
        </p>
      </section>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold">Animais e ciclo</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <NumberField
                label={
                  selected.group === "Cria"
                    ? "Matrizes expostas"
                    : "Animais comprados"
                }
                value={quantity}
                onChange={setQuantity}
                suffix="cabeças"
              />
              {selected.group === "Cria" && (
                <NumberField
                  label="Taxa de natalidade"
                  value={birthRate}
                  onChange={setBirthRate}
                  suffix="%"
                />
              )}
              <NumberField
                label="Mortalidade no ciclo"
                value={mortality}
                onChange={setMortality}
                suffix="%"
                step={0.1}
              />
              <NumberField
                label="Duração total"
                value={months}
                onChange={setMonths}
                suffix="meses"
                min={1}
              />
              {selected.group !== "Cria" && (
                <NumberField
                  label="Peso de entrada"
                  value={entryWeight}
                  onChange={setEntryWeight}
                  suffix="kg"
                />
              )}
              <NumberField
                label="Peso de venda"
                value={exitWeight}
                onChange={setExitWeight}
                suffix="kg vivo"
              />
              {selected.group !== "Cria" && (
                <NumberField
                  label="Compra por cabeça"
                  value={purchasePriceHead}
                  onChange={setPurchasePriceHead}
                  suffix="R$"
                />
              )}
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-white/55">
                  Sexo do lote
                </span>
                <select
                  value={sex}
                  onChange={(event) => setSex(event.target.value as Sex)}
                  className="rounded-xl border border-white/10 bg-[#151a13] px-3 py-2.5 text-sm"
                >
                  <option value="macho">Machos</option>
                  <option value="femea">Fêmeas</option>
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold">Preços e modalidade</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {selected.liveSale ? (
                <>
                  <NumberField
                    label="Preço do kg vivo — macho"
                    value={livePriceMale}
                    onChange={setLivePriceMale}
                    suffix="R$/kg"
                    step={0.01}
                  />
                  <NumberField
                    label="Preço do kg vivo — fêmea"
                    value={livePriceFemale}
                    onChange={setLivePriceFemale}
                    suffix="R$/kg"
                    step={0.01}
                  />
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-white/55">
                      Canal de venda
                    </span>
                    <select
                      value={saleChannel}
                      onChange={(event) =>
                        setSaleChannel(event.target.value as SaleChannel)
                      }
                      className="rounded-xl border border-white/10 bg-[#151a13] px-3 py-2.5 text-sm"
                    >
                      <option value="leilao">Leilão</option>
                      <option value="pecuarista">Outro pecuarista</option>
                    </select>
                  </label>
                </>
              ) : (
                <>
                  <label className="flex flex-col gap-1.5 sm:col-span-2">
                    <span className="text-xs font-medium text-white/55">
                      Cotação para abate
                    </span>
                    <select
                      value={quoteIndex}
                      onChange={(event) =>
                        setQuoteIndex(Number(event.target.value))
                      }
                      className="rounded-xl border border-white/10 bg-[#151a13] px-3 py-2.5 text-sm"
                    >
                      {quotes.map((item, index) => (
                        <option
                          key={`${item.productSlug}-${item.city}-${item.state}`}
                          value={index}
                        >
                          {item.label} — {item.city}/{item.state} — R${" "}
                          {item.price.toFixed(2)}/@
                        </option>
                      ))}
                    </select>
                  </label>
                  <NumberField
                    label="Rendimento de carcaça"
                    value={carcassYield}
                    onChange={setCarcassYield}
                    suffix="%"
                    step={0.5}
                  />
                </>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold">Custos</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <NumberField
                label="Custos mensais totais"
                value={monthlyCosts}
                onChange={setMonthlyCosts}
                suffix="R$/mês"
              />
              <NumberField
                label="Estruturas e manutenção"
                value={fixedCosts}
                onChange={setFixedCosts}
                suffix="R$ total"
              />
              <NumberField
                label="Nota fiscal"
                value={invoiceTax}
                onChange={setInvoiceTax}
                suffix="% receita"
                step={0.1}
              />
              {selected.liveSale && saleChannel === "leilao" && (
                <>
                  <NumberField
                    label="Frete"
                    value={freight}
                    onChange={setFreight}
                    suffix="R$ total"
                  />
                  <NumberField
                    label="Comissão do leilão"
                    value={auctionCommission}
                    onChange={setAuctionCommission}
                    suffix="% receita"
                    step={0.1}
                  />
                </>
              )}
              {selected.liveSale && saleChannel === "pecuarista" && (
                <NumberField
                  label="Comissão do corretor"
                  value={brokerCommission}
                  onChange={setBrokerCommission}
                  suffix="% receita"
                  step={0.1}
                />
              )}
              {selected.id === "engorda-vivo" && (
                <NumberField
                  label="Margem desejada pelo comprador"
                  value={buyerTargetMargin}
                  onChange={setBuyerTargetMargin}
                  suffix="%"
                  step={0.5}
                />
              )}
            </div>
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <section
            className={`rounded-2xl border p-5 ${current.profit >= 0 ? "border-green-500/25 bg-green-500/8" : "border-red-500/25 bg-red-500/8"}`}
          >
            <p className="text-xs uppercase tracking-wider text-white/40">
              Resultado do sistema selecionado
            </p>
            <h2 className="mt-1 text-lg font-semibold">{current.label}</h2>
            <p
              className={`mt-3 text-4xl font-extrabold ${current.profit >= 0 ? "text-green-400" : "text-red-400"}`}
            >
              {money.format(current.profit)}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-white/35">Receita</span>
                <p>{money.format(current.revenue)}</p>
              </div>
              <div>
                <span className="text-white/35">Custos</span>
                <p>{money.format(current.totalCosts)}</p>
              </div>
              <div>
                <span className="text-white/35">Margem</span>
                <p>{decimal.format(current.margin)}%</p>
              </div>
              <div>
                <span className="text-white/35">Lucro mensal médio</span>
                <p>{money.format(current.monthlyProfit)}</p>
              </div>
            </div>
            {current.buyerMarginRequired !== null && (
              <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/5 p-3 text-sm">
                <span className="text-white/45">
                  Margem estimada disponível ao comprador:
                </span>
                <p className="mt-1 font-semibold text-amber-300">
                  {decimal.format(current.buyerMarginRequired)}%
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
            <h2 className="text-lg font-semibold">
              Lucro total por modalidade
            </h2>
            <div className="mt-4 h-80 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 8, left: 0, bottom: 70 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,.08)"
                  />
                  <XAxis
                    dataKey="name"
                    angle={-28}
                    textAnchor="end"
                    interval={0}
                    height={90}
                    tick={{ fill: "rgba(255,255,255,.45)", fontSize: 10 }}
                  />
                  <YAxis
                    tickFormatter={(value) =>
                      `R$ ${Math.round(Number(value) / 1000)}k`
                    }
                    tick={{ fill: "rgba(255,255,255,.45)", fontSize: 10 }}
                    width={58}
                  />
                  <Tooltip
                    formatter={(value) => money.format(Number(value))}
                    contentStyle={{
                      background: "#151a13",
                      border: "1px solid rgba(255,255,255,.12)",
                      borderRadius: 12,
                    }}
                  />
                  <Legend />
                  <Bar dataKey="lucro" name="Lucro total" fill="#4ade80" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
            <h2 className="text-lg font-semibold">
              Rentabilidade mensal por modalidade
            </h2>
            <div className="mt-4 h-80 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 8, left: 0, bottom: 70 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,.08)"
                  />
                  <XAxis
                    dataKey="name"
                    angle={-28}
                    textAnchor="end"
                    interval={0}
                    height={90}
                    tick={{ fill: "rgba(255,255,255,.45)", fontSize: 10 }}
                  />
                  <YAxis
                    tickFormatter={(value) =>
                      `R$ ${Math.round(Number(value) / 1000)}k`
                    }
                    tick={{ fill: "rgba(255,255,255,.45)", fontSize: 10 }}
                    width={58}
                  />
                  <Tooltip
                    formatter={(value) => money.format(Number(value))}
                    contentStyle={{
                      background: "#151a13",
                      border: "1px solid rgba(255,255,255,.12)",
                      borderRadius: 12,
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="mensal"
                    name="Lucro mensal médio"
                    fill="#facc15"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
            <h2 className="text-lg font-semibold">
              Margem percentual por modalidade
            </h2>
            <div className="mt-4 h-72 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 8, left: 0, bottom: 70 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,.08)"
                  />
                  <XAxis
                    dataKey="name"
                    angle={-28}
                    textAnchor="end"
                    interval={0}
                    height={90}
                    tick={{ fill: "rgba(255,255,255,.45)", fontSize: 10 }}
                  />
                  <YAxis
                    tickFormatter={(value) => `${value}%`}
                    tick={{ fill: "rgba(255,255,255,.45)", fontSize: 10 }}
                    width={48}
                  />
                  <Tooltip
                    formatter={(value) => `${Number(value).toFixed(1)}%`}
                    contentStyle={{
                      background: "#151a13",
                      border: "1px solid rgba(255,255,255,.12)",
                      borderRadius: 12,
                    }}
                  />
                  <Legend />
                  <Bar dataKey="margem" name="Margem" fill="#60a5fa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
