import express from 'express';
import * as workflowController from '../controllers/workflow.controller.js';

const router = express.Router();

// ワークフロー作成
router.post('/', workflowController.createWorkflow);

// ワークフロー一覧取得
router.get('/', workflowController.getWorkflows);

// 検索
router.get('/search', workflowController.searchWorkflows);

// 特定のワークフロー取得
router.get('/:id', workflowController.getWorkflowById);

// ワークフロー更新
router.put('/:id', workflowController.updateWorkflow);

// ワークフロー削除
router.delete('/:id', workflowController.deleteWorkflow);

// お気に入り切り替え
router.patch('/:id/favorite', workflowController.toggleFavorite);

export default router;
