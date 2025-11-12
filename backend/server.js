// backend/server.js

const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const admin = require('firebase-admin');

// Inicialização do Firebase Admin
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin SDK inicializado com sucesso.');
} catch (error) {
  console.error('Erro ao inicializar o Firebase Admin SDK:', error.message);
}

const db = admin.firestore();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Middleware para verificar o token de autenticação
const verifyFirebaseToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).send('Acesso não autorizado');
    }
    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        return res.status(403).send('Acesso não autorizado');
    }
};

// Rota para analisar exames (existente)
app.post('/analyze-exam', verifyFirebaseToken, async (req, res) => {
    const { imageParts, prompt } = req.body;
    const apiKey = process.env.GOOGLE_API_KEY;
    const userId = req.user.uid;

    if (!apiKey || !imageParts || !prompt) {
        return res.status(400).json({ error: 'Dados em falta na requisição.' });
    }

    try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const parts = [{ text: prompt }];
        imageParts.forEach(part => {
            parts.push({ inlineData: { mimeType: part.mimeType, data: part.data } });
        });
        const payload = { contents: [{ parts: parts }] };

        const response = await axios.post(apiUrl, payload);
        
        let transcription = 'Não foi possível extrair o texto.';
        if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            transcription = response.data.candidates[0].content.parts[0].text;
        }

        await db.collection('users').doc(userId).collection('exams').add({
            result: transcription,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        
        res.status(200).json({ success: true, text: transcription });

    } catch (error) {
        console.error('Erro no processo de análise:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Falha ao processar o exame.' });
    }
});

// NOVA ROTA: Para verificar a segurança de medicamentos
app.post('/check-medication-safety', verifyFirebaseToken, async (req, res) => {
    const { prompt } = req.body;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey || !prompt) {
        return res.status(400).json({ error: 'Prompt não fornecido.' });
    }

    try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const payload = {
            contents: [{
                parts: [{ text: prompt }]
            }]
        };

        const response = await axios.post(apiUrl, payload);

        let safetyInfo = 'Não foi possível obter a informação.';
        if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            safetyInfo = response.data.candidates[0].content.parts[0].text;
        }

        res.status(200).json({ success: true, text: safetyInfo });

    } catch (error) {
        console.error('Erro ao verificar segurança do medicamento:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Falha ao pesquisar informação.' });
    }
});


app.listen(port, () => {
    console.log(`Servidor backend rodando na porta ${port}`);
});
