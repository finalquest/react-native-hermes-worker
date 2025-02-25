/**
 * Recursively ensures all string values in the parameter are properly escaped
 * by converting them to template literals
 * @param param - The parameter to process
 * @returns The processed parameter with properly escaped strings
 */
const stringValidator = (param: any): any => {
  // Handle null and undefined
  if (param === null || param === undefined) {
    return param;
  }

  // Handle strings - convert to template literals
  if (typeof param === 'string') {
    return `\`${param}\``;
  }

  // Handle arrays - process each element
  if (Array.isArray(param)) {
    return param.map((item) => stringValidator(item));
  }

  // Handle Maps
  if (param instanceof Map) {
    const newMap = new Map();
    for (const [key, value] of param.entries()) {
      newMap.set(
        typeof key === 'string' ? `\`${key}\`` : key,
        stringValidator(value)
      );
    }
    return newMap;
  }

  // Handle plain objects (not null, functions, or other non-objects)
  if (typeof param === 'object' && param.constructor === Object) {
    const result: Record<string, any> = {};
    for (const key in param) {
      if (Object.prototype.hasOwnProperty.call(param, key)) {
        result[key] = stringValidator(param[key]);
      }
    }
    return result;
  }

  // Return other types unchanged (numbers, booleans, functions, etc.)
  return param;
};

export default stringValidator;
