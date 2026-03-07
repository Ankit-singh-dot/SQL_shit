const router = require('express').Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

router.post('/', async (req, res) => {
    const { question, userQuery, tableInfo } = req.body;

    if (!question) {
        return res.status(400).json({ error: 'Question is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'LLM API key not configured.' });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are a helpful SQL tutor. A student is working on a SQL assignment.

IMPORTANT RULES:
- Give HINTS only, NEVER provide the complete SQL solution.
- Guide the student toward the answer without giving it away.
- If they provided a query attempt, point out what's wrong or what they're missing.
- Keep your response concise (2-4 sentences max).
- Suggest which SQL concepts/clauses they should look into.
- Do NOT write the full SELECT statement for them.

Assignment Question: ${question}

Table Information: ${tableInfo || 'Not provided'}

Student's Current Query Attempt: ${userQuery || 'No attempt yet'}

Give a helpful hint:`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const hint = response.text();

        res.json({ hint });
    } catch (err) {
        console.error('LLM Error:', err.message);
        res.status(500).json({ error: 'Failed to generate hint. Please try again.' });
    }
});

module.exports = router;
