import express from 'express';
import multer from 'multer';
import { VertexAI } from '@google-cloud/vertexai';
import fs from 'fs/promises';
import cors from 'cors'; 
 
// Initialize Vertex with your Cloud project, location, and API key
const vertex_ai = new VertexAI({
  project: 'driving-license-438906',
  location: 'us-central1',
  apiKey: 'AIzaSyA8GSEzSfJyoQKIAKRlzVoDK29RN9iet60', // API key here
});
 
const model = 'gemini-1.5-flash-002';
const upload = multer({ dest: 'uploads/' });
const app = express();
const port = 3003;
app.use(cors());

 
app.post('/api/generate', upload.single('image'), async (req, res) => {
  try {
    const imagePath = req.file.path;
    const imageMimeType = req.file.mimetype;
 
    // Read image file and convert to base64
    const imageBuffer = await fs.readFile(imagePath);
    const imageBase64 = imageBuffer.toString('base64');
 
    // Correct payload structure for image input
    const image1 = {
      inlineData: {
        mimeType: imageMimeType,   // Set the MIME type for the image
        data: imageBase64,         // Image data in base64
      },
    };
 
    // Initialize the generative model
    const generativeModel = vertex_ai.preview.getGenerativeModel({
      model: model,
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 1,
        topP: 0.95,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'OFF' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'OFF' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'OFF' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'OFF' },
      ],
    });
 
    // Construct the request body with correct content field
    const reqBody = {
      contents: [
        {
          role: 'user',
          parts: [
            image1,  // Send image1 as part of the message
            { text: 'Tell me two alphanumeric Numbers. One is vehicle no and the other one is a small no.Check if there is any hologram?' },
          ],
        },
      ],
    };
 
    // Send request to the model
    const streamingResp = await generativeModel.generateContentStream(reqBody);
 
    let responseChunks = [];
    for await (const item of streamingResp.stream) {
      responseChunks.push(item);
    }
 
    // Send response back to the client
    res.json({
      aggregatedResponse: await streamingResp.response,
      streamedChunks: responseChunks,
    });
 
    // Clean up the uploaded image
    await fs.unlink(imagePath);
  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).send('An error occurred while generating content.');
  }
});
 
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

