import db from '../config/database.js';

/**
 * ワークフローIDでプロンプトを取得
 * @param {number} workflowId - ワークフローID
 * @returns {Array} プロンプト一覧
 */
export function getByWorkflowId(workflowId) {
  return db.prepare(`
    SELECT * FROM prompts WHERE workflow_id = ?
    ORDER BY id ASC
  `).all(workflowId);
}

/**
 * プロンプトを作成
 * @param {Object} promptData - プロンプト情報
 * @returns {Object} 作成されたプロンプト
 */
export function createPrompt(promptData) {
  const { workflow_id, node_id, node_type, prompt_type, prompt_text } = promptData;

  const result = db.prepare(`
    INSERT INTO prompts (workflow_id, node_id, node_type, prompt_type, prompt_text)
    VALUES (?, ?, ?, ?, ?)
  `).run(workflow_id, node_id, node_type || null, prompt_type || null, prompt_text);

  return {
    id: result.lastInsertRowid,
    ...promptData
  };
}

/**
 * プロンプトを更新
 * @param {number} id - プロンプトID
 * @param {Object} updates - 更新内容
 * @returns {boolean} 成功したかどうか
 */
export function updatePrompt(id, updates) {
  const fields = [];
  const values = [];

  const allowedFields = ['node_type', 'prompt_type', 'prompt_text'];

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) return false;

  const query = `UPDATE prompts SET ${fields.join(', ')} WHERE id = ?`;
  const result = db.prepare(query).run(...values, id);

  return result.changes > 0;
}

/**
 * プロンプトを削除
 * @param {number} id - プロンプトID
 * @returns {boolean} 成功したかどうか
 */
export function deletePrompt(id) {
  const result = db.prepare('DELETE FROM prompts WHERE id = ?').run(id);
  return result.changes > 0;
}

/**
 * ワークフローIDで全プロンプトを削除
 * @param {number} workflowId - ワークフローID
 * @returns {number} 削除された行数
 */
export function deleteByWorkflowId(workflowId) {
  const result = db.prepare('DELETE FROM prompts WHERE workflow_id = ?').run(workflowId);
  return result.changes;
}
