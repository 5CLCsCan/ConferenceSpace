import * as fs from 'fs';
import * as path from 'path';

/**
 * Generate a dummy PDF file for testing
 * Creates a minimal valid PDF file
 * @param filePath - Path where the PDF should be created
 * @returns Path to the created file
 */
export function generateDummyPDF(filePath: string): string {
  // Minimal valid PDF content
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Paper) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000317 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
410
%%EOF`;

  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write the PDF file
  fs.writeFileSync(filePath, pdfContent, 'utf-8');
  
  return filePath;
}

/**
 * Get or create a dummy PDF file for testing
 * @param filename - Name of the PDF file (default: 'sample.pdf')
 * @returns Path to the PDF file
 */
export function getOrCreateDummyPDF(filename: string = 'sample.pdf'): string {
  const fixturesDir = path.join(__dirname, '..', 'fixtures', 'files');
  const filePath = path.join(fixturesDir, filename);

  // If file already exists, return it
  if (fs.existsSync(filePath)) {
    return filePath;
  }

  // Otherwise, create it
  return generateDummyPDF(filePath);
}

/**
 * Read a file and return its buffer
 * @param filePath - Path to the file
 * @returns File buffer
 */
export function readFileAsBuffer(filePath: string): Buffer {
  return fs.readFileSync(filePath);
}

/**
 * Get file size in bytes
 * @param filePath - Path to the file
 * @returns File size in bytes
 */
export function getFileSize(filePath: string): number {
  const stats = fs.statSync(filePath);
  return stats.size;
}

/**
 * Clean up test files
 * @param filePath - Path to the file to delete
 */
export function cleanupFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
