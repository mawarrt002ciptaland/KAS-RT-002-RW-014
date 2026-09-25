// Seed data for Sistem Informasi RT 002 - Blok Mawar Ciptaland
// Run: bun run .zscripts/seed.ts
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const NOW = new Date();

async function main() {
  console.log("Seeding SISTEM INFORMASI RT 002...");

  // Clean
  await db.kwitansi.deleteMany();
  await db.tagihan.deleteMany();
  await db.transaksi.deleteMany();
  await db.pengaduan.deleteMany();
  await db.pengumuman.deleteMany();
  await db.kegiatan.deleteMany();
  await db.marketplace.deleteMany();
  await db.trafikWebsite.deleteMany();
  await db.tautan.deleteMany();
  await db.pengurus.deleteMany();
  await db.anggotaKK.deleteMany();
  await db.warga.deleteMany();
  await db.user.deleteMany();
  await db.pengaturan.deleteMany();

  // ===== PENGURUS / WARGA =====
  const wargaData = [
    { nama: "Bapak H. Sutrisno", nik: "7171040101800001", noKK: "7171040101180001", noRumah: "Mawar 01", role: "pengurus", jabatan: "Ketua RT 002", telepon: "081300000001", pekerjaan: "Wiraswasta", jk: "L", keluarga: ["Hj. Sutrisno (Istri)", "Ahmad Sutrisno (Anak)"] },
    { nama: "Ibu Endang Marliana", nik: "7171040202820002", noKK: "7171040101180001", noRumah: "Mawar 02", role: "pengurus", jabatan: "Bendahara RT 002", telepon: "081300000002", pekerjaan: "Ibu Rumah Tangga", jk: "P", keluarga: ["Bambang M (Suami)"] },
    { nama: "Bapak Agus Santoso", nik: "7171040303850003", noKK: "7171040202180002", noRumah: "Mawar 03", role: "pengurus", jabatan: "Sekretaris RT 002", telepon: "081300000003", pekerjaan: "Karyawan Swasta", jk: "L", keluarga: ["Rina Santoso (Istri)", "Dewi Santoso (Anak)", "Raka Santoso (Anak)"] },
    { nama: "Bapak Joko Widodo", nik: "7171040404790004", noKK: "7171040303180003", noRumah: "Mawar 04", role: "pengurus", jabatan: "Koordinator Keamanan", telepon: "081300000004", pekerjaan: "Satpam", jk: "L", keluarga: [] },
    { nama: "Ibu Siti Aminah", nik: "7171040505880005", noKK: "7171040404180004", noRumah: "Mawar 05", role: "pengurus", jabatan: "Koordinator Kebersihan", telepon: "081300000005", pekerjaan: "Ibu Rumah Tangga", jk: "P", keluarga: ["Amin S (Suami)", "Budi A (Anak)"] },
    { nama: "Bapak Bayu J Putra", nik: "7171040606900006", noKK: "7171040505180005", noRumah: "Mawar 58", role: "warga", telepon: "081200000055", pekerjaan: "Karyawan Swasta", jk: "L", keluarga: ["Sari Putri (Istri)", "Naya Putra (Anak)", "Nadi Putra (Anak)"] },
    { nama: "Ibu Dewi Lestari", nik: "7171040707870007", noKK: "7171040606180006", noRumah: "Mawar 06", role: "warga", telepon: "081300000006", pekerjaan: "Guru", jk: "P", keluarga: ["Hendra L (Suami)"] },
    { nama: "Bapak Rudi Hartono", nik: "7171040808820008", noKK: "7171040707180007", noRumah: "Mawar 07", role: "warga", telepon: "081300000007", pekerjaan: "PNS", jk: "L", keluarga: ["Maya H (Istri)", "Andi H (Anak)", "Budi H (Anak)", "Citra H (Anak)"] },
    { nama: "Ibu Wati Suryani", nik: "7171040909910009", noKK: "7171040808180008", noRumah: "Mawar 08", role: "warga", telepon: "081300000008", pekerjaan: "Pedagang", jk: "P", keluarga: ["Tono S (Suami)"] },
    { nama: "Bapak Andi Pratama", nik: "7171041010860010", noKK: "7171040909180009", noRumah: "Mawar 09", role: "warga", telepon: "081300000009", pekerjaan: "Teknisi", jk: "L", keluarga: [] },
    { nama: "Ibu Rina Marlina", nik: "7171041111920011", noKK: "7171041010180010", noRumah: "Mawar 10", role: "warga", telepon: "081300000010", pekerjaan: "Ibu Rumah Tangga", jk: "P", keluarga: ["Eka M (Suami)", "Lala M (Anak)"] },
    { nama: "Bapak Eko Nugroho", nik: "7171041212830012", noKK: "7171041111180011", noRumah: "Mawar 11", role: "warga", telepon: "081300000011", pekerjaan: "Wiraswasta", jk: "L", keluarga: ["Rina N (Istri)", "Boni N (Anak)"] },
    { nama: "Ibu Lia Amalia", nik: "7171041313890013", noKK: "7171041212180012", noRumah: "Mawar 12", role: "warga", telepon: "081300000012", pekerjaan: "Perawat", jk: "P", keluarga: ["Fajar A (Suami)", "Tiara A (Anak)", "Rafi A (Anak)"] },
    { nama: "Bapak Fajar Ramadhan", nik: "7171041414900014", noKK: "7171041313180013", noRumah: "Mawar 13", role: "warga", telepon: "081300000013", pekerjaan: "Karyawan Swasta", jk: "L", keluarga: [] },
    { nama: "Ibu Tika Permata", nik: "7171041515880015", noKK: "7171041414180014", noRumah: "Mawar 14", role: "warga", telepon: "081300000014", pekerjaan: "Guru", jk: "P", keluarga: ["Hendra P (Suami)", "Aldi P (Anak)"] },
    { nama: "Bapak Hendra Gunawan", nik: "7171041616850016", noKK: "7171041515180015", noRumah: "Mawar 15", role: "warga", telepon: "081300000015", pekerjaan: "PNS", jk: "L", keluarga: ["Rina G (Istri)", "Bella G (Anak)", "Bagas G (Anak)"] },
    { nama: "Ibu Nisa Anjani", nik: "7171041717920017", noKK: "7171041616180016", noRumah: "Mawar 16", role: "warga", telepon: "081300000016", pekerjaan: "Karyawan Swasta", jk: "P", keluarga: [] },
    { nama: "Bapak Rizki Ramadhan", nik: "7171041818870018", noKK: "7171041717180017", noRumah: "Mawar 17", role: "warga", telepon: "081300000017", pekerjaan: "Teknisi", jk: "L", keluarga: ["Lia R (Istri)"] },
    { nama: "Ibu Maya Sari", nik: "7171041919900019", noKK: "7171041818180018", noRumah: "Mawar 18", role: "warga", telepon: "081300000018", pekerjaan: "Wiraswasta", jk: "P", keluarga: ["Dedi S (Suami)", "Aldo S (Anak)", "Sasa S (Anak)"] },
    { nama: "Bapak Dani Kurniawan", nik: "7171042020850020", noKK: "7171041919180019", noRumah: "Mawar 19", role: "warga", telepon: "081300000019", pekerjaan: "Karyawan Swasta", jk: "L", keluarga: ["Wati K (Istri)", "Rani K (Anak)"] },
  ];

  const warga: { id: string; nama: string; noRumah: string; noKK: string | null; nik: string | null }[] = [];
  for (const w of wargaData) {
    const created = await db.warga.create({
      data: {
        nama: w.nama,
        nik: w.nik ?? null,
        noKK: w.noKK ?? null,
        noRumah: w.noRumah,
        blok: "Mawar",
        telepon: w.telepon,
        pekerjaan: w.pekerjaan ?? null,
        jenisKelamin: w.jk ?? "L",
        role: w.role,
        jabatan: w.jabatan ?? null,
        alamat: `${w.noRumah}, Blok Mawar, Perumahan Ciptaland, Batam`,
        email: null,
        status: "aktif",
        tanggalBergabung: new Date(2024, 0, 1),
      },
    });
    // Add family members as AnggotaKK
    for (const anggota of (w.keluarga || [])) {
      await db.anggotaKK.create({
        data: {
          wargaId: created.id,
          nama: anggota,
          jenisKelamin: anggota.startsWith("Ibu") || anggota.match(/\(Istri\)|\(Anak\).*[ai]$/i) && Math.random() > 0.5 ? "P" : "L",
          hubungan: anggota.includes("(Istri)") ? "Istri" : anggota.includes("(Anak)") ? "Anak" : "Anggota",
        },
      });
    }
    warga.push(created);
  }

  // ===== PENGURUS table =====
  const pengurusData = [
    { nama: "H. Sutrisno", jabatan: "Ketua RT 002", telepon: "081300000001", bidang: "Pimpinan", urutan: 1 },
    { nama: "Endang Marliana", jabatan: "Bendahara RT 002", telepon: "081300000002", bidang: "Keuangan", urutan: 2 },
    { nama: "Agus Santoso", jabatan: "Sekretaris RT 002", telepon: "081300000003", bidang: "Administrasi", urutan: 3 },
    { nama: "Joko Widodo", jabatan: "Koordinator Keamanan", telepon: "081300000004", bidang: "Keamanan", urutan: 4 },
    { nama: "Siti Aminah", jabatan: "Koordinator Kebersihan", telepon: "081300000005", bidang: "Kebersihan", urutan: 5 },
    { nama: "Bayu J Putra", jabatan: "Koordinator Sosial", telepon: "081200000055", bidang: "Sosial", urutan: 6 },
  ];
  for (const p of pengurusData) {
    await db.pengurus.create({ data: { ...p, periode: "2024-2027" } });
  }

  // ===== USER (login accounts) =====
  // Demo password hash (sha256 of "rt002admin" - replace with proper hashing in production)
  const { createHash } = await import("crypto");
  const hash = (s: string) => createHash("sha256").update(s).digest("hex");
  const userData = [
    { email: "admin@rt002mawar.id", password: hash("admin123"), nama: "Administrator RT 002", role: "admin", telepon: "081234567890" },
    { email: "ketua@rt002mawar.id", password: hash("ketua123"), nama: "H. Sutrisno", role: "ketua", telepon: "081300000001" },
    { email: "bendahara@rt002mawar.id", password: hash("bendahara123"), nama: "Endang Marliana", role: "bendahara", telepon: "081300000002" },
    { email: "sekretaris@rt002mawar.id", password: hash("sekret123"), nama: "Agus Santoso", role: "pengurus", telepon: "081300000003" },
    { email: "keamanan@rt002mawar.id", password: hash("aman123"), nama: "Joko Widodo", role: "pengurus", telepon: "081300000004" },
    { email: "warga@rt002mawar.id", password: hash("warga123"), nama: "Bayu J Putra", role: "warga", telepon: "081200000055" },
  ];
  for (const u of userData) {
    await db.user.create({ data: u });
  }
  console.log(`Created ${userData.length} user accounts`);

  // ===== TRANSAKSI =====
  // Realistic 2026 transactions based on prompt figures
  // Pemasukan per month, Pengeluaran per month, building toward saldo ~Rp 8.002.313
  // Total Pengeluaran categories shown: Keamanan Rp 6.504.820 (45%), Fasilitas Rp 2.689.000 (18%), etc.
  // Total pengeluaran ~Rp 14.586.820
  
  const transaksi: { kode: string; jenis: string; tanggal: Date; kategori: string; keterangan: string; nominal: number; penerima?: string; sumber?: string }[] = [];
  let trxSeqPem = 1, trxSeqPeng = 1;

  // Saldo awal tahun 2026 (catatan awal) - so saldo akhir ~Rp 8.002.313
  transaksi.push({
    kode: `TRX-PEM-202601-${String(trxSeqPem++).padStart(3,"0")}`,
    jenis: "pemasukan",
    tanggal: new Date(2026, 0, 1),
    kategori: "Donasi / Sumbangan",
    keterangan: "Saldo awal tahun 2026 (sisa kas tahun sebelumnya)",
    nominal: 8085953,
    sumber: "Kas Tahun 2025",
  });

  // Monthly iuran pemasukan Jan-Aug 2026 (20 warga x Rp 25.000 = Rp 500.000/bulan + extras)
  for (let m = 0; m < 8; m++) {
    const bulan = new Date(2026, m, 5);
    // Iuran bulanan warga
    transaksi.push({
      kode: `TRX-PEM-2026${String(m+1).padStart(2,"0")}-${String(trxSeqPem++).padStart(3,"0")}`,
      jenis: "pemasukan",
      tanggal: bulan,
      kategori: "Iuran Bulanan Warga",
      keterangan: `Iuran bulanan warga ${BULAN[m]} 2026`,
      nominal: 500000,
      sumber: "Warga RT 002",
    });
    // Iuran keamanan
    transaksi.push({
      kode: `TRX-PEM-2026${String(m+1).padStart(2,"0")}-${String(trxSeqPem++).padStart(3,"0")}`,
      jenis: "pemasukan",
      tanggal: new Date(2026, m, 6),
      kategori: "Iuran Keamanan",
      keterangan: `Iuran keamanan ${BULAN[m]} 2026`,
      nominal: 600000,
      sumber: "Warga RT 002",
    });
    // Iuran kebersihan
    transaksi.push({
      kode: `TRX-PEM-2026${String(m+1).padStart(2,"0")}-${String(trxSeqPem++).padStart(3,"0")}`,
      jenis: "pemasukan",
      tanggal: new Date(2026, m, 7),
      kategori: "Iuran Kebersihan",
      keterangan: `Iuran kebersihan ${BULAN[m]} 2026`,
      nominal: 400000,
      sumber: "Warga RT 002",
    });
  }

  // One-off pemasukan - donations
  transaksi.push({
    kode: `TRX-PEM-202603-${String(trxSeqPem++).padStart(3,"0")}`,
    jenis: "pemasukan",
    tanggal: new Date(2026, 2, 15),
    kategori: "Donasi / Sumbangan",
    keterangan: "Sumbangan pembangunan pos keamanan",
    nominal: 1500000,
    sumber: "Donatur",
  });
  transaksi.push({
    kode: `TRX-PEM-202606-${String(trxSeqPem++).padStart(3,"0")}`,
    jenis: "pemasukan",
    tanggal: new Date(2026, 5, 20),
    kategori: "Bantuan Eksternal",
    keterangan: "Bantuan RW untuk kegiatan 17an",
    nominal: 1000000,
    sumber: "Pengurus RW 014",
  });

  // ===== PENGELUARAN (matching the donut chart figures) =====
  // Keamanan total ~Rp 6.504.820
  const pengKeamanan = [
    { ket: "Honor satpam malam Lebaran", nominal: 1500000, tgl: new Date(2026, 3, 12) },
    { ket: "Perbaikan lampu jalan blok Mawar", nominal: 1250000, tgl: new Date(2026, 1, 18) },
    { ket: "Penggantian kunci gerbang utama", nominal: 850000, tgl: new Date(2026, 4, 5) },
    { ket: "Baterai & service CCTV pos satpam", nominal: 680000, tgl: new Date(2026, 5, 8) },
    { ket: "Patroli malam tambahan (3 malam)", nominal: 540820, tgl: new Date(2026, 6, 22) },
    { ket: "Terali pengaman jendela pos", nominal: 680000, tgl: new Date(2026, 0, 25) },
    { ket: "Cat ulang rambu & marka jalan", nominal: 1000000, tgl: new Date(2026, 7, 3) },
  ];
  for (const p of pengKeamanan) {
    transaksi.push({
      kode: `TRX-PENG-2026${String(p.tgl.getMonth()+1).padStart(2,"0")}-${String(trxSeqPeng++).padStart(3,"0")}`,
      jenis: "pengeluaran",
      tanggal: p.tgl,
      kategori: "Keamanan",
      keterangan: p.ket,
      nominal: p.nominal,
      penerima: "Tim Keamanan RT",
    });
  }

  // Fasilitas ~Rp 2.689.000
  const pengFasilitas = [
    { ket: "Servis pompa air taman", nominal: 750000, tgl: new Date(2026, 2, 10) },
    { ket: "Penggantian pipa air bocor", nominal: 689000, tgl: new Date(2026, 4, 14) },
    { ket: "Cat ulang tugu RT 002", nominal: 650000, tgl: new Date(2026, 6, 1) },
    { ket: "Perbaikan kanopi pos", nominal: 600000, tgl: new Date(2026, 5, 19) },
  ];
  for (const p of pengFasilitas) {
    transaksi.push({
      kode: `TRX-PENG-2026${String(p.tgl.getMonth()+1).padStart(2,"0")}-${String(trxSeqPeng++).padStart(3,"0")}`,
      jenis: "pengeluaran",
      tanggal: p.tgl,
      kategori: "Fasilitas",
      keterangan: p.ket,
      nominal: p.nominal,
      penerima: "Tukang",
    });
  }

  // Kebersihan ~Rp 1.950.000
  const pengKebersihan = [
    { ket: "Honor petugas kebersihan 2 bulan", nominal: 1000000, tgl: new Date(2026, 1, 28) },
    { ket: "Sapu, serok, karung sampah", nominal: 350000, tgl: new Date(2026, 3, 5) },
    { ket: "Sewa truck angkut sampah besar", nominal: 600000, tgl: new Date(2026, 6, 15) },
  ];
  for (const p of pengKebersihan) {
    transaksi.push({
      kode: `TRX-PENG-2026${String(p.tgl.getMonth()+1).padStart(2,"0")}-${String(trxSeqPeng++).padStart(3,"0")}`,
      jenis: "pengeluaran",
      tanggal: p.tgl,
      kategori: "Kebersihan",
      keterangan: p.ket,
      nominal: p.nominal,
      penerima: "Petugas",
    });
  }

  // Sosial / Kematian ~Rp 1.500.000
  const pengSosial = [
    { ket: "Bantuan duka warga Mawar 21", nominal: 1000000, tgl: new Date(2026, 2, 22) },
    { ket: "Santunan anak yatim blok Mawar", nominal: 500000, tgl: new Date(2026, 6, 5) },
  ];
  for (const p of pengSosial) {
    transaksi.push({
      kode: `TRX-PENG-2026${String(p.tgl.getMonth()+1).padStart(2,"0")}-${String(trxSeqPeng++).padStart(3,"0")}`,
      jenis: "pengeluaran",
      tanggal: p.tgl,
      kategori: "Sosial / Kematian",
      keterangan: p.ket,
      nominal: p.nominal,
      penerima: "Warga",
    });
  }

  // Operasional RT ~Rp 1.350.000 (incl. the "Upah sebar lapkas Rp 50.000" example)
  const pengOperasional = [
    { ket: "Upah sebar lapkas", nominal: 50000, tgl: new Date(2026, 7, 31) },
    { ket: "ATK administrasi RT (kertas, tinta print)", nominal: 350000, tgl: new Date(2026, 0, 12) },
    { ket: "Konsumsi rapat warga 3x", nominal: 450000, tgl: new Date(2026, 3, 18) },
    { ket: "Iuran listrik taman & pos", nominal: 500000, tgl: new Date(2026, 6, 28) },
  ];
  for (const p of pengOperasional) {
    transaksi.push({
      kode: `TRX-PENG-2026${String(p.tgl.getMonth()+1).padStart(2,"0")}-${String(trxSeqPeng++).padStart(3,"0")}`,
      jenis: "pengeluaran",
      tanggal: p.tgl,
      kategori: "Operasional RT",
      keterangan: p.ket,
      nominal: p.nominal,
      penerima: "Bendahara RT",
    });
  }

  // Kegiatan Warga ~Rp 593.000 (angka tersisa dari 14.586.820 - total di atas)
  const pengKegiatan = [
    { ket: "Konsumsi 17an upacara bendera", nominal: 593820, tgl: new Date(2026, 7, 17) },
  ];
  for (const p of pengKegiatan) {
    transaksi.push({
      kode: `TRX-PENG-2026${String(p.tgl.getMonth()+1).padStart(2,"0")}-${String(trxSeqPeng++).padStart(3,"0")}`,
      jenis: "pengeluaran",
      tanggal: p.tgl,
      kategori: "Kegiatan Warga",
      keterangan: p.ket,
      nominal: p.nominal,
      penerima: "Panitia",
    });
  }

  // Insert all transaksi
  for (const t of transaksi) {
    await db.transaksi.create({
      data: {
        kode: t.kode,
        jenis: t.jenis,
        tanggal: t.tanggal,
        kategori: t.kategori,
        keterangan: t.keterangan,
        nominal: t.nominal,
        penerima: t.penerima ?? null,
        sumber: t.sumber ?? null,
        metode: "Tunai",
        status: "selesai",
      },
    });
  }
  console.log(`Created ${transaksi.length} transaksi`);

  // ===== TAGIHAN =====
  let tagSeq = 1;
  // Iuran bulanan for all warga for Jul, Aug 2026
  for (const w of warga) {
    if (w.role !== "warga") continue;
    for (const m of [6, 7]) {
      const lunas = Math.random() > 0.35;
      const kode = `TAG-2026${String(m+1).padStart(2,"0")}-${String(tagSeq++).padStart(4,"0")}`;
      await db.tagihan.create({
        data: {
          kode,
          wargaId: w.id,
          jenis: m % 2 === 0 ? "iuran_bulanan" : "iuran_keamanan",
          periode: `2026-${String(m+1).padStart(2,"0")}`,
          jumlah: 25000,
          tanggalJatuhTempo: new Date(2026, m, 10),
          status: lunas ? "lunas" : (m === 7 ? "belum_bayar" : "telat"),
          tanggalBayar: lunas ? new Date(2026, m, 8) : null,
          metode: lunas ? "Tunai" : null,
          keterangan: m % 2 === 0 ? "Iuran bulanan warga" : "Iuran keamanan",
        },
      });
    }
  }
  console.log("Created tagihan");

  // ===== KEGIATAN =====
  const kegiatanData = [
    { judul: "Kerja Bakti Bersih Lingkungan Blok Mawar", kategori: "Gotong Royong", tglMulai: new Date(2026, 7, 24), lokasi: "Sepanjang Jalan Mawar", peserta: 35, status: "akan_datang" },
    { judul: "Pertemuan Rutin Warga Bulanan", kategori: "Pertemuan", tglMulai: new Date(2026, 7, 28), lokasi: "Pos RT 002", peserta: 0, status: "akan_datang" },
    { judul: "Lomba 17an Anak-anak Mawar", kategori: "Sosial", tglMulai: new Date(2026, 7, 17), tglSelesai: new Date(2026, 7, 17), lokasi: "Halaman Blok Mawar", peserta: 42, status: "selesai" },
    { judul: "Patroli Malam Keamanan", kategori: "Keamanan", tglMulai: new Date(2026, 7, 15), lokasi: "Blok Mawar", peserta: 6, status: "selesai" },
    { judul: "Pengajian Warga Muslim", kategori: "Sosial", tglMulai: new Date(2026, 6, 25), lokasi: "Rumah Bapak Sutrisno", peserta: 25, status: "selesai" },
    { judul: "Senam Sehat Pagi Warga", kategori: "Olahraga", tglMulai: new Date(2026, 8, 7), lokasi: "Taman Mawar", peserta: 0, status: "akan_datang" },
  ];
  for (const k of kegiatanData) {
    await db.kegiatan.create({
      data: {
        judul: k.judul,
        deskripsi: `${k.judul} akan dilaksanakan di ${k.lokasi}. Diharapkan seluruh warga berpartisipasi.`,
        kategori: k.kategori,
        tanggalMulai: k.tglMulai,
        tanggalSelesai: k.tglSelesai ?? null,
        lokasi: k.lokasi,
        status: k.status,
        fotoUrl: null,
        jumlahPeserta: k.peserta,
      },
    });
  }

  // ===== PENGUMUMAN =====
  const pengumumanData = [
    { judul: "Pemberitahuan Kerja Bakti 24 Agustus 2026", konten: "Mengumumkan kepada seluruh warga RT 002 Blok Mawar akan diadakan kerja bakti membersihkan lingkungan pada hari Senin, 24 Agustus 2026 pukul 07.00 WIB. Mohon partisipasi aktif seluruh warga. Bawa alat kebersihan masing-masing.", kategori: "Penting", prioritas: "penting", status: "aktif" },
    { judul: "Tagihan Iuran Agustus 2026", konten: "Tagihan iuran bulanan Agustus 2026 telah diterbitkan. Jatuh tempo 10 Agustus 2026. Mohon segera melakukan pembayaran kepada Bendahara Ibu Endang.", kategori: "Mendesak", prioritas: "mendesak", status: "aktif" },
    { judul: "Pertemuan Rutin Warga", konten: "Pertemuan rutin warga bulanan akan diadakan tanggal 28 Agustus 2026 pukul 20.00 WIB di Pos RT 002. Agenda: evaluasi iuran, agenda kegiatan, dan koordinasi keamanan.", kategori: "Acara", prioritas: "normal", status: "aktif" },
    { judul: "Lomba 17an Hasil & Pemenang", konten: "Selamat kepada para pemenang lomba 17an anak-anak Blok Mawar. Terima kasih kepada panitia dan seluruh warga yang berpartisipasi.", kategori: "Umum", prioritas: "normal", status: "aktif" },
    { judul: "Pemasangan CCTV Baru", konten: "Dalam rangka meningkatkan keamanan, telah dipasang 2 unit CCTV baru di gerbang utama dan pos satpam. Mohon kerja sama warga untuk menjaga fasilitas tersebut.", kategori: "Penting", prioritas: "penting", status: "aktif" },
  ];
  for (const p of pengumumanData) {
    await db.pengumuman.create({
      data: {
        judul: p.judul,
        konten: p.konten,
        kategori: p.kategori,
        prioritas: p.prioritas,
        status: p.status,
        penulis: "Sekretariat RT 002",
        tanggal: new Date(),
      },
    });
  }

  // ===== PENGADUAN =====
  const pengaduanData = [
    { judul: "Lampu jalan depan Mawar 08 mati", kategori: "Keamanan", pelapor: "Bapak Bayu J Putra", status: "proses", lokasi: "Jalan Mawar depan no 08" },
    { judul: "Saluran air tersumbat Mawar 12-14", kategori: "Fasilitas", pelapor: "Ibu Lia Amalia", status: "baru", lokasi: "Trotoar Mawar 12-14" },
    { judul: "Sampah menumpuk taman kecil", kategori: "Kebersihan", pelapor: "Ibu Rina Marlina", status: "selesai", lokasi: "Taman Mawar", tanggapan: "Sudah diangkut oleh petugas kebersihan pada 18 Agustus 2026." },
    { judul: "Anjing liar berkeliaran malam", kategori: "Keamanan", pelapor: "Bapak Andi Pratama", status: "baru", lokasi: "Gerbang belakang Mawar" },
  ];
  let aduSeq = 1;
  for (const p of pengaduanData) {
    await db.pengaduan.create({
      data: {
        kode: `ADU-2026-${String(aduSeq++).padStart(5,"0")}`,
        judul: p.judul,
        deskripsi: p.judul + ". Mohon ditindaklanjuti secepatnya oleh pengurus RT terkait.",
        kategori: p.kategori,
        lokasi: p.lokasi,
        status: p.status,
        pelapor: p.pelapor,
        tanggapan: p.tanggapan ?? null,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 86400000),
      },
    });
  }

  // ===== KWITANSI (link to some transaksi) =====
  const someTransaksi = await db.transaksi.findMany({ take: 8, orderBy: { tanggal: "desc" } });
  let kwSeq = 1;
  for (const t of someTransaksi) {
    await db.kwitansi.create({
      data: {
        kode: `KWI-2026-${String(kwSeq++).padStart(4,"0")}`,
        transaksiId: t.id,
        tanggal: t.tanggal,
        nominal: t.nominal,
        penerima: t.penerima ?? t.sumber ?? "Bendahara RT 002",
        pembayar: "Warga RT 002",
        keterangan: t.keterangan,
      },
    });
  }

  // ===== TAUTAN =====
  const tautanData = [
    { judul: "YouTube RT 002 Mawar", url: "https://youtube.com/@rt002mawar", kategori: "Sosial Media", deskripsi: "Channel resmi dokumentasi kegiatan RT 002" },
    { judul: "Website Resmi RT 002", url: "https://rt002mawar.id", kategori: "Layanan", deskripsi: "Portal informasi resmi RT 002 Blok Mawar" },
    { judul: "WhatsApp Admin RT 002", url: "https://wa.me/6281234567890", kategori: "Kontak", deskripsi: "Hubungi admin/pengurus RT 002 langsung" },
    { judul: "Website Kelurahan Suka Maju", url: "https://kelurahan-sukamaju.batam.go.id", kategori: "Pemerintah", deskripsi: "Portal kelurahan setempat" },
    { judul: "Instagram RT 002 Mawar", url: "https://instagram.com/rt002mawar", kategori: "Sosial Media", deskripsi: "Update foto & video kegiatan" },
    { judul: "Grup WhatsApp Warga", url: "https://wa.me/6281234567890", kategori: "Kontak", deskripsi: "Grup WhatsApp warga RT 002 Blok Mawar" },
    { judul: "Pengaduan Online Kota Batam", url: "https://batam.go.id/layanan/pengaduan", kategori: "Pemerintah", deskripsi: "Layanan pengaduan resmi Pemkot Batam" },
    { judul: "TikTok RT 002 Mawar", url: "https://tiktok.com/@rt002mawar", kategori: "Sosial Media", deskripsi: "Konten pendek kegiatan warga" },
  ];
  for (let i = 0; i < tautanData.length; i++) {
    await db.tautan.create({
      data: { ...tautanData[i], urutan: i + 1 },
    });
  }

  // ===== MARKETPLACE =====
  const marketData = [
    { nama: "Kue Lapis legit rumahan", kategori: "Kuliner", harga: 75000, penjual: "Ibu Wati Suryani", telepon: "081300000008", deskripsi: "Kue lapis legit legit homemade, bisa pesan harian.", kondisi: "baru" },
    { nama: "Jasa Service AC & Listrik", kategori: "Jasa", harga: 80000, penjual: "Bapak Andi Pratama", telepon: "081300000009", deskripsi: "Teknisi bersertifikat. Cuci AC, service, instalasi listrik rumah tangga.", kondisi: "baru" },
    { nama: "Catering Harian Warga", kategori: "Makanan", harga: 25000, penjual: "Ibu Rina Marlina", telepon: "081300000010", deskripsi: "Catering harian, menu berganti tiap hari. Pesan H-1.", kondisi: "baru" },
    { nama: "Sepeda Anak Bekas Layak", kategori: "Barang", harga: 350000, penjual: "Bapak Eko Nugroho", telepon: "081300000011", deskripsi: "Sepeda anak usia 5-8 tahun, kondisi baik, ban baru.", kondisi: "bekas" },
    { nama: "Laundry Kilogram Murah", kategori: "Jasa", harga: 6000, penjual: "Ibu Maya Sari", telepon: "081300000018", deskripsi: "Laundry kiloan, antar-jemput gratis area Mawar.", kondisi: "baru" },
    { nama: "Tanaman Hias Monstera", kategori: "Barang", harga: 150000, penjual: "Ibu Dewi Lestari", telepon: "081300000006", deskripsi: "Monstera deliciosa size medium, sudah berakir sehat.", kondisi: "baru" },
    { nama: "Servis HP & Ganti LCD", kategori: "Jasa", harga: 100000, penjual: "Bapak Rizki Ramadhan", telepon: "081300000017", deskripsi: "Service HP semua merek, ganti LCD, baterai, port cas.", kondisi: "baru" },
    { nama: "Kue Kering Lebaran", kategori: "Kuliner", harga: 50000, penjual: "Ibu Tika Permata", telepon: "081300000014", deskripsi: "Nastar, kastengel, putri salju. Toples isi 250gr.", kondisi: "baru" },
  ];
  for (const m of marketData) {
    await db.marketplace.create({
      data: {
        nama: m.nama,
        kategori: m.kategori,
        harga: m.harga,
        deskripsi: m.deskripsi,
        penjual: m.penjual,
        telepon: m.telepon,
        kondisi: m.kondisi,
        status: "tersedia",
      },
    });
  }

  // ===== TRAFIK WEBSITE =====
  // 30 days of traffic
  for (let d = 29; d >= 0; d--) {
    const date = new Date(NOW.getTime() - d * 86400000);
    const base = 30 + Math.floor(Math.random() * 50);
    for (const device of ["mobile", "desktop", "tablet"]) {
      const factor = device === "mobile" ? 1 : device === "desktop" ? 0.4 : 0.15;
      await db.trafikWebsite.create({
        data: {
          tanggal: date,
          pageViews: Math.floor(base * factor * (1.5 + Math.random())),
          visitors: Math.floor(base * factor),
          sessions: Math.floor(base * factor * 0.8),
          device,
          referrer: ["WhatsApp", "Instagram", "Direct", "Google", "YouTube"][Math.floor(Math.random() * 5)],
          page: ["/", "/pengumuman", "/tagihan", "/kegiatan", "/marketplace"][Math.floor(Math.random() * 5)],
        },
      });
    }
  }

  // ===== PENGATURAN =====
  const settings = [
    { key: "nama_rt", value: "RT 002 Blok Mawar", kategori: "umum" },
    { key: "rw", value: "014", kategori: "umum" },
    { key: "perumahan", value: "Ciptaland", kategori: "umum" },
    { key: "kota", value: "Batam", kategori: "umum" },
    { key: "periode_pengurus", value: "2024-2027", kategori: "umum" },
    { key: "whatsapp_admin", value: "6281234567890", kategori: "kontak" },
    { key: "iuran_bulanan", value: "25000", kategori: "keuangan" },
    { key: "iuran_keamanan", value: "30000", kategori: "keuangan" },
    { key: "iuran_kebersihan", value: "20000", kategori: "keuangan" },
    { key: "bank_nama", value: "Bank BRI", kategori: "keuangan" },
    { key: "bank_rekening", value: "1234-5678-9012-3", kategori: "keuangan" },
    { key: "bank_pemilik", value: "Endang Marliana", kategori: "keuangan" },
    { key: "qris_url", value: "https://qris.id/rt002mawar", kategori: "keuangan" },
    { key: "qris_image", value: "", kategori: "keuangan" },
    { key: "logo_url", value: "", kategori: "umum" },
    { key: "nama_ketua", value: "H. Sutrisno", kategori: "umum" },
    { key: "nama_bendahara", value: "Endang Marliana", kategori: "umum" },
    { key: "ttd_bendahara", value: "", kategori: "umum" },
  ];
  for (const s of settings) {
    await db.pengaturan.create({ data: { key: s.key, value: s.value, kategori: s.kategori } });
  }

  console.log("✅ Seed complete!");
  console.log(`- ${warga.length} warga`);
  console.log(`- ${transaksi.length} transaksi`);
  console.log("- tagihan, kegiatan, pengumuman, pengaduan, kwitansi, tautan, marketplace, trafik, pengaturan");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
