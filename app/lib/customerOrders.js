// Presentation of existing backend states only; this module never writes orders.
export const DELIVERY_STEPS = [
  ['ready', 'Order confirmed'],
  ['assigned', 'Rider assigned'],
  ['accepted', 'Rider is heading to the shop'],
  ['picked_up', 'Your order has been picked up'],
  ['out_for_delivery', 'Your order is on the way'],
  ['delivered', 'Your order has been delivered'],
];
export function statusLabel(value) {
  return value ? value.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase()) : 'Not available';
}
export function orderProgress(order) {
  // Terminal order/vendor decisions take precedence over a stale delivery.
  for (const status of ['cancelled', 'canceled', 'rejected']) {
    if ([order.orderStatus, order.vendorStatus].includes(status)) {
      return { label: status === 'rejected' ? 'Order rejected' : 'Order cancelled', index: -1 };
    }
  }
  if (order.orderStatus !== 'confirmed') return { label: `Order ${statusLabel(order.orderStatus).toLowerCase()}`, index: -1 };
  if (order.serviceType !== 'shopping') return { label: `Booking ${statusLabel(order.orderStatus).toLowerCase()}`, index: -1 };
  const index = order.delivery === null || !order.delivery ? 0 : DELIVERY_STEPS.findIndex(([status]) => status === order.delivery.status);
  return { label: index < 0 ? `Delivery: ${statusLabel(order.delivery?.status)}` : DELIVERY_STEPS[index][1], index };
}
export function unfinishedShopping(order) {
  return order.serviceType === 'shopping' && !['rejected', 'cancelled', 'canceled'].some((status) => [order.orderStatus, order.vendorStatus].includes(status)) && order.delivery?.status !== 'delivered';
}
export function orderTimeline(order) {
  const { index } = orderProgress(order);
  if (index < 0) return [];
  return DELIVERY_STEPS.map(([status, label], step) => ({
    status, label, reached: step <= index, current: step === index,
    // updatedAt is an update time, not evidence of when earlier steps occurred.
    at: status === 'delivered' && index === 5 ? order.delivery?.deliveredAt || null : null,
  }));
}

// One controller per customer/page; dependency injection permits deterministic tests.
export function createOrdersLoader({ fetcher, onChange, onUnauthorized, visibility, schedule = setTimeout, cancel = clearTimeout }) {
  let state = { data: null, loading: false, error: null };
  let stopped = false;
  let busy = false;
  let timer;
  let abort;
  const emit = (changes) => { state = { ...state, ...changes }; if (!stopped) onChange(state); };
  const clear = () => { if (timer !== undefined) cancel(timer); timer = undefined; };
  const arm = () => {
    clear();
    if (!stopped && visibility() && state.data?.data.some(unfinishedShopping)) timer = schedule(() => { void load(); }, 30000);
  };
  async function load() {
    if (stopped || busy) return;
    clear();
    busy = true;
    abort = new AbortController();
    emit({ loading: true });
    try {
      const response = await fetcher(abort.signal);
      if (stopped) return;
      if (response.status === 401) { stopped = true; clear(); onUnauthorized(); return; }
      const data = await response.json();
      if (!response.ok || !data.success || !Array.isArray(data.data) || !data.pagination) throw new Error(data.error?.message || 'Unable to load orders. Please try again.');
      emit({ data, error: null });
    } catch (error) {
      if (!stopped && error.name !== 'AbortError') emit({ error: error.message || 'Unable to load orders. Please try again.' });
    } finally {
      busy = false;
      if (!stopped) { emit({ loading: false }); arm(); }
    }
  }
  return {
    load,
    visibilityChanged() { clear(); if (visibility()) void load(); },
    stop() { stopped = true; clear(); abort?.abort(); },
  };
}
