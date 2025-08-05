import { NextResponse, type NextRequest } from "next/server";
import { getUserFromSession, updateUserSessionExpiration } from "@/lib/session";

const authRoutes = ["/admin", "/usuarios", "/perfil", "/ajustes", "/produtos", "/pedidos", "/relatorios"];
const publicOnlyRoutes = ["/entrar", "/cadastro", "/senha"];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const user = await getUserFromSession(request.cookies);

  // Redirecionar usuários autenticados para fora das rotas públicas
  if (publicOnlyRoutes.some(route => path.startsWith(route)) && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Verificar autenticação para rotas protegidas
  if (authRoutes.some(route => path.startsWith(route))) {
    if (!user) {
      const url = new URL("/entrar", request.url);
      url.searchParams.set("redirect", path);
      return NextResponse.redirect(url);
    }

    // Verificar autorização admin
    if (path.startsWith("/admin") && user.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Verificar autorização para edição de usuário
    if (path.match(/^\/users\/(\d+)\/edit$/) && user.role !== "admin") {
      const userId = path.split("/")[2];
      if (userId !== user.id.toString()) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  }

  const response = NextResponse.next();

  // Atualizar expiração da sessão se o usuário estiver autenticado
  if (user) {
    await updateUserSessionExpiration({
      set: (key, value, options) => {
        response.cookies.set({ ...options, name: key, value });
      },
      get: (key) => request.cookies.get(key),
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|fonts|videos).*)",
  ],
};

// export const config = {
//   matcher: [
//     // Skip Next.js internals and all static files, unless found in search params
//     "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
//   ],
// };