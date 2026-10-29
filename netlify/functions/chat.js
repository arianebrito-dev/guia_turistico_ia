exports.handler = async function(event, context) {
    // Permite apenas requisições POST
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body);
        const userText = body.userText;
        
        // A chave será puxada das variáveis de ambiente do Netlify
        const apiKey = process.env.GEMINI_API_KEY;

        const systemPrompt = `
        Você é um guia turístico e um agente de viagens virtual de ponta.
        Objetivo: Planejar e auxiliar viajantes, fornecendo roteiro, financeiro, burocracia, idiomas e dicas.
        O usuário está partindo de Guarulhos, São Paulo, Brasil.
        REGRA CRÍTICA: Você deve fornecer informações reais e atuais. Sempre que mencionar um hotel, companhia aérea, atração turística ou serviço, VOCÊ DEVE incluir um link real e clicável usando o formato Markdown. Exemplo: [Site Oficial do Louvre](https://www.louvre.fr).
        Organize suas respostas em tópicos e tabelas didáticas.
        `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt + "\n\nPedido: " + userText }] }]
            })
        });

        if (!response.ok) {
            throw new Error(`Erro na API do Gemini: ${response.status}`);
        }

        const data = await response.json();
        const aiText = data.candidates[0].content.parts[0].text;

        return {
            statusCode: 200,
            body: JSON.stringify({ reply: aiText })
        };

    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Falha ao processar a resposta da IA." })
        };
    }
};