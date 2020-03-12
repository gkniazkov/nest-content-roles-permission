import { Inject } from '@nestjs/common';

export const CrudEntity = (fn: Function) => (target) => {
  target.entityFn = fn;
  target.entityName = fn.name;
  return target;
};
