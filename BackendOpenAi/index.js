import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

// Define __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up multer storage to save the file with its original name and extension
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Save files to the 'uploads' folder
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Use the original file name
    }
});

const upload = multer({ storage });

const openai = new OpenAI({
    apiKey: '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', // Replace with your actual OpenAI API key
});

const app = express();

// Serve the uploads folder as static files, so files can be accessed via URL
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post("/analyze-image", upload.single("image"), async (req, res) => {
    const { promptText } = req.body;
    const imageFilePath = req.file?.path;

    if (!promptText || !imageFilePath) {
        return res.status(400).json({ error: "Please provide both an image and 'promptText' in the request." });
    }

    // Simulated or manual description of the image (you can replace this with an actual image description logic)
    const simulatedImageDescription = "This image appears to contain a car with a license plate and two numbers: one is the lid number and the other is the HSRP number."; 

    // Combine the user's prompt and the simulated image description
    const combinedPrompt = `${promptText} Image description: ${simulatedImageDescription}`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: combinedPrompt }],
        });

        // Remove the uploaded image file after processing
        fs.unlinkSync(imageFilePath);

        // Respond with OpenAI's result
        const assistantMessage = response.choices[0].message.content;
        res.json({ description: assistantMessage });
    } catch (error) {
        console.error("Error analyzing image:", error);
        res.status(500).json({ error: "Failed to analyze image. Please try again later." });
    }
});

const PORT = 3080;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
