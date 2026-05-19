// 产品资料字段定义。
// 这里描述的是“单条产品资料记录”的最小结构，不依赖任何第三方库。

const ALLOWED_FILE_TYPES = ["pdf", "image", "manual", "document", "audio", "other"];

const productAssetSchema = {
  // 产品型号。允许为 unknown_model，表示当前资料还无法识别准确型号。
  product_model: {
    type: "string",
    required: true,
    allowValues: ["unknown_model"],
    description: "产品型号或占位值 unknown_model",
  },
  // 产品名称。用于列表展示、搜索和人工识别。
  product_name: {
    type: "string",
    required: true,
    description: "产品名称",
  },
  // 产品分类。用于后续分类筛选和资料聚合。
  category: {
    type: "string",
    required: true,
    description: "产品分类",
  },
  // 原始资料文件名。应尽量保留来源文件名，便于溯源。
  file_name: {
    type: "string",
    required: true,
    description: "原始资料文件名",
  },
  // 当前记录的主文件类型。限制在最小枚举集合内。
  file_type: {
    type: "string",
    required: true,
    enum: ALLOWED_FILE_TYPES,
    description: "主文件类型：pdf / image / manual / document / other",
  },
  // PDF 资料链接数组，例如规格书、宣传册、目录。
  pdf_links: {
    type: "array",
    required: true,
    description: "PDF 资料链接数组",
  },
  // 图片链接数组，例如主图、细节图、应用图。
  image_links: {
    type: "array",
    required: true,
    description: "图片链接数组",
  },
  // 说明文档链接数组，例如手册、安装说明、维护文档。
  manual_links: {
    type: "array",
    required: true,
    description: "说明文档链接数组",
  },
  // 来源页面地址。用于回溯和人工校验。
  source_url: {
    type: "string",
    required: true,
    description: "来源页面 URL",
  },
  // 资料描述。当前阶段没有可靠文案时可写待确认说明。
  description: {
    type: "string",
    required: false,
    description: "资料描述",
  },
  // 备注。用于记录无法识别型号、来源异常、待复核信息。
  remarks: {
    type: "string",
    required: false,
    description: "备注信息",
  },
  // 创建时间。建议使用 ISO 8601 字符串。
  created_at: {
    type: "string",
    required: true,
    description: "创建时间",
  },
  // 更新时间。建议使用 ISO 8601 字符串。
  updated_at: {
    type: "string",
    required: true,
    description: "更新时间",
  },
};

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateProductAsset(asset) {
  const errors = [];

  if (!asset || typeof asset !== "object" || Array.isArray(asset)) {
    return {
      valid: false,
      errors: ["asset 必须是对象"],
    };
  }

  if (!hasOwn(asset, "product_model")) {
    errors.push("缺少 product_model 字段");
  } else if (!isNonEmptyString(asset.product_model)) {
    errors.push("product_model 必须是非空字符串，无法识别时请使用 unknown_model");
  }

  if (!isNonEmptyString(asset.file_name)) {
    errors.push("file_name 必须存在且为非空字符串");
  }

  if (!isNonEmptyString(asset.file_type)) {
    errors.push("file_type 必须存在且为非空字符串");
  } else if (!ALLOWED_FILE_TYPES.includes(asset.file_type)) {
    errors.push(
      `file_type 必须属于 ${ALLOWED_FILE_TYPES.join(" / ")}`
    );
  }

  if (!Array.isArray(asset.pdf_links)) {
    errors.push("pdf_links 必须是数组");
  }

  if (!Array.isArray(asset.image_links)) {
    errors.push("image_links 必须是数组");
  }

  if (!Array.isArray(asset.manual_links)) {
    errors.push("manual_links 必须是数组");
  }

  if (!isNonEmptyString(asset.source_url)) {
    errors.push("source_url 必须存在且为非空字符串");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  productAssetSchema,
  validateProductAsset,
  ALLOWED_FILE_TYPES,
};
