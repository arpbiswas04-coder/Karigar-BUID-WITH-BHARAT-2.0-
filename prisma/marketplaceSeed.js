import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { DEMO_ARTISANS } from './artisanData.js';
import { categoryImageMap, craftCategoryMap } from '../src/constants/craftImageMap.js';
const id=(value)=>'demo-'+createHash('sha256').update(value).digest('hex').slice(0,24);
const designs=['Garden','River','Courtyard','Harvest','Forest','Sunrise','Monsoon','Festival','Earth','Lotus'];
const materials={
 'Handloom & Textiles':['Cotton','Silk'],'Embroidery':['Cotton','Embroidery thread'],'Pottery & Clay':['Terracotta clay'],
 'Metal & Dhokra':['Brass'],'Painting & Folk Art':['Natural pigments','Paper'],'Jewellery & Accessories':['Beads','Cotton cord'],
 'Wood, Bamboo & Cane':['Bamboo'],'Basketry & Natural Fibres':['Natural fibre'],'Stone & Sculpture':['Stone'],
 'Toys & Dolls':['Wood','Fabric'],'Leather Craft':['Leather'],'Paper & Eco Crafts':['Handmade paper'],'Home & Living':['Cotton','Wood']};
export async function seedMarketplace(prisma) {
 const hash=await bcrypt.hash('KarigarDemo@2026',10);const patrons=[];
 for(let i=0;i<6;i++){
  const names=['Priya Sharma','Aman Das','Meera Rao','Rohan Sen','Anjali Shah','Kabir Nair'];
  const email=`patron${i+1}@demo.karigar.invalid`;
  patrons.push(await prisma.user.upsert({where:{email},update:{},create:{id:id(email),email,fullName:names[i],password:hash,role:'PATRON',isActive:true,avatarUrl:`/images/demo/customer ${i%2?'male':'female'}.png`,state:'West Bengal',district:'Kolkata'}}));
 }
 const accounts=[];
 for(const [index,demo] of DEMO_ARTISANS.entries()) {
  const artisan=await prisma.user.findUnique({where:{email:demo.email}});
  if(!artisan||artisan.role!=='ARTISAN')throw Error('Run existing artisan seed first.');
  await prisma.user.update({where:{id:artisan.id},data:{avatarUrl:`/images/demo/${index%2?'female':'male'}.jpeg`}});
  const category=craftCategoryMap[artisan.craftType]||'Home & Living';const productIds=[];
  for(let n=0;n<10;n++){
   const publishKey=`marketplace-demo-v1-${n}`;const productId=id(artisan.email+publishKey);productIds.push(productId);
   const title=`${artisan.craftType} - ${designs[n]} ${n%2?'Collection':'Study'}`;
   const details={description:`Demo listing from ${artisan.businessName}, ${artisan.district}, ${artisan.state}. ${designs[n]} design in ${artisan.craftType}, with ${n%2?'a detailed border':'a simple repeated motif'}. Small handmade variations are part of the design. Sample inventory for marketplace testing.`,materials:materials[category],region:artisan.state,dimensions:`${18+n*3} ? ${12+n*2} cm`,craft_technique:artisan.craftType,giTag:''};
   const categories={product_photo_evidence:{score:35,max_score:35},product_video_evidence:{score:0,max_score:15},craft_process_evidence:{score:0,max_score:20},artisan_visibility:{score:0,max_score:15},product_process_match:{score:0,max_score:10},listing_completeness:{score:5,max_score:5}};
   await prisma.product.upsert({where:{artisanId_publishKey:{artisanId:artisan.id,publishKey}},update:{title},create:{id:productId,artisanId:artisan.id,publishKey,title,category,price:450+(index%17)*125+n*170,stock:5+(index+n)%14,detailsJson:JSON.stringify(details),mediaJson:JSON.stringify({images:[categoryImageMap[category]],primaryImageIndex:0,productVideo:null,processVideo:null}),evidenceJson:JSON.stringify({score:40,level:'basic_evidence',categories,live_capture:false,source:'demo_seed',version:'craft-evidence-v2'})}});
  }
  // One delivered and one active purchase per artisan demonstrate scoped activity.
  for(let n=0;n<2;n++){
   const patron=patrons[(index+n)%patrons.length];const product=await prisma.product.findUnique({where:{id:productIds[n]}});const orderId=id(artisan.email+'order'+n);
   await prisma.$transaction(async tx=>{
    if(await tx.order.findUnique({where:{id:orderId}}))return;
    const stock=await tx.product.updateMany({where:{id:product.id,stock:{gte:1}},data:{stock:{decrement:1}}});if(!stock.count)throw Error('Seed inventory is exhausted.');
    await tx.order.create({data:{id:orderId,orderNumber:'KGR-'+orderId.toUpperCase(),buyerId:patron.id,totalAmount:product.price,paymentMethod:'escrow_upi',status:n?'PROCESSING':'DELIVERED',shippingAddressJson:JSON.stringify({fullName:patron.fullName,city:patron.district,state:patron.state,address:'Demo address',pincode:'700001'}),items:{create:{id:id(orderId+'item'),productId:product.id,quantity:1,unitPrice:product.price}},escrow:{create:{id:id(orderId+'escrow'),amount:product.price,method:'escrow_upi',status:'HELD',transactionId:'DEMO',fundedAt:new Date()}}}});
   });
   if(n===0)await prisma.review.upsert({where:{productId_patronId:{productId:product.id,patronId:patron.id}},update:{},create:{id:id(orderId+'review'),productId:product.id,patronId:patron.id,rating:index%3===0?4:5,text:['The finish matches the photos. It arrived carefully packed.','A useful handmade piece with pleasing details.','The texture is lovely. Slight colour variation feels natural.'][index%3]}});
  }
  accounts.push(`| ${artisan.fullName} | ${artisan.email} | Karigar@123 | ${artisan.state} | ${artisan.craftType} | ${artisan.businessName} |`);
 }
 await writeFile('DEMO_ACCOUNTS.local.md','# Demo accounts only\n\nArtisans retain the existing seed password. Never use these credentials for real accounts.\n\n| Name | Email | Password | State | Craft | Business |\n|---|---|---|---|---|---|\n'+accounts.join('\n')+'\n\nPatron accounts: patron1@demo.karigar.invalid through patron6@demo.karigar.invalid. Password: KarigarDemo@2026.\n');
 console.log(JSON.stringify({seedArtisans:DEMO_ARTISANS.length,seedProducts:DEMO_ARTISANS.length*10,seedPatrons:patrons.length,seedOrders:DEMO_ARTISANS.length*2,seedReviews:DEMO_ARTISANS.length}));
}
