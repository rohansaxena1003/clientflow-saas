import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// PATCH: Update an existing project
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, clientName, clientEmail, status, budget } = body;

    // 1. Verify project exists AND belongs to the user
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject || existingProject.userId !== user.userId) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    // 2. Update the project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(clientName && { clientName: clientName.trim() }),
        ...(clientEmail && { clientEmail: clientEmail.toLowerCase().trim() }),
        ...(status && { status }),
        ...(budget !== undefined && { budget: parseFloat(budget) }),
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("PATCH Project Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: Remove a project securely
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // 1. Verify ownership before deletion
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject || existingProject.userId !== user.userId) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    // 2. Delete the project
    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("DELETE Project Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
