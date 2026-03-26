exports.handler = async function(event) {
  const name = event.queryStringParameters?.name || '';
  if (!name) return { statusCode: 400, body: JSON.stringify({ error: 'Nom manquant' }) };

  const res = await fetch(`https://v3.football.api-sports.io/players?search=${encodeURIComponent(name)}&season=2024`, {
    headers: {
      'x-apisports-key': process.env.API_FOOTBALL_KEY
    }
  });

  const data = await res.json();
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(data)
  };
};
