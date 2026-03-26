exports.handler = async function(event) {
  const league = event.queryStringParameters?.league || '39';

  const res = await fetch(`https://v3.football.api-sports.io/players/topscorers?league=${league}&season=2024`, {
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
