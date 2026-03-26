exports.handler = async function(event) {
  const pid = event.queryStringParameters?.player || '';
  if (!pid) return { statusCode: 400, body: JSON.stringify({ error: 'ID joueur manquant' }) };

  const res = await fetch(`https://v3.football.api-sports.io/fixtures?player=${pid}&season=2024&last=10`, {
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
