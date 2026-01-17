const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    if (event.httpMethod === 'GET') {
      const userId = event.queryStringParameters?.userId;
      if (!userId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'userId required' }) };
      const favorites = await sql`SELECT video_id, video_title, video_thumb, video_channel, created_at FROM favorites WHERE user_id = ${userId} ORDER BY created_at DESC`;
      return { statusCode: 200, headers, body: JSON.stringify({ favorites }) };
    }
    if (event.httpMethod === 'POST') {
      const { userId, videoId, videoTitle, videoThumb, videoChannel, action } = JSON.parse(event.body || '{}');
      if (action === 'add') {
        await sql`INSERT INTO favorites (user_id, video_id, video_title, video_thumb, video_channel) VALUES (${userId}, ${videoId}, ${videoTitle}, ${videoThumb}, ${videoChannel}) ON CONFLICT (user_id, video_id) DO NOTHING`;
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
      }
      if (action === 'remove') {
        await sql`DELETE FROM favorites WHERE user_id = ${userId} AND video_id = ${videoId}`;
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
      }
    }
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request' }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
