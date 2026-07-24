"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { GitBranch, Plus, Pencil, Trash2, X, Save, ChevronLeft, ChevronRight } from "lucide-react";

interface Company { id: string; name: string; }
interface Department { id: string; name: string; companyId: string; company: Company; }

export default function DepartmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const limit = 5;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if ((session?.user as any)?.role !== "Admin") return;
    Promise.all([loadDepartments(), loadCompanies()]);
  }, [session, status]);

  async function loadDepartments(p?: number, cid?: string) {
    try {
      const params = new URLSearchParams({ page: String(p ?? page), limit: String(limit) });
      const companyFilter = cid ?? filterCompany;
      if (companyFilter) params.set("companyId", companyFilter);
      const res = await fetch(`/api/departments?${params}`);
      const json = await res.json();
      setDepartments(json.data || []);
      setTotal(json.total || 0);
      setTotalPages(json.totalPages || 0);
    } catch { setDepartments([]); }
    setLoading(false);
  }

  async function loadCompanies() {
    try {
      const params = new URLSearchParams({ page: "1", limit: "100" });
      const res = await fetch(`/api/companies?${params}`);
      const json = await res.json();
      setCompanies(json.data || []);
    } catch { setCompanies([]); }
  }

  const goToPage = (p: number) => { setPage(p); loadDepartments(p); };

  async function handleCreate() {
    if (!name.trim() || !companyId) return;
    const res = await fetch("/api/departments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, companyId }) });
    if (res.ok) { setName(""); setCompanyId(""); setShowForm(false); loadDepartments(1); setPage(1); }
  }

  async function handleUpdate(id: string) {
    if (!name.trim() || !companyId) return;
    const res = await fetch(`/api/departments/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, companyId }) });
    if (res.ok) { setEditing(null); setName(""); setCompanyId(""); loadDepartments(); }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este departamento?")) return;
    const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
    if (res.ok) loadDepartments();
  }

  const handleFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFilterCompany(val);
    setPage(1);
    loadDepartments(1, val);
  };

  if (status === "loading" || loading) return <div className="flex h-screen bg-slate-900 items-center justify-center text-white">Cargando...</div>;
  if ((session?.user as any)?.role !== "Admin") return <div className="flex h-screen bg-slate-900 items-center justify-center text-white">No autorizado</div>;

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2"><GitBranch className="w-5 h-5" /> Departamentos</h1>
              <p className="text-sm text-slate-400">{total} registros</p>
            </div>
            <button onClick={() => { setShowForm(!showForm); setEditing(null); setName(""); setCompanyId(""); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm transition-all">
              <Plus className="w-4 h-4" /> Nuevo Departamento
            </button>
          </div>

          <select value={filterCompany} onChange={handleFilter} className="bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
            <option value="">Todas las empresas</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {showForm && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <select value={companyId} onChange={e => setCompanyId(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none">
                  <option value="">Seleccionar empresa *</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input autoFocus placeholder="Nombre del departamento *" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCreate()} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm transition-all">Guardar</button>
                <button onClick={() => { setShowForm(false); setName(""); setCompanyId(""); }} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-all">Cancelar</button>
              </div>
            </div>
          )}

          {departments.length === 0 && !showForm ? (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">No hay departamentos registrados</div>
          ) : (
            <>
              <div className="space-y-2">
                {departments.map(dept => (
                  <div key={dept.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                    {editing === dept.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <select value={companyId} onChange={e => setCompanyId(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none">
                          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <input autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleUpdate(dept.id)} className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none" />
                        <button onClick={() => handleUpdate(dept.id)} className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all"><Save className="w-4 h-4" /></button>
                        <button onClick={() => { setEditing(null); setName(""); setCompanyId(""); }} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="text-white font-medium text-sm">{dept.name}</p>
                          <p className="text-slate-500 text-xs">{dept.company.name}</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditing(dept.id); setName(dept.name); setCompanyId(dept.companyId); }} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(dept.id)} className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
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
