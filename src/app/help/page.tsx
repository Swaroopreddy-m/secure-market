"use client";

import { HelpCircle, Mail, Phone, MessageSquare, ChevronRight, Search } from "lucide-react";
import Link from "next/link";

const HELP_CATEGORIES = [
  { title: "Ordering", icon: HelpCircle, description: "How to place an order, payment methods, and technical issues." },
  { title: "Delivery", icon: HelpCircle, description: "Shipping timelines, tracking your order, and delivery fees." },
  { title: "Returns", icon: HelpCircle, description: "Our refund policy, reporting damaged items, and returns." },
];

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-24 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-inter tracking-tight mb-4 text-foreground">How can we help?</h1>
        <p className="text-muted-foreground mb-8">Find answers to frequently asked questions or contact our support team.</p>
        
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search help articles..." 
            className="w-full pl-12 pr-4 py-4 rounded-full border shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {HELP_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <div key={cat.title} className="p-6 border rounded-3xl bg-card hover:shadow-md transition-shadow group cursor-pointer">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">{cat.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{cat.description}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-primary rounded-[2.5rem] p-10 text-primary-foreground">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl font-bold">Still need help?</h2>
            <p className="text-primary-foreground/80">Our support team is available 24/7 to assist you with any questions or concerns you might have.</p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center"><Phone className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-primary-foreground/60 uppercase font-black tracking-widest">Call us</p>
                  <p className="font-bold">+91 1800-SECURE</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center"><Mail className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-primary-foreground/60 uppercase font-black tracking-widest">Email us</p>
                  <p className="font-bold">support@securemarket.in</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="w-full max-w-xs bg-white text-foreground p-8 rounded-3xl shadow-2xl">
            <h3 className="font-bold mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" /> Send us a message</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Your Name" className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-primary/20 bg-muted/20" />
              <textarea placeholder="How can we help?" rows={3} className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-primary/20 bg-muted/20 resize-none"></textarea>
              <button className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:shadow-lg transition-all">Submit Request</button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12 text-center text-sm text-muted-foreground">
        <Link href="/" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
          Back to Home <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
