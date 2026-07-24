"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { Shield, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

export default function RolesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [roles, setRoles] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const isAdmin = (session?.user as any)?.role === "Admin";
  const limit = 5;

  useEffect(() => {
    if (status === "unauthenticated") return router.push("/");
    if (status !== "authenticated") return;
    if (!isAdmin) return router.push("/dashboard");
    loadRoles();
  }, [status, router]);

  const loadRoles = async (p?: number) => {
    const params = new URLSearchParams({ page: String(p ?? page), limit: String(limit) });
    const res = await fetch(`/api/roles?${params}`);
    const json = await res.json();
    setRoles(json.data || []);
    setTotal(json.total || 0);
    setTotalPages(json.totalPages || 0);
    setLoading(false);
  };

  const goToPage = (p: number) => { setPage(p); loadRoles(p); };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    setNewName("");
    loadRoles(1);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este rol?")) return;
    await fetch(`/api/roles/${id}`, { method: "DELETE" });
    loadRoles();
  };

  if (status === "loading" || loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-5 h-5" /> Roles</h1>
            <p className="text-sm text-slate-400">{total} registros</p>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-6">
          <div className="flex gap-3">
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nuevo rol..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()} />
            <button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all">
              <Plus className="w-4 h-4" /> Agregar
            </button>
          </div>
        </div>

        {roles.length === 0 ? (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">No hay roles registrados</div>
        ) : (
          <>
            <div className="space-y-2">
              {roles.map((r: any) => (
                <div key={r.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-slate-500">{r._count?.users || 0} usuarios</p>
                  </div>
                  <button onClick={() => handleDelete(r.id)} className="p-1.5 bg-slate-800 hover:bg-red-500/20 rounded-lg transition-all">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button onClick={() => goToPage(page - 1)} disabled={page <= 1} className="p-2 bg-slate-950 border border-slate-800 rounded-xl disabled:opacity-30 hover:bg-slate-800 transition-all"><ChevronLeft className="w-4 h-4" /></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => goToPage(p)} className={`min-w-[36px] py-2 px-3 rounded-xl text-sm font-medium transition-all ${p === page ? "bg-blue-600 text-white" : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"}`}>{p}</button>
                ))}
                <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages} className="p-2 bg-slate-950 border border-slate-800 rounded-xl disabled:opacity-30 hover:bg-slate-800 transition-all"><ChevronRight className="w-4 h-4" /></button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
