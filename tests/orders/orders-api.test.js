import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { customerOrderQuery } from '../../app/lib/delivery.js';

// Run the real route with deterministic database/auth dependencies.
const source = readFileSync(new URL('../../app/api/orders/route.js', import.meta.url), 'utf8');
function route({ authorized = true, rows = [] } = {}) {
  const calls = {};
  const query = (value) => ({ select(fields) { calls.fields ??= []; calls.fields.push(fields); return this; }, sort() { return this; }, skip(value) { calls.skip = value; return this; }, limit(value) { calls.limit = value; return this; }, async lean() { return value; } });
  const modules = {
    next: null,
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
    '../../lib/mongodb': { default: async () => { calls.connected = true; } },
    '../../lib/routeAuth': { requireAuth: (_req, roles) => { calls.roles = roles; return authorized ? { ok: true, user: { userId: 'customer-a' } } : { ok: false, response: { status: 401 } }; } },
    '../../lib/delivery': { customerOrderQuery },
    '../../models/Order': { default: { find: (filter) => { calls.owner = filter; return query(rows); }, countDocuments: async (filter) => { calls.countOwner = filter; return rows.length; } } },
    '../../models/Delivery': { default: { find: (filter) => { calls.deliveries = filter; return query([]); } } },
    '../../models/Shop': { default: { find: (filter) => { calls.shops = filter; return query([{ _id: 'shop-a', name: 'မြစ်ကြီးနားဆိုင်' }]); } } },
  };
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  new Function('require', 'exports', output)((name) => { assert.ok(modules[name], `Unexpected dependency ${name}`); return modules[name]; }, exports);
  return { GET: exports.GET, calls };
}
test('customer history remains owner-scoped and adds only the available shop name without creating Delivery records', async () => {
  const { GET, calls } = route({ rows: [{ _id: 'order-a', orderId: 'ORD-A', shopId: 'shop-a', serviceType: 'shopping', orderStatus: 'confirmed' }, { _id: 'order-b', serviceType: 'hotel' }] });
  const response = await GET({ url: 'http://test/api/orders?page=2&limit=10&customerId=customer-b' });
  assert.equal(response.status, 200);
  assert.deepEqual(calls.roles, ['customer']);
  assert.deepEqual(calls.owner, { customerId: 'customer-a' });
  assert.deepEqual(calls.countOwner, calls.owner);
  assert.deepEqual(calls.deliveries, { orderId: { $in: ['order-a', 'order-b'] } });
  assert.deepEqual(calls.shops, { _id: { $in: ['shop-a'] } });
  assert.equal(calls.skip, 10);
  assert.equal(calls.limit, 10);
  assert.equal(response.body.data[0].shopName, 'မြစ်ကြီးနားဆိုင်');
  assert.equal(response.body.data[1].shopName, null);
  assert.ok(response.body.data.every((order) => order.delivery === null));
  assert.equal(response.body.data[0].shopId, undefined);
});
test('unauthenticated customer history returns before accessing the database', async () => {
  const { GET, calls } = route({ authorized: false });
  assert.equal((await GET({ url: 'http://test/api/orders' })).status, 401);
  assert.equal(calls.connected, undefined);
  assert.equal(calls.owner, undefined);
});
