import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const cache = new Map();
function load(filename) {
  filename = path.resolve(filename);
  if (cache.has(filename)) return cache.get(filename);
  const exports = {};
  cache.set(filename, exports);
  const source = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const localRequire = (name) => {
    if (name === 'next/image') return { default: () => null };
    if (/ProductDetailsModal|PaymentQrCard/.test(name)) return { default: () => null };
    if (name.endsWith('/supabase')) return {};
    if (!name.startsWith('.')) return require(name);
    return load(path.resolve(path.dirname(filename), name) + '.js');
  };
  new Function('require', 'exports', source)(localRequire, exports);
  return exports;
}

const ShopDetail = load('app/components/ShopDetailClient.js').default;
const AddItem = load('app/components/vendor/AddItemForm.js').default;
const room = { _id: 'room', name: 'Room 101', price: 40000, type: 'room', isAvailable: true };

test('hotel room page renders before a booking is selected and asks for dates', () => {
  const html = renderToStaticMarkup(React.createElement(ShopDetail, {
    shop: { _id: 'hotel', name: 'Hotel', category: 'hotel' }, items: [room],
  }));
  assert.match(html, /Room 101/);
  assert.match(html, /Check availability/);
  assert.match(html, /Choose dates to check availability/);
  assert.doesNotMatch(html, /Total for stay/);
});

test('date search is limited to hotel shops', () => {
  for (const category of ['shopping', 'spa']) {
    const html = renderToStaticMarkup(React.createElement(ShopDetail, {
      shop: { _id: 'shop', name: 'Shop', category }, items: [],
    }));
    assert.doesNotMatch(html, /Check availability/);
  }
});

test('hotel creation form collects a physical room identity and capacity', () => {
  const html = renderToStaticMarkup(React.createElement(AddItem, {
    serviceType: 'hotel', shop: { _id: 'hotel' },
  }));
  assert.match(html, /Room number or name/);
  assert.match(html, /Room type/);
  assert.match(html, /Maximum guests/);
  assert.match(html, /one physical room per listing/);
});

test('hotel listing shows only hotel-wide amenities and caps the chips at four', () => {
  const ShopCard = load('app/components/shops/ShopCard.js').default;
  const shop = { _id: 'hotel', name: 'Hotel', category: 'hotel' };
  const renderCard = (hotelAmenities) => renderToStaticMarkup(React.createElement(ShopCard, {
    shop: { ...shop, hotelAmenities }, ctaLabel: 'See Hotel Rooms',
  }));

  assert.doesNotMatch(renderCard(), /Hotel amenities/);
  assert.doesNotMatch(renderCard([]), /Hotel amenities/);
  const html = renderCard(['wifi', 'aircon', 'breakfast', 'parking', 'pool']);
  assert.match(html, /Hotel amenities/);
  assert.match(html, /Wi-Fi/);
  assert.match(html, /Parking/);
  assert.match(html, /\+1/);
  assert.doesNotMatch(html, />Pool</);
});

test('hotel details keep hotel and room amenities separate', () => {
  const html = renderToStaticMarkup(React.createElement(ShopDetail, {
    shop: { _id: 'hotel', name: 'Hotel', category: 'hotel', hotelAmenities: ['pool'] },
    items: [{ ...room, extra: { amenities: { aircon: true, breakfast: false } } }],
  }));

  assert.match(html, /aria-label="Hotel amenities"[^>]*><li[^>]*>Pool<\/li><\/ul>/);
  assert.match(html, /aria-label="Room amenities"[^>]*><li[^>]*>Air-con<\/li><\/ul>/);
  assert.doesNotMatch(html, /Breakfast/);
});
