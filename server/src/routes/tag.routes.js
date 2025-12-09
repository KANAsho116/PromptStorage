import express from 'express';
import * as tagController from '../controllers/tag.controller.js';

const router = express.Router();

// 全タグを取得
router.get('/', tagController.getAllTags);

// タグを作成
router.post('/', tagController.createTag);

// タグを更新
router.put('/:id', tagController.updateTag);

// タグを削除
router.delete('/:id', tagController.deleteTag);

export default router;
