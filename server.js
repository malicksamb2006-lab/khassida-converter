const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

const rulesFilePath = path.join(__dirname, 'rules.json');

// Initialiser le fichier rules.json s'il n'existe pas
if (!fs.existsSync(rulesFilePath)) {
    fs.writeFileSync(rulesFilePath, JSON.stringify([
        { search: "المؤمنون", replace: "الْمُؤْمِنُونَ" },
        { search: "والقانتون", replace: "وَالْقَانِتُونَ" }
    ], null, 4), 'utf8');
}

// Route pour obtenir les règles actuelles
app.get('/get-rules', (req, res) => {
    fs.readFile(rulesFilePath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Cannot read rules file' });
        try {
            const rules = JSON.parse(data);
            res.json(rules);
        } catch(e) {
            res.status(500).json({ error: 'Invalid JSON' });
        }
    });
});

// Route pour sauvegarder les règles
app.post('/save-rules', (req, res) => {
    const newRules = req.body.rules;
    if (!Array.isArray(newRules)) {
        return res.status(400).json({ error: 'Invalid rules format' });
    }
    fs.writeFile(rulesFilePath, JSON.stringify(newRules, null, 4), 'utf8', (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Cannot write rules file' });
        }
        console.log('✅ Règles sauvegardées dans rules.json');
        res.json({ success: true });
    });
});

app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
    console.log(`Les règles sont stockées dans ${rulesFilePath}`);
});
