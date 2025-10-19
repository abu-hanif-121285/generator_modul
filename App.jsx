import React, { useState } from 'react';
import axios from 'axios';

export default function App() {
  const [form, setForm] = useState({
    nama_sekolah: '',
    kelas: 'VI',
    mapel: '',
    materi_pokok: '',
    alokasi_waktu: '2 x 45 menit',
    konteks: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  function onChange(e){
    setForm({...form, [e.target.name]: e.target.value});
  }

  async function handleSubmit(e){
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const payload = { ...form };
      const fd = new FormData();
      fd.append('payload', JSON.stringify(payload));
      if (logoFile) fd.append('logo', logoFile);

      const res = await axios.post('http://localhost:4000/api/generate', fd, {
        responseType: 'blob',
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const disposition = res.headers['content-disposition'] || '';
      let filename = 'RPP_generated.docx';
      const match = disposition.match(/filename="(.+)"/);
      if (match) filename = match[1];
      a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      setMessage('Berhasil mengunduh RPP (.docx).');
    } catch (err) {
      console.error(err);
      setMessage('Gagal menghasilkan RPP. Cek konsol.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">RPP Smart Creator</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow">
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <div className="text-sm text-slate-600">Nama Sekolah</div>
            <input name="nama_sekolah" value={form.nama_sekolah} onChange={onChange} className="mt-1 p-2 border rounded w-full"/>
          </label>
          <label className="block">
            <div className="text-sm text-slate-600">Kelas</div>
            <input name="kelas" value={form.kelas} onChange={onChange} className="mt-1 p-2 border rounded w-full"/>
          </label>
          <label className="block col-span-2">
            <div className="text-sm text-slate-600">Mata Pelajaran</div>
            <input name="mapel" value={form.mapel} onChange={onChange} required className="mt-1 p-2 border rounded w-full"/>
          </label>
          <label className="block col-span-2">
            <div className="text-sm text-slate-600">Materi Pokok</div>
            <input name="materi_pokok" value={form.materi_pokok} onChange={onChange} required className="mt-1 p-2 border rounded w-full"/>
          </label>
          <label className="block">
            <div className="text-sm text-slate-600">Alokasi waktu</div>
            <input name="alokasi_waktu" value={form.alokasi_waktu} onChange={onChange} className="mt-1 p-2 border rounded w-full"/>
          </label>
          <label className="block">
            <div className="text-sm text-slate-600">Konteks (opsional)</div>
            <input name="konteks" value={form.konteks} onChange={onChange} className="mt-1 p-2 border rounded w-full"/>
          </label>
        </div>

        <div className="mt-4">
          <label className="block">
            <div className="text-sm text-slate-600">Logo Sekolah (opsional)</div>
            <input type="file" accept="image/*" onChange={(e)=>setLogoFile(e.target.files?.[0]||null)} className="mt-1"/>
          </label>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button disabled={loading} className="bg-sky-600 text-white px-4 py-2 rounded hover:opacity-95">
            {loading ? 'Generating…' : 'Generate & Download .docx'}
          </button>
          <div className="text-sm text-slate-600">{message}</div>
        </div>
      </form>
      <p className="text-xs text-slate-400 mt-4">Catatan: Backend harus berjalan di http://localhost:4000 dengan endpoint POST /api/generate</p>
    </div>
  );
}
