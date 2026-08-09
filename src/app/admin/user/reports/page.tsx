"use client";

import { useState } from "react";
import { 
  FileText, Download, Calendar, Filter, TrendingUp, DollarSign, ListOrdered, CheckCircle2 
} from "lucide-react";

interface SalesRow {
  period: string;
  ordersCount: number;
  revenue: number;
  tax: number;
  growth: string;
}

export default function MerchantReportsPage() {
  const [interval, setInterval] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY">("DAILY");
  const [selectedYear, setSelectedYear] = useState("2026");

  // Mock sales report rows based on interval
  const getMockSalesData = (): SalesRow[] => {
    switch (interval) {
      case "DAILY":
        return [
          { period: "2026-07-24", ordersCount: 14, revenue: 1200.0, tax: 60.0, growth: "+8%" },
          { period: "2026-07-25", ordersCount: 22, revenue: 1900.0, tax: 95.0, growth: "+12%" },
          { period: "2026-07-26", ordersCount: 18, revenue: 1700.0, tax: 85.0, growth: "-4%" },
          { period: "2026-07-27", ordersCount: 26, revenue: 2400.0, tax: 120.0, growth: "+15%" },
          { period: "2026-07-28", ordersCount: 34, revenue: 3100.0, tax: 155.0, growth: "+18%" },
          { period: "2026-07-29", ordersCount: 30, revenue: 2800.0, tax: 140.0, growth: "-3%" },
          { period: "2026-07-30", ordersCount: 42, revenue: 3900.0, tax: 195.0, growth: "+22%" },
        ];
      case "WEEKLY":
        return [
          { period: "Week 27 (Jul 1 - Jul 7)", ordersCount: 120, revenue: 9800.0, tax: 490.0, growth: "+6%" },
          { period: "Week 28 (Jul 8 - Jul 14)", ordersCount: 145, revenue: 12400.0, tax: 620.0, growth: "+14%" },
          { period: "Week 29 (Jul 15 - Jul 21)", ordersCount: 130, revenue: 11100.0, tax: 555.0, growth: "-8%" },
          { period: "Week 30 (Jul 22 - Jul 28)", ordersCount: 175, revenue: 15600.0, tax: 780.0, growth: "+18%" },
        ];
      case "MONTHLY":
        return [
          { period: "January 2026", ordersCount: 450, revenue: 38000.0, tax: 1900.0, growth: "+4%" },
          { period: "February 2026", ordersCount: 520, revenue: 44200.0, tax: 2210.0, growth: "+11%" },
          { period: "March 2026", ordersCount: 490, revenue: 41000.0, tax: 2050.0, growth: "-5%" },
          { period: "April 2026", ordersCount: 580, revenue: 51200.0, tax: 2560.0, growth: "+18%" },
          { period: "May 2026", ordersCount: 650, revenue: 58900.0, tax: 2945.0, growth: "+14%" },
          { period: "June 2026", ordersCount: 710, revenue: 64500.0, tax: 3225.0, growth: "+10%" },
          { period: "July 2026", ordersCount: 820, revenue: 74200.0, tax: 3710.0, growth: "+15%" },
        ];
      case "YEARLY":
        return [
          { period: "Year 2024", ordersCount: 4800, revenue: 395000.0, tax: 19750.0, growth: "+12%" },
          { period: "Year 2025", ordersCount: 6100, revenue: 512000.0, tax: 25600.0, growth: "+21%" },
          { period: "Year 2026 (YTD)", ordersCount: 4220, revenue: 372000.0, tax: 18600.0, growth: "+14%" },
        ];
    }
  };

  const rows = getMockSalesData();

  const totalOrders = rows.reduce((acc, r) => acc + r.ordersCount, 0);
  const totalRevenue = rows.reduce((acc, r) => acc + r.revenue, 0);
  const totalTax = rows.reduce((acc, r) => acc + r.tax, 0);

  // Trigger browser styled PDF generation via new printing window
  const handleDownloadPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to download PDF reports.");
      return;
    }

    const rowsHtml = rows.map(r => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 600; color: #334155;">${r.period}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 700; text-align: center; color: #334155;">${r.ordersCount}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 700; text-align: right; color: #334155;">$${r.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 600; text-align: right; color: #64748b;">$${r.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 700; text-align: center; color: ${r.growth.startsWith("+") ? "#059669" : "#dc2626"}">${r.growth}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Sales Audit Report - ${interval}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; background-color: #ffffff; }
            .header { border-bottom: 3px solid #4f46e5; padding-bottom: 15px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: 900; color: #1e293b; text-transform: uppercase; letter-spacing: -0.5px; }
            .subtitle { font-size: 11px; font-weight: 600; color: #64748b; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f8fafc; border-bottom: 2px solid #cbd5e1; padding: 12px 10px; text-align: left; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; }
            td { font-size: 11px; }
            .total-row { background-color: #f1f5f9; font-weight: 800; }
            .total-row td { padding: 12px 10px; border-top: 2px solid #94a3b8; color: #0f172a; font-size: 12px; }
            .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 9px; font-weight: 600; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Merchant Sales Performance Report</div>
            <div class="subtitle">Scoping Interval: ${interval} (${selectedYear}) | Generated on: ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="text-align: left;">Billing Period / Date</th>
                <th style="text-align: center;">Orders Count</th>
                <th style="text-align: right;">Gross Revenue</th>
                <th style="text-align: right;">Estimated Tax (GST)</th>
                <th style="text-align: center;">Growth Performance</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr class="total-row">
                <td>Total Summary</td>
                <td style="text-align: center;">${totalOrders}</td>
                <td style="text-align: right;">$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style="text-align: right;">$${totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style="text-align: center;">-</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            Confidential Document. Secure Market Enterprise Merchant Module.
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Generate downloadable CSV sales log file
  const handleDownloadCSV = () => {
    const csvHeaders = ["Billing Period / Date", "Orders Count", "Gross Revenue ($)", "Tax / GST ($)", "Growth Performance"];
    const csvRows = rows.map(r => [r.period, r.ordersCount, r.revenue.toFixed(2), r.tax.toFixed(2), r.growth]);
    
    // Add total row
    csvRows.push(["TOTAL SUMMARY", totalOrders, totalRevenue.toFixed(2), totalTax.toFixed(2), ""]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [csvHeaders.join(","), ...csvRows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Sales_Report_${interval}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 p-6">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Sales Audit Reports</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Generate sales summaries, analyze order counts, estimated tax liability, and export to CSV or print PDF.
        </p>
      </div>

      {/* Filter Options */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="space-y-1">
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Report Interval</label>
            <select
              value={interval}
              onChange={(e: any) => setInterval(e.target.value)}
              className="bg-slate-55 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-850 rounded-xl py-2 px-3 focus:outline-none text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="DAILY">Daily performance</option>
              <option value="WEEKLY">Weekly summary</option>
              <option value="MONTHLY">Monthly report</option>
              <option value="YEARLY">Yearly basis</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Target Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-slate-55 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-850 rounded-xl py-2 px-3 focus:outline-none text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="2026">2026 calendar</option>
              <option value="2025">2025 calendar</option>
              <option value="2024">2024 calendar</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-4.5 py-3 border border-indigo-650 text-indigo-650 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-2xl font-bold text-xs active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-4.5 py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-indigo-655/25 active:scale-95 transition-all"
          >
            <FileText className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sales Revenue</p>
            <p className="text-lg font-black text-slate-850 dark:text-slate-100 mt-0.5">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400">
            <ListOrdered className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Orders</p>
            <p className="text-lg font-black text-slate-850 dark:text-slate-100 mt-0.5">{totalOrders}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tax (GST) Accrued</p>
            <p className="text-lg font-black text-slate-850 dark:text-slate-100 mt-0.5">${totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

      </div>

      {/* Sales report data list */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/40 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850">
                <th className="p-4">Billing Period</th>
                <th className="p-4 text-center">Orders Count</th>
                <th className="p-4 text-right">Revenue</th>
                <th className="p-4 text-right">GST Liability</th>
                <th className="p-4 text-center">Growth Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs font-semibold text-slate-655 dark:text-slate-350">
              {rows.map((row) => (
                <tr key={row.period} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                  <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{row.period}</td>
                  <td className="p-4 text-center font-bold font-mono">{row.ordersCount}</td>
                  <td className="p-4 text-right font-bold text-slate-800 dark:text-slate-200">${row.revenue.toFixed(2)}</td>
                  <td className="p-4 text-right text-slate-500 font-mono">${row.tax.toFixed(2)}</td>
                  <td className={`p-4 text-center font-bold ${
                    row.growth.startsWith("+") ? "text-emerald-650" : "text-rose-650"
                  }`}>{row.growth}</td>
                </tr>
              ))}
              <tr className="bg-slate-50/60 dark:bg-slate-950/30 font-black text-slate-850 dark:text-slate-100 border-t-2 border-slate-100 dark:border-slate-800">
                <td className="p-4 text-sm">Total Performance</td>
                <td className="p-4 text-center font-mono text-sm">{totalOrders}</td>
                <td className="p-4 text-right text-sm">${totalRevenue.toFixed(2)}</td>
                <td className="p-4 text-right text-sm text-slate-550">${totalTax.toFixed(2)}</td>
                <td className="p-4 text-center">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
