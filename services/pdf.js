export async function extractTextFromPDF(buffer) {
    try {
        // pdf-parse v2.x API - buffer must be passed as 'data'
        const { PDFParse } = await import('pdf-parse');
        
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();

        // clean to save tokens
        const cleanText = result.text.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
        return cleanText;
    } catch (error) {
        console.error("error parsing pdf:", error);
        throw new Error("failed to parse pdf");
    }
}