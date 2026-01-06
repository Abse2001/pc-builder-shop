"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, ShieldX } from "lucide-react"
import Link from "next/link"
import { ProductTable } from "@/components/product-table"
import { ProductDialog } from "@/components/product-dialog"
import { useAdminAccess } from "@/lib/hooks/use-admin-access"
import { apiRequest } from "@/lib/api-client"

interface Product {
  id: string | number
  name: string
  description: string | null
  price: number
  category: string
  subcategory: string | null
  stock: number
  image_url?: string
  created_at?: string
}

export default function PeripheralsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { isAuthorized, checkingAccess } = useAdminAccess()

  const fetchProducts = async () => {
    try {
      const response = await apiRequest(`/api/products?t=${Date.now()}`)
      const data = await response.json()
      // Filter for peripherals category and sort by newest first
      const filteredProducts = data
        .filter((p: Product) => p.category === "peripherals")
        .sort((a: any, b: any) => {
          if (a.created_at && b.created_at) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          }
          return 0
        })
      setProducts(filteredProducts)
    } catch (error) {
      console.error("Products fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleProductUpdate = async () => {
    await fetchProducts() // Re-fetch products after update
  }

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

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Peripherals</h1>
          <p className="text-muted-foreground">Manage peripheral products</p>
        </div>
        <ProductDialog category="peripherals" onSuccess={handleProductUpdate} />
      </div>

      <ProductTable products={products || []} onRefresh={fetchProducts} />
    </div>
  )
}
