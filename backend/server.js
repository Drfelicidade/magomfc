// backend/server.js

const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '25mb' })); // Aumentado o limite para acomodar múltiplas imagens

app.post('/analyze-exam', async (req, res) => {
    // NOVO: Recebe um array de 'imageParts'
    const { imageParts, prompt } = req.body;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Chave de API do Google não configurada no servidor.' });
    }

    if (!imageParts || !Array.isArray(imageParts) || imageParts.length === 0 || !prompt) {
        return res.status(400).json({ error: 'Dados das imagens ou prompt ausentes ou em formato incorreto.' });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    // NOVO: Constrói dinamicamente as partes da requisição
    const parts = [
        { text: prompt }
    ];

    imageParts.forEach(part => {
        parts.push({
            inlineData: {
                mimeType: part.mimeType,
                data: part.data
            }
        });
    });

    const payload = {
        contents: [{ parts: parts }]
    };

    try {
        const response = await axios.post(apiUrl, payload);
        
        if (response.data && response.data.candidates && response.data.candidates[0].content.parts[0].text) {
            const transcription = response.data.candidates[0].content.parts[0].text;
            res.json({ text: transcription });
        } else {
            res.status(500).json({ error: 'A API do Gemini retornou uma resposta vazia.' });
        }

    } catch (error) {
        console.error('Erro ao chamar a API do Gemini:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Falha ao comunicar com a API do Gemini.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor backend rodando na porta ${port}`);
});
