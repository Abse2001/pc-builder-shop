import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import { verifyToken } from "@/lib/auth/user-service"
import { canAccessAdmin } from "@/lib/auth/types"

const productsFile = path.join(process.cwd(), "database", "products.json")

// Helper function to check admin access
function checkAdminAccess(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return false
  }

  const user = verifyToken(token)
  return user && canAccessAdmin(user.role)
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user has admin access
    const hasAccess = checkAdminAccess(request)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extract ID from URL path as fallback since params might be empty
    const url = new URL(request.url)
    const idFromPath = url.pathname.split('/').pop()
    const { id: idFromParams } = params

    const id = idFromParams || idFromPath

    if (!id) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 })
    }

    // Read existing products
    let products: any[] = []
    try {
      const data = await fs.readFile(productsFile, "utf-8")
      products = JSON.parse(data)
    } catch (error) {
      return NextResponse.json({ error: "Products not found" }, { status: 404 })
    }

    // Find and remove product
    const productIndex = products.findIndex((p) => String(p.id) === id)
    if (productIndex === -1) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    products.splice(productIndex, 1)

    // Write back to file
    await fs.writeFile(productsFile, JSON.stringify(products, null, 2))

    // Small delay to ensure file write is complete
    await new Promise(resolve => setTimeout(resolve, 100))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Product delete error:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}