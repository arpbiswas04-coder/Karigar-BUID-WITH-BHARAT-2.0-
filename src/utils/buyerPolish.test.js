import test from 'node:test';
import assert from 'node:assert/strict';
import {sortByEvidence} from './buyerEvidence.js';
import {getPlatformCommissionRate, getRevenueAllocation, formatAllocationMoney} from './platformCommission.js';

test('evidence ranking preserves input and ties, with unscored last and zero scored', () => {
 const products = [null,40,92.4,40,undefined,0,NaN].map((score,id)=>Object.freeze({id,evidence:{score}}));
 Object.freeze(products);
 assert.deepEqual(sortByEvidence(products).map(p=>p.id),[2,1,3,5,0,4,6]);
 assert.deepEqual(products.map(p=>p.id),[0,1,2,3,4,5,6]);
 assert.deepEqual(sortByEvidence([{id:1},{id:2,evidence:{score:0}}]).map(p=>p.id),[2,1]);
});
test('commission brackets include boundaries and fractional rupee prices', () => {
 for(const [price,rate] of [[0,5],[1000,5],[1000.01,4],[5000,4],[5000.01,3.5],[15000,3.5],[15000.01,3]])assert.equal(getPlatformCommissionRate(price),rate);
 for(const price of [-1,NaN,Infinity,null])assert.throws(()=>getPlatformCommissionRate(price),RangeError);
});
test('allocation examples, rounded paisa and Indian currency formatting', () => {
 for(const [price,commission,artisan] of [[750,37.5,712.5],[2500,100,2400],[10000,350,9650],[32500,975,31525]]) {
  const result=getRevenueAllocation(price);
  assert.equal(result.commissionAmount,commission);assert.equal(result.artisanAmount,artisan);
  assert.equal(result.artisanPercent+result.commissionPercent,100);
 }
 const result=getRevenueAllocation(1000.01);
 assert.equal(Math.round((result.artisanAmount+result.commissionAmount)*100),100001);
 assert.equal(formatAllocationMoney(712.5),'\u20b9712.50');
 assert.equal(formatAllocationMoney(31525),'\u20b931,525');
 assert.equal(formatAllocationMoney(100000),'\u20b91,00,000');
});
