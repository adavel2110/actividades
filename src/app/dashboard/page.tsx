"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { Layers, AlertCircle, CheckCircle2, Clock, RefreshCw, XCircle, ArrowRight } from "lucide-react";

interface Stats {
  total: number;
  byStatus: { status: string; count: number }[];
  byCategory: { name: string; count: number }[];
  isAdmin: boolean;
}

const statusColors: Record<string, string> = {
  PENDIENTE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  EN_PROCESO: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PROCESADO: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  CANCELADO: "bg-red-500/10 text-red-400 border-red-500/20",
  RECHAZADO: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  DERIVADO: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const statusIcons: Record<string, any> = {
  PENDIENTE: Clock,
  EN_PROCESO: RefreshCw,
  PROCESADO: CheckCircle2,
  CANCELADO: XCircle,
  RECHAZADO: AlertCircle,
  DERIVADO: ArrowRight,
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [filterUserId, setFilterUserId] = useState("");
  const isAdmin = (session?.user as any)?.role === "Admin";

  const loadStats = (userId: string) => {
    setLoading(true);
    const params = userId ? `?userId=${userId}` : "";
    fetch(`/api/dashboard/stats${params}`)
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (status !== "authenticated") return;
    if (isAdmin) fetch("/api/users").then(r => r.json()).then(setUsers);
    loadStats("");
  }, [status, router, isAdmin]);

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFilterUserId(val);
    loadStats(val);
  };

  if (status === "loading" || loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Cargando...</div>;
  }

  const maxCount = stats?.byCategory.length ? Math.max(...stats.byCategory.map(c => c.count)) : 1;

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
            <p className="text-slate-400 text-sm">Resumen de incidencias</p>
          </div>
          {isAdmin && users.length > 0 && (
            <select
              value={filterUserId}
              onChange={handleUserChange}
              className="bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">Todos los usuarios</option>
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Total de Incidencias</h2>
            <p className="text-5xl font-bold text-white">{stats?.total || 0}</p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Por Categoría</h2>
            <div className="space-y-3">
              {stats?.byCategory.map((c) => (
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
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
