/**
 * Calls the Gemini API to generate content based on a prompt.
 * @param {string} prompt The prompt to send to the AI.
 * @returns {Promise<string>} The text response from the AI.
 */
export async function callGeminiAPI(prompt) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.json();
        const errorMessage = errorBody.error?.message || `API Error: ${response.statusText}`;
        console.error("Erro ao chamar a API do Gemini:", errorMessage);
        throw new Error(`Falha na comunicação com a IA: ${errorMessage}`);
    }

    const result = await response.json();

    if (!result.candidates || result.candidates.length === 0) {
        console.error("Resposta da IA inválida:", result);
        throw new Error("A IA não retornou uma resposta válida. A requisição pode ter sido bloqueada.");
    }

    try {
        const text = result.candidates[0].content.parts[0].text;
        // Clean the response to remove markdown formatting
        return text.replace(/```json/g, '').replace(/```/g, '').trim();
    } catch (error) {
        console.error("Erro ao extrair texto da resposta da IA:", error);
        throw new Error("Não foi possível processar a resposta da IA.");
    }
}
