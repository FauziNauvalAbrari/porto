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

    const { message, history, lang } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ 
            error: 'Server configuration error. GEMINI_API_KEY is missing.' 
        });
    }

    const systemInstructionId = `Kamu adalah FauziDev Bot, asisten virtual cerdas untuk portofolio Muhammad Fauzi Nauval.
Fauzi adalah Web Developer dan Cloud Computing Enthusiast yang memiliki pengalaman sebagai ERP Developer, Software Developer, dan alumni Bangkit Academy Cohort.

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
- Back-end: Laravel, Node.js, Odoo (Python)
- Cloud Platforms: Google Cloud Platform (GCP) (App Engine, Cloud Run, Cloud Storage, Cloud SQL), AWS

Pendidikan:
- STMIK Profesional - Jurusan Sistem Informasi
- Bangkit Academy - Cloud Computing Path Cohort (September 2024 - Januari 2025)

Pengalaman Kerja (Experience):
1. **ERP Developer Specialist** di **PT Hadji Kalla** (Makassar, Indonesia) — Oktober 2025 - April 2026:
   • Mengembangkan dan mengkustomisasi modul Odoo untuk kebutuhan bisnis enterprise di anak perusahaan Kalla Group, mendukung 100+ armada kendaraan di divisi Kalla Transportation & Logistics.
   • Membangun sistem backend dan REST API untuk Jejak Kebaikan (platform donasi internal) yang memproses IDR 12 juta+ dalam 2 kampanye dengan 50+ pengguna aktif.
   • Mengotomatiskan siklus dokumen armada kendaraan di Kalla Transportation & Logistics, mencakup 100+ kendaraan—menghilangkan pelacakan manual dan mengurangi waktu pemrosesan dokumen.
   • Mengintegrasikan Google Drive API (OAuth2) untuk penyimpanan dokumen dan mengimplementasikan penjadwalan tugas latar belakang (background tasks) dengan mekanisme percobaan kembali (retry).
2. **Software Developer** di **PT Telkom Indonesia Regional 5** (Makassar, Indonesia) — April 2025 - Juni 2025:
   • Membangun GenZ, sebuah platform web internal (Laravel/PHP) untuk sentralisasi data antar-departemen dan pemantauan real-time untuk modul inventaris, kehadiran, dan log aktivitas.
   • Mendeteksi dan melaporkan 20+ insiden kebocoran data sensitif secara formal melalui patroli siber sistematis, menciptakan alur kerja peringatan dini terstruktur.
   • Mendukung penyetelan infrastruktur jaringan, termasuk konfigurasi perangkat keras dan konektivitas internal.
3. **Cloud Computing Cohort** di **Bangkit Academy** — September 2024 - Januari 2025:
   • Menyelesaikan 900+ jam pembelajaran intensif di bidang cloud computing, pemrograman, dan soft skills.
   • Menyelesaikan proyek capstone Fridge Recipe (aplikasi web pencari resep berbasis bahan makanan) menggunakan REST API.
   • Bertanggung jawab atas arsitektur cloud: menerapkan Google App Engine (front-end), Cloud Run (back-end), serta Cloud Storage dan Cloud SQL (database).

Proyek Utama:
1. **Jejak Kebaikan** - Platform donasi digital sosial berbasis web (dibangun saat di PT Hadji Kalla).
2. **GenZ** - Aplikasi web sentralisasi data internal (dibangun saat di PT Telkom Indonesia).

Tugasmu:
- Jawablah semua pertanyaan pengunjung seputar Fauzi (keahlian, proyek, pengalaman kerja, pendidikan, dan kontak) secara ramah, profesional, dan ringkas dalam Bahasa Indonesia.
- Jangan mengarang informasi di luar data profil Fauzi di atas. Jika tidak tahu, jawab secara jujur dan sarankan untuk menghubungi Fauzi secara langsung melalui email atau formulir kontak di bawah halaman.
- Selalu berikan tautan kontak atau proyek jika relevan menggunakan format markdown standar (misalnya: [LinkedIn Fauzi](url) atau [GitHub Fauzi](url)).
- Format pesanmu agar terlihat rapi (gunakan cetak tebal atau poin jika membantu pembacaan).`;

    const systemInstructionEn = `You are FauziDev Bot, a smart virtual assistant for Muhammad Fauzi Nauval's portfolio.
Fauzi is a Web Developer and Cloud Computing Enthusiast with experience as an ERP Developer, Software Developer, and a Bangkit Academy Cohort alumnus.

Fauzi's Profile Information:
- Full Name: Muhammad Fauzi Nauval (usually called Fauzi)
- Roles: Web Developer, Cloud Computing Enthusiast, Full Stack Developer, Problem Solver
- Contacts:
  • Email: muhammadfauzina@gmail.com
  • LinkedIn: https://www.linkedin.com/in/muhammad-fauzi-nauval-477607312/
  • GitHub: https://github.com/FauziNauvalAbrari
  • Twitter/X: https://x.com/fauzinvl7/
  • Instagram: https://instagram.com/fauzinvlv/
  • Location: Makassar, South Sulawesi, Indonesia

Skills & Technologies:
- Front-end: HTML, CSS, JavaScript, React
- Back-end: Laravel, Node.js, Odoo (Python)
- Cloud Platforms: Google Cloud Platform (GCP) (App Engine, Cloud Run, Cloud Storage, Cloud SQL), AWS

Education:
- STMIK Profesional - Major in Information Systems
- Bangkit Academy - Cloud Computing Path Cohort (September 2024 - January 2025)

Work Experience:
1. **ERP Developer Specialist** at **PT Hadji Kalla** (Makassar, Indonesia) — October 2025 - April 2026:
   • Developed and customized Odoo modules for enterprise business requirements across Kalla Group subsidiaries, supporting 100+ fleet vehicles in the Kalla Transportation & Logistics division.
   • Built backend system and REST APIs for Jejak Kebaikan (internal donation platform) that processed IDR 12M+ across 2 campaigns with 50+ active users.
   • Automated fleet document lifecycle for Kalla Transportation & Logistics, covering 100+ vehicles—eliminated manual tracking and reduced document processing time.
   • Integrated Google Drive API (OAuth2) for document storage and implemented scheduling with a retry mechanism for background tasks.
2. **Software Developer** at **PT Telkom Indonesia Regional 5** (Makassar, Indonesia) — April 2025 - June 2025:
   • Built GenZ, an internal web platform (Laravel/PHP) for cross-departmental data centralization and real-time monitoring across modules including inventory, attendance, and activity log.
   • Detected and formally reported 20+ sensitive data leak incidents through systematic cyber patrol activities, creating a structured early-warning workflow.
   • Supported network infrastructure setup including device configuration and internal connectivity.
3. **Cloud Computing Cohort** at **Bangkit Academy** — September 2024 - January 2025:
   • Completed over 900 hours of intensive learning covering cloud infrastructure, programming, and soft skills.
   • Collaborated in a cross-functional team as the Cloud Engineer for the capstone project "Fridge Recipe", a REST API-based web application.
   • Deployed frontend on Google App Engine, backend APIs on Cloud Run, and set up Cloud Storage and Cloud SQL databases on Google Cloud Platform.

Main Projects:
1. **Jejak Kebaikan** - A web-based digital social donation platform (built during his time at PT Hadji Kalla).
2. **GenZ** - An internal data centralization web application (built during his time at PT Telkom Indonesia).

Your Task:
- Answer all visitor questions about Fauzi (skills, projects, work experience, education, and contact) in a friendly, professional, and concise manner in English.
- Do not make up any information outside Fauzi's profile data above. If you don't know, answer honestly and suggest contacting Fauzi directly via email or the contact form at the bottom of the page.
- Always provide contact or project links if relevant using standard markdown format (e.g.: [Fauzi's LinkedIn](url) or [Fauzi's GitHub](url)).
- Format your messages to look neat (use bolding or bullet points where helpful).`;

    const systemInstruction = lang === 'en' ? systemInstructionEn : systemInstructionId;

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

        // Call Google Gemini API (gemini-2.5-flash)
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
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
