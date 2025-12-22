# Sistem Administrasi Pasien (Patient Admin)

Sistem manajemen pasien yang dibuat dengan Next.js, dirancang untuk menangani data master pasien, registrasi pasien, pencarian pasien, dan pelaporan data pasien menggunakan ekspor ke file PDF atau Excel.

Demo aplikasi dapat diakses di: https://patient-admin-demo-681080561228.asia-southeast1.run.app/ (hosted by Google Cloud Platform)

## Tech Stack yang Digunakan

- **Framework**: Next.js (App Router & React)
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **Containerization**: Docker & Docker Compose
- **Library Utama**:
  - `jspdf` & `jspdf-autotable` (Laporan PDF)
  - `xlsx` (Ekspor Excel)
  - `react-hook-form` (Manajemen Form)
  - `Cloudinary` (Upload dan Penyimpanan Foto Pasien)

## Fitur 

1. **Manajemen Pasien**:
   - CRUD lengkap dengan fitur *Soft Delete*. Untuk *Hard Delete* bisa dilakukan melalui page "Show deleted registration/patient" lalu melakukan delete dan konfirmasi dua kali.
   - Upload foto profil pasien menggunakan layanan Cloudinary.
   - Auto-generate Nomor Rekam Medis (No RM) unik.
   - Klik row di list pasien untuk membuka detail pasien.
   - Pasien yang sudah di "soft delete" bisa di-restore dengan button "Restore".

2. **Registrasi Pasien**:
   - Pencatatan kunjungan pasien secara *real-time*.
   - Auto-generate Nomor Registrasi yang reset setiap hari.
   - Relasi data yang kuat antara registrasi dan data master pasien.
   - Klik row di list registrasi untuk membuka detail registrasi pasien.
   - Registrasi yang sudah di "soft delete" bisa di-restore dengan button "Restore".

3. **Pencarian & Filter**:
   - Pencarian global berdasarkan Nama, Tanggal Lahir, No RM, atau No Registrasi.
   - Filter data berdasarkan rentang waktu (Start Date - End Date).

4. **Pelaporan**:
   - Ekspor data ke format Excel (.xlsx).
   - Ekspor data ke format PDF dengan kop surat yang bisa di custom.

## Fitur Inti

### 1. Auto-Generate Sequence
Sistem ini menggunakan logika *atomic upsert* pada database untuk menghasilkan nomor urut otomatis (No RM & No Reg) guna mencegah duplikasi data meskipun diakses secara bersamaan.

```typescript
// lib/sequence.ts
export async function generateSequenceWithClient(client: PgClient, type: SequenceType, now: Date = new Date()): Promise<string> {
    const yy = String(now.getUTCFullYear()).slice(-2);
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(now.getUTCDate()).padStart(2, "0");
    const dateStr = `${yy}${mm}${dd}`;
    const isoDate = `${now.getUTCFullYear()}-${mm}-${dd}`;

    const upsert = `
        INSERT INTO sequence_counters (sequence_date, sequence_type, last_value) 
        VALUES ($1, $2, 1) 
        ON CONFLICT (sequence_date, sequence_type) 
        DO UPDATE SET last_value = sequence_counters.last_value + 1 
        RETURNING last_value;
    `;

    const {rows} = await client.query(upsert, [isoDate, type]);
    const counter = rows[0].last_value;
    const width = type === "RM" ? 3 : 6;
    const suffix = String(counter).padStart(width, "0");

    return `${dateStr}${suffix}`;
}
```

### 2. Upload Foto (Cloudinary)
Implementasi upload foto menggunakan layanan Cloudinary dengan validasi tipe file (magic bytes dan hanya menerima JPEG/PNG/WEBP) dan batasan ukuran file (5MB).

```typescript
// app/api/upload/route.ts
export async function POST(req: Request) {
    const form = await req.formData();
    const file = form.get("file") as File;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Validasi Magic Bytes untuk keamanan
    const isAllowedMagic = checkMagicBytes(buffer); 
    if (!isAllowedMagic || buffer.length > MAX_SIZE) {
        return NextResponse.json({error: "Invalid file"}, {status: 400});
    }

    // Upload ke Cloudinary menggunakan stream
    const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: "patient-admin" }, (err, res) => {
            if (err) reject(err);
            else resolve(res);
        });
        stream.end(buffer);
    });

    return NextResponse.json({ url: uploadResult.secure_url }, { status: 201 });
}
```

### 3. Ekspor Laporan PDF & Excel
Fitur ekspor data menggunakan `jspdf` untuk laporan PDF dengan kop surat custom dan `xlsx` untuk data spreadsheet MS Excel.

```typescript
// lib/export.ts
export const exportToPDF = (data: any[], fileName: string, title: string) => {
    const doc = new jsPDF();
    
    // Desain Kop Surat
    doc.setFontSize(18);
    doc.text("TEST HOSPITAL/CLINIC", 105, 15, { align: "center" });
    doc.line(20, 32, 190, 32);

    // Render Tabel Otomatis
    autoTable(doc, {
        head: [["Reg No", "Patient Name", "No RM", "Gender"]],
        body: data.map(reg => [reg.registration_no, reg.full_name, reg.medical_record_no, reg.gender]),
        startY: 50,
        theme: 'grid'
    });

    doc.save(`${fileName}.pdf`);
};

export const exportToExcel = (data: any[], fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
```

## Cara Menjalankan Aplikasi Project

### Prasyarat
- Docker & Docker Compose terinstall di sistem Anda.

### Langkah-langkah menjalankan aplikasi project dengan Docker
1. Clone repositori ini.
2. Salin file `.env.example` menjadi `.env` dan isi variabel yang diperlukan (Database, Cloudinary API Key, dll).
3. Jalankan perintah berikut:
   ```bash
   docker compose up -d --build
   ```
4. Aplikasi akan berjalan di `http://localhost:3000`.


