import Link from "next/link";
import { Leaf } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-card border-t py-12 mt-auto">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
              S
            </div>
            <span className="font-bold text-xl tracking-tight">Secure Market</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Fresh groceries, vegetables, and daily needs delivered safely to your doorstep.
          </p>
        </div>
        
        <div>
          <h3 className="font-semibold mb-4 text-foreground">Categories</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/?category=Fresh Vegetables" className="hover:text-primary transition-colors">Fresh Vegetables</Link></li>
            <li><Link href="/?category=Leafy Vegetables" className="hover:text-primary transition-colors">Leafy Vegetables</Link></li>
            <li><Link href="/?category=Groceries" className="hover:text-primary transition-colors">Groceries</Link></li>
            <li><Link href="/?category=Fruits" className="hover:text-primary transition-colors">Fresh Fruits</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-4 text-foreground">Customer Service</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/profile" className="hover:text-primary transition-colors">My Account</Link></li>
            <li><Link href="/track" className="hover:text-primary transition-colors">Track Order</Link></li>
            <li><Link href="/help" className="hover:text-primary transition-colors">Help & Support</Link></li>
            <li><Link href="/returns" className="hover:text-primary transition-colors">Returns & Refunds</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Quality Promise</h3>
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
             <div className="p-2 bg-primary/10 rounded-full text-primary">
               <Leaf className="w-5 h-5" />
             </div>
             <p>100% Quality Guaranteed. We partner directly with farms to ensure freshness.</p>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Secure Market. All rights reserved.</p>
        <div className="flex gap-4 mt-4 md:mt-0">
          <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-primary">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
