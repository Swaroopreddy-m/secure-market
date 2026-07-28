# Requirements Traceability Matrix (RTM)

This matrix maps each requirement from the SaaS Marketplace upgrade checklist to its corresponding file implementation.

| Requirement ID | Requirement Description | Implementing File(s) | Status |
|---|---|---|---|
| **REQ-01** | Marketplace landing page on root `/` | [src/app/page.tsx](file:///c:/Users/user/Documents/Projects/secure-market/src/app/page.tsx) | Completed |
| **REQ-02** | Independent Login view on `/login` | [src/app/login/page.tsx](file:///c:/Users/user/Documents/Projects/secure-market/src/app/login/page.tsx) | Completed |
| **REQ-03** | Standalone Customer Registration | [src/app/register/page.tsx](file:///c:/Users/user/Documents/Projects/secure-market/src/app/register/page.tsx) | Completed |
| **REQ-04** | Dynamic role-based profile menu dropdown | [src/components/layout/Navbar.tsx](file:///c:/Users/user/Documents/Projects/secure-market/src/components/layout/Navbar.tsx) | Completed |
| **REQ-05** | Guest routing protection & redirects | [ProductCard.tsx](file:///c:/Users/user/Documents/Projects/secure-market/src/components/ui/ProductCard.tsx), [cart/page.tsx](file:///c:/Users/user/Documents/Projects/secure-market/src/app/cart/page.tsx), [checkout/page.tsx](file:///c:/Users/user/Documents/Projects/secure-market/src/app/checkout/page.tsx) | Completed |
| **REQ-06** | Dynamic access-controlled admin sidebar | [AdminShell.tsx](file:///c:/Users/user/Documents/Projects/secure-market/src/components/admin/AdminShell.tsx) | Completed |
| **REQ-07** | Product Admin: Manage Applications CRUD | [ProductAdminTabs.tsx](file:///c:/Users/user/Documents/Projects/secure-market/src/components/admin/ProductAdminTabs.tsx) | Completed |
| **REQ-08** | Product Admin: Manage Shops CRUD | [ProductAdminTabs.tsx](file:///c:/Users/user/Documents/Projects/secure-market/src/components/admin/ProductAdminTabs.tsx), [api/shops/route.ts](file:///c:/Users/user/Documents/Projects/secure-market/src/app/api/shops/route.ts) | Completed |
| **REQ-09** | Product Admin: Manage Categories | [ProductAdminTabs.tsx](file:///c:/Users/user/Documents/Projects/secure-market/src/components/admin/ProductAdminTabs.tsx), [api/categories/route.ts](file:///c:/Users/user/Documents/Projects/secure-market/src/app/api/categories/route.ts) | Completed |
| **REQ-10** | Product Admin: Manage Products Catalog | [ProductAdminTabs.tsx](file:///c:/Users/user/Documents/Projects/secure-market/src/components/admin/ProductAdminTabs.tsx), [api/products/route.ts](file:///c:/Users/user/Documents/Projects/secure-market/src/app/api/products/route.ts) | Completed |
| **REQ-11** | Product Admin: Manage Merchant Accounts | [ProductAdminTabs.tsx](file:///c:/Users/user/Documents/Projects/secure-market/src/components/admin/ProductAdminTabs.tsx) | Completed |
| **REQ-12** | Market User (Merchant): Scoped dashboard | [user/page.tsx](file:///c:/Users/user/Documents/Projects/secure-market/src/app/admin/user/page.tsx) | Completed |
| **REQ-13** | Persistent theme system toggle | [Navbar.tsx](file:///c:/Users/user/Documents/Projects/secure-market/src/components/layout/Navbar.tsx), [StoreLayoutWrapper.tsx](file:///c:/Users/user/Documents/Projects/secure-market/src/components/layout/StoreLayoutWrapper.tsx) | Completed |
| **REQ-14** | Production container packaging | [Dockerfile](file:///c:/Users/user/Documents/Projects/secure-market/Dockerfile), [.dockerignore](file:///c:/Users/user/Documents/Projects/secure-market/.dockerignore) | Completed |
