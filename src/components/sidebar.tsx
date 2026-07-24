"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Layers, LayoutDashboard, Ticket, FolderTree, Users, Shield, LogOut, FileText, UserCircle, Mail, Building2, GitBranch, Menu, X } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { href: "/incidents", label: "Incidencias", icon: Ticket, adminOnly: false },
  { href: "/incidents/report", label: "Reportes", icon: FileText, adminOnly: false },
  { href: "/categories", label: "Categorías", icon: FolderTree, adminOnly: true },
  { href: "/companies", label: "Empresas", icon: Building2, adminOnly: true },
  { href: "/departments", label: "Departamentos", icon: GitBranch, adminOnly: true },
  { href: "/users", label: "Usuarios", icon: Users, adminOnly: true },
  { href: "/roles", label: "Roles", icon: Shield, adminOnly: true },
  { href: "/emails", label: "Correos", icon: Mail, adminOnly: true },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isAdmin = (session?.user as any)?.role === "Admin";

  useEffect(() => { setOpen(false); }, [pathname]);

  const nav = (
    <>
      <nav className="flex-1 p-3 space-y-1">
        {navItems
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  active
                    ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
      </nav>

      <div className="p-3 border-t border-slate-800">
        <div
          onClick={() => router.push("/profile")}
          className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all cursor-pointer"
        >
          <UserCircle className="w-5 h-5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">{session?.user?.name}</p>
            <p className="text-[10px] text-slate-500 truncate">{(session?.user as any)?.role}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Hamburger button - mobile/tablet */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-white lg:hidden transition-all"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 bg-slate-950 border-r border-slate-800 flex-col shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold">Incidencias</h1>
            <p className="text-[10px] text-slate-500">Tracker v1</p>
          </div>
        </div>
        {nav}
      </aside>

      {/* Mobile/tablet overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-bold">Incidencias</h1>
                  <p className="text-[10px] text-slate-500">Tracker v1</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
