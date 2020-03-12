import { createParamDecorator } from '@nestjs/common';
import { ContentEntity } from '../entities/content.entity';

export const ContentEntityParam = createParamDecorator((data, req): ContentEntity => {
  return req.contentEntity;
});
