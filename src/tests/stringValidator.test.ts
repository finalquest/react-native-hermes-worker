import validateStringParam from '../stringValidator';

describe('validateStringParam', () => {
  test('should handle null and undefined', () => {
    expect(validateStringParam(null)).toBeNull();
    expect(validateStringParam(undefined)).toBeUndefined();
  });

  test('should convert strings to template literals', () => {
    expect(validateStringParam('hello')).toBe('`hello`');
    expect(validateStringParam('')).toBe('``');
  });

  test('should handle nested strings in arrays', () => {
    const input = ['a', 123, 'b'];
    const expected = ['`a`', 123, '`b`'];
    expect(validateStringParam(input)).toEqual(expected);
  });

  test('should handle multi-dimensional arrays', () => {
    const input = [
      ['a', 'b'],
      ['c', 'd'],
    ];
    const expected = [
      ['`a`', '`b`'],
      ['`c`', '`d`'],
    ];
    expect(validateStringParam(input)).toEqual(expected);
  });

  test('should handle objects with string values', () => {
    const input = { name: 'John', age: 30 };
    const expected = { name: '`John`', age: 30 };
    expect(validateStringParam(input)).toEqual(expected);
  });

  test('should handle nested objects', () => {
    const input = {
      user: {
        name: 'John',
        contact: {
          email: 'john@example.com',
          phone: 123456,
        },
      },
      active: true,
    };

    const expected = {
      user: {
        name: '`John`',
        contact: {
          email: '`john@example.com`',
          phone: 123456,
        },
      },
      active: true,
    };

    expect(validateStringParam(input)).toEqual(expected);
  });

  test('should handle arrays inside objects', () => {
    const input = {
      names: ['John', 'Jane'],
      ages: [30, 25],
    };

    const expected = {
      names: ['`John`', '`Jane`'],
      ages: [30, 25],
    };

    expect(validateStringParam(input)).toEqual(expected);
  });

  test('should handle objects inside arrays', () => {
    const input = [
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 },
    ];

    const expected = [
      { name: '`John`', age: 30 },
      { name: '`Jane`', age: 25 },
    ];

    expect(validateStringParam(input)).toEqual(expected);
  });

  test('should handle Map objects', () => {
    const input = new Map();
    input.set('name', 'John');
    input.set('age', 30);
    input.set(123, 'value');

    const expected = new Map();
    expected.set('`name`', '`John`');
    expected.set('`age`', 30);
    expected.set(123, '`value`');

    expect(validateStringParam(input)).toEqual(expected);
  });

  test('should not modify non-string primitives', () => {
    expect(validateStringParam(123)).toBe(123);
    expect(validateStringParam(true)).toBe(true);
    expect(validateStringParam(false)).toBe(false);
    expect(validateStringParam(0)).toBe(0);
  });

  test('should handle functions without modification', () => {
    const fn = () => 'Hello';
    expect(validateStringParam(fn)).toBe(fn);
  });

  test('should handle strings with quotes', () => {
    expect(validateStringParam('hello "world"')).toBe('`hello "world"`');
    expect(validateStringParam("don't do that")).toBe("`don't do that`");
    expect(validateStringParam('mix of "double" and \'single\' quotes')).toBe(
      '`mix of "double" and \'single\' quotes`'
    );
  });

  test('should handle strings with backticks', () => {
    // Since we're using backticks as delimiters, any backticks within the string would need special handling
    // In this case, we're assuming the function doesn't do any escaping
    expect(validateStringParam('code: `const x = 1;`')).toBe(
      '`code: `const x = 1;``'
    );
    // In a real implementation, you might want to escape backticks in the input string
  });

  test('should handle strings with special characters', () => {
    expect(validateStringParam('line1\nline2')).toBe('`line1\nline2`');
    expect(validateStringParam('tab\tcharacter')).toBe('`tab\tcharacter`');
    expect(validateStringParam('\u2022 bullet point')).toBe(
      '`\u2022 bullet point`'
    );
  });

  test('should handle complex nested structures', () => {
    const input = {
      users: [
        {
          name: 'John',
          contact: {
            email: 'john@example.com',
            addresses: [
              { street: 'Main St', number: 123 },
              { street: 'Second Ave', number: 456 },
            ],
          },
        },
        {
          name: 'Jane',
          contact: {
            email: 'jane@example.com',
            addresses: [{ street: 'Park Rd', number: 789 }],
          },
        },
      ],
      company: 'Acme Inc',
      active: true,
      stats: {
        employees: 50,
        founded: '2010',
      },
    };

    const expected = {
      users: [
        {
          name: '`John`',
          contact: {
            email: '`john@example.com`',
            addresses: [
              { street: '`Main St`', number: 123 },
              { street: '`Second Ave`', number: 456 },
            ],
          },
        },
        {
          name: '`Jane`',
          contact: {
            email: '`jane@example.com`',
            addresses: [{ street: '`Park Rd`', number: 789 }],
          },
        },
      ],
      company: '`Acme Inc`',
      active: true,
      stats: {
        employees: 50,
        founded: '`2010`',
      },
    };

    expect(validateStringParam(input)).toEqual(expected);
  });
});
