"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Package, Monitor, Mouse, Cpu, LogOut, Wrench, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { apiRequest } from "@/lib/api-client"

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "All Products", icon: Package },
  { href: "/admin/products/displays", label: "Displays", icon: Monitor },
  { href: "/admin/products/peripherals", label: "Peripherals", icon: Mouse },
  { href: "/admin/products/parts", label: "PC Parts", icon: Cpu },
]

const shopNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/builder", label: "PC Builder", icon: Wrench },
  { href: "/displays", label: "Shop Displays", icon: Monitor },
  { href: "/peripherals", label: "Shop Peripherals", icon: Mouse },
  { href: "/parts", label: "Shop Parts", icon: Cpu },
]

export function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      // Call logout API to clear server-side session if needed
      await apiRequest("/api/auth", {
        method: "POST",
        body: JSON.stringify({ action: "logout" }),
      })
    } catch (error) {
      console.error("Logout error:", error)
    }

    // Clear localStorage token
    localStorage.removeItem("auth-token")
    router.push("/")
    router.refresh()
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/30">
      <div className="border-b p-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">PC</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Admin Panel</h2>
            <p className="text-xs text-muted-foreground">BuildMart</p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        <div className="mb-2">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Admin</p>
          {adminNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>

        <Separator className="my-4" />

        <div>
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Shop</p>
          {shopNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
      <div className="border-t p-4">
        <Button onClick={handleLogout} variant="ghost" className="w-full justify-start gap-3">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}
