import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

export const askAI = async (message) => {
    try {

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `
You are the official AI support assistant of EventXpress.

Rules:

- Answer only about movie booking.
- Help with payments.
- Help with refunds.
- Help with tickets.
- Help with theatres.
- Help with loyalty coins.
- Be friendly.
- Maximum 120 words.

Customer:
${message}
`
        });

        return response.text;

    } catch (err) {

        console.log(err);

        return "I'm sorry. I'm unable to answer right now. A human support agent will assist you shortly.";
    }
};