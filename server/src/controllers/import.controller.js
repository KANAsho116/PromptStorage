import * as importService from '../services/import.service.js';
import multer from 'multer';

// Multer設定（メモリストレージ）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['application/json', 'application/zip', 'application/x-zip-compressed'];
    const allowedExtensions = ['.json', '.zip'];

    const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));

    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON and ZIP files are allowed'));
    }
  }
});

export const uploadMiddleware = upload.single('file');

/**
 * ワークフローをインポート（JSON/ZIP）
 */
export async function importWorkflows(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No file uploaded' }
      });
    }

    const duplicateAction = req.body.duplicateAction || 'rename';

    // 重複処理の検証
    if (!['skip', 'rename', 'overwrite'].includes(duplicateAction)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid duplicateAction. Must be: skip, rename, or overwrite' }
      });
    }

    let results;

    // ファイルタイプに応じて処理
    if (req.file.mimetype === 'application/json' || req.file.originalname.endsWith('.json')) {
      // JSON インポート
      const jsonData = JSON.parse(req.file.buffer.toString('utf8'));
      results = await importService.importFromJSON(jsonData, duplicateAction);

    } else if (req.file.mimetype === 'application/zip' ||
               req.file.mimetype === 'application/x-zip-compressed' ||
               req.file.originalname.endsWith('.zip')) {
      // ZIP インポート
      results = await importService.importFromZIP(req.file.buffer, duplicateAction);

    } else {
      return res.status(400).json({
        success: false,
        error: { message: 'Unsupported file type' }
      });
    }

    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    if (error instanceof SyntaxError) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid JSON format' }
      });
    }
    next(error);
  }
}
