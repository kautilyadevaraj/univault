import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET() {
  const token = (await cookies()).get("univault_token")?.value;

  if (!token) {
    return Response.json({ isAuthenticated: false });
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );

    return Response.json({
      isAuthenticated: true,
      user: {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      },
    });
  } catch (err) {
    console.error("Invalid token:", err);
    return Response.json({ isAuthenticated: false });
  }
}
