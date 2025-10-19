const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, ImageRun } = require('docx');

function makeBulletedParagraphs(item) {
  if (!item) return [ new Paragraph({ text: "-" }) ];
  if (Array.isArray(item)) {
    return item.map(i => new Paragraph({ text: i }));
  } else {
    const parts = String(item).split(/\r?\n/).filter(Boolean);
    if (parts.length > 1) return parts.map(p => new Paragraph({ text: p }));
    return [ new Paragraph({ text: item }) ];
  }
}

function makeNumberedOrBulleted(item) {
  if (!item) return [ new Paragraph({ text: "-" }) ];
  if (Array.isArray(item)) {
    return item.map((i, idx) => new Paragraph({ text: `${idx+1}. ${i}` }));
  } else {
    const parts = String(item).split(/\r?\n/).filter(Boolean);
    if (parts.length > 1) return parts.map((p, idx) => new Paragraph({ text: `${idx+1}. ${p}` }));
    return [ new Paragraph({ text: item }) ];
  }
}

function makeRubrikTable(rubrikArray) {
  if (!Array.isArray(rubrikArray) || rubrikArray.length === 0) {
    return new Paragraph({ text: "Rubrik tidak tersedia." });
  }

  const headerRow = new TableRow({
    children: [
      new TableCell({ width: { size: 3000, type: WidthType.DXA }, children: [ new Paragraph({ text: "Kriteria", bold: true }) ] }),
      new TableCell({ width: { size: 1500, type: WidthType.DXA }, children: [ new Paragraph({ text: "Skor 4", bold: true }) ] }),
      new TableCell({ width: { size: 1500, type: WidthType.DXA }, children: [ new Paragraph({ text: "Skor 3", bold: true }) ] }),
      new TableCell({ width: { size: 1500, type: WidthType.DXA }, children: [ new Paragraph({ text: "Skor 2", bold: true }) ] }),
      new TableCell({ width: { size: 1500, type: WidthType.DXA }, children: [ new Paragraph({ text: "Skor 1", bold: true }) ] }),
    ]
  });

  const rows = [headerRow];

  for (const r of rubrikArray) {
    rows.push(new TableRow({
      children: [
        new TableCell({ children: [ new Paragraph({ text: r.kriteria || '-' }) ] }),
        new TableCell({ children: [ new Paragraph({ text: r.skor4 || '-' }) ] }),
        new TableCell({ children: [ new Paragraph({ text: r.skor3 || '-' }) ] }),
        new TableCell({ children: [ new Paragraph({ text: r.skor2 || '-' }) ] }),
        new TableCell({ children: [ new Paragraph({ text: r.skor1 || '-' }) ] }),
      ]
    }));
  }

  return new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } });
}

async function buildDocxWithRubrik(data) {
  const children = [];

  // header with logo (if provided) and metadata
  let headerParagraphs = [];
  if (data.logoPath && fs.existsSync(data.logoPath)) {
    const imageBuffer = fs.readFileSync(data.logoPath);
    headerParagraphs.push(new Paragraph({
      children: [
        new ImageRun({
          data: imageBuffer,
          transformation: { width: 80, height: 80 }
        }),
        new TextRun({ text: `  ${data.nama_sekolah || ''}`, break: 1 })
      ]
    }));
  } else {
    headerParagraphs.push(new Paragraph({ text: data.nama_sekolah || '', heading: HeadingLevel.HEADING_2 }));
  }

  // Title
  children.push(new Paragraph({ text: data.judul_rpp || `RPP - ${data.mapel || ''}`, heading: HeadingLevel.TITLE }));
  children.push(new Paragraph({ text: `Mata Pelajaran: ${data.mapel || '-'}` }));
  children.push(new Paragraph({ text: `Kelas/Semester: ${data.kelas || '-'}` }));
  children.push(new Paragraph({ text: `Alokasi Waktu: ${data.alokasi_waktu || '-'}` }));
  children.push(new Paragraph({ text: "" }));

  // I. Capaian Pembelajaran
  children.push(new Paragraph({ text: "I. Capaian Pembelajaran", heading: HeadingLevel.HEADING_1 }));
  children.push(...makeBulletedParagraphs(data.capaian));

  // II. Tujuan Pembelajaran
  children.push(new Paragraph({ text: "II. Tujuan Pembelajaran", heading: HeadingLevel.HEADING_1 }));
  children.push(...makeNumberedOrBulleted(data.tujuan));

  // III. Materi Pokok dan Media
  children.push(new Paragraph({ text: "III. Materi Pokok dan Media Pembelajaran", heading: HeadingLevel.HEADING_1 }));
  children.push(new Paragraph({ text: `Materi Pokok: ${data.materi_pokok || '-'}` }));
  children.push(new Paragraph({ text: `Media dan Alat: ${(Array.isArray(data.media) ? data.media.join(', ') : (data.media || '-'))}` }));

  // IV. Langkah-langkah Pembelajaran
  children.push(new Paragraph({ text: "IV. Langkah-langkah Pembelajaran", heading: HeadingLevel.HEADING_1 }));
  children.push(new Paragraph({ text: data.kegiatan_pembelajaran || '-' }));

  // V. Asesmen
  children.push(new Paragraph({ text: "V. Asesmen", heading: HeadingLevel.HEADING_1 }));
  children.push(new Paragraph({ text: typeof data.asesmen === 'string' ? data.asesmen : JSON.stringify(data.asesmen) }));

  // VI. Rubrik Penilaian
  children.push(new Paragraph({ text: "VI. Rubrik Penilaian", heading: HeadingLevel.HEADING_1 }));
  const rubrikTable = makeRubrikTable(data.rubrik || []);
  children.push(rubrikTable);

  // VII. Sumber Belajar
  children.push(new Paragraph({ text: "VII. Sumber Belajar", heading: HeadingLevel.HEADING_1 }));
  children.push(...makeBulletedParagraphs(data.sumber_belajar));

  // VIII. Refleksi
  children.push(new Paragraph({ text: "VIII. Catatan Refleksi Guru", heading: HeadingLevel.HEADING_1 }));
  children.push(new Paragraph({ text: data.refleksi || '-' }));

  const doc = new Document({
    sections: [{
      headers: { default: headerParagraphs.length ? headerParagraphs[0] : undefined },
      children
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

module.exports = { buildDocxWithRubrik };
