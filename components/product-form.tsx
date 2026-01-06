"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { apiRequest } from "@/lib/api-client"

interface Product {
  id?: string
  name: string
  description: string | null
  price: number
  category: "displays" | "peripherals" | "parts"
  subcategory: string | null
  image_url: string | null
  stock: number
  specs: Record<string, string> | null
  created_at?: string
}

interface ProductFormProps {
  product?: Product
  category?: string
  onSuccess?: () => void
}

export function ProductForm({ product, category, onSuccess }: ProductFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<Product>({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || 0,
    category: (product?.category || category || "parts") as "displays" | "peripherals" | "parts",
    subcategory: product?.subcategory || "",
    image_url: product?.image_url || "",
    stock: product?.stock || 0,
    specs: product?.specs || {},
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [specsText, setSpecsText] = useState(product?.specs ? JSON.stringify(product.specs, null, 2) : "{}")

  const subcategoryOptions = {
    displays: ["Gaming Monitors", "Ultrawide", "Office"],
    peripherals: ["Mice", "Keyboards", "Headsets"],
    parts: ["CPUs", "Motherboards", "GPUs", "RAM", "Storage", "Cases", "Power Supplies", "Cooling"]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Parse specs JSON
      let specs = {}
      try {
        specs = JSON.parse(specsText)
      } catch {
        throw new Error("Invalid JSON in specs field")
      }

      // If uploading a file, don't include image_url in the data (let API handle it)
      const { image_url, ...productDataWithoutImage } = formData
      const productData = selectedFile
        ? {
            ...productDataWithoutImage,
            specs,
            price: Number(formData.price),
            stock: Number(formData.stock),
            ...(product?.id ? { id: product.id } : { id: Date.now().toString() }),
            created_at: product?.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        : {
            ...formData,
            specs,
            price: Number(formData.price),
            stock: Number(formData.stock),
            ...(product?.id ? { id: product.id } : { id: Date.now().toString() }),
            created_at: product?.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

      let response: Response

      // If there's a file selected, use FormData
      if (selectedFile) {
        const formDataToSend = new FormData()

        // Add all product data
        Object.entries(productData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formDataToSend.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
          }
        })

        // Add the file
        formDataToSend.append('image', selectedFile)

        response = await apiRequest("/api/products", {
          method: product?.id ? "PUT" : "POST",
          body: formDataToSend,
        })
      } else {
        // Use JSON for requests without files
        response = await apiRequest("/api/products", {
          method: product?.id ? "PUT" : "POST",
          body: JSON.stringify(productData),
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save product")
      }

      // Reset file selection on success
      setSelectedFile(null)

      if (onSuccess) {
        // If we have an onSuccess callback (dialog mode), just call it
        await onSuccess()
      } else {
        // If no callback (page mode), navigate to the category page
        router.push(`/admin/products/${formData.category}`)
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value: "displays" | "peripherals" | "parts") =>
              setFormData({ ...formData, category: value })
            }
          >
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="displays">Displays</SelectItem>
              <SelectItem value="peripherals">Peripherals</SelectItem>
              <SelectItem value="parts">PC Parts</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subcategory">Subcategory</Label>
          <Select
            value={formData.subcategory || ""}
            onValueChange={(value: string) => setFormData({ ...formData, subcategory: value })}
          >
            <SelectTrigger id="subcategory">
              <SelectValue placeholder="Select subcategory" />
            </SelectTrigger>
            <SelectContent>
              {(subcategoryOptions[formData.category as keyof typeof subcategoryOptions] || []).map((subcat) => (
                <SelectItem key={subcat} value={subcat}>
                  {subcat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price ($) *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            required
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock">Stock *</Label>
          <Input
            id="stock"
            type="number"
            required
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="image_url">Image URL</Label>
          <Input
            id="image_url"
            value={formData.image_url || ""}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="image">Upload Image</Label>
          <Input
            id="image"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              setSelectedFile(file || null)
              // Clear URL field if file is selected
              if (file) {
                setFormData({ ...formData, image_url: "" })
              }
            }}
          />
          {selectedFile && (
            <p className="text-sm text-muted-foreground">
              Selected: {selectedFile.name}
            </p>
          )}
          {formData.image_url && !selectedFile && (
            <p className="text-sm text-muted-foreground">
              Current image: {formData.image_url}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={3}
          value={formData.description || ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="specs">Specifications (JSON)</Label>
        <Textarea
          id="specs"
          rows={6}
          value={specsText}
          onChange={(e) => setSpecsText(e.target.value)}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">Enter specifications in JSON format</p>
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : product ? "Update Product" : "Create Product"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
