import prisma from "@/lib/prisma";
import { Search, Filter, Eye, Truck, Package, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      user: true,
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-orange-100 text-orange-700 border-orange-200";
      case "PACKED": return "bg-blue-100 text-blue-700 border-blue-200";
      case "OUT_FOR_DELIVERY": return "bg-purple-100 text-purple-700 border-purple-200";
      case "DELIVERED": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING": return Clock;
      case "PACKED": return Package;
      case "OUT_FOR_DELIVERY": return Truck;
      case "DELIVERED": return CheckCircle;
      default: return Clock;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Order Management</h2>
          <p className="text-muted-foreground">Track and manage customer orders across all stages.</p>
        </div>
      </div>

      <div className="glass-effect p-6 rounded-3xl border border-primary/5 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by order ID or customer name..." 
            className="w-full bg-muted/50 border-0 rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-muted/50 text-sm font-semibold hover:bg-muted transition-colors">
          <Filter className="w-4 h-4 line-through" /> Status: All
        </button>
      </div>

      <div className="glass-effect rounded-3xl overflow-hidden border border-primary/5 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted/30 border-b border-primary/10">
                <th className="px-8 py-6">Order Details</th>
                <th className="px-8 py-6">Customer</th>
                <th className="px-8 py-6">Items</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6">Total</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-primary/5">
              {orders.map((order) => {
                const StatusIcon = getStatusIcon(order.status);
                return (
                  <tr key={order.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="font-mono text-xs text-primary font-bold">#{order.id.slice(-8).toUpperCase()}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-bold text-foreground">{order.user.name || "Guest Customer"}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{order.user.email}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex -space-x-2 group/items">
                        {order.items.slice(0, 3).map((item) => (
                          <div 
                            key={item.id} 
                            className="w-8 h-8 rounded-full border-2 border-white bg-muted flex items-center justify-center overflow-hidden ring-2 ring-transparent group-hover/items:ring-primary/20 transition-all font-inter"
                            title={item.product.name}
                          >
                            <Image src={item.product.image} alt={item.product.name} width={32} height={32} className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="w-8 h-8 rounded-full border-2 border-white bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-2 font-medium">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black tracking-wider uppercase ${getStatusColor(order.status)} shadow-sm`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {order.status.replace(/_/g, ' ')}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-black text-base text-foreground tracking-tight">₹{order.totalAmount}</div>
                      <div className="text-[10px] text-muted-foreground font-bold">PAID</div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link 
                          href={`/track/${order.id}`}
                          className="p-2.5 bg-white shadow-sm border rounded-xl text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                          title="View Order"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-3xl">📦</div>
                      <div>
                        <p className="font-bold text-xl">No orders found</p>
                        <p className="text-muted-foreground">When customers make purchases, they will appear here.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
