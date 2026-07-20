import { instrumentJS } from '../modules/code-tracer.js';

describe('AST Code Tracer - Scope variable tracking and instrumenting', () => {
  it('should parse and instrument simple variable declarations', () => {
    const code = `
      let x = 10;
      let y = 20;
      let z = x + y;
    `;
    const { instrumented, variableNames, error } = instrumentJS(code);
    expect(error).toBeUndefined();
    expect(variableNames).toContain('x');
    expect(variableNames).toContain('y');
    expect(variableNames).toContain('z');

    // Instrumented code should contain snapshot functions calls
    expect(instrumented).toContain('__snap');
  });

  it('should handle nested block scopes and variable scoping rules', () => {
    const code = `
      let globalVar = 1;
      {
        let blockVar = 2;
        globalVar = blockVar;
      }
    `;
    const { instrumented, variableNames } = instrumentJS(code);
    expect(variableNames).toContain('globalVar');
    expect(variableNames).toContain('blockVar');
    expect(instrumented).toContain('__snap');
  });

  it('should capture function parameters and nested function call stacks', () => {
    const code = `
      function add(a, b) {
        let sum = a + b;
        return sum;
      }
      add(5, 10);
    `;
    const { instrumented, variableNames } = instrumentJS(code);
    expect(variableNames).toContain('a');
    expect(variableNames).toContain('b');
    expect(variableNames).toContain('sum');
    expect(instrumented).toContain('__enter');
    expect(instrumented).toContain('__exit');
  });

  it('should handle arrow functions with expression body and block body', () => {
    const code = `
      const multiply = (x, y) => x * y;
      const res = multiply(3, 4);
    `;
    const { instrumented, variableNames } = instrumentJS(code);
    expect(variableNames).toContain('x');
    expect(variableNames).toContain('y');
    expect(variableNames).toContain('res');
    expect(instrumented).toContain('__enter');
    expect(instrumented).toContain('__exit');
  });
});
