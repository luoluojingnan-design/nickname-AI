// api/generate.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { name, relationship, vibe, trait } = req.body;

    // 构造提示词
    const traitInstruction = trait 
      ? `- **用户特征（最高优先级）**: "${trait}". 
         关键：昵称必须主要基于此特征生成，结合名字或关系。` 
      : '';

    const prompt = `
      任务：为名为"${name}"的人发明一个独特的中文昵称。
      语言：输出必须是简体中文。
      
      上下文：
      - 我与他们的关系：${relationship}
      - 期望风格：${vibe}
      ${traitInstruction}

      规则：
      1. **灵感来源**：${trait ? `优先基于特征"${trait}"` : `优先基于名字"${name}"和关系`}
      2. **尊重但有趣**：昵称必须适合关系亲密度
      3. **中文文化语境**：使用叠字、前缀/后缀、谐音梗等技巧
      4. **输出格式**：仅返回JSON对象，包含以下字段：
         {
           "nickname": "生成的昵称",
           "explanation": "简短有趣的解释",
           "emoji": "代表风格的单个emoji",
           "style": "风格标签（如：搞怪、甜美）"
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
            content: '你是一个脑洞大开的起名专家，擅长根据人名和性格特点取各种好玩、贴切的中文绰号。'
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
      throw new Error(`API Error: ${await response.text()}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: '哎呀，脑洞卡住了。请再试一次！' });
  }
}