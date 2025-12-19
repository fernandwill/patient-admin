import { describe, it, expect, vi } from "vitest";
import { exportToExcel, exportToPDF } from "../export";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";

vi.mock("xlsx", () => ({
    utils: {
        json_to_sheet: vi.fn(),
        book_new: vi.fn(),
        book_append_sheet: vi.fn(),
    },
    writeFile: vi.fn(),
}));

vi.mock("jspdf", () => {
    const jsPDFMock = vi.fn(function () {
        return {
            setFontSize: vi.fn(),
            text: vi.fn(),
            line: vi.fn(),
            save: vi.fn(),
            autoTable: vi.fn(),
        };
    });
    return { jsPDF: jsPDFMock };
});

vi.mock("jspdf-autotable", () => ({
    default: vi.fn(),
}));

describe("Export Utilities", () => {
    const mockData = [
        {
            registration_no: "REG001",
            registration_date: "2025-12-19T10:00:00Z",
            full_name: "John Doe",
            medical_record_no: "RM001",
            date_of_birth: "1990-01-01",
            gender: "Male"
        }
    ];

    it("should call XLSX functions correctly in exportToExcel", () => {
        exportToExcel(mockData, "test_export");
        expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(mockData);
        expect(XLSX.writeFile).toHaveBeenCalled();
    });

    it("should call jsPDF functions correctly in exportToPDF", () => {
        exportToPDF(mockData, "test_export", "Test Title");

        // Get the instance that was created inside exportToPDF
        const mockInstance = vi.mocked(jsPDF).mock.results[0].value;
        expect(mockInstance.save).toHaveBeenCalledWith("test_export.pdf");
    });
});
