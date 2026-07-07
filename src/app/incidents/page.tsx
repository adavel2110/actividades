"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { Plus, Search, AlertCircle, CheckCircle2, Clock, RefreshCw, XCircle, ArrowRight, Eye, Pencil } from "lucide-react";

const statusColors: Record<string, string> = {
  PENDIENTE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  EN_PROCESO: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PROCESADO: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  CANCELADO: "bg-red-500/10 text-red-400 border-red-500/20",
  RECHAZADO: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  DERIVADO: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const statusIcons: Record<string, any> = {
  PENDIENTE: Clock, EN_PROCESO: RefreshCw, PROCESADO: CheckCircle2,
  CANCELADO: XCircle, RECHAZADO: AlertCircle, DERIVADO: ArrowRight,
};

export default function IncidentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [filterUser, setFilterUser] = useState("");
  const [loading, setLoading] = useState(true);
  const isAdmin = (session?.user as any)?.role === "Admin";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (status !== "authenticated") return;
    loadIncidents();
    if (isAdmin) fetch("/api/users").then(r => r.json()).then(setUsers);
  }, [status, router]);

  const loadIncidents = async (userId = "") => {
    const params = new URLSearchParams();
    if (userId) params.set("userId", userId);
    const res = await fetch(`/api/incidents?${params}`);
    const data = await res.json();
    setIncidents(data);
    setLoading(false);
  };

  const handleFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFilterUser(val);
    loadIncidents(val);
  };

  if (status === "loading") {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Incidencias</h1>
            <p className="text-sm text-slate-400">{incidents.length} registros</p>
          </div>
          <button
            onClick={() => router.push("/incidents/new")}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nueva Incidencia
          </button>
        </div>

        {isAdmin && users.length > 0 && (
          <div className="mb-6">
            <select
              value={filterUser}
              onChange={handleFilter}
              className="bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">Todos los usuarios</option>
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <p className="text-slate-400">Cargando...</p>
        ) : incidents.length === 0 ? (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            No hay incidencias registradas
          </div>
        ) : (
          <div className="space-y-3">
            {incidents.map((inc) => {
              const StatusIcon = statusIcons[inc.status] || AlertCircle;
              return (
                <div
                  key={inc.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${statusColors[inc.status] || ""}`}>
                          <StatusIcon className="w-3 h-3" />
                          {inc.status.replace("_", " ")}
                        </span>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                          {inc.category?.name}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 line-clamp-2 mb-1">{inc.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>Reportó: {inc.reportedBy}</span>
                        {inc.place && <span>Lugar: {inc.place}</span>}
                        <span>Por: {inc.user?.name}</span>
                        <span>{new Date(inc.date).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => router.push(`/incidents/${inc.id}`)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4 text-slate-400" />
                      </button>
                      <button
                        onClick={() => router.push(`/incidents/${inc.id}/edit`)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
