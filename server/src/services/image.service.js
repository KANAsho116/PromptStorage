import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, '../../storage/images');

// アップロードディレクトリの存在確認
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * 画像を処理してサムネイルを生成
 * @param {Buffer} buffer - 画像バッファ
 * @param {string} originalName - オリジナルファイル名
 * @returns {Promise<Object>} 処理結果
 */
export async function processImage(buffer, originalName) {
  try {
    const ext = path.extname(originalName).toLowerCase();
    const baseName = `${uuidv4()}${ext}`;
    const thumbnailName = `thumb_${baseName}`;

    const imagePath = path.join(UPLOAD_DIR, baseName);
    const thumbnailPath = path.join(UPLOAD_DIR, thumbnailName);

    // メタデータ取得
    const metadata = await sharp(buffer).metadata();

    // オリジナル画像を保存（最適化）
    await sharp(buffer)
      .jpeg({ quality: 90, mozjpeg: true })
      .png({ compressionLevel: 9 })
      .webp({ quality: 90 })
      .toFile(imagePath);

    // サムネイル生成（300x300）
    await sharp(buffer)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    // ファイルサイズ取得
    const stats = fs.statSync(imagePath);
    const thumbnailStats = fs.statSync(thumbnailPath);

    return {
      original: {
        fileName: baseName,
        filePath: imagePath,
        fileSize: stats.size,
        width: metadata.width,
        height: metadata.height,
        mimeType: `image/${metadata.format}`,
      },
      thumbnail: {
        fileName: thumbnailName,
        filePath: thumbnailPath,
        fileSize: thumbnailStats.size,
        width: 300,
        height: 300,
        mimeType: 'image/jpeg',
      },
    };
  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error('Failed to process image');
  }
}

/**
 * 複数画像を処理
 * @param {Array<Object>} files - Multerファイルオブジェクトの配列
 * @returns {Promise<Array<Object>>} 処理結果の配列
 */
export async function processMultipleImages(files) {
  const results = [];

  for (const file of files) {
    const result = await processImage(file.buffer, file.originalname);
    results.push({
      original: result.original,
      thumbnail: result.thumbnail,
      originalName: file.originalname,
    });
  }

  return results;
}

/**
 * 画像を削除
 * @param {string} fileName - ファイル名
 */
export function deleteImage(fileName) {
  try {
    const filePath = path.join(UPLOAD_DIR, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
  }
}

/**
 * ワークフローに関連する全画像を削除
 * @param {Array<Object>} images - 画像情報の配列
 */
export function deleteWorkflowImages(images) {
  for (const image of images) {
    deleteImage(image.file_name);
  }
}

/**
 * 画像ファイルのバリデーション
 * @param {Object} file - Multerファイルオブジェクト
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validateImageFile(file) {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 52428800; // 50MB

  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`,
    };
  }

  return { valid: true, error: null };
}
