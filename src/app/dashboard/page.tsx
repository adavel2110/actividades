"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { Layers, AlertCircle, CheckCircle2, Clock, RefreshCw, XCircle, ArrowRight, Mail, Building2 } from "lucide-react";

interface Stats {
  total: number;
  byStatus: { status: string; count: number }[];
  byCategory?: { name: string; count: number }[];
  byCompany?: { name: string; count: number }[];
  isAdmin: boolean;
}

const incidentStatusColors: Record<string, string> = {
  PENDIENTE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  EN_PROCESO: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PROCESADO: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  CANCELADO: "bg-red-500/10 text-red-400 border-red-500/20",
  RECHAZADO: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  DERIVADO: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const emailStatusColors: Record<string, string> = {
  PENDIENTE: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  EN_PROCESO: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  COMPLETADO: "bg-green-500/10 text-green-400 border-green-500/20",
  CANCELADO: "bg-red-500/10 text-red-400 border-red-500/20",
};

const statusIcons: Record<string, any> = {
  PENDIENTE: Clock, EN_PROCESO: RefreshCw, PROCESADO: CheckCircle2,
  CANCELADO: XCircle, RECHAZADO: AlertCircle, DERIVADO: ArrowRight, COMPLETADO: CheckCircle2,
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [statType, setStatType] = useState<"incidents" | "emails">("incidents");
  const [filterUserId, setFilterUserId] = useState("");
  const [filterCompanyId, setFilterCompanyId] = useState("");
  const isAdmin = (session?.user as any)?.role === "Admin";

  const loadStats = (type: string, userId: string, companyId: string) => {
    setLoading(true);
    const params = new URLSearchParams({ type });
    if (userId) params.set("userId", userId);
    if (companyId) params.set("companyId", companyId);
    fetch(`/api/dashboard/stats?${params}`)
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (status !== "authenticated") return;
    if (isAdmin) {
      fetch("/api/users?limit=100").then(r => r.json()).then(json => setUsers(json.data || []));
      fetch("/api/companies?limit=100").then(r => r.json()).then(json => setCompanies(json.data || []));
    }
    loadStats("incidents", "", "");
  }, [status, router, isAdmin]);

  const handleTypeChange = (type: "incidents" | "emails") => {
    setStatType(type);
    setFilterUserId("");
    setFilterCompanyId("");
    loadStats(type, "", "");
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFilterUserId(val);
    loadStats(statType, val, filterCompanyId);
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFilterCompanyId(val);
    loadStats(statType, filterUserId, val);
  };

  if (status === "loading" || loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Cargando...</div>;
  }

  const statusColors = statType === "incidents" ? incidentStatusColors : emailStatusColors;
  const chartData = statType === "incidents" ? stats?.byCategory : stats?.byCompany;
  const maxCount = chartData?.length ? Math.max(...chartData.map(c => c.count)) : 1;

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
            <p className="text-slate-400 text-sm">
              {statType === "incidents" ? "Resumen de incidencias" : "Resumen de correos"}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Type toggle */}
            <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1">
              <button onClick={() => handleTypeChange("incidents")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${statType === "incidents" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>
                <AlertCircle className="w-4 h-4" /> Incidencias
              </button>
              <button onClick={() => handleTypeChange("emails")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${statType === "emails" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>
                <Mail className="w-4 h-4" /> Correos
              </button>
            </div>

            {/* Context filters */}
            {isAdmin && statType === "incidents" && users.length > 0 && (
              <select value={filterUserId} onChange={handleUserChange}
                className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                <option value="">Todos los usuarios</option>
                {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            )}

            {isAdmin && statType === "emails" && companies.length > 0 && (
              <select value={filterCompanyId} onChange={handleCompanyChange}
                className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                <option value="">Todas las empresas</option>
                {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Status cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-8">
          {stats?.byStatus.map((s) => {
            const Icon = statusIcons[s.status] || AlertCircle;
            return (
              <div key={s.status} className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusColors[s.status] || ""}`}>
                    {s.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-3xl font-bold">{s.count}</p>
              </div>
            );
          })}
        </div>

        {/* Total + chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
              Total de {statType === "incidents" ? "Incidencias" : "Correos"}
            </h2>
            <p className="text-5xl font-bold text-white">{stats?.total || 0}</p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
              {statType === "incidents" ? "Por Categoría" : "Por Empresa"}
            </h2>
            <div className="space-y-3">
              {chartData?.length ? chartData.map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="text-sm text-slate-300 w-32 truncate">{c.name}</span>
                  <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                      style={{ width: `${(c.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold w-8 text-right">{c.count}</span>
                </div>
              )) : (
                <p className="text-slate-500 text-sm">Sin datos</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
