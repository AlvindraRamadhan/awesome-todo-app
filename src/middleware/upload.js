const multer = require('multer');
const path = require('path');

// Set up storage engine
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function(req, file, cb) {
        const originalName = path.parse(file.originalname).name;
        const timestamp = Date.now();
        const extension = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${timestamp}-${originalName}${extension}`);
    }
});

// Check file type
function checkFileType(file, cb) {
    // Allowed extensions
    const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    // Check extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (extname) {
        return cb(null, true);
    } else {
        cb('Error: Invalid file type. Allowed types are: ' + filetypes);
    }
}

// Init upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 10000000 }, // 10MB limit
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
}).single('attachment'); // 'attachment' is the field name in the form

module.exports = upload;
