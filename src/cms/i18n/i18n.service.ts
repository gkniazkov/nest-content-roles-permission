import { Injectable } from '@nestjs/common';

@Injectable()
export class I18nService {

  t(str: string) {
    return str;
  }
}
