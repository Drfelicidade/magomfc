// backend/server.js

const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
// NOVO: Importar o Firebase Admin SDK
const admin = require('firebase-admin');

// NOVO: Configuração do Firebase Admin
// As credenciais virão das variáveis de ambiente do Render
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin SDK inicializado com sucesso.');
} catch (error) {
  console.error('Erro ao inicializar o Firebase Admin SDK:', error.message);
  console.error('Verifique se a variável de ambiente FIREBASE_SERVICE_ACCOUNT_KEY está configurada corretamente no Render.');
}

const db = admin.firestore();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));

app.post('/analyze-exam', async (req, res) => {
    // NOVO: Recebe sessionId
    const { imageParts, prompt, sessionId } = req.body;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey || !sessionId || !imageParts || !prompt) {
        return res.status(400).json({ error: 'Dados em falta na requisição.' });
    }

    try {
        // Passo 1: Informa o desktop que o processamento começou
        await db.collection('sessions').doc(sessionId).set({
            status: 'processing',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
        const parts = [{ text: prompt }];
        imageParts.forEach(part => {
            parts.push({ inlineData: { mimeType: part.mimeType, data: part.data } });
        });
        const payload = { contents: [{ parts: parts }] };

        // Passo 2: Chama a API do Gemini
        const response = await axios.post(apiUrl, payload);
        
        let transcription = 'Não foi possível extrair o texto.';
        if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            transcription = response.data.candidates[0].content.parts[0].text;
        }

        // Passo 3: Guarda o resultado final no Firestore
        await db.collection('sessions').doc(sessionId).update({
            status: 'completed',
            result: transcription
        });

        // Passo 4: Responde ao telemóvel com sucesso
        res.status(200).json({ success: true, message: 'Resultado guardado no Firestore.' });

    } catch (error) {
        console.error('Erro no processo de análise:', error.response ? error.response.data : error.message);
        // Informa o desktop sobre o erro
        await db.collection('sessions').doc(sessionId).update({
            status: 'error',
            error: 'Falha ao comunicar com a API do Gemini.'
        }).catch();
        res.status(500).json({ error: 'Falha ao processar o exame.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor backend a correr na porta ${port}`);
});
