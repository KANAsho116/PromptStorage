import db from '../config/database.js';

// Initialize collections tables
export function initializeCollectionTables() {
  // Collections table
  db.exec(`
    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      color VARCHAR(7) DEFAULT '#3B82F6',
      icon VARCHAR(50) DEFAULT 'folder',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Junction table for workflow-collection relationship
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_collections (
      workflow_id INTEGER NOT NULL,
      collection_id INTEGER NOT NULL,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (workflow_id, collection_id),
      FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
      FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
    );
  `);

  // Indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_collections_name ON collections(name);
    CREATE INDEX IF NOT EXISTS idx_workflow_collections_workflow ON workflow_collections(workflow_id);
    CREATE INDEX IF NOT EXISTS idx_workflow_collections_collection ON workflow_collections(collection_id);
  `);

  console.log('✅ Collections tables initialized');
}

// Initialize on module load
try {
  initializeCollectionTables();
} catch (e) {
  // Tables may already exist
}

class CollectionModel {
  /**
   * Create a new collection
   */
  static create({ name, description = '', color = '#3B82F6', icon = 'folder' }) {
    const stmt = db.prepare(`
      INSERT INTO collections (name, description, color, icon)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(name, description, color, icon);
    return this.findById(result.lastInsertRowid);
  }

  /**
   * Get all collections with workflow counts
   */
  static findAll() {
    const stmt = db.prepare(`
      SELECT
        c.*,
        COUNT(wc.workflow_id) as workflow_count
      FROM collections c
      LEFT JOIN workflow_collections wc ON c.id = wc.collection_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `);
    return stmt.all();
  }

  /**
   * Find collection by ID
   */
  static findById(id) {
    const stmt = db.prepare(`
      SELECT
        c.*,
        COUNT(wc.workflow_id) as workflow_count
      FROM collections c
      LEFT JOIN workflow_collections wc ON c.id = wc.collection_id
      WHERE c.id = ?
      GROUP BY c.id
    `);
    return stmt.get(id);
  }

  /**
   * Update collection
   */
  static update(id, { name, description, color, icon }) {
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (color !== undefined) {
      updates.push('color = ?');
      values.push(color);
    }
    if (icon !== undefined) {
      updates.push('icon = ?');
      values.push(icon);
    }

    if (updates.length === 0) return this.findById(id);

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE collections SET ${updates.join(', ')} WHERE id = ?
    `);
    stmt.run(...values);
    return this.findById(id);
  }

  /**
   * Delete collection
   */
  static delete(id) {
    const stmt = db.prepare('DELETE FROM collections WHERE id = ?');
    return stmt.run(id);
  }

  /**
   * Add workflow to collection
   */
  static addWorkflow(collectionId, workflowId) {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO workflow_collections (collection_id, workflow_id)
      VALUES (?, ?)
    `);
    return stmt.run(collectionId, workflowId);
  }

  /**
   * Remove workflow from collection
   */
  static removeWorkflow(collectionId, workflowId) {
    const stmt = db.prepare(`
      DELETE FROM workflow_collections
      WHERE collection_id = ? AND workflow_id = ?
    `);
    return stmt.run(collectionId, workflowId);
  }

  /**
   * Get workflows in a collection
   */
  static getWorkflows(collectionId) {
    const stmt = db.prepare(`
      SELECT w.id, w.name, w.description, w.favorite, w.created_at
      FROM workflows w
      JOIN workflow_collections wc ON w.id = wc.workflow_id
      WHERE wc.collection_id = ?
      ORDER BY wc.added_at DESC
    `);
    return stmt.all(collectionId);
  }

  /**
   * Get collections for a workflow
   */
  static getWorkflowCollections(workflowId) {
    const stmt = db.prepare(`
      SELECT c.*
      FROM collections c
      JOIN workflow_collections wc ON c.id = wc.collection_id
      WHERE wc.workflow_id = ?
    `);
    return stmt.all(workflowId);
  }

  /**
   * Add multiple workflows to collection
   */
  static addWorkflows(collectionId, workflowIds) {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO workflow_collections (collection_id, workflow_id)
      VALUES (?, ?)
    `);
    const transaction = db.transaction((ids) => {
      for (const id of ids) {
        stmt.run(collectionId, id);
      }
    });
    transaction(workflowIds);
  }
}

export default CollectionModel;
