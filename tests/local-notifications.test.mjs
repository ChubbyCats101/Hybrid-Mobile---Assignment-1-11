import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import ts from 'typescript';

test('local notification imports do not initialize remote push in Android Expo Go', () => {
  const root = resolve('node_modules/expo-notifications/build');
  const visited = new Set();
  function visit(file) {
    if (visited.has(file)) return;
    visited.add(file);
    assert.doesNotMatch(file, /(?:DevicePushTokenAutoRegistration|TokenEmitter|warnOfExpoGoPushUsage|[\\/]index\.js$)/);
    const source = ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext },
      fileName: file,
    }).outputText;
    for (const { fileName: specifier } of ts.preProcessFile(source).importedFiles) {
      assert.notEqual(specifier, 'expo-notifications');
      const base = specifier.startsWith('expo-notifications/build/')
        ? resolve(root, specifier.slice('expo-notifications/build/'.length))
        : specifier.startsWith('.') ? resolve(dirname(file), specifier) : null;
      if (!base) continue;
      const next = ['.android.js', '.native.js', '.js'].map(ext => base + ext).find(existsSync);
      assert.ok(next, `Missing notification module: ${specifier}`);
      visit(next);
    }
  }
  visit(resolve('services/local-notifications.ts'));
  assert.ok([...visited].some(file => file.endsWith('scheduleNotificationAsync.js')));
  assert.ok([...visited].some(file => file.endsWith('NotificationsEmitter.js')));
});
