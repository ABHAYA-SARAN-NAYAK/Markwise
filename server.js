// server.js  (Node 18 or newer). Run: npm install express dotenv   then   node server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
app.use(express.json({ limit: '8mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const KEY = process.env.GEMINI_API_KEY;
const MODEL = (process.env.GEMINI_MODEL && process.env.GEMINI_MODEL.startsWith('gemini')) ? process.env.GEMINI_MODEL : 'gemini-3-flash-preview';

const PROMPT = (subject) => `You are a careful HANDWRITING READER for Class 12 exam answer sheets (subject: ${subject}).
Your only job is to copy what is written.
RULES
1. Copy the text exactly as written. Do NOT fix spelling, grammar or wrong facts. Do NOT add missing words.
   Do NOT use your own knowledge to guess a word you cannot read.
2. If a word or symbol is unclear, write [?] in its place. One [?] for each unreadable word.
3. Keep line breaks as \\n. Write formulas in plain text, for example: E = hc/λ, x^2, 1.2 x 10^-6.
4. Judge the PHOTO separately from the writing. List photo problems using only these words:
   too_dark, too_bright, blurry, tilted, glare, shadow, cropped, too_far, not_a_page.
5. Describe the handwriting using ONLY the fixed choices in the JSON below.
6. If the photo is so poor that you cannot read the page, return an empty transcript and photo_ok=false.
Return ONLY valid JSON in exactly this shape:
{"photo_ok":true,"photo_problems":[],"transcript":"",
 "has_diagram":false,"diagram_labels":[],
 "writing":{"word_spacing":"good|tight|very_tight","line_direction":"straight|uphill|downhill|wavy",
 "letter_size":"small|medium|large","overwriting":"none|some|a_lot",
 "confusable_characters":["example: 1 looks like 7"],"units_or_symbols_unclear":false}}`;

app.post('/api/read', async (req, res) => {
  try {
    const { imageBase64, mimeType, subject } = req.body || {};
    if (!imageBase64) return res.status(400).json({ error: 'no_image' });
    if (!KEY) return res.status(503).json({ error: 'no_key' });

    const modelsToTry = [MODEL, 'gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3-flash-preview'];
    const tried = new Set();
    let lastStatus = 502;
    let parsedResponse = null;

    for (const m of modelsToTry) {
      if (tried.has(m)) continue;
      tried.add(m);
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`;
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
          body: JSON.stringify({
            contents: [{ parts: [{ text: PROMPT(subject || 'Science') },
                                 { inline_data: { mime_type: mimeType || 'image/jpeg', data: imageBase64 } }] }],
            generationConfig: { temperature: 0, responseMimeType: 'application/json' }
          })
        });
        if (r.ok) {
          const j = await r.json();
          const text = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
          parsedResponse = JSON.parse(text.replace(/```json|```/g, '').trim());
          break;
        } else {
          lastStatus = r.status;
        }
      } catch (err) {
        // try next model
      }
    }

    if (parsedResponse) {
      return res.json(parsedResponse);
    }
    return res.status(502).json({ error: 'upstream', status: lastStatus });
  } catch (e) {
    res.status(500).json({ error: 'server', message: String(e.message || e) });
  }
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => console.log('StudentSphere running on http://localhost:' + PORT));
}
module.exports = app;
