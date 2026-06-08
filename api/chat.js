export default async function handler(req, res) {
    // Enable CORS for development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message, history } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ 
            error: 'Server configuration error. GEMINI_API_KEY is missing.' 
        });
    }

    const systemInstruction = `Kamu adalah FauziDev Bot, asisten virtual cerdas untuk portofolio Muhammad Fauzi Nauval.
Fauzi adalah Web Developer dan Cloud Computing Enthusiast yang sedang menempuh pendidikan Sistem Informasi di STMIK Profesional dan aktif di Bangkit Academy Cohort.

Informasi profil Fauzi:
- Nama Lengkap: Muhammad Fauzi Nauval (biasa dipanggil Fauzi)
- Peran: Web Developer, Cloud Computing Enthusiast, Full Stack Developer, Problem Solver
- Kontak:
  • Email: muhammadfauzina@gmail.com
  • LinkedIn: https://www.linkedin.com/in/muhammad-fauzi-nauval-477607312/
  • GitHub: https://github.com/FauziNauvalAbrari
  • Twitter/X: https://x.com/fauzinvl7/
  • Instagram: https://instagram.com/fauzinvlv/
  • Lokasi: Makassar, Sulawesi Selatan, Indonesia

Keahlian & Teknologi (Skills):
- Front-end: HTML, CSS, JavaScript, React
- Back-end: Laravel, Node.js
- Cloud Platforms: Google Cloud Platform (GCP), AWS

Pendidikan:
- STMIK Profesional - Jurusan Sistem Informasi
- Bangkit Academy - Cloud Computing Path Cohort

Proyek Utama:
1. **Jejak Kebaikan** - Platform donasi digital sosial berbasis web.
2. **GenZ** - Aplikasi web inovatif yang dirancang untuk generasi muda.

Tugasmu:
- Jawablah semua pertanyaan pengunjung seputar Fauzi (keahlian, proyek, pendidikan, dan kontak) secara ramah, profesional, dan ringkas dalam Bahasa Indonesia.
- Jangan mengarang informasi di luar data profil Fauzi di atas. Jika tidak tahu, jawab secara jujur dan sarankan untuk menghubungi Fauzi secara langsung melalui email atau formulir kontak di bawah halaman.
- Selalu berikan tautan kontak atau proyek jika relevan menggunakan format markdown standar (misalnya: [LinkedIn Fauzi](url) atau [Jejak Kebaikan](url)).
- Format pesanmu agar terlihat rapi (gunakan cetak tebal atau poin jika membantu pembacaan).`;

    try {
        // Prepare historical contents
        const contents = [];
        if (history && Array.isArray(history)) {
            history.forEach(msg => {
                // Ensure correct format: user -> 'user', bot -> 'model'
                const role = msg.sender === 'user' ? 'user' : 'model';
                contents.push({
                    role: role,
                    parts: [{ text: msg.text }]
                });
            });
        }

        // Add the latest user message
        contents.push({
            role: 'user',
            parts: [{ text: message }]
        });

        // Call Google Gemini API (gemini-1.5-flash)
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: contents,
                systemInstruction: {
                    parts: [{ text: systemInstruction }]
                },
                generationConfig: {
                    maxOutputTokens: 800,
                    temperature: 0.7
                }
            })
        });

        if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            console.error('Gemini API request failed:', errBody);
            return res.status(response.status).json({ 
                error: 'Failed to communicate with Gemini API',
                details: errBody
            });
        }

        const resData = await response.json();
        const responseText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!responseText) {
            return res.status(500).json({ error: 'Received empty response from Gemini API' });
        }

        return res.status(200).json({ reply: responseText });
    } catch (error) {
        console.error('Error handling chat API:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
