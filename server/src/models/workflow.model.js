import db from '../config/database.js';

/**
 * ワークフローモデル - データベース操作
 */

/**
 * 新しいワークフローを作成
 * @param {Object} workflow - ワークフロー情報
 * @param {Array} prompts - プロンプト情報
 * @param {Array} metadata - メタデータ
 * @returns {Object} 作成されたワークフロー
 */
export function createWorkflow(workflow, prompts = [], metadata = {}) {
  const transaction = db.transaction(() => {
    // ワークフロー作成
    const result = db.prepare(`
      INSERT INTO workflows (name, description, workflow_json, category, favorite)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      workflow.name,
      workflow.description || null,
      JSON.stringify(workflow.workflow_json),
      workflow.category || null,
      workflow.favorite ? 1 : 0
    );

    const workflowId = result.lastInsertRowid;

    // プロンプト保存
    if (prompts.length > 0) {
      const insertPrompt = db.prepare(`
        INSERT INTO prompts (workflow_id, node_id, node_type, prompt_type, prompt_text)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const prompt of prompts) {
        insertPrompt.run(
          workflowId,
          prompt.nodeId,
          prompt.nodeType,
          prompt.promptType,
          prompt.promptText
        );
      }
    }

    // メタデータ保存
    if (metadata && Object.keys(metadata).length > 0) {
      const insertMetadata = db.prepare(`
        INSERT INTO metadata (workflow_id, key, value)
        VALUES (?, ?, ?)
      `);

      for (const [key, value] of Object.entries(metadata)) {
        insertMetadata.run(
          workflowId,
          key,
          typeof value === 'object' ? JSON.stringify(value) : String(value)
        );
      }
    }

    return { id: workflowId, ...workflow };
  });

  return transaction();
}

/**
 * ワークフロー一覧取得（ページネーション対応）
 * @param {Object} options - クエリオプション
 * @returns {Object} { workflows, pagination }
 */
export function getWorkflows(options = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'created_at',
    order = 'DESC',
    category = null,
    favorite = null,
  } = options;

  const offset = (page - 1) * limit;
  const validSortColumns = ['created_at', 'updated_at', 'name', 'favorite'];
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
  const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  // WHERE句の構築
  const conditions = [];
  const params = [];

  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }

  if (favorite !== null) {
    conditions.push('favorite = ?');
    params.push(favorite ? 1 : 0);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // 総件数取得
  const countQuery = `SELECT COUNT(*) as count FROM workflows ${whereClause}`;
  const totalCount = db.prepare(countQuery).get(...params).count;

  // ワークフロー取得
  const query = `
    SELECT id, name, description, category, favorite, created_at, updated_at
    FROM workflows
    ${whereClause}
    ORDER BY ${sortColumn} ${sortOrder}
    LIMIT ? OFFSET ?
  `;

  const workflows = db.prepare(query).all(...params, limit, offset);

  // 各ワークフローのプロンプト数とタグを取得
  const enrichWorkflows = workflows.map(workflow => {
    const promptCount = db.prepare(
      'SELECT COUNT(*) as count FROM prompts WHERE workflow_id = ?'
    ).get(workflow.id).count;

    const tags = db.prepare(`
      SELECT t.id, t.name, t.color
      FROM tags t
      JOIN workflow_tags wt ON t.id = wt.tag_id
      WHERE wt.workflow_id = ?
    `).all(workflow.id);

    return {
      ...workflow,
      promptCount,
      tags,
      favorite: Boolean(workflow.favorite),
    };
  });

  return {
    workflows: enrichWorkflows,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrev: page > 1,
    },
  };
}

/**
 * 特定のワークフローを取得
 * @param {number} id - ワークフローID
 * @returns {Object|null} ワークフロー情報
 */
export function getWorkflowById(id) {
  const workflow = db.prepare(`
    SELECT * FROM workflows WHERE id = ?
  `).get(id);

  if (!workflow) return null;

  // プロンプト取得
  const prompts = db.prepare(`
    SELECT * FROM prompts WHERE workflow_id = ?
  `).all(id);

  // タグ取得
  const tags = db.prepare(`
    SELECT t.* FROM tags t
    JOIN workflow_tags wt ON t.id = wt.tag_id
    WHERE wt.workflow_id = ?
  `).all(id);

  // 画像取得
  const images = db.prepare(`
    SELECT * FROM images WHERE workflow_id = ?
  `).all(id);

  // メタデータ取得
  const metadataRows = db.prepare(`
    SELECT key, value FROM metadata WHERE workflow_id = ?
  `).all(id);

  const metadata = {};
  for (const row of metadataRows) {
    try {
      metadata[row.key] = JSON.parse(row.value);
    } catch {
      metadata[row.key] = row.value;
    }
  }

  return {
    ...workflow,
    workflow_json: JSON.parse(workflow.workflow_json),
    prompts,
    tags,
    images,
    metadata,
    favorite: Boolean(workflow.favorite),
  };
}

/**
 * ワークフローを更新
 * @param {number} id - ワークフローID
 * @param {Object} updates - 更新内容
 * @returns {boolean} 成功したかどうか
 */
export function updateWorkflow(id, updates) {
  const allowedFields = ['name', 'description', 'category', 'favorite'];
  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = ?`);
      values.push(key === 'favorite' ? (value ? 1 : 0) : value);
    }
  }

  if (fields.length === 0) return false;

  const query = `UPDATE workflows SET ${fields.join(', ')} WHERE id = ?`;
  const result = db.prepare(query).run(...values, id);

  return result.changes > 0;
}

/**
 * ワークフローを削除
 * @param {number} id - ワークフローID
 * @returns {boolean} 成功したかどうか
 */
export function deleteWorkflow(id) {
  const result = db.prepare('DELETE FROM workflows WHERE id = ?').run(id);
  return result.changes > 0;
}

/**
 * ワークフローにタグを追加
 * @param {number} workflowId - ワークフローID
 * @param {Array<number>} tagIds - タグIDの配列
 */
export function addTagsToWorkflow(workflowId, tagIds) {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO workflow_tags (workflow_id, tag_id)
    VALUES (?, ?)
  `);

  const transaction = db.transaction((ids) => {
    for (const tagId of ids) {
      insert.run(workflowId, tagId);
    }
  });

  transaction(tagIds);
}

/**
 * ワークフローからタグを削除
 * @param {number} workflowId - ワークフローID
 * @param {Array<number>} tagIds - タグIDの配列
 */
export function removeTagsFromWorkflow(workflowId, tagIds) {
  const deleteStmt = db.prepare(`
    DELETE FROM workflow_tags
    WHERE workflow_id = ? AND tag_id = ?
  `);

  const transaction = db.transaction((ids) => {
    for (const tagId of ids) {
      deleteStmt.run(workflowId, tagId);
    }
  });

  transaction(tagIds);
}

/**
 * 全文検索（プロンプト内容）
 * @param {string} query - 検索クエリ
 * @param {Object} options - ページネーションオプション
 * @returns {Object} 検索結果
 */
export function searchWorkflows(query, options = {}) {
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  // FTS5で検索
  const searchQuery = `
    SELECT DISTINCT w.*,
           snippet(prompts_fts, 0, '<mark>', '</mark>', '...', 64) as snippet
    FROM workflows w
    JOIN prompts p ON w.id = p.workflow_id
    JOIN prompts_fts ON prompts_fts.rowid = p.id
    WHERE prompts_fts MATCH ?
    ORDER BY w.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const workflows = db.prepare(searchQuery).all(query, limit, offset);

  // 総件数
  const countQuery = `
    SELECT COUNT(DISTINCT w.id) as count
    FROM workflows w
    JOIN prompts p ON w.id = p.workflow_id
    JOIN prompts_fts ON prompts_fts.rowid = p.id
    WHERE prompts_fts MATCH ?
  `;
  const totalCount = db.prepare(countQuery).get(query).count;

  return {
    workflows: workflows.map(w => ({ ...w, favorite: Boolean(w.favorite) })),
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}

/**
 * 名前の重複チェック
 * @param {string} name - ワークフロー名
 * @param {number|null} excludeId - 除外するID（更新時）
 * @returns {boolean} 重複しているかどうか
 */
export function isNameDuplicate(name, excludeId = null) {
  let query = 'SELECT COUNT(*) as count FROM workflows WHERE name = ?';
  const params = [name];

  if (excludeId) {
    query += ' AND id != ?';
    params.push(excludeId);
  }

  const result = db.prepare(query).get(...params);
  return result.count > 0;
}

/**
 * 名前でワークフローを取得
 * @param {string} name - ワークフロー名
 * @returns {Object|null} ワークフロー情報
 */
export function getByName(name) {
  const workflow = db.prepare('SELECT * FROM workflows WHERE name = ?').get(name);
  return workflow || null;
}

/**
 * IDでワークフローを取得（シンプル版）
 * @param {number} id - ワークフローID
 * @returns {Object|null} ワークフロー情報
 */
export function getById(id) {
  return db.prepare('SELECT * FROM workflows WHERE id = ?').get(id) || null;
}

/**
 * ワークフローのタグを更新（既存タグを置き換え）
 * @param {number} workflowId - ワークフローID
 * @param {Array<number>} tagIds - タグIDの配列
 */
export function updateWorkflowTags(workflowId, tagIds) {
  const transaction = db.transaction(() => {
    // 既存のタグを削除
    db.prepare('DELETE FROM workflow_tags WHERE workflow_id = ?').run(workflowId);

    // 新しいタグを追加
    if (tagIds.length > 0) {
      const insert = db.prepare(`
        INSERT INTO workflow_tags (workflow_id, tag_id)
        VALUES (?, ?)
      `);

      for (const tagId of tagIds) {
        insert.run(workflowId, tagId);
      }
    }
  });

  transaction();
}
