export const handler = async (event) => {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Square-Version',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  // Token lives only in Netlify environment variables — never in the HTML
  const token = process.env.SQUARE_ACCESS_TOKEN;
  const isSandbox = process.env.SQUARE_SANDBOX === 'true';

  if (!token) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'SQUARE_ACCESS_TOKEN not configured in Netlify env vars' }),
    };
  }

  const sqPath = event.path.replace(/^\/.netlify\/functions\/square-proxy/, '') || '/';
  const baseUrl = isSandbox
    ? 'https://connect.squareupsandbox.com'
    : 'https://connect.squareup.com';

  const fullUrl = `${baseUrl}${sqPath}`;
  console.log('SQUARE_SANDBOX:', process.env.SQUARE_SANDBOX);
  console.log('isSandbox:', isSandbox);
  console.log('token prefix:', token.substring(0, 10));
  console.log('URL:', fullUrl);

  try {
    const res = await fetch(fullUrl, {
      method: event.httpMethod,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-01-18',
      },
      body: ['POST', 'PUT', 'PATCH'].includes(event.httpMethod) ? event.body : undefined,
    });

    const data = await res.text();
    return {
      statusCode: res.status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: data,
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
