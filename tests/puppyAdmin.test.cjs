const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { stripTypeScriptTypes } = require('node:module');

const source = stripTypeScriptTypes(readFileSync('lib/puppyAdmin.ts', 'utf8'))
  .replace(/import \{ supabase \} from "\.\/supabase";/, '')
  .replace(/import \{ decode \} from "base64-arraybuffer";/, '')
  .replace(/export /g, '');
function load(client) {
  return new Function('supabase', 'decode', source + '; return { validatePuppyDraft, isPuppyAdmin, addPuppy };')(client, require('base64-arraybuffer').decode);
}
const draft = { name: ' Dave ', breed: 'Cacapoo', age: '3', price: '30000.25', description: 'A reptilian dog', health: 'good' };

test('converts dollars to cents and preserves puppy details', () => {
  const value = load(null).validatePuppyDraft(draft);
  assert.equal(value.price_cents, 3000025);
  assert.equal(value.name, 'Dave');
  assert.equal(value.age_months, 3);
});

test('rejects incomplete fields and invalid ages, prices, and health before upload', () => {
  for (const change of [{ name: ' ' }, { age: '-1' }, { age: '3.5' }, { price: '1.001' }, { price: '21474836.48' }, { health: 'unknown' }]) {
    assert.throws(() => load(null).validatePuppyDraft({ ...draft, ...change }));
  }
});

test('demo users and signed-out users have no admin access', async () => {
  assert.equal(await load(null).isPuppyAdmin(), false);
  const client = { auth: { getSession: async () => ({ data: { session: null }, error: null }) } };
  assert.equal(await load(client).isPuppyAdmin(), false);
});

test('non-admin cannot upload or save a puppy', async () => {
  const client = {
    auth: { getSession: async () => ({ data: { session: { user: { id: 'user-1' } } }, error: null }) },
    from: (table) => {
      assert.equal(table, 'puppy_admins');
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) };
    },
  };
  await assert.rejects(load(client).addPuppy(draft, { uri: 'photo.jpg' }), /Only an admin/);
});

test('admin uploads bytes and saves the resulting photo URL with correct cents', async () => {
  let inserted;
  const client = {
    auth: { getSession: async () => ({ data: { session: { user: { id: 'admin-1' } } }, error: null }) },
    from: (table) => table === 'puppy_admins'
      ? { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { user_id: 'admin-1' }, error: null }) }) }) }
      : { insert: async (row) => { inserted = row; return { error: null }; } },
    storage: { from: (bucket) => {
      assert.equal(bucket, 'puppy-photos');
      return {
        upload: async (path, bytes, options) => {
          assert.match(path, /^admin-1\//);
          assert.deepEqual([...new Uint8Array(bytes)], [1, 2, 3]);
          assert.equal(options.contentType, 'image/jpeg');
          return { error: null };
        },
        getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/puppy.jpg' } }),
      };
    } },
  };
  await load(client).addPuppy(draft, { uri: 'photo.jpg', mimeType: 'image/jpeg', base64: 'AQID' });
  assert.equal(inserted.price_cents, 3000025);
  assert.equal(inserted.image_url, 'https://example.com/puppy.jpg');
});
