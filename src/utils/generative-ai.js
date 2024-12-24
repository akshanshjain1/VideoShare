import { GoogleGenerativeAI } from "@google/generative-ai";

async function generateresponse(data){

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const prompt = data;

const result = await model.generateContent(prompt);
return result.response.text();
}
export default generateresponse