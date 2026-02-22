import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// Rotas públicas que não precisam de autenticação
const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/maintenance"];

// Rotas de API públicas
const publicApiRoutes = ["/api/auth", "/api/health"];

// Rotas estáticas
const staticRoutes = ["/_next", "/favicon.ico", "/images", "/fonts"];

// Cache de modo de manutenção (60 segundos)
let maintenanceCache: { enabled: boolean; cachedAt: number } | null = null;

async function getMaintenanceMode(): Promise<boolean> {
  const now = Date.now();
  if (maintenanceCache && now - maintenanceCache.cachedAt < 60_000) {
    return maintenanceCache.enabled;
  }

  // Em produção, isso viria do banco de dados ou Redis
  // Por padrão, modo de manutenção está desativado
  const enabled = process.env.MAINTENANCE_MODE === "true";
  
  maintenanceCache = { enabled, cachedAt: now };
  return enabled;
}

export default auth(async (req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const pathname = nextUrl.pathname;
  const userRole = req.auth?.user?.role;

  // Permitir rotas estáticas
  if (staticRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Permitir rotas de API de auth
  if (publicApiRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Verificar modo de manutenção
  if (!pathname.startsWith("/maintenance") && 
      !pathname.startsWith("/api/health") &&
      !pathname.startsWith("/admin/settings")) {
    const maintenanceMode = await getMaintenanceMode();

    if (maintenanceMode) {
      // SUPER_ADMIN pode passar mesmo em manutenção
      if (!userRole || userRole !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/maintenance", nextUrl));
      }
    }
  }

  // Permitir rotas públicas
  if (publicRoutes.some((route) => pathname === route || pathname.startsWith(route))) {
    // Se já estiver logado, redirecionar para o dashboard
    if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/projects", nextUrl));
    }
    return NextResponse.next();
  }

  // Verificar autenticação para rotas protegidas
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Rotas de admin apenas para SUPER_ADMIN
  if (pathname.startsWith("/admin")) {
    if (userRole !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

// Função para invalidar o cache de manutenção (chamada ao salvar configurações)
export function invalidateMaintenanceCache() {
  maintenanceCache = null;
}
