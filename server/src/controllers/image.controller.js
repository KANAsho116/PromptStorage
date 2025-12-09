import * as imageModel from '../models/image.model.js';
import * as imageService from '../services/image.service.js';
import path from 'path';
import fs from 'fs';

/**
 * ワークフローに画像をアップロード
 */
export async function uploadImages(req, res, next) {
  try {
    const { workflowId } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILES',
          message: 'No files uploaded',
        },
      });
    }

    // 画像処理
    const processedImages = await imageService.processMultipleImages(req.files);

    // データベースに保存
    const savedImages = [];
    for (const img of processedImages) {
      // オリジナル画像
      const originalId = imageModel.createImage(parseInt(workflowId), {
        filePath: img.original.filePath,
        fileName: img.original.fileName,
        fileSize: img.original.fileSize,
        mimeType: img.original.mimeType,
        width: img.original.width,
        height: img.original.height,
        isThumbnail: false,
      });

      // サムネイル画像
      const thumbnailId = imageModel.createImage(parseInt(workflowId), {
        filePath: img.thumbnail.filePath,
        fileName: img.thumbnail.fileName,
        fileSize: img.thumbnail.fileSize,
        mimeType: img.thumbnail.mimeType,
        width: img.thumbnail.width,
        height: img.thumbnail.height,
        isThumbnail: true,
      });

      savedImages.push({
        original: { id: originalId, ...img.original },
        thumbnail: { id: thumbnailId, ...img.thumbnail },
      });
    }

    res.status(201).json({
      success: true,
      data: savedImages,
      message: `${savedImages.length} image(s) uploaded successfully`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 画像を取得（ファイル送信）
 */
export async function getImage(req, res, next) {
  try {
    const { id } = req.params;

    const image = imageModel.getImageById(parseInt(id));

    if (!image) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'IMAGE_NOT_FOUND',
          message: `Image with ID ${id} not found`,
        },
      });
    }

    // ファイルの存在確認
    if (!fs.existsSync(image.file_path)) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'Image file not found on disk',
        },
      });
    }

    // ファイルを送信
    res.sendFile(path.resolve(image.file_path));
  } catch (error) {
    next(error);
  }
}

/**
 * ワークフローの画像一覧を取得
 */
export async function getWorkflowImages(req, res, next) {
  try {
    const { workflowId } = req.params;

    const images = imageModel.getImagesByWorkflowId(parseInt(workflowId));

    res.json({
      success: true,
      data: images,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 画像を削除
 */
export async function deleteImage(req, res, next) {
  try {
    const { id } = req.params;

    const image = imageModel.getImageById(parseInt(id));

    if (!image) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'IMAGE_NOT_FOUND',
          message: `Image with ID ${id} not found`,
        },
      });
    }

    // ファイルを削除
    imageService.deleteImage(image.file_name);

    // データベースから削除
    imageModel.deleteImage(parseInt(id));

    res.json({
      success: true,
      message: 'Image deleted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}
