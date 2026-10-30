exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body);
        const userText = body.userText;
        
        // Renomeie esta variável no Netlify para corresponder ao seu novo provedor (ex: OPENROUTER_API_KEY)
        const apiKey = process.env.API_KEY;

        const systemPrompt = `
        Você é um guia turístico e um agente de viagens virtual de ponta.
        Objetivo: Planejar e auxiliar viajantes, fornecendo roteiro, financeiro, burocracia, idiomas e dicas.
        O usuário está partindo de Guarulhos, São Paulo, Brasil.
        REGRA CRÍTICA: Você deve fornecer informações reais e atuais. Sempre que mencionar um hotel, companhia aérea, atração turística ou serviço, VOCÊ DEVE incluir um link real e clicável usando o formato Markdown. Exemplo: [Site Oficial do Louvre](https://www.louvre.fr).
        Organize suas respostas em tópicos e tabelas didáticas.
        `;

        // ESCOLHA A URL CORRETA PARA A SUA CHAVE:
        // Se for OpenRouter: 'https://openrouter.ai/api/v1/chat/completions'
        // Se for OpenAI direto: 'https://api.openai.com/v1/chat/completions'
        // Se continuar na Groq: 'https://api.groq.com/openai/v1/chat/completions' (Mas a Groq rejeitará o modelo openai/gpt-oss-120b)
        
        const apiUrl = 'https://openrouter.ai/api/v1/chat/completions'; // Atualize aqui se necessário

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "openia/gpt-oss-120b", // Velocidade e modelo alterados conforme solicitado
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userText }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`Erro na API (${response.status}): Verifique se o provedor suporta este modelo.`);
        }

        const data = await response.json();
        const aiText = data.choices[0].message.content;

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


// exports.handler = async function(event, context) {
//     // Permite apenas requisições POST
//     if (event.httpMethod !== "POST") {
//         return { statusCode: 405, body: "Method Not Allowed" };
//     }

//     try {
//         const body = JSON.parse(event.body);
//         const userText = body.userText;
        
//         // A chave será puxada das variáveis de ambiente do Netlify
//         const apiKey = process.env.GEMINI_API_KEY;

//         const systemPrompt = `
//         Você é um guia turístico e um agente de viagens virtual de ponta.
//         Objetivo: Planejar e auxiliar viajantes, fornecendo roteiro, financeiro, burocracia, idiomas e dicas.
//         O usuário está partindo de Guarulhos, São Paulo, Brasil.
//         REGRA CRÍTICA: Você deve fornecer informações reais e atuais. Sempre que mencionar um hotel, companhia aérea, atração turística ou serviço, VOCÊ DEVE incluir um link real e clicável usando o formato Markdown. Exemplo: [Site Oficial do Louvre](https://www.louvre.fr).
//         Organize suas respostas em tópicos e tabelas didáticas.
//         `;

//         const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//                 contents: [{ parts: [{ text: systemPrompt + "\n\nPedido: " + userText }] }]
//             })
//         });

//         if (!response.ok) {
//             throw new Error(`Erro na API do Gemini: ${response.status}`);
//         }

//         const data = await response.json();
//         const aiText = data.candidates[0].content.parts[0].text;

//         return {
//             statusCode: 200,
//             body: JSON.stringify({ reply: aiText })
//         };

//     } catch (error) {
//         console.error(error);
//         return {
//             statusCode: 500,
//             body: JSON.stringify({ error: "Falha ao processar a resposta da IA." })
//         };
//     }
// };



// // exports.handler = async function(event, context) {
// //     // Permite apenas requisições POST
// //     if (event.httpMethod !== "POST") {
// //         return { statusCode: 405, body: "Method Not Allowed" };
// //     }

// //     try {
// //         const body = JSON.parse(event.body);
// //         const userText = body.userText;
        
// //         // A chave será puxada das variáveis de ambiente do Netlify
// //         const apiKey = process.env.GEMINI_API_KEY;

// //         const systemPrompt = `
// //         Você é um guia turístico e um agente de viagens virtual de ponta.
// //         Objetivo: Planejar e auxiliar viajantes, fornecendo roteiro, financeiro, burocracia, idiomas e dicas.
// //         O usuário está partindo de Guarulhos, São Paulo, Brasil.
// //         REGRA CRÍTICA: Você deve fornecer informações reais e atuais. Sempre que mencionar um hotel, companhia aérea, atração turística ou serviço, VOCÊ DEVE incluir um link real e clicável usando o formato Markdown. Exemplo: [Site Oficial do Louvre](https://www.louvre.fr).
// //         Organize suas respostas em tópicos e tabelas didáticas.
// //         `;

// //         const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
// //             method: 'POST',
// //             headers: { 'Content-Type': 'application/json' },
// //             body: JSON.stringify({
// //                 contents: [{ parts: [{ text: systemPrompt + "\n\nPedido: " + userText }] }]
// //             })
// //         });

// //         if (!response.ok) {
// //             throw new Error(`Erro na API do Gemini: ${response.status}`);
// //         }

// //         const data = await response.json();
// //         const aiText = data.candidates[0].content.parts[0].text;

// //         return {
// //             statusCode: 200,
// //             body: JSON.stringify({ reply: aiText })
// //         };

// //     } catch (error) {
// //         console.error(error);
// //         return {
// //             statusCode: 500,
// //             body: JSON.stringify({ error: "Falha ao processar a resposta da IA." })
// //         };
// //     }
// // };
