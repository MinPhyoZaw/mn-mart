import test from 'node:test';
import assert from 'node:assert/strict';
import { DELIVERY_STEPS, orderProgress, orderTimeline, unfinishedShopping, createOrdersLoader } from '../../app/lib/customerOrders.js';

const order = (overrides = {}) => ({ serviceType: 'shopping', orderStatus: 'confirmed', vendorStatus: 'accepted', paymentStatus: 'paid', delivery: null, ...overrides });

test('confirmed shopping order without a Delivery record is confirmed and continues refreshing', () => {
  assert.equal(orderProgress(order()).label, 'Order confirmed');
  assert.equal(unfinishedShopping(order()), true);
  assert.deepEqual(orderTimeline(order()).filter((step) => step.reached).map((step) => step.status), ['ready']);
  assert.ok(orderTimeline(order({ createdAt: '2026-01-01' })).every((step) => step.at === null));
});
test('all existing delivery states map to the customer wording independently of payment', () => {
  for (const [index, [status, label]] of DELIVERY_STEPS.entries()) {
    assert.deepEqual(orderProgress(order({ paymentStatus: 'pending', delivery: { status } })), { index, label });
    assert.equal(orderTimeline(order({ delivery: { status } })).filter((step) => step.reached).length, index + 1);
  }
});
test('pending, rejected, cancelled and non-shopping orders never inherit delivery confirmation', () => {
  for (const orderStatus of ['pending', 'rejected', 'cancelled']) {
    const value = order({ orderStatus, delivery: { status: 'delivered' } });
    assert.equal(orderProgress(value).index, -1);
    assert.deepEqual(orderTimeline(value), []);
    assert.ok(!orderProgress(value).label.includes('confirmed'));
  }
  assert.equal(orderProgress(order({ vendorStatus: 'rejected' })).label, 'Order rejected');
  assert.equal(unfinishedShopping(order({ vendorStatus: 'rejected' })), false);
  for (const serviceType of ['hotel', 'spa', 'transportation']) {
    assert.equal(orderProgress(order({ serviceType })).label, 'Booking confirmed');
    assert.deepEqual(orderTimeline(order({ serviceType })), []);
    assert.equal(unfinishedShopping(order({ serviceType })), false);
  }
  assert.equal(unfinishedShopping(order({ orderStatus: 'pending' })), true);
  assert.equal(unfinishedShopping(order({ delivery: { status: 'delivered' } })), false);
});
test('timeline uses only the returned deliveredAt; updatedAt is not a prior transition time', () => {
  const delivery = { status: 'delivered', updatedAt: '2026-01-03', deliveredAt: '2026-01-02' };
  const steps = orderTimeline(order({ delivery }));
  assert.ok(steps.slice(0, 5).every((step) => step.at === null));
  assert.equal(steps[5].at, delivery.deliveredAt);
  assert.equal(orderTimeline(order({ delivery: { status: 'out_for_delivery', updatedAt: delivery.updatedAt } }))[4].at, null);
});

function harness(fetcher) {
  let visible = true;
  let state;
  let unauthorized = false;
  let next = 0;
  const timers = new Map();
  const controller = createOrdersLoader({ fetcher, onChange: (value) => { state = value; }, onUnauthorized: () => { unauthorized = true; }, visibility: () => visible, schedule: (callback, delay) => { assert.equal(delay, 30000); timers.set(++next, callback); return next; }, cancel: (id) => timers.delete(id) });
  return { controller, timers, get state() { return state; }, get unauthorized() { return unauthorized; }, visibility(value) { visible = value; controller.visibilityChanged(); } };
}
const result = (data = [order()]) => ({ success: true, data, pagination: { page: 1, totalPages: 1 } });
const response = (body, status = 200) => ({ ok: status === 200, status, json: async () => body });
const settle = () => new Promise((resolve) => setImmediate(resolve));

test('polling pauses while hidden, refreshes on visibility, and stops after completion', async () => {
  let calls = 0;
  const h = harness(async () => { calls++; return response(result(calls < 3 ? [order()] : [order({ delivery: { status: 'delivered' } })])); });
  await h.controller.load();
  assert.equal(h.timers.size, 1);
  h.visibility(false);
  assert.equal(h.timers.size, 0);
  assert.equal(calls, 1);
  h.visibility(true);
  await settle();
  assert.equal(calls, 2);
  const tick = [...h.timers.values()][0];
  tick();
  await settle();
  assert.equal(calls, 3);
  assert.equal(h.timers.size, 0);
  h.controller.stop();
});
test('refresh does not overlap requests; errors keep existing content and Retry recovers', async () => {
  let resolve;
  let calls = 0;
  const h = harness(() => { calls++; return new Promise((done) => { resolve = done; }); });
  const first = h.controller.load();
  await h.controller.load();
  assert.equal(calls, 1);
  resolve(response(result()));
  await first;
  const previous = h.state.data;
  const failed = h.controller.load();
  assert.equal(h.state.data, previous);
  resolve(response({ error: { message: 'Temporary failure' } }, 500));
  await failed;
  assert.equal(h.state.data, previous);
  assert.equal(h.state.error, 'Temporary failure');
  assert.equal(h.state.loading, false);
  assert.equal(h.timers.size, 1);
  const retry = h.controller.load();
  resolve(response(result([])));
  await retry;
  assert.deepEqual(h.state.data.data, []);
  assert.equal(h.state.error, null);
  assert.equal(h.timers.size, 0);
  h.controller.stop();
});
test('network / malformed response errors support retry; unmount aborts without late updates', async () => {
  let signal;
  let resolve;
  let calls = 0;
  const h = harness(async (value) => {
    calls++;
    if (calls === 1) throw new Error('Offline');
    if (calls === 2) return response({ success: true });
    signal = value;
    return new Promise((done) => { resolve = done; });
  });
  await h.controller.load();
  assert.equal(h.state.error, 'Offline');
  assert.equal(h.state.loading, false);
  await h.controller.load();
  assert.match(h.state.error, /Unable to load/);
  const pending = h.controller.load();
  const previous = h.state;
  h.controller.stop();
  assert.equal(signal.aborted, true);
  resolve(response(result()));
  await pending;
  assert.equal(h.state, previous);
  assert.equal(h.timers.size, 0);
});
test('expired sessions invoke existing login flow and never poll again', async () => {
  const h = harness(async () => response({}, 401));
  await h.controller.load();
  assert.equal(h.unauthorized, true);
  assert.equal(h.timers.size, 0);
  assert.equal(h.state.data, null);
});
