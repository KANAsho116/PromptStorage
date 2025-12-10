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

function normalizeWorkflowJson(workflowJson) {
  const hasNumericKeys = Object.keys(workflowJson).some(key => !isNaN(key));
  if (hasNumericKeys) return workflowJson;
  if (workflowJson.nodes && Array.isArray(workflowJson.nodes)) {
    const normalized = {};
    for (const node of workflowJson.nodes) {
      normalized[String(node.id)] = {
        class_type: node.type,
        inputs: convertUIInputsToAPI(node),
        _meta: { title: node.title || node.type }
      };
    }
    return normalized;
  }
  return workflowJson;
}

function convertUIInputsToAPI(node) {
  const inputs = {};
  if (node.widgets_values && Array.isArray(node.widgets_values)) {
    if (node.type === 'CLIPTextEncode' && node.widgets_values.length > 0) {
      inputs.text = node.widgets_values[0];
    }
    if ((node.type === 'CheckpointLoaderSimple' || node.type === 'CheckpointLoader') && node.widgets_values.length > 0) {
      inputs.ckpt_name = node.widgets_values[0];
    }
    if ((node.type === 'KSampler' || node.type === 'KSamplerAdvanced') && node.widgets_values.length >= 5) {
      inputs.seed = node.widgets_values[0];
      inputs.steps = node.widgets_values[1];
      inputs.cfg = node.widgets_values[2];
      inputs.sampler_name = node.widgets_values[3];
      inputs.scheduler = node.widgets_values[4];
    }
    if (node.type === 'EmptyLatentImage' && node.widgets_values.length >= 2) {
      inputs.width = node.widgets_values[0];
      inputs.height = node.widgets_values[1];
    }
    if (node.type === 'VAELoader' && node.widgets_values.length > 0) {
      inputs.vae_name = node.widgets_values[0];
    }
  }
  if (node.inputs && Array.isArray(node.inputs)) {
    for (const input of node.inputs) {
      if (input.link !== null && input.link !== undefined) {
        inputs[input.name] = [String(input.link), 0];
      }
    }
  }
  return inputs;
}

export function extractPrompts(workflowJson) {
  const prompts = [];
  try {
    const normalizedJson = normalizeWorkflowJson(workflowJson);
    for (const [nodeId, nodeData] of Object.entries(normalizedJson)) {
      if (isNaN(nodeId)) continue;
      const classType = nodeData.class_type;
      if (PROMPT_NODE_TYPES.includes(classType)) {
        const promptText = extractPromptText(nodeData);
        if (promptText) {
          const promptType = determinePromptType(nodeId, nodeData, normalizedJson);
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
    const normalizedJson = normalizeWorkflowJson(workflowJson);
    for (const [nodeId, nodeData] of Object.entries(normalizedJson)) {
      if (isNaN(nodeId)) continue;
      const classType = nodeData.class_type;
      const inputs = nodeData.inputs || {};
      if (CHECKPOINT_NODE_TYPES.includes(classType)) {
        if (inputs.ckpt_name) {
          metadata.models.push({
            type: 'checkpoint',
            name: inputs.ckpt_name,
            nodeId
          });
        }
      }
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
      if (LATENT_NODE_TYPES.includes(classType)) {
        if (inputs.width && inputs.height) {
          metadata.dimensions = {
            width: inputs.width,
            height: inputs.height,
            nodeId
          };
        }
      }
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

export function validateWorkflowJson(workflowJson) {
  if (!workflowJson || typeof workflowJson !== 'object') {
    return { valid: false, error: 'Invalid JSON: not an object' };
  }
  if (Object.keys(workflowJson).length === 0) {
    return { valid: false, error: 'Invalid JSON: empty workflow' };
  }
  let hasNodes = false;
  for (const key of Object.keys(workflowJson)) {
    if (!isNaN(key)) {
      hasNodes = true;
      break;
    }
  }
  if (!hasNodes && workflowJson.nodes && Array.isArray(workflowJson.nodes) && workflowJson.nodes.length > 0) {
    hasNodes = true;
  }
  if (!hasNodes) {
    return { valid: false, error: 'Invalid JSON: no nodes found' };
  }
  const hasNumericKeys = Object.keys(workflowJson).some(key => !isNaN(key));
  if (hasNumericKeys) {
    for (const [nodeId, nodeData] of Object.entries(workflowJson)) {
      if (isNaN(nodeId)) continue;
      if (!nodeData.class_type) {
        return {
          valid: false,
          error: 'Invalid node ' + nodeId + ': missing class_type'
        };
      }
    }
  }
  if (workflowJson.nodes && Array.isArray(workflowJson.nodes)) {
    for (const node of workflowJson.nodes) {
      if (!node.type) {
        return {
          valid: false,
          error: 'Invalid node ' + node.id + ': missing type'
        };
      }
    }
  }
  return { valid: true, error: null };
}

export function generateWorkflowName(workflowJson) {
  const metadata = extractMetadata(workflowJson);
  const timestamp = new Date().toISOString().split('T')[0];
  if (metadata.models.length > 0) {
    const modelName = metadata.models[0].name
      .replace(/\.[^/.]+$/g, '')
      .replace(/[_-]/g, ' ');
    return modelName + ' - ' + timestamp;
  }
  return 'Workflow - ' + timestamp;
}
