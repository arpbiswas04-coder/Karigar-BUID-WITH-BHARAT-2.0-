# SQLite marketplace integration

## Schema and data flow
SQLite is preserved. User -> Product (artisan), User -> Order (buyer),
Order -> OrderItem -> Product and Order -> optional EscrowPayment remain intact.
Review adds productId/patronId relations, rating 1-5, text, createdAt/updatedAt,
a unique (productId, patronId) constraint and a product/date index. Migration
20260913010000_add_reviews is additive, with a SQLite rating CHECK constraint.
No existing Order fields or datasource/provider settings changed. Existing pending
migrations were deployed along with Review; no reset or data deletion was run.

Seller POST /api/products publishing, media persistence and eligibility checks
remain intact. Public catalog and seller inventory read the same Product rows.
The buyer directory now combines API User records with API Product records;
static PRODUCTS/generated artisan pseudo-products are no longer runtime sources.
Old data helpers remain isolated for reference, not as a marketplace fallback.
Cart remains local before checkout; the server is authoritative for price/stock.

## Endpoints
- GET /api/catalog/products
- GET /api/catalog/products/:id
- GET /api/artisans
- GET /api/artisans/:id
- GET /api/artisans/:id/products
- GET /api/catalog/products/:id/reviews
- POST /api/catalog/products/:id/reviews (patron; upserts own review)
- PATCH /api/catalog/products/:id/reviews/:reviewId (owner only)
- GET /api/seller/activity (artisan only; scoped order items and customers)
- Existing GET/POST /api/orders and POST /api/orders/:id/payment/confirm are retained.

Public projections omit email, mobile, passwords and capture receipts. Review
writing requires an active patron account; artisans cannot review products.
Review edits change the same DB row, catalog aggregates and seller feedback.
Seller customers are patrons with paid/non-cancelled purchases of that seller's
products, grouped with order counts, units, latest purchase and latest feedback.
Mixed-seller orders reveal only the current artisan's items/totals to that artisan.

Payment is still the existing TEST payment/escrow simulation, not real money.
Stock decrements atomically on confirmation with a stock >= quantity condition;
repeat confirmation does not decrement twice. Insufficient stock rolls back.
No new production payment provider or fulfillment lifecycle was introduced.

## Seed
The existing 360 demo-account definition is reused: 10 artisans per each of
36 states/UTs. No second artisan dataset is created. Each gets 10 Product rows
with stable artisan/publish keys, craft-specific titles, varied design/price/
stock/dimensions, reusable category images and explicitly demo evidence snapshots.
Seed totals: 360 artisans, 3600 products, 6 patrons, 720 orders, 360 reviews.
Live catalog after seeding: 3602 products (including 2 existing listings).
Two runs retained identical counts and total stock (40720 across demo inventories).
Seed product/order/review updates preserve purchases and edited reviews; artisan
profile/password refresh follows the existing demo seed behavior. Only fake seed
accounts use the documented demo passwords. Do not use these credentials in production.

Portraits:
- /images/demo/male.jpeg and /images/demo/female.jpeg for demo artisans
- /images/demo/customer male.png and /images/demo/customer female.png for demo patrons
User.avatarUrl takes precedence. No craft image is used as a person's fallback.
No new image assets were generated; supplied customer images keep their filenames.

## UI changes
Home, Browse/Collections, State Explore, Saved and Product Detail read API products.
Artisan cards show real counts and link to an artisan-filtered collection; Browse
renders batches of 48 to avoid rendering thousands of cards at once. Catalog and
seller activity refresh on focus; catalog also refreshes after publishing/checkout.
Buyer Orders reads the existing buyer-scoped API. Seller Orders/Customers and their
counts no longer consume localStorage/demo arrays. Ratings derive from Review rows.
The old Voice-Assisted Listing dashboard card was removed; Add Product is unchanged.
Gallery labels now describe actual photos/showcase/process videos; videos use controls
and inline playback. No capture tokens are shown. Product Detail uses valid dark
surfaces, DB ratings and write/edit review UI. Fabricated static certificate/review
content is replaced by actual seller-provided GI information and evidence summaries.
Other legacy prototype areas (such as wallets/payouts) were not turned into real
financial services by this task.

## Score changes
See ai-service/README.md, Phone-footage scoring recalibration (2026-09-13).
Process: 4+6+8+unavailable2 -> 6+6+8. Temporal plateau widens from .15-.35 to
.04-.60, with ramps .005-.04 and .60-1.0. Match retains 80% best/20% average:
old 10*clamp((combined-.4)/.5), new 2+8*clamp((combined-.1)/.6) when available.
Showcase consistency becomes 1+6*clamp((average-.15)/.55) instead of hard bands.
Unavailable signals remain zero; visibility is unchanged. No score floor, automatic
85, authenticity guarantee or gate bypass. Lac-bangle raw metrics were unavailable;
manual replay remains necessary to validate the provisional calibration.

## Checks
- SQLite integration: public-field safety, seller isolation, buyer orders, DB price,
  stock decrement, repeated payment, insufficient-stock rejection, review validation,
  ownership/edit, aggregates and seller feedback.
- Existing publishing/media-eligibility and product draft/publish tests pass.
- 43 focused AI tests: trust, phone scoring, showcase, hands and craft routes pass.
- Buyer server-render check passes with database-shaped data (not browser automation).
- Build passes; focused lint has no errors (some unused-import warnings remain).
- Seed counts, media paths and foreign-key checks pass; repeat seed preserves stock.
- Frontend, Node health and FastAPI health return HTTP 200.

## Commands (PowerShell, from D:/Karigar/KARIGAR)
```powershell
npx.cmd prisma generate
npx.cmd prisma migrate deploy
npm.cmd run seed
node scripts/validate_marketplace.mjs
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
```
In separate terminals:
```powershell
npm.cmd start
npm.cmd run dev:ai
```
Uses the existing .venv; no packages were installed/removed there. .env was not edited.

Preview: http://127.0.0.1:5173/
Buyer: http://127.0.0.1:5173/marketplace
Artisans: http://127.0.0.1:5173/artisans
Seller: http://127.0.0.1:5173/seller/dashboard
Node: http://127.0.0.1:5000/api/health
FastAPI: http://127.0.0.1:8000/docs

## Manual checklist
1. Patron login -> Artisans: verify portraits, counts and Browse all products links.
2. Artisan login -> inventory; switch artisan and confirm separate products/orders.
3. Publish through unchanged Media Authenticity -> Details -> Evidence -> Review/Publish;
   patron catalog should show the new row and uploaded photos/videos.
4. Patron checkout (test payment): view buyer order, then owning seller Orders/Customers;
   a different seller must not see it.
5. Write/edit review; verify detail average/count and the same feedback on seller Customers.
6. Inspect all Product Detail tabs in dark/light mode and photo/video playback.
7. Replay lac-bangle footage and compare category points, not an authenticity percentage.

Full fake credentials are in ignored DEMO_ACCOUNTS.local.md. A sample per region
is listed below; all listed artisan passwords are **Karigar@123**. Patrons:
patron1@demo.karigar.invalid through patron6@demo.karigar.invalid, **KarigarDemo@2026**.

| Name | Email | Password | State | Craft | Business |
|---|---|---|---|---|---|
| Kalyan Chakravarthy | kalyan.chakravarthy@karigar.in | Karigar@123 | Andhra Pradesh | Kalamkari Painting | Vamshadhara Kalamkari Studio |
| Tashi Dorjee | tashi.dorjee@karigar.in | Karigar@123 | Arunachal Pradesh | Monpa Handmade Paper Craft | Tawang Monshugu Paper Guild |
| Bhupen Kalita | bhupen.kalita@karigar.in | Karigar@123 | Assam | Muga Silk | Sualkuchi Golden Silk Atelier |
| Bauwa Devi | bauwa.devi@karigar.in | Karigar@123 | Bihar | Madhubani Painting | Jitwarpur Mithila Kala Kendra |
| Sukhdev Baghel | sukhdev.baghel@karigar.in | Karigar@123 | Chhattisgarh | Bastar Dhokra | Bastar Bell Metal Atelier |
| Mahadev Gaonkar | mahadev.gaonkar@karigar.in | Karigar@123 | Goa | Goan Terracotta | Bicholim Potter Guild |
| Abdul Gafur Khatri | abdul.gafur.khatri@karigar.in | Karigar@123 | Gujarat | Rogan Painting | Nirona Rogan Art Studio |
| Gurmeet Kaur | gurmeet.kaur@karigar.in | Karigar@123 | Haryana | Phulkari Embroidery | Heritage Phulkari Atelier |
| Tek Chand Thakur | tek.chand.thakur@karigar.in | Karigar@123 | Himachal Pradesh | Kullu Shawl Weaving | Beas Valley Handlooms |
| Putli Devi | putli.devi@karigar.in | Karigar@123 | Jharkhand | Sohrai Painting | Hazaribagh Indigenous Arts |
| Gopalan Acharya | gopalan.acharya@karigar.in | Karigar@123 | Karnataka | Mysore Rosewood Inlay | Mysore Royal Inlay Guild |
| Gopalan Asari | gopalan.asari@karigar.in | Karigar@123 | Kerala | Aranmula Metal Mirror | Aranmula Kannadi Kendra |
| Koli Chanderi | koli.chanderi@karigar.in | Karigar@123 | Madhya Pradesh | Chanderi Weaving | Chanderi Zari Brocade Looms |
| Dnyaneshwar Shinde | dnyaneshwar.shinde@karigar.in | Karigar@123 | Maharashtra | Paithani Silk Weaving | Paithan Royal Silk Looms |
| Ibemhal Devi | ibemhal.devi@karigar.in | Karigar@123 | Manipur | Kauna Reed Craft | Thoubal Kauna Art Craft |
| Banteilang Khongwir | banteilang.khongwir@karigar.in | Karigar@123 | Meghalaya | Khasi Cane Basketry | Sohra Mountain Bamboo Works |
| Lalduhawmi Sailo | lalduhawmi.sailo@karigar.in | Karigar@123 | Mizoram | Puan Weaving | Zarkawt Puan Weavers |
| Neiketu Angami | neiketu.angami@karigar.in | Karigar@123 | Nagaland | Naga Shawl Weaving | Khonoma Green Weavers |
| Rabindra Maharana | rabindra.maharana@karigar.in | Karigar@123 | Odisha | Odisha Pattachitra | Raghurajpur Heritage Pattachitra |
| Harpreet Kaur Dhillon | harpreet.kaur.dhillon@karigar.in | Karigar@123 | Punjab | Phulkari | Patiala Shahi Phulkari Atelier |
| Kailash Kripal Kumbhar | kailash.kripal.kumbhar@karigar.in | Karigar@123 | Rajasthan | Blue Pottery | Kripal Blue Pottery Kendra |
| Sonam Tashi Lepcha | sonam.tashi.lepcha@karigar.in | Karigar@123 | Sikkim | Thangka Painting | Enchey Sacred Thangka Studio |
| Karthik Subramanian | karthik.subramanian@karigar.in | Karigar@123 | Tamil Nadu | Kanchipuram Silk | Kanchi Kamakshi Silk Looms |
| Gajji Venkataswamy | gajji.venkataswamy@karigar.in | Karigar@123 | Telangana | Pochampally Ikat | Bhoodan Pochampally Looms |
| Bikash Debbarma | bikash.debbarma@karigar.in | Karigar@123 | Tripura | Bamboo Furniture | Agartala Bamboo Partition Guild |
| Nisar Ahmed Ansari | nisar.ahmed.ansari@karigar.in | Karigar@123 | Uttar Pradesh | Banarasi | Madanpura Royal Katan Looms |
| Meenakshi Khati | meenakshi.khati@karigar.in | Karigar@123 | Uttarakhand | Aipan Painting | Kumaon Aipan Heritage Studio |
| Anirban Pal | anirban.pal@karigar.in | Karigar@123 | West Bengal | Jamdani | Panchmura Terracotta Guild |
| Ramanathan Pillai | ramanathan.pillai@karigar.in | Karigar@123 | Andaman and Nicobar Islands | Padauk Wood Carving | Port Blair Padauk Workshop |
| Simranjeet Kaur Gill | simranjeet.kaur.gill@karigar.in | Karigar@123 | Chandigarh | Phulkari | City Beautiful Phulkari Studio |
| Rameshwar Varli | rameshwar.varli@karigar.in | Karigar@123 | Dadra and Nagar Haveli and Daman and Diu | Warli Painting | Silvassa Warli Heritage Centre |
| Mohammad Rashid Zari | mohammad.rashid.zari@karigar.in | Karigar@123 | Delhi | Zardozi Embroidery | Chandni Chowk Zari Kendra |
| Ghulam Hassan Mir | ghulam.hassan.mir@karigar.in | Karigar@123 | Jammu and Kashmir | Pashmina Weaving | Zoonimar Pashmina Guild |
| Tsering Angchuk | tsering.angchuk@karigar.in | Karigar@123 | Ladakh | Pashmina Raw Wool Spinning | Changthang Nomad Pashmina Guild |
| Koya Cheriyakoya | koya.cheriyakoya@karigar.in | Karigar@123 | Lakshadweep | Coir Fibre Cordage | Kavaratti Golden Coir Mills |
| Jean-Luc Sandou | jeanluc.sandou@karigar.in | Karigar@123 | Puducherry | Handmade Paper Craft | Auroville Paper Workshop |
| Lakshmi Prasanna | lakshmi.prasanna@karigar.in | Karigar@123 | Andhra Pradesh | Kondapalli Toys | Kondapalli Toy Haven |
| Venkateswara Rao | venkateswara.rao@karigar.in | Karigar@123 | Andhra Pradesh | Dharmavaram Silk | Dharmavaram Royal Looms |
| Padmavathi Devi | padmavathi.devi@karigar.in | Karigar@123 | Andhra Pradesh | Uppada Jamdani | Uppada Silk Heritage |

## Changed files

- `.gitignore`
- `MARKETPLACE_INTEGRATION.md`
- `ai-service/README.md`
- `ai-service/app/services/evidence_scoring_service.py`
- `ai-service/app/services/trust_score_service.py`
- `ai-service/tests/test_craft.py`
- `ai-service/tests/test_hands.py`
- `ai-service/tests/test_phone_scoring.py`
- `ai-service/tests/test_product_video.py`
- `ai-service/tests/test_trust_score.py`
- `package.json`
- `prisma/marketplaceSeed.js`
- `prisma/migrations/20260913010000_add_reviews/migration.sql`
- `prisma/schema.prisma`
- `prisma/seed.js`
- `scripts/validate_marketplace.mjs`
- `server/authHandler.js`
- `server/marketplaceHandler.js`
- `server/marketplaceHandler.test.js`
- `server/orderHandler.js`
- `src/components/ArtisanDirectoryProvider.jsx`
- `src/components/CraftCard.jsx`
- `src/components/OrderDetailsModal.jsx`
- `src/components/ProductGallery.jsx`
- `src/components/ProductReviews.jsx`
- `src/components/SellerProfileDropdown.jsx`
- `src/components/SellerSidebar.jsx`
- `src/context/BuyerContext.jsx`
- `src/context/SellerContext.jsx`
- `src/data/demoImages.js`
- `src/data/sellerImages.js`
- `src/hooks/useSellerActivity.js`
- `src/pages/buyer/Browse.jsx`
- `src/pages/buyer/Cart.jsx`
- `src/pages/buyer/Checkout.jsx`
- `src/pages/buyer/Home.jsx`
- `src/pages/buyer/Orders.jsx`
- `src/pages/buyer/ProductDetail.jsx`
- `src/pages/buyer/Saved.jsx`
- `src/pages/buyer/StateExplore.jsx`
- `src/pages/seller/Customers.jsx`
- `src/pages/seller/Dashboard.jsx`
- `src/pages/seller/Orders.jsx`
- `src/pages/seller/Profile.jsx`
- `src/pages/seller/Settings.jsx`
- `src/pages/seller/Verification.jsx`
- `src/utils/catalog.js`
- `src/utils/marketplaceRender.test.js`
- `src/utils/portrait.test.js`

The two customer portrait files were supplied by the user and were not generated or renamed.
