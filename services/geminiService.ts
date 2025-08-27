
import { GoogleGenAI, Type } from "@google/genai";
import type { ResumeData } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const resumeSchema = {
    type: Type.OBJECT,
    properties: {
        contactInfo: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: "Full name" },
                email: { type: Type.STRING, description: "Email address" },
                phone: { type: Type.STRING, description: "Phone number" },
                linkedin: { type: Type.STRING, description: "LinkedIn profile URL (optional)" },
                portfolio: { type: Type.STRING, description: "Portfolio or personal website URL (optional)" },
                location: { type: Type.STRING, description: "City and State, e.g., 'San Francisco, CA'" },
            },
            required: ["name", "email", "phone", "location"]
        },
        summary: {
            type: Type.STRING,
            description: "A 2-4 sentence professional summary."
        },
        workExperience: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    jobTitle: { type: Type.STRING },
                    company: { type: Type.STRING },
                    location: { type: Type.STRING },
                    startDate: { type: Type.STRING, description: "e.g., 'June 2020'" },
                    endDate: { type: Type.STRING, description: "e.g., 'Present' or 'August 2022'" },
                    description: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "List of accomplishments and responsibilities as bullet points."
                    }
                },
                required: ["jobTitle", "company", "location", "startDate", "endDate", "description"]
            }
        },
        education: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    degree: { type: Type.STRING, description: "e.g., 'Bachelor of Science in Computer Science'" },
                    institution: { type: Type.STRING },
                    location: { type: Type.STRING },
                    graduationDate: { type: Type.STRING, description: "e.g., 'May 2020'" }
                },
                required: ["degree", "institution", "location", "graduationDate"]
            }
        },
        skills: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of relevant technical and soft skills."
        }
    },
    required: ["contactInfo", "summary", "workExperience", "education", "skills"]
};


export const generateResumeFromCV = async (
    cvBase64: string,
    mimeType: string,
    pageCount: number
): Promise<ResumeData> => {
    
    if (!cvBase64) {
        throw new Error("CV file content is empty.");
    }
    if (!mimeType.startsWith('application/pdf') && !mimeType.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
        throw new Error("Invalid file type. Please upload a PDF or DOCX file.");
    }

    const prompt = `You are an expert resume writer. Analyze the provided CV document. Extract all relevant information, including contact details, professional summary, work experience, education, and skills. Then, rewrite and format this information into a concise, professional, US-style resume. The final resume must not exceed ${pageCount} page(s) in length when printed. Paraphrase and summarize content as needed to meet this length requirement, focusing on impact and achievements. Return the output as a JSON object matching the provided schema.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: cvBase64,
                            },
                        },
                    ],
                },
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: resumeSchema,
            },
        });

        const jsonText = response.text.trim();
        const parsedData: ResumeData = JSON.parse(jsonText);
        return parsedData;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to generate resume from AI. The provided document might be unreadable or malformed.");
    }
};
