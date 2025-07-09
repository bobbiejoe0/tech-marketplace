"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const crypto = __importStar(require("crypto"));
const storage_1 = require("./storage");
const reviews_1 = require("./reviews");
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const axios_1 = __importStar(require("axios"));
const app = (0, express_1.default)();
// Use the exported storage instance directly
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
// Default route to confirm server is running
app.get('/', (req, res) => {
    res.send('E-commerce API is running!');
});
// Helper function to hash password
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}
// Configure Nodemailer transporter
const transporter = nodemailer_1.default.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use TLS
    auth: {
        user: process.env.EMAIL_USER || 'techmarket@gmail.com',
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
const getValidVercelUrl = () => {
    const baseUrl = process.env.VERCEL_URL || 'ecommerce-website-2222-88wpsl64f.vercel.app';
    const url = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    return `${cleanUrl}/api/payment-callback`;
};
// Custom Axios config without retry
const axiosConfig = {
    headers: { 'x-api-key': NOWPAYMENTS_API_KEY },
    timeout: 10000,
    maxRedirects: 2,
};
// Routes
app.post('/api/create-user', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password, firstName, lastName } = req.body;
        if (!username || !email || !password) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }
        const existingUser = yield storage_1.storage.getUserByEmail(email);
        if (existingUser) {
            res.status(400).json({ error: 'Email already exists' });
            return;
        }
        const user = yield storage_1.storage.createUser({
            username,
            email,
            password: hashPassword(password),
            firstName: firstName !== null && firstName !== void 0 ? firstName : null,
            lastName: lastName !== null && lastName !== void 0 ? lastName : null,
        });
        res.status(201).json({ id: user.id, username: user.username });
    }
    catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: error.message });
    }
}));
app.post('/api/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Missing email or password' });
            return;
        }
        const user = yield storage_1.storage.loginUser(email, hashPassword(password));
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        res.json({ id: user.id, username: user.username });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
}));
app.get('/api/categories', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield storage_1.storage.getAllCategories();
        res.json(categories);
    }
    catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: error.message });
    }
}));
app.get('/api/products', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const products = yield storage_1.storage.getAllProducts();
        res.json(products);
    }
    catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: error.message });
    }
}));
app.get('/api/products/category/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        const products = yield storage_1.storage.getProductsByCategory(id);
        res.json(products);
    }
    catch (error) {
        console.error('Get products by category error:', error);
        res.status(500).json({ error: error.message });
    }
}));
app.get('/api/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const q = req.query.q;
        const products = yield storage_1.storage.searchProducts(q);
        res.json(products);
    }
    catch (error) {
        console.error('Search products error:', error);
        res.status(500).json({ error: error.message });
    }
}));
app.get('/api/reviews/:productId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productId = parseInt(req.params.productId);
        const { reviews, contactEmail } = yield (0, reviews_1.getReviewsByProductId)(productId);
        res.json({ reviews, contactEmail });
    }
    catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ error: error.message });
    }
}));
app.get('/api/cart/:userId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = parseInt(req.params.userId);
        const cartItems = yield storage_1.storage.getCartItems(userId);
        res.json(cartItems);
    }
    catch (error) {
        console.error('Get cart items error:', error);
        res.status(500).json({ error: error.message });
    }
}));
app.post('/api/add-to-cart', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, productId, quantity } = req.body;
        const cartItem = yield storage_1.storage.addToCart({
            userId,
            productId,
            quantity: quantity !== null && quantity !== void 0 ? quantity : 1,
        });
        res.status(201).json({ message: 'Item added to cart', cartItem });
    }
    catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ error: error.message });
    }
}));
app.delete('/api/cart/:userId/:productId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = parseInt(req.params.userId);
        const productId = parseInt(req.params.productId);
        yield storage_1.storage.removeFromCart(userId, productId);
        res.status(200).json({ message: 'Item removed from cart' });
    }
    catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ error: error.message });
    }
}));
app.post('/api/create-order', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, productId, cartItems } = req.body;
        if (!userId) {
            res.status(400).json({ error: 'Missing userId' });
            return;
        }
        const user = yield storage_1.storage.getUser(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        let order;
        if (productId) {
            const product = yield storage_1.storage.getProductById(productId);
            if (!product) {
                res.status(404).json({ error: 'Product not found' });
                return;
            }
            order = yield storage_1.storage.createOrder({
                userId,
                totalAmount: product.price.toString(),
                status: 'not paid',
                paymentMethod: 'crypto',
            });
            yield storage_1.storage.addOrderItem({ orderId: order.id, productId, quantity: 1 });
        }
        else if (cartItems && cartItems.length > 0) {
            const productPromises = cartItems.map((item) => __awaiter(void 0, void 0, void 0, function* () {
                const product = yield storage_1.storage.getProductById(item.productId);
                return product ? parseFloat(product.price) * item.quantity : 0;
            }));
            const amounts = yield Promise.all(productPromises);
            const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0).toString();
            order = yield storage_1.storage.createOrder({
                userId,
                totalAmount,
                status: 'not paid',
                paymentMethod: 'crypto',
            });
            for (const item of cartItems) {
                yield storage_1.storage.addOrderItem({ orderId: order.id, productId: item.productId, quantity: item.quantity });
            }
            yield storage_1.storage.clearCart(userId);
        }
        else {
            const cartItems = yield storage_1.storage.getCartItems(userId);
            if (cartItems.length === 0) {
                res.status(400).json({ error: 'Cart is empty' });
                return;
            }
            const productPromises = cartItems.map((item) => __awaiter(void 0, void 0, void 0, function* () {
                const product = yield storage_1.storage.getProductById(item.productId);
                return product ? parseFloat(product.price) * item.quantity : 0;
            }));
            const amounts = yield Promise.all(productPromises);
            const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0).toString();
            order = yield storage_1.storage.createOrder({
                userId,
                totalAmount,
                status: 'not paid',
                paymentMethod: 'crypto',
            });
            for (const item of cartItems) {
                yield storage_1.storage.addOrderItem({ orderId: order.id, productId: item.productId, quantity: item.quantity });
            }
            yield storage_1.storage.clearCart(userId);
        }
        // Send order confirmation email
        const mailOptions = {
            from: process.env.EMAIL_USER || 'techmarket@gmail.com',
            to: user.email,
            cc: 'mrbodabobo@gmail.com',
            subject: 'Thank You for Patronizing Us!',
            text: `Dear ${user.username},\n\nThank you for your order (Order ID: ${order.id}). We will get back to you as soon as possible.\n\nBest regards,\nTechMarket Team`,
        };
        try {
            yield transporter.sendMail(mailOptions);
            console.log(`Order confirmation email sent to ${user.email} and cc'd to mrbodabobo@gmail.com for Order ${order.id}`);
        }
        catch (emailError) {
            console.error(`Failed to send order confirmation email for Order ${order.id}:`, emailError);
        }
        console.log(`Order ${order.id} created for user ${userId}`);
        res.status(201).json(order);
    }
    catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: error.message });
    }
}));
app.get('/api/order-status/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        const order = yield storage_1.storage.getOrderById(id);
        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }
        res.json({ status: order.status });
    }
    catch (error) {
        console.error('Get order status error:', error);
        res.status(500).json({ error: error.message });
    }
}));
app.post('/api/log-developer', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, isDeveloper, githubEmail, developerEmail } = req.body;
        if (isDeveloper === 'no' && developerEmail) {
            const mailOptions = {
                from: process.env.EMAIL_USER || 'techmarket@gmail.com',
                to: 'admin@toolhatch.store',
                cc: 'mrbodabobo@gmail.com',
                subject: 'New Developer Email Submission',
                text: `User ID: ${userId}\nDeveloper Email: ${developerEmail}`,
            };
            try {
                yield transporter.sendMail(mailOptions);
                console.log(`Developer email submission sent to admin@toolhatch.store and cc'd to mrbodabobo@gmail.com for User ID ${userId}`);
            }
            catch (emailError) {
                console.error(`Failed to send developer email submission for User ID ${userId}:`, emailError);
            }
        }
        console.log(`Developer info logged: User ID ${userId}, isDeveloper: ${isDeveloper}`);
        res.status(201).json({ message: 'Developer info logged' });
    }
    catch (error) {
        console.error('Log developer error:', error);
        res.status(500).json({ error: error.message });
    }
}));
app.post('/api/create-payment', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { orderId, userId, amount, email, currency = 'btc' } = req.body;
        console.log('Received payment request:', { orderId, userId, amount, email, currency });
        const order = yield storage_1.storage.getOrderById(parseInt(orderId));
        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }
        const user = yield storage_1.storage.getUser(parseInt(userId));
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
        const response = yield axios_1.default.post(NOWPAYMENTS_API_URL, paymentData, axiosConfig);
        console.log('NOWPayments response:', response.data);
        if (response.data.payment_status === 'error') {
            res.status(500).json({ error: 'Payment creation failed', details: response.data.message });
            return;
        }
        order.status = 'pending payment';
        order.paymentId = response.data.payment_id;
        yield storage_1.storage.updateOrder(order);
        res.json({
            pay_address: response.data.pay_address,
            pay_amount: response.data.pay_amount,
        });
    }
    catch (error) {
        const err = error;
        const errorDetails = err instanceof axios_1.AxiosError ? ((_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || err.message : err.message;
        console.error('Payment creation error:', errorDetails);
        res.status(500).json({ error: 'Failed to create payment', details: errorDetails });
    }
}));
app.post('/api/check-payment-status/:orderId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orderId = parseInt(req.params.orderId);
        const order = yield storage_1.storage.getOrderById(orderId);
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
        const response = yield axios_1.default.get(`https://api.nowpayments.io/v1/payment/${paymentId}`, axiosConfig);
        const paymentStatus = response.data.payment_status;
        console.log('Payment status response:', response.data);
        if (paymentStatus === 'confirmed' || paymentStatus === 'finished') {
            order.status = 'paid';
            yield storage_1.storage.updateOrder(order);
            const user = yield storage_1.storage.getUser(order.userId);
            if (user) {
                const mailOptions = {
                    from: process.env.EMAIL_USER || 'techmarket@gmail.com',
                    to: user.email,
                    cc: 'mrbodabobo@gmail.com',
                    subject: 'Thank You for Your Order!',
                    text: `Dear ${user.username},\n\nThank you for your order (Order ID: ${order.id})! We have received your payment and will get back to you soon.\n\nBest regards,\nTechMarket Team`,
                };
                try {
                    yield transporter.sendMail(mailOptions);
                    console.log(`Payment confirmation email sent to ${user.email} and cc'd to mrbodabobo@gmail.com for Order ${order.id}`);
                }
                catch (emailError) {
                    console.error(`Failed to send payment confirmation email for Order ${order.id}:`, emailError);
                }
            }
            res.json({ status: 'paid' });
        }
        else {
            res.json({ status: 'pending' });
        }
    }
    catch (error) {
        console.error('Payment status check error:', error);
        res.status(500).json({ error: error.message });
    }
}));
app.post('/api/payment-callback', (req, res) => {
    try {
        const body = req.body;
        const receivedSignature = req.headers['x-nowpayments-sig'];
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
        storage_1.storage.getOrderById(parseInt(order_id)).then((order) => __awaiter(void 0, void 0, void 0, function* () {
            if (order) {
                if (payment_status === 'confirmed' || payment_status === 'finished') {
                    order.status = 'paid';
                    order.paymentId = payment_id;
                    yield storage_1.storage.updateOrder(order);
                    const user = yield storage_1.storage.getUser(order.userId);
                    if (user) {
                        const mailOptions = {
                            from: process.env.EMAIL_USER || 'techmarket@gmail.com',
                            to: user.email,
                            cc: 'mrbodabobo@gmail.com',
                            subject: 'Payment Confirmed!',
                            text: `Dear ${user.username},\n\nYour payment for Order ID: ${order.id} has been confirmed. Thank you for your purchase!\n\nBest regards,\nTechMarket Team`,
                        };
                        try {
                            yield transporter.sendMail(mailOptions);
                            console.log(`IPN confirmation email sent to ${user.email} and cc'd to mrbodabobo@gmail.com for Order ${order.id}`);
                        }
                        catch (emailError) {
                            console.error(`Failed to send IPN confirmation email for Order ${order.id}:`, emailError);
                        }
                    }
                    console.log(`Order ${order.id} marked as paid via IPN`);
                }
                else if (payment_status === 'failed' || payment_status === 'expired') {
                    order.status = payment_status;
                    yield storage_1.storage.updateOrder(order);
                    console.log(`Order ${order.id} marked as ${payment_status} via IPN`);
                }
                res.status(200).json({ message: 'IPN processed' });
            }
            else {
                console.error(`Order ${order_id} not found`);
                res.status(404).json({ error: 'Order not found' });
            }
        }));
    }
    catch (error) {
        console.error('IPN callback error:', error);
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/admin/add-product', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, price, categoryId } = req.body;
        if (!title || !description || !price || !categoryId) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }
        const product = yield storage_1.storage.createProduct({
            title,
            description,
            price,
            categoryId,
            imageUrl: 'https://via.placeholder.com/150',
            rating: '4.5',
            reviewCount: 0,
            originalPrice: price,
            downloadCount: 0,
            tags: ['new'],
            downloadUrl: '',
            isFree: false,
            isActive: true,
        });
        res.status(201).json({ message: 'Product added', product });
    }
    catch (error) {
        console.error('Add product error:', error);
        res.status(500).json({ error: error.message });
    }
}));
app.delete('/api/admin/remove-product/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        yield storage_1.storage.removeProduct(id);
        res.status(200).json({ message: 'Product removed' });
    }
    catch (error) {
        console.error('Remove product error:', error);
        res.status(500).json({ error: error.message });
    }
}));
app.get('/api/admin/orders', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = parseInt(req.query.userId);
        const orders = yield storage_1.storage.getUserOrders(userId);
        res.json(orders);
    }
    catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: error.message });
    }
}));
// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
