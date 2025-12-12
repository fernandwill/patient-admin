import {describe, it, expect, vi, beforeEach} from "vitest";
import {generateSequence} from "../sequence";
import {getClient} from "../db";

vi.mock("../db", () => ({
    getClient: vi.fn(),
}));

describe("generateSequence", () => {
    const mockClient = {
            query: vi.fn(),
            release: vi.fn(),
        };

    beforeEach(() => {
        vi.clearAllMocks();
        (getClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockClient);
    });

    it("should generate YYMMDD001 for first RM", async () => {
        mockClient.query.mockResolvedValue({rows: [{last_value: 1}]});
        const result = await generateSequence("RM");
        expect(result).toBe("251212001");
    });

    it("should generate YYMMDD002 for second RM", async () => {
        mockClient.query.mockResolvedValue({rows: [{last_value: 2}]});
        const result = await generateSequence("RM");
        expect(result).toBe("251212002");
    });
});
    

    