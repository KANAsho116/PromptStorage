import db from '../config/database.js';

/**
 * 画像をデータベースに保存
 * @param {number} workflowId - ワークフローID
 * @param {Object} imageData - 画像データ
 * @returns {number} 挿入されたID
 */
export function createImage(workflowId, imageData) {
  const result = db.prepare(`
    INSERT INTO images (
      workflow_id, file_path, file_name, file_size,
      mime_type, width, height, is_thumbnail
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    workflowId,
    imageData.filePath,
    imageData.fileName,
    imageData.fileSize,
    imageData.mimeType,
    imageData.width,
    imageData.height,
    imageData.isThumbnail ? 1 : 0
  );

  return result.lastInsertRowid;
}

/**
 * ワークフローの画像一覧を取得
 * @param {number} workflowId - ワークフローID
 * @returns {Array} 画像一覧
 */
export function getImagesByWorkflowId(workflowId) {
  return db.prepare(`
    SELECT * FROM images WHERE workflow_id = ?
  `).all(workflowId);
}

/**
 * 画像IDで取得
 * @param {number} id - 画像ID
 * @returns {Object|null} 画像情報
 */
export function getImageById(id) {
  return db.prepare(`
    SELECT * FROM images WHERE id = ?
  `).get(id);
}

/**
 * 画像を削除
 * @param {number} id - 画像ID
 * @returns {boolean} 成功したかどうか
 */
export function deleteImage(id) {
  const result = db.prepare('DELETE FROM images WHERE id = ?').run(id);
  return result.changes > 0;
}

/**
 * ワークフローの全画像を削除
 * @param {number} workflowId - ワークフローID
 * @returns {boolean} 成功したかどうか
 */
export function deleteImagesByWorkflowId(workflowId) {
  const result = db.prepare('DELETE FROM images WHERE workflow_id = ?').run(workflowId);
  return result.changes > 0;
}
