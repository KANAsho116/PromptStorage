import multer from 'multer';
import { MAX_FILE_SIZE } from '../config/constants.js';

// メモリストレージを使用（Sharpで処理するため）
const storage = multer.memoryStorage();

// ファイルフィルター
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
  }
};

// Multer設定
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // 最大10ファイル
  },
});

// 単一ファイルアップロード
export const uploadSingle = upload.single('image');

// 複数ファイルアップロード
export const uploadMultiple = upload.array('images', 10);

// エラーハンドリングミドルウェア
export function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
        },
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TOO_MANY_FILES',
          message: 'Maximum 10 files allowed',
        },
      });
    }
    return res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: err.message,
      },
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: err.message,
      },
    });
  }

  next();
}
