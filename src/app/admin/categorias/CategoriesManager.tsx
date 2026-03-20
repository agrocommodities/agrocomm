"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/actions/adminClassifieds";
import { Plus, Pencil, Trash2, X, Save } from "lucide-react";

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  createdAt: string;
}

const inputClass =
  "bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50 transition w-full";

export default function CategoriesManager({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const _router = useRouter();

  function refresh() {
    startTransition(async () => {
      const c = await getAdminCategories();
      setCategories(c);
    });
  }

  function handleCreate(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await createCategory(formData);
      if (result.error) setError(result.error);
      else {
        setShowForm(false);
        refresh();
      }
    });
  }

  function handleUpdate(id: number, formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await updateCategory(id, formData);
      if (result.error) setError(result.error);
      else {
        setEditing(null);
        refresh();
      }
    });
  }

  function handleDelete(id: number, name: string) {
    if (!confirm(`Excluir a categoria "${name}"?`)) return;
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result.error) alert(result.error);
      else refresh();
    });
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setShowForm(!showForm);
            setEditing(null);
          }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancelar" : "Nova Categoria"}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form
          action={handleCreate}
          className="bg-white/5 border border-white/10 rounded-2xl p-5"
        >
          <h3 className="font-semibold mb-4">Nova Categoria</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="new-name" className="text-xs text-white/60">
                Nome *
              </label>
              <input
                id="new-name"
                name="name"
                type="text"
                required
                placeholder="Ex: Tratores"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="new-icon" className="text-xs text-white/60">
                Ícone (lucide)
              </label>
              <input
                id="new-icon"
                name="icon"
                type="text"
                placeholder="Ex: Tractor"
                className={inputClass}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="mt-4 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Criar
          </button>
        </form>
      )}

      {/* Categories list */}
      <div className="flex flex-col gap-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white/3 border border-white/10 rounded-xl px-4 py-3"
          >
            {editing === cat.id ? (
              <form
                action={(formData) => handleUpdate(cat.id, formData)}
                className="flex flex-col sm:flex-row gap-3 items-end"
              >
                <div className="flex-1 flex flex-col gap-1">
                  <label
                    htmlFor={`edit-name-${cat.id}`}
                    className="text-xs text-white/60"
                  >
                    Nome
                  </label>
                  <input
                    id={`edit-name-${cat.id}`}
                    name="name"
                    type="text"
                    defaultValue={cat.name}
                    required
                    className={inputClass}
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <label
                    htmlFor={`edit-icon-${cat.id}`}
                    className="text-xs text-white/60"
                  >
                    Ícone
                  </label>
                  <input
                    id={`edit-icon-${cat.id}`}
                    name="icon"
                    type="text"
                    defaultValue={cat.icon ?? ""}
                    className={inputClass}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="p-2 bg-green-600 hover:bg-green-500 rounded-lg transition"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="p-2 hover:bg-white/10 rounded-lg transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm">{cat.name}</span>
                  <span className="text-xs text-white/30 ml-2">
                    /{cat.slug}
                  </span>
                  {cat.icon && (
                    <span className="text-xs text-white/20 ml-2">
                      ({cat.icon})
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(cat.id);
                      setShowForm(false);
                    }}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4 text-white/50" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="p-1.5 hover:bg-red-500/20 rounded-lg transition"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <p className="text-center text-white/30 py-8">
          Nenhuma categoria cadastrada.
        </p>
      )}
    </>
  );
}
