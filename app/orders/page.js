"use client";

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { createOrdersLoader, orderProgress, orderTimeline, statusLabel } from '../lib/customerOrders';

const money = (value) => Number.isFinite(Number(value)) ? `${Number(value).toLocaleString('en-US')} MMK` : 'Not available';
const date = (value) => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toLocaleString('en-GB', { timeZone: 'Asia/Yangon' }) : null;
const button = 'rounded-xl border border-green-200 px-4 py-3 text-sm font-semibold text-green-800 hover:bg-green-50 disabled:opacity-50';

function OrderCard({ order }) {
  const progress = orderProgress(order);
  const timeline = orderTimeline(order);
  return <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0"><h2 className="break-all font-semibold text-gray-900">{order.orderId || order._id}</h2>
        {order.shopName && <p className="mt-1 break-words text-gray-700">{order.shopName}</p>}
        <p className="mt-1 text-sm text-gray-500">{statusLabel(order.serviceType)}{date(order.createdAt) && ` · ${date(order.createdAt)} (Myanmar time)`}</p>
      </div>
      <p className="font-bold text-green-800">{money(order.totalAmount)}</p>
    </div>
    <ul className="my-4 space-y-2 text-sm text-gray-700">{order.items?.map((item, index) => <li className="break-words" key={item._id || index}>{item.name} × {item.quantity}</li>)}</ul>
    <div className="flex flex-wrap gap-2 text-sm">
      <p className="rounded-lg bg-green-50 px-3 py-2 text-green-900">{progress.label}</p>
      <p className="rounded-lg bg-gray-100 px-3 py-2 text-gray-800">Payment: {statusLabel(order.paymentStatus)}</p>
    </div>
    <details className="mt-4 border-t border-gray-100 pt-3">
      <summary className="cursor-pointer py-2 font-semibold text-green-800">Order details & progress</summary>
      <dl className="my-4 grid grid-cols-2 gap-3 text-sm"><dt>Order status</dt><dd>{statusLabel(order.orderStatus)}</dd><dt>Shop response</dt><dd>{statusLabel(order.vendorStatus)}</dd><dt>Payment status</dt><dd>{statusLabel(order.paymentStatus)}</dd></dl>
      <ul className="space-y-3 border-t border-gray-100 py-4 text-sm">{order.items?.map((item, index) => <li key={item._id || index} className="flex flex-wrap justify-between gap-2"><span className="break-words">{item.name} · {item.quantity} × {money(item.price)}</span><span>{money(item.lineTotal)}</span></li>)}</ul>
      <h3 className="mb-3 font-semibold">{timeline.length ? 'Delivery progress' : 'Order progress'}</h3>
      <p className="mb-4 text-sm text-gray-600">Order placed{date(order.createdAt) ? ` · ${date(order.createdAt)} (Myanmar time)` : ''}</p>
      {timeline.length ? <ol className="space-y-4 border-l-2 border-green-100 pl-4">{timeline.map((step) => <li key={step.status} aria-current={step.current ? 'step' : undefined} className={step.reached ? 'text-green-900' : 'text-gray-500'}><p className={step.current ? 'font-bold' : ''}>{step.reached ? '✓ ' : ''}{step.label}{step.current ? ' · Current' : ''}</p>{date(step.at) && <p className="text-xs">{date(step.at)} (Myanmar time)</p>}</li>)}</ol> : <p>{progress.label}</p>}
      {date(order.delivery?.updatedAt) && order.serviceType === 'shopping' && <p className="mt-4 text-xs text-gray-500">Delivery last updated: {date(order.delivery.updatedAt)} (Myanmar time)</p>}
    </details>
  </article>;
}

function CustomerOrders({ customerId }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [storedState, setState] = useState(null);
  const state = storedState?.page === page ? storedState : { data: null, loading: true, error: null };
  const loader = useRef(null);
  useEffect(() => {
    const controller = createOrdersLoader({
      fetcher: (signal) => fetch(`/api/orders?page=${page}&limit=10`, { signal, cache: 'no-store', credentials: 'include' }),
      onChange: (value) => setState({ ...value, page }),
      onUnauthorized: () => { setState({ page, data: null, loading: false, error: 'Your session has expired. Please sign in again.' }); router.replace('/login'); },
      visibility: () => document.visibilityState === 'visible',
    });
    loader.current = controller;
    const onVisibility = () => controller.visibilityChanged();
    document.addEventListener('visibilitychange', onVisibility);
    void controller.load();
    return () => { controller.stop(); document.removeEventListener('visibilitychange', onVisibility); };
  }, [customerId, page, router]);
  const orders = state.data?.data;
  const pagination = state.data?.pagination;
  return <>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold text-gray-900">My Orders</h1><p lang="my" className="mt-2 text-sm leading-8 text-gray-600">သင်၏ မှာယူမှုများ</p></div><button className={button} disabled={state.loading} onClick={() => loader.current?.load()}>{state.loading && orders ? 'Refreshing…' : 'Refresh'}</button></div>
    {state.error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"><p>{state.error}</p>{orders && <p className="mt-2 text-sm">Showing previously loaded orders.</p>}<button className={`${button} mt-3`} disabled={state.loading} onClick={() => loader.current?.load()}>Retry</button></div>}
    {state.loading && !orders && <p role="status" className="py-10 text-center text-gray-600">Loading your orders…</p>}
    {orders?.length === 0 && <div className="rounded-2xl bg-white p-8 text-center"><h2 className="text-lg font-semibold">No orders yet</h2><p className="my-3 text-gray-600">Your orders will appear here after checkout.</p><Link className={button} href="/shops">Browse shops</Link></div>}
    <div className="space-y-4" aria-busy={state.loading}>{orders?.map((order) => <OrderCard key={order._id} order={order} />)}</div>
    {pagination && (pagination.totalPages > 1 || page > 1) && <nav aria-label="Orders pagination" className="mt-6 flex items-center justify-between gap-3"><button className={button} disabled={page === 1 || state.loading} onClick={() => setPage(page - 1)}>Previous</button><span className="text-sm text-gray-600">Page {pagination.page} of {Math.max(pagination.totalPages, page)}</span><button className={button} disabled={!pagination.hasNextPage || state.loading} onClick={() => setPage(page + 1)}>Next</button></nav>}
  </>;
}

export default function OrdersPage() {
  const { user, loading, authError, refresh } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !authError && !user) router.replace('/login'); }, [loading, authError, user, router]);
  return <div className="mx-auto max-w-3xl px-4 py-8 text-base leading-8 sm:px-6">
    {loading ? <p role="status">Checking your session…</p> : !user && authError ? <div role="alert"><p>Unable to check your session.</p><button className={button} onClick={() => refresh()}>Retry</button></div> : !user ? <Link href="/login">Sign in to view your orders</Link> : user.role !== 'customer' ? <p>This page is for customer accounts.</p> : <CustomerOrders key={user._id} customerId={user._id} />}
  </div>;
}
