require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Configuration, OpenAIApi } = require('openai');
const { buildDocxWithRubrik } = require('./docxBuilder');

const app = express();
app.use(cors());

const upload = multer({ dest: path.join(__dirname, 'uploads/') });
const PORT = process.env.PORT || 4000;

let openai = null;
if (process.env.OPENAI_API_KEY) {
  const config = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
  openai = new OpenAIApi(config);
} else {
  console.warn('OPENAI_API_KEY not set. The server will use a fallback stub response.');
}

// Helper: call LLM and ask for JSON based on prompt
async function generateJsonFromLLM(payload) {
  // Build prompt from payload
  const prompt = `Kamu adalah asisten AI pembuat RPP profesional. Kembalikan JSON valid sesuai struktur yang diminta.` + "\n" +
    "Input:" + JSON.stringify(payload) + "\n" +
    "Kembalikan hanya JSON valid.";

  if (!openai) {
    // Fallback stub for offline/dev
    return {
      judul_rpp: `RPP ${payload.mapel || 'Mata Pelajaran'} Kelas ${payload.kelas || ''}`,
      nama_sekolah: payload.nama_sekolah || 'Nama Sekolah',
      kelas: payload.kelas || payload.kelas || 'VI',
      mapel: payload.mapel || 'Mata Pelajaran',
      materi_pokok: payload.materi_pokok || 'Materi Pokok',
      alokasi_waktu: payload.alokasi_waktu || '2 x 45 menit',
      capaian: ['Siswa dapat menjelaskan konsep utama', 'Siswa dapat mengidentifikasi contoh', 'Siswa dapat menerapkan dalam kegiatan sederhana'],
      tujuan: ['Siswa dapat...','Siswa mampu...','Siswa dapat...'],
      kegiatan_pembelajaran: 'Pembukaan: Guru melakukan ...\\nInti: Siswa melakukan ...\\nPenutup: Refleksi dan tugas.',
      asesmen: { asesmen_awal: 'Pretest 5 soal singkat', asesmen_proses: 'Observasi', asesmen_akhir: 'Posttest 5 soal', soal_akhir: [{jenis:'PG', soal:'Contoh soal', kunci:'A'}] },
      rubrik: [
        {kriteria:'Pemahaman', skor4:'Sangat baik', skor3:'Baik', skor2:'Cukup', skor1:'Kurang'},
        {kriteria:'Penyajian', skor4:'Sangat rapi', skor3:'Rapi', skor2:'Perlu perbaikan', skor1:'Tidak memenuhi'}
      ],
      sumber_belajar: ['Buku teks', 'Video edukasi'],
      refleksi: 'Catatan refleksi guru.'
    };
  }

  const resp = await openai.createChatCompletion({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Kamu adalah asisten pembuatan RPP profesional.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 1200,
    temperature: 0.2
  });

  const text = resp.data.choices[0].message.content;

  try {
    return JSON.parse(text);
  } catch (err) {
    // try to extract JSON block
    const match = text.match(/\{[\s\S]*\}$/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Gagal parse JSON dari model: ' + text.slice(0,400));
  }
}

// POST /api/generate - accepts multipart form: field 'payload' (JSON string), optional 'logo' file
app.post('/api/generate', upload.single('logo'), async (req, res) => {
  try {
    const payload = JSON.parse(req.body.payload || '{}');
    const logoPath = req.file ? req.file.path : null;

    const jsonFromLLM = await generateJsonFromLLM(payload);

    // Attach logo path so builder can add it
    if (logoPath) jsonFromLLM.logoPath = logoPath;

    const buffer = await buildDocxWithRubrik(jsonFromLLM);

    // cleanup uploaded logo
    if (logoPath && fs.existsSync(logoPath)) {
      try { fs.unlinkSync(logoPath); } catch(e){ console.warn('cleanup logo error', e); }
    }

    const filename = `RPP_${(jsonFromLLM.mapel || 'modul')}_${Date.now()}.docx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    return res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});


// --- Serve frontend static files (if built) ---
const path = require('path');
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
