# Seller product actions

View previously had no callback. Edit and Delete were explicitly disabled for persisted rows, and no owner-specific CRUD routes existed.

## Routes
Authenticated ARTISAN ownership is required for GET, PATCH and DELETE /api/products/:id. Unknown or another artisan's product returns 404; unauthenticated requests return 401 and other roles return 403.

View fetches the actual ID and opens a seller modal using the shared ProductGallery, metadata and stored evidence breakdown. Back to My Products closes it. Edit saves the existing listing fields only. Media, primary selection, video provenance and evidence JSON are preserved byte-for-byte. Media replacement is deliberately not part of this text-edit action. Stored evidence is not rerun or presented as a new analysis.

Delete requires a titled confirmation with Cancel/Delete Product. It archives using Product.isActive=false, preserving OrderItem/Review references and files. The additive SQLite migration defaults all existing rows to active. No existing records were edited/deleted during testing. No updatedAt column existed, so none was added.

Seller list, public catalog/detail and artisan counts exclude archived listings. Order creation/payment confirmation only add an active-product availability guard, preventing old carts/pending payments from purchasing archived listings. Historical orders/reviews remain readable. No payment/order workflow redesign.

Successful edits/deletes emit the existing product-refresh event. Buyer queries read the same updated rows. Buyer product cards reuse CraftCard to display Evidence N / 100 or Not analyzed, without authenticity claims.

## Exact changed files
Frontend:
- src/pages/seller/Products.jsx
- src/components/ProductTable.jsx
- src/components/SellerProductAction.jsx (new)
- src/components/CraftCard.jsx
- src/utils/productApi.js
- src/utils/sellerProductsRender.test.js

Backend/database:
- server/authHandler.js (dispatch owner routes)
- server/productHandler.js (owner CRUD and active seller listing)
- server/marketplaceHandler.js (active catalog/count filtering)
- server/orderHandler.js (active-product availability guards only)
- prisma/schema.prisma (Product.isActive)
- prisma/migrations/20260913020000_product_archive/migration.sql (new)
- server/productHandler.test.js
- server/marketplaceHandler.test.js
- PRODUCT_ACTIONS.md (this report)

## Checks
Seven focused tests passed: backend publishing, seller serialization/filtering/API status, marketplace integration with owner view/edit/archive, and Products render/actions. Checks cover persisted values in seller/public queries, cross-owner denial, numeric/category validation, media/evidence preservation, archive exclusion, retained order/review rows, and pending-payment stock protection. Build passed. Focused lint reports no errors (one existing unused import warning). Live owner GET, seller route and Node health return 200. No full browser automation was run.

Migration commands for teammates (from repository root):
```
npx.cmd prisma migrate deploy
npx.cmd prisma generate
```

Frontend: http://127.0.0.1:5173/seller/products
Node: http://127.0.0.1:5000/api/health
FastAPI: http://127.0.0.1:8000/docs

Manual: login as artisan, View a row, Edit price/stock and save, verify the buyer catalog after refresh, then Delete a test listing with confirmation. Verify an existing order/review remains available. Deleted listings are archived, not physically removed.
