"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
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
}

interface ProductTableProps {
  products: Product[]
  onRefresh?: () => void
}

export function ProductTable({ products, onRefresh }: ProductTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    setDeletingId(id)

    try {
      const response = await apiRequest(`/api/products/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete product")
      }

      router.refresh()
    } catch (error) {
      alert("Failed to delete product")
    } finally {
      setDeletingId(null)
    }
  }

  const handleEditSuccess = async () => {
    // This will be called from the parent component to refresh the data
    if (onRefresh) {
      await onRefresh()
    } else {
      router.refresh()
    }
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Subcategory</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No products found
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="capitalize">{product.category}</TableCell>
                <TableCell>{product.subcategory || "-"}</TableCell>
                <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                <TableCell className="text-right">{product.stock}</TableCell>
                 <TableCell className="text-right">
                   <div className="flex justify-end gap-2">
                     <ProductDialog
                       product={product}
                       category={product.category}
                       onSuccess={handleEditSuccess}
                       trigger={
                         <Button size="sm" variant="outline">
                           <Pencil className="h-4 w-4" />
                         </Button>
                       }
                     />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(String(product.id))}
                      disabled={deletingId === product.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
