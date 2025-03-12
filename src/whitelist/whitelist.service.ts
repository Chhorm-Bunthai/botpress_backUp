import { Inject, Injectable, Logger } from '@nestjs/common';

interface WhiteListRecord {
  phone_number: string;
  max_limit: number;
  industry: string;
}

interface ValidationError {
  field: string;
  message: string;
}

@Injectable()
export class WhitelistService {
  private readonly logger = new Logger(WhitelistService.name);
  constructor(@Inject('POSTGRES_POOL') private readonly sql: any) {}

  async getUser(chatId: any): Promise<any> {
    console.log('ChatID', JSON.stringify(chatId, null, 2));
    try {
      if (!chatId || !chatId.chatId) {
        throw new Error('Invalid chatId provided');
      }

      const chatIdValue = parseInt(chatId.chatId);
      if (isNaN(chatIdValue)) {
        throw new Error(`Could not parse chatId: ${chatId.chatId}`);
      }

      const result = await this
        .sql`select * from "user" where chat_id = ${chatIdValue}`;
      this.logger.log(`Retrieved user with chat_id: ${chatId.chatId}`);
      console.log('result', result);
      return result[0];
    } catch (error) {
      this.logger.error('Error retrieving user from Neon database', error);
      throw error;
    }
  }
  async findByPhoneNumber(phoneNumber: string): Promise<any> {
    console.log('phoneNumber', phoneNumber);
    try {
      const result = await this
        .sql`select * from whitelist where phone_number = ${phoneNumber}`;
      this.logger.log(
        `Retrieved whitelist record with phone number: ${phoneNumber}`,
      );
      console.log('result', result[0]);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      this.logger.error(
        'Error retrieving whitelist record from Neon database',
        error,
      );
      throw error;
    }
  }

  async createUser(user: any): Promise<any> {
    try {
      const result = await this
        .sql`insert into "user" (chat_id, phone_number) values (${user.chatId}, ${user.phoneNumber}) returning *`;
      this.logger.log(`User created successfully with chat_id: ${user.chatId}`);
      return result;
    } catch (error) {
      this.logger.error('Error creating user in Neon database', error);
      throw error;
    }
  }

  async getWhitelist(): Promise<any> {
    try {
      const result = await this.sql('SELECT * FROM whitelist');
      this.logger.log(`Retrieved ${result.length} whitelist records`);
      return result;
    } catch (error) {
      this.logger.error('Error retrieving whitelist from Neon database', error);
      throw error;
    }
  }

  async saveRecord(record: WhiteListRecord): Promise<void> {
    try {
      await this.sql(
        `
        INSERT INTO whitelist (phone_number, max_limit, industry) 
        VALUES ($1, $2, $3)
      `,
        [record.phone_number, record.max_limit, record.industry],
      );

      this.logger.log(`Record saved successfully: ${record.phone_number}`);
    } catch (error) {
      this.logger.error('Error saving record to Neon database', error);
      throw error;
    }
  }

  async saveRecords(records: WhiteListRecord[]): Promise<void> {
    for (const record of records) {
      const validationErrors = this.validateRecord(record);
      // Basic validation: Ensure required fields are present.
      if (validationErrors.length > 0) {
        this.logValidationErrors(record, validationErrors);
        continue;
      }

      await this.saveRecord(record);
    }
  }

  private validateRecord(record: WhiteListRecord): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!this.isValidPhoneNumber(record.phone_number)) {
      errors.push({
        field: 'phone_number',
        message: 'Phone number is missing or invalid',
      });
    }

    if (!this.isValidMaxLimit(record.max_limit)) {
      errors.push({
        field: 'max_limit',
        message: 'Max limit is not a valid number',
      });
    }

    if (!this.isValidIndustry(record.industry)) {
      errors.push({
        field: 'industry',
        message: 'Industry is missing or invalid',
      });
    }

    return errors;
  }

  private isValidPhoneNumber(phoneNumber: any): boolean {
    // Can be extended with phone number format validation
    return !!phoneNumber;
  }

  private isValidMaxLimit(maxLimit: any): boolean {
    return !isNaN(maxLimit) && maxLimit !== null && maxLimit !== undefined;
  }

  private isValidIndustry(industry: any): boolean {
    // Can be extended with allowed industry validation
    return !!industry;
  }

  private logValidationErrors(
    record: WhiteListRecord,
    errors: ValidationError[],
  ): void {
    const errorMessages = errors
      .map((err) => `${err.field}: ${err.message}`)
      .join(', ');
    this.logger.warn(
      `Skipping invalid record: ${JSON.stringify(record)}. Errors: ${errorMessages}`,
    );
  }
}
