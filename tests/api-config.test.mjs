import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../services/api-config.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { resolveApiUrl } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
test('Expo Go uses the development computer instead of phone localhost', () => {
  assert.equal(resolveApiUrl(undefined, '192.168.1.10:8081', 'android'), 'http://192.168.1.10:3001');
  assert.equal(resolveApiUrl('', '192.168.1.10:8081', 'ios'), 'http://192.168.1.10:3001');
  assert.equal(resolveApiUrl(undefined, '192.168.1.10:8081', 'web'), 'http://localhost:3001');
  assert.equal(resolveApiUrl(' https://api.example.test/ ', '192.168.1.10:8081', 'android'), 'https://api.example.test');
  assert.equal(resolveApiUrl(undefined, undefined, 'android'), '');
});
