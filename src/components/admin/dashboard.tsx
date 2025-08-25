// src/components/admin/dashboard.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { UsersTable } from "./users-table";
import { SubscriptionsTable } from "./subscriptions-table";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"users" | "posts" | "subscriptions">("users");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white mb-8">Painel Administrativo</h1>
          <Link href="/">
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg">Voltar</button>
          </Link>
        </div>
        
        {/* Navegação por abas */}
        <div className="flex space-x-1 bg-white/10 p-1 rounded-xl mb-8">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === "users"
                ? "bg-white text-gray-900"
                : "text-gray-300 hover:text-white hover:bg-white/10"
            }`}
          >
            Usuários
          </button>
          <button
            onClick={() => setActiveTab("posts")}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === "posts"
                ? "bg-white text-gray-900"
                : "text-gray-300 hover:text-white hover:bg-white/10"
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === "subscriptions"
                ? "bg-white text-gray-900"
                : "text-gray-300 hover:text-white hover:bg-white/10"
            }`}
          >
            Assinaturas
          </button>
        </div>

        {/* Conteúdo das abas */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          {activeTab === "users" && <UsersTable />}
          {activeTab === "subscriptions" && <SubscriptionsTable />}
        </div>
      </div>
    </div>
  );
}