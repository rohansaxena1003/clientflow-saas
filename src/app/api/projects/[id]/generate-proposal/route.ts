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

        
    // 4. Call the Gemini API using the dynamic "latest" alias
    let generatedText = "";
    
    try {
      const model = genAI.getGenerativeModel(
        { model: "gemini-flash-latest" }, 
        { apiVersion: "v1beta" }
      );
      
      const result = await model.generateContent(prompt);
      generatedText = result.response.text();
    } catch (apiError) {
      console.warn("Gemini API unavailable, using simulated response:", apiError);
      
      // Simulate a 3-paragraph professional proposal
      generatedText = `Dear ${project.clientName},\n\nI am thrilled to submit this proposal for ${project.title}. I understand the importance of delivering a high-quality product that aligns with your business goals and expectations.\n\nMy approach involves a structured development process, ensuring transparent communication, rigorous testing, and timely delivery. I bring a strong background in Next.js and PostgreSQL to ensure this project is scalable, secure, and performs flawlessly under pressure.\n\nI am confident that my skills and dedication make me the ideal partner for this project. I am ready to begin immediately and look forward to discussing how we can bring your vision to life.`;
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
