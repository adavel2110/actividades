"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { AlertCircle, CheckCircle2, Clock, RefreshCw, XCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { TIMEZONE } from "@/lib/utils";

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

export default function IncidentDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [incident, setIncident] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (status !== "authenticated") return;
    fetch(`/api/incidents/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) router.push("/incidents");
        else setIncident(data);
      })
      .finally(() => setLoading(false));
  }, [params.id, status, router]);

  if (status === "loading" || loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Cargando...</div>;
  }

  if (!incident) return null;

  const StatusIcon = statusIcons[incident.status] || AlertCircle;

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 max-w-3xl mx-auto w-full">
        <button
          onClick={() => router.push("/incidents")}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a incidencias
        </button>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Detalle de Incidencia</h1>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border flex items-center gap-1.5 ${statusColors[incident.status] || ""}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {incident.status.replace("_", " ")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Categoría</span>
              <p className="font-semibold mt-0.5">{incident.category?.name}</p>
            </div>
            <div>
              <span className="text-slate-500">Fecha y Hora</span>
              <p className="font-semibold mt-0.5">
                {new Date(incident.date).toLocaleDateString("es-ES", {
                  day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: TIMEZONE,
                })}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Fecha y Hora Final</span>
              <p className="font-semibold mt-0.5">
                {incident.endDate
                  ? new Date(incident.endDate).toLocaleDateString("es-ES", {
                      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: TIMEZONE,
                    })
                  : "—"}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Reportado por</span>
              <p className="font-semibold mt-0.5">{incident.reportedBy}</p>
            </div>
            <div>
              <span className="text-slate-500">Registrado por</span>
              <p className="font-semibold mt-0.5">{incident.user?.name}</p>
            </div>
            <div>
              <span className="text-slate-500">Lugar / Dependencia</span>
              <p className="font-semibold mt-0.5">{incident.place || "—"}</p>
            </div>
          </div>

          <div>
            <span className="text-sm text-slate-500">Detalle de lo Realizado</span>
            <p className="mt-1 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{incident.description}</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => router.push(`/incidents/${incident.id}/edit`)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2.5 px-5 rounded-xl transition-all"
            >
              Editar
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
