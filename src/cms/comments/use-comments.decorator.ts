import { ReflectMetadata, SetMetadata } from '@nestjs/common';
//
// export const UseComments = (...args: string[]) => ReflectMetadata('use-comments', args);
//

// TODO user SetMetadata instead of target.useComment. Metadata can be reflected
export const UseComments = (target) => {
  SetMetadata('use-comments', true);
  // ReflectMetadata(target, 'use-comments');
  // ReflectMetadata(target, 'test');
  target.useComment = true;
  return target;
}
