/**
 * ComfyUI ワークフロー JSON 解析サービス
 * ComfyUIのワークフローJSONからプロンプトやメタデータを抽出
 */

// プロンプトを含むノードタイプ
const PROMPT_NODE_TYPES = [
  'CLIPTextEncode',
  'CLIPTextEncodeSDXL',
  'CLIPTextEncodeSDXLRefiner',
  'ConditioningCombine',
  'ConditioningConcat',
  'ConditioningAverage',
  'ConditioningSetArea',
];

// メタデータ関連ノードタイプ
const CHECKPOINT_NODE_TYPES = ['CheckpointLoaderSimple', 'CheckpointLoader'];
const SAMPLER_NODE_TYPES = ['KSampler', 'KSamplerAdvanced'];
const LATENT_NODE_TYPES = ['EmptyLatentImage', 'LatentUpscale'];
const VAE_NODE_TYPES = ['VAELoader', 'VAEDecode', 'VAEEncode'];

/**
 * ComfyUI JSONからプロンプト情報を抽出
 * @param {Object} workflowJson - ComfyUI ワークフローJSON
 * @returns {Array} プロンプト情報の配列
 */
export function extractPrompts(workflowJson) {
  const prompts = [];

  try {
    // ワークフローJSONをイテレート
    for (const [nodeId, nodeData] of Object.entries(workflowJson)) {
      // 数値キー以外はスキップ（nodes、linksなどのメタデータ）
      if (isNaN(nodeId)) continue;

      const classType = nodeData.class_type;

      // プロンプトノードの場合
      if (PROMPT_NODE_TYPES.includes(classType)) {
        const promptText = extractPromptText(nodeData);

        if (promptText) {
          const promptType = determinePromptType(nodeId, nodeData, workflowJson);

          prompts.push({
            nodeId,
            nodeType: classType,
            promptType,
            promptText: promptText.trim(),
          });
        }
      }
    }
  } catch (error) {
    console.error('Error extracting prompts:', error);
  }

  return prompts;
}

/**
 * ノードからプロンプトテキストを抽出
 * @param {Object} nodeData - ノードデータ
 * @returns {string|null} プロンプトテキスト
 */
function extractPromptText(nodeData) {
  const inputs = nodeData.inputs;

  if (!inputs) return null;

  // 一般的なテキスト入力フィールド
  if (inputs.text) return inputs.text;
  if (inputs.prompt) return inputs.prompt;
  if (inputs.positive) return inputs.positive;
  if (inputs.negative) return inputs.negative;

  return null;
}

/**
 * プロンプトがpositive/negativeのどちらかを判定
 * @param {string} nodeId - ノードID
 * @param {Object} nodeData - ノードデータ
 * @param {Object} workflowJson - 完全なワークフローJSON
 * @returns {string} 'positive' | 'negative' | 'unknown'
 */
function determinePromptType(nodeId, nodeData, workflowJson) {
  // タイトルから判定
  const title = nodeData._meta?.title?.toLowerCase() || '';
  if (title.includes('negative')) return 'negative';
  if (title.includes('positive')) return 'positive';

  // inputsの内容から判定
  const inputs = nodeData.inputs || {};
  if (inputs.negative !== undefined) return 'negative';
  if (inputs.positive !== undefined) return 'positive';

  // ノードの接続先を追跡して判定（高度な解析）
  const connections = findNodeConnections(nodeId, workflowJson);

  // KSamplerノードへの接続を確認
  for (const conn of connections) {
    const targetNode = workflowJson[conn.targetNodeId];
    if (targetNode && SAMPLER_NODE_TYPES.includes(targetNode.class_type)) {
      // サンプラーのnegative入力に接続されているか確認
      if (conn.targetInput === 'negative') return 'negative';
      if (conn.targetInput === 'positive') return 'positive';
    }
  }

  return 'unknown';
}

/**
 * ノードの接続情報を取得
 * @param {string} nodeId - ノードID
 * @param {Object} workflowJson - ワークフローJSON
 * @returns {Array} 接続情報の配列
 */
function findNodeConnections(nodeId, workflowJson) {
  const connections = [];

  for (const [targetNodeId, targetNodeData] of Object.entries(workflowJson)) {
    if (isNaN(targetNodeId)) continue;

    const inputs = targetNodeData.inputs || {};

    for (const [inputName, inputValue] of Object.entries(inputs)) {
      // 配列形式の接続: [sourceNodeId, sourceOutputIndex]
      if (Array.isArray(inputValue) && inputValue[0] === nodeId) {
        connections.push({
          targetNodeId,
          targetInput: inputName,
          sourceOutput: inputValue[1]
        });
      }
    }
  }

  return connections;
}

/**
 * ワークフローからメタデータを抽出
 * @param {Object} workflowJson - ComfyUI ワークフローJSON
 * @returns {Object} メタデータ
 */
export function extractMetadata(workflowJson) {
  const metadata = {
    models: [],
    samplers: [],
    dimensions: null,
    seed: null,
    steps: null,
    cfg: null,
    scheduler: null,
    vaes: [],
  };

  try {
    for (const [nodeId, nodeData] of Object.entries(workflowJson)) {
      if (isNaN(nodeId)) continue;

      const classType = nodeData.class_type;
      const inputs = nodeData.inputs || {};

      // チェックポイント/モデル情報
      if (CHECKPOINT_NODE_TYPES.includes(classType)) {
        if (inputs.ckpt_name) {
          metadata.models.push({
            type: 'checkpoint',
            name: inputs.ckpt_name,
            nodeId
          });
        }
      }

      // サンプラー情報
      if (SAMPLER_NODE_TYPES.includes(classType)) {
        metadata.samplers.push({
          sampler_name: inputs.sampler_name,
          scheduler: inputs.scheduler,
          nodeId
        });

        if (inputs.seed !== undefined) metadata.seed = inputs.seed;
        if (inputs.steps !== undefined) metadata.steps = inputs.steps;
        if (inputs.cfg !== undefined) metadata.cfg = inputs.cfg;
        if (inputs.scheduler !== undefined) metadata.scheduler = inputs.scheduler;
      }

      // 画像サイズ情報
      if (LATENT_NODE_TYPES.includes(classType)) {
        if (inputs.width && inputs.height) {
          metadata.dimensions = {
            width: inputs.width,
            height: inputs.height,
            nodeId
          };
        }
      }

      // VAE情報
      if (VAE_NODE_TYPES.includes(classType)) {
        if (inputs.vae_name) {
          metadata.vaes.push({
            name: inputs.vae_name,
            nodeId
          });
        }
      }
    }
  } catch (error) {
    console.error('Error extracting metadata:', error);
  }

  return metadata;
}

/**
 * ワークフローJSONの妥当性を検証
 * @param {Object} workflowJson - 検証するJSON
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validateWorkflowJson(workflowJson) {
  // 基本的な型チェック
  if (!workflowJson || typeof workflowJson !== 'object') {
    return { valid: false, error: 'Invalid JSON: not an object' };
  }

  // 空オブジェクトチェック
  if (Object.keys(workflowJson).length === 0) {
    return { valid: false, error: 'Invalid JSON: empty workflow' };
  }

  // ノードが存在するかチェック
  let hasNodes = false;
  for (const key of Object.keys(workflowJson)) {
    if (!isNaN(key)) {
      hasNodes = true;
      break;
    }
  }

  if (!hasNodes) {
    return { valid: false, error: 'Invalid JSON: no nodes found' };
  }

  // class_typeの存在をチェック
  for (const [nodeId, nodeData] of Object.entries(workflowJson)) {
    if (isNaN(nodeId)) continue;

    if (!nodeData.class_type) {
      return {
        valid: false,
        error: `Invalid node ${nodeId}: missing class_type`
      };
    }
  }

  return { valid: true, error: null };
}

/**
 * ワークフロー名を自動生成
 * @param {Object} workflowJson - ワークフローJSON
 * @returns {string} 生成された名前
 */
export function generateWorkflowName(workflowJson) {
  const metadata = extractMetadata(workflowJson);
  const timestamp = new Date().toISOString().split('T')[0];

  // モデル名があればそれをベースに
  if (metadata.models.length > 0) {
    const modelName = metadata.models[0].name
      .replace(/\.[^/.]+$/, '') // 拡張子削除
      .replace(/[_-]/g, ' '); // アンダースコアとハイフンをスペースに
    return `${modelName} - ${timestamp}`;
  }

  // なければデフォルト名
  return `Workflow - ${timestamp}`;
}
