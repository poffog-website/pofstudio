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

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║       POFSTUDIO Backend Server         ║
╠════════════════════════════════════════╣
║  Server running at:                    ║
║  http://localhost:${PORT}                  ║
║                                        ║
║  API Endpoints:                        ║
║  GET  /api/categories                  ║
║  GET  /api/images/:category            ║
║  GET  /api/images                      ║
║  POST /api/upload                      ║
║  POST /api/categories                  ║
║  DELETE /api/images/:cat/:filename     ║
╚════════════════════════════════════════╝
    `);
});
