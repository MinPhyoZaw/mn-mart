"use client";
import { useEffect, useState } from "react";

export default function SpaVendorPage() {
  const [bookings, setBookings] = useState([]);
  const load = () => fetch('/api/spa/vendor/bookings').then(r=>r.json()).then(d=>setBookings(d.data||[]));
  useEffect(load, []);
  const action = async (id, type) => { await fetch(`/api/spa/vendor/bookings/${id}/${type}`, { method: 'PATCH' }); load(); };
  return <div><h2>SPA Vendor Dashboard</h2>{bookings.map((b)=><div key={b._id}><p>{b.customerName} - {b.phoneNumber}</p><p>{b.serviceId?.serviceName}</p><p>{b.orderStatus}</p><button onClick={()=>action(b._id,'approve')}>Approve Booking</button><button onClick={()=>action(b._id,'reject')}>Reject Booking</button></div>)}</div>;
}
