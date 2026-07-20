import * as acorn from 'acorn';

function isFunctionLike(node) {
  return (
    node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression' ||
    node.type === 'ArrowFunctionExpression' ||
    node.type === 'MethodDefinition'
  );
}

class Scope {
  constructor(parent = null) {
    this.parent = parent;
    this.vars = new Set();
  }
  add(name) {
    this.vars.add(name);
  }
  getNames() {
    const list = new Set();
    let current = this;
    while (current) {
      for (const v of current.vars) {
        list.add(v);
      }
      current = current.parent;
    }
    return Array.from(list);
  }
}

function extractNamesFromPattern(pattern, scope) {
  if (!pattern) return;
  if (pattern.type === 'Identifier') {
    scope.add(pattern.name);
  } else if (pattern.type === 'AssignmentPattern') {
    extractNamesFromPattern(pattern.left, scope);
  } else if (pattern.type === 'ObjectPattern') {
    for (const prop of pattern.properties) {
      if (prop.type === 'Property') {
        extractNamesFromPattern(prop.value, scope);
      } else if (prop.type === 'RestElement') {
        extractNamesFromPattern(prop.argument, scope);
      }
    }
  } else if (pattern.type === 'ArrayPattern') {
    for (const el of pattern.elements) {
      extractNamesFromPattern(el, scope);
    }
  } else if (pattern.type === 'RestElement') {
    extractNamesFromPattern(pattern.argument, scope);
  }
}

function collectDeclarations(node, blockScope, functionScope) {
  if (!node || typeof node !== 'object') return;

  if (node.type === 'VariableDeclaration') {
    const isVar = node.kind === 'var';
    const targetScope = isVar ? functionScope : blockScope;
    for (const decl of node.declarations) {
      extractNamesFromPattern(decl.id, targetScope);
    }
  } else if (node.type === 'FunctionDeclaration') {
    if (node.id && node.id.name) {
      functionScope.add(node.id.name);
    }
    return; // Don't recurse into function body
  } else if (node.type === 'ClassDeclaration') {
    if (node.id && node.id.name) {
      blockScope.add(node.id.name);
    }
    return; // Don't recurse into class
  } else if (isFunctionLike(node)) {
    return; // Don't recurse into nested function scope
  }

  for (const key of Object.keys(node)) {
    if (key === 'start' || key === 'end' || key === 'loc') continue;
    const val = node[key];
    if (Array.isArray(val)) {
      for (const el of val) {
        collectDeclarations(el, blockScope, functionScope);
      }
    } else if (val && typeof val === 'object') {
      collectDeclarations(val, blockScope, functionScope);
    }
  }
}

function getFunctionName(node, parent) {
  if (node.id && node.id.name) return node.id.name;
  if (parent) {
    if (parent.type === 'VariableDeclarator' && parent.id.type === 'Identifier') {
      return parent.id.name;
    }
    if (parent.type === 'AssignmentExpression' && parent.left.type === 'Identifier') {
      return parent.left.name;
    }
    if (parent.type === 'Property' && parent.key.type === 'Identifier') {
      return parent.key.name;
    }
    if (parent.type === 'MethodDefinition' && parent.key.type === 'Identifier') {
      return parent.key.name;
    }
  }
  return '(anonymous)';
}

export function instrumentJS(sourceCode) {
  let ast;
  try {
    ast = acorn.parse(sourceCode, {
      ecmaVersion: 2022,
      sourceType: 'script',
      locations: true,
    });
  } catch (err) {
    return {
      instrumented: sourceCode,
      variableNames: [],
      error: 'Failed to parse JavaScript code: ' + err.message,
    };
  }

  const actions = [];
  const allUniqueVarNames = new Set();

  const statementTypesToSnap = new Set([
    'ExpressionStatement',
    'VariableDeclaration',
    'ReturnStatement',
    'BreakStatement',
    'ContinueStatement',
    'ThrowStatement',
    'DebuggerStatement',
    'IfStatement',
    'WhileStatement',
    'DoWhileStatement',
    'ForStatement',
    'ForInStatement',
    'ForOfStatement',
    'SwitchStatement',
    'TryStatement',
    'ClassDeclaration',
  ]);

  function walk(node, parent, scope, functionScope) {
    if (!node || typeof node !== 'object') return;

    let currentScope = scope;
    let currentFunctionScope = functionScope;

    if (node.type === 'Program') {
      currentScope = new Scope(null);
      currentFunctionScope = currentScope;
      collectDeclarations(node, currentScope, currentScope);
    } else if (isFunctionLike(node)) {
      currentScope = new Scope(scope);
      currentFunctionScope = currentScope;
      for (const param of node.params) {
        extractNamesFromPattern(param, currentScope);
      }
      if (node.body.type === 'BlockStatement') {
        collectDeclarations(node.body, currentScope, currentScope);
      }
    } else if (node.type === 'BlockStatement') {
      currentScope = new Scope(scope);
      collectDeclarations(node, currentScope, currentFunctionScope);
    }

    // Add current scope bindings to allUniqueVarNames
    for (const name of currentScope.getNames()) {
      if (!name.startsWith('__')) {
        allUniqueVarNames.add(name);
      }
    }

    // Instrument Function Entry/Exit
    if (isFunctionLike(node)) {
      const funcName = getFunctionName(node, parent);
      const funcLine = node.loc.start.line;
      if (node.body.type === 'BlockStatement') {
        actions.push({
          type: 'insert',
          offset: node.body.start + 1,
          text: `\n__enter(${JSON.stringify(funcName)}, ${funcLine}); try {\n`,
        });
        actions.push({
          type: 'insert',
          offset: node.body.end - 1,
          text: `\n} finally { __exit(); }\n`,
        });
      } else {
        // Expression body arrow function: convert to block
        actions.push({
          type: 'replace',
          start: node.body.start,
          end: node.body.end,
          text: `{ __enter(${JSON.stringify(funcName)}, ${funcLine}); try { return ${sourceCode.slice(node.body.start, node.body.end)}; } finally { __exit(); } }`,
        });
        return; // Skip walking children of replaced arrow body expression
      }
    }

    // Instrument Loop Conditions (while, do-while, for)
    if (
      node.type === 'WhileStatement' ||
      node.type === 'DoWhileStatement' ||
      node.type === 'ForStatement'
    ) {
      if (node.test) {
        const vars = currentScope.getNames().filter((v) => !v.startsWith('__'));
        const snapExpr = `(() => { const _v = {}; ${vars.map((v) => `try{_v.${v}=${v}}catch(e){}`).join('')}; return _v; })()`;
        actions.push({
          type: 'replace',
          start: node.test.start,
          end: node.test.end,
          text: `(__snap(${node.loc.start.line}, ${snapExpr}), ${sourceCode.slice(node.test.start, node.test.end)})`,
        });
      }
    }

    // Wrap Non-block Bodies
    if (node.type === 'IfStatement') {
      if (node.consequent && node.consequent.type !== 'BlockStatement') {
        const lineNum = node.consequent.loc.start.line;
        const vars = currentScope.getNames().filter((v) => !v.startsWith('__'));
        const snapExpr = `(() => { const _v = {}; ${vars.map((v) => `try{_v.${v}=${v}}catch(e){}`).join('')}; return _v; })()`;
        actions.push({
          type: 'replace',
          start: node.consequent.start,
          end: node.consequent.end,
          text: `{ __snap(${lineNum}, ${snapExpr}); ${sourceCode.slice(node.consequent.start, node.consequent.end)} }`,
        });
      }
      if (
        node.alternate &&
        node.alternate.type !== 'BlockStatement' &&
        node.alternate.type !== 'IfStatement'
      ) {
        const lineNum = node.alternate.loc.start.line;
        const vars = currentScope.getNames().filter((v) => !v.startsWith('__'));
        const snapExpr = `(() => { const _v = {}; ${vars.map((v) => `try{_v.${v}=${v}}catch(e){}`).join('')}; return _v; })()`;
        actions.push({
          type: 'replace',
          start: node.alternate.start,
          end: node.alternate.end,
          text: `{ __snap(${lineNum}, ${snapExpr}); ${sourceCode.slice(node.alternate.start, node.alternate.end)} }`,
        });
      }
    } else if (
      node.type === 'WhileStatement' ||
      node.type === 'DoWhileStatement' ||
      node.type === 'ForStatement' ||
      node.type === 'ForInStatement' ||
      node.type === 'ForOfStatement'
    ) {
      if (node.body && node.body.type !== 'BlockStatement') {
        const lineNum = node.body.loc.start.line;
        const vars = currentScope.getNames().filter((v) => !v.startsWith('__'));
        const snapExpr = `(() => { const _v = {}; ${vars.map((v) => `try{_v.${v}=${v}}catch(e){}`).join('')}; return _v; })()`;
        actions.push({
          type: 'replace',
          start: node.body.start,
          end: node.body.end,
          text: `{ __snap(${lineNum}, ${snapExpr}); ${sourceCode.slice(node.body.start, node.body.end)} }`,
        });
      }
    }

    // Instrument Statements inside Block/Program
    if (node.type === 'BlockStatement' || node.type === 'Program') {
      const list = node.body || [];
      for (const stmt of list) {
        if (statementTypesToSnap.has(stmt.type)) {
          if (stmt.type === 'FunctionDeclaration') continue;

          const lineNum = stmt.loc.start.line;
          const vars = currentScope.getNames().filter((v) => !v.startsWith('__'));
          const snapExpr = `(() => { const _v = {}; ${vars.map((v) => `try{_v.${v}=${v}}catch(e){}`).join('')}; return _v; })()`;

          actions.push({
            type: 'insert',
            offset: stmt.start,
            text: `__snap(${lineNum}, ${snapExpr});\n`,
          });
        }
      }
    }

    // Recurse Children (skip if we wrapped non-block loop/if bodies or arrow bodies)
    for (const key of Object.keys(node)) {
      if (key === 'start' || key === 'end' || key === 'loc') continue;
      const val = node[key];
      if (Array.isArray(val)) {
        for (const el of val) {
          if (
            node.type === 'IfStatement' &&
            (el === node.consequent || el === node.alternate) &&
            el.type !== 'BlockStatement'
          ) {
            continue;
          }
          if (
            (node.type === 'WhileStatement' ||
              node.type === 'DoWhileStatement' ||
              node.type === 'ForStatement' ||
              node.type === 'ForInStatement' ||
              node.type === 'ForOfStatement') &&
            el === node.body &&
            el.type !== 'BlockStatement'
          ) {
            continue;
          }
          walk(el, node, currentScope, currentFunctionScope);
        }
      } else if (val && typeof val === 'object') {
        if (
          node.type === 'IfStatement' &&
          (val === node.consequent || val === node.alternate) &&
          val.type !== 'BlockStatement'
        ) {
          continue;
        }
        if (
          (node.type === 'WhileStatement' ||
            node.type === 'DoWhileStatement' ||
            node.type === 'ForStatement' ||
            node.type === 'ForInStatement' ||
            node.type === 'ForOfStatement') &&
          val === node.body &&
          val.type !== 'BlockStatement'
        ) {
          continue;
        }
        walk(val, node, currentScope, currentFunctionScope);
      }
    }
  }

  walk(ast, null, null, null);

  // Sort actions descending: start descending, if start is equal, end descending
  actions.sort((a, b) => {
    const aStart = a.type === 'replace' ? a.start : a.offset;
    const bStart = b.type === 'replace' ? b.start : b.offset;
    if (aStart !== bStart) {
      return bStart - aStart;
    }
    const aEnd = a.type === 'replace' ? a.end : a.offset;
    const bEnd = b.type === 'replace' ? b.end : b.offset;
    return bEnd - aEnd;
  });

  let instrumentedCode = sourceCode;
  for (const action of actions) {
    if (action.type === 'insert') {
      instrumentedCode =
        instrumentedCode.slice(0, action.offset) +
        action.text +
        instrumentedCode.slice(action.offset);
    } else if (action.type === 'replace') {
      instrumentedCode =
        instrumentedCode.slice(0, action.start) + action.text + instrumentedCode.slice(action.end);
    }
  }

  const wrapped = [
    `(async function() {`,
    `  let __snapshots = [];`,
    `  let __origLog = console.log;`,
    `  let __userOutput = [];`,
    `  let __stack = [];`,
    `  console.log = function() {`,
    `    let msg = Array.prototype.map.call(arguments, function(a) {`,
    `      return typeof a === 'object' ? JSON.stringify(a) : String(a);`,
    `    }).join(' ');`,
    `    __userOutput.push(msg);`,
    `  };`,
    `  function __enter(name, line) {`,
    `    __stack.push({ name: name, line: line });`,
    `  }`,
    `  function __exit() {`,
    `    __stack.pop();`,
    `  }`,
    `  function __snap($$line, $$vars) {`,
    `    if (__snapshots.length >= 1000) {`,
    `      throw new Error("Execution aborted: exceeded maximum step limit of 1000 steps.");`,
    `    }`,
    `    __snapshots.push({`,
    `      line: $$line,`,
    `      vars: $$vars,`,
    `      stack: __stack.map(f => ({ name: f.name, line: f.line })),`,
    `      output: __userOutput.slice()`,
    `    });`,
    `  }`,
    `  try {`,
    instrumentedCode,
    `  } catch (err) {`,
    `    __userOutput.push("Runtime Error: " + err.message);`,
    `  } finally {`,
    `    console.log = __origLog;`,
    `    let __result = JSON.stringify({ snapshots: __snapshots, output: __userOutput });`,
    `    if (typeof process !== 'undefined' && process.stdout && typeof process.stdout.write === 'function') {`,
    `      process.stdout.write(__result);`,
    `    } else {`,
    `      globalThis.__traceResult = __result;`,
    `    }`,
    `  }`,
    `})()`,
  ].join('\n');

  return {
    instrumented: wrapped,
    variableNames: Array.from(allUniqueVarNames),
  };
}

export function extractSnapshotsFromOutput(stdout) {
  try {
    const parsed = JSON.parse(stdout);
    if (parsed && Array.isArray(parsed.snapshots)) {
      return parsed.snapshots;
    }
  } catch (err) {
    // ignore
  }
  return null;
}

if (typeof window !== 'undefined') {
  window.instrumentJS = instrumentJS;
  window.extractSnapshotsFromOutput = extractSnapshotsFromOutput;
}
