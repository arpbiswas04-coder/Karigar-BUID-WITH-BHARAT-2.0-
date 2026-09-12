import test from 'node:test';
import assert from 'node:assert/strict';
import {artisanPortrait} from '../data/demoImages.js';
test('people keep their portraits rather than craft/category images',()=>{
 assert.equal(artisanPortrait({avatarUrl:'/images/demo/female.jpeg',craftType:'Pottery'}),'/images/demo/female.jpeg');
 assert.equal(artisanPortrait({avatar:'/images/demo/female.jpeg'}),'/images/demo/female.jpeg');
 assert.equal(artisanPortrait({avatarUrl:'/uploads/avatars/person.jpg'}),'/uploads/avatars/person.jpg');
 assert.equal(artisanPortrait({avatarUrl:'/demo_image/pottery and clay.jpg',craftType:'Pottery'}),'/images/demo/male.jpeg');
});
