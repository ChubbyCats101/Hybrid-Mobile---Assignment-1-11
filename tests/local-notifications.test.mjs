import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import ts from 'typescript';
import vm from 'node:vm';

test('Android Expo Go schedules locally; standalone builds create a channel; denial stops scheduling', async () => {
  const source = ts.transpileModule(readFileSync('services/reminders.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const constants = { appOwnership: 'expo' };
  const calls = [];
  let granted = true, scheduled;
  const exports = {};
  const modules = {
    'expo-constants': { __esModule: true, default: constants },
    'react-native': { Platform: { OS: 'android' } },
    '../types/event': { validId: () => true },
    '@react-native-async-storage/async-storage': { __esModule: true, default: {
      getItem: async () => null, removeItem: async () => {}, setItem: async () => {},
    } },
    './local-notifications': {
      setNotificationHandler: () => {}, AndroidImportance: { HIGH: 4 },
      SchedulableTriggerInputTypes: { DATE: 'date' },
      setNotificationChannelAsync: async () => { calls.push('channel'); },
      requestPermissionsAsync: async () => { calls.push('permission'); return { granted }; },
      scheduleNotificationAsync: async request => { calls.push('schedule'); scheduled = request; return 'test-id'; },
    },
  };
  vm.runInNewContext(source, { exports, require: name => {
    assert.ok(name in modules, `Unexpected import: ${name}`); return modules[name];
  } });
  const event = { id: 'event-1', title: 'Test', startsAt: new Date(Date.now() + 3600000).toISOString() };
  const before = Date.now();
  assert.equal(await exports.scheduleReminder(event, true), 'test-id');
  assert.deepEqual(calls, ['permission', 'schedule']);
  assert.equal(scheduled.trigger.channelId, undefined);
  assert.ok(scheduled.trigger.date.getTime() >= before + 15000);
  assert.ok(scheduled.trigger.date.getTime() <= Date.now() + 15000);
  assert.equal(scheduled.content.data.eventId, event.id);
  calls.length = 0; constants.appOwnership = null;
  await exports.scheduleReminder(event);
  assert.deepEqual(calls, ['channel', 'permission', 'schedule']);
  assert.equal(scheduled.trigger.channelId, 'journey-reminders');
  assert.equal(scheduled.trigger.date.getTime(), Date.parse(event.startsAt) - 1800000);
  calls.length = 0; constants.appOwnership = 'expo'; granted = false;
  await assert.rejects(exports.scheduleReminder(event, true), /สิทธิ์/);
  assert.deepEqual(calls, ['permission']);
});

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
