const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// --- 1. MAPA (OpenStreetMap) ---
const origemCoords = [-23.4628, -46.5333]; 
const map = L.map('map').setView(origemCoords, 4);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

let currentMarker = L.marker(origemCoords).addTo(map).bindPopup('Origem:<br><b>Guarulhos, SP</b>').openPopup();

// --- 2. CONFIGURAÇÃO DA IA ---
const GEMINI_API_KEY = 'SUA_CHAVE_AQUI'; // Insira sua chave Gemini

// Novo Prompt: Focado em interação e embasamento web
const systemPrompt = `
Você é um guia turístico e um agente de viagens virtual de ponta.
O usuário está partindo de Guarulhos, São Paulo, Brasil.

REGRAS CRÍTICAS:
1. INTERAÇÃO E CONVERSA: NUNCA entregue o roteiro inteiro de uma vez na primeira mensagem. Faça 1 ou 2 perguntas para entender o perfil do usuário (orçamento, estilo de viagem, duração).
2. EMBASAMENTO E LINKS REAIS: Você deve usar a ferramenta de busca para trazer informações atualizadas e reais. Toda vez que citar um hotel, voo, passeio, atração ou exigência de imigração, é OBRIGATÓRIO fornecer o LINK REAL e clicável da fonte. Ex: [Site Oficial do Louvre](https://www.louvre.fr).
3. PRECISÃO: Não invente valores estáticos. Sempre traga o dado atualizado pesquisado na internet.
`;

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message');
    
    const avatarDiv = document.createElement('div');
    avatarDiv.classList.add('avatar');
    avatarDiv.innerHTML = sender === 'user' ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-robot"></i>';

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('content');
    
    if (sender === 'ai') {
        contentDiv.innerHTML = marked.parse(text); 
    } else {
        contentDiv.textContent = text;
    }

    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Atualiza o mapa e dispara a busca de notícias/voos
function checkDestinationAndMoveMap(text) {
    const txtLower = text.toLowerCase();
    let destino = text; 
    let lat = 0, lng = 0;

    if(txtLower.includes('suíça') || txtLower.includes('suica')) { destino = 'Suíça'; lat = 46.8182; lng = 8.2275; }
    else if(txtLower.includes('paris') || txtLower.includes('frança')) { destino = 'Paris'; lat = 48.8566; lng = 2.3522; }
    else if(txtLower.includes('japão') || txtLower.includes('japao') || txtLower.includes('tóquio')) { destino = 'Japão'; lat = 36.2048; lng = 138.2529; }
    else if(txtLower.includes('nova york') || txtLower.includes('eua')) { destino = 'Nova York'; lat = 40.7128; lng = -74.0060; }
    
    // Sempre busca widgets reais baseados na frase do usuário
    fetchDynamicWidgets(destino);

    if (lat !== 0) {
        map.flyTo([lat, lng], 5, { duration: 3 });
        setTimeout(() => {
            map.removeLayer(currentMarker);
            currentMarker = L.marker([lat, lng]).addTo(map).bindPopup(`<b>Destino:</b> ${destino}`).openPopup();
        }, 3000);
    }
}

// --- NOVO: BUSCA DE WIDGETS REAIS COM A IA ---
async function fetchDynamicWidgets(destino) {
    const newsWidget = document.getElementById('news-widget');
    const promosWidget = document.getElementById('promos-widget');

    newsWidget.innerHTML = '<p style="font-size: 13px;">Buscando alertas na web...</p>';
    promosWidget.innerHTML = '<p style="font-size: 13px;">Buscando voos na web...</p>';

    // Pedimos explicitamente um JSON para preencher a tela de forma fácil
    const promptWidgets = `Faça uma busca na internet. Encontre as 2 notícias de turismo ou alertas mais recentes sobre ${destino} e 2 estimativas reais de preços de voos saindo de Guarulhos (GRU) para ${destino}. Retorne APENAS um objeto JSON estrito com links reais:
    {
      "noticias": [ {"texto": "Título da notícia...", "link": "URL_AQUI"} ],
      "voos": [ {"texto": "GRU para Destino...", "preco": "R$...", "link": "URL_AQUI"} ]
    }`;

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptWidgets }] }],
                tools: [{ googleSearch: {} }], // Habilita pesquisa no Google
                generationConfig: { responseMimeType: "application/json" } // Força a saída em JSON perfeito
            })
        });

        const data = await res.json();
        const info = JSON.parse(data.candidates[0].content.parts[0].text);

        // Preenche Notícias com Links Reais
        newsWidget.innerHTML = '<ul style="list-style: none;">' +
            info.noticias.map(n => `<li style="margin-bottom: 10px; font-size: 13px; line-height: 1.4;"><a href="${n.link}" target="_blank" style="color: #1e3a8a; text-decoration: none;">📰 ${n.texto}</a></li>`).join('') +
            '</ul>';

        // Preenche Voos com Links Reais
        promosWidget.innerHTML = info.voos.map(v => `
            <div class="promo-card" style="background: white; padding: 10px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #f59e0b;">
                <a href="${v.link}" target="_blank" style="text-decoration: none; color: inherit;">
                    <p style="font-weight: bold; font-size: 13px;">${v.texto}</p>
                    <span style="color: #16a34a; font-weight: bold; font-size: 12px;">${v.preco}</span>
                </a>
            </div>`).join('');
    } catch (e) {
        newsWidget.innerHTML = '<p style="color:red; font-size:12px;">Falha ao obter notícias online.</p>';
        promosWidget.innerHTML = '<p style="color:red; font-size:12px;">Falha ao obter voos online.</p>';
    }
}

// --- CHAT PRINCIPAL COM O USUÁRIO ---
async function fetchAIResponse(userText) {
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('message', 'ai-message');
    typingDiv.innerHTML = `<div class="avatar"><i class="fa-solid fa-robot"></i></div><div class="content typing-indicator">Buscando informações oficiais e digitando...</div>`;
    chatBox.appendChild(typingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt + "\n\nUsuário disse: " + userText }] }],
                tools: [{ googleSearch: {} }] // IA agora navega na internet
            })
        });
        
        if (!response.ok) throw new Error("Erro na API.");

        const data = await response.json();
        const aiText = data.candidates[0].content.parts[0].text;
        
        chatBox.removeChild(typingDiv);
        addMessage(aiText, 'ai');

    } catch (error) {
        chatBox.removeChild(typingDiv);
        addMessage("Desculpe, ocorreu um erro ao buscar dados embasados. Verifique sua chave API.", 'ai');
    }
}

sendBtn.addEventListener('click', () => {
    const text = userInput.value.trim();
    if (text) {
        addMessage(text, 'user');
        checkDestinationAndMoveMap(text);
        userInput.value = '';
        fetchAIResponse(text);
    }
});

userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendBtn.click(); });

// COTAÇÃO AO VIVO VIA API GRATUITA
async function fetchRealTimeCurrency() {
    try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        const brl = data.rates.BRL;
        const eur = data.rates.BRL / data.rates.EUR;
        const chf = data.rates.BRL / data.rates.CHF;

        const widgetExchange = document.querySelector('.exchange');
        if(widgetExchange) {
            widgetExchange.innerHTML = `
                <p><strong>USD:</strong> R$ ${brl.toFixed(2)}</p>
                <p><strong>EUR:</strong> R$ ${eur.toFixed(2)}</p>
                <p><strong>CHF:</strong> R$ ${chf.toFixed(2)}</p>
            `;
        }
    } catch (err) { }
}
fetchRealTimeCurrency();