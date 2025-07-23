"use client";

import React from "react";
import { InferSelectModel } from "drizzle-orm";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, BarElement, Title, Tooltip, Legend, Filler, } from "chart.js";
import { Bar } from "react-chartjs-2";
import { prices } from "@/db/schema";
import { formatStateName } from "@/lib/prices";

ChartJS.register(CategoryScale, LinearScale, PointElement, BarElement, Title, Tooltip, Legend, Filler );

type Price = InferSelectModel<typeof prices>;

export default function ChartComponent({ pricesData, commodity }: { pricesData: Price[]; commodity: string }) {
  if (!pricesData || pricesData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full my-2">
        <p className="text-gray-500">Nenhum dado encontrado para gerar o gráfico.</p>
      </div>
    );
  }

  // const max = await db
  //   .select({ maxValue: max(yourTable.yourColumn) })
  //   .from(yourTable);

  const labels = pricesData.map(item => formatStateName(item.state))
  const datasets = pricesData.map(item => item.price / 100);
  const data = {
    labels: labels,
    datasets: [
      {
        // Title of Graph
        label: `Preços de ${commodity}`,
        data: datasets,
        backgroundColor: [
          "rgba(255, 99, 132, 0.2)",
          "rgba(255, 159, 64, 0.2)",
          "rgba(255, 205, 86, 0.2)",
          "rgba(75, 192, 192, 0.2)",
        ],
        borderColor: [
          "rgb(255, 99, 132)",
          "rgb(255, 159, 64)",
          "rgb(255, 205, 86)",
          "rgb(75, 192, 192)",
        ],
        borderWidth: 1,
        barPercentage: 1,
        borderRadius: {
          topLeft: 5,
          topRight: 5,
        },
      },
      // insert similar in dataset object for making multi bar chart
    ],
  };
  const options = {
    scales: {
      y: {
        title: {
          display: true,
          text: "Valor (R$)",
        },
        display: true,
        beginAtZero: true,
        max: 300,
      },
      x: {
        title: {
          display: true,
          text: "Estado",
        },
        display: true,
      },
    },
  };
  return (
    <div className="w-full h-96">
      <Bar data={data} options={options} />
    </div>
  );
};