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

// Rota para analisar exames (existente) - NÃO FOI ALTERADA E ESTÁ CORRETA
app.post('/analyze-exam', verifyFirebaseToken, async (req, res) => {
    const { imageParts, prompt } = req.body;
    const apiKey = process.env.GOOGLE_API_KEY;
    const userId = req.user.uid;

    if (!apiKey || !imageParts || !prompt) {
        return res.status(400).json({ error: 'Dados em falta na requisição.' });
    }

    try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`;
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

// NOVA ROTA: Para verificar a segurança de medicamentos (COM AS MUDANÇAS APLICADAS)
app.post('/check-medication-safety', verifyFirebaseToken, async (req, res) => {
    
    // MUDANÇA 1: Recebemos 'medicationName' do frontend, em vez de 'prompt'
    const { medicationName } = req.body;
    const apiKey = process.env.GOOGLE_API_KEY;

    // MUDANÇA 2: Atualizamos a verificação de erro
    if (!apiKey || !medicationName) {
        return res.status(400).json({ error: 'Nome do medicamento não fornecido.' });
    }

    // MUDANÇA 3: Construímos o prompt aqui no backend
    const prompt = `
        Você é um assistente de informações farmacêuticas especializado em teratologia e segurança de medicamentos na gestação e lactação. Sua função é fornecer informações baseadas em evidências e classificações de risco padrão para profissionais de saúde.
        Para o medicamento "${medicationName}", forneça um resumo sobre sua segurança durante a gestação E a lactação.

        A sua resposta DEVE seguir estritamente o seguinte formato:
        - **Nome do Medicamento:** ${medicationName}
        - **Classificação de Risco na Gestação (FDA):** [Categoria A, B, C, D ou X. Se não houver, escreva 'Não classificado pela FDA'.]
        - **Resumo de Segurança na Gestação:** [Um parágrafo conciso explicando os riscos conhecidos, considerações por trimestre e informações sobre estudos em humanos ou animais. Seja direto e informativo.]
        - **Segurança na Lactação:** [Um parágrafo conciso explicando a excreção do medicamento no leite materno, riscos potenciais para o lactente e recomendações gerais.]
        - **Recomendações Gerais:** [Informações sobre a importância de avaliar o risco-benefício e a necessidade de acompanhamento médico para ambas as situações.]

        REGRAS IMPORTANTES:
        1.  NÃO forneça conselhos médicos diretos. NÃO diga 'é seguro tomar' ou 'não tome'.
        2.  A sua resposta DEVE SEMPRE terminar com o seguinte aviso legal, sem exceções: 'AVISO: Esta informação é apenas para fins educacionais e não substitui a consulta com um profissional de saúde qualificado. Nunca inicie, pare ou altere qualquer medicação sem consultar o seu médico.'
        3.  Se você não encontrar informações conclusivas sobre "${medicationName}" para gestação ou lactação, indique isso claramente na seção correspondente.
    `;

    try {
        // MUDANÇA 4: Corrigi o nome do modelo para 'gemini-pro' (o mais estável e que evita os erros 404 que vimos)
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        // MUDANÇA 5: O payload agora usa o prompt que acabamos de criar
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
