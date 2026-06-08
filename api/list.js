export default async function handler(req, res) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not defined' });
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
        const data = await response.json();
        
        if (!response.ok) {
            return res.status(response.status).json({ error: 'API error', details: data });
        }

        const models = data.models
            .filter(m => m.supportedGenerationMethods.includes('generateContent'))
            .map(m => m.name);

        return res.status(200).json({ models });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
