import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeasesService } from './leases.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createReadStream } from 'fs';
import type { Readable } from 'stream';

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function sanitizeFileName(name: string): string {
  return name.replace(/[^\w\s.-]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 200) || 'document';
}

@Injectable()
export class LeaseDocumentsService {
  constructor(
    private prisma: PrismaService,
    private leasesService: LeasesService,
  ) {}

  async ensureLeaseAccessible(userId: string, role: import('@prisma/client').UserRole, leaseId: string) {
    await this.leasesService.findOne(userId, role, leaseId);
  }

  private getLeaseDir(leaseId: string): string {
    return path.join(UPLOAD_DIR, 'leases', leaseId);
  }

  async upload(userId: string, role: import('@prisma/client').UserRole, leaseId: string, file: Express.Multer.File, displayName?: string | null) {
    await this.ensureLeaseAccessible(userId, role, leaseId);
    if (!file || !file.buffer) throw new BadRequestException('No file provided');
    if (file.size > MAX_FILE_SIZE) throw new BadRequestException('File too large (max 10 MB)');

    const ext = path.extname(file.originalname) || '';
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const fileName = `${baseName}-${Date.now()}${ext}`;
    const relativePath = path.join('leases', leaseId, fileName);
    const absolutePath = path.join(UPLOAD_DIR, relativePath);

    const dir = this.getLeaseDir(leaseId);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(absolutePath, file.buffer);

    const nameToStore = displayName?.trim() || null;
    const doc = await this.prisma.leaseDocument.create({
      data: {
        leaseId,
        displayName: nameToStore,
        originalFileName: file.originalname || fileName,
        storedPath: relativePath,
        mimeType: file.mimetype || null,
        size: file.size,
      },
    });
    return doc;
  }

  async listByLease(userId: string, role: import('@prisma/client').UserRole, leaseId: string) {
    await this.ensureLeaseAccessible(userId, role, leaseId);
    return this.prisma.leaseDocument.findMany({
      where: { leaseId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, role: import('@prisma/client').UserRole, leaseId: string, docId: string) {
    await this.ensureLeaseAccessible(userId, role, leaseId);
    const doc = await this.prisma.leaseDocument.findFirst({
      where: { id: docId, leaseId },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async getDownloadStream(userId: string, role: import('@prisma/client').UserRole, leaseId: string, docId: string): Promise<{ stream: Readable; doc: { downloadFileName: string; mimeType: string | null } }> {
    const doc = await this.findOne(userId, role, leaseId, docId);
    const absolutePath = path.join(UPLOAD_DIR, doc.storedPath);
    try {
      await fs.access(absolutePath);
    } catch {
      throw new NotFoundException('File not found on disk');
    }
    const stream = createReadStream(absolutePath) as Readable;
    const downloadFileName = doc.displayName?.trim() ? sanitizeFileName(doc.displayName) + path.extname(doc.originalFileName) : doc.originalFileName;
    return { stream, doc: { downloadFileName, mimeType: doc.mimeType } };
  }

  async update(userId: string, role: import('@prisma/client').UserRole, leaseId: string, docId: string, data: { displayName?: string | null }) {
    await this.findOne(userId, role, leaseId, docId);
    const displayName = data.displayName === undefined ? undefined : (data.displayName?.trim() || null);
    return this.prisma.leaseDocument.update({
      where: { id: docId },
      data: { ...(displayName !== undefined && { displayName }) },
    });
  }

  async remove(userId: string, role: import('@prisma/client').UserRole, leaseId: string, docId: string) {
    const doc = await this.findOne(userId, role, leaseId, docId);
    const absolutePath = path.join(UPLOAD_DIR, doc.storedPath);
    try {
      await fs.unlink(absolutePath);
    } catch {
      // ignore if file already missing
    }
    await this.prisma.leaseDocument.delete({ where: { id: docId } });
    return { deleted: true };
  }
}
