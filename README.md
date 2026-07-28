# Implementation Plan - Production-Ready SaaS Marketplace Enhancements

This plan outlines the design and files to update for the Production-Ready SaaS Marketplace role hierarchy, entry flows, and deployment configurations.

## Proposed Changes

### 1. Route Path Swapping (Storefront Home & Login Page)
- Move current login page from [src/app/page.tsx](file:///c:/Users/user/Documents/Projects/secure-market/src/app/page.tsx) to [src/app/login/page.tsx](file:///c:/Users/user/Documents/Projects/secure-market/src/app/login/page.tsx) [NEW].
- Update [StoreLayoutWrapper.tsx](file:///c:/Users/user/Documents/Projects/secure-market/src/components/layout/StoreLayoutWrapper.tsx) to show Navbar/Footer on `/` and hide on `/login` and `/register`.
- Move storefront dashboard page from [src/app/store/page.tsx](file:///c:/Users/user/Documents/Projects/secure-market/src/app/store/page.tsx) to [src/app/page.tsx](file:///c:/Users/user/Documents/Projects/secure-market/src/app/page.tsx) [NEW] so it serves as the marketplace landing page.

### 2. Multi-Tenant Shop & Application Schema Updates
- Update [schema.prisma](file:///c:/Users/user/Documents/Projects/secure-market/prisma/schema.prisma) to add a `Shop` model.
- Add `shopId` relation to `User` and `StoreProduct` models.
- Re-run `npx prisma db push` to synchronize SQLite tables and regenerate Prisma Client.

### 3. Dynamic Profile Menus & Theme System
- Implement a dropdown profile menu in [Navbar.tsx](file:///c:/Users/user/Documents/Projects/secure-market/src/components/layout/Navbar.tsx) that renders links based on the active role (Developer, Super Admin, Product Admin, Market User, Customer).
- Add a theme toggle button to the storefront navbar and an initialization effect in `StoreLayoutWrapper.tsx` to read the theme state.
- Create `/register` page for clean customer onboarding.

### 4. Admin Sidebar Filtering
- Update [AdminShell.tsx](file:///c:/Users/user/Documents/Projects/secure-market/src/components/admin/AdminShell.tsx) to strictly restrict menu items using role permissions.
- Redirect unauthorized dashboard URLs to an Access Denied view or fallback route.

### 5. Product Admin & Market User Dashboard Updates
- Update [ProductAdminTabs.tsx](file:///c:/Users/user/Documents/Projects/secure-market/src/components/admin/ProductAdminTabs.tsx) to include Shops, Categories, and Products tabs.
- Clean up unused or legacy dashboards in the codebase.

---

## Verification Plan

### Automated Checks
- `npx tsc --noEmit` type checking.
- Seeding database via `npx prisma db seed`.

### Manual Testing
- Authenticating as Developer (`devroot`), Super Admin (`super_admin_market`), Product Admin (`product_admin_market`), and Market User (`user_market`) to verify correct layout loading and routing.
