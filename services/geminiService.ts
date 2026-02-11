import { GenerationParams, NicknameResult } from "../types";

export const generateNickname = async (params: GenerationParams): Promise<NicknameResult> => {
  try {
    // 调用本地 API 路由（不再直接调用 DeepSeek API）
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'API request failed');
    }

    return await response.json() as NicknameResult;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};