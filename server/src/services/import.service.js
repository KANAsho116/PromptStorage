import AdmZip from 'adm-zip';
import * as workflowModel from '../models/workflow.model.js';
import * as promptModel from '../models/prompt.model.js';
import * as imageModel from '../models/image.model.js';
import * as tagModel from '../models/tag.model.js';
import * as metadataModel from '../models/metadata.model.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

/**
 * 重複するワークフロー名をチェック
 */
function checkDuplicateName(name) {
  try {
    const existing = workflowModel.getByName(name);
    return existing !== null;
  } catch {
    return false;
  }
}

/**
 * ユニークな名前を生成（重複時）
 */
function generateUniqueName(baseName) {
  let counter = 1;
  let newName = baseName;

  while (checkDuplicateName(newName)) {
    newName = `${baseName} (${counter})`;
    counter++;
  }

  return newName;
}

/**
 * JSON形式からワークフローをインポート
 * @param {Object} data - インポートするJSONデータ
 * @param {string} duplicateAction - 重複時の処理 ('skip', 'rename', 'overwrite')
 */
export async function importFromJSON(data, duplicateAction = 'rename') {
  const results = {
    success: [],
    skipped: [],
    errors: []
  };

  // データ形式検証
  if (!data.workflows && !data.workflow) {
    throw new Error('Invalid import data format');
  }

  const workflows = data.workflows || [data.workflow];

  for (const workflowData of workflows) {
    try {
      const { workflow, prompts, images, tags, metadata } = workflowData;

      // 重複チェック
      const isDuplicate = checkDuplicateName(workflow.name);

      if (isDuplicate) {
        if (duplicateAction === 'skip') {
          results.skipped.push({
            name: workflow.name,
            reason: 'Duplicate name'
          });
          continue;
        } else if (duplicateAction === 'rename') {
          workflow.name = generateUniqueName(workflow.name);
        } else if (duplicateAction === 'overwrite') {
          // 既存のワークフローを削除
          const existing = workflowModel.getByName(workflow.name);
          workflowModel.deleteWorkflow(existing.id);
        }
      }

      // ワークフローを作成（IDは除外）
      const { id, created_at, updated_at, ...workflowWithoutId } = workflow;
      const newWorkflow = workflowModel.createWorkflow(workflowWithoutId);

      // プロンプトをインポート
      if (prompts && prompts.length > 0) {
        for (const prompt of prompts) {
          const { id, workflow_id, created_at, ...promptData } = prompt;
          promptModel.createPrompt({
            ...promptData,
            workflow_id: newWorkflow.id
          });
        }
      }

      // タグをインポート（既存のタグを再利用、新規作成）
      if (tags && tags.length > 0) {
        const tagIds = [];
        for (const tag of tags) {
          let existingTag = tagModel.getByName(tag.name);
          if (!existingTag) {
            existingTag = tagModel.createTag({
              name: tag.name,
              color: tag.color
            });
          }
          tagIds.push(existingTag.id);
        }
        // ワークフローにタグを関連付け
        workflowModel.updateWorkflowTags(newWorkflow.id, tagIds);
      }

      // メタデータをインポート
      if (metadata && metadata.length > 0) {
        for (const meta of metadata) {
          const { id, workflow_id, ...metaData } = meta;
          metadataModel.createMetadata({
            ...metaData,
            workflow_id: newWorkflow.id
          });
        }
      }

      results.success.push({
        id: newWorkflow.id,
        name: newWorkflow.name,
        original_name: workflow.name
      });

    } catch (error) {
      results.errors.push({
        name: workflowData.workflow?.name || 'Unknown',
        error: error.message
      });
    }
  }

  return results;
}

/**
 * ZIP形式からワークフローをインポート（画像を含む）
 */
export async function importFromZIP(zipBuffer, duplicateAction = 'rename') {
  const zip = new AdmZip(zipBuffer);
  const zipEntries = zip.getEntries();

  // workflows.jsonを探す
  const jsonEntry = zipEntries.find(entry => entry.entryName === 'workflows.json');
  if (!jsonEntry) {
    throw new Error('Invalid ZIP file: workflows.json not found');
  }

  const jsonData = JSON.parse(jsonEntry.getData().toString('utf8'));

  // 画像ファイルのマッピング（workflow_id -> 画像エントリ配列）
  const imageEntries = {};
  for (const entry of zipEntries) {
    const match = entry.entryName.match(/^images\/workflow_(\d+)\/(.+)$/);
    if (match) {
      const workflowId = match[1];
      if (!imageEntries[workflowId]) {
        imageEntries[workflowId] = [];
      }
      imageEntries[workflowId].push({
        entry,
        filename: match[2]
      });
    }
  }

  // JSONデータをインポート
  const results = await importFromJSON(jsonData, duplicateAction);

  // 成功したワークフローの画像をインポート
  for (const successItem of results.success) {
    const oldWorkflowId = jsonData.workflows.findIndex(
      w => w.workflow.name === successItem.original_name
    );

    if (oldWorkflowId === -1 || !imageEntries[oldWorkflowId + 1]) {
      continue;
    }

    const images = imageEntries[oldWorkflowId + 1];

    for (const { entry, filename } of images) {
      try {
        // 画像データを取得
        const imageBuffer = entry.getData();

        // ファイルを保存
        const timestamp = Date.now();
        const savedFilename = `${timestamp}_${filename}`;
        const filePath = path.join(UPLOAD_DIR, savedFilename);

        await fs.writeFile(filePath, imageBuffer);

        // データベースに登録
        const isThumbnail = filename.includes('thumb_');
        imageModel.createImage({
          workflow_id: successItem.id,
          file_path: filePath,
          file_name: filename,
          file_size: imageBuffer.length,
          mime_type: getMimeType(filename),
          is_thumbnail: isThumbnail ? 1 : 0
        });

      } catch (error) {
        console.error(`Failed to import image ${filename}:`, error);
      }
    }
  }

  return results;
}

/**
 * ファイル拡張子からMIMEタイプを取得
 */
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}
