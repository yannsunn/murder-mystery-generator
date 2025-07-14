// 最もシンプルなヘルスチェック
module.exports = (req, res) => {
  const groqKeyExists = !!process.env.GROQ_API_KEY;
  
  res.status(200).json({
    status: groqKeyExists ? "OK" : "WARNING",
    timestamp: new Date().toISOString(),
    groqKeyPresent: groqKeyExists,
    message: groqKeyExists ? "API is ready" : "GROQ_API_KEY not found"
  });
};