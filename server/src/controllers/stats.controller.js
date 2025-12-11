import db from '../config/database.js';

/**
 * Get statistics for the dashboard
 */
export async function getStats(req, res, next) {
  try {
    // Total counts
    const totalWorkflows = db.prepare('SELECT COUNT(*) as count FROM workflows').get().count;
    const totalPrompts = db.prepare('SELECT COUNT(*) as count FROM prompts').get().count;
    const totalImages = db.prepare('SELECT COUNT(*) as count FROM images').get().count;
    const totalTags = db.prepare('SELECT COUNT(*) as count FROM tags').get().count;
    const favoriteCount = db.prepare('SELECT COUNT(*) as count FROM workflows WHERE favorite = 1').get().count;

    // Model usage (from metadata)
    const modelUsage = db.prepare(`
      SELECT value as model, COUNT(*) as count
      FROM metadata
      WHERE key = 'checkpoint' OR key = 'model' OR key LIKE '%model%'
      GROUP BY value
      ORDER BY count DESC
      LIMIT 10
    `).all();

    // Tag distribution
    const tagDistribution = db.prepare(`
      SELECT t.name, t.color, COUNT(wt.workflow_id) as count
      FROM tags t
      LEFT JOIN workflow_tags wt ON t.id = wt.tag_id
      GROUP BY t.id
      ORDER BY count DESC
      LIMIT 10
    `).all();

    // Prompt type distribution
    const promptTypes = db.prepare(`
      SELECT prompt_type as type, COUNT(*) as count
      FROM prompts
      GROUP BY prompt_type
      ORDER BY count DESC
    `).all();

    // Monthly creation timeline (last 12 months)
    const timeline = db.prepare(`
      SELECT
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count
      FROM workflows
      WHERE created_at >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month ASC
    `).all();

    // Size distribution (from metadata)
    const sizeDistribution = db.prepare(`
      SELECT
        CASE
          WHEN CAST(value AS INTEGER) <= 512 THEN '512以下'
          WHEN CAST(value AS INTEGER) <= 768 THEN '513-768'
          WHEN CAST(value AS INTEGER) <= 1024 THEN '769-1024'
          WHEN CAST(value AS INTEGER) <= 1536 THEN '1025-1536'
          ELSE '1537以上'
        END as range,
        COUNT(*) as count
      FROM metadata
      WHERE key = 'width' OR key = 'height'
      GROUP BY range
      ORDER BY count DESC
    `).all();

    // Recent activity (last 7 days)
    const recentActivity = db.prepare(`
      SELECT COUNT(*) as count
      FROM workflows
      WHERE created_at >= date('now', '-7 days')
    `).get().count;

    // Sampler usage (from metadata)
    const samplerUsage = db.prepare(`
      SELECT value as sampler, COUNT(*) as count
      FROM metadata
      WHERE key = 'sampler' OR key = 'sampler_name'
      GROUP BY value
      ORDER BY count DESC
      LIMIT 10
    `).all();

    res.json({
      success: true,
      data: {
        summary: {
          totalWorkflows,
          totalPrompts,
          totalImages,
          totalTags,
          favoriteCount,
          recentActivity,
        },
        modelUsage,
        tagDistribution,
        promptTypes,
        timeline,
        sizeDistribution,
        samplerUsage,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}
