const router = require('express').Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// POST /api/compare — compare student query vs expected, get AI explanation
router.post('/', async (req, res) => {
    const { studentQuery, expectedQuery, question, tableInfo } = req.body;

    if (!studentQuery || !expectedQuery) {
        return res.status(400).json({ error: 'Both queries are required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'LLM API key not configured.' });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are a SQL expert tutor. Compare these two SQL queries and provide feedback.

Assignment Question: ${question || 'Not provided'}
Table Info: ${tableInfo || 'Not provided'}

Student's Query:
\`\`\`sql
${studentQuery}
\`\`\`

Reference Solution:
\`\`\`sql
${expectedQuery}
\`\`\`

Provide a brief comparison (3-5 sentences):
1. Are both queries correct for the given question?
2. What are the key differences in approach?
3. Any performance or readability improvements the student could make?
4. What the student did well.

Keep it encouraging and educational.`;

        const result = await model.generateContent(prompt);
        const comparison = result.response.text();

        res.json({ comparison });
    } catch (err) {
        console.error('Compare Error:', err.message);
        res.status(500).json({ error: 'Failed to compare queries.' });
    }
});

module.exports = router;
