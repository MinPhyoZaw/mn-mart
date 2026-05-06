"use client";
import { useEffect, useState } from "react";

export default function SpaAdminPage() {
  const [bookings, setBookings] = useState([]);
  const load = () => fetch('/api/spa/admin/bookings').then(r=>r.json()).then(d=>setBookings(d.data||[]));
  useEffect(load, []);
  const action = async (id, type) => { await fetch(`/api/spa/admin/bookings/${id}/${type}`, { method: 'PATCH' }); load(); };
  return <div><h2>SPA Admin Dashboard</h2>{bookings.map((b)=><div key={b._id}><p>{b.customerName} - {b.phoneNumber}</p><p>{b.serviceId?.serviceName}</p><p>{b.selectedDate} {b.selectedTimeSlot.start}-{b.selectedTimeSlot.end}</p><img src={b.receiptImage} alt="receipt" width="120"/><p>{b.orderStatus}</p><button onClick={()=>action(b._id,'approve')}>Approve</button><button onClick={()=>action(b._id,'reject')}>Reject</button></div>)}</div>;
}
