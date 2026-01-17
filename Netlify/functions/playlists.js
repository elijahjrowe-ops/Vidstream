const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    if (event.httpMethod === 'GET') {
      const userId = event.queryStringParameters?.userId;
      const playlistId = event.queryStringParameters?.playlistId;
      if (playlistId) {
        const playlist = await sql`SELECT * FROM playlists WHERE id = ${playlistId}`;
        const videos = await sql`SELECT video_id, video_title, video_thumb, video_channel FROM playlist_videos WHERE playlist_id = ${playlistId} ORDER BY added_at DESC`;
        return { statusCode: 200, headers, body: JSON.stringify({ playlist: playlist[0], videos }) };
      }
      if (userId) {
        const playlists = await sql`SELECT p.*, COUNT(pv.id) as video_count FROM playlists p LEFT JOIN playlist_videos pv ON p.id = pv.playlist_id WHERE p.user_id = ${userId} GROUP BY p.id ORDER BY p.created_at DESC`;
        return { statusCode: 200, headers, body: JSON.stringify({ playlists }) };
      }
    }
    if (event.httpMethod === 'POST') {
      const { action, userId, playlistId, name, videoId, videoTitle, videoThumb, videoChannel } = JSON.parse(event.body || '{}');
      if (action === 'create') {
        const result = await sql`INSERT INTO playlists (user_id, name) VALUES (${userId}, ${name}) RETURNING id, name, created_at`;
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, playlist: result[0] }) };
      }
      if (action === 'addVideo') {
        await sql`INSERT INTO playlist_videos (playlist_id, video_id, video_title, video_thumb, video_channel) VALUES (${playlistId}, ${videoId}, ${videoTitle}, ${videoThumb}, ${videoChannel}) ON CONFLICT DO NOTHING`;
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
      }
      if (action === 'delete') {
        await sql`DELETE FROM playlists WHERE id = ${playlistId} AND user_id = ${userId}`;
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
      }
    }
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request' }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
