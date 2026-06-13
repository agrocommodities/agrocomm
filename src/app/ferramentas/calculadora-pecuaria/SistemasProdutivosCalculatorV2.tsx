"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
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
  freightCapacity: number;
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
    freightCapacity: 25,
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
    freightCapacity: 20,
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
    freightCapacity: 18,
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
    freightCapacity: 20,
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
    freightCapacity: 18,
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
    freightCapacity: 18,
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
    freightCapacity: 18,
    description: "Compra de adulto magro e venda final ao frigorífico.",
  },
];

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});
const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

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

export default function SistemasProdutivosCalculatorV2({ quotes }: Props) {
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

  const [saltDailyKg, setSaltDailyKg] = useState(0.3);
  const [saltBagKg, setSaltBagKg] = useState(40);
  const [saltBagPrice, setSaltBagPrice] = useState(70);
  const [veterinarianMonthly, setVeterinarianMonthly] = useState(4800);
  const [workerMonthly, setWorkerMonthly] = useState(2000);
  const [vaccineDosePrice, setVaccineDosePrice] = useState(7);
  const [vaccineDoses, setVaccineDoses] = useState(1);
  const [dewormerDosePrice, setDewormerDosePrice] = useState(10);
  const [dewormerDoses, setDewormerDoses] = useState(1);
  const [otherMonthlyCosts, setOtherMonthlyCosts] = useState(0);
  const [fixedCosts, setFixedCosts] = useState(0);

  const [freightPerTruck, setFreightPerTruck] = useState(300);
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

  const calculations = useMemo(() => {
    const calculate = (system: SystemDefinition): Result => {
      const active = system.id === systemId;
      const localMonths = active ? months : system.months;
      const localExitWeight = active ? exitWeight : system.exitWeight;
      const isCria = system.group === "Cria";
      const animalsBorn = isCria ? quantity * (birthRate / 100) : quantity;
      const animalsSold = animalsBorn * (1 - mortality / 100);
      const purchaseCosts = isCria ? 0 : purchasePriceHead * quantity;

      const saltMonthly =
        ((saltDailyKg * animalsBorn * 30) / Math.max(1, saltBagKg)) *
        saltBagPrice;
      const vaccineCosts = vaccineDosePrice * vaccineDoses * animalsBorn;
      const dewormerCosts = dewormerDosePrice * dewormerDoses * animalsBorn;
      const recurringMonthly =
        saltMonthly + veterinarianMonthly + workerMonthly + otherMonthlyCosts;
      const productionCosts =
        recurringMonthly * localMonths +
        vaccineCosts +
        dewormerCosts +
        fixedCosts +
        purchaseCosts;

      const livePrice = sex === "macho" ? livePriceMale : livePriceFemale;
      const revenue = system.liveSale
        ? animalsSold * localExitWeight * livePrice
        : animalsSold *
          ((localExitWeight * (carcassYield / 100)) / 15) *
          quote.price;

      const freightTrips =
        system.liveSale && saleChannel === "leilao"
          ? Math.ceil(animalsSold / system.freightCapacity)
          : 0;
      const freightCosts = freightTrips * freightPerTruck;
      const commissionRate =
        saleChannel === "leilao" ? auctionCommission : brokerCommission;
      const commercialCosts = system.liveSale
        ? revenue * (commissionRate / 100) +
          revenue * (invoiceTax / 100) +
          freightCosts
        : revenue * (invoiceTax / 100);

      const totalCosts = productionCosts + commercialCosts;
      const profit = revenue - totalCosts;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      let buyerMarginRequired: number | null = null;
      if (system.id === "engorda-vivo") {
        const buyerResaleRevenue =
          animalsSold *
          ((localExitWeight * (carcassYield / 100)) / 15) *
          quote.price;
        const requiredPurchaseLimit =
          buyerResaleRevenue * (1 - buyerTargetMargin / 100);
        buyerMarginRequired =
          buyerResaleRevenue > 0
            ? ((buyerResaleRevenue - revenue) / buyerResaleRevenue) * 100
            : 0;
        if (requiredPurchaseLimit < revenue)
          buyerMarginRequired = -Math.abs(buyerMarginRequired);
      }

      return {
        id: system.id,
        label: system.label,
        revenue,
        totalCosts,
        profit,
        margin,
        monthlyProfit: profit / Math.max(1, localMonths),
        buyerMarginRequired,
      };
    };

    const results = SYSTEMS.map(calculate);
    const current = results.find((item) => item.id === systemId) ?? results[0];
    const animalsBase =
      selected.group === "Cria" ? quantity * (birthRate / 100) : quantity;
    const animalsSold = animalsBase * (1 - mortality / 100);
    const saltMonthly =
      ((saltDailyKg * animalsBase * 30) / Math.max(1, saltBagKg)) *
      saltBagPrice;
    const recurringMonthly =
      saltMonthly + veterinarianMonthly + workerMonthly + otherMonthlyCosts;
    const vaccineCosts = vaccineDosePrice * vaccineDoses * animalsBase;
    const dewormerCosts = dewormerDosePrice * dewormerDoses * animalsBase;
    const purchaseCosts =
      selected.group === "Cria" ? 0 : purchasePriceHead * quantity;
    const freightTrips =
      selected.liveSale && saleChannel === "leilao"
        ? Math.ceil(animalsSold / selected.freightCapacity)
        : 0;
    const freightCosts = freightTrips * freightPerTruck;
    const commercialRate = selected.liveSale
      ? saleChannel === "leilao"
        ? auctionCommission
        : brokerCommission
      : 0;
    const commercialCosts =
      current.revenue * ((commercialRate + invoiceTax) / 100) + freightCosts;
    const initialCosts =
      vaccineCosts + dewormerCosts + fixedCosts + purchaseCosts;

    const projection = Array.from(
      { length: Math.max(1, months) + 1 },
      (_, month) => {
        const accumulatedCosts =
          initialCosts +
          recurringMonthly * month +
          (month === months ? commercialCosts : 0);
        const accumulatedRevenue = month === months ? current.revenue : 0;
        return {
          month: `Mês ${month}`,
          gastos: Math.round(accumulatedCosts),
          ganhos: Math.round(accumulatedRevenue),
          resultado: Math.round(accumulatedRevenue - accumulatedCosts),
        };
      },
    );

    return {
      results,
      current,
      saltMonthly,
      vaccineCosts,
      dewormerCosts,
      freightTrips,
      freightCosts,
      recurringMonthly,
      projection,
    };
  }, [
    systemId,
    selected,
    quantity,
    birthRate,
    mortality,
    months,
    exitWeight,
    purchasePriceHead,
    saltDailyKg,
    saltBagKg,
    saltBagPrice,
    veterinarianMonthly,
    workerMonthly,
    vaccineDosePrice,
    vaccineDoses,
    dewormerDosePrice,
    dewormerDoses,
    otherMonthlyCosts,
    fixedCosts,
    sex,
    livePriceMale,
    livePriceFemale,
    carcassYield,
    quote.price,
    saleChannel,
    freightPerTruck,
    auctionCommission,
    brokerCommission,
    invoiceTax,
    buyerTargetMargin,
  ]);

  const chartData = calculations.results.map((item) => ({
    name: item.label.replace(" para venda", ""),
    lucro: Math.round(item.profit),
    margem: Number(item.margin.toFixed(1)),
    mensal: Math.round(item.monthlyProfit),
  }));
  const current = calculations.current;

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
              <Field
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
                <Field
                  label="Taxa de natalidade"
                  value={birthRate}
                  onChange={setBirthRate}
                  suffix="%"
                />
              )}
              <Field
                label="Mortalidade no ciclo"
                value={mortality}
                onChange={setMortality}
                suffix="%"
                step={0.1}
              />
              <Field
                label="Duração total"
                value={months}
                onChange={setMonths}
                suffix="meses"
                min={1}
              />
              {selected.group !== "Cria" && (
                <Field
                  label="Peso de entrada"
                  value={entryWeight}
                  onChange={setEntryWeight}
                  suffix="kg"
                />
              )}
              <Field
                label="Peso de venda"
                value={exitWeight}
                onChange={setExitWeight}
                suffix="kg vivo"
              />
              {selected.group !== "Cria" && (
                <Field
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
            <h2 className="mb-1 text-lg font-semibold">Custos base</h2>
            <p className="mb-4 text-xs text-white/35">
              Sal calculado por consumo diário; vacinas e vermífugo por dose e
              animal.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                label="Consumo de sal por cabeça/dia"
                value={saltDailyKg}
                onChange={setSaltDailyKg}
                suffix="kg"
                step={0.01}
              />
              <Field
                label="Peso da saca de sal"
                value={saltBagKg}
                onChange={setSaltBagKg}
                suffix="kg"
              />
              <Field
                label="Preço da saca de sal"
                value={saltBagPrice}
                onChange={setSaltBagPrice}
                suffix="R$"
              />
              <Field
                label="Veterinário mensal"
                value={veterinarianMonthly}
                onChange={setVeterinarianMonthly}
                suffix="R$/mês"
              />
              <Field
                label="Peão mensal"
                value={workerMonthly}
                onChange={setWorkerMonthly}
                suffix="R$/mês"
              />
              <Field
                label="Outros custos mensais"
                value={otherMonthlyCosts}
                onChange={setOtherMonthlyCosts}
                suffix="R$/mês"
              />
              <Field
                label="Vacina por dose"
                value={vaccineDosePrice}
                onChange={setVaccineDosePrice}
                suffix="R$"
              />
              <Field
                label="Doses de vacina no ciclo"
                value={vaccineDoses}
                onChange={setVaccineDoses}
                suffix="doses"
              />
              <Field
                label="Vermífugo por dose"
                value={dewormerDosePrice}
                onChange={setDewormerDosePrice}
                suffix="R$"
              />
              <Field
                label="Doses de vermífugo no ciclo"
                value={dewormerDoses}
                onChange={setDewormerDoses}
                suffix="doses"
              />
              <Field
                label="Estruturas e manutenção"
                value={fixedCosts}
                onChange={setFixedCosts}
                suffix="R$ total"
              />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
              <div className="rounded-xl bg-black/15 p-3">
                <span className="text-xs text-white/35">
                  Sal mensal calculado
                </span>
                <p className="font-semibold">
                  {money.format(calculations.saltMonthly)}
                </p>
              </div>
              <div className="rounded-xl bg-black/15 p-3">
                <span className="text-xs text-white/35">Vacinas no ciclo</span>
                <p className="font-semibold">
                  {money.format(calculations.vaccineCosts)}
                </p>
              </div>
              <div className="rounded-xl bg-black/15 p-3">
                <span className="text-xs text-white/35">
                  Vermífugo no ciclo
                </span>
                <p className="font-semibold">
                  {money.format(calculations.dewormerCosts)}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold">
              Preços e comercialização
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {selected.liveSale ? (
                <>
                  <Field
                    label="Preço do kg vivo — macho"
                    value={livePriceMale}
                    onChange={setLivePriceMale}
                    suffix="R$/kg"
                    step={0.01}
                  />
                  <Field
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
                  <Field
                    label="Rendimento de carcaça"
                    value={carcassYield}
                    onChange={setCarcassYield}
                    suffix="%"
                    step={0.5}
                  />
                </>
              )}
              <Field
                label="Nota fiscal"
                value={invoiceTax}
                onChange={setInvoiceTax}
                suffix="% receita"
                step={0.1}
              />
              {selected.liveSale && saleChannel === "leilao" && (
                <>
                  <Field
                    label="Frete por caminhão"
                    value={freightPerTruck}
                    onChange={setFreightPerTruck}
                    suffix="R$"
                  />
                  <Field
                    label="Comissão do leilão"
                    value={auctionCommission}
                    onChange={setAuctionCommission}
                    suffix="% receita"
                    step={0.1}
                  />
                </>
              )}
              {selected.liveSale && saleChannel === "pecuarista" && (
                <Field
                  label="Comissão do corretor"
                  value={brokerCommission}
                  onChange={setBrokerCommission}
                  suffix="% receita"
                  step={0.1}
                />
              )}
              {selected.id === "engorda-vivo" && (
                <Field
                  label="Margem desejada pelo comprador"
                  value={buyerTargetMargin}
                  onChange={setBuyerTargetMargin}
                  suffix="%"
                  step={0.5}
                />
              )}
            </div>
            {selected.liveSale && saleChannel === "leilao" && (
              <p className="mt-4 text-xs text-white/40">
                Lotação: {selected.freightCapacity} animais por caminhão. Cargas
                estimadas: {calculations.freightTrips}. Frete total:{" "}
                {money.format(calculations.freightCosts)}.
              </p>
            )}
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
              Gastos, ganhos e projeção do ciclo
            </h2>
            <p className="mt-1 text-xs text-white/35">
              A receita é reconhecida no mês da venda; os gastos se acumulam
              durante o ciclo.
            </p>
            <div className="mt-4 h-80 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={calculations.projection}
                  margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,.08)"
                  />
                  <XAxis
                    dataKey="month"
                    interval="preserveStartEnd"
                    tick={{ fill: "rgba(255,255,255,.45)", fontSize: 10 }}
                  />
                  <YAxis
                    tickFormatter={(value) =>
                      `R$ ${Math.round(Number(value) / 1000)}k`
                    }
                    width={58}
                    tick={{ fill: "rgba(255,255,255,.45)", fontSize: 10 }}
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
                  <ReferenceLine y={0} stroke="rgba(255,255,255,.25)" />
                  <Line
                    type="monotone"
                    dataKey="gastos"
                    name="Gastos acumulados"
                    stroke="#f87171"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="ganhos"
                    name="Ganhos acumulados"
                    stroke="#4ade80"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="resultado"
                    name="Resultado projetado"
                    stroke="#facc15"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
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
                    width={58}
                    tick={{ fill: "rgba(255,255,255,.45)", fontSize: 10 }}
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
                    width={58}
                    tick={{ fill: "rgba(255,255,255,.45)", fontSize: 10 }}
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
                    width={48}
                    tick={{ fill: "rgba(255,255,255,.45)", fontSize: 10 }}
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
