export const ApiTags = () => (target: object) => target;
export const ApiOperation =
  () =>
  (_target: object, _propertyKey: string, descriptor: PropertyDescriptor) =>
    descriptor;
export const ApiResponse =
  () =>
  (_target: object, _propertyKey: string, descriptor: PropertyDescriptor) =>
    descriptor;
export const ApiBody =
  () =>
  (_target: object, _propertyKey: string, descriptor: PropertyDescriptor) =>
    descriptor;
export const ApiParam =
  () =>
  (_target: object, _propertyKey: string, descriptor: PropertyDescriptor) =>
    descriptor;
export const ApiQuery =
  () =>
  (_target: object, _propertyKey: string, descriptor: PropertyDescriptor) =>
    descriptor;
export const ApiProperty = () => () => {};
export const SwaggerModule = {
  createDocument: () => ({}),
  setup: () => {},
};
export const DocumentBuilder = class {
  setTitle() {
    return this;
  }
  setDescription() {
    return this;
  }
  setVersion() {
    return this;
  }
  addBearerAuth() {
    return this;
  }
  build() {
    return {};
  }
};
