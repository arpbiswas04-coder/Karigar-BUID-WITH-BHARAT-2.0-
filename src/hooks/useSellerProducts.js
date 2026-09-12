import { useCallback, useEffect, useState } from 'react';
import { listProducts } from '../utils/productApi.js';
import {normalizeSellerProduct} from '../utils/sellerProducts.js';
export default function useSellerProducts(token) {
  const [loaded,setLoaded]=useState({token:null,products:[],error:''});
  const [revision,setRevision]=useState(0);
  const refreshProducts=useCallback(()=>setRevision(value=>value+1),[]);
  useEffect(()=>{window.addEventListener('karigar-products-changed',refreshProducts);return()=>window.removeEventListener('karigar-products-changed',refreshProducts);},[refreshProducts]);
  useEffect(()=>{
    if(!token)return;
    let active=true;
    listProducts(token).then(data=>{if(active)setLoaded({token,error:'',products:data.products.map(normalizeSellerProduct)});})
      .catch(error=>{if(active)setLoaded({token,products:[],authRequired:error.status===401,error:error.status===401?'Your session has expired. Please sign in again.':error.message||'Could not load your products. Refresh to try again.'});});
    return()=>{active=false;};
  },[token,revision]);
  return {products:token&&loaded.token===token?loaded.products:[],productsLoading:!!token&&loaded.token!==token,
    productsError:loaded.token===token?loaded.error:'',productsAuthRequired:loaded.token===token&&loaded.authRequired===true,refreshProducts};
}
