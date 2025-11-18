import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Ensure upload directories exist
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const createUploadDirs = () => {
  const dirs = [
    uploadDir,
    path.join(uploadDir, 'avatars'),
    path.join(uploadDir, 'licenses'),
    path.join(uploadDir, 'vehicles'),
    path.join(uploadDir, 'documents'),
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'documents';

    // Determine folder based on field name
    if (file.fieldname === 'avatar') folder = 'avatars';
    else if (file.fieldname === 'licensePhoto') folder = 'licenses';
    else if (file.fieldname === 'vehiclePhoto') folder = 'vehicles';

    cb(null, path.join(uploadDir, folder));
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    const filename = `${file.fieldname}-${Date.now()}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  },
});

// File filter - only images and PDFs
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed extensions
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedDocTypes = /pdf/;

  const ext = path.extname(file.originalname).toLowerCase().substring(1);
  const mimetype = file.mimetype;

  // Check if image
  const isImage =
    allowedImageTypes.test(ext) &&
    (mimetype.startsWith('image/') || allowedImageTypes.test(mimetype));

  // Check if PDF
  const isPDF = allowedDocTypes.test(ext) && mimetype === 'application/pdf';

  if (isImage || isPDF) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WEBP) and PDF documents are allowed'));
  }
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
  },
});

/**
 * Upload single file
 */
export const uploadSingle = (fieldName: string) => upload.single(fieldName);

/**
 * Upload multiple files
 */
export const uploadMultiple = (fieldName: string, maxCount: number = 5) =>
  upload.array(fieldName, maxCount);

/**
 * Upload multiple fields
 */
export const uploadFields = (fields: { name: string; maxCount: number }[]) =>
  upload.fields(fields);

/**
 * Get file URL
 */
export const getFileUrl = (filename: string, folder: string = 'documents'): string => {
  return `/uploads/${folder}/${filename}`;
};

/**
 * Delete file
 */
export const deleteFile = (filepath: string): boolean => {
  try {
    const fullPath = path.join(uploadDir, filepath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Delete multiple files
 */
export const deleteFiles = (filepaths: string[]): boolean => {
  try {
    filepaths.forEach((filepath) => deleteFile(filepath));
    return true;
  } catch (error) {
    console.error('Error deleting files:', error);
    return false;
  }
};

/**
 * Get file extension
 */
export const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase().substring(1);
};

/**
 * Check if file is image
 */
export const isImageFile = (filename: string): boolean => {
  const ext = getFileExtension(filename);
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
};

/**
 * Check if file is PDF
 */
export const isPDFFile = (filename: string): boolean => {
  const ext = getFileExtension(filename);
  return ext === 'pdf';
};

export default upload;