import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import { writeFile } from "fs/promises"
import { verifyToken } from '@/lib/auth/user-service'
import { canAccessAdmin } from '@/lib/auth/types'

export const dynamic = 'force-dynamic'

const productsFile = path.join(process.cwd(), "database", "products.json")
const uploadsDir = path.join(process.cwd(), "public", "uploads")

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

// Helper function to save uploaded file
async function saveUploadedFile(file: File, filename: string): Promise<string> {
  console.log("Saving uploaded file:", filename)
  const buffer = Buffer.from(await file.arrayBuffer())
  const filepath = path.join(uploadsDir, filename)

  // Ensure uploads directory exists
  await fs.mkdir(uploadsDir, { recursive: true })

  await writeFile(filepath, buffer)
  console.log("File written to:", filepath)

  // Delay to ensure file system operation is complete
  await new Promise(resolve => setTimeout(resolve, 500))
  console.log("Delay complete, verifying file...")

  // Verify file was written
  try {
    await fs.access(filepath)
    console.log("File verification successful")
  } catch (error) {
    console.log("File verification failed:", error)
    throw new Error(`Failed to save file: ${filename}`)
  }

  const url = `/api/uploads?f=${encodeURIComponent(filename)}`
  console.log("Returning image URL:", url)
  return url
}

export async function GET(request: NextRequest) {
  console.log("GET /api/products called at", new Date().toISOString())
  try {
    const data = await fs.readFile(productsFile, "utf-8")
    const products = JSON.parse(data)
    console.log(`Returning ${products.length} products`)
    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error("Products fetch error:", error)
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user has admin access
    const hasAccess = checkAdminAccess(request)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let newProduct: any

    // Check if request has files (FormData)
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()

      // Parse JSON fields
      newProduct = {
        name: formData.get('name'),
        description: formData.get('description'),
        price: parseFloat(formData.get('price') as string),
        category: formData.get('category'),
        subcategory: formData.get('subcategory'),
        stock: parseInt(formData.get('stock') as string),
        specs: formData.get('specs') ? JSON.parse(formData.get('specs') as string) : {},
      }

      // Handle file upload
      const imageFile = formData.get('image') as File
      if (imageFile && imageFile.size > 0) {
        const filename = `${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        newProduct.image_url = await saveUploadedFile(imageFile, filename)
      }
    } else {
      // JSON request
      newProduct = await request.json()
    }

    // Validate required fields
    if (!newProduct.name || !newProduct.category || newProduct.price === undefined || newProduct.stock === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Read existing products
    let products: any[] = []
    try {
      const data = await fs.readFile(productsFile, "utf-8")
      products = JSON.parse(data)
    } catch (error) {
      // File doesn't exist or empty, start with empty array
      products = []
    }

    // Add new product
    products.push(newProduct)

    // Write back to file
    await fs.writeFile(productsFile, JSON.stringify(products, null, 2))

    // Small delay to ensure file write is complete
    await new Promise(resolve => setTimeout(resolve, 100))

    return NextResponse.json(newProduct, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error("Product creation error:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  console.log("PUT /api/products called at", new Date().toISOString())
  try {
    // Check if user has admin access
    const hasAccess = checkAdminAccess(request)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let updatedProduct: any

    // Check if request has files (FormData)
    const contentType = request.headers.get('content-type') || ''
    console.log("Content-Type:", contentType)
    if (contentType.includes('multipart/form-data')) {
      console.log("Processing FormData request")
      const formData = await request.formData()

      // Parse JSON fields
      updatedProduct = {
        id: formData.get('id'),
        name: formData.get('name'),
        description: formData.get('description'),
        price: parseFloat(formData.get('price') as string),
        category: formData.get('category'),
        subcategory: formData.get('subcategory'),
        stock: parseInt(formData.get('stock') as string),
        specs: formData.get('specs') ? JSON.parse(formData.get('specs') as string) : {},
      }
      console.log("Parsed product data:", updatedProduct)

      // Handle file upload
      const imageFile = formData.get('image') as File
      if (imageFile && imageFile.size > 0) {
        console.log("Processing image upload:", imageFile.name, "size:", imageFile.size)
        const filename = `${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        updatedProduct.image_url = await saveUploadedFile(imageFile, filename)
        console.log("Image saved as:", updatedProduct.image_url)
      }
      // If no file uploaded, don't change image_url (remove it from updatedProduct if it exists)
      else {
        console.log("No image file uploaded")
        delete updatedProduct.image_url
      }
    } else {
      // JSON request
      updatedProduct = await request.json()
      console.log("Processing JSON request:", updatedProduct)
    }

    if (!updatedProduct.id) {
      console.log("Error: Product ID required")
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

    // Find and update product
    const productIndex = products.findIndex((p) => String(p.id) === String(updatedProduct.id))
    if (productIndex === -1) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    console.log("Updating product", products[productIndex].id, "with:", updatedProduct)
    products[productIndex] = { ...products[productIndex], ...updatedProduct, updated_at: new Date().toISOString() }
    console.log("Updated product:", products[productIndex])

    // Write back to file
    console.log("Writing to JSON file...")
    await fs.writeFile(productsFile, JSON.stringify(products, null, 2))

    // Small delay to ensure file write is complete
    await new Promise(resolve => setTimeout(resolve, 100))
    console.log("File write complete, returning updated product")

    return NextResponse.json(products[productIndex], {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error("Product update error:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check if user has admin access
    const hasAccess = checkAdminAccess(request)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const id = url.pathname.split('/').pop()

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
    console.error("Product deletion error:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}