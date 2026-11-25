import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Prevent taking an email that belongs to another tenant
    if (normalizedEmail !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        return NextResponse.json({ error: "Email is already in use" }, { status: 409 });
      }
    }

    // Conditionally update password only if provided
    const updateData: { name: string; email: string; password?: string } = {
      name: name.trim(),
      email: normalizedEmail,
    };

    if (password && password.trim() !== "") {
      if (password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update the database
    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: updateData,
    });

    // Generate a fresh JWT with the updated name and email
    const token = await signToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
    });

    const response = NextResponse.json(
      { message: "Profile updated successfully", user: { name: updatedUser.name, email: updatedUser.email } },
      { status: 200 }
    );

    // Overwrite the old cookie with the new session
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}