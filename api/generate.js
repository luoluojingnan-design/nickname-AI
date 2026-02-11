// api/generate.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { name, relationship, vibe, trait } = req.body;

    // 构造提示词
    const traitInstruction = trait 
      ? `- **用户特征**："${trait}"` 
      : '';

    const prompt = `
      任务：为名为"${name}"的人发明一个独特的中文昵称。
      语言：输出必须是简体中文。
      
      优先级（从高到低）：
      1. **名字本身**：昵称必须主要基于名字"${name}"，可以使用谐音、拆分、组合等技巧
      2. **关系和风格**：结合关系"${relationship}"和风格"${vibe}"
      3. **特征（如果提供）**：参考特征"${trait}"（如果有）

      重要要求：
      1. **禁止使用原名**：昵称不能完全是原名"${name}"，必须有明显的变化或创意
      2. **多样性**：避免过于单一的风格，不要过度使用"酱"、"子"等固定后缀
      3. **创意**：使用多种命名技巧，如：
         - 谐音梗（基于名字发音）
         - 语义关联（基于名字含义）
         - 叠字（如：贝贝）
         - 前缀/后缀变化（如：小、老、阿、总、侠、仙等）
         - 组合创新（名字+关系/特征的创意组合）
      4. **适合性**：昵称必须适合关系亲密度，不要使用冒犯性内容
      5. **独特性**：确保昵称新颖，避免常见、俗套的称呼

      输出格式：仅返回JSON对象，包含以下字段：
      {
        "nickname": "生成的昵称",
        "explanation": "简短有趣的解释，说明昵称的由来和创意点",
        "emoji": "代表风格的单个emoji",
        "style": "风格标签（如：搞怪、甜美、文艺等）"
      }
    `;

    // 调用 DeepSeek API
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${errorData.error?.message || `HTTP ${response.status}`}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response content received from DeepSeek API.');
    }

    try {
      const result = JSON.parse(content);
      return res.status(200).json(result);
    } catch (parseError) {
      throw new Error('Failed to parse JSON response from DeepSeek API.');
    }
  } catch (error) {
    console.error('Error:', error);
    let errorMessage = '哎呀，脑洞卡住了。请再试一次！';
    
    if (error.message) {
      if (error.message.includes('quota') || error.message.includes('429')) {
        errorMessage = '请求太快啦，AI 需要喘口气 (Quota Limit)。请稍等几秒再试。';
      } else if (error.message.includes('safety') || error.message.includes('harmful')) {
        errorMessage = '触发了安全过滤，换个名字或描述试试看？';
      } else if (error.message.includes('All retry attempts failed')) {
        errorMessage = '网络有点拥堵，AI 尽力了但没连上。请稍后再试。';
      }
    }
    
    return res.status(500).json({ error: errorMessage });
  }
}