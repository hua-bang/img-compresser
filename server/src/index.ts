import express from 'express';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Add health check endpoint
app.get('/api', (req, res) => {
  res.status(200).send('OK');
});

app.post('/api/compress', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const quality = parseInt(req.body.quality) || 80;
    const maxFileSize = parseInt(req.body.maxFileSize) || 800; // in KB
    const mode = req.body.mode || 'quality'; // 'quality' or 'size'

    let compressedImage = sharp(req.file.buffer);
    const metadata = await compressedImage.metadata();
    let buffer: Buffer;

    if (mode === 'quality') {
      // Quality mode: just apply the quality setting
      buffer = await compressedImage
        .jpeg({ quality })
        .toBuffer();
    } else {
      // Size mode: iteratively adjust quality to meet size target
      let currentQuality = 100;
      buffer = await compressedImage.jpeg({ quality: currentQuality }).toBuffer();
      
      while (buffer.length > maxFileSize * 1024 && currentQuality > 1) {
        currentQuality = Math.max(currentQuality - 5, 1); // Reduce quality by 5% each time
        buffer = await compressedImage
          .jpeg({ quality: currentQuality })
          .toBuffer();
      }

      // If still too large, start reducing dimensions
      let width = metadata.width;
      while (buffer.length > maxFileSize * 1024 && width && width > 300) {
        width = Math.floor(width * 0.9);
        buffer = await sharp(req.file.buffer)
          .resize(width)
          .jpeg({ quality: currentQuality })
          .toBuffer();
      }
    }

    res.set('Content-Type', 'image/jpeg');
    res.send(buffer);
  } catch (error) {
    console.error('Error compressing image:', error);
    res.status(500).json({ error: 'Failed to compress image' });
  }
});

const PORT = process.env.PORT || 3009;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 