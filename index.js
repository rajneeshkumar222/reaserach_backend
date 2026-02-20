import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import fs from "fs";
import OpenAI from "openai";
import { createRequire } from "module"; // <-- Node ES module trick

dotenv.config();
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse"); // v1.1.1 stable

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/analyze", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    let text = "";
    if (req.file.mimetype === "application/pdf") {
      const buffer = fs.readFileSync(req.file.path);
      const data = await pdfParse(buffer); // works perfectly
      text = data.text;
    } else {
      text = fs.readFileSync(req.file.path, "utf-8");
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Analyze this earnings transcript and return structured JSON:\n\n${text.slice(0, 12000)}`
        }
      ],
      temperature: 0.2
    });

    res.json({ result: completion.choices[0].message.content });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));