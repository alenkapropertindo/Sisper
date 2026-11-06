import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini client if API key is available
  const apiKey = process.env.GEMINI_API_KEY || '';
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // API Route: POST /api/gemini/insights
  app.post('/api/gemini/insights', async (req, res) => {
    try {
      const {
        filterLabel,
        scores,
        logistik,
        pengawasan,
        penjualan,
        karyawan,
        pekerja,
      } = req.body;

      if (!ai) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY_MISSING',
          message: 'Gemini API key belum dikonfigurasi di server.',
        });
      }

      const prompt = `Anda adalah asisten AI sistem ERP Properti SISPER (bernama insAIght).
Tugas Anda adalah membuat catatan evaluasi operasional yang singkat, padat, to the point, dan langsung dapat ditindaklanjuti.

PENTING - IKUTI ATURAN BERIKUT DENGAN KETAT:
1. Catatan dibuat HANYA untuk pilar yang memiliki performa di bawah 100% atau terdeteksi kendala/isu. Jika pilar 100% aman (tidak ada isu), berikan nilai null untuk teks pilar tersebut.
2. Gunakan template gaya bahasa berikut sebagai panduan dasar, Anda boleh melakukan sedikit improvisasi profesional namun jangan menghilangkan poin penting dan fakta data:
   - Logistik: "material [nama-nama material] terdeteksi dengan status reorder, pastikan keterlambatan stok tidak menghambat progres pekerjaan bangunan, hubungi tim logistik sekarang"
   - Pengawasan: "[X] blok rumah terdeteksi menggunakan material melebihi standar RAB. Total kerugian/selisih diperkirakan mencapai Rp.[jumlah rupiah]. Klik link untuk melihat rincian penggunaan material atau hubungi pengawas untuk konfirmasi"
   - Penjualan: "kami mendeteksi [X] rumah sudah selesai terbangun tapi belum memiliki user terdaftar (status belum terbooking). Evaluasi tim penjualan sekarang"
   - Karyawan: "[X / nama karyawan] yang terdaftar sebagai [jabatan] tidak hadir dengan status [izin/sakit/alpa]. Konfirmasi sekarang"
   - Pekerja: "[X] pekerja terkonfirmasi tidak hadir [X hari / alasan]. Pastikan jadwal penyelesaian pekerjaan tidak terlambat, hubungi pengawas untuk konfirmasi pekerjaan"
3. Teks harus ringkas, maksimal 2-3 kalimat per pilar, to the point, jangan bertele-tele.
4. Output harus berupa JSON murni dengan struktur:
{
  "logistikNote": string | null,
  "pengawasanNote": string | null,
  "penjualanNote": string | null,
  "karyawanNote": string | null,
  "pekerjaNote": string | null
}

DATA SAAT INI:
- Filter: ${filterLabel}
- Skor Pilar: Logistik=${scores?.logistik}%, Pengawasan=${scores?.pengawasan}%, Penjualan=${scores?.penjualan}%, Karyawan=${scores?.karyawan}%, Pekerja=${scores?.pekerja}%
- Detail Logistik: ${JSON.stringify(logistik || {})}
- Detail Pengawasan: ${JSON.stringify(pengawasan || {})}
- Detail Penjualan: ${JSON.stringify(penjualan || {})}
- Detail Karyawan: ${JSON.stringify(karyawan || {})}
- Detail Pekerja: ${JSON.stringify(pekerja || {})}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Anda adalah AI insAIght untuk analitik KPI properti.',
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '{}';
      let parsed = {};
      try {
        parsed = JSON.parse(responseText);
      } catch (err) {
        console.error('Failed to parse Gemini response as JSON:', responseText);
      }

      return res.json({
        success: true,
        insights: parsed,
      });
    } catch (error: any) {
      console.error('Gemini insights error:', error);
      return res.status(500).json({
        error: 'GENERATION_FAILED',
        message: error?.message || 'Gagal menghasilkan insight AI.',
      });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Vite middleware in dev or static files in production
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
