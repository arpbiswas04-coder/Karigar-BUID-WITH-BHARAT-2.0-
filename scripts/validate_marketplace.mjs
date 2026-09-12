import {PrismaClient} from '@prisma/client';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {DEMO_ARTISANS} from '../prisma/artisanData.js';
if(!process.env.DATABASE_URL)process.env.DATABASE_URL='file:./dev.db';
const prisma=new PrismaClient();
try{
 const users=await prisma.user.findMany({where:{email:{in:DEMO_ARTISANS.map(a=>a.email)}},include:{products:true}});
 assert.equal(users.length,360);
 for(const user of users){assert.equal(user.products.filter(p=>p.publishKey.startsWith('marketplace-demo-v1-')).length,10);assert.ok(['/images/demo/male.jpeg','/images/demo/female.jpeg'].includes(user.avatarUrl));for(const product of user.products){const media=JSON.parse(product.mediaJson);for(const image of media.images)assert.ok(existsSync('public'+image),image);assert.ok(product.stock>=0);}}
 const patrons=await prisma.user.findMany({where:{email:{endsWith:'@demo.karigar.invalid'}}});assert.equal(patrons.length,6);for(const p of patrons)assert.ok(p.avatarUrl.includes('customer '));
 const foreignKeys=await prisma.$queryRawUnsafe('PRAGMA foreign_key_check');assert.equal(foreignKeys.length,0);
 const summary={artisans:users.length,products:users.reduce((n,u)=>n+u.products.filter(p=>p.publishKey.startsWith('marketplace-demo-v1-')).length,0),patrons:patrons.length,orders:await prisma.order.count({where:{id:{startsWith:'demo-'}}}),reviews:await prisma.review.count({where:{id:{startsWith:'demo-'}}}),stock:users.reduce((sum,u)=>sum+u.products.reduce((s,p)=>s+p.stock,0),0)};
 console.log(JSON.stringify(summary));
}finally{await prisma.$disconnect();}
