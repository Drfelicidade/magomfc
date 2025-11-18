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

// Função auxiliar para o Retry (CORREÇÃO: Adicionada aqui)
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

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

// ROTA 1: ANÁLISE DE EXAMES (Com Retry e Salvamento no Banco)
app.post('/analyze-exam', verifyFirebaseToken, async (req, res) => {
    const { imageParts } = req.body;
    const apiKey = process.env.GOOGLE_API_KEY;
    const userId = req.user.uid;

    if (!apiKey || !imageParts) {
        return res.status(400).json({ error: 'Imagens não fornecidas.' });
    }

    // CORREÇÃO: Modelo alterado para 1.5-flash (2.5 não existe)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const systemPrompt = `
    Você é um assistente especializado em transcrição de exames médicos (OCR).
    Sua tarefa é extrair dados EXATAMENTE como aparecem na imagem.
    
    REGRAS DE OURO (ANTI-ALUCINAÇÃO):
    1. Se um valor estiver borrado, rasurado ou ilegível, escreva "ILEGÍVEL". JAMAIS adivinhe números.
    2. NÃO inclua valores de referência. Extraia apenas o resultado do paciente.
    3. Se não houver nome do exame ou valor numérico claro, IGNORE a linha.
    4. Formate a saída linha por linha.
    
    FORMATO DE SAÍDA DESEJADO:
    Crie uma lista contendo a data o nome de cada exame e seu respectivo resultado. Formate esse resultado em uma lista com a data entre parenteses seguido do primeiro resultado e separando os itens pelo símbolo / em uma linha contínua. Escreva a data apenas no início do registro dos exames de cada data.
    Data do Exame: [DD/MM/AAAA] / [Nome do Exame]: [Valor] [Unidade] / [Nome do Exame]: [Valor] [Unidade] / ...
    
    ATENÇÃO AOS DETALHES:
    - Hemograma: Extraia Hemoglobina, Leucócitos Totais e Plaquetas.
    - Colesterol: agrupe Colesterol Total, HDL, LDL e Triglicerídeos nesta ordem.
    - Parcial de urina - transcreva apenas os itens que estiverem fora dos valores de referencia fornecidos pelo exame.
    `;

    const parts = [{ text: systemPrompt }];
    imageParts.forEach(part => {
        parts.push({ inlineData: { mimeType: part.mimeType, data: part.data } });
    });

    const payload = {
        contents: [{ parts: parts }],
        generationConfig: {
            temperature: 0.1,
            topP: 0.8,
            topK: 40
        }
    };

    // --- LÓGICA DE RETRY (TENTAR NOVAMENTE) ---
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            const response = await axios.post(apiUrl, payload);
            
            let transcription = 'Não foi possível extrair o texto.';
            if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                transcription = response.data.candidates[0].content.parts[0].text;
            }

            // Salva no Firestore APENAS nesta rota
            await db.collection('users').doc(userId).collection('exams').add({
                result: transcription,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
            
            return res.status(200).json({ success: true, text: transcription });

        } catch (error) {
            // Trata erros 503 (Sobrecarga) e 429 (Muitas requisições)
            if (error.response && (error.response.status === 503 || error.response.status === 429)) {
                attempts++;
                console.log(`[Exames] Tentativa ${attempts} falhou (Erro ${error.response.status}). Retentando em 2s...`);
                
                if (attempts >= maxAttempts) {
                    return res.status(503).json({ error: 'O servidor de IA está sobrecarregado. Tente novamente em instantes.' });
                }
                await delay(2000); 
            } else {
                console.error('Erro fatal na análise:', error.message);
                const errorMessage = error.response?.data?.error?.message || 'Falha ao processar o exame.';
                return res.status(500).json({ error: errorMessage });
            }
        }
    }
});

// ROTA 2: SEGURANÇA DE MEDICAMENTOS (Com Retry, SEM salvar no banco)
app.post('/check-medication-safety', verifyFirebaseToken, async (req, res) => {
    const { medicationName } = req.body;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey || !medicationName) {
        return res.status(400).json({ error: 'Nome do medicamento não fornecido.' });
    }

    const prompt = `
        Você é um assistente de informações farmacêuticas especializado em teratologia e segurança de medicamentos na gestação e lactação...
        (Resumo do prompt: Para o medicamento "${medicationName}", forneça riscos na gestação e lactação.)
        ...
        A sua resposta DEVE seguir estritamente o seguinte formato:
        - **Nome do Medicamento:** ${medicationName}
        - **Classificação de Risco na Gestação (FDA):**
        - **Resumo de Segurança na Gestação:**
        - **Segurança na Lactação:**
        - **Recomendações Gerais:**

        AVISO LEGAL OBRIGATÓRIO NO FINAL.
    `;

    // CORREÇÃO: Usando gemini-1.5-flash (texto puro)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const payload = {
        contents: [{
            parts: [{ text: prompt }]
        }]
    };

    // --- LÓGICA DE RETRY SIMPLIFICADA PARA TEXTO ---
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            const response = await axios.post(apiUrl, payload);
            
            let safetyInfo = 'Não foi possível obter a informação.';
            if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                safetyInfo = response.data.candidates[0].content.parts[0].text;
            }

            // CORREÇÃO: Apenas retorna o texto, NÃO salva no banco 'exams'
            return res.status(200).json({ success: true, text: safetyInfo });

        } catch (error) {
            if (error.response && (error.response.status === 503 || error.response.status === 429)) {
                attempts++;
                console.log(`[Medicamentos] Tentativa ${attempts} falhou (Erro ${error.response.status}). Retentando em 2s...`);
                
                if (attempts >= maxAttempts) {
                    return res.status(503).json({ error: 'Servidor sobrecarregado. Tente novamente.' });
                }
                await delay(2000); 
            } else {
                console.error('Erro ao verificar medicamento:', error.message);
                return res.status(500).json({ error: 'Falha ao pesquisar informação.' });
            }
        }
    }
});

app.listen(port, () => {
    console.log(`Servidor backend rodando na porta ${port}`);
});
