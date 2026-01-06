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

export default function PartsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProducts = async () => {
    try {
      const response = await apiRequest(`/api/products?t=${Date.now()}`)
      const data = await response.json()
      // Filter for parts category and sort by newest first
      const filteredProducts = data
        .filter((p: Product) => p.category === "parts")
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
          <h1 className="text-3xl font-bold">PC Parts</h1>
          <p className="text-muted-foreground">Manage PC component products</p>
        </div>
        <ProductDialog category="parts" onSuccess={handleProductUpdate} />
      </div>

      <ProductTable products={products || []} onRefresh={fetchProducts} />
    </div>
  )
}
