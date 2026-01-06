"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingCart, Monitor, Keyboard, Truck, Users, ShieldX } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminAccess } from "@/lib/hooks/use-admin-access"
import { apiRequest } from "@/lib/api-client"

interface CategoryStats {
  displays: number
  peripherals: number
  parts: number
}

export default function AdminPage() {
  const [stats, setStats] = useState<CategoryStats>({ displays: 0, peripherals: 0, parts: 0 })
  const [loading, setLoading] = useState(true)
  const { isAuthorized, checkingAccess, userRole } = useAdminAccess()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiRequest("/api/products?t=" + Date.now())
        const products = await response.json()

        const categoryCount = products.reduce((acc: CategoryStats, product: any) => {
          if (product.category === 'displays') acc.displays++
          else if (product.category === 'peripherals') acc.peripherals++
          else if (product.category === 'parts') acc.parts++
          return acc
        }, { displays: 0, peripherals: 0, parts: 0 })

        setStats(categoryCount)
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const categories = [
    {
      name: "displays",
      label: "Displays",
      icon: Monitor,
      count: stats.displays,
      description: "Monitors and display products"
    },
    {
      name: "peripherals",
      label: "Peripherals",
      icon: Keyboard,
      count: stats.peripherals,
      description: "Keyboards, mice, and accessories"
    },
    {
      name: "parts",
      label: "PC Parts",
      icon: ShoppingCart,
      count: stats.parts,
      description: "Components and hardware"
    }
  ]

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your store's products and orders</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Orders Management - For Managers and Admins */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Order Management</CardTitle>
                <CardDescription>Process and track customer orders</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" size="lg">
              <Link href="/admin/orders">
                <Truck className="mr-2 h-4 w-4" />
                Manage Orders
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* User Management - Only for Admins */}
        {userRole === 'admin' && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">User Management</CardTitle>
                  <CardDescription>Manage users, managers, and admins</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full" size="lg">
                <Link href="/admin/users">
                  Manage Users
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Product Categories */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Product Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const Icon = category.icon
            if (checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <ShieldX className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-red-600 dark:text-red-400">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push("/")} className="w-full">
              Go to Home Page
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
              <Card key={category.name} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle>{category.label}</CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {loading ? "..." : category.count}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/admin/products/${category.name}`}>
                      Manage {category.label}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
        </div>
      </div>
  )
}
