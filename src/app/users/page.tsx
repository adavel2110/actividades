"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { Users, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", roleId: "" });
  const isAdmin = (session?.user as any)?.role === "Admin";
  const limit = 5;

  useEffect(() => {
    if (status === "unauthenticated") return router.push("/");
    if (status !== "authenticated") return;
    if (!isAdmin) return router.push("/dashboard");
    loadData();
  }, [status, router]);

  const loadData = async (p?: number) => {
    const params = new URLSearchParams({ page: String(p ?? page), limit: String(limit) });
    const [u, r] = await Promise.all([
      fetch(`/api/users?${params}`).then(r => r.json()),
      fetch("/api/roles?limit=100").then(r => r.json()),
    ]);
    setUsers(u.data || []);
    setTotal(u.total || 0);
    setTotalPages(u.totalPages || 0);
    setRoles(r.data || []);
    setLoading(false);
  };

  const goToPage = (p: number) => { setPage(p); loadData(p); };

  const handleCreate = async () => {
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", email: "", password: "", roleId: "" });
    setShowForm(false);
    loadData(1);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este usuario?")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    loadData();
  };

  if (status === "loading" || loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 max-w-3xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-5 h-5" /> Usuarios</h1>
            <p className="text-sm text-slate-400">{total} registros</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all">
            <Plus className="w-4 h-4" /> Nuevo Usuario
          </button>
        </div>

        {showForm && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 mb-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-300">Nuevo Usuario</h3>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              <input type="password" placeholder="Contraseña" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              <select value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                className="bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                <option value="">Seleccionar rol</option>
                {roles.map((r: any) => (<option key={r.id} value={r.id}>{r.name}</option>))}
              </select>
            </div>
            <button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2.5 px-5 rounded-xl transition-all">Guardar</button>
          </div>
        )}

        {users.length === 0 ? (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">No hay usuarios registrados</div>
        ) : (
          <>
            <div className="space-y-2">
              {users.map((u: any) => (
                <div key={u.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email} · {u.role?.name}</p>
                  </div>
                  <button onClick={() => handleDelete(u.id)} className="p-1.5 bg-slate-800 hover:bg-red-500/20 rounded-lg transition-all">
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
