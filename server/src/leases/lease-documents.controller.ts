import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { LeaseDocumentsService } from './lease-documents.service';
import { UpdateLeaseDocumentDto } from './dto/update-lease-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { StreamableFile } from '@nestjs/common';

@ApiTags('leases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leases/:leaseId/documents')
export class LeaseDocumentsController {
  constructor(private leaseDocumentsService: LeaseDocumentsService) {}

  @Post()
  @ApiOperation({ summary: 'Upload a document for a lease' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' }, name: { type: 'string', description: 'Optional display name for the document' } }, required: ['file'] } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } })) // 10 MB
  async upload(
    @CurrentUser() user: User,
    @Param('leaseId') leaseId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('name') displayName?: string,
  ) {
    return this.leaseDocumentsService.upload(user.id, user.role, leaseId, file, displayName);
  }

  @Get()
  @ApiOperation({ summary: 'List documents for a lease' })
  async list(@CurrentUser() user: User, @Param('leaseId') leaseId: string) {
    return this.leaseDocumentsService.listByLease(user.id, user.role, leaseId);
  }

  @Patch(':docId')
  @ApiOperation({ summary: 'Update a lease document (e.g. display name)' })
  async update(
    @CurrentUser() user: User,
    @Param('leaseId') leaseId: string,
    @Param('docId') docId: string,
    @Body() dto: UpdateLeaseDocumentDto,
  ) {
    return this.leaseDocumentsService.update(user.id, user.role, leaseId, docId, dto);
  }

  @Get(':docId/download')
  @ApiOperation({ summary: 'Download a lease document' })
  async download(
    @CurrentUser() user: User,
    @Param('leaseId') leaseId: string,
    @Param('docId') docId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { stream, doc } = await this.leaseDocumentsService.getDownloadStream(user.id, user.role, leaseId, docId);
    const filename = doc.downloadFileName.replace(/[^\w.-]/g, '_');
    res.set({
      'Content-Disposition': `attachment; filename="${filename}"`,
      ...(doc.mimeType && { 'Content-Type': doc.mimeType }),
    });
    return new StreamableFile(stream);
  }

  @Delete(':docId')
  @ApiOperation({ summary: 'Delete a lease document' })
  async remove(
    @CurrentUser() user: User,
    @Param('leaseId') leaseId: string,
    @Param('docId') docId: string,
  ) {
    return this.leaseDocumentsService.remove(user.id, user.role, leaseId, docId);
  }
}
