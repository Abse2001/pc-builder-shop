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


const brands = [
  { label: "Logitech", value: "logitech", count: 15 },
  { label: "Razer", value: "razer", count: 18 },
  { label: "Corsair", value: "corsair", count: 12 },
  { label: "SteelSeries", value: "steelseries", count: 10 },
  { label: "HyperX", value: "hyperx", count: 8 },
]

export default function PeripheralsPage() {
  const [peripherals, setPeripherals] = useState<Product[]>([])
  const [filteredPeripherals, setFilteredPeripherals] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    const fetchPeripherals = async () => {
      try {
        const response = await fetch(`/api/products?t=${Date.now()}`)
        const products = await response.json()
        const peripheralsProducts = products.filter((p: Product) => p.category === "peripherals")
        setPeripherals(peripheralsProducts)
        setFilteredPeripherals(peripheralsProducts)
      } catch (error) {
        console.error("Failed to fetch peripherals:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPeripherals()
  }, [])

  // Handle filter application
  const handleApplyFilters = (filters: {
    selectedBrands: string[]
    priceRange: [number, number]
    inStockOnly: boolean
  }) => {
    let filtered = peripherals

    // Apply tab filtering first
    if (activeTab !== "all") {
      filtered = filtered.filter(peripheral => {
        const subcategory = peripheral.subcategory?.toLowerCase()
        switch (activeTab) {
          case "mice": return subcategory?.includes("mice")
          case "keyboards": return subcategory?.includes("keyboard")
          case "headsets": return subcategory?.includes("headset")
          default: return true
        }
      })
    }

    // Filter by brands
    if (filters.selectedBrands.length > 0) {
      filtered = filtered.filter(peripheral => {
        const brand = peripheral.brand || peripheral.name.split(' ')[0]
        return filters.selectedBrands.includes(brand.toLowerCase())
      })
    }

    // Filter by price range
    filtered = filtered.filter(peripheral =>
      peripheral.price >= filters.priceRange[0] && peripheral.price <= filters.priceRange[1]
    )

    // Filter by stock
    if (filters.inStockOnly) {
      filtered = filtered.filter(peripheral => peripheral.stock > 0)
    }

    setFilteredPeripherals(filtered)
  }

  // Update filtered peripherals when tab changes
  useEffect(() => {
    let filtered = peripherals

    // Apply tab filtering
    if (activeTab !== "all") {
      filtered = filtered.filter(peripheral => {
        const subcategory = peripheral.subcategory?.toLowerCase()
        switch (activeTab) {
          case "mice": return subcategory?.includes("mice")
          case "keyboards": return subcategory?.includes("keyboard")
          case "headsets": return subcategory?.includes("headset")
          default: return true
        }
      })
    }

    setFilteredPeripherals(filtered)
  }, [activeTab, peripherals])

  // Calculate brands dynamically
  const brands = peripherals.reduce((acc: any[], product) => {
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
  const prices = peripherals.map(p => p.price)
  const priceRange: [number, number] = prices.length > 0 ? [Math.min(...prices), Math.max(...prices)] : [0, 500]

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="font-bold text-3xl sm:text-4xl mb-2">Peripherals</h1>
            <p className="text-muted-foreground">Premium gaming and professional peripherals</p>
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
          <h1 className="font-bold text-3xl sm:text-4xl mb-2">Peripherals</h1>
          <p className="text-muted-foreground">Premium gaming and professional peripherals</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="mice">Mice</TabsTrigger>
            <TabsTrigger value="keyboards">Keyboards</TabsTrigger>
            <TabsTrigger value="headsets">Headsets</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">{filteredPeripherals.length} products</p>
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
              {filteredPeripherals.map((peripheral) => (
                <ProductCard
                  key={peripheral.id}
                  id={String(peripheral.id)}
                  name={peripheral.name}
                  brand={peripheral.brand || peripheral.name.split(' ')[0]}
                  price={peripheral.price}
                  rating={4.5}
                  specs={peripheral.description ? [peripheral.description.substring(0, 50) + "..."] : []}
                  inStock={peripheral.stock > 0}
                  image={peripheral.image_url}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
