import * as exportService from '../services/export.service.js';

/**
 * ワークフローをJSON形式でエクスポート
 */
export async function exportJSON(req, res, next) {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({
        success: false,
        error: { message: 'Workflow IDs are required' }
      });
    }

    // IDを配列に変換
    const workflowIds = Array.isArray(ids) ? ids.map(Number) : [Number(ids)];

    const data = await exportService.exportToJSON(workflowIds);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="workflows-export-${Date.now()}.json"`);
    res.json(data);

  } catch (error) {
    next(error);
  }
}

/**
 * ワークフローをZIP形式でエクスポート（画像を含む）
 */
export async function exportZIP(req, res, next) {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({
        success: false,
        error: { message: 'Workflow IDs are required' }
      });
    }

    // IDを配列に変換
    const workflowIds = Array.isArray(ids) ? ids.map(Number) : [Number(ids)];

    const archive = await exportService.exportToZIP(workflowIds);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="workflows-export-${Date.now()}.zip"`);

    // アーカイブをパイプ
    archive.pipe(res);

    // アーカイブを確定
    archive.finalize();

  } catch (error) {
    next(error);
  }
}

/**
 * 単一ワークフローをJSON形式でエクスポート
 */
export async function exportSingleJSON(req, res, next) {
  try {
    const { id } = req.params;

    const data = await exportService.exportSingleWorkflowJSON(parseInt(id));

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="workflow-${id}-${Date.now()}.json"`);
    res.json(data);

  } catch (error) {
    next(error);
  }
}
