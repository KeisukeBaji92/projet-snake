// backend/controllers/tournamentController.js

const executeTournamentMatches = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('participants.user')
      .populate('participants.script');

    if (!tournament) {
      return res.status(404).json({ error: 'Tournoi non trouvé' });
    }

    // Vérifier que le tournoi est en cours
    if (tournament.status !== 'running') {
      return res.status(400).json({ error: 'Le tournoi n\'est pas en cours' });
    }

    // Créer les matches pour la première phase si nécessaire
    if (!tournament.phases || tournament.phases.length === 0) {
      tournament.phases = [{
        name: 'Phase 1',
        matches: [],
        completed: false
      }];
      
      // Générer les matches (exemple: élimination directe)
      const participants = [...tournament.participants];
      while (participants.length > 1) {
        const p1 = participants.shift();
        const p2 = participants.shift();
        
        const newMatch = new Match({
          tournament: tournament._id,
          participants: [
            { user: p1.user, script: p1.script, color: 'red' },
            { user: p2.user, script: p2.script, color: 'blue' }
          ],
          status: 'pending'
        });
        
        await newMatch.save();
        tournament.phases[0].matches.push(newMatch._id);
      }
    }

    // Exécuter tous les matches en attente
    for (const phase of tournament.phases) {
      if (phase.completed) continue;
      
      for (const matchId of phase.matches) {
        const match = await Match.findById(matchId);
        if (match.status !== 'pending') continue;

        match.status = 'running';
        await match.save();

        try {
          // Exécuter le match
          const result = await runSnakeMatch(
            match.participants[0].script.path,
            match.participants[1].script.path,
            tournament.settings.difficulty
          );

          // Enregistrer le résultat
          match.result = {
            winner: result.winner === 'snake1' ? match.participants[0] : 
                   result.winner === 'snake2' ? match.participants[1] : null,
            finalScores: {
              red: result.scores.snake1,
              blue: result.scores.snake2
            },
            totalRounds: result.frames.length,
            reason: result.reason
          };

          // Sauvegarder le replay
          match.replay = {
            history: result.frames,
            settings: {
              rows: result.rows,
              cols: result.cols,
              difficulty: tournament.settings.difficulty
            }
          };

          match.status = 'completed';
          await match.save();

        } catch (error) {
          match.status = 'error';
          match.result = {
            reason: error.message
          };
          await match.save();
          console.error(`Erreur lors du match ${match._id}:`, error);
        }
      }

      // Vérifier si la phase est terminée
      phase.completed = (await Match.countDocuments({
        _id: { $in: phase.matches },
        status: { $ne: 'completed' }
      })) === 0;
    }

    // Vérifier si le tournoi est terminé
    tournament.status = tournament.phases.every(p => p.completed) 
      ? 'completed' 
      : 'running';

    // Déterminer le gagnant si le tournoi est terminé
    if (tournament.status === 'completed') {
      // Logique pour déterminer le gagnant (simplifiée)
      const lastPhase = tournament.phases[tournament.phases.length - 1];
      const lastMatch = await Match.findById(lastPhase.matches[0]);
      
      if (lastMatch.result.winner) {
        tournament.winner = {
          user: lastMatch.result.winner.user,
          script: lastMatch.result.winner.script
        };
      }
    }

    await tournament.save();
    res.json(tournament);

  } catch (error) {
    console.error('Erreur lors de l\'exécution des matches:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Fonction pour exécuter un match entre deux scripts
async function runSnakeMatch(script1Path, script2Path, difficulty) {
  return new Promise((resolve, reject) => {
    const { spawn } = require('child_process');
    
    const matchProcess = spawn('node', ['runMatch.js', script1Path, script2Path, difficulty], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30000 // 30 secondes timeout
    });

    let stdout = '';
    let stderr = '';

    matchProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    matchProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    matchProcess.on('close', (code) => {
      if (code !== 0 || stderr) {
        return reject(new Error(stderr || `Processus terminé avec code ${code}`));
      }

      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (e) {
        reject(new Error('Format de résultat invalide'));
      }
    });
  });
}