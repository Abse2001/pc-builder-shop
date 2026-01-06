"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { ProductTable } from "@/components/product-table"
import { ProductDialog } from "@/components/product-dialog"
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

export default function AllProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProducts = async () => {
    console.log("Admin page: fetchProducts called")
    try {
      const response = await apiRequest(`/api/products?t=${Date.now()}`)
      const data = await response.json()
      console.log("Admin page: received", data.length, "products")
      // Sort by newest first
      const sortedProducts = data.sort((a: any, b: any) => {
        if (a.created_at && b.created_at) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
        return 0
      })
      console.log("Admin page: setting products state")
      setProducts(sortedProducts)
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
    console.log("Admin page: handleProductUpdate called")
    await fetchProducts() // Re-fetch products after update
    console.log("Admin page: fetchProducts completed")
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">All Products</h1>
          <p className="text-muted-foreground">Manage all products across categories</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <ProductTable products={products || []} onRefresh={fetchProducts} />
    </div>
  )
}
