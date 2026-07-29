"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { toLocalISOString } from "@/lib/utils";

export default function EditIncidentPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const isAdmin = (session?.user as any)?.role === "Admin";
  const [form, setForm] = useState({
    categoryId: "",
    reportedBy: "",
    place: "",
    description: "",
    date: "",
    endDate: "",
    status: "PENDIENTE",
    userId: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (status !== "authenticated") return;

    Promise.all([
      fetch("/api/categories?limit=1000").then(r => r.json()),
      fetch(`/api/incidents/${params.id}`).then(r => r.json()),
      isAdmin ? fetch("/api/users?limit=1000").then(r => r.json()) : Promise.resolve({ data: [] }),
    ]).then(([cats, inc, usrs]) => {
      if (inc.error) return router.push("/incidents");
      setCategories(cats.data || []);
      setUsers(usrs.data || []);
      setForm({
        categoryId: inc.categoryId,
        reportedBy: inc.reportedBy,
        place: inc.place || "",
        description: inc.description,
        date: toLocalISOString(inc.date),
        endDate: inc.endDate ? toLocalISOString(inc.endDate) : "",
        status: inc.status,
        userId: inc.userId,
      });
      setLoading(false);
    }).catch(() => {
      router.push("/incidents");
    });
  }, [params.id, status, router, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const body: any = {
      categoryId: form.categoryId,
      reportedBy: form.reportedBy,
      place: form.place,
      description: form.description,
      date: form.date,
      status: form.status,
    };
    if (form.endDate) body.endDate = form.endDate;
    if (isAdmin && form.userId) body.userId = form.userId;

    const res = await fetch(`/api/incidents/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) router.push("/incidents");
    setSaving(false);
  };

  if (status === "loading" || loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-8">Editar Incidencia</h1>

        <form onSubmit={handleSubmit} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Categoría</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha y Hora</label>
            <input
              type="datetime-local"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha y Hora Final</label>
            <input
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lugar / Dependencia</label>
            <input
              type="text"
              value={form.place}
              onChange={(e) => setForm({ ...form, place: e.target.value })}
              placeholder="Dependencia donde se origina la actividad"
              maxLength={100}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quien Reporta</label>
            <input
              type="text"
              value={form.reportedBy}
              onChange={(e) => setForm({ ...form, reportedBy: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Detalle de lo Realizado</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="PROCESADO">Procesado</option>
              <option value="DERIVADO">Derivado</option>
              <option value="CANCELADO">Cancelado</option>
              <option value="RECHAZADO">Rechazado</option>
            </select>
          </div>

          {isAdmin && users.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Asignado a</label>
              <select
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-6 rounded-xl transition-all disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/incidents")}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 px-6 rounded-xl transition-all"
            >
              Cancelar
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
