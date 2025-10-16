import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Question } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const quizGenerationSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      questionType: {
        type: Type.STRING,
        description: "The type of question. Must be one of: 'multiple-choice', 'matching', 'dropdown', 'fill-in-the-blank'."
      },
      imagePrompt: {
        type: Type.STRING,
        description: "A simple, descriptive prompt for generating an illustrative image for the question. E.g., 'A map of ancient Rome'."
      },
      // Properties for 'multiple-choice'
      questionText: {
        type: Type.STRING,
        description: "The text of the question (for 'multiple-choice')."
      },
      options: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "An array of possible answers (for 'multiple-choice' and 'dropdown')."
      },
      correctAnswerIndex: {
        type: Type.INTEGER,
        description: "The 0-based index of the correct answer in the 'options' array (for 'multiple-choice')."
      },
      // Properties for 'matching'
      title: {
        type: Type.STRING,
        description: "The instructional title for the matching question, e.g., 'Match the country to its capital'."
      },
      prompts: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "The list of items on the left to be matched."
      },
      answers: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "The list of items on the right that can be matched. This should contain all correct answers."
      },
      correctMatches: {
        type: Type.OBJECT,
        description: "An object where keys are items from 'prompts' and values are their corresponding correct items from 'answers'."
      },
      // Properties for 'dropdown' and 'fill-in-the-blank'
      questionParts: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "An array of two strings that form the question text, with the blank or dropdown in between. E.g., ['The capital of France is ', '.']"
      },
      correctAnswer: {
        type: Type.STRING,
        description: "The correct string answer (for 'dropdown' and 'fill-in-the-blank')."
      },
    },
    required: ["questionType", "imagePrompt"]
  }
};


export const generateQuizQuestions = async (topic: string, count: number): Promise<Question[]> => {
  try {
    const prompt = `Generate a JSON array of ${count} quiz questions on the topic "${topic}".
The questions should be a mix of the following types: 'multiple-choice', 'matching', 'dropdown', and 'fill-in-the-blank'.
Each question object in the JSON array must have a "questionType" and "imagePrompt" field.
- For 'multiple-choice', include "questionText", "options" (4 of them), and "correctAnswerIndex".
- For 'matching', include "title", "prompts", "answers", and "correctMatches" (an object mapping prompts to answers). Ensure the 'answers' array contains exactly the correct matches for the 'prompts'.
- For 'dropdown', include "questionParts" (a two-element array for text before and after the dropdown), "options" (for the dropdown), and "correctAnswer".
- For 'fill-in-the-blank', include "questionParts" and a "correctAnswer".
The JSON must adhere to the provided schema. Ensure questions are interesting and varied.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: quizGenerationSchema,
      },
    });
    
    const jsonText = response.text.trim();
     if (!jsonText) {
        throw new Error("AI returned an empty response.");
    }
    const questions = JSON.parse(jsonText);
    return questions;
  } catch (error) {
    console.error("Error generating quiz questions:", error);
    throw new Error("Failed to generate quiz from AI. Please check the topic and try again.");
  }
};


export const generateImageForQuestion = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            }
        }
        throw new Error("No image data found in response.");
    } catch (error) {
        console.error("Error generating image:", error);
        // Return a placeholder if image generation fails
        return "https://picsum.photos/512/288";
    }
};
