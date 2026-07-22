"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar";
import { Mail, Plus, Pencil, Trash2, X, Save } from "lucide-react";

const STATUS_OPTIONS = ["PENDIENTE", "EN_PROCESO", "COMPLETADO", "CANCELADO"];
const STATUS_COLORS: Record<string, string> = {
  PENDIENTE: "bg-yellow-500/20 text-yellow-400",
  EN_PROCESO: "bg-blue-500/20 text-blue-400",
  COMPLETADO: "bg-green-500/20 text-green-400",
  CANCELADO: "bg-red-500/20 text-red-400",
};

interface EmailRequest {
  id: string;
  requester: string;
  domain: string;
  firstName: string;
  lastName: string;
  cedula: string;
  department: string;
  status: string;
  description: string;
  createdAt: string;
}

const emptyForm = { requester: "", domain: "", firstName: "", lastName: "", cedula: "", department: "", status: "PENDIENTE", description: "" };

export default function EmailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [emails, setEmails] = useState<EmailRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if ((session?.user as any)?.role !== "Admin") return;
    loadEmails();
  }, [session, status]);

  async function loadEmails() {
    const res = await fetch("/api/emails");
    setEmails(await res.json());
    setLoading(false);
  }

  async function handleCreate() {
    if (!form.requester || !form.firstName || !form.lastName || !form.cedula || !form.department || !form.description) return;
    await fetch("/api/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm(emptyForm);
    setShowForm(false);
    loadEmails();
  }

  async function handleUpdate(id: string) {
    await fetch(`/api/emails/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setEditing(null);
    setForm(emptyForm);
    loadEmails();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este registro?")) return;
    await fetch(`/api/emails/${id}`, { method: "DELETE" });
    loadEmails();
  }

  function startEdit(email: EmailRequest) {
    setEditing(email.id);
    setForm({ requester: email.requester, domain: email.domain || "", firstName: email.firstName, lastName: email.lastName, cedula: email.cedula, department: email.department, status: email.status, description: email.description });
  }

  if (status === "loading" || loading) return <div className="flex h-screen bg-slate-900 items-center justify-center text-white">Cargando...</div>;
  if ((session?.user as any)?.role !== "Admin") return <div className="flex h-screen bg-slate-900 items-center justify-center text-white">No autorizado</div>;

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5" /> Control de Correos
            </h1>
            <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm(emptyForm); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm transition-all">
              <Plus className="w-4 h-4" /> Nuevo Correo
            </button>
          </div>

          {showForm && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Quien solicita *" value={form.requester} onChange={e => setForm({ ...form, requester: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none" />
                <input placeholder="Dominio" value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none" />
                <input placeholder="Nombres *" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none" />
                <input placeholder="Apellidos *" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none" />
                <input placeholder="Cedula *" value={form.cedula} onChange={e => setForm({ ...form, cedula: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none" />
                <input placeholder="Departamento *" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none" />
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <textarea placeholder="Descripcion *" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none resize-none" />
              <div className="flex gap-2">
                <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm transition-all">Guardar</button>
                <button onClick={() => { setShowForm(false); setForm(emptyForm); }} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-all">Cancelar</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {emails.map(email => (
              <div key={email.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                {editing === email.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input value={form.requester} onChange={e => setForm({ ...form, requester: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none" />
                      <input value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none" />
                      <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none" />
                      <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none" />
                      <input value={form.cedula} onChange={e => setForm({ ...form, cedula: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none" />
                      <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none" />
                      <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none">
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
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
                      <p className="text-white font-medium">{email.firstName} {email.lastName} — {email.department}</p>
                      <p className="text-slate-400">Solicita: {email.requester} | Cedula: {email.cedula}</p>
                      {email.domain && <p className="text-slate-400">Dominio: {email.domain}</p>}
                      <p className="text-slate-500 text-xs">{email.description}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[email.status] || ""}`}>{email.status}</span>
                        <span className="text-slate-600 text-[10px]">{new Date(email.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 ml-4 shrink-0">
                      <button onClick={() => startEdit(email)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(email.id)} className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {emails.length === 0 && <p className="text-slate-500 text-sm text-center py-8">No hay registros de correo.</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
