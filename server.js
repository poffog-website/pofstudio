const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Base path for pofimage folder
const POFIMAGE_PATH = path.join(__dirname, 'pofimage');

// Ensure pofimage folder exists
if (!fs.existsSync(POFIMAGE_PATH)) {
    fs.mkdirSync(POFIMAGE_PATH, { recursive: true });
}

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const category = req.body.category || 'uncategorized';
        const categoryPath = path.join(POFIMAGE_PATH, category);

        // Create category folder if it doesn't exist
        if (!fs.existsSync(categoryPath)) {
            fs.mkdirSync(categoryPath, { recursive: true });
        }

        cb(null, categoryPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Allow only images
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// API Routes

// Get all categories (folders in pofimage)
app.get('/api/categories', (req, res) => {
    try {
        const categories = fs.readdirSync(POFIMAGE_PATH, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => {
                const categoryPath = path.join(POFIMAGE_PATH, dirent.name);
                const images = fs.readdirSync(categoryPath)
                    .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
                return {
                    name: dirent.name,
                    displayName: formatCategoryName(dirent.name),
                    imageCount: images.length
                };
            });

        res.json({ success: true, categories });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get images in a category
app.get('/api/images/:category', (req, res) => {
    try {
        const category = req.params.category;
        const categoryPath = path.join(POFIMAGE_PATH, category);

        if (!fs.existsSync(categoryPath)) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }

        const images = fs.readdirSync(categoryPath)
            .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
            .map(file => ({
                filename: file,
                url: `/pofimage/${category}/${file}`,
                category: category
            }));

        res.json({ success: true, images });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all images from all categories
app.get('/api/images', (req, res) => {
    try {
        const allImages = [];
        const categories = fs.readdirSync(POFIMAGE_PATH, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory());

        categories.forEach(dirent => {
            const categoryPath = path.join(POFIMAGE_PATH, dirent.name);
            const images = fs.readdirSync(categoryPath)
                .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
                .map(file => ({
                    filename: file,
                    url: `/pofimage/${dirent.name}/${file}`,
                    category: dirent.name
                }));
            allImages.push(...images);
        });

        res.json({ success: true, images: allImages });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Upload image
app.post('/api/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const category = req.body.category || 'uncategorized';
        res.json({
            success: true,
            message: 'Image uploaded successfully',
            image: {
                filename: req.file.filename,
                url: `/pofimage/${category}/${req.file.filename}`,
                category: category
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new category
app.post('/api/categories', (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, error: 'Category name is required' });
        }

        // Sanitize folder name
        const safeName = name.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
        const categoryPath = path.join(POFIMAGE_PATH, safeName);

        if (fs.existsSync(categoryPath)) {
            return res.status(400).json({ success: false, error: 'Category already exists' });
        }

        fs.mkdirSync(categoryPath, { recursive: true });

        res.json({
            success: true,
            message: 'Category created successfully',
            category: {
                name: safeName,
                displayName: formatCategoryName(safeName),
                imageCount: 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete image
app.delete('/api/images/:category/:filename', (req, res) => {
    try {
        const { category, filename } = req.params;
        const filePath = path.join(POFIMAGE_PATH, category, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, error: 'Image not found' });
        }

        fs.unlinkSync(filePath);
        res.json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Helper function to format category name
function formatCategoryName(name) {
    return name
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// ========================================
// POFANIMATION - Video API
// ========================================

const POFANIMATION_PATH = path.join(__dirname, 'pofanimation');

// Ensure pofanimation folder exists
if (!fs.existsSync(POFANIMATION_PATH)) {
    fs.mkdirSync(POFANIMATION_PATH, { recursive: true });
}

// Configure multer for video upload
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, POFANIMATION_PATH);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'video-' + uniqueSuffix + ext);
    }
});

const videoUpload = multer({
    storage: videoStorage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /mp4|webm|mov|avi/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = /video/.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only video files are allowed!'));
    },
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});

// Get all videos
app.get('/api/videos', (req, res) => {
    try {
        const videos = fs.readdirSync(POFANIMATION_PATH)
            .filter(file => /\.(mp4|webm|mov|avi)$/i.test(file))
            .map(file => {
                const stats = fs.statSync(path.join(POFANIMATION_PATH, file));
                return {
                    filename: file,
                    title: file.replace(/^video-\d+-\d+/, '').replace(/\.[^.]+$/, '') || file,
                    url: `/pofanimation/${file}`,
                    thumbnail: 'images/kids-animation.png',
                    size: stats.size,
                    created: stats.birthtime
                };
            });

        res.json({ success: true, videos });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Upload video
app.post('/api/videos/upload', videoUpload.single('video'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No video uploaded' });
        }

        const title = req.body.title || req.file.filename;

        res.json({
            success: true,
            message: 'Video uploaded successfully',
            video: {
                filename: req.file.filename,
                title: title,
                url: `/pofanimation/${req.file.filename}`
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete video
app.delete('/api/videos/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(POFANIMATION_PATH, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, error: 'Video not found' });
        }

        fs.unlinkSync(filePath);
        res.json({ success: true, message: 'Video deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// POFSONG - Audio/Music API
// ========================================

const POFSONG_PATH = path.join(__dirname, 'pofsong');

// Ensure pofsong folder exists
if (!fs.existsSync(POFSONG_PATH)) {
    fs.mkdirSync(POFSONG_PATH, { recursive: true });
}

// Configure multer for audio upload
const audioStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, POFSONG_PATH);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'song-' + uniqueSuffix + ext);
    }
});

const audioUpload = multer({
    storage: audioStorage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /mp3|wav|mpeg|audio/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = /audio/.test(file.mimetype);

        if (extname || mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only audio files are allowed!'));
    },
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// Get all songs
app.get('/api/songs', (req, res) => {
    try {
        const songs = fs.readdirSync(POFSONG_PATH)
            .filter(file => /\.(mp3|wav|mpeg)$/i.test(file))
            .map(file => {
                const stats = fs.statSync(path.join(POFSONG_PATH, file));
                return {
                    filename: file,
                    title: file.replace(/^song-\d+-\d+/, '').replace(/\.[^.]+$/, '') || file,
                    url: `/pofsong/${file}`,
                    size: stats.size,
                    created: stats.birthtime
                };
            });

        res.json({ success: true, songs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Upload song
app.post('/api/songs/upload', audioUpload.single('audio'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No audio uploaded' });
        }

        const title = req.body.title || req.file.filename;

        res.json({
            success: true,
            message: 'Song uploaded successfully',
            song: {
                filename: req.file.filename,
                title: title,
                url: `/pofsong/${req.file.filename}`
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete song
app.delete('/api/songs/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(POFSONG_PATH, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, error: 'Song not found' });
        }

        fs.unlinkSync(filePath);
        res.json({ success: true, message: 'Song deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║       POFSTUDIO Backend Server         ║
╠════════════════════════════════════════╣
║  Server running at:                    ║
║  http://localhost:${PORT}                  ║
║                                        ║
║  Image API:                            ║
║  GET  /api/categories                  ║
║  GET  /api/images/:category            ║
║  POST /api/upload                      ║
║  DELETE /api/images/:cat/:filename     ║
║                                        ║
║  Video API:                            ║
║  GET  /api/videos                      ║
║  POST /api/videos/upload               ║
║  DELETE /api/videos/:filename          ║
║                                        ║
║  Song API:                             ║
║  GET  /api/songs                       ║
║  POST /api/songs/upload                ║
║  DELETE /api/songs/:filename           ║
╚════════════════════════════════════════╝
    `);
});

