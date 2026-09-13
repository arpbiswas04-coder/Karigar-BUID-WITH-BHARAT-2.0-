import test from 'node:test';
import assert from 'node:assert/strict';
import {sellerActivity} from './marketplaceHandler.js';

test('seller order labels use multiplication signs and actual item quantities', async () => {
 const items=[1,2,3].map(quantity=>({productId:`p${quantity}`,quantity,unitPrice:750,product:{title:'Jaipuri Lac Bangles',mediaJson:'{}'}}));
 const row={id:'order',orderNumber:'ORDER-1',status:'PAYMENT_PENDING',shippingAddressJson:'{}',buyer:{fullName:'Buyer'},items};
 const before=JSON.stringify(row);
 const prisma={order:{findMany:async()=>[row]},review:{findMany:async()=>[]}};
 const {orders}=await sellerActivity(prisma,'artisan');
 assert.equal(orders[0].product,'Jaipuri Lac Bangles \u00D7 1, Jaipuri Lac Bangles \u00D7 2, Jaipuri Lac Bangles \u00D7 3');
 assert.deepEqual(orders[0].items.map(item=>item.quantity),[1,2,3]);
 assert.equal(orders[0].quantity,6);
 assert.equal(orders[0].amount,4500);
 assert.equal(JSON.stringify(row),before);
});
