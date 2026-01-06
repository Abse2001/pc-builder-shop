"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"

type FilterOption = {
  label: string
  value: string
  count?: number
}

type ProductFiltersProps = {
  brands?: FilterOption[]
  priceRange?: [number, number]
  onApply?: (filters: {
    selectedBrands: string[]
    priceRange: [number, number]
    inStockOnly: boolean
  }) => void
}

export function ProductFilters({ brands = [], priceRange = [0, 2000], onApply }: ProductFiltersProps) {
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [currentPriceRange, setCurrentPriceRange] = useState<[number, number]>(priceRange)
  const [inStockOnly, setInStockOnly] = useState(true)

  const handleBrandChange = (brandValue: string, checked: boolean) => {
    if (checked) {
      setSelectedBrands(prev => [...prev, brandValue])
    } else {
      setSelectedBrands(prev => prev.filter(b => b !== brandValue))
    }
  }

  const handleApplyFilters = () => {
    onApply?.({
      selectedBrands,
      priceRange: currentPriceRange,
      inStockOnly
    })
  }

  return (
    <div className="space-y-6">
      {/* Price Filter */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Price Range</h3>
        <div className="space-y-4">
          <Slider
            value={currentPriceRange}
            max={priceRange[1]}
            min={priceRange[0]}
            step={50}
            onValueChange={(value) => setCurrentPriceRange(value as [number, number])}
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>${currentPriceRange[0]}</span>
            <span>${currentPriceRange[1]}</span>
          </div>
        </div>
      </Card>

      {/* Brand Filter */}
      {brands.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Brand</h3>
          <div className="space-y-3">
            {brands.map((brand) => (
              <div key={brand.value} className="flex items-center space-x-2">
                <Checkbox
                  id={brand.value}
                  checked={selectedBrands.includes(brand.value)}
                  onCheckedChange={(checked) => handleBrandChange(brand.value, checked as boolean)}
                />
                <Label
                  htmlFor={brand.value}
                  className="text-sm font-normal cursor-pointer flex items-center justify-between flex-1"
                >
                  <span>{brand.label}</span>
                  {brand.count && <span className="text-muted-foreground">({brand.count})</span>}
                </Label>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Availability */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Availability</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="in-stock"
              checked={inStockOnly}
              onCheckedChange={(checked) => setInStockOnly(checked as boolean)}
            />
            <Label htmlFor="in-stock" className="text-sm font-normal cursor-pointer">
              In Stock Only
            </Label>
          </div>
        </div>
      </Card>

      {/* Apply Button */}
      <Button onClick={handleApplyFilters} className="w-full">
        Apply Filters
      </Button>
    </div>
  )
}
