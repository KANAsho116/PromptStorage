import db from '../config/database.js';

/**
 * ワークフローIDでメタデータを取得
 */
export function getByWorkflowId(workflowId) {
  const stmt = db.prepare(`
    SELECT * FROM metadata
    WHERE workflow_id = ?
    ORDER BY key ASC
  `);

  return stmt.all(workflowId);
}

/**
 * メタデータを作成
 */
export function createMetadata(data) {
  const { workflow_id, key, value } = data;

  const stmt = db.prepare(`
    INSERT INTO metadata (workflow_id, key, value)
    VALUES (?, ?, ?)
  `);

  const result = stmt.run(workflow_id, key, value);

  return {
    id: result.lastInsertRowid,
    workflow_id,
    key,
    value
  };
}

/**
 * メタデータを更新
 */
export function updateMetadata(id, data) {
  const { value } = data;

  const stmt = db.prepare(`
    UPDATE metadata
    SET value = ?
    WHERE id = ?
  `);

  stmt.run(value, id);

  return getById(id);
}

/**
 * IDでメタデータを取得
 */
export function getById(id) {
  const stmt = db.prepare('SELECT * FROM metadata WHERE id = ?');
  return stmt.get(id);
}

/**
 * メタデータを削除
 */
export function deleteMetadata(id) {
  const stmt = db.prepare('DELETE FROM metadata WHERE id = ?');
  stmt.run(id);
}

/**
 * ワークフローIDで全メタデータを削除
 */
export function deleteByWorkflowId(workflowId) {
  const stmt = db.prepare('DELETE FROM metadata WHERE workflow_id = ?');
  stmt.run(workflowId);
}
