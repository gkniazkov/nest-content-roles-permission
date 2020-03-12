import { UserEntity } from '../entities/user.entity';

export const SanitizeUser = (userField?: string, strong = true) => {
  return (target, decoratedFnName: string, descriptor: PropertyDescriptor) => {
    const decoratedFn = descriptor.value;
    async function newFunction() {
      const data: any = await decoratedFn.apply(this, arguments);
      const user: UserEntity = userField ? data[userField] : data;
      if (user) {
        user.password = null;
        delete user.password;
        user.solt = null;
        delete user.solt;
        user.useSha1 = null;
        delete user.useSha1;
        if (strong) {
          user.authToken = null;
          delete user.authToken;
        }
      }
      return data;
    }

    return {
      value: newFunction,
    };
  };
}

export const SanitizeUsers = (userField?: string) => {
  return (target, decoratedFnName: string, descriptor: PropertyDescriptor) => {
    const decoratedFn = descriptor.value;
    async function newFunction() {
      const entities: any[] = await decoratedFn.apply(this, arguments);
      return entities.map(entity => {
        const user: UserEntity = userField ? entity[userField] : entity;
        if (user) {
          user.password = null;
          delete user.password;
          user.solt = null;
          delete user.solt;
          user.useSha1 = null;
          delete user.useSha1;
          user.authToken = null;
          delete user.authToken;
          user.authToken = null;
          delete user.authToken;
        }
        return entity;
      });
    }

    return {
      value: newFunction,
    };
  };
}
