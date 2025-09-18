// Utility functions to handle exactOptionalPropertyTypes with Prisma

/**
 * Converts undefined values to null for Prisma compatibility with exactOptionalPropertyTypes
 * @param data Object with potentially undefined values
 * @returns Object with undefined values converted to null
 */
export function convertUndefinedToNull<T extends Record<string, any>>(data: T): any {
  const result: any = {};
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value === undefined) {
      result[key] = null;
    } else {
      result[key] = value;
    }
  });
  
  return result;
}

/**
 * Processes update data by filtering out undefined values and converting others appropriately
 * @param data Update data object
 * @returns Processed data safe for Prisma update operations
 */
export function processUpdateData<T extends Record<string, any>>(data: T): any {
  const result: any = {};
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value !== undefined) {
      result[key] = value === null ? null : value;
    }
  });
  
  return result;
}

/**
 * Validates that a parameter exists and is not undefined
 * @param param Parameter to validate
 * @param paramName Name of parameter for error message
 * @returns The parameter if valid
 * @throws Error if parameter is undefined or null
 */
export function validateRequiredParam(param: string | undefined, paramName: string): string {
  if (!param) {
    throw new Error(`${paramName} is required`);
  }
  return param;
}

/**
 * Handles JSON stringification for Prisma fields that need to be stored as strings
 * @param value Value to stringify
 * @returns JSON string or empty string for null/undefined
 */
export function stringifyJsonField(value: any): string {
  if (value === null || value === undefined) {
    return '{}';
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
}