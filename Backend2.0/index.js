import express from 'express';
import multer from 'multer';
import { VertexAI } from '@google-cloud/vertexai';
import fs from 'fs/promises';
import path from 'path';
import cors from 'cors';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

// Set FFmpeg binary path
ffmpeg.setFfmpegPath(ffmpegStatic);

// Initialize Vertex AI with your Cloud project, location, and API key
const vertex_ai = new VertexAI({
  project: 'driving-license-438906',
  location: 'us-central1',
  apiKey: 'AIzaSyA8GSEzSfJyoQKIAKRlzVoDK29RN9iet60',
});

const model = 'gemini-1.5-flash-002';

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname;
    cb(null, `${timestamp}-${originalName}`);
  },
});

const upload = multer({ storage });
const app = express();
const port = 3031;
app.use(cors());

app.post('/api/generate', upload.single('image'), async (req, res) => {
  try {
    const imagePath = req.file.path;
    console.log(imagePath);
    const enhancedImagePath = path.join('uploads', `enhanced-${req.file.filename}`);
    const imageMimeType = req.file.mimetype;

    // Log original file size
    const originalFile = await fs.stat(imagePath);
    console.log("Original file size:", originalFile.size, "bytes");

    console.log("Increasing resolution by 300%...");
    await new Promise((resolve, reject) => {
      ffmpeg(imagePath)
        .output(enhancedImagePath)
        .videoFilters('scale=iw*3:ih*3') // Increase resolution by 300%
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    // Log enhanced file size
    const enhancedFile = await fs.stat(enhancedImagePath);
    console.log("Enhanced file size:", enhancedFile.size, "bytes");

    const imageBuffer = await fs.readFile(enhancedImagePath);
    const imageBase64 = imageBuffer.toString('base64');
    console.log("Base64 image size:", imageBase64.length, "bytes");

    const image1 = {
      inlineData: {
        mimeType: imageMimeType,
        data: imageBase64,
      },
    };

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

    const reqBody = {
      contents: [
        {
          role: 'user',
          parts: [
            image1,
            {
              text: `Tell me two pair alphanumeric Numbers. One pair is vehicle no and the other one pair is a small no. Check if there is any hologram? Answer with yes if both Vehicle Numbers are same.
              
              Example output:
              
              "* **Vehicle Number:** [WB02AP7811, WB02AP7811]
              * **Small Number:** [BA2500214448, BA2500214448]
              Don't add any space inside the array in between the numbers, remove the spaces if it comes inside the number.
              Yes, there is a hologram visible in the top left corner of the license plate.
              Yes, both vehicle numbers are same."`,
            },
          ],
        },
      ],
    };

    const streamingResp = await generativeModel.generateContentStream(reqBody);

    let responseChunks = [];
    for await (const item of streamingResp.stream) {
      responseChunks.push(item);
    }

    res.json({
      aggregatedResponse: await streamingResp.response,
      streamedChunks: responseChunks,
    });

    // Clean up images
    await fs.unlink(imagePath);
    await fs.unlink(enhancedImagePath);
  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).send('An error occurred while generating content.');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
