import {
  Body,
  Controller,
  Get,
  HttpException,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as XLSX from 'xlsx';
import { WhitelistService } from './whitelist.service';

@Controller('whitelist')
export class WhitelistController {
  constructor(private readonly whitelistService: WhitelistService) {}

  @Get()
  async getWhitelist() {
    return this.whitelistService.getWhitelist();
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadWhitelistExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException(
        `Please provide correct file name with extension `,
        400,
      );
    }
    console.log('this is file', file);
    // Read the Excel file from memory
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    let rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    // Optionally, map/validate the data to match your schema.
    const whitelistData = rawData.map((row: any) => ({
      phone_number: row.PHONE_NUMBER?.toString().trim(),
      max_limit: Number(row.MAX_LIMIT),
      industry: row.INDUSTRY?.toString().trim(),
    }));

    console.log('this is whitelistData', whitelistData);
    // Save all records to Neo4j
    await this.whitelistService.saveRecords(whitelistData);

    return { message: 'Whitelist data uploaded successfully' };
  }
}
