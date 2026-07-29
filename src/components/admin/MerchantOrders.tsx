"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ListOrdered, Search, Filter, RefreshCw, ChevronDown, ChevronUp, Clock, 
  CheckCircle2, XCircle, Package, Truck, RotateCcw, Loader2, AlertCircle
} from "lucide-react";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    unit: string;
    image: string;
    shopId: string | null;
  };
}

interface OrderRecord {
  id: string;
  totalAmount: number;
  status: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryPhone: string;
  createdAt: string | Date;
  user: {
    name: string | null;
    email: string | null;
  };
  items: OrderItem[];
}

interface MerchantOrdersProps {
  initialOrders: OrderRecord[];
  shopId: string | null;
}

const STATUS_OPTIONS = [
  { label: "Pending", value: "PENDING", color: "bg-amber-100 text-amber-700 dark:bg-amber-955/20 dark:text-amber-400 border-amber-250/20" },
  { label: "Packed", value: "PACKED", color: "bg-blue-100 text-blue-700 dark:bg-blue-955/20 dark:text-blue-400 border-blue-250/20" },
  { label: "Delivered", value: "DELIVERED", color: "bg-green-100 text-green-700 dark:bg-green-955/20 dark:text-green-400 border-green-250/20" },
  { label: "Cancelled", value: "CANCELLED", color: "bg-rose-100 text-rose-700 dark:bg-rose-955/20 dark:text-rose-450 border-rose-250/20" },
  { label: "Returned", value: "RETURNED", color: "bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-400 border-slate-200/50" }
];

export default function MerchantOrders({ initialOrders, shopId }: MerchantOrdersProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRecord[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter orders by search and status
  const filteredOrders = orders.filter((order) => {
    // If order contains items for this merchant's shop
    const hasShopItems = shopId 
      ? order.items.some(item => item.product.shopId === shopId)
      : true;

    if (!hasShopItems) return false;

    const matchesSearch = 
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      (order.user?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (order.user?.email || "").toLowerCase().includes(search.toLowerCase()) ||
      order.deliveryAddress.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "All" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update order status");
      }

      const updated = await res.json();
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: updated.status } : o));
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusStyle = (status: string) => {
    return STATUS_OPTIONS.find(o => o.value === status)?.color || "bg-slate-50 text-slate-655 border-slate-200/50";
  };

  const getStatusLabel = (status: string) => {
    return STATUS_OPTIONS.find(o => o.value === status)?.label || status;
  };

  return (
    <div className="space-y-6">
      
      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by order ID, customer name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-foreground"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-2 px-3 text-xs font-bold text-slate-655 dark:text-slate-350 focus:outline-none cursor-pointer"
          >
            <option value="All">All Fulfillments</option>
            <option value="PENDING">PENDING</option>
            <option value="PACKED">PACKED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="RETURNED">RETURNED</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/30 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-xs font-bold">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Orders List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/50">
                <th className="p-4 px-6">Order ID</th>
                <th className="p-4 px-6">Customer Details</th>
                <th className="p-4 px-6">Date</th>
                <th className="p-4 px-6">Assigned Items</th>
                <th className="p-4 px-6">Sales Total</th>
                <th className="p-4 px-6">Status</th>
                <th className="p-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredOrders.map((order) => {
                // Filter order items to only show products belonging to this shop
                const shopItems = shopId 
                  ? order.items.filter(item => item.product.shopId === shopId)
                  : order.items;

                const shopTotal = shopItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                const isExpanded = expandedId === order.id;

                return (
                  <div key={order.id} className="contents">
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 px-6 font-mono font-bold text-slate-500">
                        #{order.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="p-4 px-6">
                        <p className="font-extrabold text-slate-850 dark:text-slate-100">{order.user?.name || "Guest User"}</p>
                        <p className="text-[10px] text-slate-450 dark:text-slate-500 font-medium">{order.deliveryPhone}</p>
                      </td>
                      <td className="p-4 px-6 text-slate-500 dark:text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                      </td>
                      <td className="p-4 px-6 font-semibold">
                        {shopItems.length} Products
                      </td>
                      <td className="p-4 px-6 font-extrabold text-slate-800 dark:text-slate-100">
                        ₹{shopTotal.toFixed(2)}
                      </td>
                      <td className="p-4 px-6">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border flex items-center gap-1 w-fit ${getStatusStyle(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="p-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {updatingId === order.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                          ) : (
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-1.5 px-2 text-[10px] font-bold text-foreground focus:outline-none cursor-pointer"
                            >
                              {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          )}

                          <button
                            onClick={() => setExpandedId(isExpanded ? null : order.id)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-xl transition-colors cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded details */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="p-6 bg-slate-50/50 dark:bg-slate-900/30">
                          <div className="space-y-4 max-w-2xl">
                            <div>
                              <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 mb-2">Order Items</h4>
                              <div className="divide-y divide-slate-100 dark:divide-slate-800 border rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
                                {shopItems.map((item) => (
                                  <div key={item.id} className="p-3 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-350">
                                    <div className="flex items-center gap-3">
                                      {item.product.image ? (
                                        <div className="w-8 h-8 rounded-lg overflow-hidden border relative bg-slate-50">
                                          <img src={item.product.image} alt={item.product.name} className="object-cover w-full h-full" />
                                        </div>
                                      ) : (
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-xs">🥬</div>
                                      )}
                                      <div>
                                        <p className="text-slate-800 dark:text-slate-100">{item.product.name}</p>
                                        <p className="text-[9px] text-slate-400 font-medium">Unit: {item.product.unit}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-slate-850 dark:text-slate-200">₹{item.price} x {item.quantity}</p>
                                      <p className="text-[10px] text-slate-450 dark:text-slate-500">Subtotal: ₹{(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-655 dark:text-slate-400">
                              <div>
                                <span className="block text-[9px] text-slate-400 uppercase tracking-wider mb-1">Delivery Address</span>
                                <p className="text-slate-800 dark:text-slate-200 font-medium bg-white dark:bg-slate-900 border rounded-2xl p-3 leading-normal">
                                  {order.deliveryAddress}, {order.deliveryCity}
                                </p>
                              </div>
                              <div>
                                <span className="block text-[9px] text-slate-400 uppercase tracking-wider mb-1">Fulfillment Details</span>
                                <div className="space-y-1 bg-white dark:bg-slate-900 border rounded-2xl p-3 font-medium text-slate-700 dark:text-slate-350">
                                  <p>Contact: {order.deliveryPhone}</p>
                                  <p>Status: <span className="font-extrabold text-indigo-650">{order.status}</span></p>
                                  <p>User Email: {order.user?.email || "Guest"}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </div>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">No orders found for your shop.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
