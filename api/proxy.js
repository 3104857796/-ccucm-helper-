// Vercel Serverless Function - DeepSeek API 代理
// 前端调用 /api/proxy，这里加上 Key 再转发给 DeepSeek

export default async function handler(req, res) {
  // 只接受 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 允许跨域（你的网页域名）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.DEEPSEEK_API_KEY,
      },
      body: JSON.stringify(req.body),
    });

    // 流式转发
    if (req.body.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = response.body.getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) { res.end(); break; }
          res.write(value);
        }
      };
      await pump();
    } else {
      const data = await response.json();
      res.status(response.status).json(data);
    }
  } catch (err) {
    res.status(500).json({ error: 'Proxy error: ' + err.message });
  }
}
