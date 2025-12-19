import { NextResponse, NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    // Only protect /api routes
    if (request.nextUrl.pathname.startsWith("/api")) {
        const apiKey = request.headers.get("x-api-key");
        const secret = process.env.API_SECRET;

        // If the key is missing or doesn"t match, return 401 Unauthorized
        if (!apiKey || apiKey !== secret) {
            return NextResponse.json(
                { error: "Unauthorized: Invalid or missing API Key" },
                { status: 401 }
            );
        }
    }

    return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
    matcher: "/api/:path*",
};
