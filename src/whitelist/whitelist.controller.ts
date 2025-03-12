import {
  Body,
  Controller,
  Get,
  HttpException,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as XLSX from 'xlsx';
import { WhitelistService } from './whitelist.service';
import { max } from 'rxjs';

function normalizedPhoneNumber(phoneNumber: string) {
  console.log('this is phoneNumber', phoneNumber);
  return phoneNumber.trim().replace(/^(?:\+855|00855|885)/, '0');
}

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

  @Get('user')
  async getUser(@Query() chatId: number) {
    const response = await this.whitelistService.getUser(chatId);
    if (response.length === 0) {
      throw new HttpException('User not found', 404);
    }
    console.log('this is response', response);
    if (response.phone_number) {
      const normalizedPhone = normalizedPhoneNumber(response.phone_number);
      console.log('normalizedPhone', normalizedPhone);
      const whitelistEntry =
        await this.whitelistService.findByPhoneNumber(normalizedPhone);
      console.log('this is whitelistEntry', whitelistEntry);
      return {
        ...response,
        maxLimit: whitelistEntry?.max_limit,
        isWhitelist: !!whitelistEntry,
      };
    }
    return response;
  }

  @Post('user')
  async createUser(@Body() user: any) {
    return this.whitelistService.createUser(user);
  }
}
