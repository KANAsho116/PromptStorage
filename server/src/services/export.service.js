import archiver from 'archiver';
import * as workflowModel from '../models/workflow.model.js';
import * as promptModel from '../models/prompt.model.js';
import * as imageModel from '../models/image.model.js';
import * as tagModel from '../models/tag.model.js';
import * as metadataModel from '../models/metadata.model.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * ワークフローの完全なデータを取得（関連データを含む）
 */
export async function getWorkflowWithRelations(workflowId) {
  const workflow = workflowModel.getById(workflowId);
  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowId}`);
  }

  const prompts = promptModel.getByWorkflowId(workflowId);
  const images = imageModel.getByWorkflowId(workflowId);
  const tags = tagModel.getTagsByWorkflowId(workflowId);
  const metadata = metadataModel.getByWorkflowId(workflowId);

  return {
    workflow,
    prompts,
    images: images.map(img => ({
      ...img,
      // ファイルパスは相対パスに変換（実際のファイルは別途処理）
      file_path: path.basename(img.file_path)
    })),
    tags,
    metadata
  };
}

/**
 * JSON形式でワークフローをエクスポート
 */
export async function exportToJSON(workflowIds) {
  const workflows = await Promise.all(
    workflowIds.map(id => getWorkflowWithRelations(id))
  );

  return {
    version: '1.0.0',
    exported_at: new Date().toISOString(),
    workflows
  };
}

/**
 * ZIP形式でワークフローをエクスポート（画像を含む）
 * @param {number[]} workflowIds - エクスポートするワークフローのID配列
 * @returns {Promise<archiver.Archiver>} - ZIP archiveストリーム
 */
export async function exportToZIP(workflowIds) {
  const archive = archiver('zip', {
    zlib: { level: 9 } // 最大圧縮
  });

  // エラーハンドリング
  archive.on('error', (err) => {
    throw err;
  });

  // JSON データを追加
  const jsonData = await exportToJSON(workflowIds);
  archive.append(JSON.stringify(jsonData, null, 2), { name: 'workflows.json' });

  // 各ワークフローの画像を追加
  for (const workflowId of workflowIds) {
    const images = imageModel.getByWorkflowId(workflowId);

    for (const image of images) {
      try {
        // 画像ファイルが存在するか確認
        await fs.access(image.file_path);

        // ZIP内のパス: images/workflow_{id}/filename
        const zipPath = `images/workflow_${workflowId}/${path.basename(image.file_path)}`;
        archive.file(image.file_path, { name: zipPath });
      } catch (error) {
        console.warn(`Image file not found: ${image.file_path}`);
        // ファイルが見つからない場合はスキップ
      }
    }
  }

  return archive;
}

/**
 * 単一ワークフローのJSON形式エクスポート
 */
export async function exportSingleWorkflowJSON(workflowId) {
  const data = await getWorkflowWithRelations(workflowId);
  return {
    version: '1.0.0',
    exported_at: new Date().toISOString(),
    workflow: data
  };
}
