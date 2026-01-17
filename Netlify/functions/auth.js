const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  
  const sql = neon(process.env.DATABASE_URL);
  const { action, username, password } = JSON.parse(event.body || '{}');
  
  try {
    if (action === 'signup') {
      const existing = await sql`SELECT id FROM users WHERE username = ${username}`;
      if (existing.length > 0) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Username already taken' }) };
      const result = await sql`INSERT INTO users (username, password) VALUES (${username}, ${password}) RETURNING id, username`;
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, user: { id: result[0].id, username: result[0].username } }) };
    }
    if (action === 'login') {
      const result = await sql`SELECT id, username FROM users WHERE username = ${username} AND password = ${password}`;
      if (result.length === 0) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid username or password' }) };
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, user: { id: result[0].id, username: result[0].username } }) };
    }
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid action' }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
