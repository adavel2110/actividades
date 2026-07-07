"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", roleId: "" });
  const isAdmin = (session?.user as any)?.role === "Admin";

  useEffect(() => {
    if (status === "unauthenticated") return router.push("/");
    if (status !== "authenticated") return;
    if (!isAdmin) return router.push("/dashboard");
    loadData();
  }, [status, router]);

  const loadData = async () => {
    const [u, r] = await Promise.all([
      fetch("/api/users").then(r => r.json()),
      fetch("/api/roles").then(r => r.json()),
    ]);
    setUsers(u);
    setRoles(r);
    setLoading(false);
  };

  const handleCreate = async () => {
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", email: "", password: "", roleId: "" });
    setShowForm(false);
    loadData();
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
          <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nuevo Usuario
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
      </main>
    </div>
  );
}
