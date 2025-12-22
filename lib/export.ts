import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatRegTime, formatDoB } from './formatters';

export const exportToExcel = (data: any[], fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

export const exportToPDF = (data: any[], fileName: string, title: string) => {
    try {
        const doc = new jsPDF();

        // Kop Surat (Letterhead)
        doc.setFontSize(18);
        doc.text("TEST HOSPITAL/CLINIC", 105, 15, { align: "center" });
        doc.setFontSize(10);
        doc.text("INSTITUTION ADDRESS HERE", 105, 22, { align: "center" });
        doc.text("INSTITUTION CONTACT HERE", 105, 27, { align: "center" });
        doc.line(20, 32, 190, 32); // Horizontal line

        doc.setFontSize(14);
        doc.text(title, 105, 42, { align: "center" });

        const tableColumn = ["Reg No", "Reg Date", "Patient Name", "No RM", "DOB", "Gender"];
        const tableRows = data.map(reg => [
            reg.registration_no,
            formatRegTime(reg.registration_date),
            reg.full_name,
            reg.medical_record_no,
            formatDoB(reg.date_of_birth),
            reg.gender || "-"
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 50,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            styles: { fontSize: 9 },
        });

        doc.save(`${fileName}.pdf`);
    } catch (error) {
        console.error("Error exporting to PDF:", error);
    }
};
