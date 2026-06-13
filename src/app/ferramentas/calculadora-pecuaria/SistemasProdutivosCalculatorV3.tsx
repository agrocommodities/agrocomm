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
  maleExitWeight: number;
  femaleExitWeight: number;
  freightCapacity: number;
  purchaseKind: "matrizes" | "bezerros" | "novilhos" | "magros";
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
};

const SYSTEMS: SystemDefinition[] = [
  { id: "cria-bezerro", label: "Cria para venda como bezerro", group: "Cria", liveSale: true, months: 17, maleExitWeight: 210, femaleExitWeight: 190, freightCapacity: 25, purchaseKind: "matrizes", description: "Gestação mais criação até a desmama, com venda em leilão ou para pecuarista." },
  { id: "cria-novilho", label: "Cria para venda como novilho/novilha", group: "Cria", liveSale: true, months: 33, maleExitWeight: 420, femaleExitWeight: 360, freightCapacity: 20, purchaseKind: "matrizes", description: "Gestação mais 24 meses até a venda como novilho ou novilha." },
  { id: "cria-abate", label: "Cria até o abate final", group: "Cria", liveSale: false, months: 45, maleExitWeight: 540, femaleExitWeight: 450, freightCapacity: 18, purchaseKind: "matrizes", description: "Gestação mais 36 meses até a venda final para abate." },
  { id: "recria-vivo", label: "Recria para venda de gado vivo", group: "Recria", liveSale: true, months: 18, maleExitWeight: 420, femaleExitWeight: 360, freightCapacity: 20, purchaseKind: "bezerros", description: "Compra de bezerros e bezerras para venda como boi, vaca ou garrote." },
  { id: "recria-abate", label: "Recria para abate", group: "Recria", liveSale: false, months: 24, maleExitWeight: 520, femaleExitWeight: 440, freightCapacity: 18, purchaseKind: "bezerros", description: "Compra de bezerros e bezerras e terminação até o abate." },
  { id: "engorda-vivo", label: "Engorda para venda de gado vivo", group: "Engorda", liveSale: true, months: 8, maleExitWeight: 520, femaleExitWeight: 450, freightCapacity: 18, purchaseKind: "magros", description: "Compra de boi/vaca ou novilho/novilha magros para venda gordos." },
  { id: "engorda-abate", label: "Engorda para abate", group: "Engorda", liveSale: false, months: 8, maleExitWeight: 540, femaleExitWeight: 460, freightCapacity: 18, purchaseKind: "magros", description: "Compra de gado magro e venda final ao frigorífico." },
];

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

function Field({ label, value, onChange, suffix, min = 0, max, step = 1 }: { label: string; value: number; onChange: (value: number) => void; suffix?: string; min?: number; max?: number; step?: number }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs font-medium text-white/55">{label}</span>
      <div className="relative min-w-0">
        <input type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value) || 0)} className="w-full min-w-0 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 pr-14 text-sm outline-none focus:border-green-500/50" />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/35">{suffix}</span>}
      </div>
    </label>
  );
}

export default function SistemasProdutivosCalculatorV3({ quotes }: Props) {
  const [systemId, setSystemId] = useState<SystemId>("cria-bezerro");
  const [saleChannel, setSaleChannel] = useState<SaleChannel>("leilao");
  const [quantity, setQuantity] = useState(100);
  const [femalePercent, setFemalePercent] = useState(54);
  const [birthRate, setBirthRate] = useState(80);
  const [mortality, setMortality] = useState(3);
  const [months, setMonths] = useState(17);
  const [maleExitWeight, setMaleExitWeight] = useState(210);
  const [femaleExitWeight, setFemaleExitWeight] = useState(190);
  const [livePriceMale, setLivePriceMale] = useState(12);
  const [livePriceFemale, setLivePriceFemale] = useState(10.5);
  const [cityKey, setCityKey] = useState("");
  const [maleYield, setMaleYield] = useState(51);
  const [femaleYield, setFemaleYield] = useState(48);

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

  const [purchaseMatrices, setPurchaseMatrices] = useState(0);
  const [purchaseCalves, setPurchaseCalves] = useState(0);
  const [purchaseYoung, setPurchaseYoung] = useState(0);
  const [purchaseLeanAdult, setPurchaseLeanAdult] = useState(0);

  const [freightPerTruck, setFreightPerTruck] = useState(300);
  const [auctionCommission, setAuctionCommission] = useState(3);
  const [brokerCommission, setBrokerCommission] = useState(2);
  const [invoiceTax, setInvoiceTax] = useState(1);

  const selected = SYSTEMS.find((item) => item.id === systemId) ?? SYSTEMS[0];
  const malePercent = 100 - femalePercent;

  const cityOptions = useMemo(() => {
    const map = new Map<string, { city: string; state: string }>();
    for (const quote of quotes) {
      if (quote.productSlug !== "boi-gordo") continue;
      map.set(`${quote.city}|${quote.state}`, { city: quote.city, state: quote.state });
    }
    return Array.from(map.entries()).map(([key, value]) => ({ key, ...value }));
  }, [quotes]);

  const effectiveCityKey = cityKey || cityOptions[0]?.key || "";
  const [selectedCity, selectedState] = effectiveCityKey.split("|");
  const boiQuote = quotes.find((item) => item.productSlug === "boi-gordo" && item.city === selectedCity && item.state === selectedState);
  const vacaQuote = quotes.find((item) => item.productSlug === "vaca-gorda" && item.city === selectedCity && item.state === selectedState);
  const maleArroba = boiQuote?.price ?? 300;
  const femaleArroba = vacaQuote?.price ?? maleArroba * 0.9;

  function selectSystem(id: SystemId) {
    const next = SYSTEMS.find((item) => item.id === id) ?? SYSTEMS[0];
    setSystemId(id);
    setMonths(next.months);
    setMaleExitWeight(next.maleExitWeight);
    setFemaleExitWeight(next.femaleExitWeight);
  }

  function purchaseUnitCost(kind: SystemDefinition["purchaseKind"]) {
    if (kind === "matrizes") return purchaseMatrices;
    if (kind === "bezerros") return purchaseCalves;
    if (kind === "novilhos") return purchaseYoung;
    return purchaseLeanAdult;
  }

  const calculations = useMemo(() => {
    const calculate = (system: SystemDefinition): Result => {
      const active = system.id === systemId;
      const localMonths = active ? months : system.months;
      const localMaleWeight = active ? maleExitWeight : system.maleExitWeight;
      const localFemaleWeight = active ? femaleExitWeight : system.femaleExitWeight;
      const breedingBase = system.group === "Cria" ? quantity * (birthRate / 100) : quantity;
      const sold = breedingBase * (1 - mortality / 100);
      const females = sold * (femalePercent / 100);
      const males = sold - females;

      const saltMonthly = ((saltDailyKg * breedingBase * 30) / Math.max(1, saltBagKg)) * saltBagPrice;
      const recurring = saltMonthly + veterinarianMonthly + workerMonthly + otherMonthlyCosts;
      const healthCosts = (vaccineDosePrice * vaccineDoses + dewormerDosePrice * dewormerDoses) * breedingBase;
      const purchaseCosts = purchaseUnitCost(system.purchaseKind) * quantity;
      const productionCosts = recurring * localMonths + healthCosts + fixedCosts + purchaseCosts;

      const revenue = system.liveSale
        ? males * localMaleWeight * livePriceMale + females * localFemaleWeight * livePriceFemale
        : males * ((localMaleWeight * (maleYield / 100)) / 15) * maleArroba + females * ((localFemaleWeight * (femaleYield / 100)) / 15) * femaleArroba;

      const freightTrips = system.liveSale && saleChannel === "leilao" ? Math.ceil(sold / system.freightCapacity) : 0;
      const commercialRate = system.liveSale ? (saleChannel === "leilao" ? auctionCommission : brokerCommission) : 0;
      const commercialCosts = revenue * ((commercialRate + invoiceTax) / 100) + freightTrips * freightPerTruck;
      const totalCosts = productionCosts + commercialCosts;
      const profit = revenue - totalCosts;

      return { id: system.id, label: system.label, revenue, totalCosts, profit, margin: revenue > 0 ? (profit / revenue) * 100 : 0, monthlyProfit: profit / Math.max(1, localMonths) };
    };

    const results = SYSTEMS.map(calculate);
    const current = results.find((item) => item.id === systemId) ?? results[0];
    const base = selected.group === "Cria" ? quantity * (birthRate / 100) : quantity;
    const sold = base * (1 - mortality / 100);
    const saltMonthly = ((saltDailyKg * base * 30) / Math.max(1, saltBagKg)) * saltBagPrice;
    const recurring = saltMonthly + veterinarianMonthly + workerMonthly + otherMonthlyCosts;
    const healthCosts = (vaccineDosePrice * vaccineDoses + dewormerDosePrice * dewormerDoses) * base;
    const purchaseCosts = purchaseUnitCost(selected.purchaseKind) * quantity;
    const freightTrips = selected.liveSale && saleChannel === "leilao" ? Math.ceil(sold / selected.freightCapacity) : 0;
    const commercialRate = selected.liveSale ? (saleChannel === "leilao" ? auctionCommission : brokerCommission) : 0;
    const commercialCosts = current.revenue * ((commercialRate + invoiceTax) / 100) + freightTrips * freightPerTruck;
    const initialCosts = healthCosts + fixedCosts + purchaseCosts;
    const projection = Array.from({ length: Math.max(1, months) + 1 }, (_, month) => {
      const costs = initialCosts + recurring * month + (month === months ? commercialCosts : 0);
      const gains = month === months ? current.revenue : 0;
      return { month: `Mês ${month}`, gastos: Math.round(costs), ganhos: Math.round(gains), resultado: Math.round(gains - costs) };
    });

    return { results, current, projection, saltMonthly, purchaseCosts, freightTrips, sold, males: sold * (malePercent / 100), females: sold * (femalePercent / 100) };
  }, [systemId, selected, quantity, femalePercent, malePercent, birthRate, mortality, months, maleExitWeight, femaleExitWeight, livePriceMale, livePriceFemale, maleYield, femaleYield, maleArroba, femaleArroba, saltDailyKg, saltBagKg, saltBagPrice, veterinarianMonthly, workerMonthly, vaccineDosePrice, vaccineDoses, dewormerDosePrice, dewormerDoses, otherMonthlyCosts, fixedCosts, purchaseMatrices, purchaseCalves, purchaseYoung, purchaseLeanAdult, saleChannel, auctionCommission, brokerCommission, invoiceTax, freightPerTruck]);

  const current = calculations.current;
  const chartData = calculations.results.map((item) => ({ name: item.label.replace(" para venda", ""), lucro: Math.round(item.profit), mensal: Math.round(item.monthlyProfit), margem: Number(item.margin.toFixed(1)) }));

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
        <label className="flex flex-col gap-2"><span className="text-sm font-semibold">Sistema produtivo</span><select value={systemId} onChange={(event) => selectSystem(event.target.value as SystemId)} className="w-full rounded-xl border border-white/10 bg-[#151a13] px-3 py-3 text-sm outline-none">{SYSTEMS.map((system) => <option key={system.id} value={system.id}>{system.label}</option>)}</select></label>
        <p className="mt-3 text-sm leading-relaxed text-white/45">{selected.description}</p>
      </section>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold">Animais, sexo e ciclo</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label={selected.group === "Cria" ? "Matrizes expostas" : "Animais no lote"} value={quantity} onChange={setQuantity} suffix="cabeças" />
              {selected.group === "Cria" && <Field label="Taxa de natalidade" value={birthRate} onChange={setBirthRate} suffix="%" max={100} />}
              <Field label="Mortalidade no ciclo" value={mortality} onChange={setMortality} suffix="%" max={100} step={0.1} />
              <Field label="Duração total" value={months} onChange={setMonths} suffix="meses" min={1} />
              <Field label="Peso de venda — machos" value={maleExitWeight} onChange={setMaleExitWeight} suffix="kg vivo" />
              <Field label="Peso de venda — fêmeas" value={femaleExitWeight} onChange={setFemaleExitWeight} suffix="kg vivo" />
            </div>
            <label className="mt-5 flex flex-col gap-2">
              <span className="text-xs font-medium text-white/55">Distribuição do lote: {malePercent}% machos e {femalePercent}% fêmeas</span>
              <input type="range" min={0} max={100} step={1} value={femalePercent} onChange={(event) => setFemalePercent(Number(event.target.value))} className="w-full accent-green-500" />
              <div className="flex justify-between text-[11px] text-white/30"><span>0% fêmeas</span><span>100% fêmeas</span></div>
            </label>
            <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-black/15 p-3"><span className="text-xs text-white/35">Machos projetados</span><p className="font-semibold">{decimal.format(calculations.males)}</p></div><div className="rounded-xl bg-black/15 p-3"><span className="text-xs text-white/35">Fêmeas projetadas</span><p className="font-semibold">{decimal.format(calculations.females)}</p></div></div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
            <h2 className="mb-1 text-lg font-semibold">Custos opcionais de aquisição</h2>
            <p className="mb-4 text-xs text-white/35">Informe zero quando os animais já pertencem à propriedade.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Compra de matrizes" value={purchaseMatrices} onChange={setPurchaseMatrices} suffix="R$/cabeça" />
              <Field label="Compra de bezerros/bezerras" value={purchaseCalves} onChange={setPurchaseCalves} suffix="R$/cabeça" />
              <Field label="Compra de novilhos/novilhas" value={purchaseYoung} onChange={setPurchaseYoung} suffix="R$/cabeça" />
              <Field label="Compra de gado magro — vaca/novilho" value={purchaseLeanAdult} onChange={setPurchaseLeanAdult} suffix="R$/cabeça" />
            </div>
            <p className="mt-3 text-xs text-white/40">Custo aplicado neste sistema: {money.format(calculations.purchaseCosts)}.</p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
            <h2 className="mb-1 text-lg font-semibold">Custos base</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Consumo de sal por cabeça/dia" value={saltDailyKg} onChange={setSaltDailyKg} suffix="kg" step={0.01} />
              <Field label="Peso da saca de sal" value={saltBagKg} onChange={setSaltBagKg} suffix="kg" />
              <Field label="Preço da saca de sal" value={saltBagPrice} onChange={setSaltBagPrice} suffix="R$" />
              <Field label="Veterinário mensal" value={veterinarianMonthly} onChange={setVeterinarianMonthly} suffix="R$/mês" />
              <Field label="Peão mensal" value={workerMonthly} onChange={setWorkerMonthly} suffix="R$/mês" />
              <Field label="Outros custos mensais" value={otherMonthlyCosts} onChange={setOtherMonthlyCosts} suffix="R$/mês" />
              <Field label="Vacina por dose" value={vaccineDosePrice} onChange={setVaccineDosePrice} suffix="R$" />
              <Field label="Doses de vacina" value={vaccineDoses} onChange={setVaccineDoses} suffix="doses" />
              <Field label="Vermífugo por dose" value={dewormerDosePrice} onChange={setDewormerDosePrice} suffix="R$" />
              <Field label="Doses de vermífugo" value={dewormerDoses} onChange={setDewormerDoses} suffix="doses" />
              <Field label="Estruturas e manutenção" value={fixedCosts} onChange={setFixedCosts} suffix="R$ total" />
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold">Preços e comercialização</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {selected.liveSale ? <><Field label="Preço do kg vivo — macho" value={livePriceMale} onChange={setLivePriceMale} suffix="R$/kg" step={0.01} /><Field label="Preço do kg vivo — fêmea" value={livePriceFemale} onChange={setLivePriceFemale} suffix="R$/kg" step={0.01} /><label className="flex flex-col gap-1.5"><span className="text-xs font-medium text-white/55">Canal de venda</span><select value={saleChannel} onChange={(event) => setSaleChannel(event.target.value as SaleChannel)} className="rounded-xl border border-white/10 bg-[#151a13] px-3 py-2.5 text-sm"><option value="leilao">Leilão</option><option value="pecuarista">Outro pecuarista</option></select></label></> : <><label className="flex flex-col gap-1.5 sm:col-span-2"><span className="text-xs font-medium text-white/55">Cidade da cotação</span><select value={effectiveCityKey} onChange={(event) => setCityKey(event.target.value)} className="rounded-xl border border-white/10 bg-[#151a13] px-3 py-2.5 text-sm">{cityOptions.map((city) => <option key={city.key} value={city.key}>{city.city}/{city.state}</option>)}</select></label><Field label="Rendimento de carcaça — machos" value={maleYield} onChange={setMaleYield} suffix="%" step={0.5} /><Field label="Rendimento de carcaça — fêmeas" value={femaleYield} onChange={setFemaleYield} suffix="%" step={0.5} /><div className="rounded-xl bg-black/15 p-3"><span className="text-xs text-white/35">Arroba do boi</span><p className="font-semibold">{money.format(maleArroba)}/@</p></div><div className="rounded-xl bg-black/15 p-3"><span className="text-xs text-white/35">Arroba da vaca</span><p className="font-semibold">{money.format(femaleArroba)}/@</p></div></>}
              <Field label="Nota fiscal" value={invoiceTax} onChange={setInvoiceTax} suffix="% receita" step={0.1} />
              {selected.liveSale && saleChannel === "leilao" && <><Field label="Frete por caminhão" value={freightPerTruck} onChange={setFreightPerTruck} suffix="R$" /><Field label="Comissão do leilão" value={auctionCommission} onChange={setAuctionCommission} suffix="% receita" step={0.1} /></>}
              {selected.liveSale && saleChannel === "pecuarista" && <Field label="Comissão do corretor" value={brokerCommission} onChange={setBrokerCommission} suffix="% receita" step={0.1} />}
            </div>
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <section className={`rounded-2xl border p-5 ${current.profit >= 0 ? "border-green-500/25 bg-green-500/8" : "border-red-500/25 bg-red-500/8"}`}><p className="text-xs uppercase tracking-wider text-white/40">Resultado do sistema selecionado</p><h2 className="mt-1 text-lg font-semibold">{current.label}</h2><p className={`mt-3 text-4xl font-extrabold ${current.profit >= 0 ? "text-green-400" : "text-red-400"}`}>{money.format(current.profit)}</p><div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div><span className="text-white/35">Receita</span><p>{money.format(current.revenue)}</p></div><div><span className="text-white/35">Custos</span><p>{money.format(current.totalCosts)}</p></div><div><span className="text-white/35">Margem</span><p>{decimal.format(current.margin)}%</p></div><div><span className="text-white/35">Lucro mensal médio</span><p>{money.format(current.monthlyProfit)}</p></div></div></section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6"><h2 className="text-lg font-semibold">Gastos, ganhos e projeção do ciclo</h2><div className="mt-4 h-80 min-w-0"><ResponsiveContainer width="100%" height="100%"><LineChart data={calculations.projection} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.08)" /><XAxis dataKey="month" interval="preserveStartEnd" tick={{ fill: "rgba(255,255,255,.45)", fontSize: 10 }} /><YAxis tickFormatter={(value) => `R$ ${Math.round(Number(value) / 1000)}k`} width={58} tick={{ fill: "rgba(255,255,255,.45)", fontSize: 10 }} /><Tooltip formatter={(value) => money.format(Number(value))} contentStyle={{ background: "#151a13", border: "1px solid rgba(255,255,255,.12)", borderRadius: 12 }} /><Legend /><ReferenceLine y={0} stroke="rgba(255,255,255,.25)" /><Line type="monotone" dataKey="gastos" name="Gastos acumulados" stroke="#f87171" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="ganhos" name="Ganhos acumulados" stroke="#4ade80" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="resultado" name="Resultado projetado" stroke="#facc15" strokeWidth={2.5} strokeDasharray="5 5" dot={false} /></LineChart></ResponsiveContainer></div></section>

          {[{ title: "Lucro total por modalidade", key: "lucro", color: "#4ade80", suffix: "R$" }, { title: "Rentabilidade mensal por modalidade", key: "mensal", color: "#facc15", suffix: "R$" }, { title: "Margem percentual por modalidade", key: "margem", color: "#60a5fa", suffix: "%" }].map((chart) => <section key={chart.key} className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6"><h2 className="text-lg font-semibold">{chart.title}</h2><div className="mt-4 h-80 min-w-0"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 70 }}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.08)" /><XAxis dataKey="name" angle={-28} textAnchor="end" interval={0} height={90} tick={{ fill: "rgba(255,255,255,.45)", fontSize: 10 }} /><YAxis tickFormatter={(value) => chart.suffix === "%" ? `${value}%` : `R$ ${Math.round(Number(value) / 1000)}k`} width={58} tick={{ fill: "rgba(255,255,255,.45)", fontSize: 10 }} /><Tooltip formatter={(value) => chart.suffix === "%" ? `${Number(value).toFixed(1)}%` : money.format(Number(value))} contentStyle={{ background: "#151a13", border: "1px solid rgba(255,255,255,.12)", borderRadius: 12 }} /><Legend /><Bar dataKey={chart.key} name={chart.title} fill={chart.color} /></BarChart></ResponsiveContainer></div></section>)}
        </div>
      </div>
    </div>
  );
}
