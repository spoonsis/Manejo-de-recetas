const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Create unique filenames while preserving original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `doc-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({ storage: storage });

// POST upload file
router.post('/', upload.single('archivo'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Return the public URL for the newly uploaded file
        const publicUrl = `/uploads/${req.file.filename}`;

        res.json({
            success: true,
            url: publicUrl,
            originalName: req.file.originalname,
            size: req.file.size
        });
    } catch (e) {
        console.error("Error POST /upload", e);
        res.status(500).json({ error: "Error interno del servidor. Contacte a soporte." });
    }
});

module.exports = router;
