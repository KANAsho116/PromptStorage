import * as tagModel from '../models/tag.model.js';

/**
 * 全タグを取得
 */
export async function getAllTags(req, res, next) {
  try {
    const tags = tagModel.getAllTags();

    res.json({
      success: true,
      data: tags,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * タグを作成
 */
export async function createTag(req, res, next) {
  try {
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_NAME',
          message: 'Tag name is required',
        },
      });
    }

    // 名前の重複チェック
    if (tagModel.isTagNameDuplicate(name)) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_TAG',
          message: `Tag with name "${name}" already exists`,
        },
      });
    }

    const tag = tagModel.createTag({ name, color });

    res.status(201).json({
      success: true,
      data: tag,
      message: 'Tag created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * タグを更新
 */
export async function updateTag(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body;

    // 名前の重複チェック（名前を変更する場合）
    if (updates.name && tagModel.isTagNameDuplicate(updates.name, parseInt(id))) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_TAG',
          message: `Tag with name "${updates.name}" already exists`,
        },
      });
    }

    const success = tagModel.updateTag(parseInt(id), updates);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TAG_NOT_FOUND',
          message: `Tag with ID ${id} not found`,
        },
      });
    }

    const tag = tagModel.getTagById(parseInt(id));

    res.json({
      success: true,
      data: tag,
      message: 'Tag updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * タグを削除
 */
export async function deleteTag(req, res, next) {
  try {
    const { id } = req.params;

    // 使用状況を確認
    const usageCount = tagModel.getTagUsageCount(parseInt(id));

    if (usageCount > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'TAG_IN_USE',
          message: `Tag is used by ${usageCount} workflow(s). Remove tag from workflows first.`,
        },
      });
    }

    const success = tagModel.deleteTag(parseInt(id));

    if (!success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TAG_NOT_FOUND',
          message: `Tag with ID ${id} not found`,
        },
      });
    }

    res.json({
      success: true,
      message: 'Tag deleted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}
