// 最小限のヘルスチェックAPI

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    message: "API is working"
  });
}