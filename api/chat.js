export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API key is missing on the server.' });
    }

    try {
        // Calling the official Google Gemini API using the fast, free Flash model
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        const googleResponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await googleResponse.json();

        if (!googleResponse.ok) {
            return res.status(googleResponse.status).json({ error: data.error?.message || 'Google API error' });
        }

        // Extract the text response out of Google's data format
        const aiText = data.candidates[0].content.parts[0].text;
        return res.status(200).json({ text: aiText });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
