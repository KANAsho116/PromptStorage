import * as workflowModel from '../models/workflow.model.js';
import {
  extractPrompts,
  extractMetadata,
  validateWorkflowJson,
  generateWorkflowName,
} from '../services/parser.service.js';

/**
 * ワークフロー作成
 */
export async function createWorkflow(req, res, next) {
  try {
    const { name, description, workflow_json, category, favorite } = req.body;

    // JSONバリデーション
    const validation = validateWorkflowJson(workflow_json);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_WORKFLOW_JSON',
          message: validation.error,
        },
      });
    }

    // 名前の自動生成
    const workflowName = name || generateWorkflowName(workflow_json);

    // 名前の重複チェック
    if (workflowModel.isNameDuplicate(workflowName)) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_NAME',
          message: `Workflow with name "${workflowName}" already exists`,
        },
      });
    }

    // プロンプト抽出
    const prompts = extractPrompts(workflow_json);

    // メタデータ抽出
    const metadata = extractMetadata(workflow_json);

    // ワークフロー作成
    const workflow = workflowModel.createWorkflow(
      {
        name: workflowName,
        description,
        workflow_json,
        category,
        favorite,
      },
      prompts,
      metadata
    );

    res.status(201).json({
      success: true,
      data: workflow,
      message: 'Workflow created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * ワークフロー一覧取得
 */
export async function getWorkflows(req, res, next) {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      order = 'DESC',
      category,
      favorite,
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      order,
      category,
      favorite: favorite !== undefined ? favorite === 'true' : null,
    };

    const result = workflowModel.getWorkflows(options);

    res.json({
      success: true,
      data: result.workflows,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 特定のワークフロー取得
 */
export async function getWorkflowById(req, res, next) {
  try {
    const { id } = req.params;

    const workflow = workflowModel.getWorkflowById(parseInt(id));

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'WORKFLOW_NOT_FOUND',
          message: `Workflow with ID ${id} not found`,
        },
      });
    }

    res.json({
      success: true,
      data: workflow,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * ワークフロー更新
 */
export async function updateWorkflow(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body;

    // 名前の重複チェック（名前を変更する場合）
    if (updates.name && workflowModel.isNameDuplicate(updates.name, parseInt(id))) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_NAME',
          message: `Workflow with name "${updates.name}" already exists`,
        },
      });
    }

    const success = workflowModel.updateWorkflow(parseInt(id), updates);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'WORKFLOW_NOT_FOUND',
          message: `Workflow with ID ${id} not found`,
        },
      });
    }

    // 更新後のワークフローを取得
    const workflow = workflowModel.getWorkflowById(parseInt(id));

    res.json({
      success: true,
      data: workflow,
      message: 'Workflow updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * ワークフロー削除
 */
export async function deleteWorkflow(req, res, next) {
  try {
    const { id } = req.params;

    const success = workflowModel.deleteWorkflow(parseInt(id));

    if (!success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'WORKFLOW_NOT_FOUND',
          message: `Workflow with ID ${id} not found`,
        },
      });
    }

    res.json({
      success: true,
      message: 'Workflow deleted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * お気に入り切り替え
 */
export async function toggleFavorite(req, res, next) {
  try {
    const { id } = req.params;

    const workflow = workflowModel.getWorkflowById(parseInt(id));

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'WORKFLOW_NOT_FOUND',
          message: `Workflow with ID ${id} not found`,
        },
      });
    }

    const success = workflowModel.updateWorkflow(parseInt(id), {
      favorite: !workflow.favorite,
    });

    const updated = workflowModel.getWorkflowById(parseInt(id));

    res.json({
      success: true,
      data: updated,
      message: 'Favorite status updated',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * ワークフロー検索
 */
export async function searchWorkflows(req, res, next) {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_QUERY',
          message: 'Search query is required',
        },
      });
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
    };

    const result = workflowModel.searchWorkflows(q, options);

    res.json({
      success: true,
      data: result.workflows,
      pagination: result.pagination,
      query: q,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}
