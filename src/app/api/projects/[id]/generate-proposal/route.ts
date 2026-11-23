import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate the request
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // 2. Fetch the project and verify ownership (Tenant Isolation)
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project || project.userId !== user.userId) {
      return NextResponse.json(
        { error: "Project not found or unauthorized" },
        { status: 404 }
      );
    }

    // 3. Construct the prompt for the LLM
    const prompt = `You are a top-tier freelance professional. Write a compelling, professional, 3-paragraph project proposal for a project titled "${project.title}". The client's name is "${project.clientName}". 
    Paragraph 1: Warm greeting, acknowledging the project and their business needs.
    Paragraph 2: Your approach to delivering high-quality results for this specific project.
    Paragraph 3: A confident closing statement indicating readiness to begin.
    Keep it strictly to 3 paragraphs. Do not include placeholder brackets like [Your Name]—just write the core proposal text.`;

    // 4. Call the Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const generatedText = result.response.text();

    if (!generatedText) {
      throw new Error("AI failed to generate content.");
    }

    // 5. Save the generated proposal to PostgreSQL
    const updatedProject = await prisma.project.update({
      where: { id },
      data: { proposalText: generatedText.trim() },
    });

    return NextResponse.json(
      { message: "Proposal generated successfully", proposalText: updatedProject.proposalText },
      { status: 200 }
    );
  } catch (error) {
    console.error("AI Proposal Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
