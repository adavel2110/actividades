"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar";
import { Mail, Plus, Pencil, Trash2, X, Save, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { TIMEZONE } from "@/lib/utils";

const STATUS_OPTIONS = ["PENDIENTE", "EN_PROCESO", "COMPLETADO", "CANCELADO"];
const STATUS_COLORS: Record<string, string> = {
  PENDIENTE: "bg-yellow-500/20 text-yellow-400",
  EN_PROCESO: "bg-blue-500/20 text-blue-400",
  COMPLETADO: "bg-green-500/20 text-green-400",
  CANCELADO: "bg-red-500/20 text-red-400",
};

interface Company { id: string; name: string; }
interface Department { id: string; name: string; companyId: string; }
interface EmailRequest {
  id: string; email: string; requester: string; domain: string; firstName: string; lastName: string;
  cedula: string; status: string; description: string;
  companyId: string | null; departmentId: string | null;
  company: Company | null; department: Department | null;
  fechaReg: string | null; fechaBaja: string | null; createdAt: string;
}

const emptyForm = { email: "", requester: "", domain: "", firstName: "", lastName: "", cedula: "", status: "PENDIENTE", description: "", companyId: "", departmentId: "", fechaReg: "" };

export default function EmailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [emails, setEmails] = useState<EmailRequest[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const limit = 5;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if ((session?.user as any)?.role !== "Admin") return;
    loadEmails();
    loadCompanies();
  }, [session, status]);

  useEffect(() => {
    if (form.companyId) {
      fetch(`/api/departments?companyId=${form.companyId}&limit=100`)
        .then(r => r.json())
        .then(d => setDepartments(d.data || []));
    } else { setDepartments([]); }
  }, [form.companyId]);

  async function loadEmails(p?: number, search?: string, company?: string) {
    try {
      const params = new URLSearchParams({ page: String(p ?? page), limit: String(limit) });
      const s = search ?? filterSearch;
      const c = company ?? filterCompany;
      if (s) params.set("search", s);
      if (c) params.set("companyId", c);
      const res = await fetch(`/api/emails?${params}`);
      const json = await res.json();
      setEmails(json.data || []);
      setTotal(json.total || 0);
      setTotalPages(json.totalPages || 0);
    } catch { setEmails([]); }
    setLoading(false);
  }

  async function loadCompanies() {
    try {
      const res = await fetch("/api/companies?limit=100");
      const json = await res.json();
      setCompanies(json.data || []);
    } catch { setCompanies([]); }
  }

  const goToPage = (p: number) => { setPage(p); loadEmails(p); };

  const handleSearch = (value: string) => {
    setFilterSearch(value);
    setPage(1);
    loadEmails(1, value, undefined);
  };

  const handleFilterCompany = (value: string) => {
    setFilterCompany(value);
    setPage(1);
    loadEmails(1, undefined, value);
  };

  const clearFilters = () => {
    setFilterSearch("");
    setFilterCompany("");
    setPage(1);
    loadEmails(1, "", "");
  };

  const hasFilters = filterSearch || filterCompany;

  async function handleCreate() {
    if (!form.email || !form.requester || !form.firstName || !form.lastName || !form.cedula || !form.description) return;
    setFormError("");
    const res = await fetch("/api/emails", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, companyId: form.companyId || null, departmentId: form.departmentId || null, fechaReg: form.fechaReg || null }) });
    const json = await res.json();
    if (res.ok) { setForm(emptyForm); setShowForm(false); setFormError(""); loadEmails(1); setPage(1); }
    else { setFormError(json.error || "Error al guardar"); }
  }

  async function handleUpdate(id: string) {
    setFormError("");
    const res = await fetch(`/api/emails/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, companyId: form.companyId || null, departmentId: form.departmentId || null, fechaReg: form.fechaReg || null }) });
    const json = await res.json();
    if (res.ok) { setEditing(null); setForm(emptyForm); setFormError(""); loadEmails(); }
    else { setFormError(json.error || "Error al actualizar"); }
  }

  async function handleDeactivate(id: string) {
    if (!confirm("¿Está seguro de desactivar este registro? Se marcará como dado de baja.")) return;
    const res = await fetch(`/api/emails/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fechaBaja: new Date().toLocaleString("sv-SE", { timeZone: TIMEZONE }).replace(" ", "T"), status: "CANCELADO" }) });
    if (res.ok) loadEmails();
  }

  function startEdit(email: EmailRequest) {
    setEditing(email.id);
    setForm({ email: email.email, requester: email.requester, domain: email.domain || "", firstName: email.firstName, lastName: email.lastName,
      cedula: email.cedula, status: email.status, description: email.description, companyId: email.companyId || "", departmentId: email.departmentId || "",
      fechaReg: email.fechaReg ? new Date(email.fechaReg).toISOString().split("T")[0] : "" });
    if (email.companyId) fetch(`/api/departments?companyId=${email.companyId}&limit=100`).then(r => r.json()).then(d => setDepartments(d.data || []));
  }

  if (status === "loading" || loading) return <div className="flex h-screen bg-slate-900 items-center justify-center text-white">Cargando...</div>;
  if ((session?.user as any)?.role !== "Admin") return <div className="flex h-screen bg-slate-900 items-center justify-center text-white">No autorizado</div>;

  const inputClass = "bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none";

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2"><Mail className="w-5 h-5" /> Control de Correos</h1>
              <p className="text-sm text-slate-400">{total} registros</p>
            </div>
            <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm(emptyForm); setFormError(""); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm transition-all">
              <Plus className="w-4 h-4" /> Nuevo Correo
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por nombre, cedula, solicitante..."
                value={filterSearch}
                onChange={e => handleSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <select value={filterCompany} onChange={e => handleFilterCompany(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
              <option value="">Todas las empresas</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {hasFilters && (
              <button onClick={clearFilters}
                className="bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-300 hover:text-red-400 flex items-center gap-2 transition-all">
                <X className="w-4 h-4" /> Limpiar filtros
              </button>
            )}
          </div>

          {showForm && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Correo electronico *" value={form.email} onChange={e => { setForm({ ...form, email: e.target.value }); setFormError(""); }} className={inputClass} />
                <input placeholder="Quien solicita *" value={form.requester} onChange={e => setForm({ ...form, requester: e.target.value })} className={inputClass} />
                <input placeholder="Dominio" value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} className={inputClass} />
                <input placeholder="Nombres *" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className={inputClass} />
                <input placeholder="Apellidos *" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className={inputClass} />
                <input placeholder="Cedula *" value={form.cedula} onChange={e => setForm({ ...form, cedula: e.target.value })} className={inputClass} />
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputClass}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={form.companyId} onChange={e => setForm({ ...form, companyId: e.target.value, departmentId: "" })} className={inputClass}>
                  <option value="">Empresa (opcional)</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })} className={inputClass} disabled={!form.companyId}>
                  <option value="">Departamento (opcional)</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <input type="date" placeholder="Fecha de registro" value={form.fechaReg} onChange={e => setForm({ ...form, fechaReg: e.target.value })} className={inputClass} />
              </div>
              <textarea placeholder="Descripcion *" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none resize-none" />
              {formError && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{formError}</p>}
              <div className="flex gap-2">
                <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm transition-all">Guardar</button>
                <button onClick={() => { setShowForm(false); setForm(emptyForm); setFormError(""); }} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-all">Cancelar</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {emails.map(email => {
              const isInactive = !!email.fechaBaja;
              return (
                <div key={email.id} className={`bg-slate-950 border rounded-xl p-4 ${isInactive ? "border-slate-800/50 opacity-60" : "border-slate-800"}`}>
                  {editing === email.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} />
                        <input value={form.requester} onChange={e => setForm({ ...form, requester: e.target.value })} className={inputClass} />
                        <input value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} className={inputClass} />
                        <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className={inputClass} />
                        <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className={inputClass} />
                        <input value={form.cedula} onChange={e => setForm({ ...form, cedula: e.target.value })} className={inputClass} />
                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputClass}>
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select value={form.companyId} onChange={e => setForm({ ...form, companyId: e.target.value, departmentId: "" })} className={inputClass}>
                          <option value="">Empresa</option>
                          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })} className={inputClass} disabled={!form.companyId}>
                          <option value="">Departamento</option>
                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <input type="date" value={form.fechaReg} onChange={e => setForm({ ...form, fechaReg: e.target.value })} className={inputClass} />
                      </div>
                      <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none resize-none" />
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdate(email.id)} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs transition-all"><Save className="w-3 h-3" /> Guardar</button>
                        <button onClick={() => { setEditing(null); setForm(emptyForm); }} className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-all"><X className="w-3 h-3" /> Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 text-sm">
                        <p className="text-white font-medium">
                          {email.firstName} {email.lastName}
                          <span className="ml-2 text-xs text-blue-400">{email.email}</span>
                          {isInactive && <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">DADO DE BAJA</span>}
                        </p>
                        <p className="text-slate-400">Solicita: {email.requester} | Cedula: {email.cedula}</p>
                        {email.domain && <p className="text-slate-400">Dominio: {email.domain}</p>}
                        {(email.company || email.department) && (
                          <p className="text-slate-400">{email.company?.name}{email.company && email.department ? " — " : ""}{email.department?.name}</p>
                        )}
                        <p className="text-slate-500 text-xs">{email.description}</p>
                        <div className="flex items-center gap-2 pt-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[email.status] || ""}`}>{email.status}</span>
                          {email.fechaReg && <span className="text-slate-500 text-[10px]">Registro: {new Date(email.fechaReg).toLocaleDateString("es-ES", { timeZone: TIMEZONE })}</span>}
                          <span className="text-slate-600 text-[10px]">Creado: {new Date(email.createdAt).toLocaleDateString("es-ES", { timeZone: TIMEZONE })}</span>
                          {isInactive && <span className="text-red-500/60 text-[10px]">Baja: {new Date(email.fechaBaja!).toLocaleDateString("es-ES", { timeZone: TIMEZONE })}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-4 shrink-0">
                        {!isInactive && (
                          <>
                            <button onClick={() => startEdit(email)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeactivate(email.id)} className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-all" title="Dar de baja"><Trash2 className="w-3.5 h-3.5" /></button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {emails.length === 0 && !showForm && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">No hay correos registrados</div>
            )}
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
        </div>
      </main>
    </div>
  );
}
