import { API_BASE_URL } from '../../utils/api';
import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import {formatCurrency} from '../../utils/formatters';
export default function Orders(){
 const {token}=useAuth();const [data,setData]=useState({token:null,orders:[],error:''});
 useEffect(()=>{if(!token)return;const controller=new AbortController();fetch(`${API_BASE_URL}/api/orders`,{headers:{Authorization:`Bearer ${token}`},signal:controller.signal}).then(async r=>{if(!r.ok)throw Error('Could not load orders.');return r.json();}).then(d=>setData({token,orders:d.orders,error:''})).catch(e=>{if(e.name!=='AbortError')setData({token,orders:[],error:e.message});});return()=>controller.abort();},[token]);
 const orders=data.token===token?data.orders:[];
 return <section className="premium-section"><h1>Your Orders</h1><p>Orders placed with your patron account. Checkout currently uses test payments.</p>{data.token!==token?<p>Loading orders...</p>:data.error?<p role="alert">{data.error}</p>:!orders.length?<p>No orders yet. <Link to="/collections">Browse crafts</Link></p>:orders.map(o=><article key={o.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 my-4"><h2>{o.orderNumber}</h2><p>{new Date(o.createdAt).toLocaleDateString()} ? {o.status.replaceAll('_',' ')} ? {formatCurrency(o.totalAmount)}</p><p>Escrow: {o.escrow?.status||'Not available'}</p>{o.items.map(item=><div key={item.id} className="py-3 border-b border-outline-variant"><Link to={`/product/${item.productId}`}>{item.product.title}</Link><p>{item.product.artisan.fullName} ? {item.quantity} units ? {formatCurrency(item.unitPrice)}</p><Link to={`/product/${item.productId}`}>View product / write a review</Link></div>)}</article>)}</section>;
}
