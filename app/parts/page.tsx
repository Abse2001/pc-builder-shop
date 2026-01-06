"use client"

import { useState, useEffect } from "react"
import { ProductCard } from "@/components/product-card"
import { ProductFilters } from "@/components/product-filters"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

export default function PartsPage() {
  const [parts, setParts] = useState<Product[]>([])
  const [filteredParts, setFilteredParts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    const fetchParts = async () => {
      try {
        const response = await fetch(`/api/products?t=${Date.now()}`)
        const products = await response.json()
        const partsProducts = products.filter((p: Product) => p.category === "parts")
        setParts(partsProducts)
        setFilteredParts(partsProducts)
      } catch (error) {
        console.error("Failed to fetch parts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchParts()
  }, [])

  // Handle filter application
  const handleApplyFilters = (filters: {
    selectedBrands: string[]
    priceRange: [number, number]
    inStockOnly: boolean
  }) => {
    let filtered = parts

    // Apply tab filtering first
    if (activeTab !== "all") {
      filtered = filtered.filter(part => {
        const subcategory = part.subcategory?.toLowerCase()
        switch (activeTab) {
          case "cpu": return subcategory?.includes("cpu")
          case "gpu": return subcategory?.includes("gpu")
          case "ram": return subcategory?.includes("ram")
          case "storage": return subcategory?.includes("storage")
          case "motherboard": return subcategory?.includes("motherboard")
          default: return true
        }
      })
    }

    // Filter by brands
    if (filters.selectedBrands.length > 0) {
      filtered = filtered.filter(part => {
        const brand = part.brand || part.name.split(' ')[0]
        return filters.selectedBrands.includes(brand.toLowerCase())
      })
    }

    // Filter by price range
    filtered = filtered.filter(part =>
      part.price >= filters.priceRange[0] && part.price <= filters.priceRange[1]
    )

    // Filter by stock
    if (filters.inStockOnly) {
      filtered = filtered.filter(part => part.stock > 0)
    }

    setFilteredParts(filtered)
  }

  // Update filtered parts when tab changes
  useEffect(() => {
    let filtered = parts

    // Apply tab filtering
    if (activeTab !== "all") {
      filtered = filtered.filter(part => {
        const subcategory = part.subcategory?.toLowerCase()
        switch (activeTab) {
          case "cpu": return subcategory?.includes("cpu")
          case "gpu": return subcategory?.includes("gpu")
          case "ram": return subcategory?.includes("ram")
          case "storage": return subcategory?.includes("storage")
          case "motherboard": return subcategory?.includes("motherboard")
          default: return true
        }
      })
    }

    setFilteredParts(filtered)
  }, [activeTab, parts])

  // Calculate brands dynamically
  const brands = parts.reduce((acc: any[], product) => {
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
  const prices = parts.map(p => p.price)
  const priceRange: [number, number] = prices.length > 0 ? [Math.min(...prices), Math.max(...prices)] : [0, 2000]

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="font-bold text-3xl sm:text-4xl mb-2">PC Parts</h1>
            <p className="text-muted-foreground">Premium components for your custom build</p>
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
          <h1 className="font-bold text-3xl sm:text-4xl mb-2">PC Parts</h1>
          <p className="text-muted-foreground">Premium components for your custom build</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="cpu">CPUs</TabsTrigger>
            <TabsTrigger value="gpu">GPUs</TabsTrigger>
            <TabsTrigger value="ram">Memory</TabsTrigger>
            <TabsTrigger value="storage">Storage</TabsTrigger>
            <TabsTrigger value="motherboard">Motherboards</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">{filteredParts.length} products</p>
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
              {filteredParts.map((part) => (
                <ProductCard
                  key={part.id}
                  id={String(part.id)}
                  name={part.name}
                  brand={part.brand || part.name.split(' ')[0]}
                  price={part.price}
                  rating={4.5}
                  specs={part.description ? [part.description.substring(0, 50) + "..."] : []}
                  inStock={part.stock > 0}
                  image={part.image_url}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
