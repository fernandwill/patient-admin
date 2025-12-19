/**
 * Formats a date string into DD-MM-YYYY HH:MM
 */
export const formatRegTime = (value: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    const pad2 = (n: number) => String(n).padStart(2, "0");
    if (Number.isNaN(date.getTime())) return value;
    return `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

/**
 * Formats a date string into DD-MM-YYYY
 */
export const formatDoB = (value: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    const pad2 = (n: number) => String(n).padStart(2, "0");
    if (Number.isNaN(date.getTime())) return value;
    return `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()}`;
};
