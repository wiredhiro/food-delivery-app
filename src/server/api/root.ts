import { router } from './trpc';
import { exampleRouter } from './routers/example';
import { productsRouter } from './routers/products';
import { authRouter } from './routers/auth';
import { ordersRouter } from './routers/orders';
import { adminRouter } from './routers/admin';
import { userRouter } from './routers/user';
import { reviewsRouter } from './routers/reviews';
import { favoritesRouter } from './routers/favorites';
import { paymentRouter } from './routers/payment';
import { deliveryRouter } from './routers/delivery';
import { categoriesRouter } from './routers/categories';
import { couponsRouter } from './routers/coupons';
import { notificationsRouter } from './routers/notifications';

// すべてのルーターを統合
export const appRouter = router({
  example: exampleRouter,
  products: productsRouter,
  auth: authRouter,
  orders: ordersRouter,
  admin: adminRouter,
  user: userRouter,
  reviews: reviewsRouter,
  favorites: favoritesRouter,
  payment: paymentRouter,
  delivery: deliveryRouter,
  categories: categoriesRouter,
  coupons: couponsRouter,
  notifications: notificationsRouter,
});

// エクスポート: クライアント側で型推論に使用
export type AppRouter = typeof appRouter;
