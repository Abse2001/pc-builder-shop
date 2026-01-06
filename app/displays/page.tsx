"use client"

import { useState, useEffect } from "react"
import { ProductCard } from "@/components/product-card"
import { ProductFilters } from "@/components/product-filters"
import { Button } from "@/components/ui/button"
import { SlidersHorizontal } from "lucide-react"

interface Product {
  id: string | number
  name: string
  brand: string
  price: number
  description?: string
  image_url?: string
  stock: number
  category: string
  subcategory?: string
}

export default function DisplaysPage() {
  const [displays, setDisplays] = useState<Product[]>([])
  const [filteredDisplays, setFilteredDisplays] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDisplays = async () => {
      console.log("Displays page: fetching displays")
      try {
        const response = await fetch(`/api/products?t=${Date.now()}`)
        const products = await response.json()
        console.log("Displays page: received", products.length, "total products")
        const displayProducts = products.filter((p: Product) => p.category === "displays")
        console.log("Displays page: filtered to", displayProducts.length, "display products")
        console.log("Display products:", displayProducts.map((p: any) => ({ id: p.id, name: p.name, image_url: p.image_url, hasImage: !!p.image_url })))
        setDisplays(displayProducts)
        setFilteredDisplays(displayProducts)
      } catch (error) {
        console.error("Failed to fetch displays:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDisplays()
  }, [])

  // Calculate brands dynamically from all displays (not filtered)
  const brands = displays.reduce((acc: any[], product) => {
    // Extract brand from name if brand field is missing
    const brand = product.brand || product.name.split(' ')[0]
    if (!brand) return acc
    const brandValue = brand.toLowerCase()
    const existingBrand = acc.find(b => b.value === brandValue)
    if (existingBrand) {
      existingBrand.count++
    } else {
      acc.push({
        label: brand,
        value: brandValue,
        count: 1
      })
    }
    return acc
  }, [])

  // Calculate price range
  const prices = displays.map(d => d.price)
  const priceRange: [number, number] = prices.length > 0 ? [Math.min(...prices), Math.max(...prices)] : [0, 2000]

  // Handle filter application
  const handleApplyFilters = (filters: {
    selectedBrands: string[]
    priceRange: [number, number]
    inStockOnly: boolean
  }) => {
    let filtered = displays

    // Filter by brands
    if (filters.selectedBrands.length > 0) {
      filtered = filtered.filter(display => {
        const brand = display.brand || display.name.split(' ')[0]
        return filters.selectedBrands.includes(brand.toLowerCase())
      })
    }

    // Filter by price range
    filtered = filtered.filter(display =>
      display.price >= filters.priceRange[0] && display.price <= filters.priceRange[1]
    )

    // Filter by stock
    if (filters.inStockOnly) {
      filtered = filtered.filter(display => display.stock > 0)
    }

    setFilteredDisplays(filtered)
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="font-bold text-3xl sm:text-4xl mb-2">Displays</h1>
            <p className="text-muted-foreground">High-performance monitors for gaming and productivity</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="font-bold text-3xl sm:text-4xl mb-2">Displays</h1>
          <p className="text-muted-foreground">High-performance monitors for gaming and productivity</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">{filteredDisplays.length} products</p>
          <Button variant="outline" size="sm" className="lg:hidden bg-transparent">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="hidden lg:block">
            <ProductFilters brands={brands} priceRange={priceRange} onApply={handleApplyFilters} />
          </aside>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDisplays.map((display) => (
                <ProductCard
                  key={display.id}
                  id={String(display.id)}
                  name={display.name}
                  brand={display.brand || display.name.split(' ')[0]}
                  price={display.price}
                  rating={4.5}
                  specs={display.description ? [display.description.substring(0, 50) + "..."] : []}
                  inStock={display.stock > 0}
                  image={display.image_url}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
