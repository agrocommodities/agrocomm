"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Sistema = "cria" | "recria" | "engorda";
type Raca = "nelore" | "angus" | "senepol" | "brangus";
type ModalidadeVenda = "leilao" | "pecuarista";

type QuoteOption = {
  label: string;
  productSlug: string;
  city: string;
  state: string;
  price: number;
};

type Props = { quotes: QuoteOption[] };

type Weights = {
  calfMale: number;
  calfFemale: number;
  youngMale: number;
  youngFemale: number;
  adultMale: number;
  adultFemale: number;
};

type Scenario = {
  key: string;
  title: string;
  description: string;
  totalMonths: number;
  revenue: number;
  productionCosts: number;
  commercialCosts: number;
  costs: number;
  profit: number;
  margin: number;
  monthlyRevenue: number;
  monthlyCosts: number;
  monthlyProfit: number;
};

const BREEDS: Record<Raca, { label: string; weights: Weights }> = {
  nelore: { label: "Nelore", weights: { calfMale: 210, calfFemale: 190, youngMale: 420, youngFemale: 360, adultMale: 540, adultFemale: 450 } },
  angus: { label: "Angus", weights: { calfMale: 230, calfFemale: 210, youngMale: 450, youngFemale: 390, adultMale: 580, adultFemale: 480 } },
  senepol: { label: "Senepol", weights: { calfMale: 225, calfFemale: 205, youngMale: 440, youngFemale: 380, adultMale: 565, adultFemale: 470 } },
  brangus: { label: "Brangus", weights: { calfMale: 225, calfFemale: 205, youngMale: 445, youngFemale: 385, adultMale: 570, adultFemale: 475 } },
};

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

function Field({ label, value, onChange, suffix, min = 0, max, step = 1 }: { label: string; value: number; onChange: (value: number) => void; suffix?: string; min?: number; max?: number; step?: number }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs font-medium text-white/55">{label}</span>
      <div className="relative min-w-0">
        <input type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value) || 0)} className="w-full min-w-0 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 pr-14 text-sm outline-none transition focus:border-green-500/50" />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/35">{suffix}</span>}
      </div>
    </label>
  );
}

export default function CalculadoraPecuariaComercial({ quotes }: Props) {
  const [sistema, setSistema] = useState<Sistema>("cria");
  const [raca, setRaca] = useState<Raca>("nelore");
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [quantidade, setQuantidade] = useState(100);
  const [meses, setMeses] = useState(12);
  const [gestacao, setGestacao] = useState(9);
  const [percentualMachos, setPercentualMachos] = useState(52);
  const [taxaNatalidade, setTaxaNatalidade] = useState(80);
  const [mortalidade, setMortalidade] = useState(3);
  const [rendimentoMacho, setRendimentoMacho] = useState(54);
  const [rendimentoFemea, setRendimentoFemea] = useState(50);
  const [precoKgVivoMacho, setPrecoKgVivoMacho] = useState(12);
  const [precoKgVivoFemea, setPrecoKgVivoFemea] = useState(10.5);
  const [agioLeilao, setAgioLeilao] = useState(0);
  const [agioReprodutora, setAgioReprodutora] = useState(20);
  const [precoCompraCabeca, setPrecoCompraCabeca] = useState(0);
  const [pesoEntrada, setPesoEntrada] = useState(200);
  const [pesoSaida, setPesoSaida] = useState(420);
  const [sal, setSal] = useState(22);
  const [veterinario, setVeterinario] = useState(5);
  const [peao, setPeao] = useState(18);
  const [vacinas, setVacinas] = useState(8);
  const [vermifugo, setVermifugo] = useState(7);
  const [outros, setOutros] = useState(0);
  const [cercasPastagens, setCercasPastagens] = useState(0);
  const [estruturaAgua, setEstruturaAgua] = useState(0);
  const [modalidadeVenda, setModalidadeVenda] = useState<ModalidadeVenda>("leilao");
  const [freteLeilao, setFreteLeilao] = useState(0);
  const [comissaoLeilao, setComissaoLeilao] = useState(3);
  const [comissaoCorretor, setComissaoCorretor] = useState(2);
  const [notaFiscal, setNotaFiscal] = useState(1);

  const quote = quotes[quoteIndex] ?? { label: "Preço manual", productSlug: "boi-gordo", city: "", state: "", price: 300 };
  const [manualPrice, setManualPrice] = useState<number | null>(null);
  const arrobaBoi = manualPrice ?? quote.price;
  const vacaQuote = quotes.find((item) => item.productSlug === "vaca-gorda");
  const arrobaVaca = vacaQuote?.price ?? arrobaBoi * 0.9;
  const weights = BREEDS[raca].weights;
  const percentualFemeas = 100 - percentualMachos;

  const result = useMemo(() => {
    const operatingCostsPerMonth = sal + veterinario + peao + vacinas + vermifugo + outros;
    const fixedCosts = cercasPastagens + estruturaAgua;
    const born = sistema === "cria" ? quantidade * (taxaNatalidade / 100) : quantidade;
    const survivors = born * (1 - mortalidade / 100);
    const males = survivors * (percentualMachos / 100);
    const females = survivors - males;

    const valueLiveWeight = (animals: number, liveWeightKg: number, pricePerKg: number, premiumPercent = 0) => animals * liveWeightKg * pricePerKg * (1 + premiumPercent / 100);
    const valueSlaughter = (animals: number, liveWeightKg: number, yieldPercent: number, arroba: number) => animals * ((liveWeightKg * (yieldPercent / 100)) / 15) * arroba;
    const calculateCommercialCosts = (revenue: number, slaughter: boolean) => {
      const invoiceCost = revenue * (notaFiscal / 100);
      if (slaughter) return invoiceCost;
      if (modalidadeVenda === "leilao") return freteLeilao + revenue * (comissaoLeilao / 100) + invoiceCost;
      return revenue * (comissaoCorretor / 100) + invoiceCost;
    };

    const buildScenario = (key: string, title: string, description: string, monthsAfterBirth: number, revenue: number, slaughter = false): Scenario => {
      const totalMonths = Math.max(1, gestacao + monthsAfterBirth);
      const productionCosts = operatingCostsPerMonth * totalMonths + fixedCosts;
      const commercialCosts = calculateCommercialCosts(revenue, slaughter);
      const costs = productionCosts + commercialCosts;
      const profit = revenue - costs;
      return { key, title, description, totalMonths, revenue, productionCosts, commercialCosts, costs, profit, margin: revenue > 0 ? (profit / revenue) * 100 : 0, monthlyRevenue: revenue / totalMonths, monthlyCosts: costs / totalMonths, monthlyProfit: profit / totalMonths };
    };

    const calfRevenue = valueLiveWeight(males, weights.calfMale, precoKgVivoMacho, agioLeilao) + valueLiveWeight(females, weights.calfFemale, precoKgVivoFemea, agioLeilao);
    const youngRevenue = valueLiveWeight(males, weights.youngMale, precoKgVivoMacho, agioLeilao) + valueLiveWeight(females, weights.youngFemale, precoKgVivoFemea, agioLeilao);
    const breederRevenue = valueLiveWeight(males, weights.adultMale, precoKgVivoMacho) + valueLiveWeight(females, weights.adultFemale, precoKgVivoFemea, agioReprodutora);
    const slaughterRevenue = valueSlaughter(males, weights.adultMale, rendimentoMacho, arrobaBoi) + valueSlaughter(females, weights.adultFemale, rendimentoFemea, arrobaVaca);

    const scenarios = sistema === "cria" ? [
      buildScenario("bezerros", "Venda como bezerros e bezerras", modalidadeVenda === "leilao" ? "Gado vivo vendido por kg, com frete, comissão e nota fiscal." : "Gado vivo vendido por kg, com corretagem e nota fiscal.", 8, calfRevenue),
      buildScenario("jovens", "Venda como garrotes e novilhas", modalidadeVenda === "leilao" ? "Gado vivo por kg após gestação + 24 meses, com custos de leilão." : "Gado vivo por kg após gestação + 24 meses, com corretagem e nota fiscal.", 24, youngRevenue),
      buildScenario("reproducao", "Vacas para criador ou leilão", modalidadeVenda === "leilao" ? "Animais vivos por kg, com valorização reprodutiva e custos de leilão." : "Animais vivos por kg, com valorização reprodutiva, corretagem e nota fiscal.", 36, breederRevenue),
      buildScenario("abate", "Bovinos para abate", "Venda por arroba de carcaça, com rendimento e nota fiscal.", 36, slaughterRevenue, true),
    ] : [];

    const safeMonths = Math.max(1, meses);
    const recurringCosts = operatingCostsPerMonth * safeMonths;
    const purchaseCosts = precoCompraCabeca * quantidade;
    const animals = quantidade * (1 - mortalidade / 100);
    const slaughter = sistema === "engorda";
    const revenue = slaughter ? valueSlaughter(animals, pesoSaida, rendimentoMacho, arrobaBoi) : valueLiveWeight(animals, pesoSaida, precoKgVivoMacho, agioLeilao);
    const commercialCosts = calculateCommercialCosts(revenue, slaughter);
    const totalCosts = recurringCosts + fixedCosts + purchaseCosts + commercialCosts;
    const profit = revenue - totalCosts;

    return { males, females, scenarios, single: { revenue, commercialCosts, totalCosts, profit, margin: revenue > 0 ? (profit / revenue) * 100 : 0, monthlyRevenue: revenue / safeMonths, monthlyCosts: totalCosts / safeMonths, monthlyProfit: profit / safeMonths } };
  }, [sistema, quantidade, taxaNatalidade, mortalidade, percentualMachos, gestacao, meses, sal, veterinario, peao, vacinas, vermifugo, outros, cercasPastagens, estruturaAgua, precoCompraCabeca, pesoSaida, rendimentoMacho, rendimentoFemea, precoKgVivoMacho, precoKgVivoFemea, arrobaBoi, arrobaVaca, agioLeilao, agioReprodutora, weights, modalidadeVenda, freteLeilao, comissaoLeilao, comissaoCorretor, notaFiscal]);

  const comparisonChart = result.scenarios.map((scenario) => ({ nome: scenario.title.replace("Venda como ", ""), gastos: Math.round(scenario.costs), receita: Math.round(scenario.revenue), lucro: Math.round(scenario.profit) }));

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <label className="flex min-w-0 flex-col gap-1.5"><span className="text-xs font-medium text-white/55">Sistema produtivo</span><select value={sistema} onChange={(event) => setSistema(event.target.value as Sistema)} className="w-full min-w-0 rounded-xl border border-white/10 bg-[#151a13] px-3 py-2.5 text-sm outline-none"><option value="cria">Cria — comparação completa</option><option value="recria">Recria — venda de gado vivo</option><option value="engorda">Engorda — venda para abate</option></select></label>
          <label className="flex min-w-0 flex-col gap-1.5"><span className="text-xs font-medium text-white/55">Raça de referência</span><select value={raca} onChange={(event) => setRaca(event.target.value as Raca)} className="w-full min-w-0 rounded-xl border border-white/10 bg-[#151a13] px-3 py-2.5 text-sm outline-none">{Object.entries(BREEDS).map(([key, breed]) => <option key={key} value={key}>{breed.label}</option>)}</select></label>
          <label className="flex min-w-0 flex-col gap-2"><span className="text-xs font-medium text-white/55">Nascimentos: {percentualMachos}% machos e {percentualFemeas}% fêmeas</span><input type="range" min={0} max={100} step={1} value={percentualMachos} onChange={(event) => setPercentualMachos(Number(event.target.value))} className="w-full accent-green-500" /></label>
        </div>
      </section>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6"><h2 className="mb-4 text-lg font-semibold">Rebanho e reprodução</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Field label={sistema === "cria" ? "Matrizes expostas" : "Animais comprados"} value={quantidade} onChange={setQuantidade} suffix="cabeças" />{sistema === "cria" ? <><Field label="Período de gestação" value={gestacao} onChange={setGestacao} suffix="meses" step={0.1} min={1} /><Field label="Taxa de natalidade" value={taxaNatalidade} onChange={setTaxaNatalidade} suffix="%" max={100} /><Field label="Mortalidade até a venda" value={mortalidade} onChange={setMortalidade} suffix="%" max={100} step={0.1} /><div className="rounded-xl border border-white/10 bg-black/15 p-3"><p className="text-xs text-white/35">Machos projetados</p><p className="mt-1 font-semibold">{decimal.format(result.males)}</p></div><div className="rounded-xl border border-white/10 bg-black/15 p-3"><p className="text-xs text-white/35">Fêmeas projetadas</p><p className="mt-1 font-semibold">{decimal.format(result.females)}</p></div></> : <><Field label="Duração do ciclo" value={meses} onChange={setMeses} suffix="meses" min={1} /><Field label="Peso médio de entrada" value={pesoEntrada} onChange={setPesoEntrada} suffix="kg" /><Field label="Peso médio de venda" value={pesoSaida} onChange={setPesoSaida} suffix="kg vivo" /><Field label="Compra por cabeça" value={precoCompraCabeca} onChange={setPrecoCompraCabeca} suffix="R$" /><Field label="Mortalidade no ciclo" value={mortalidade} onChange={setMortalidade} suffix="%" max={100} step={0.1} /></>}</div></section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6"><h2 className="mb-1 text-lg font-semibold">Custos mensais totais</h2><p className="mb-4 text-xs text-white/35">Valores para toda a operação, sem multiplicação pela quantidade de animais.</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Field label="Sal e suplementação" value={sal} onChange={setSal} suffix="R$/mês" /><Field label="Veterinário" value={veterinario} onChange={setVeterinario} suffix="R$/mês" /><Field label="Peão / mão de obra" value={peao} onChange={setPeao} suffix="R$/mês" /><Field label="Vacinas" value={vacinas} onChange={setVacinas} suffix="R$/mês" /><Field label="Vermífugo" value={vermifugo} onChange={setVermifugo} suffix="R$/mês" /><Field label="Outros custos" value={outros} onChange={setOutros} suffix="R$/mês" /><Field label="Cercas e pastagens" value={cercasPastagens} onChange={setCercasPastagens} suffix="R$ total" /><Field label="Pilhetas, açudes e bebedouros" value={estruturaAgua} onChange={setEstruturaAgua} suffix="R$ total" /></div></section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6"><h2 className="mb-1 text-lg font-semibold">Custos de comercialização</h2><p className="mb-4 text-xs text-white/35">O abate considera somente nota fiscal. As vendas de gado vivo usam a modalidade escolhida.</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><label className="flex min-w-0 flex-col gap-1.5"><span className="text-xs font-medium text-white/55">Modalidade das vendas de gado vivo</span><select value={modalidadeVenda} onChange={(event) => setModalidadeVenda(event.target.value as ModalidadeVenda)} className="w-full min-w-0 rounded-xl border border-white/10 bg-[#151a13] px-3 py-2.5 text-sm outline-none"><option value="leilao">Leilão</option><option value="pecuarista">Venda para outro pecuarista</option></select></label>{modalidadeVenda === "leilao" ? <><Field label="Frete para o leilão" value={freteLeilao} onChange={setFreteLeilao} suffix="R$ total" /><Field label="Comissão do leilão" value={comissaoLeilao} onChange={setComissaoLeilao} suffix="% receita" step={0.1} max={100} /></> : <Field label="Comissão do corretor" value={comissaoCorretor} onChange={setComissaoCorretor} suffix="% receita" step={0.1} max={100} />}<Field label="Nota fiscal" value={notaFiscal} onChange={setNotaFiscal} suffix="% receita" step={0.1} max={100} /></div></section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6"><h2 className="mb-1 text-lg font-semibold">Preços de venda</h2><p className="mb-4 text-xs text-white/35">Gado vivo é calculado por kg vivo. Somente o abate utiliza arroba e rendimento de carcaça.</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Field label="Preço do kg vivo — machos" value={precoKgVivoMacho} onChange={setPrecoKgVivoMacho} suffix="R$/kg" step={0.01} /><Field label="Preço do kg vivo — fêmeas" value={precoKgVivoFemea} onChange={setPrecoKgVivoFemea} suffix="R$/kg" step={0.01} /><Field label="Ágio de leilão" value={agioLeilao} onChange={setAgioLeilao} suffix="%" min={-100} step={0.5} /><Field label="Ágio para fêmea reprodutora" value={agioReprodutora} onChange={setAgioReprodutora} suffix="%" min={-100} step={0.5} /></div></section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6"><h2 className="mb-1 text-lg font-semibold">Preços para abate</h2><p className="mb-4 text-xs text-white/35">As cotações do site são usadas somente nos cenários de abate.</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><label className="flex min-w-0 flex-col gap-1.5"><span className="text-xs font-medium text-white/55">Cotação principal</span><select value={quoteIndex} onChange={(event) => { setQuoteIndex(Number(event.target.value)); setManualPrice(null); }} className="w-full min-w-0 rounded-xl border border-white/10 bg-[#151a13] px-3 py-2.5 text-sm outline-none">{quotes.map((item, index) => <option key={`${item.productSlug}-${item.city}-${item.state}`} value={index}>{item.label} — {item.city}/{item.state} — R$ {item.price.toFixed(2)}</option>)}</select></label><Field label="Arroba do boi" value={arrobaBoi} onChange={setManualPrice} suffix="R$/@" step={0.01} /><Field label="Arroba da vaca" value={arrobaVaca} onChange={() => undefined} suffix="R$/@" step={0.01} /><Field label="Rendimento machos" value={rendimentoMacho} onChange={setRendimentoMacho} suffix="%" step={0.5} /><Field label="Rendimento fêmeas" value={rendimentoFemea} onChange={setRendimentoFemea} suffix="%" step={0.5} /></div></section>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          {sistema === "cria" ? <><section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6"><h2 className="text-lg font-semibold">Comparação dos cenários</h2><p className="mt-1 text-xs text-white/35">Vendas vivas usam R$/kg vivo; somente o abate usa R$/arroba.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{result.scenarios.map((scenario) => <article key={scenario.key} className={`rounded-xl border p-4 ${scenario.profit >= 0 ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}><p className="font-semibold">{scenario.title}</p><p className="mt-1 text-xs text-white/40">{scenario.description}</p><p className="mt-3 text-xs text-white/35">Ciclo total: {decimal.format(scenario.totalMonths)} meses</p><p className={`mt-1 text-2xl font-bold ${scenario.profit >= 0 ? "text-green-400" : "text-red-400"}`}>{currency.format(scenario.profit)}</p><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div><span className="text-white/35">Receita total</span><p>{currency.format(scenario.revenue)}</p></div><div><span className="text-white/35">Custo total</span><p>{currency.format(scenario.costs)}</p></div><div><span className="text-white/35">Produção</span><p>{currency.format(scenario.productionCosts)}</p></div><div><span className="text-white/35">Comercialização</span><p>{currency.format(scenario.commercialCosts)}</p></div><div><span className="text-white/35">Margem</span><p>{decimal.format(scenario.margin)}%</p></div><div><span className="text-white/35">Lucro/cabeça</span><p>{currency.format(scenario.profit / Math.max(1, result.males + result.females))}</p></div></div><div className="mt-4 rounded-xl border border-white/10 bg-black/15 p-3"><p className="text-xs font-medium text-white/55">Média mensal estimada</p><div className="mt-2 grid grid-cols-3 gap-2 text-xs"><div><span className="text-white/35">Receita</span><p className="font-semibold text-green-400">{currency.format(scenario.monthlyRevenue)}</p></div><div><span className="text-white/35">Gastos</span><p className="font-semibold text-red-400">{currency.format(scenario.monthlyCosts)}</p></div><div><span className="text-white/35">Lucro</span><p className={`font-semibold ${scenario.monthlyProfit >= 0 ? "text-green-400" : "text-red-400"}`}>{currency.format(scenario.monthlyProfit)}</p></div></div></div></article>)}</div></section><section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6"><h2 className="text-lg font-semibold">Receitas, gastos e lucros</h2><div className="mt-4 h-80 min-w-0"><ResponsiveContainer width="100%" height="100%"><LineChart data={comparisonChart} margin={{ top: 10, right: 8, left: 0, bottom: 20 }}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.08)" /><XAxis dataKey="nome" tick={{ fill: "rgba(255,255,255,.45)", fontSize: 10 }} angle={-10} textAnchor="end" height={60} /><YAxis tickFormatter={(value) => `R$ ${Math.round(Number(value) / 1000)}k`} tick={{ fill: "rgba(255,255,255,.45)", fontSize: 10 }} width={58} /><Tooltip formatter={(value) => currency.format(Number(value))} contentStyle={{ background: "#151a13", border: "1px solid rgba(255,255,255,.12)", borderRadius: 12 }} /><Legend /><Line dataKey="gastos" name="Gastos" stroke="#f87171" strokeWidth={2.5} /><Line dataKey="receita" name="Receita" stroke="#4ade80" strokeWidth={2.5} /><Line dataKey="lucro" name="Lucro" stroke="#facc15" strokeWidth={2.5} /></LineChart></ResponsiveContainer></div></section></> : <section className={`rounded-2xl border p-5 ${result.single.profit >= 0 ? "border-green-500/25 bg-green-500/8" : "border-red-500/25 bg-red-500/8"}`}><p className="text-xs uppercase tracking-wider text-white/40">Resultado projetado</p><p className={`mt-2 text-4xl font-extrabold ${result.single.profit >= 0 ? "text-green-400" : "text-red-400"}`}>{currency.format(result.single.profit)}</p><p className="mt-2 text-xs text-white/40">{sistema === "recria" ? "Receita calculada pelo peso vivo em kg." : "Receita calculada por arroba de carcaça."}</p><div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div><span className="text-white/35">Receita</span><p>{currency.format(result.single.revenue)}</p></div><div><span className="text-white/35">Comercialização</span><p>{currency.format(result.single.commercialCosts)}</p></div><div><span className="text-white/35">Custos totais</span><p>{currency.format(result.single.totalCosts)}</p></div><div><span className="text-white/35">Margem</span><p>{decimal.format(result.single.margin)}%</p></div></div><div className="mt-5 rounded-xl border border-white/10 bg-black/15 p-4"><p className="text-xs font-medium text-white/55">Média mensal estimada</p><div className="mt-3 grid grid-cols-3 gap-3 text-sm"><div><span className="text-xs text-white/35">Receita</span><p className="font-semibold text-green-400">{currency.format(result.single.monthlyRevenue)}</p></div><div><span className="text-xs text-white/35">Gastos</span><p className="font-semibold text-red-400">{currency.format(result.single.monthlyCosts)}</p></div><div><span className="text-xs text-white/35">Lucro</span><p className={`font-semibold ${result.single.monthlyProfit >= 0 ? "text-green-400" : "text-red-400"}`}>{currency.format(result.single.monthlyProfit)}</p></div></div></div></section>}
        </div>
      </div>

      <p className="text-center text-xs leading-relaxed text-white/30">Vendas de gado vivo são calculadas por peso vivo em quilogramas. Cenários de abate usam rendimento de carcaça e preço da arroba.</p>
    </div>
  );
}
