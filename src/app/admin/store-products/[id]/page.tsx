import StoreProductForm from "@/components/admin/StoreProductForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function EditStoreProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.storeProduct.findUnique({
    where: { id }
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <Link 
          href="/admin/store-products" 
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Store Products
        </Link>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Edit Grocery Product</h2>
        <p className="text-xs text-slate-500">Update specifications, stock, and pricing for this grocery item.</p>
      </div>

      <StoreProductForm initialData={product} />
    </div>
  );
}
