const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    if (event.httpMethod === 'GET') {
      const videoId = event.queryStringParameters?.videoId;
      if (!videoId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'videoId required' }) };
      const comments = await sql`SELECT c.id, c.comment, c.created_at, c.user_id, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.video_id = ${videoId} ORDER BY c.created_at DESC`;
      return { statusCode: 200, headers, body: JSON.stringify({ comments }) };
    }
    if (event.httpMethod === 'POST') {
      const { action, userId, videoId, comment, commentId } = JSON.parse(event.body || '{}');
      if (action === 'add') {
        const result = await sql`INSERT INTO comments (user_id, video_id, comment) VALUES (${userId}, ${videoId}, ${comment}) RETURNING id`;
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, commentId: result[0].id }) };
      }
      if (action === 'delete') {
        await sql`DELETE FROM comments WHERE id = ${commentId} AND user_id = ${userId}`;
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
      }
    }
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request' }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
```

4. **Commit changes**

---

## Done! ✅

Your GitHub repo should now have:
```
vidstream/
├── index.html
├── package.json
├── netlify.toml
└── netlify/
    └── functions/
        ├── setup.js
        ├── auth.js
        ├── favorites.js
        ├── playlists.js
        └── comments.js
