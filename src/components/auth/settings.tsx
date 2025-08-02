"use client";

import { useActionState, useState } from "react";
import { updateProfile, uploadAvatar } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { Input, Password } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import type { User } from "@/types";

export function SettingsForm({ user }: { user: User | null }) {
  const [state, formAction, isPending] = useActionState(updateProfile, null);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState(user?.avatar || "/images/avatar.svg");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  if (!user) return <p>Usuário não encontrado.</p>;

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const result = await uploadAvatar(formData);
      if (result.success && result.avatar) {
        setCurrentAvatar(result.avatar);
      } else if (result.error) {
        alert(result.error);
      }
    } catch (error) {
      alert("Erro ao fazer upload do avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="userId" value={user.id} />

      {state?.success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <p className="text-sm text-green-600 dark:text-green-400">
            Perfil atualizado com sucesso!
          </p>
        </div>
      )}

      {state?.error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        </div>
      )}

      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle>Foto do Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Image
              src={currentAvatar}
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover border-2 border-white/20"
              width={80}
              height={80}
            />
            <div>
              <label htmlFor="avatar-upload" className="cursor-pointer">
                <span className="inline-block px-4 py-2 bg-black/30 hover:bg-black/45 rounded-md text-white font-medium transition-colors">
                  {uploadingAvatar ? "Enviando..." : "Alterar foto"}
                </span>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
                className="hidden"
              />
              <p className="text-xs text-foreground/60 mt-1">
                JPG, PNG ou WebP. Máximo 5MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Nome Completo
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                defaultValue={user.name}
                placeholder="João Silva"
                required
              />
            </div>

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium mb-2"
              >
                Nome de Usuário
              </label>
              <Input
                id="username"
                name="username"
                type="text"
                defaultValue={user.username || ""}
                placeholder="@joaosilva"
              />
              <p className="mt-1 text-xs text-foreground/60">
                Usado como identificador único
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium mb-2">
              Biografia
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              className="block w-full rounded-md border-2 border-black/80 bg-black/50 p-2.5 text-base placeholder:text-gray-400 focus:outline-none focus:border-black/80"
              placeholder="Conte um pouco sobre você..."
            />
            <p className="mt-1 text-xs text-foreground/60">
              Máximo 500 caracteres
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Informações de Contato */}
      <Card>
        <CardHeader>
          <CardTitle>Informações de Contato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                E-mail
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user.email}
                placeholder="joao@exemplo.com"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-2">
                Telefone
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="(11) 98765-4321"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium mb-2"
              >
                Localização
              </label>
              <Input
                id="location"
                name="location"
                type="text"
                placeholder="São Paulo, SP"
              />
            </div>

            <div>
              <label
                htmlFor="website"
                className="block text-sm font-medium mb-2"
              >
                Website
              </label>
              <Input
                id="website"
                name="website"
                type="url"
                placeholder="https://meusite.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Segurança */}
      <Card>
        <CardHeader>
          <CardTitle>Segurança</CardTitle>
        </CardHeader>
        <CardContent>
          {!showPasswordFields ? (
            <button
              type="button"
              onClick={() => setShowPasswordFields(true)}
              className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Alterar senha
            </button>
          ) : (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setShowPasswordFields(false)}
                className="text-sm font-medium text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                Cancelar alteração de senha
              </button>

              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium mb-2"
                >
                  Senha Atual
                </label>
                <Password
                  id="currentPassword"
                  name="currentPassword"
                  placeholder="••••••••"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium mb-2"
                  >
                    Nova Senha
                  </label>
                  <Password
                    id="newPassword"
                    name="newPassword"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium mb-2"
                  >
                    Confirmar Nova Senha
                  </label>
                  <Password
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <p className="text-xs text-foreground/60">
                A senha deve ter pelo menos 4 caracteres
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configurações da Conta */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações da Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Tipo de Conta
            </label>
            <div className="
              p-3 bg-gray-100 rounded-lg border-2 border-black/80 focus:border-black/80 
              bg-black/50 dark:bg-black/70 dark:placeholder-gray-400
            ">
              <span className="text-sm font-medium capitalize">
                {user.role}
              </span>
              {user.role === "admin" && (
                <span className="ml-2 text-xs text-primary-600">
                  (Administrador)
                </span>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Membro desde
            </label>
            <div className="
              p-3 bg-gray-100 rounded-lg border-2 border-black/80 focus:border-black/80 
              bg-black/50 dark:bg-black/70 dark:placeholder-gray-400
            ">
              <span className="text-sm">
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("pt-BR")
                  : "N/A"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-4 pt-4">
        <Button
          type="button"
          onClick={() => window.history.back()}
          className="bg-transparent border-2 border-foreground/20 text-foreground hover:bg-foreground/10"
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </form>
  );
}