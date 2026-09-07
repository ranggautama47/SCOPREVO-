declare module 'multer' {
  import { Request } from 'express';

  export interface File {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
  }

  export interface MulterError extends Error {
    code: string;
  }

  export interface FileFilterCallback {
    (error: Error | null, acceptFile: boolean): void;
  }

  export interface Options {
    storage?: StorageEngine;
    limits?: Limits;
    fileFilter?: (req: Request, file: File, cb: FileFilterCallback) => void;
  }

  export interface StorageEngine {
    _handleFile(req: Request, file: File, cb: (error?: Error | null, info?: Partial<File>) => void): void;
    _removeFile(req: Request, file: File, cb: (error: Error | null) => void): void;
  }

  export interface Limits {
    fileSize?: number;
  }

  export function memoryStorage(): StorageEngine;

  export interface Multer {
    single(fieldname: string): (req: Request, res: any, next: (err?: any) => void) => void;
    any(): (req: Request, res: any, next: (err?: any) => void) => void;
  }

  export default function (options?: Options): Multer;
}

declare module 'pdf-parse-fork' {
  export interface PdfParseResult {
    text: string;
    numpages: number;
    info: any;
    metadata: any;
    version: string;
  }

  function pdfParse(buffer: Buffer, options?: any): Promise<PdfParseResult>;
  export default pdfParse;
}

declare module 'mammoth' {
  export interface MammothResult {
    value: string;
    messages: any[];
  }

  export function extractRawText(options: { buffer: Buffer }): Promise<MammothResult>;
}