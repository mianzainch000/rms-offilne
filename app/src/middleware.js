import { NextResponse } from "next/server";

const publicPages = [
  "/",
  "/login",
  "/signup",
  "/forgotpassword",
  "/resetpassword",
];

const protectedPages = [
  "/dashboard",
  "/tables",
  "/kitchen",
  "/history",
  "/menu",
  "/shift",
  "/reports",
  "/users",
  "/settings",
  "/order",
];

const roleRestrictedPages = {
  "/users": ["admin"],
  "/expenses": ["admin"],
  "/settings": ["admin"],
  "/menu": ["admin", "manager"],
  "/reports": ["admin", "manager"],
  "/history": ["admin", "manager", "cashier"],
  "/shift": ["admin", "manager", "cashier"],
};

function getRoleFromToken(token) {
  try {
    const payloadBase64 = token.split(".")[1];
    const payloadJson = atob(
      payloadBase64.replace(/-/g, "+").replace(/_/g, "/"),
    );
    const payload = JSON.parse(payloadJson);
    return payload?.role || null;
  } catch {
    return null;
  }
}

export default function middleware(req) {
  const { pathname } = req.nextUrl;
  const authToken = req.cookies.get("sessionToken")?.value;

  const isPublicPage = publicPages.includes(pathname);
  const isProtectedPage = protectedPages.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`),
  );

  if (!authToken && isProtectedPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (authToken && isPublicPage && pathname !== "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (authToken && isProtectedPage && !pathname.includes("/api")) {
    const matchedPage = Object.keys(roleRestrictedPages).find(
      (page) => pathname === page || pathname.startsWith(`${page}/`),
    );
    if (matchedPage) {
      const role = getRoleFromToken(authToken);
      const allowedRoles = roleRestrictedPages[matchedPage];
      if (!role || !allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
