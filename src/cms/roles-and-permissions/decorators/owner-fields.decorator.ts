// import { ReflectMetadata } from '@nestjs/common';
//
// export const OwnerFields = (...args: string[]) => ReflectMetadata('owner-fields', args);
//

export const OwnerFields = (ownerFields: string | string[]) => (target) => {
  if (typeof ownerFields === 'string') {
    target.ownerFields = [ownerFields];
  } else {
    target.ownerFields = ownerFields;
  }
  return target;
};
