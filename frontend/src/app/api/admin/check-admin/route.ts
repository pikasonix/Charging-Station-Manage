import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

  const API_HOST = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const res = await fetch(`${API_HOST}/api/v1/admin/check?userId=${userId}`);
    const data = await res.json();

    return NextResponse.json(data);
  } catch (err) {
    console.error("Error checking admin:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
