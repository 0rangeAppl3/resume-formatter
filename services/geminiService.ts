import { GoogleGenAI, Type } from "@google/genai";
import type { ResumeData, WorkExperience } from '../types';

declare const mammoth: any;

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
        qualifications: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An optional list of key qualifications or a 'Core Competencies' section, as bullet points. Omit if not present in the source CV."
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
        },
        portfolioProjects: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    projectName: { type: Type.STRING },
                    description: { type: Type.STRING, description: "A brief description of the project." },
                    technologies: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "List of key technologies used."
                    },
                    link: { type: Type.STRING, description: "Direct URL to the project (optional)." }
                },
                required: ["projectName", "description", "technologies"]
            },
            description: "An optional list of personal or professional projects. Omit if not present in the source CV."
        }
    },
    required: ["contactInfo", "summary", "workExperience", "education", "skills"]
};

const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            if (base64) {
                resolve(base64);
            } else {
                reject(new Error("Could not read file as base64."));
            }
        };
        reader.onerror = (error) => reject(error);
    });
};

const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = (error) => reject(error);
    });
};

/**
 * Extracts and cleans a JSON object from a string that may contain markdown or other text.
 * @param text The string to parse.
 * @returns A cleaned ResumeData object.
 */
const parseAndCleanResumeData = (text: string): ResumeData => {
    // 1. Find the JSON blob.
    const jsonMatch = text.match(/```(?:json)?\s*({[\s\S]*?})\s*```|({[\s\S]*})/);
    if (!jsonMatch) {
        console.error("Could not find valid JSON in the response:", text);
        throw new Error("Failed to generate resume from AI. The AI returned an invalid response format.");
    }
    const jsonText = jsonMatch[1] || jsonMatch[2];

    // 2. Parse the JSON
    let data: any;
    try {
        data = JSON.parse(jsonText);
    } catch (e) {
        console.error("Failed to parse JSON:", e);
        console.error("Invalid JSON string:", jsonText);
        throw new Error("Failed to parse AI response. The JSON is malformed.");
    }

    // 3. Recursively clean all values in the parsed object with robust validation.
    const cleanValue = (value: any, key?: string): any => {
        if (typeof value === 'string') {
            return value.replace(/^[\s:(){}[\]`'".,;*]*|[\s:(){}[\]`'".,;*]*$/g, '');
        }

        if (Array.isArray(value)) {
             // **Targeted Fix**: Apply strict validation for the workExperience array.
            if (key === 'workExperience') {
                const cleanedWorkExperience: WorkExperience[] = [];
                for (const item of value) {
                    // Only keep items that are actual objects with the necessary properties.
                    // This definitively filters out stray strings or malformed objects.
                    if (
                        item &&
                        typeof item === 'object' &&
                        'jobTitle' in item &&
                        'company' in item &&
                        'description' in item &&
                        Array.isArray(item.description)
                    ) {
                        // If it's a valid-looking object, then recursively clean it.
                        cleanedWorkExperience.push(cleanValue(item) as WorkExperience);
                    }
                }
                return cleanedWorkExperience;
            }
            // Generic cleaning for all other arrays
            return value.map(item => cleanValue(item)).filter(item => {
                if (typeof item === 'string') return item.length > 0;
                return item !== null && item !== undefined;
            });
        }
        
        if (typeof value === 'object' && value !== null) {
            const cleanedObject: { [key: string]: any } = {};
            for (const k in value) {
                if (Object.prototype.hasOwnProperty.call(value, k)) {
                    cleanedObject[k] = cleanValue(value[k], k);
                }
            }
            return cleanedObject;
        }

        return value;
    };
    
    return cleanValue(data) as ResumeData;
};


export const generateResumeFromCV = async (
    file: File,
    pageCount: number
): Promise<ResumeData> => {
    
    const mimeType = file.type;
    if (!mimeType.startsWith('application/pdf') && !mimeType.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
        throw new Error("Invalid file type. Please upload a PDF or DOCX file.");
    }

    let modelContents: any[];

    if (mimeType.startsWith('application/pdf')) {
        const cvBase64 = await readFileAsBase64(file);
        const prompt = `You are an expert resume writer. Analyze the provided CV document. Extract all relevant information, including contact details, professional summary, work experience, education, and skills. Then, rewrite and format this information into a concise, professional, US-style resume. The final resume must not exceed ${pageCount} page(s) in length when printed. Paraphrase and summarize content as needed to meet this length requirement, focusing on impact and achievements. If the CV contains sections for 'Qualifications'/'Core Competencies' or 'Portfolio Projects', include them in the output; otherwise, omit these fields. Return the output as a JSON object matching the provided schema.`;
        
        modelContents = [
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
        ];
    } else { // It's a DOCX
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const { value: docxText } = await mammoth.extractRawText({ arrayBuffer });

        if (!docxText) {
            throw new Error("Could not extract text from the DOCX file.");
        }

        const prompt = `You are an expert resume writer. The following text was extracted from a CV document:\n\n---\n${docxText}\n---\n\nAnalyze the text above. Extract all relevant information, including contact details, professional summary, work experience, education, and skills. Then, rewrite and format this information into a concise, professional, US-style resume. The final resume must not exceed ${pageCount} page(s) in length when printed. Paraphrase and summarize content as needed to meet this length requirement, focusing on impact and achievements. If the text contains sections for 'Qualifications'/'Core Competencies' or 'Portfolio Projects', include them in the output; otherwise, omit these fields. Return the output as a JSON object matching the provided schema.`;
        
        modelContents = [{ parts: [{ text: prompt }] }];
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: modelContents,
            config: {
                responseMimeType: "application/json",
                responseSchema: resumeSchema,
            },
        });

        const rawText = response.text;
        const cleanedData = parseAndCleanResumeData(rawText);
        return cleanedData;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to generate resume from AI. The provided document might be unreadable or malformed.");
    }
};