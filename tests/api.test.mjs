import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import { createApi } from '../server/api.mjs';

test('activities, authentication, authorization, validation and retry-safe registrations', async () => {
  const server = createApi(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}`;
  const call = async (path, method = 'GET', body, token) => {
    const response = await fetch(url + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, data: await response.json() };
  };
  try {
    const list = await call('/events'); assert.equal(list.status, 200); assert.equal(list.data.length, 10);
    const event = list.data[0]; assert.equal((await call(`/events/${event.id}`)).data.id, event.id);
    assert.equal((await call('/events/missing')).status, 404);
    assert.equal((await call('/registrations')).status, 401);
    assert.equal((await call('/auth/register', 'POST', { email: 'bad', password: 'short' })).status, 400);
    const password = randomBytes(16).toString('hex');
    const account = { email: 'student@example.test', password };
    const session = await call('/auth/register', 'POST', account); assert.equal(session.status, 200);
    const token = session.data.token;
    assert.equal((await call('/auth/login', 'POST', { ...account, password: 'incorrect-value' })).status, 401);
    assert.equal((await call('/auth/login', 'POST', account)).status, 200);
    const draft = { eventId: event.id, name: 'Test Student', email: account.email, note: 'Ready', team: ['pikachu'], meetingPoint: event.location, photo: null };
    assert.equal((await call('/registrations', 'POST', { ...draft, meetingPoint: { ...event.location, latitude: 999 } }, token)).status, 400);
    assert.equal((await call('/registrations', 'POST', { ...draft, photo: 'data:image/jpeg;base64,YWJj' }, token)).status, 400);
    assert.equal((await call('/registrations', 'POST', { ...draft, eventId: 'missing' }, token)).status, 404);
    const registered = await call('/registrations', 'POST', draft, token); assert.equal(registered.status, 201);
    const retry = await call('/registrations', 'POST', draft, token); assert.equal(retry.status, 200); assert.equal(retry.data.id, registered.data.id);
    assert.equal((await call('/registrations', 'GET', undefined, token)).data.length, 1);
    const second = await call('/auth/register', 'POST', { email: 'other@example.test', password: randomBytes(16).toString('hex') });
    assert.equal((await call('/registrations', 'GET', undefined, second.data.token)).data.length, 0);
    assert.equal((await call('/auth/logout', 'POST', {}, token)).status, 200);
    assert.equal((await call('/registrations', 'GET', undefined, token)).status, 401);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
test('expired tokens are rejected by the server', async () => {
  const server = createApi({ sessionMs: -1 }); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    const response = await fetch(url + '/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'expired@example.test', password: randomBytes(16).toString('hex') }) });
    const session = await response.json();
    const result = await fetch(url + '/auth/me', { headers: { Authorization: `Bearer ${session.token}` } }); assert.equal(result.status, 401);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
