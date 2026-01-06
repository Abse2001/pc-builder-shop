"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCart } from "@/lib/cart-context"
import { useRouter } from "next/navigation"
import { apiRequest } from "@/lib/api-client"
import {
  Cpu,
  HardDrive,
  MemoryStick,
  Cpu as Gpu,
  Box,
  Power,
  CircuitBoard,
  Fan,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"

type Product = {
  id: string | number
  name: string
  brand: string
  price: number
  description?: string
  image_url?: string
  stock: number
  category: string
  subcategory?: string
  specs?: any
}

type ComponentCategory = {
  id: string
  name: string
  icon: React.ElementType
  required: boolean
  items: Product[]
}

// Category definitions with icons
const categoryDefinitions: Record<string, { name: string; icon: React.ElementType; required: boolean }> = {
  displays: { name: "Display", icon: CircuitBoard, required: false },
  peripherals: { name: "Peripherals", icon: CircuitBoard, required: false },
  "parts-cpus": { name: "CPU", icon: Cpu, required: true },
  "parts-motherboards": { name: "Motherboard", icon: CircuitBoard, required: true },
  "parts-gpus": { name: "Graphics Card", icon: Gpu, required: true },
  "parts-ram": { name: "Memory", icon: MemoryStick, required: true },
  "parts-storage": { name: "Storage", icon: HardDrive, required: true },
  "parts-psu": { name: "Power Supply", icon: Power, required: true },
  "parts-cooling": { name: "CPU Cooler", icon: Fan, required: false },
}

export default function PCBuilder() {
  const [selectedComponents, setSelectedComponents] = useState<Record<string, Product>>({})
  const [components, setComponents] = useState<ComponentCategory[]>([])
  const [loading, setLoading] = useState(true)
  const { addItem } = useCart()
  const router = useRouter()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await apiRequest("/api/products?t=" + Date.now())
        const products: Product[] = await response.json()

        // Group products by category and subcategory
        const categoryMap: Record<string, Product[]> = {}

        products.forEach(product => {
          let categoryKey = product.category

          // Split parts into subcategories
          if (product.category === "parts" && product.subcategory) {
            categoryKey = `parts-${product.subcategory.toLowerCase().replace(/\s+/g, '')}`
          }

          if (!categoryMap[categoryKey]) {
            categoryMap[categoryKey] = []
          }
          categoryMap[categoryKey].push(product)
        })

        // Convert to ComponentCategory format
        const componentCategories: ComponentCategory[] = Object.entries(categoryMap)
          .filter(([categoryId]) => categoryDefinitions[categoryId]) // Only include defined categories
          .map(([categoryId, products]) => {
            const definition = categoryDefinitions[categoryId]

            return {
              id: categoryId,
              name: definition.name,
              icon: definition.icon,
              required: definition.required,
              items: products
            }
          })
          .sort((a, b) => {
            // Sort by required first, then by name
            if (a.required && !b.required) return -1
            if (!a.required && b.required) return 1
            return a.name.localeCompare(b.name)
          })

        setComponents(componentCategories)
      } catch (error) {
        console.error("Failed to fetch products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const compatibilityIssues = useMemo(() => {
    const issues: string[] = []
    const cpu = selectedComponents["parts-cpus"]
    const motherboard = selectedComponents["parts-motherboards"]
    const gpu = selectedComponents["parts-gpus"]
    const ram = selectedComponents["parts-ram"]
    const storage = selectedComponents["parts-storage"]
    const psu = selectedComponents["parts-psu"]
    const cooler = selectedComponents["parts-cooling"]

    // Check CPU socket compatibility with motherboard
    if (cpu && motherboard) {
      const cpuSocket = cpu.specs?.socket || cpu.specs?.cpu_socket
      const mbSocket = motherboard.specs?.socket || motherboard.specs?.cpu_socket
      if (cpuSocket && mbSocket && cpuSocket !== mbSocket) {
        issues.push(`CPU socket (${cpuSocket}) incompatible with motherboard (${mbSocket})`)
      }
    }

    // Check RAM compatibility
    if (ram && motherboard) {
      const ramType = ram.specs?.type || ram.specs?.memory_type
      const mbRamType = motherboard.specs?.memory_type || motherboard.specs?.ram_type
      if (ramType && mbRamType && !mbRamType.toLowerCase().includes(ramType.toLowerCase().replace('ddr', ''))) {
        issues.push(`RAM type (${ramType}) may not be compatible with motherboard`)
      }
    }

    // Check power supply wattage
    if (cpu && gpu && psu) {
      const cpuTdp = cpu.specs?.tdp || cpu.specs?.power_consumption || 65
      const gpuTdp = gpu.specs?.tdp || gpu.specs?.power_consumption || 150
      const totalTDP = cpuTdp + gpuTdp + 100 // +100 for other components
      const psuWattage = psu.specs?.wattage || psu.specs?.power || 500

      if (totalTDP > psuWattage * 0.8) {
        issues.push(`PSU may be underpowered. Estimated TDP: ${totalTDP}W, PSU: ${psuWattage}W`)
      }
    }

    // Check cooler compatibility
    if (cpu && cooler) {
      const cpuTdp = cpu.specs?.tdp || cpu.specs?.power_consumption || 65
      const coolerTdp = cooler.specs?.tdp || cooler.specs?.cooling_power || 150
      if (cpuTdp > coolerTdp) {
        issues.push(`CPU cooler may not handle CPU TDP (${cpuTdp}W vs ${coolerTdp}W)`)
      }
    }

    return issues
  }, [selectedComponents])

  const totalPrice = useMemo(() => {
    return Object.values(selectedComponents).reduce((sum, component) => sum + component.price, 0)
  }, [selectedComponents])

  const handleSelectComponent = (categoryId: string, component: Product) => {
    setSelectedComponents((prev) => ({
      ...prev,
      [categoryId]: component,
    }))
  }

  const handleRemoveComponent = (categoryId: string) => {
    setSelectedComponents((prev) => {
      const updated = { ...prev }
      delete updated[categoryId]
      return updated
    })
  }

  const selectedCount = Object.keys(selectedComponents).length
  const requiredComponents = components.filter(c => c.required)
  const requiredSelected = requiredComponents.filter(c => selectedComponents[c.id]).length
  const isComplete = requiredSelected === requiredComponents.length

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="text-center space-y-4">
            <h1 className="font-bold text-4xl sm:text-5xl lg:text-6xl text-balance">Build Your Dream PC</h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              Configure the perfect computer with real-time compatibility checking and pricing
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {compatibilityIssues.length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-1">Compatibility Issues:</div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {compatibilityIssues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Component Selection */}
          <div className="lg:col-span-2 space-y-6">
            {components.map((category) => {
              const Icon = category.icon
              const selected = selectedComponents[category.id]

              return (
                <Card key={category.id} className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-lg">{category.name}</h2>
                        {category.required && (
                          <Badge variant="outline" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      {selected && <p className="text-sm text-muted-foreground">{selected.name}</p>}
                    </div>
                    {selected && (
                      <Badge className="ml-auto" variant="secondary">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Selected
                      </Badge>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {category.items.map((item) => {
                      const isSelected = selected?.id === item.id

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectComponent(category.id, item)}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50 hover:bg-accent"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-muted-foreground">{item.brand}</div>
                             <div className="text-sm text-muted-foreground">{item.description || 'No description available'}</div>
                            <div className="text-lg font-semibold text-primary pt-1">${item.price}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="p-6">
                <h2 className="font-semibold text-xl mb-4">Your Build</h2>

                <div className="space-y-3 mb-6">
                  {components.map((category) => {
                    const selected = selectedComponents[category.id]
                    const Icon = category.icon

                    return (
                      <div key={category.id} className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          {selected ? (
                            <>
                              <div className="text-sm font-medium truncate">{selected.name}</div>
                              <div className="text-xs text-muted-foreground">${selected.price}</div>
                            </>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              {category.required ? "Required" : "Optional"} - {category.name.toLowerCase()}
                            </div>
                          )}
                        </div>
                        {selected && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveComponent(category.id)}
                            className="h-8 w-8 p-0"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="border-t border-border pt-4 space-y-4">
                   <div className="space-y-2">
                     <div className="flex items-center justify-between text-sm">
                       <span className="text-muted-foreground">
                         Required ({requiredSelected}/{requiredComponents.length})
                       </span>
                       <span className="font-medium">{Math.round((requiredSelected / requiredComponents.length) * 100)}%</span>
                     </div>
                     <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                       <div
                         className="h-full bg-primary transition-all"
                         style={{ width: `${(requiredSelected / requiredComponents.length) * 100}%` }}
                       />
                     </div>
                   </div>

                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold text-lg">Total</span>
                    <span className="font-bold text-3xl">${totalPrice.toLocaleString()}</span>
                  </div>

                   <Button
                      className="w-full"
                      size="lg"
                      disabled={!isComplete || compatibilityIssues.length > 0}
                       onClick={async () => {
                         // Add items sequentially to avoid race conditions
                         for (const component of Object.values(selectedComponents)) {
                           await addItem({
                             id: component.id.toString(),
                             name: component.name,
                             brand: component.brand,
                             price: component.price,
                             image: component.image_url,
                           })
                         }
                         router.push("/checkout")
                       }}
                    >
                      {!isComplete
                        ? "Select All Required Parts"
                        : compatibilityIssues.length > 0
                          ? "Fix Compatibility Issues"
                          : "Add Build to Cart"}
                    </Button>

                    {isComplete && compatibilityIssues.length === 0 && (
                      <div className="text-xs text-center text-muted-foreground">Build is complete and compatible! Ready to add to cart.</div>
                    )}

                    {compatibilityIssues.length > 0 && (
                      <div className="text-xs text-center text-orange-600">⚠️ {compatibilityIssues.length} compatibility issue(s) detected</div>
                    )}
                </div>
              </Card>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Card className="p-4">
                  <div className="text-2xl font-bold">{selectedCount}</div>
                  <div className="text-xs text-muted-foreground">Parts Selected</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold">
                    {requiredComponents.length > 0 ? `${Math.round((requiredSelected / requiredComponents.length) * 100)}%` : "0%"}
                  </div>
                  <div className="text-xs text-muted-foreground">Complete</div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
