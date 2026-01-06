import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const filenameParam = searchParams.get('f')

  console.log("API /uploads called with URL:", request.url)
  console.log("Search params:", Object.fromEntries(searchParams.entries()))

  if (!filenameParam) {
    console.log("No filename parameter found")
    return NextResponse.json({ error: "No filename provided" }, { status: 400 })
  }

  // Remove any additional query parameters from filename
  const filename = filenameParam.split('?')[0]

  console.log("Serving image:", filename, "from param:", filenameParam)

  try {
    const imagePath = path.join(process.cwd(), "public", "uploads", filename)
    console.log("Image path:", imagePath)

    const imageBuffer = await fs.readFile(imagePath)
    console.log("Image loaded, size:", imageBuffer.length)

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    console.error("Error serving image:", error)
    return NextResponse.json({ error: "Image not found" }, { status: 404 })
  }
}