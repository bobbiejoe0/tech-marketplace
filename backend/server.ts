import express, { Request, Response, Application } from 'express';
import * as crypto from 'crypto';
import { storage } from './storage';
import cors from 'cors';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import axios, { AxiosResponse, AxiosError } from 'axios';
import { AxiosRequestConfig } from 'axios';
import { reviewPool } from './reviews';

// Import types from schema.ts
import { InsertOrder, InsertProduct, User, Product, Order, CartItem, NOWPaymentsResponse, Review } from './types/schema';

const app: Application = express();

// Use the exported storage instance directly
app.use(cors());
app.use(bodyParser.json());

// Default route to confirm server is running
app.get('/', (req: Request, res: Response) => {
  res.send('E-commerce API is running!');
});

// Interfaces for type safety
interface MemStorage {
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: Partial<User>): Promise<User>;
  loginUser(email: string, password: string): Promise<User | null>;
  getAllCategories(): Promise<any[]>;
  getAllProducts(): Promise<Product[]>;
  getProductsByCategory(id: number): Promise<Product[]>;
  searchProducts(q: string): Promise<Product[]>;
  getCartItems(userId: number): Promise<CartItem[]>;
  addToCart(item: { userId: number; productId: number; quantity?: number }): Promise<CartItem>;
  removeFromCart(userId: number, productId: number): Promise<void>;
  checkoutCart(userId: number): Promise<Order>;
  getOrderById(id: number): Promise<Order | null>;
  updateOrder(order: Order): Promise<void>;
  clearCart(userId: number): Promise<void>;
  getUser(userId: number): Promise<User | null>;
  getProductById(productId: number): Promise<Product | null>;
  addOrderItem(item: { orderId: number; productId: number; quantity: number }): Promise<void>;
  createOrder(order: InsertOrder): Promise<Order>;
  getUserOrders(userId: number): Promise<Order[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  removeProduct(id: number): Promise<void>;
  createReview(review: { productId: number; userId: number; username: string; text: string; rating: number }): Promise<Review>;
  getReviewsByProduct(productId: number): Promise<Review[]>;
  developers?: any[];
}

// Helper function to hash password
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Configure Nodemailer transporter (kept for potential future use)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  logger: true,
  debug: true,
});

// NOWPayments configuration with validation
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || '24KGXSK-H004Z1G-K7M22EZ-32RNGBV';
if (!process.env.NOWPAYMENTS_API_KEY) {
  console.warn('WARNING: NOWPAYMENTS_API_KEY not set in environment variables. Using default (insecure) key.');
}
const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1/payment';
const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || 'KpYm2+2kyy6ffMJyCA3Q3gGPNL2MuD2g';
if (!process.env.NOWPAYMENTS_IPN_SECRET) {
  console.warn('WARNING: NOWPAYMENTS_IPN_SECRET not set in environment variables. IPN validation may fail.');
}

const getValidVercelUrl = (): string => {
  const baseUrl = process.env.VERCEL_URL || 'ecommerce-website-2222-88wpsl64f.vercel.app';
  const url = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
  const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  return `${cleanUrl}/api/payment-callback`;
};

// Custom Axios config without retry
const axiosConfig: AxiosRequestConfig = {
  headers: { 'x-api-key': NOWPAYMENTS_API_KEY },
  timeout: 10000,
  maxRedirects: 2,
};

// Routes
app.post('/api/create-user', async (req: Request, res: Response) => {
  try {
    const { username, email, password, firstName, lastName } = req.body as {
      username: string;
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
    };
    if (!username || !email || !password) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ error: 'Email already exists' });
      return;
    }
    const user = await storage.createUser({
      username,
      email,
      password: hashPassword(password),
      firstName: firstName ?? null,
      lastName: lastName ?? null,
    });
    res.status(201).json({ id: user.id, username: user.username });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) {
      res.status(400).json({ error: 'Missing email or password' });
      return;
    }
    const user = await storage.loginUser(email, hashPassword(password));
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    res.json({ id: user.id, username: user.username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/categories', async (req: Request, res: Response) => {
  try {
    const categories = await storage.getAllCategories();
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const products = await storage.getAllProducts();
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/products/category/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const products = await storage.getProductsByCategory(id);
    res.json(products);
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/search', async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    const products = await storage.searchProducts(q);
    res.json(products);
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/cart/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const cartItems = await storage.getCartItems(userId);
    res.json(cartItems);
  } catch (error) {
    console.error('Get cart items error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/add-to-cart', async (req: Request, res: Response) => {
  try {
    const { userId, productId, quantity } = req.body as { userId: number; productId: number; quantity?: number };
    const cartItem = await storage.addToCart({
      userId,
      productId,
      quantity: quantity ?? 1,
    });
    res.status(201).json({ message: 'Item added to cart', cartItem });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.delete('/api/cart/:userId/:productId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const productId = parseInt(req.params.productId);
    await storage.removeFromCart(userId, productId);
    res.status(200).json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/create-order', async (req: Request, res: Response) => {
  try {
    const { userId, productId, cartItems } = req.body as { userId: number; productId?: number; cartItems?: CartItem[] };
    if (!userId) {
      res.status(400).json({ error: 'Missing userId' });
      return;
    }
    const user = await storage.getUser(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    let order;
    if (productId) {
      const product = await storage.getProductById(productId);
      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      order = await storage.createOrder({
        userId,
        totalAmount: product.price.toString(),
        status: 'not paid',
        paymentMethod: 'crypto',
      });
      await storage.addOrderItem({ orderId: order.id, productId, quantity: 1 });
    } else if (cartItems && cartItems.length > 0) {
      const productPromises = cartItems.map(async (item) => {
        const product = await storage.getProductById(item.productId);
        return product ? parseFloat(product.price) * item.quantity : 0;
      });
      const amounts = await Promise.all(productPromises);
      const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0).toString();
      order = await storage.createOrder({
        userId,
        totalAmount,
        status: 'not paid',
        paymentMethod: 'crypto',
      });
      for (const item of cartItems) {
        await storage.addOrderItem({ orderId: order.id, productId: item.productId, quantity: item.quantity });
      }
      await storage.clearCart(userId);
    } else {
      const cartItems = await storage.getCartItems(userId);
      if (cartItems.length === 0) {
        res.status(400).json({ error: 'Cart is empty' });
        return;
      }
      const productPromises = cartItems.map(async (item) => {
        const product = await storage.getProductById(item.productId);
        return product ? parseFloat(product.price) * item.quantity : 0;
      });
      const amounts = await Promise.all(productPromises);
      const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0).toString();
      order = await storage.createOrder({
        userId,
        totalAmount,
        status: 'not paid',
        paymentMethod: 'crypto',
      });
      for (const item of cartItems) {
        await storage.addOrderItem({ orderId: order.id, productId: item.productId, quantity: item.quantity });
      }
      await storage.clearCart(userId);
    }
    console.log(`Order ${order.id} created for user ${userId}`);
    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/order-status/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const order = await storage.getOrderById(id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json({ status: order.status });
  } catch (error) {
    console.error('Get order status error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/log-developer', async (req: Request, res: Response) => {
  try {
    const { userId, isDeveloper, githubEmail, developerEmail } = req.body as {
      userId: number;
      isDeveloper: string;
      githubEmail?: string;
      developerEmail?: string;
    };
    console.log(`Developer info logged: User ID ${userId}, isDeveloper: ${isDeveloper}`);
    res.status(201).json({ message: 'Developer info logged' });
  } catch (error) {
    console.error('Log developer error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/create-payment', async (req: Request, res: Response) => {
  try {
    const { orderId, userId, amount, email, currency = 'btc' } = req.body;
    console.log('Received payment request:', { orderId, userId, amount, email, currency });

    const order = await storage.getOrderById(parseInt(orderId));
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    const user = await storage.getUser(parseInt(userId));
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const supportedCurrencies = ['btc', 'eth', 'ltc', 'bch', 'usdt', 'xrp'];
    if (!supportedCurrencies.includes(currency.toLowerCase())) {
      res.status(400).json({ error: `Unsupported currency. Supported currencies are: ${supportedCurrencies.join(', ')}` });
      return;
    }

    const vercelUrl = getValidVercelUrl();
    console.log('Using callback URL:', vercelUrl);
    const paymentData = {
      price_amount: parseFloat(amount),
      price_currency: 'usd',
      pay_currency: currency.toLowerCase(),
      order_id: order.id.toString(),
      order_description: `Payment for Order #${order.id}`,
      ipn_callback_url: vercelUrl,
      customer_email: email || user.email,
      is_fixed_rate: true,
    };

    if (isNaN(paymentData.price_amount) || paymentData.price_amount <= 0) {
      throw new Error('Invalid amount provided');
    }

    console.log('Sending payment request to NOWPayments:', paymentData);
    const response: AxiosResponse<NOWPaymentsResponse> = await axios.post(NOWPAYMENTS_API_URL, paymentData, axiosConfig);
    console.log('NOWPayments response:', response.data);

    if (response.data.payment_status === 'error') {
      res.status(500).json({ error: 'Payment creation failed', details: response.data.message });
      return;
    }

    order.status = 'pending payment';
    order.paymentId = response.data.payment_id;
    await storage.updateOrder(order);

    res.json({
      pay_address: response.data.pay_address,
      pay_amount: response.data.pay_amount,
    });
  } catch (error: unknown) {
    const err = error as AxiosError | Error;
    const errorDetails = err instanceof AxiosError ? err.response?.data?.message || err.message : err.message;
    console.error('Payment creation error:', errorDetails);
    res.status(500).json({ error: 'Failed to create payment', details: errorDetails });
  }
});

app.post('/api/check-payment-status/:orderId', async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const order = await storage.getOrderById(orderId);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const paymentId = order.paymentId;
    if (!paymentId) {
      res.status(400).json({ error: 'Payment ID not found for this order' });
      return;
    }

    console.log(`Checking payment status for paymentId: ${paymentId}`);
    const response = await axios.get(`https://api.nowpayments.io/v1/payment/${paymentId}`, axiosConfig);
    const paymentStatus = response.data.payment_status;
    console.log('Payment status response:', response.data);

    if (paymentStatus === 'confirmed' || paymentStatus === 'finished') {
      order.status = 'paid';
      await storage.updateOrder(order);
      const user = await storage.getUser(order.userId);
      if (user) {
        console.log(`Payment confirmed for Order ${order.id}`);
      }
      res.json({ status: 'paid' });
    } else {
      res.json({ status: 'pending' });
    }
  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/payment-callback', (req: Request, res: Response) => {
  try {
    const body = req.body;
    const receivedSignature = req.headers['x-nowpayments-sig'] as string;
    if (!receivedSignature) {
      console.error('Missing IPN signature');
      res.status(403).json({ error: 'Missing IPN signature' });
      return;
    }

    const payloadString = JSON.stringify(body);
    const computedSignature = crypto
      .createHmac('sha512', NOWPAYMENTS_IPN_SECRET)
      .update(payloadString)
      .digest('hex');

    if (receivedSignature !== computedSignature) {
      console.error('Invalid IPN signature');
      res.status(403).json({ error: 'Invalid IPN signature' });
      return;
    }

    const { payment_status, order_id, payment_id } = body;

    storage.getOrderById(parseInt(order_id)).then(async (order) => {
      if (order) {
        if (payment_status === 'confirmed' || payment_status === 'finished') {
          order.status = 'paid';
          order.paymentId = payment_id;
          await storage.updateOrder(order);
          const user = await storage.getUser(order.userId);
          if (user) {
            console.log(`Payment callback processed: Order ${order.id} marked as paid`);
          }
        } else if (payment_status === 'failed' || payment_status === 'expired') {
          order.status = 'failed';
          await storage.updateOrder(order);
          console.log(`Payment callback processed: Order ${order.id} marked as failed`);
        }
      }
    }).catch((err) => console.error('Error updating order in callback:', err));

    res.status(200).json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Callback processing error:', err.message);
    res.status(500).json({ error: 'Failed to process callback', details: err.message });
  }
});

// Review routes
app.post('/api/reviews', async (req: Request, res: Response) => {
  try {
    const { productId, userId, username, text, rating } = req.body as {
      productId: number;
      userId: number;
      username: string;
      text: string;
      rating: number;
    };
    if (!productId || !userId || !username || !text || !rating) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    if (rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Rating must be between 1 and 5' });
      return;
    }
    const product = await storage.getProductById(productId);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const user = await storage.getUser(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const review = await storage.createReview({
      productId,
      userId,
      username,
      text,
      rating,
    });
    res.status(201).json({ message: 'Review submitted', review });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/reviews/product/:productId', async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    const product = await storage.getProductById(productId);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const reviews = await storage.getReviewsByProduct(productId);
    res.json(reviews);
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Admin routes
app.get('/api/admin/orders', async (req: Request, res: Response) => {
  try {
    const orders = await storage.getUserOrders(parseInt(req.query.userId as string) || 0);
    res.json(orders);
  } catch (error) {
    console.error('Get admin orders error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/admin/add-product', async (req: Request, res: Response) => {
  try {
    const { title, description, price, categoryId } = req.body as {
      title: string;
      description: string;
      price: string;
      categoryId: number;
    };
    if (!title || !description || !price || !categoryId) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    const product = await storage.createProduct({
      title,
      description,
      price,
      categoryId,
      originalPrice: null,
      imageUrl: '',
      rating: '0',
      reviewCount: 0,
      downloadCount: 0,
      tags: [],
      downloadUrl: '',
      isFree: false,
      isActive: true,
    });
    res.status(201).json(product);
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.delete('/api/admin/remove-product/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await storage.removeProduct(id);
    res.status(200).json({ message: 'Product removed' });
  } catch (error) {
    console.error('Remove product error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export app for Vercel
export default app;