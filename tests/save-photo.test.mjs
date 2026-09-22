import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = ts.transpileModule(readFileSync('services/save-photo.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

test('saving preserves filtered bytes, handles denial, and cleans up after failure', async () => {
  let permission = { granted: true, canAskAgain: true };
  let written, created = 0, deleted = 0, fail = false;
  const platform = { OS: 'ios', Version: '18' };
  const exports = {};
  vm.runInNewContext(source, { exports, require: name => name === 'expo-file-system' ? {
    Paths: { cache: 'cache' },
    File: class {
      uri = 'file:///cache/photo.jpg'; exists = true;
      write(bytes, options) { written = [bytes, options.encoding]; }
      delete() { deleted++; }
    },
  } : name === 'react-native' ? { Platform: platform } : {
    requestPermissionsAsync: async (writeOnly, types) => {
      assert.equal(writeOnly, true); assert.equal(types.join(), 'photo'); return permission;
    },
    saveToLibraryAsync: async uri => { assert.equal(uri, 'file:///cache/photo.jpg'); created++; if (fail) throw new Error('disk full'); },
  } });
  assert.equal(await exports.savePhoto('data:image/jpeg;base64,FILTERED'), true);
  assert.deepEqual(written, ['FILTERED', 'base64']);
  assert.equal(deleted, 1);
  permission = { granted: false, canAskAgain: false };
  assert.equal(await exports.savePhoto('data:image/jpeg;base64,FILTERED'), false);
  assert.equal(created, 1);
  permission.canAskAgain = true;
  await assert.rejects(exports.savePhoto('data:image/jpeg;base64,FILTERED'), /สิทธิ์/);
  permission.granted = true; fail = true;
  await assert.rejects(exports.savePhoto('data:image/jpeg;base64,FILTERED'), /disk full/);
  assert.equal(deleted, 2);
  // On Android 13+, even denied library permission must not prevent adding a photo.
  platform.OS = 'android'; platform.Version = 33;
  permission = { granted: false, canAskAgain: false }; fail = false;
  assert.equal(await exports.savePhoto('data:image/jpeg;base64,FILTERED'), true);
  assert.equal(created, 3);
  platform.Version = 32;
  assert.equal(await exports.savePhoto('data:image/jpeg;base64,FILTERED'), false);
  assert.equal(created, 3);
});

test('photo saving imports the legacy API without loading ExpoMediaLibraryNext', () => {
  const imports = ts.preProcessFile(readFileSync('services/save-photo.ts', 'utf8')).importedFiles.map(item => item.fileName);
  assert.ok(imports.includes('expo-media-library/legacy'));
  assert.ok(!imports.includes('expo-media-library'));
  for (const file of ['legacy.ts', 'src/legacy/index.ts', 'src/legacy/MediaLibrary.ts', 'src/ExpoMediaLibrary.ts']) {
    assert.doesNotMatch(readFileSync(`node_modules/expo-media-library/${file}`, 'utf8'), /ExpoMediaLibraryNext/);
  }
});
