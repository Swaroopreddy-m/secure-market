import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (path.startsWith("/admin")) {
      if (!token) {
        return NextResponse.redirect(new URL("/", req.url));
      }
      
      const role = token.role as string;

      // Developer role has unrestricted access to everything
      if (role === "DEVELOPER") {
        return NextResponse.next();
      }

      // Define Developer-only restricted system paths
      const devOnlyPaths = [
        "/admin/organizations",
        "/admin/roles",
        "/admin/api-logs",
        "/admin/database",
        "/admin/analytics",
        "/admin/deployments",
        "/admin/configurations",
        "/admin/backups",
        "/admin/monitoring"
      ];

      if (devOnlyPaths.some(p => path.startsWith(p))) {
        if (role === "SUPER_ADMIN" || role === "ADMIN") {
          return NextResponse.redirect(new URL("/admin", req.url));
        } else if (role === "PRODUCT_ADMIN") {
          return NextResponse.redirect(new URL("/admin/product-admin", req.url));
        } else if (role === "USER") {
          return NextResponse.redirect(new URL("/admin/user", req.url));
        }
        return NextResponse.redirect(new URL("/", req.url));
      }

      // Super Admin allowed modules (Business operations only)
      if (role === "SUPER_ADMIN") {
        const superAllowed = [
          "/admin",
          "/admin/products",
          "/admin/customers",
          "/admin/users",
          "/admin/reports",
          "/admin/audit-logs",
          "/admin/notifications"
        ];
        const isAllowed = superAllowed.some(p => path === p || path.startsWith(p + "/"));
        if (!isAllowed) {
          return NextResponse.redirect(new URL("/admin", req.url));
        }
        return NextResponse.next();
      }

      // Legacy Store Admin allowed modules
      if (role === "ADMIN") {
        const adminAllowed = [
          "/admin",
          "/admin/store-products",
          "/admin/orders",
          "/admin/users"
        ];
        const isAllowed = adminAllowed.some(p => path === p || path.startsWith(p + "/"));
        if (!isAllowed) {
          return NextResponse.redirect(new URL("/admin", req.url));
        }
        return NextResponse.next();
      }

      // Product Admin allowed modules
      if (role === "PRODUCT_ADMIN") {
        const allowed = [
          "/admin/product-admin",
          "/admin/products"
        ];
        const isAllowed = allowed.some(p => path === p || path.startsWith(p + "/"));
        if (!isAllowed) {
          return NextResponse.redirect(new URL("/admin/product-admin", req.url));
        }
        return NextResponse.next();
      }

      // User (Shop Merchant) allowed modules
      if (role === "USER") {
        const allowed = [
          "/admin/user"
        ];
        const isAllowed = allowed.some(p => path === p || path.startsWith(p + "/"));
        if (!isAllowed) {
          return NextResponse.redirect(new URL("/admin/user", req.url));
        }
        return NextResponse.next();
      }

      // Any other roles are blocked from admin portal
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*"],
};
