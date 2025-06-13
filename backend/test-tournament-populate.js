const http = require('http');

async function testTournamentAPI() {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/tournaments',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      if (res.statusCode === 200) {
        const tournaments = JSON.parse(data);
        const desespoir = tournaments.find(t => t.name === 'Tournoi désespoir');
        
        if (desespoir) {
          console.log('✅ Tournoi "Tournoi désespoir" trouvé');
          console.log('Participants:', desespoir.participants.length);
          
          desespoir.participants.forEach((participant, i) => {
            console.log(`\nParticipant ${i + 1}:`);
            console.log('  User:', typeof participant.user, participant.user);
            console.log('  Script:', typeof participant.script, participant.script);
          });
        } else {
          console.log('❌ Tournoi "Tournoi désespoir" non trouvé');
        }
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

testTournamentAPI(); 