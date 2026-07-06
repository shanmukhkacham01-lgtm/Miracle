import { NextResponse } from 'next/server';
import { verifyAuth } from '../../../../middleware/auth';
import * as controllers from '../../../../controllers/admin.controller';

async function handleController(
  controllerFn: Function,
  req: Request,
  routeParams: string[],
  method: string
) {
  try {
    const sessionUser = await verifyAuth(req);
    if (sessionUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden: Admins only.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query: any = {};
    searchParams.forEach((value, key) => {
      query[key] = value;
    });

    let body: any = {};
    if (method === 'POST' || method === 'PUT') {
      try {
        body = await req.json();
      } catch (e) {
        // empty or plain text body
      }
    }

    const params: any = {};
    if (routeParams.length > 1) {
      params.id = routeParams[1];
    }

    const mockReq: any = {
      body,
      query,
      params,
      user: sessionUser,
    };

    let statusCode = 200;
    let jsonResult: any = null;

    const mockRes: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        jsonResult = data;
        return this;
      },
      send(data: any) {
        jsonResult = data;
        return this;
      },
    };

    await new Promise<void>((resolve, reject) => {
      const next = (err?: any) => {
        if (err) reject(err);
        else resolve();
      };

      Promise.resolve(controllerFn(mockReq, mockRes, next))
        .then(() => resolve())
        .catch((err) => reject(err));
    });

    if (jsonResult !== null) {
      return NextResponse.json(jsonResult, { status: statusCode });
    }

    return NextResponse.json({ status: 'success' }, { status: statusCode });
  } catch (error: any) {
    console.error('[Admin Catch-All Route Error]:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Server error' },
      { status: error.statusCode || 500 }
    );
  }
}

async function handle(
  req: Request,
  { params }: { params: { route: string[] } }
) {
  const method = req.method;
  const routeParams = params.route;
  const segment = routeParams[0];

  let controllerFn: Function | null = null;

  if (segment === 'analytics' && method === 'GET') {
    controllerFn = controllers.getAnalytics;
  } else if (segment === 'products') {
    if (method === 'GET') controllerFn = controllers.getAdminProducts;
    else if (method === 'POST') controllerFn = controllers.createProduct;
    else if (method === 'PUT') controllerFn = controllers.updateProduct;
    else if (method === 'DELETE') controllerFn = controllers.deleteProduct;
  } else if (segment === 'categories') {
    if (method === 'GET') controllerFn = controllers.getAdminCategories;
    else if (method === 'POST') controllerFn = controllers.createCategory;
    else if (method === 'PUT') controllerFn = controllers.updateCategory;
    else if (method === 'DELETE') controllerFn = controllers.deleteCategory;
  } else if (segment === 'coupons') {
    if (method === 'GET') controllerFn = controllers.getCoupons;
    else if (method === 'POST') controllerFn = controllers.createCoupon;
    else if (method === 'PUT') controllerFn = controllers.updateCoupon;
    else if (method === 'DELETE') controllerFn = controllers.deleteCoupon;
  } else if (segment === 'orders') {
    if (method === 'GET') controllerFn = controllers.getAdminOrders;
    else if (method === 'PUT') controllerFn = controllers.updateOrderStatus;
  } else if (segment === 'users') {
    if (method === 'GET') controllerFn = controllers.getAdminUsers;
    else if (method === 'PUT') {
      if (routeParams.length > 2 && routeParams[2] === 'role') {
        controllerFn = controllers.updateUserRole;
      } else {
        controllerFn = controllers.updateAdminUser;
      }
    } else if (method === 'DELETE') controllerFn = controllers.deleteAdminUser;
  } else if (segment === 'addresses') {
    if (method === 'GET') controllerFn = controllers.getAdminAddresses;
    else if (method === 'POST') controllerFn = controllers.createAdminAddress;
    else if (method === 'PUT') controllerFn = controllers.updateAdminAddress;
    else if (method === 'DELETE') controllerFn = controllers.deleteAdminAddress;
  } else if (segment === 'brands') {
    if (method === 'GET') controllerFn = controllers.getAdminBrands;
    else if (method === 'POST') controllerFn = controllers.createBrand;
    else if (method === 'PUT') controllerFn = controllers.updateBrand;
    else if (method === 'DELETE') controllerFn = controllers.deleteBrand;
  } else if (segment === 'banners') {
    if (method === 'GET') controllerFn = controllers.getBanners;
    else if (method === 'POST') controllerFn = controllers.createBanner;
    else if (method === 'PUT') controllerFn = controllers.updateBanner;
    else if (method === 'DELETE') controllerFn = controllers.deleteBanner;
  }

  if (!controllerFn) {
    return NextResponse.json({ message: `Route not found: ${method} /api/admin/${routeParams.join('/')}` }, { status: 404 });
  }

  return handleController(controllerFn, req, routeParams, method);
}

export { handle as GET, handle as POST, handle as PUT, handle as DELETE };
