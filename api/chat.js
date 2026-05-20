export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API key is missing on the server.' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    let attempts = 3; // It will try up to 3 times automatically
    let delay = 1000; // Starts with a 1-second pause

    while (attempts > 0) {
        try {
            const googleResponse = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            const data = await googleResponse.json();

            // If Google returns a 503 (high demand) or 429 (rate limit), we wait and try again
            if (googleResponse.status === 503 || googleResponse.status === 429) {
                attempts--;
                if (attempts === 0) {
                    return res.status(503).json({ error: "Google's servers are heavily overloaded right now. Please try your message one more time." });
                }
                // Wait a bit longer each time (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; 
                continue; 
            }

            if (!googleResponse.ok) {
                return res.status(googleResponse.status).json({ error: data.error?.message || 'Google API error' });
            }

            const aiText = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ text: aiText });

        } catch (error) {
            attempts--;
            if (attempts === 0) return res.status(500).json({ error: error.message });
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
        }
    }
}
