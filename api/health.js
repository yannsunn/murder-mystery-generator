// 最小限のヘルスチェックAPI

export default async function handler(request) {
  return new Response(
    JSON.stringify({
      status: "OK",
      timestamp: new Date().toISOString(),
      message: "API is working"
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    }
  );
}