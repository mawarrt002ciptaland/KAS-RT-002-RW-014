import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log("Seeding pengurus and kegiatan...");

  // Seed Pengurus RT 002
  const checkPengurus = await pool.query("SELECT COUNT(*) FROM pengurus");
  if (parseInt(checkPengurus.rows[0].count, 10) === 0) {
    const listPengurus = [
      ['Eka Rista Yudhistira, ST.', 'Ketua RT 002', '+62 821-7129-9984', 'Blok Mawar M-01', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80', '2026 - 2031 (5 Tahun)', 'aktif', 'Periode 2026 - 2031', 'Penanggung jawab umum kepengurusan lingkungan Blok Mawar RT 002 RW 014', 1],
      ['Bayu Sodik Permana', 'Sekretaris RT 002', '081288395550', 'Blok Mawar M-02', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80', '2026 - 2031 (5 Tahun)', 'aktif', 'Periode 2026 - 2031', 'Administrasi surat menyurat, pendataan warga, dan notulensi rapat', 2],
      ['Neny Melsya, S.Sp.', 'Bendahara RT 002', '082173735449', 'Blok Mawar M-02', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80', '2026 - 2031 (5 Tahun)', 'aktif', 'Periode 2026 - 2031', 'Pengelolaan kas, penagihan iuran, pembukuan, dan penerbitan kwitansi', 3],
      ['Asrizal', 'Koordinator Lapangan & Keamanan', '082274449963', 'Blok Mawar M-03', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80', '2026 - 2031 (5 Tahun)', 'aktif', 'Periode 2026 - 2031', 'Monitoring pos security, jadwal jaga, dan keamanan lingkungan', 4],
      ['Surya', 'Sie Pembangunan & Fasum', '081288880076', 'Blok Mawar M-04', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80', '2026 - 2031 (5 Tahun)', 'aktif', 'Periode 2026 - 2031', 'Perawatan lampu jalan, jalan lingkungan, saluran air, dan fasilitas umum', 5],
      ['Siti Aminah', 'Sie Sosial & Pemberdayaan Warga', '081366778899', 'Blok Mawar M-08', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80', '2026 - 2031 (5 Tahun)', 'aktif', 'Periode 2026 - 2031', 'Kegiatan sosial, dansos sakit, santunan, dan pemberdayaan UMKM', 6],
      ['Bambang Sudik Pamarto', 'Mantan Ketua RT 002', '081234567890', 'Blok Mawar M-01', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80', '2021 - 2026', 'mantan_ketua', 'Periode 2021 - 2026', 'Pembangunan portal RFID dan semenisasi jalan utama Blok Mawar', 10],
      ['H. Ahmad Mansyur', 'Mantan Ketua RT 002', '081398765400', 'Blok Mawar M-15', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80', '2016 - 2021', 'mantan_ketua', 'Periode 2016 - 2021', 'Inisiasi paguyuban warga awal dan pos jaga security Blok Mawar', 11],
    ];

    for (const p of listPengurus) {
      await pool.query(
        `INSERT INTO pengurus (nama, jabatan, no_hp, no_rumah, foto_url, periode, kategori, masa_jabatan, catatan, urutan)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        p
      );
    }
    console.log("Pengurus seeded successfully.");
  }

  // Seed Kegiatan Warga
  const checkKegiatan = await pool.query("SELECT COUNT(*) FROM kegiatan");
  if (parseInt(checkKegiatan.rows[0].count, 10) === 0) {
    const listKegiatan = [
      [
        'Gotong Royong Lingkungan',
        'Gotong Royong',
        '27 Sep 2026',
        '07.00 - 10.00 WIB',
        'Lingkungan Blok Mawar',
        'Warga RT 002 RW 014',
        'Surya (Sie Pembangunan)',
        '081288880076',
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
        'Pembersihan saluran drainase air, pemangkasan dahan pohon yang menutupi lampu jalan, dan pengecatan ulang marka jalan.',
        'Sapu lidi, karung sampah 50 pcs, cat trotoar, kuas, dan konsumsi gorengan + kopi',
        750000,
        625000,
        125000,
        'https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?w=800&auto=format&fit=crop&q=80',
        'Diharapkan setiap perwakilan rumah tangga membawa cangkul/sabit dan peralatan kebersihan masing-masing.',
        'Akan Datang'
      ],
      [
        'Rapat Warga Evaluasi Triwulan III',
        'Rapat Warga',
        '04 Okt 2026',
        '19.30 - 22.00 WIB',
        'Balai Pertemuan Warga Blok Mawar',
        'Kepala Keluarga RT 002',
        'Bayu Sodik Permana (Sekretaris)',
        '081288395550',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
        'Pembahasan laporan keuangan kas RT periode Juli - September 2026, rencana perbaikan portal otomatis, dan persiapan kegiatan akhir tahun.',
        'Snack box 35 pax, proyektor, fotokopi laporan kas, teh manis hangat',
        500000,
        420000,
        80000,
        'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&auto=format&fit=crop&q=80',
        'Undangan resmi akan dibagikan via grup WhatsApp RT 002. Kehadiran sangat diharapkan demi transparansi bersama.',
        'Terjadwal'
      ],
      [
        'Pengajian Warga & Santunan Yatim',
        'Keagamaan',
        '10 Okt 2026',
        '18.30 - 21.00 WIB',
        'Mushola Blok Mawar',
        'Warga Muslim RT 002',
        'Ustadz / Sie Sosial',
        '081366778899',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
        'Kajian rutin bulanan keluarga sakinah dilanjutkan santunan dan doa bersama anak yatim dhuafa lingkungan sekitar.',
        'Konsumsi nasi kotak, santunan 10 anak yatim, penceramah tamu',
        1500000,
        1500000,
        0,
        'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&auto=format&fit=crop&q=80',
        'Bagi warga yang ingin menitipkan infaq/sedekah dapat menghubungi Bendahara atau Sie Sosial.',
        'Terjadwal'
      ],
      [
        'Semarak Peringatan HUT RI ke-81',
        'Perayaan & Perlombaan',
        '17 Agu 2026',
        '08.00 - 17.00 WIB',
        'Fasum Lapangan Blok Mawar',
        'Seluruh Warga RT 002',
        'Panitia HUT RI (Asrizal)',
        '082274449963',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
        'Lomba anak-anak (makan kerupuk, balap karung, mewarnai) dan turnamen voli antar blok serta pembagian doorprize malam syukuran.',
        'Tenda, panggung mini, sound system, hadiah piala & doorprize, konsumsi',
        2500000,
        2450000,
        50000,
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
        'Kegiatan telah berlangsung meriah dengan partisipasi lebih dari 90% warga Blok Mawar.',
        'Selesai'
      ]
    ];

    for (const k of listKegiatan) {
      await pool.query(
        `INSERT INTO kegiatan (judul, kategori, tanggal, waktu, lokasi, peserta, penanggung_jawab, kontak_pj, foto_pj, deskripsi, daftar_kebutuhan, anggaran, pengeluaran, sisa_anggaran, dokumentasi_url, pengumuman, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        k
      );
    }
    console.log("Kegiatan seeded successfully.");
  }

  await pool.end();
}

main().catch((err) => {
  console.error("Error seeding:", err);
  process.exit(1);
});
