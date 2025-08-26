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
        req.user = decodedToken; // Adiciona os dados do usuário ao request
        next();
    } catch (error) {
        return res.status(403).send('Acesso não autorizado');
    }
};

// A rota agora usa o middleware de verificação
app.post('/analyze-exam', verifyFirebaseToken, async (req, res) => {
    const { imageParts, prompt } = req.body;
    const apiKey = process.env.GOOGLE_API_KEY;
    const userId = req.user.uid; // ID do usuário autenticado

    if (!apiKey || !imageParts || !prompt) {
        return res.status(400).json({ error: 'Dados em falta na requisição.' });
    }

    try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
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

        // Salva o resultado na coleção do usuário
        await db.collection('users').doc(userId).collection('exams').add({
            result: transcription,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // No modo local, devolvemos o resultado diretamente para exibição imediata
        res.status(200).json({ success: true, text: transcription });

    } catch (error) {
        console.error('Erro no processo de análise:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Falha ao processar o exame.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor backend rodando na porta ${port}`);
});
