# توثيق صفحات التطبيق والـ APIs المستخدمة

## جدول المحتويات
1. [صفحات المصادقة (Auth)](#1-صفحات-المصادقة-auth)
2. [الصفحة الرئيسية (Home)](#2-الصفحة-الرئيسية-home)
3. [صفحة المتجر (Shop)](#3-صفحة-المتجر-shop)
4. [صفحة المنتج (Product)](#4-صفحة-المنتج-product)
5. [صفحة البحث (Search)](#5-صفحة-البحث-search)
6. [صفحة السلة (Cart)](#6-صفحة-السلة-cart)
7. [صفحة الطلبات (Orders)](#7-صفحة-الطلبات-orders)
8. [صفحة الطرود (Parcel)](#8-صفحة-الطرود-parcel)
9. [صفحة الملف الشخصي (Profile)](#9-صفحة-الملف-الشخصي-profile)
10. [صفحة الإعدادات (Settings)](#10-صفحة-الإعدادات-settings)
11. [صفحة الإشعارات (Notifications)](#11-صفحة-الإشعارات-notifications)
12. [صفحة المفضلة (Favorites)](#12-صفحة-المفضلة-favorites)
13. [صفحة الخريطة (Map)](#13-صفحة-الخريطة-map)
14. [صفحات أخرى](#14-صفحات-أخرى)

---

## 1. صفحات المصادقة (Auth)

### 1.1 صفحة تسجيل الدخول (Login Page)
**المسار:** `lib/presentation/pages/auth/login/login_page.dart`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/auth/login` | POST | تسجيل الدخول بالإيميل وكلمة المرور | `LoginResponse` - يحتوي على: `token`, `user` (بيانات المستخدم) |
| 2 | `/api/v1/auth/google/callback` | POST | تسجيل الدخول عبر Google | `LoginResponse` - يحتوي على: `token`, `user` |

---

### 1.2 صفحة التسجيل (Register Page)
**المسار:** `lib/presentation/pages/auth/register/register_page.dart`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/auth/register` | POST | إرسال OTP للتسجيل | `RegisterResponse` - يحتوي على: `verifyId`, `message` |
| 2 | `/api/v1/auth/after-verify` | POST | إكمال التسجيل بعد التحقق | `VerifyData` - يحتوي على: `token`, `user` |
| 3 | `/api/v1/auth/verify/phone` | POST | التسجيل برقم الهاتف | `VerifyData` - يحتوي على: `token`, `user` |

---

### 1.3 صفحة تأكيد التسجيل (Confirmation Page)
**المسار:** `lib/presentation/pages/auth/confirmation/register_confirmation_page.dart`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/auth/verify/{verifyCode}` | GET | التحقق من الإيميل | `VerifyPhoneResponse` - يحتوي على: `status`, `message` |
| 2 | `/api/v1/auth/verify/phone` | POST | التحقق من رقم الهاتف | `VerifyPhoneResponse` - يحتوي على: `status`, `message` |

---

### 1.4 صفحة استعادة كلمة المرور (Reset Password Page)
**المسار:** `lib/presentation/pages/auth/reset/reset_password_page.dart`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/auth/forgot/email-password` | POST | استعادة بالإيميل | `RegisterResponse` - يحتوي على: `verifyId`, `message` |
| 2 | `/api/v1/auth/forgot/password` | POST | استعادة برقم الهاتف | `RegisterResponse` - يحتوي على: `verifyId`, `message` |
| 3 | `/api/v1/auth/forgot/email-password/{verifyCode}` | POST | تأكيد كود الاستعادة | `VerifyData` - يحتوي على: `token` |
| 4 | `/api/v1/auth/forgot/password/confirm` | POST | تأكيد بالهاتف | `VerifyData` - يحتوي على: `token` |

---

## 2. الصفحة الرئيسية (Home)

### 2.1 الصفحة الرئيسية (Home Page)
**المسار:** `lib/presentation/pages/home/home_page.dart`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/rest/categories/paginate` | GET | جلب التصنيفات | `CategoriesPaginateResponse` - قائمة `CategoryData`: `id`, `uuid`, `translation` (title, description), `img`, `children` |
| 2 | `/api/v1/rest/shops/paginate` | GET | جلب المتاجر | `ShopsPaginateResponse` - قائمة `ShopData`: `id`, `uuid`, `translation`, `logo_img`, `background_img`, `location`, `open`, `delivery_time`, `rating` |
| 3 | `/api/v1/rest/shops/recommended` | GET | المتاجر الموصى بها | `ShopsPaginateResponse` - قائمة `ShopData` |
| 4 | `/api/v1/rest/shops/families/paginate` | GET | الأسر المنتجة | `ShopsPaginateResponse` - قائمة `ShopData` |
| 5 | `/api/v1/rest/shops/ruwad/paginate` | GET | متاجر رواد | `ShopsPaginateResponse` - قائمة `ShopData` |
| 6 | `/api/v1/rest/banners/paginate` | GET | جلب البانرات | `BannersPaginateResponse` - قائمة `BannerData`: `id`, `img`, `url`, `products`, `shops` |
| 7 | `/api/v1/rest/banners-ads` | GET | جلب الإعلانات | `BannersPaginateResponse` - قائمة `BannerData` |
| 8 | `/api/v1/rest/stories/paginate` | GET | جلب القصص | قائمة `StoryModel`: `id`, `product_id`, `shop_id`, `file_urls` |
| 9 | `/api/v1/rest/products-avg-prices` | GET | متوسط الأسعار | `PriceModel`: `min`, `max`, `avg` |

---

## 3. صفحة المتجر (Shop)

### 3.1 صفحة تفاصيل المتجر (Shop Detail Page)
**المسار:** `lib/presentation/pages/shop/shop_page.dart`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/rest/shops/{uuid}` | GET | تفاصيل المتجر | `SingleShopResponse` - `ShopData`: `id`, `uuid`, `translation`, `logo_img`, `background_img`, `location`, `phone`, `open`, `delivery_time`, `rating`, `shop_working_days`, `shop_closed_date` |
| 2 | `/api/v1/rest/branches` | GET | فروع المتجر | `BranchResponse` - قائمة `BranchData`: `id`, `address`, `location` |
| 3 | `/api/v1/rest/shops/{shopId}/products` | GET | منتجات المتجر | `AllProductsResponse` - يحتوي على: `all` (قائمة الفئات مع منتجاتها), `recommended` |
| 4 | `/api/v1/rest/shops/{shopId}/categories` | GET | تصنيفات المتجر | `CategoriesPaginateResponse` - قائمة `CategoryData` |
| 5 | `/api/v1/rest/shops/{shopId}/products/paginate` | GET | منتجات بالتصنيف | `ProductsPaginateResponse` - قائمة `ProductData` |
| 6 | `/api/v1/rest/shops/{shopId}/products/recommended/paginate` | GET | المنتجات الشائعة | `ProductsPaginateResponse` - قائمة `ProductData` |
| 7 | `/api/v1/rest/cart/open` | POST | الانضمام لطلب جماعي | `uuid` للسلة المشتركة |
| 8 | `/api/v1/rest/brands/paginate` | GET | الماركات | `BrandsPaginateResponse` - قائمة `BrandData` |

---

## 4. صفحة المنتج (Product)

### 4.1 صفحة تفاصيل المنتج (Product Page)
**المسار:** `lib/presentation/pages/product/product_page.dart`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/rest/products/{uuid}` | GET | تفاصيل المنتج | `SingleProductResponse` - `ProductData`: `id`, `uuid`, `translation` (title, description), `img`, `stocks` (قائمة المخزون مع السعر والكمية), `galleries`, `min_qty`, `max_qty`, `reviews` |
| 2 | `/api/v1/rest/products/paginate` | GET | منتجات مشابهة | `ProductsPaginateResponse` - قائمة `ProductData` |
| 3 | `/api/v1/rest/products/review/{productUuid}` | POST | إضافة تقييم | `void` |
| 4 | `/api/v1/dashboard/user/cart` | POST | إضافة للسلة | `CartModel` - بيانات السلة المحدثة |
| 5 | `/api/v1/dashboard/user/cart/insert-product` | POST | إضافة منتج للسلة | `CartModel` |

---

## 5. صفحة البحث (Search)

### 5.1 صفحة البحث (Search Page)
**المسار:** `lib/presentation/pages/search/search_page.dart`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/rest/shops/search` | GET | البحث في المتاجر | `ShopsPaginateResponse` - قائمة `ShopData` المطابقة |
| 2 | `/api/v1/rest/products/paginate` | GET | البحث في المنتجات | `ProductsPaginateResponse` - قائمة `ProductData`: `id`, `uuid`, `translation`, `img`, `stocks` |
| 3 | `/api/v1/rest/categories/search` | GET | البحث في التصنيفات | `CategoriesPaginateResponse` - قائمة `CategoryData` |

---

## 6. صفحة السلة (Cart)

### 6.1 صفحة السلة (Cart Page)
**المسار:** `lib/presentation/pages/shop/cart/cart_page.dart`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/dashboard/user/cart` | GET | جلب السلة | `CartModel` - يحتوي على: `id`, `shop_id`, `total_price`, `user_carts` (قائمة تحتوي على `cart_details` - تفاصيل المنتجات) |
| 2 | `/api/v1/dashboard/user/cart/open` | POST | إنشاء سلة جديدة | `CartModel` |
| 3 | `/api/v1/dashboard/user/cart/insert-product` | POST | إضافة/تحديث منتج | `CartModel` |
| 4 | `/api/v1/dashboard/user/cart/delete` | DELETE | حذف السلة | `void` |
| 5 | `/api/v1/dashboard/user/cart/product/delete` | DELETE | حذف منتج من السلة | `void` |
| 6 | `/api/v1/dashboard/user/cart/set-group/{cartId}` | POST | بدء طلب جماعي | `void` |
| 7 | `/api/v1/rest/cart/insert-product` | POST | إضافة منتج (جماعي) | `CartModel` |
| 8 | `/api/v1/rest/cart/{cartId}` | GET | جلب سلة جماعية | `CartModel` |
| 9 | `/api/v1/rest/cart/status/{userUuid}` | POST | تغيير حالة المستخدم | `void` |
| 10 | `/api/v1/dashboard/user/cart/member/delete` | DELETE | حذف عضو من الجماعي | `void` |

---

## 7. صفحة الطلبات (Orders)

### 7.1 صفحة قائمة الطلبات (Orders List Page)
**المسار:** `lib/presentation/pages/order/orders_page.dart`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/dashboard/user/orders/paginate` | GET | الطلبات النشطة | `OrderPaginateResponse` - قائمة `OrderActiveModel`: `id`, `status`, `total_price`, `delivery_fee`, `created_at`, `shop`, `details` (المنتجات) |
| 2 | `/api/v1/dashboard/user/orders/paginate?status=completed` | GET | الطلبات المكتملة | `OrderPaginateResponse` |
| 3 | `/api/v1/dashboard/user/order-refunds/paginate` | GET | طلبات الاسترجاع | `RefundOrdersModel` - قائمة طلبات الاسترجاع |

---

### 7.2 صفحة تفاصيل الطلب (Order Detail Page)
**المسار:** `lib/presentation/pages/order/order_screen/order_screen.dart`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/dashboard/user/orders/{orderId}` | GET | تفاصيل الطلب | `OrderActiveModel`: `id`, `status`, `total_price`, `delivery_fee`, `tax`, `service_fee`, `coupon`, `delivery_man` (بيانات السائق), `shop`, `location`, `details`, `transaction` |
| 2 | `/api/v1/rest/orders/deliveryman/{deliveryId}` | GET | موقع السائق | `LocalLocation`: `latitude`, `longitude` |
| 3 | `/api/v1/dashboard/user/orders/{orderId}/status/change?status=canceled` | POST | إلغاء الطلب | `void` |
| 4 | `/api/v1/dashboard/user/orders/review/{orderId}` | POST | تقييم الطلب | `void` |
| 5 | `/api/v1/dashboard/user/order-refunds` | POST | طلب استرجاع | `void` |
| 6 | `/api/v1/dashboard/user/orders/{orderId}/repeat` | POST | طلب تلقائي | `void` |
| 7 | `/api/v1/dashboard/user/orders/{orderId}/delete-repeat` | DELETE | حذف الطلب التلقائي | `void` |

---

### 7.3 صفحة مراجعة الطلب (Order Check Page)
**المسار:** `lib/presentation/pages/order/order_check/order_check.dart`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/dashboard/user/cart/calculate/{cartId}` | POST | حساب الطلب | `GetCalculateModel`: `total_price`, `delivery_fee`, `tax`, `service_fee`, `discount`, `coupon_price` |
| 2 | `/api/v1/rest/coupons/check` | POST | التحقق من كوبون | `CouponResponse`: `name`, `type`, `price`, `valid` |
| 3 | `/api/v1/rest/cashback/check` | POST | التحقق من كاش باك | `CashbackResponse`: `price`, `percent` |
| 4 | `/api/v1/rest/payments` | GET | طرق الدفع | `PaymentsResponse` - قائمة `PaymentData`: `id`, `tag`, `input` |
| 5 | `/api/v1/dashboard/user/orders` | POST | إنشاء طلب | `OrderActiveModel` - بيانات الطلب الجديد |
| 6 | `/api/v1/payments/order/{orderId}/transactions` | POST | إنشاء معاملة دفع | `TransactionsResponse` |
| 7 | `/api/v1/dashboard/user/order-{paymentName}-process` | GET | معالجة الدفع | `payment_url` لبوابة الدفع |
| 8 | `/api/v1/rest/shop/{shopId}/delivery-zone/check/distance` | GET | التحقق من منطقة التوصيل | `status`: true/false |

---

## 8. صفحة الطرود (Parcel)

### 8.1 صفحة إنشاء طرد (Parcel Order Page)
**المسار:** `lib/presentation/pages/parcel/parcel_order_page.dart`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/rest/parcel-order/types` | GET | أنواع الطرود | `ParcelTypeResponse` - قائمة `ParcelTypeData`: `id`, `type`, `img`, `price` |
| 2 | `/api/v1/rest/parcel-order/calculate-price` | GET | حساب سعر الطرد | `ParcelCalculateResponse`: `price`, `distance`, `duration` |
| 3 | `/api/v1/dashboard/user/parcel-orders` | POST | إنشاء طلب طرد | `parcel_id` |
| 4 | `/api/v1/payments/parcel-order/{orderId}/transactions` | POST | معاملة دفع الطرد | `TransactionsResponse` |

---

### 8.2 صفحة قائمة الطرود (Parcel List Page)
**المسار:** `lib/presentation/pages/parcel/parcel_list_page.dart`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/dashboard/user/parcel-orders` | GET | الطرود النشطة | `ParcelPaginateResponse` - قائمة `ParcelOrder`: `id`, `status`, `total_price`, `address_from`, `address_to`, `delivery_man` |
| 2 | `/api/v1/dashboard/user/parcel-orders/{orderId}` | GET | تفاصيل الطرد | `ParcelOrder`: كل التفاصيل |
| 3 | `/api/v1/dashboard/user/parcel-orders/deliveryman-review/{orderId}` | POST | تقييم السائق | `void` |

---

## 9. صفحة الملف الشخصي (Profile)

### 9.1 صفحة الملف الشخصي (Profile Page)
**المسار:** `lib/presentation/pages/profile/profile_page.dart`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/dashboard/user/profile/show` | GET | بيانات المستخدم | `ProfileResponse` - `ProfileData`: `id`, `uuid`, `firstname`, `lastname`, `email`, `phone`, `img`, `wallet`, `addresses`, `maksab_pin` |
| 2 | `/api/v1/rest/referral` | GET | بيانات الإحالة | `ReferralModel`: `referral_code`, `referral_count`, `referral_earnings` |
| 3 | `/api/v1/auth/logout` | POST | تسجيل الخروج | `void` |

---

### 9.2 صفحة تعديل الملف الشخصي (Edit Profile Page)
**المسار:** `lib/presentation/pages/profile/edit_profile_page.dart`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/dashboard/user/profile/update` | PUT | تحديث البيانات | `ProfileResponse` - البيانات المحدثة |
| 2 | `/api/v1/dashboard/user/profile/password/update` | POST | تحديث كلمة المرور | `ProfileResponse` |
| 3 | `/api/v1/dashboard/galleries` | POST | رفع صورة | `GalleryUploadResponse`: `title` (رابط الصورة) |
| 4 | `/api/v1/dashboard/user/profile/delete` | DELETE | حذف الحساب | `void` |

---

### 9.3 صفحة العناوين (Address List Page)
**المسار:** `lib/presentation/pages/profile/address_list.dart`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/dashboard/user/addresses` | GET | جلب العناوين | `AddressesResponse` - قائمة `AddressNewModel`: `id`, `title`, `address`, `location`, `active` |
| 2 | `/api/v1/dashboard/user/addresses` | POST | إضافة عنوان | `SingleAddressResponse` |
| 3 | `/api/v1/dashboard/user/addresses/{addressId}` | PUT | تعديل عنوان | `void` |
| 4 | `/api/v1/dashboard/user/addresses/{addressId}` | DELETE | حذف عنوان | `void` |
| 5 | `/api/v1/dashboard/user/address/set-active/{id}` | POST | تفعيل عنوان | `void` |

---

### 9.4 صفحة المحفظة (Wallet History Page)
**المسار:** `lib/presentation/pages/profile/wallet_history.dart`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/dashboard/user/wallet/histories` | GET | سجل المحفظة | `WalletHistoriesResponse` - قائمة `WalletData`: `id`, `uuid`, `type`, `price`, `note`, `created_at` |

---

### 9.5 صفحة أن تصبح بائع (Create Shop Page)
**المسار:** `lib/presentation/pages/profile/become_seller/create_shop.dart`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/dashboard/user/shops` | POST | إنشاء متجر | `void` |
| 2 | `/api/v1/dashboard/galleries` | POST | رفع الشعار | `GalleryUploadResponse` |
| 3 | `/api/v1/dashboard/galleries/store-many` | POST | رفع عدة صور | `MultiGalleryUploadResponse`: `titles` |

---

## 10. صفحة الإعدادات (Settings)

### 10.1 صفحة الإعدادات (Setting Page)
**المسار:** `lib/presentation/pages/setting/setting_page.dart`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/dashboard/user/notifications` | GET | إعدادات الإشعارات | `NotificationsListModel` - قائمة أنواع الإشعارات وحالتها |
| 2 | `/api/v1/dashboard/user/update/notifications` | POST | تحديث الإشعارات | `void` |

---

### 10.2 صفحة اللغة (Language Page)
**المسار:** `lib/presentation/pages/profile/language_page.dart`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/rest/languages/active` | GET | اللغات المتاحة | `LanguagesResponse` - قائمة `LanguageData`: `id`, `locale`, `title`, `img`, `is_default` |
| 2 | `/api/v1/rest/translations/paginate` | GET | الترجمات | `MobileTranslationsResponse` - قاموس الترجمات |

---

### 10.3 صفحة العملة (Currency Page)
**المسار:** `lib/presentation/pages/profile/currency_page.dart`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/rest/currencies/active` | GET | العملات المتاحة | `CurrenciesResponse` - قائمة `CurrencyData`: `id`, `title`, `symbol`, `rate`, `is_default` |

---

### 10.4 صفحة المساعدة (Help Page)
**المسار:** `lib/presentation/pages/profile/help_page.dart`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/rest/faqs/paginate` | GET | الأسئلة الشائعة | `HelpModel` - قائمة `FaqData`: `id`, `uuid`, `question`, `answer` |

---

### 10.5 صفحة السياسة والشروط
**المسار:** `lib/presentation/pages/policy_term/`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/rest/term` | GET | الشروط والأحكام | `Translation`: `title`, `description` |
| 2 | `/api/v1/rest/policy` | GET | سياسة الخصوصية | `Translation`: `title`, `description` |

---

## 11. صفحة الإشعارات (Notifications)

### 11.1 صفحة الإشعارات (Notification Page)
**المسار:** `lib/presentation/pages/profile/notification_page.dart`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/dashboard/notifications` | GET | جلب الإشعارات | `NotificationResponse` - قائمة `NotificationData`: `id`, `type`, `title`, `body`, `data`, `read_at`, `created_at` |
| 2 | `/api/v1/dashboard/notifications/read-all` | POST | قراءة الكل | `NotificationResponse` |
| 3 | `/api/v1/dashboard/notifications/{id}/read-at` | POST | قراءة إشعار | `void` |
| 4 | `/api/v1/dashboard/user/profile/notifications-statistic` | GET | إحصائيات | `CountNotificationModel`: `notification_count`, `new_order_count` |
| 5 | `/api/v1/dashboard/user/profile/firebase/token/update` | POST | تحديث FCM Token | `void` |

---

## 12. صفحة المفضلة (Favorites)

### 12.1 صفحة المفضلة (Like Page)
**المسار:** `lib/presentation/pages/like/like_page.dart`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/rest/shops` | GET | جلب المتاجر المفضلة | `ShopsPaginateResponse` - يتم إرسال IDs المتاجر المحفوظة محلياً |
| 2 | `/api/v1/rest/products/ids` | GET | جلب المنتجات المفضلة | `ProductsPaginateResponse` - يتم إرسال IDs المنتجات المحفوظة محلياً |

---

## 13. صفحة الخريطة (Map)

### 13.1 صفحة الخريطة (View Map Page)
**المسار:** `lib/presentation/pages/view_map/view_map_page.dart`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/v2/directions/driving-car` (OpenRouteService) | GET | جلب المسار | `DrawRouting` - `features` تحتوي على إحداثيات المسار و`properties` (duration, distance) |
| 2 | `/api/v1/rest/shops/nearby` | GET | المتاجر القريبة | `ShopsPaginateResponse` - قائمة المتاجر حسب الموقع |

---

## 14. صفحات أخرى

### 14.1 صفحة Splash
**المسار:** `lib/presentation/pages/initial/splash/splash_page.dart`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/rest/settings` | GET | الإعدادات العامة | `GlobalSettingsResponse` - إعدادات التطبيق: `title`, `min_version`, `currency`, إلخ |
| 2 | `/api/v1/rest/languages/active` | GET | اللغات | `LanguagesResponse` |
| 3 | `/api/v1/rest/translations/paginate` | GET | الترجمات | `MobileTranslationsResponse` |

---

### 14.2 صفحة التحقق من الهاتف للطلب
**المسار:** `lib/presentation/pages/profile/phone_verify.dart`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/dashboard/user/profile/verify-phone` | POST | إرسال OTP | `RegisterResponse`: `verifyId` |
| 2 | `/api/v1/dashboard/user/profile/verify-otp-phone` | POST | التحقق من OTP | `VerifyPhoneResponse` |

---

### 14.3 صفحة البانر (Banner Products Page)
**المسار:** `lib/presentation/pages/home/widgets/shops_banner_page.dart`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/rest/banners/{bannerId}` | GET | تفاصيل البانر | `BannerData`: `id`, `img`, `products`, `shops` |
| 2 | `/api/v1/rest/banners-ads/{bannerId}` | GET | تفاصيل الإعلان | `BannerData` |
| 3 | `/api/v1/rest/banners/{bannerId}/liked` | POST | إعجاب بالبانر | `void` |

---

### 14.4 صفحة الفلتر (Filter Page)
**المسار:** `lib/presentation/pages/home/filter/filter_page.dart`

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/rest/shops-takes` | GET | تصنيفات الفلتر | `TagResponse` - قائمة `TagData` |
| 2 | `/api/v1/rest/shops/paginate` | GET | المتاجر المفلترة | `ShopsPaginateResponse` - مع معاملات الفلتر (price, rating, freeDelivery, etc.) |

---

### 14.5 صفحة المدونات (Blogs)
**المسار:** غير موجودة كصفحة مستقلة

| # | API Endpoint | HTTP Method | الوصف | البيانات المرجعة |
|---|--------------|-------------|-------|------------------|
| 1 | `/api/v1/rest/blogs/paginate` | GET | المقالات | `BlogsPaginateResponse` - قائمة `BlogData`: `id`, `uuid`, `translation`, `img`, `created_at` |
| 2 | `/api/v1/rest/blogs/{uuid}` | GET | تفاصيل المقال | `BlogDetailsResponse`: `id`, `uuid`, `translation` (title, description, short_desc) |

---

## ملخص إحصائي

| القسم | عدد الصفحات | عدد الـ APIs |
|-------|-------------|--------------|
| المصادقة (Auth) | 4 | 10 |
| الرئيسية (Home) | 1 | 9 |
| المتجر (Shop) | 1 | 8 |
| المنتج (Product) | 1 | 5 |
| البحث (Search) | 1 | 3 |
| السلة (Cart) | 1 | 10 |
| الطلبات (Orders) | 3 | 15 |
| الطرود (Parcel) | 2 | 6 |
| الملف الشخصي (Profile) | 5 | 12 |
| الإعدادات (Settings) | 4 | 6 |
| الإشعارات (Notifications) | 1 | 5 |
| المفضلة (Favorites) | 1 | 2 |
| الخريطة (Map) | 1 | 2 |
| أخرى | 4 | 9 |
| **المجموع** | **~30** | **~102** |

---

## ملاحظات مهمة

1. **جميع الـ APIs تبدأ بـ:** `https://[BASE_URL]`
2. **الـ APIs المحمية** تتطلب `Authorization: Bearer {token}` في الـ Header
3. **معظم الـ APIs تدعم:**
   - `lang`: لتحديد اللغة
   - `currency_id`: لتحديد العملة
   - `page` و `perPage`: للترقيم
4. **الاستجابة العامة:**
   ```json
   {
     "status": true,
     "message": "Success",
     "data": { ... }
   }
   ```

