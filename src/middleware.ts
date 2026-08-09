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

      // Product Admin allowed modules & granular direct URL entry guarding
      if (role === "PRODUCT_ADMIN") {
        const allowed = [
          "/admin/product-admin",
          "/admin/products"
        ];
        const isAllowed = allowed.some(p => path === p || path.startsWith(p + "/"));
        if (!isAllowed) {
          return NextResponse.redirect(new URL("/admin/product-admin", req.url));
        }

        // Granular check against assigned permissions (token.department)
        const userRights = (token.department as string || "")
          .split(",")
          .map((s: string) => s.trim().toLowerCase());

        if (path === "/admin/product-admin" || path === "/admin/product-admin/") {
          if (!userRights.includes("dashboard")) {
            // If they don't even have dashboard, they are not allowed
            return NextResponse.redirect(new URL("/", req.url));
          }
        } else if (path.startsWith("/admin/product-admin/profile")) {
          if (!userRights.includes("applications") && !userRights.includes("dashboard")) {
            return NextResponse.redirect(new URL("/admin/product-admin", req.url));
          }
        } else if (path.startsWith("/admin/product-admin/merchant-users")) {
          if (!userRights.includes("users") && !userRights.includes("merchants")) {
            return NextResponse.redirect(new URL("/admin/product-admin", req.url));
          }
        } else if (path.startsWith("/admin/product-admin/roles")) {
          if (!userRights.includes("roles")) {
            return NextResponse.redirect(new URL("/admin/product-admin", req.url));
          }
        } else if (path.startsWith("/admin/product-admin/reports")) {
          if (!userRights.includes("reports")) {
            return NextResponse.redirect(new URL("/admin/product-admin", req.url));
          }
        } else if (path.startsWith("/admin/product-admin/notifications")) {
          if (!userRights.includes("notifications")) {
            return NextResponse.redirect(new URL("/admin/product-admin", req.url));
          }
        } else if (path.startsWith("/admin/product-admin/audit-logs")) {
          if (!userRights.includes("audit logs") && !userRights.includes("audit")) {
            return NextResponse.redirect(new URL("/admin/product-admin", req.url));
          }
        } else if (path.startsWith("/admin/product-admin/settings")) {
          if (!userRights.includes("settings")) {
            return NextResponse.redirect(new URL("/admin/product-admin", req.url));
          }
        }

        return NextResponse.next();
      }

      // User (Shop Merchant) allowed modules & direct URL entry guards
      if (role === "USER") {
        const allowed = [
          "/admin/user"
        ];
        const isAllowed = allowed.some(p => path === p || path.startsWith(p + "/"));
        if (!isAllowed) {
          return NextResponse.redirect(new URL("/admin/user", req.url));
        }

        const userRights = (token.department as string || "")
          .split(",")
          .map((s: string) => s.trim().toLowerCase());

        if (path === "/admin/user" || path === "/admin/user/") {
          // Dashboard check
          if (!userRights.includes("dashboard")) {
            return NextResponse.redirect(new URL("/", req.url));
          }
        } else if (path.startsWith("/admin/user/categories")) {
          if (!userRights.includes("categories") && !userRights.includes("category view")) {
            return NextResponse.redirect(new URL("/admin/user", req.url));
          }
        } else if (path.startsWith("/admin/user/products")) {
          if (!userRights.includes("products") && !userRights.includes("product view")) {
            return NextResponse.redirect(new URL("/admin/user", req.url));
          }
        } else if (path.startsWith("/admin/user/inventory")) {
          if (!userRights.includes("inventory") && !userRights.includes("inventory view")) {
            return NextResponse.redirect(new URL("/admin/user", req.url));
          }
        } else if (path.startsWith("/admin/user/images")) {
          if (!userRights.includes("product images") && !userRights.includes("images") && !userRights.includes("image upload")) {
            return NextResponse.redirect(new URL("/admin/user", req.url));
          }
        } else if (path.startsWith("/admin/user/prices")) {
          if (!userRights.includes("price management") && !userRights.includes("prices") && !userRights.includes("price view")) {
            return NextResponse.redirect(new URL("/admin/user", req.url));
          }
        } else if (path.startsWith("/admin/user/reports")) {
          if (!userRights.includes("reports")) {
            return NextResponse.redirect(new URL("/admin/user", req.url));
          }
        } else if (path.startsWith("/admin/user/notifications")) {
          if (!userRights.includes("notifications")) {
            return NextResponse.redirect(new URL("/admin/user", req.url));
          }
        } else if (path.startsWith("/admin/user/settings")) {
          if (!userRights.includes("settings")) {
            return NextResponse.redirect(new URL("/admin/user", req.url));
          }
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
