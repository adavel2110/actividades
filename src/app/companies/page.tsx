"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { Building2, Plus, Pencil, Trash2, X, Save, ChevronLeft, ChevronRight } from "lucide-react";

interface Company { id: string; name: string; _count?: { departments: number }; createdAt: string; }

export default function CompaniesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const limit = 5;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if ((session?.user as any)?.role !== "Admin") return;
    loadCompanies();
  }, [session, status]);

  async function loadCompanies(p?: number) {
    try {
      const params = new URLSearchParams({ page: String(p ?? page), limit: String(limit) });
      const res = await fetch(`/api/companies?${params}`);
      const json = await res.json();
      setCompanies(json.data || []);
      setTotal(json.total || 0);
      setTotalPages(json.totalPages || 0);
    } catch { setCompanies([]); }
    setLoading(false);
  }

  const goToPage = (p: number) => { setPage(p); loadCompanies(p); };

  async function handleCreate() {
    if (!name.trim()) return;
    const res = await fetch("/api/companies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    if (res.ok) { setName(""); setShowForm(false); loadCompanies(1); setPage(1); }
  }

  async function handleUpdate(id: string) {
    if (!name.trim()) return;
    const res = await fetch(`/api/companies/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    if (res.ok) { setEditing(null); setName(""); loadCompanies(); }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta empresa? Se eliminarán sus departamentos asociados.")) return;
    const res = await fetch(`/api/companies/${id}`, { method: "DELETE" });
    if (res.ok) loadCompanies();
  }

  if (status === "loading" || loading) return <div className="flex h-screen bg-slate-900 items-center justify-center text-white">Cargando...</div>;
  if ((session?.user as any)?.role !== "Admin") return <div className="flex h-screen bg-slate-900 items-center justify-center text-white">No autorizado</div>;

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2"><Building2 className="w-5 h-5" /> Empresas</h1>
              <p className="text-sm text-slate-400">{total} registros</p>
            </div>
            <button onClick={() => { setShowForm(!showForm); setEditing(null); setName(""); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm transition-all">
              <Plus className="w-4 h-4" /> Nueva Empresa
            </button>
          </div>

          {showForm && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <input autoFocus placeholder="Nombre de la empresa *" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCreate()} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none" />
              <div className="flex gap-2">
                <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm transition-all">Guardar</button>
                <button onClick={() => { setShowForm(false); setName(""); }} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-all">Cancelar</button>
              </div>
            </div>
          )}

          {companies.length === 0 && !showForm ? (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">No hay empresas registradas</div>
          ) : (
            <>
              <div className="space-y-2">
                {companies.map(company => (
                  <div key={company.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                    {editing === company.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleUpdate(company.id)} className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none" />
                        <button onClick={() => handleUpdate(company.id)} className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all"><Save className="w-4 h-4" /></button>
                        <button onClick={() => { setEditing(null); setName(""); }} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="text-white font-medium text-sm">{company.name}</p>
                          <p className="text-slate-500 text-xs">{company._count?.departments ?? 0} departamentos</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditing(company.id); setName(company.name); }} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(company.id)} className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </>
                    )}
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
        </div>
      </main>
    </div>
  );
}
