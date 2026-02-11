import { GenerationParams, NicknameResult } from "../types";

// Utility for delaying execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to call DeepSeek API
const callDeepSeekAPI = async (prompt: string): Promise<NicknameResult> => {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: '你是一个脑洞大开的起名专家，擅长根据人名和性格特点取各种好玩、贴切的中文绰号。你的风格幽默风趣，但也懂得人情世故，不会取让人真正生气的名字。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.9,
      response_format: {
        type: 'json_object'
      }
    })
  });

  if (!response.ok) {
    console.error('DeepSeek API response error:', response.status, response.statusText);
    const errorData = await response.json().catch((err) => {
      console.error('Failed to parse error response:', err);
      return {};
    });
    console.error('Error data:', errorData);
    throw new Error(`API Error: ${errorData.error?.message || `HTTP ${response.status}`}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No response content received from DeepSeek API.');
  }

  try {
    return JSON.parse(content) as NicknameResult;
  } catch (parseError) {
    throw new Error('Failed to parse JSON response from DeepSeek API.');
  }
};

// Retry wrapper with exponential backoff
const generateWithRetry = async (prompt: string, retries = 3): Promise<NicknameResult> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await callDeepSeekAPI(prompt);
    } catch (error: any) {
      // Check for rate limit (429) or service overloaded (503)
      const isRateLimit = error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('Resource has been exhausted');
      const isOverloaded = error.message?.includes('503') || error.message?.includes('overloaded');
      
      const isLastAttempt = i === retries - 1;

      if ((isRateLimit || isOverloaded) && !isLastAttempt) {
        // Optimized delay: Start faster (1s) then 2s, 4s...
        const waitTime = Math.pow(2, i) * 1000;
        console.warn(`Attempt ${i + 1} failed. Retrying in ${waitTime}ms...`);
        await delay(waitTime);
        continue;
      }
      
      throw error;
    }
  }
  throw new Error("All retry attempts failed.");
};

export const generateNickname = async (params: GenerationParams): Promise<NicknameResult> => {
  const { name, relationship, vibe, trait } = params;

  // Construct the trait part dynamically to give it massive weight if it exists
  const traitInstruction = trait 
    ? `- **用户特征（最高优先级）**: "${trait}". 
       关键：昵称必须主要基于此特征生成，结合名字或关系，使用双关语、隐喻或直接引用"${trait}"。` 
    : '';

  const prompt = `
    任务：为名为"${name}"的人发明一个独特的中文昵称。
    语言：输出必须是简体中文。
    
    上下文：
    - 我与他们的关系：${relationship}
    - 期望风格：${vibe}
    ${traitInstruction}

    规则：
    1. **灵感来源**：
       ${trait ? `优先基于特征"${trait}"，昵称应能让人立即联想到此特征。` : `优先基于名字"${name}"和关系。`}
    2. **尊重但有趣**：昵称必须适合关系亲密度。
       - 如果是"老板/同事"，保持职场友好但聪明。
       - 如果是"伴侣"或"最好的朋友"，可以亲昵、调侃或使用网络用语。
    3. **中文文化语境**：使用以下技巧：
       - 叠字（如：贝贝）。
       - 前缀（小、老、阿）或后缀（子、酱、总、侠、仙）。
       - 基于${trait ? '特征' : '名字'}的谐音梗。
    4. **输出格式**：仅返回JSON对象，包含以下字段：
       {
         "nickname": "生成的昵称",
         "explanation": "简短有趣的解释",
         "emoji": "代表风格的单个emoji",
         "style": "风格标签（如：搞怪、甜美）"
       }
  `;

  try {
    console.log("Attempting generation with DeepSeek API...");
    return await generateWithRetry(prompt);
  } catch (error) {
    console.error("DeepSeek API failed:", error);
    throw error;
  }
};