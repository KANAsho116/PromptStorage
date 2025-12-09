import express from 'express';
import * as imageController from '../controllers/image.controller.js';
import { uploadMultiple, handleUploadError } from '../middleware/file-upload.js';

const router = express.Router();

// ワークフローに画像をアップロード
router.post(
  '/workflows/:workflowId/images',
  uploadMultiple,
  handleUploadError,
  imageController.uploadImages
);

// ワークフローの画像一覧を取得
router.get('/workflows/:workflowId/images', imageController.getWorkflowImages);

// 画像を取得（ファイル）
router.get('/:id', imageController.getImage);

// 画像を削除
router.delete('/:id', imageController.deleteImage);

export default router;
