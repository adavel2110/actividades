"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { Plus, AlertCircle, CheckCircle2, Clock, RefreshCw, XCircle, ArrowRight, Eye, Pencil, ChevronLeft, ChevronRight, ArrowUpDown, X } from "lucide-react";

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
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [sort, setSort] = useState("date");
  const [order, setOrder] = useState("desc");
  const [users, setUsers] = useState<any[]>([]);
  const [filterUser, setFilterUser] = useState("");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");
  const [loading, setLoading] = useState(true);
  const isAdmin = (session?.user as any)?.role === "Admin";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (status !== "authenticated") return;
    if (isAdmin) fetch("/api/users?limit=100").then(r => r.json()).then(json => setUsers(json.data || []));
    fetchIncidents();
  }, [status, router]);

  const fetchIncidents = async (overrides?: { p?: number; u?: string; s?: string; o?: string; sd?: string; ed?: string }) => {
    const p = overrides?.p ?? page;
    const u = overrides?.u ?? filterUser;
    const s = overrides?.s ?? sort;
    const o = overrides?.o ?? order;
    const sd = overrides?.sd ?? filterStart;
    const ed = overrides?.ed ?? filterEnd;
    const params = new URLSearchParams();
    params.set("page", String(p));
    params.set("limit", String(limit));
    params.set("sort", s);
    params.set("order", o);
    if (u) params.set("userId", u);
    if (sd) params.set("startDate", sd);
    if (ed) params.set("endDate", ed);
    const res = await fetch(`/api/incidents?${params}`);
    const json = await res.json();
    setIncidents(json.data || []);
    setTotal(json.total || 0);
    setTotalPages(json.totalPages || 0);
    setLoading(false);
  };

  const handleFilterUser = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFilterUser(val);
    setPage(1);
    fetchIncidents({ p: 1, u: val });
  };

  const handleFilterDate = (type: "start" | "end", value: string) => {
    if (type === "start") setFilterStart(value);
    else setFilterEnd(value);
    setPage(1);
    fetchIncidents({ p: 1, sd: type === "start" ? value : filterStart, ed: type === "end" ? value : filterEnd });
  };

  const handleOrder = () => {
    const newOrder = order === "desc" ? "asc" : "desc";
    setOrder(newOrder);
    setPage(1);
    fetchIncidents({ p: 1, o: newOrder });
  };

  const clearFilters = () => {
    setFilterUser("");
    setFilterStart("");
    setFilterEnd("");
    setPage(1);
    fetchIncidents({ p: 1, u: "", sd: "", ed: "" });
  };

  const goToPage = (p: number) => {
    setPage(p);
    fetchIncidents({ p });
  };

  const hasFilters = filterUser || filterStart || filterEnd;

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
            <p className="text-sm text-slate-400">{total} registros</p>
          </div>
          <button
            onClick={() => router.push("/incidents/new")}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nueva Incidencia
          </button>
        </div>

        <div className="mb-6 flex items-center gap-3 flex-wrap">
          {isAdmin && users.length > 0 && (
            <select
              value={filterUser}
              onChange={handleFilterUser}
              className="bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">Todos los usuarios</option>
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          )}

          <input
            type="date"
            value={filterStart}
            onChange={e => handleFilterDate("start", e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            title="Fecha desde"
          />
          <input
            type="date"
            value={filterEnd}
            onChange={e => handleFilterDate("end", e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            title="Fecha hasta"
          />

          <button
            onClick={handleOrder}
            className="bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-300 hover:text-white flex items-center gap-2 transition-all"
            title={order === "desc" ? "Más recientes primero" : "Más antiguos primero"}
          >
            <ArrowUpDown className="w-4 h-4" />
            {order === "desc" ? "Más recientes" : "Más antiguos"}
          </button>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-300 hover:text-red-400 flex items-center gap-2 transition-all"
            >
              <X className="w-4 h-4" />
              Limpiar filtros
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-slate-400">Cargando...</p>
        ) : incidents.length === 0 ? (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            No hay incidencias registradas
          </div>
        ) : (
          <>
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

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="p-2 bg-slate-950 border border-slate-800 rounded-xl disabled:opacity-30 hover:bg-slate-800 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={`min-w-[36px] py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                      p === page
                        ? "bg-blue-600 text-white"
                        : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="p-2 bg-slate-950 border border-slate-800 rounded-xl disabled:opacity-30 hover:bg-slate-800 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
