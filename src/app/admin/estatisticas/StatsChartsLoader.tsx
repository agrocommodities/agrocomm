"use client";

import nextDynamic from "next/dynamic";

const StatsCharts = nextDynamic(() => import("./StatsCharts"), {
  ssr: false,
});

export default StatsCharts;
