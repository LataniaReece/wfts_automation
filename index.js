import axios from "axios";
import fs from "fs";
import { parse } from "json2csv";
import dotenv from "dotenv";
import OpenAI from "openai";

import wfts_quotes from "./utils/quotes.js";
import labelMessagePairs from "./utils/labelMessagePairs.js";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getOpenAIResponse(prompt) {
  try {
    const response = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
      max_tokens: 1500,
      temperature: 0.7,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return "An error occurred while getting a response from OpenAI.";
  }
}

// Split the label/message pairs into smaller chunks
const chunkSize = 10; // Adjust chunk size as needed
const chunks = [];

for (let i = 0; i < labelMessagePairs.length; i += chunkSize) {
  chunks.push(labelMessagePairs.slice(i, i + chunkSize));
}

async function processAndSaveQuotes() {
  console.log("Generating quotes...");

  let allQuotes = [];

  for (const chunk of chunks) {
    const prompt = `I am a motivational content creator called Words for the Soul on social media. Here are the quotes that I've written so far: ${wfts_quotes.join(
      "\n"
    )} And I want to generate quotes for these label/message pairs: ${chunk
      .map((pair) => `Label: ${pair[0]}, Message: ${pair[1]}`)
      .join(
        "\n"
      )}. Using the same voice, tone, and word choice you see in the quotes I provided above. I want the quotes to be formatted as individual items, each starting on a new line, and to be a bit beefy in length, like 2-5 sentences each. Give me these quotes. And be sure to just give the quotes. I'm exporting this to an excel file`;

    const response = await getOpenAIResponse(prompt);

    if (response.startsWith("An error occurred")) {
      console.log(response);
      continue;
    }

    console.log("OpenAI Response received");

    // Split the response into individual quotes
    const quotes = response.split("\n").filter((quote) => quote.trim() !== "");

    allQuotes = [...allQuotes, ...quotes];
  }

  // Prepare data for CSV
  const csvData = allQuotes.map((quote, index) => ({
    id: index + 1,
    quote: quote,
  }));

  // Convert to CSV
  const csv = parse(csvData);

  // Write to a CSV file
  fs.writeFileSync("quotes.csv", csv);
  console.log("Quotes have been saved to quotes.csv");
}

// Call the function to process and save quotes
processAndSaveQuotes();
