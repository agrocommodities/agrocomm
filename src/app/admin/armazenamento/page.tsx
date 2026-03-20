import { getStorageInfo } from "@/actions/admin";
import StorageManager from "./StorageManager";

export const dynamic = "force-dynamic";

export default async function AdminStoragePage() {
  const data = await getStorageInfo();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Armazenamento</h1>
        <p className="text-sm text-white/50 mt-1">
          Uso de disco, mídias dos posts e limpeza de arquivos
        </p>
      </div>

      <StorageManager data={data} />
    </div>
  );
}
