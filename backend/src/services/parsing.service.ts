import { createHash } from 'crypto';
import pdfParse from 'pdf-parse-fork';
import * as mammoth from 'mammoth';

interface PdfParseResult {
  text: string;
  numpages: number;
  info: any;
  metadata: any;
  version: string;
}

interface MammothResult {
  value: string;
  messages: any[];
}

const MAX_CHARS_PER_FILE = 8000;
const TRUNCATION_SUFFIX = '\n\n[TRUNCATED: Document text exceeded maximum character limit]';

export function validateMagicBytes(buffer: Buffer, mimeType: string): void {
  if (mimeType === 'application/pdf') {
    if (buffer.length < 5) {
      throw new Error('Invalid PDF: file too small');
    }
    const header = buffer.subarray(0, 5);
    if (header[0] !== 0x25 || header[1] !== 0x50 || header[2] !== 0x44 || header[3] !== 0x46 || header[4] !== 0x2D) {
      throw new Error('Invalid PDF: missing %PDF- header');
    }
    return;
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    if (buffer.length < 4) {
      throw new Error('Invalid DOCX: file too small');
    }
    const header = buffer.subarray(0, 4);
    if (header[0] !== 0x50 || header[1] !== 0x4B || header[2] !== 0x03 || header[3] !== 0x04) {
      throw new Error('Invalid DOCX: missing PK\\x03\\x04 header');
    }
    return;
  }

  if (mimeType === 'text/markdown') {
    for (let i = 0; i < buffer.length; i++) {
      const byte = buffer[i];
      if (byte < 0x20 && byte !== 0x0A && byte !== 0x0D && byte !== 0x09) {
        throw new Error('Invalid MD: contains control characters');
      }
    }
    return;
  }

  throw new Error(`Unsupported MIME type for magic-byte validation: ${mimeType}`);
}

function computeContentHash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

function truncateText(text: string): { text: string; isTruncated: boolean } {
  if (text.length <= MAX_CHARS_PER_FILE) {
    return { text, isTruncated: false };
  }
  return { text: text.slice(0, MAX_CHARS_PER_FILE) + TRUNCATION_SUFFIX, isTruncated: true };
}

export async function extractTextFromDocument(
  buffer: Buffer,
  mimeType: string,
): Promise<{
  extractedText: string;
  characterCount: number;
  isTruncated: boolean;
  contentHash: string;
}> {
  const contentHash = computeContentHash(buffer);

  let extractedText: string;

  if (mimeType === 'application/pdf') {
    const result: PdfParseResult = await pdfParse(buffer);
    extractedText = result.text;
  } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result: MammothResult = await mammoth.extractRawText({ buffer });
    extractedText = result.value;
  } else if (mimeType === 'text/markdown') {
    extractedText = buffer.toString('utf-8');
  } else {
    throw new Error(`Unsupported MIME type: ${mimeType}`);
  }

  const { text: truncatedText, isTruncated } = truncateText(extractedText);

  return {
    extractedText: truncatedText,
    characterCount: extractedText.length,
    isTruncated,
    contentHash,
  };
}