import { API_BASE_URL } from '../utils/api';
import {productMediaUrl} from '../utils/productApi.js';
import {useEffect,useState} from 'react';
export default function useSellerActivity(token){
 const [data,setData]=useState({token:null,orders:[],customers:[],error:''});
 useEffect(()=>{if(!token)return;let active=true;const controller=new AbortController();
 const load=async()=>{try{const r=await fetch(`${API_BASE_URL}/api/seller/activity`,{headers:{Authorization:`Bearer ${token}`},signal:controller.signal});if(!r.ok)throw Error('Unable to load orders and customers.');const next=await r.json();if(active)setData({...next,orders:next.orders.map(o=>({...o,productImage:productMediaUrl(o.productImage)})),customers:next.customers.map(c=>({...c,avatar:productMediaUrl(c.avatar)})),token,error:''});}catch(e){if(active&&e.name!=='AbortError')setData({token,orders:[],customers:[],error:e.message});}};
 load();window.addEventListener('focus',load);const timer=setInterval(load,60000);return()=>{active=false;controller.abort();clearInterval(timer);window.removeEventListener('focus',load);};},[token]);
 return data.token===token?data:{orders:[],customers:[],error:'',loading:!!token};
}
