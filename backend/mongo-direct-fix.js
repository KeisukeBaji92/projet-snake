const { MongoClient, ObjectId } = require('mongodb');

async function directMongoFix() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB directement');
    
    const db = client.db('snake-arena');
    const scriptsCollection = db.collection('scripts');
    const tournamentsCollection = db.collection('tournaments');
    
    // Récupérer le tournoi "Tournoi désespoir"
    const tournoi = await tournamentsCollection.findOne({ name: 'Tournoi désespoir' });
    
    console.log('\n📋 TOURNOI RÉCUPÉRÉ:');
    console.log('Participants:', tournoi.participants.length);
    
    // Examiner la structure d'un script
    console.log('\n🔍 EXAMEN DES SCRIPTS:');
    const allScripts = await scriptsCollection.find({}).toArray();
    console.log(`Total scripts: ${allScripts.length}`);
    
    if (allScripts.length > 0) {
      console.log('Structure du premier script:');
      console.log(JSON.stringify(allScripts[0], null, 2));
    }
    
    console.log('\n🔧 CORRECTION DES SCRIPTS DU TOURNOI:');
    
    for (const participant of tournoi.participants) {
      const userId = new ObjectId(participant.user);
      const scriptId = new ObjectId(participant.script);
      
      console.log(`\n📝 Correction du script ${scriptId} pour l'utilisateur ${userId}`);
      
      // Mettre à jour directement
      const result = await scriptsCollection.updateOne(
        { _id: scriptId },
        { $set: { user: userId } }
      );
      
      console.log(`  ✅ Modified: ${result.modifiedCount}, Matched: ${result.matchedCount}`);
      
      // Vérification
      const scriptUpdated = await scriptsCollection.findOne({ _id: scriptId });
      console.log(`  ✅ User maintenant: ${scriptUpdated.user || 'STILL UNDEFINED'}`);
    }
    
    // Test final
    console.log('\n🎯 TEST FINAL:');
    for (const participant of tournoi.participants) {
      const userId = new ObjectId(participant.user);
      const userScripts = await scriptsCollection.find({ user: userId }).toArray();
      console.log(`User ${userId}: ${userScripts.length} scripts trouvés`);
      userScripts.forEach(script => {
        console.log(`  - ${script.name} (${script._id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.close();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

directMongoFix(); 