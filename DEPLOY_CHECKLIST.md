# Pado Story Production Deploy Checklist

## 1. Environment Variables

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY`
- [ ] `TOSS_PAYMENTS_SECRET_KEY`
- [ ] `NEXT_PUBLIC_SITE_URL`
- [ ] `NEXT_PUBLIC_KAKAO_CLIENT_ID`
- [ ] `DEV_ADMIN_LOGIN_ENABLED=false`
- [ ] `DEV_ADMIN_PASSWORD` is not exposed or reused from local testing

## 2. Supabase

- [ ] Production project URL and anon key are registered in Vercel
- [ ] Service role key is registered only as a server-side environment variable
- [ ] Auth redirect URL includes the final production URL
- [ ] Kakao auth provider is enabled
- [ ] Orders, order_items, payments, shipments, products, product_options, profiles tables are ready

## 3. Toss Payments

- [ ] Production client key is registered when switching from test mode
- [ ] Production secret key is registered only as a server-side environment variable
- [ ] Success URL: `${NEXT_PUBLIC_SITE_URL}/payments/toss/success`
- [ ] Fail URL: `${NEXT_PUBLIC_SITE_URL}/payments/toss/fail`
- [ ] Test payment flow is confirmed after deploy

## 4. Kakao Login

- [ ] Kakao REST API key is registered in Vercel
- [ ] Redirect URI includes `${NEXT_PUBLIC_SITE_URL}/auth/callback`
- [ ] Login button opens Kakao without duplicate requests
- [ ] Login redirects back to mypage/checkout when `next` is provided

## 5. Vercel

- [ ] Root Directory: `pado-store`
- [ ] Build Command: `pnpm run build`
- [ ] Output setting: default Next.js
- [ ] Install command uses pnpm
- [ ] Latest GitHub commit deploys successfully
- [ ] Preview deployment is checked before production promotion when possible

## 6. SEO And Public Assets

- [ ] Metadata title and description are set
- [ ] Open Graph default image/path is valid
- [ ] `/robots.txt` is reachable
- [ ] `/sitemap.xml` is reachable
- [ ] `/icon.svg` is reachable
- [ ] Product images render from `/public/images`

## 7. Production Smoke Test

- [ ] PC Chrome home/products/product detail
- [ ] iPhone Safari home/products/product detail/cart/checkout
- [ ] Android Chrome home/products/product detail/cart/checkout
- [ ] Kakao login
- [ ] Product option selection
- [ ] Cart quantity change/delete/undo
- [ ] Checkout validation
- [ ] Toss test payment
- [ ] MyPage order history
- [ ] Admin product management
- [ ] Admin order management
- [ ] Admin delivery management

## 8. External Checks Before Open

- [ ] Vercel production domain and SSL are active
- [ ] Supabase redirect URL uses the production domain
- [ ] Kakao redirect URI uses the production domain
- [ ] Toss success/fail URLs use the production domain
- [ ] `NEXT_PUBLIC_SITE_URL` is updated to the final production URL
- [ ] Real device check is completed on iPhone and Android
