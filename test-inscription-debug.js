const fetch = require('node-fetch');

async function testInscription() {
  console.log('🧪 Test d\'inscription au tournoi');
  
  try {
    // 1. Connexion utilisateur pour récupérer le token
    console.log('\n1️⃣ Connexion utilisateur...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'joueur1@test.com',
        password: 'password123'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Erreur de connexion:', await loginResponse.text());
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Connexion réussie, token récupéré');
    
    // 2. Récupérer les scripts de l'utilisateur
    console.log('\n2️⃣ Récupération des scripts...');
    const scriptsResponse = await fetch('http://localhost:5000/api/scripts/user', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!scriptsResponse.ok) {
      console.log('❌ Erreur récupération scripts:', await scriptsResponse.text());
      return;
    }
    
    const scripts = await scriptsResponse.json();
    console.log('✅ Scripts récupérés:', scripts.length);
    
    if (scripts.length === 0) {
      console.log('❌ Aucun script trouvé pour cet utilisateur');
      return;
    }
    
    const scriptId = scripts[0]._id;
    console.log('📝 Premier script sélectionné:', scripts[0].name, '(ID:', scriptId, ')');
    
    // 3. Récupérer les tournois disponibles
    console.log('\n3️⃣ Récupération des tournois...');
    const tournamentsResponse = await fetch('http://localhost:5000/api/tournaments');
    
    if (!tournamentsResponse.ok) {
      console.log('❌ Erreur récupération tournois:', await tournamentsResponse.text());
      return;
    }
    
    const tournaments = await tournamentsResponse.json();
    console.log('✅ Tournois récupérés:', tournaments.length);
    
    const registeringTournaments = tournaments.filter(t => t.status === 'registering');
    if (registeringTournaments.length === 0) {
      console.log('❌ Aucun tournoi en cours d\'inscription');
      return;
    }
    
    const tournamentId = registeringTournaments[0]._id;
    console.log('🏆 Premier tournoi sélectionné:', registeringTournaments[0].name, '(ID:', tournamentId, ')');
    
    // 4. Tentative d'inscription
    console.log('\n4️⃣ Tentative d\'inscription...');
    console.log('📤 Envoi requête POST /api/tournaments/' + tournamentId + '/register');
    console.log('📤 Avec scriptId:', scriptId);
    
    const registerResponse = await fetch(`http://localhost:5000/api/tournaments/${tournamentId}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ scriptId: scriptId })
    });
    
    console.log('📥 Réponse reçue, status:', registerResponse.status);
    
    if (!registerResponse.ok) {
      const errorText = await registerResponse.text();
      console.log('❌ Erreur inscription:', errorText);
      return;
    }
    
    const result = await registerResponse.json();
    console.log('✅ Inscription réussie !');
    console.log('🎉 Participants maintenant:', result.participants?.length || 'N/A');
    
  } catch (error) {
    console.error('💥 Erreur générale:', error.message);
  }
}

testInscription(); 