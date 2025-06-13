const http = require('http');

async function testScriptRoute() {
  const scriptId = '68458b941ca166312d974202'; // Script "Stratège"
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: `/api/scripts/${scriptId}`,
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      if (res.statusCode === 200) {
        const script = JSON.parse(data);
        console.log('✅ Script récupéré:');
        console.log(`  Nom: ${script.name}`);
        console.log(`  Auteur: ${script.author?.username || 'N/A'}`);
        console.log(`  Code length: ${script.code?.length || 0}`);
      } else {
        console.log('❌ Erreur:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Erreur de connexion:', error.message);
  });

  req.end();
}

testScriptRoute(); 