// backend/server.js

const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config(); // Carrega as variáveis do arquivo .env

const app = express();
const port = process.env.PORT || 3000; // Usa a porta do Render ou 3000 localmente

// Configurações do servidor
app.use(cors()); // Permite requisições de outras origens (seu frontend)
app.use(express.json({ limit: '10mb' })); // Permite receber dados em JSON com um limite maior de tamanho

// Rota para analisar o exame
app.post('/analyze-exam', async (req, res) => {
    const { inlineData, prompt } = req.body;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Chave de API do Google não configurada no servidor.' });
    }

    if (!inlineData || !prompt) {
        return res.status(400).json({ error: 'Dados da imagem ou prompt ausentes.' });
    }

    // CORREÇÃO APLICADA AQUI: Atualização para um modelo mais recente
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{
            parts: [
                { text: prompt },
                { inlineData: inlineData }
            ]
        }]
    };

    try {
        const response = await axios.post(apiUrl, payload);
        
        // Verifica se a resposta tem o conteúdo esperado antes de enviar
        if (response.data && response.data.candidates && response.data.candidates[0].content.parts[0].text) {
            const transcription = response.data.candidates[0].content.parts[0].text;
            res.json({ text: transcription });
        } else {
            // Se a resposta da API for bem-sucedida mas vazia, informa o usuário
            res.status(500).json({ error: 'A API do Gemini retornou uma resposta vazia.' });
        }

    } catch (error) {
        // Log detalhado do erro no servidor para depuração
        console.error('Erro ao chamar a API do Gemini:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Falha ao comunicar com a API do Gemini.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor backend rodando na porta ${port}`);
});
