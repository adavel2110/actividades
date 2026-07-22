"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";

declare global {
  interface Window { html2pdf: any; }
}

const statusLabels: Record<string, string> = {
  PENDIENTE: "Pendiente", EN_PROCESO: "En Proceso", PROCESADO: "Procesado",
  CANCELADO: "Cancelado", RECHAZADO: "Rechazado", DERIVADO: "Derivado",
};

const reportTypes = [
  { value: "letter", label: "Informe Semanal (carta)" },
  { value: "table", label: "Reporte de Incidencias (tabla)" },
];

export default function ReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [userId, setUserId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState("letter");
  const isAdmin = (session?.user as any)?.role === "Admin";

  const [whatsappPlay, setWhatsappPlay] = useState("0");
  const [whatsappConectividad, setWhatsappConectividad] = useState("0");
  const [analystName, setAnalystName] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (status !== "authenticated") return;
    setAnalystName(session?.user?.name || "");
    if (isAdmin) fetch("/api/users").then(r => r.json()).then(setUsers);
  }, [status, router, isAdmin, session]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const params = new URLSearchParams();
    params.set("limit", "1000");
    params.set("sort", "date");
    params.set("order", "asc");
    if (isAdmin && userId) params.set("userId", userId);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate + "T23:59:59");
    const res = await fetch(`/api/incidents?${params}`);
    const json = await res.json();
    setResults(json.data || []);
    setLoaded(true);
    setLoading(false);
  };

  const handlePrint = () => window.print();

  const exportExcel = () => {
    const fileName = `reporte-incidencias${startDate ? `-${startDate}` : ""}${endDate ? `-${endDate}` : ""}.xls`;

    if (reportType === "letter") {
      const rows = Object.entries(catCounts).map(([cat, count]) => [cat, count]);
      const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
          <x:Name>Informe Semanal</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
        </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
        <body><table border="1">
          <tr><th>Informe Semanal</th><th></th></tr>
          <tr><td>De:</td><td>${analystName}, Analista de Soporte de Apps (Modalidad Remota)</td></tr>
          <tr><td>Asunto:</td><td>Informe de actividades realizadas${startDate ? ` del ${fStart}` : ""}${endDate ? ` al ${fEnd}` : ""}${selectedUser ? ` - ${selectedUser.name}` : ""}</td></tr>
          <tr><td>Total de tickets:</td><td>${total}</td></tr>
          <tr><td></td><td></td></tr>
          <tr><th>Categor&iacute;a</th><th>Cantidad</th></tr>
          ${rows.map(([cat, count]) => `<tr><td>${cat}</td><td>${count}</td></tr>`).join("")}
          <tr><td></td><td></td></tr>
          <tr><th>WhatsApp Play</th><td>${whatsappPlay}</td></tr>
          <tr><th>WhatsApp Conectividad</th><td>${whatsappConectividad}</td></tr>
        </table></body></html>`;

      const blob = new Blob(["\uFEFF" + html], { type: "application/vnd.ms-excel" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
    } else {
      const headers = ["#", "Fecha", "Hora Ini", "Hora Fin", "Categoría", "Reportó", "Lugar", "Detalle", "Estado"];
      const rows = results.map((inc, i) => [
        i + 1,
        new Date(inc.date).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }),
        new Date(inc.date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        inc.endDate ? new Date(inc.endDate).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—",
        inc.category?.name || "",
        inc.reportedBy,
        inc.place || "—",
        inc.description,
        statusLabels[inc.status] || inc.status,
      ]);
      const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
          <x:Name>Reporte de Incidencias</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
        </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
        <body><table border="1">
          <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
          ${rows.map(r => `<tr>${r.map(c => `<td>${String(c).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</td>`).join("")}</tr>`).join("")}
        </table></body></html>`;

      const blob = new Blob(["\uFEFF" + html], { type: "application/vnd.ms-excel" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
    }
  };

  const exportPdf = () => {
    const el = printRef.current;
    if (!el) return;
    const isLetter = reportType === "letter";
    const opt = {
      margin: 0,
      filename: `reporte-incidencias${startDate ? `-${startDate}` : ""}${endDate ? `-${endDate}` : ""}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "a4", orientation: isLetter ? ("portrait" as any) : ("landscape" as any) },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };
    const orig = el.className;
    el.className = "bg-white text-black text-xs leading-snug p-2";
    if (window.html2pdf) {
      window.html2pdf().set(opt).from(el).save().then(() => { el.className = orig; });
    } else {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.onload = () => window.html2pdf().set(opt).from(el).save().then(() => { el.className = orig; });
      document.body.appendChild(script);
    }
  };

  const catCounts: Record<string, number> = {};
  let total = 0;
  for (const inc of results) {
    const name = inc.category?.name || "Sin categoría";
    catCounts[name] = (catCounts[name] || 0) + 1;
    total++;
  }

  const selectedUser = userId ? users.find(u => u.id === userId) : null;
  const fStart = startDate ? new Date(startDate).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : "";
  const fEnd = endDate ? new Date(endDate).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : "";
  const fStartShort = startDate ? new Date(startDate).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : "";
  const fEndShort = endDate ? new Date(endDate).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : "";

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <h1 className="text-2xl font-bold mb-8">Reportes</h1>

        <form onSubmit={handleSearch} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5 max-w-3xl">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha Inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha Fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tipo de Reporte</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {reportTypes.map(rt => (
                <option key={rt.value} value={rt.value}>{rt.label}</option>
              ))}
            </select>
          </div>

          {isAdmin && users.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Analista</label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="">Todos los usuarios</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}

          {reportType === "letter" && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre del Analista</label>
                <input
                  type="text"
                  value={analystName}
                  onChange={(e) => setAnalystName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  required
                />
              </div>

              <details className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <summary className="text-sm font-semibold text-slate-400 cursor-pointer select-none">
                  Datos de atención por WhatsApp (opcional)
                </summary>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">FibexPlay - Restablecimiento clave</label>
                    <input
                      type="number" min="0"
                      value={whatsappPlay}
                      onChange={(e) => setWhatsappPlay(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-sm text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Quejas por conectividad</label>
                    <input
                      type="number" min="0"
                      value={whatsappConectividad}
                      onChange={(e) => setWhatsappConectividad(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-sm text-white"
                    />
                  </div>
                </div>
              </details>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-6 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? "Generando..." : "Generar Reporte"}
          </button>
        </form>

        {loaded && (
          <>
            <div className="flex justify-end gap-3 mt-6 mb-4 print:hidden">
              <button
                onClick={exportPdf}
                className="bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium py-2.5 px-5 rounded-xl transition-all"
              >
                Exportar PDF
              </button>
              <button
                onClick={exportExcel}
                className="bg-green-700 hover:bg-green-600 text-white text-sm font-medium py-2.5 px-5 rounded-xl transition-all"
              >
                Exportar Excel
              </button>
              <button
                onClick={handlePrint}
                className="bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-2.5 px-5 rounded-xl transition-all"
              >
                Imprimir
              </button>
            </div>

            {reportType === "letter" ? (
              <div ref={printRef} className="bg-white text-black rounded-2xl p-5 mt-4 print:rounded-none print:p-3 print:shadow-none shadow-lg">
                <p className="text-right text-gray-700 font-medium mb-4">
                  {fEnd || "Fecha"}
                </p>

                <p className="text-gray-700 mb-1">
                  <strong>De:</strong> {analystName}, Analista de Soporte de Apps (Modalidad Remota)
                </p>

                <p className="text-gray-700 mb-4">
                  <strong>Asunto:</strong> Informe de actividades realizadas{startDate ? ` del ${fStart}` : ""}{endDate ? ` al ${fEnd}` : ""}{selectedUser ? ` — ${selectedUser.name}` : ""}
                </p>

                <p className="text-gray-700 mb-3 text-justify">
                  Por medio de la presente, informo sobre las labores ejecutadas durante la semana comprendida{startDate ? ` entre el ${fStart}` : ""}{endDate ? ` y el ${fEnd}` : ""} de 2026, período en el cual he laborado de manera remota tras el sismo ocurrido en el país, con el fin de garantizar la continuidad operativa.
                </p>

                <p className="text-gray-700 mb-4">
                  A continuación, el detalle de las gestiones realizadas:
                </p>

                <p className="text-gray-700 mb-1">
                  <strong>1. Gestión de tickets a través de GLPI</strong>
                </p>

                <p className="text-gray-700 mb-1">
                  Se resolvieron un total de <strong>{total}</strong> casos, desglosados de la siguiente manera:
                </p>

                <ul className="list-disc pl-8 mb-3 text-gray-700 space-y-0.5">
                  {Object.entries(catCounts).map(([cat, count]) => {
                    let desc;
                    const cl = cat.toLowerCase();
                    if (cl.includes("ezturns")) desc = "relacionado con la plataforma EZTurns.";
                    else if (cl.includes("oficina") || cl.includes("movil")) desc = "referentes a fallas o imposibilidad de acceso a Oficina Móvil.";
                    else desc = `correspondientes a inconvenientes de clientes que no podían acceder a ${cat}.`;
                    return (
                      <li key={cat}>
                        <strong>{count}</strong> {count === 1 ? "caso" : "casos"} {desc}
                      </li>
                    );
                  })}
                </ul>

                <p className="text-gray-700 mb-1">
                  <strong>2. Atención a través del número de WhatsApp de soporte</strong>
                </p>

                {Number(whatsappPlay) + Number(whatsappConectividad) > 0 ? (
                  <>
                    <p className="text-gray-700 mb-1">
                      Se respondieron aproximadamente{" "}
                      <strong>{Number(whatsappPlay) + Number(whatsappConectividad)} mensajes</strong>,
                      distribuidos así:
                    </p>
                    <ul className="list-disc pl-8 mb-3 text-gray-700 space-y-0.5">
                      {Number(whatsappPlay) > 0 && (
                        <li>
                          <strong>{whatsappPlay}</strong> {Number(whatsappPlay) === 1 ? "caso" : "casos"}{" "}
                          de usuarios de FibexPlay que solicitaron el restablecimiento o envío de su clave de acceso.
                        </li>
                      )}
                      {Number(whatsappConectividad) > 0 && (
                        <li>
                          <strong>{whatsappConectividad}</strong> mensajes{Number(whatsappConectividad) > 1 ? " (la mayoría)" : ""}{" "}
                          correspondientes a quejas por baja conectividad o internet nulo. En estos casos, se instruyó a los clientes a contactarse directamente con el personal de Atención al Cliente, ya que dichas fallas escapan al alcance del soporte de plataformas y dependen del proveedor de red.
                        </li>
                      )}
                    </ul>
                  </>
                ) : (
                  <p className="text-gray-700 mb-3 text-justify">
                    No se reportaron atenciones por WhatsApp durante el período.
                  </p>
                )}

                <p className="text-gray-700 mb-3 text-justify">
                  Sin más nada que agregar, quedo atento a cualquier requerimiento o ampliación de la información. Reitero mi compromiso con la operación a pesar de las contingencias.
                </p>

                <p className="text-gray-700 mb-1 mt-6">Atentamente,</p>
                <p className="text-gray-800 font-semibold text-base mt-4">{analystName}</p>
                <p className="text-gray-600">Analista de Soporte de Apps (Modalidad Remota)</p>

                <div className="text-center text-xs text-gray-400 mt-8 print:mt-6 print:text-[9px]">
                  Generado el {new Date().toLocaleString("es-ES")}
                </div>
              </div>
            ) : (
              <div ref={printRef} className="bg-white text-black rounded-2xl p-4 mt-4 print:rounded-none print:p-2 print:shadow-none shadow-lg">
                  <div className="text-center mb-4 print:mb-2">
                  <h2 className="text-xl font-bold text-gray-900">Reporte de Incidencias</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {startDate && `Del ${fStartShort}`}
                    {endDate && ` al ${fEndShort}`}
                    {selectedUser && ` — ${selectedUser.name}`}
                  </p>
                </div>

                {results.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">No se encontraron incidencias</p>
                ) : (
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="text-left py-2 px-2 font-semibold text-gray-700">#</th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-700">Fecha</th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-700">Hora Ini</th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-700">Hora Fin</th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-700">Categoría</th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-700">Reportó</th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-700">Lugar</th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-700">Detalle</th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-700">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((inc, i) => (
                        <tr key={inc.id} className="border-b border-gray-200">
                          <td className="py-2 px-2 text-gray-600 align-top">{i + 1}</td>
                          <td className="py-2 px-2 text-gray-800 align-top whitespace-nowrap">
                            {new Date(inc.date).toLocaleDateString("es-ES", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </td>
                          <td className="py-2 px-2 text-gray-800 align-top whitespace-nowrap">
                            {new Date(inc.date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="py-2 px-2 text-gray-800 align-top whitespace-nowrap">
                            {inc.endDate
                              ? new Date(inc.endDate).toLocaleString("es-ES", {
                                  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                                })
                              : "—"}
                          </td>
                          <td className="py-2 px-2 text-gray-800 align-top">{inc.category?.name}</td>
                          <td className="py-2 px-2 text-gray-800 align-top">{inc.reportedBy}</td>
                          <td className="py-2 px-2 text-gray-800 align-top">{inc.place || "—"}</td>
                          <td className="py-2 px-2 text-gray-800 align-top max-w-xs whitespace-pre-wrap">{inc.description}</td>
                          <td className="py-2 px-2 align-top">{statusLabels[inc.status] || inc.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div className="text-center text-xs text-gray-400 mt-4 print:mt-2">
                  Generado el {new Date().toLocaleString("es-ES")}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <style jsx global>{`
        @media print {
          body { background: white !important; }
          @page { margin: 2cm; }
        }
      `}</style>
    </div>
  );
}
