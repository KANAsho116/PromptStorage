import db from '../config/database.js';

/**
 * 全タグを取得
 * @returns {Array} タグ一覧
 */
export function getAllTags() {
  return db.prepare(`
    SELECT t.*, COUNT(wt.workflow_id) as workflow_count
    FROM tags t
    LEFT JOIN workflow_tags wt ON t.id = wt.tag_id
    GROUP BY t.id
    ORDER BY t.name ASC
  `).all();
}

/**
 * タグIDで取得
 * @param {number} id - タグID
 * @returns {Object|null} タグ情報
 */
export function getTagById(id) {
  return db.prepare(`
    SELECT * FROM tags WHERE id = ?
  `).get(id);
}

/**
 * タグ名で取得
 * @param {string} name - タグ名
 * @returns {Object|null} タグ情報
 */
export function getTagByName(name) {
  return db.prepare(`
    SELECT * FROM tags WHERE name = ?
  `).get(name);
}

/**
 * タグを作成
 * @param {Object} tagData - タグ情報
 * @returns {Object} 作成されたタグ
 */
export function createTag(tagData) {
  const result = db.prepare(`
    INSERT INTO tags (name, color)
    VALUES (?, ?)
  `).run(tagData.name, tagData.color || null);

  return {
    id: result.lastInsertRowid,
    ...tagData,
  };
}

/**
 * タグを更新
 * @param {number} id - タグID
 * @param {Object} updates - 更新内容
 * @returns {boolean} 成功したかどうか
 */
export function updateTag(id, updates) {
  const fields = [];
  const values = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.color !== undefined) {
    fields.push('color = ?');
    values.push(updates.color);
  }

  if (fields.length === 0) return false;

  const query = `UPDATE tags SET ${fields.join(', ')} WHERE id = ?`;
  const result = db.prepare(query).run(...values, id);

  return result.changes > 0;
}

/**
 * タグを削除
 * @param {number} id - タグID
 * @returns {boolean} 成功したかどうか
 */
export function deleteTag(id) {
  const result = db.prepare('DELETE FROM tags WHERE id = ?').run(id);
  return result.changes > 0;
}

/**
 * タグ名の重複チェック
 * @param {string} name - タグ名
 * @param {number|null} excludeId - 除外するID（更新時）
 * @returns {boolean} 重複しているかどうか
 */
export function isTagNameDuplicate(name, excludeId = null) {
  let query = 'SELECT COUNT(*) as count FROM tags WHERE name = ?';
  const params = [name];

  if (excludeId) {
    query += ' AND id != ?';
    params.push(excludeId);
  }

  const result = db.prepare(query).get(...params);
  return result.count > 0;
}

/**
 * タグ使用状況を取得
 * @param {number} id - タグID
 * @returns {number} 使用されているワークフロー数
 */
export function getTagUsageCount(id) {
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM workflow_tags WHERE tag_id = ?
  `).get(id);
  return result.count;
}
