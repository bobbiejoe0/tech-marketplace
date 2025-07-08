import {
  User, InsertUser, Category, InsertCategory, Product, InsertProduct,
  CartItem, InsertCartItem, Order, InsertOrder, OrderItem, InsertOrderItem,
  ProductWithCategory, CartItemWithProduct, OrderWithItems, Review
} from './types/schema';
import * as bcrypt from 'bcrypt';

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>; // Added
  createUser(user: InsertUser): Promise<User>;

  // Categories
  getAllCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  updateOrder(order: Order): Promise<void>;

  // Products
  getAllProducts(): Promise<ProductWithCategory[]>;
  getProductById(id: number): Promise<ProductWithCategory | undefined>;
  getProductsByCategory(categoryId: number): Promise<ProductWithCategory[]>;
  searchProducts(query: string): Promise<ProductWithCategory[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  removeProduct(id: number): Promise<void>; // Add this line

  // Cart
  getCartItems(userId: number): Promise<CartItemWithProduct[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  removeFromCart(userId: number, productId: number): Promise<void>;
  clearCart(userId: number): Promise<void>;

  // Orders
  getUserOrders(userId: number): Promise<OrderWithItems[]>;
  getOrderById(id: number): Promise<OrderWithItems | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  addOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;

  
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private categories: Map<number, Category>;
  private cartItems: Map<string, CartItem>; // key: `${userId}-${productId}`
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem[]>; // key: orderId
  private currentUserId: number;
  private currentProductId: number;
  private currentCategoryId: number;
  private currentCartItemId: number;
  private currentOrderId: number;
  private currentOrderItemId: number;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.categories = new Map();
    this.cartItems = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.currentUserId = 1;
    this.currentProductId = 1;
    this.currentCategoryId = 1;
    this.currentCartItemId = 1;
    this.currentOrderId = 1;
    this.currentOrderItemId = 1;

    this.seedData();
  }

  private seedData() {
    // Seed categories
    const categoriesData = [
      {
        name: "App Development",
        slug: "app-development",
        icon: "fas fa-mobile-alt",
        description: "Mobile and web application development tools",
      },
      {
        name: "Trading Bots",
        slug: "trading-bots",
        icon: "fas fa-chart-line",
        description: "Automated trading and financial algorithms",
      },
      {
        name: "Website Tools",
        slug: "website-tools",
        icon: "fas fa-globe",
        description: "Website development and deployment tools",
      },
      {
        name: "Shopify Themes",
        slug: "shopify-themes",
        icon: "fas fa-shopping-bag",
        description: "Premium Shopify store themes and templates",
      },
      {
        name: "Security Tools",
        slug: "security-tools",
        icon: "fas fa-shield-alt",
        description: "Ethical hacking and cybersecurity tools",
      },
    ];

    categoriesData.forEach((cat) => {
      const category: Category = { id: this.currentCategoryId++, ...cat };
      this.categories.set(category.id, category);
    });

    // Seed products
    const productsData = [
      // App Development Tools (Category ID: 1)
      {
        title: "React Native Pro Template",
        description:
          "Complete React Native app template with authentication, navigation, state management, and UI components.",
        price: "89.00",
        originalPrice: "129.00",
        categoryId: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 127,
        downloadCount: 1234,
        tags: ["react-native", "template", "mobile"],
        isFree: false,
      },
      {
        title: "Flutter UI Kit Pro",
        description:
          "Professional Flutter UI kit with 100+ screens, widgets, and animations for rapid app development.",
        price: "149.00",
        categoryId: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.9",
        reviewCount: 198,
        downloadCount: 856,
        tags: ["flutter", "ui-kit", "design"],
        isFree: false,
      },
      {
        title: "iOS SwiftUI Component Library",
        description:
          "Comprehensive SwiftUI component library with custom animations and iOS 17 features.",
        price: "199.00",
        categoryId: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.7",
        reviewCount: 142,
        downloadCount: 634,
        tags: ["ios", "swiftui", "components"],
        isFree: false,
      },
      {
        title: "Android Jetpack Compose Toolkit",
        description:
          "Modern Android development toolkit with Jetpack Compose components and Material Design 3.",
        price: "129.00",
        categoryId: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.6",
        reviewCount: 173,
        downloadCount: 789,
        tags: ["android", "jetpack-compose", "material"],
        isFree: false,
      },
      {
        title: "Cross-Platform App Builder",
        description:
          "No-code app builder supporting iOS, Android, and web with drag-and-drop interface.",
        price: "299.00",
        originalPrice: "399.00",
        categoryId: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1586953208448-b95a79798f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.5",
        reviewCount: 234,
        downloadCount: 1456,
        tags: ["no-code", "cross-platform", "builder"],
        isFree: false,
      },
      {
        title: "Progressive Web App Framework",
        description:
          "Advanced PWA framework with offline support, push notifications, and app-like experience.",
        price: "179.00",
        categoryId: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 156,
        downloadCount: 923,
        tags: ["pwa", "offline", "web-app"],
        isFree: false,
      },
      {
        title: "Mobile App Analytics SDK",
        description:
          "Comprehensive analytics SDK with user tracking, crash reporting, and performance monitoring.",
        price: "99.00",
        categoryId: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.7",
        reviewCount: 187,
        downloadCount: 1123,
        tags: ["analytics", "tracking", "monitoring"],
        isFree: false,
      },
      {
        title: "App Store Optimization Toolkit",
        description:
          "Complete ASO toolkit with keyword research, A/B testing tools, and ranking optimization.",
        price: "249.00",
        categoryId: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.6",
        reviewCount: 145,
        downloadCount: 567,
        tags: ["aso", "optimization", "marketing"],
        isFree: false,
      },
      {
        title: "Xamarin Forms Enterprise Kit",
        description:
          "Enterprise-grade Xamarin Forms toolkit with advanced controls and cloud integrations.",
        price: "199.00",
        categoryId: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1522252234503-e356532cafd5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.4",
        reviewCount: 98,
        downloadCount: 456,
        tags: ["xamarin", "enterprise", "cloud"],
        isFree: false,
      },
      {
        title: "Unity 3D Game Development Kit",
        description:
          "Complete Unity 3D game development package with assets, scripts, and monetization tools.",
        price: "349.00",
        originalPrice: "499.00",
        categoryId: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.9",
        reviewCount: 312,
        downloadCount: 2134,
        tags: ["unity", "game-dev", "3d"],
        isFree: false,
      },
      {
        title: "Electron Desktop App Template",
        description:
          "Modern Electron template with auto-updater, native menus, and cross-platform deployment.",
        price: "119.00",
        categoryId: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.5",
        reviewCount: 167,
        downloadCount: 734,
        tags: ["electron", "desktop", "cross-platform"],
        isFree: false,
      },
      {
        title: "Firebase Integration Toolkit",
        description:
          "Complete Firebase integration toolkit with authentication, database, and cloud functions.",
        price: "89.00",
        categoryId: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 203,
        downloadCount: 1567,
        tags: ["firebase", "backend", "cloud"],
        isFree: false,
      },
      {
        title: "GraphQL Mobile API Kit",
        description:
          "GraphQL API integration kit for mobile apps with caching, offline support, and type safety.",
        price: "159.00",
        categoryId: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.7",
        reviewCount: 134,
        downloadCount: 678,
        tags: ["graphql", "api", "mobile"],
        isFree: false,
      },
      {
        title: "App Testing Automation Suite",
        description:
          "Automated testing suite for mobile apps with UI testing, performance testing, and CI/CD integration.",
        price: "279.00",
        categoryId: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.6",
        reviewCount: 156,
        downloadCount: 489,
        tags: ["testing", "automation", "ci-cd"],
        isFree: false,
      },
      {
        title: "AR/VR App Development Framework",
        description:
          "Augmented and Virtual Reality development framework with 3D object recognition and spatial tracking.",
        price: "399.00",
        categoryId: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 89,
        downloadCount: 234,
        tags: ["ar", "vr", "3d"],
        isFree: false,
      },
      {
        title: "IoT App Development Platform",
        description:
          "IoT application development platform with device management, data visualization, and real-time monitoring.",
        price: "249.00",
        categoryId: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.5",
        reviewCount: 112,
        downloadCount: 345,
        tags: ["iot", "devices", "monitoring"],
        isFree: false,
      },
      {
        title: "Blockchain App Integration Kit",
        description:
          "Blockchain integration toolkit for mobile apps with wallet connection, smart contracts, and DeFi features.",
        price: "299.00",
        categoryId: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.7",
        reviewCount: 178,
        downloadCount: 567,
        tags: ["blockchain", "web3", "defi"],
        isFree: false,
      },
      {
        title: "AI/ML Mobile Integration SDK",
        description:
          "Machine learning SDK for mobile apps with image recognition, natural language processing, and predictive analytics.",
        price: "199.00",
        categoryId: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 145,
        downloadCount: 678,
        tags: ["ai", "ml", "recognition"],
        isFree: false,
      },
      {
        title: "Push Notification Service Kit",
        description:
          "Advanced push notification service with segmentation, scheduling, and analytics for mobile apps.",
        price: "129.00",
        categoryId: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.6",
        reviewCount: 234,
        downloadCount: 1234,
        tags: ["notifications", "push", "engagement"],
        isFree: false,
      },
      {
        title: "Open Source App Templates",
        description:
          "Collection of open-source app templates for various industries with MIT license.",
        price: "15.00",
        categoryId: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1522252234503-e356532cafd5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.5",
        reviewCount: 456,
        downloadCount: 3456,
        tags: ["open-source", "templates", "free"],
        isFree: true,
      },

      // Trading Bot Development Tools (Category ID: 2)
      {
        title: "Crypto Trading Bot Framework",
        description:
          "Advanced cryptocurrency trading bot framework with backtesting, multiple exchange support, and AI strategies.",
        price: "399.00",
        originalPrice: "599.00",
        categoryId: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.9",
        reviewCount: 234,
        downloadCount: 1567,
        tags: ["crypto", "trading", "bot"],
        isFree: false,
      },
      {
        title: "Forex Algorithmic Trading System",
        description:
          "Professional forex trading algorithm with machine learning predictions and risk management.",
        price: "499.00",
        categoryId: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 156,
        downloadCount: 789,
        tags: ["forex", "algorithm", "ml"],
        isFree: false,
      },
      {
        title: "Stock Market Analysis Bot",
        description:
          "AI-powered stock market analysis bot with sentiment analysis, technical indicators, and automated trading.",
        price: "299.00",
        categoryId: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1642790106117-e829e14a795f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.7",
        reviewCount: 198,
        downloadCount: 1234,
        tags: ["stocks", "analysis", "ai"],
        isFree: false,
      },
      {
        title: "DeFi Arbitrage Bot",
        description:
          "Decentralized finance arbitrage bot for finding profit opportunities across DEX platforms.",
        price: "599.00",
        categoryId: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.9",
        reviewCount: 145,
        downloadCount: 567,
        tags: ["defi", "arbitrage", "dex"],
        isFree: false,
      },
      {
        title: "Options Trading Strategy Bot",
        description:
          "Advanced options trading bot with Greeks calculation, volatility analysis, and strategy optimization.",
        price: "449.00",
        categoryId: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.6",
        reviewCount: 123,
        downloadCount: 456,
        tags: ["options", "greeks", "volatility"],
        isFree: false,
      },
      {
        title: "Multi-Exchange Portfolio Manager",
        description:
          "Portfolio management bot supporting multiple exchanges with rebalancing and risk assessment.",
        price: "349.00",
        categoryId: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 189,
        downloadCount: 834,
        tags: ["portfolio", "rebalancing", "risk"],
        isFree: false,
      },
      {
        title: "High-Frequency Trading Engine",
        description:
          "Ultra-low latency HFT engine with microsecond execution and advanced order types.",
        price: "999.00",
        originalPrice: "1299.00",
        categoryId: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1642790551116-18e150f248e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.9",
        reviewCount: 87,
        downloadCount: 234,
        tags: ["hft", "latency", "execution"],
        isFree: false,
      },
      {
        title: "Sentiment Analysis Trading Bot",
        description:
          "News and social media sentiment analysis bot for cryptocurrency and stock trading decisions.",
        price: "249.00",
        categoryId: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.7",
        reviewCount: 167,
        downloadCount: 945,
        tags: ["sentiment", "news", "social"],
        isFree: false,
      },
      {
        title: "Backtesting Framework Pro",
        description:
          "Professional backtesting framework with historical data, performance metrics, and strategy optimization.",
        price: "199.00",
        categoryId: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 234,
        downloadCount: 1345,
        tags: ["backtesting", "historical", "optimization"],
        isFree: false,
      },
      {
        title: "Copy Trading Platform",
        description:
          "Copy trading platform allowing users to replicate successful traders' strategies automatically.",
        price: "299.00",
        categoryId: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.6",
        reviewCount: 178,
        downloadCount: 723,
        tags: ["copy-trading", "social", "automation"],
        isFree: false,
      },
      {
        title: "Market Making Bot",
        description:
          "Professional market making bot with spread optimization and inventory management.",
        price: "699.00",
        categoryId: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.9",
        reviewCount: 134,
        downloadCount: 456,
        tags: ["market-making", "spread", "liquidity"],
        isFree: false,
      },
      {
        title: "Risk Management System",
        description:
          "Advanced risk management system with position sizing, stop-loss automation, and drawdown protection.",
        price: "249.00",
        categoryId: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1642790106117-e829e14a795f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.7",
        reviewCount: 145,
        downloadCount: 678,
        tags: ["risk", "stop-loss", "protection"],
        isFree: false,
      },
      {
        title: "Trading Signal Aggregator",
        description:
          "Signal aggregation platform combining multiple trading signals with confidence scoring.",
        price: "179.00",
        categoryId: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.5",
        reviewCount: 189,
        downloadCount: 823,
        tags: ["signals", "aggregation", "scoring"],
        isFree: false,
      },
      {
        title: "Cryptocurrency Yield Farming Bot",
        description:
          "Automated yield farming bot for DeFi protocols with compound strategies and gas optimization.",
        price: "399.00",
        categoryId: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 167,
        downloadCount: 567,
        tags: ["yield-farming", "defi", "compound"],
        isFree: false,
      },
      {
        title: "Futures Trading Algorithm",
        description:
          "Sophisticated futures trading algorithm with contango/backwardation detection and roll optimization.",
        price: "549.00",
        categoryId: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.7",
        reviewCount: 123,
        downloadCount: 345,
        tags: ["futures", "contango", "roll"],
        isFree: false,
      },
      {
        title: "Statistical Arbitrage Engine",
        description:
          "Statistical arbitrage trading engine with pair trading, mean reversion, and cointegration analysis.",
        price: "799.00",
        categoryId: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1642790551116-18e150f248e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.9",
        reviewCount: 98,
        downloadCount: 234,
        tags: ["arbitrage", "pairs", "cointegration"],
        isFree: false,
      },
      {
        title: "Grid Trading Bot",
        description:
          "Grid trading bot with dynamic grid adjustment and multiple timeframe analysis.",
        price: "149.00",
        categoryId: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.6",
        reviewCount: 234,
        downloadCount: 1234,
        tags: ["grid", "dynamic", "timeframe"],
        isFree: false,
      },
      {
        title: "Machine Learning Trading Model",
        description:
          "Advanced ML trading model using neural networks, feature engineering, and ensemble methods.",
        price: "899.00",
        originalPrice: "1199.00",
        categoryId: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.9",
        reviewCount: 156,
        downloadCount: 456,
        tags: ["ml", "neural", "ensemble"],
        isFree: false,
      },
      {
        title: "Exchange API Integration Kit",
        description:
          "Unified API integration kit supporting 50+ cryptocurrency and traditional exchanges.",
        price: "99.00",
        categoryId: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 345,
        downloadCount: 2345,
        tags: ["api", "exchanges", "integration"],
        isFree: false,
      },
      {
        title: "Basic Trading Bot Template",
        description:
          "Open-source basic trading bot template with simple moving average strategy.",
        price: "0.00",
        categoryId: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1642790106117-e829e14a795f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.4",
        reviewCount: 567,
        downloadCount: 4567,
        tags: ["basic", "template", "sma"],
        isFree: true,
      },

      // Website Development Tools (Category ID: 3)
      {
        title: "Next.js Enterprise Template",
        description:
          "Production-ready Next.js template with TypeScript, Tailwind CSS, authentication, and deployment pipeline.",
        price: "199.00",
        originalPrice: "299.00",
        categoryId: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.9",
        reviewCount: 234,
        downloadCount: 1567,
        tags: ["nextjs", "typescript", "tailwind"],
        isFree: false,
      },
      {
        title: "WordPress Multi-Site Manager",
        description:
          "Advanced WordPress multi-site management tool with automated updates, security monitoring, and backup.",
        price: "149.00",
        categoryId: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.7",
        reviewCount: 189,
        downloadCount: 923,
        tags: ["wordpress", "multisite", "management"],
        isFree: false,
      },
      {
        title: "React Component Library Pro",
        description:
          "Professional React component library with 200+ components, Storybook, and design system.",
        price: "179.00",
        categoryId: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 156,
        downloadCount: 834,
        tags: ["react", "components", "storybook"],
        isFree: false,
      },
      {
        title: "Vue.js Dashboard Framework",
        description:
          "Complete Vue.js dashboard framework with charts, tables, forms, and responsive design.",
        price: "129.00",
        categoryId: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.6",
        reviewCount: 167,
        downloadCount: 678,
        tags: ["vuejs", "dashboard", "charts"],
        isFree: false,
      },
      {
        title: "Headless CMS Builder",
        description:
          "Custom headless CMS builder with GraphQL API, content modeling, and multi-channel publishing.",
        price: "299.00",
        categoryId: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 134,
        downloadCount: 456,
        tags: ["cms", "headless", "graphql"],
        isFree: false,
      },
      {
        title: "E-commerce Website Builder",
        description:
          "Full-featured e-commerce website builder with payment integration, inventory management, and SEO tools.",
        price: "349.00",
        originalPrice: "499.00",
        categoryId: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.9",
        reviewCount: 198,
        downloadCount: 1234,
        tags: ["ecommerce", "payment", "seo"],
        isFree: false,
      },
      {
        title: "Static Site Generator Pro",
        description:
          "Advanced static site generator with markdown support, image optimization, and CDN deployment.",
        price: "89.00",
        categoryId: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.7",
        reviewCount: 145,
        downloadCount: 789,
        tags: ["static", "markdown", "cdn"],
        isFree: false,
      },
      {
        title: "Website Performance Optimizer",
        description:
          "Comprehensive website performance optimization tool with image compression, code minification, and caching.",
        price: "119.00",
        categoryId: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 223,
        downloadCount: 1345,
        tags: ["performance", "optimization", "caching"],
        isFree: false,
      },
      {
        title: "Progressive Web App Template",
        description:
          "PWA template with offline functionality, push notifications, and app-like experience.",
        price: "159.00",
        categoryId: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1522252234503-e356532cafd5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.6",
        reviewCount: 178,
        downloadCount: 567,
        tags: ["pwa", "offline", "notifications"],
        isFree: false,
      },
      {
        title: "Website Security Scanner",
        description:
          "Advanced website security scanner with vulnerability detection, malware scanning, and SSL monitoring.",
        price: "199.00",
        categoryId: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.9",
        reviewCount: 134,
        downloadCount: 456,
        tags: ["security", "scanner", "ssl"],
        isFree: false,
      },
      {
        title: "CSS Framework Builder",
        description:
          "Custom CSS framework builder with utility classes, component system, and design tokens.",
        price: "99.00",
        categoryId: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.5",
        reviewCount: 189,
        downloadCount: 823,
        tags: ["css", "framework", "utility"],
        isFree: false,
      },
      {
        title: "API Documentation Generator",
        description:
          "Automated API documentation generator with interactive examples, testing interface, and versioning.",
        price: "129.00",
        categoryId: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.7",
        reviewCount: 167,
        downloadCount: 734,
        tags: ["api", "documentation", "testing"],
        isFree: false,
      },
      {
        title: "Website Builder Drag & Drop",
        description:
          "Visual website builder with drag-and-drop interface, responsive design, and code export.",
        price: "249.00",
        categoryId: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1586953208448-b95a79798f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.6",
        reviewCount: 145,
        downloadCount: 678,
        tags: ["builder", "drag-drop", "visual"],
        isFree: false,
      },
      {
        title: "A/B Testing Platform",
        description:
          "Complete A/B testing platform for websites with statistical analysis and conversion tracking.",
        price: "179.00",
        categoryId: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 123,
        downloadCount: 456,
        tags: ["ab-testing", "analytics", "conversion"],
        isFree: false,
      },
      {
        title: "Website Monitoring Service",
        description:
          "24/7 website monitoring service with uptime tracking, performance alerts, and incident reporting.",
        price: "89.00",
        categoryId: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.7",
        reviewCount: 234,
        downloadCount: 1234,
        tags: ["monitoring", "uptime", "alerts"],
        isFree: false,
      },
      {
        title: "Content Management System",
        description:
          "Custom CMS with user roles, content versioning, and multi-language support.",
        price: "199.00",
        categoryId: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.6",
        reviewCount: 167,
        downloadCount: 789,
        tags: ["cms", "versioning", "multilingual"],
        isFree: false,
      },
      {
        title: "Web Scraping Framework",
        description:
          "Advanced web scraping framework with proxy rotation, CAPTCHA solving, and data extraction.",
        price: "149.00",
        categoryId: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.5",
        reviewCount: 145,
        downloadCount: 567,
        tags: ["scraping", "proxy", "extraction"],
        isFree: false,
      },
      {
        title: "Website Analytics Dashboard",
        description:
          "Comprehensive website analytics dashboard with real-time data, custom reports, and goal tracking.",
        price: "119.00",
        categoryId: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 189,
        downloadCount: 834,
        tags: ["analytics", "dashboard", "tracking"],
        isFree: false,
      },
      {
        title: "Responsive Email Templates",
        description:
          "Collection of responsive email templates for marketing campaigns and transactional emails.",
        price: "59.00",
        categoryId: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.7",
        reviewCount: 234,
        downloadCount: 1456,
        tags: ["email", "templates", "responsive"],
        isFree: false,
      },
      {
        title: "Open Source Website Templates",
        description:
          "Collection of open-source website templates for various industries with MIT license.",
        price: "0.00",
        categoryId: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.4",
        reviewCount: 456,
        downloadCount: 3456,
        tags: ["templates", "open-source", "free"],
        isFree: true,
      },

      // Shopify Themes (Category ID: 4)
      {
        title: "Luxury Fashion Store Theme",
        description:
          "Premium Shopify theme for luxury fashion brands with elegant design and advanced product showcase.",
        price: "299.00",
        originalPrice: "399.00",
        categoryId: 4,
        imageUrl:
          "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.9",
        reviewCount: 234,
        downloadCount: 1567,
        tags: ["fashion", "luxury", "elegant"],
        isFree: false,
      },
      {
        title: "Electronics Mega Store",
        description:
          "Feature-rich Shopify theme for electronics stores with product comparison and technical specifications.",
        price: "199.00",
        categoryId: 4,
        imageUrl:
          "https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 189,
        downloadCount: 923,
        tags: ["electronics", "comparison", "technical"],
        isFree: false,
      },
      {
        title: "Minimalist Jewelry Theme",
        description:
          "Clean and minimalist Shopify theme perfect for jewelry stores with high-quality image galleries.",
        price: "179.00",
        categoryId: 4,
        imageUrl:
          "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.7",
        reviewCount: 156,
        downloadCount: 834,
        tags: ["jewelry", "minimalist", "gallery"],
        isFree: false,
      },
      {
        title: "Organic Food & Grocery Theme",
        description:
          "Fresh and natural Shopify theme for organic food stores with subscription and delivery features.",
        price: "149.00",
        categoryId: 4,
        imageUrl:
          "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.6",
        reviewCount: 167,
        downloadCount: 678,
        tags: ["organic", "food", "subscription"],
        isFree: false,
      },
      {
        title: "Sports & Fitness Equipment",
        description:
          "Dynamic Shopify theme for sports equipment stores with size guides and product videos.",
        price: "199.00",
        categoryId: 4,
        imageUrl:
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 134,
        downloadCount: 456,
        tags: ["sports", "fitness", "videos"],
        isFree: false,
      },
      {
        title: "Home Decor & Furniture",
        description:
          "Sophisticated Shopify theme for furniture stores with room visualization and AR preview.",
        price: "249.00",
        originalPrice: "349.00",
        categoryId: 4,
        imageUrl:
          "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.9",
        reviewCount: 198,
        downloadCount: 1234,
        tags: ["furniture", "ar", "visualization"],
        isFree: false,
      },
      {
        title: "Beauty & Cosmetics Store",
        description:
          "Glamorous Shopify theme for beauty brands with color swatches and ingredient listings.",
        price: "179.00",
        categoryId: 4,
        imageUrl:
          "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.7",
        reviewCount: 145,
        downloadCount: 789,
        tags: ["beauty", "cosmetics", "swatches"],
        isFree: false,
      },
      {
        title: "Handmade Crafts Marketplace",
        description:
          "Artisan-focused Shopify theme for handmade products with artist profiles and custom orders.",
        price: "129.00",
        categoryId: 4,
        imageUrl:
          "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.6",
        reviewCount: 178,
        downloadCount: 567,
        tags: ["handmade", "artisan", "custom"],
        isFree: false,
      },
      {
        title: "Pet Supplies & Accessories",
        description:
          "Playful Shopify theme for pet stores with breed-specific products and care guides.",
        price: "149.00",
        categoryId: 4,
        imageUrl:
          "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 167,
        downloadCount: 734,
        tags: ["pets", "breeds", "care"],
        isFree: false,
      },
      {
        title: "Automotive Parts Store",
        description:
          "Technical Shopify theme for auto parts with vehicle compatibility and installation guides.",
        price: "199.00",
        categoryId: 4,
        imageUrl:
          "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.7",
        reviewCount: 134,
        downloadCount: 456,
        tags: ["automotive", "compatibility", "guides"],
        isFree: false,
      },
      {
        title: "Digital Products Marketplace",
        description:
          "Modern Shopify theme for digital products with instant downloads and license management.",
        price: "169.00",
        categoryId: 4,
        imageUrl:
          "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.6",
        reviewCount: 145,
        downloadCount: 678,
        tags: ["digital", "downloads", "license"],
        isFree: false,
      },
      {
        title: "Books & Publishing Theme",
        description:
          "Literary Shopify theme for bookstores with author pages and reading samples.",
        price: "139.00",
        categoryId: 4,
        imageUrl:
          "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.5",
        reviewCount: 123,
        downloadCount: 456,
        tags: ["books", "authors", "samples"],
        isFree: false,
      },
      {
        title: "Multi-Vendor Marketplace",
        description:
          "Comprehensive Shopify theme supporting multiple vendors with commission tracking.",
        price: "299.00",
        categoryId: 4,
        imageUrl:
          "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 189,
        downloadCount: 834,
        tags: ["marketplace", "vendors", "commission"],
        isFree: false,
      },
      {
        title: "Subscription Box Service",
        description:
          "Specialized Shopify theme for subscription services with recurring billing and customization.",
        price: "219.00",
        categoryId: 4,
        imageUrl:
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.7",
        reviewCount: 167,
        downloadCount: 567,
        tags: ["subscription", "recurring", "customization"],
        isFree: false,
      },
      {
        title: "Restaurant & Food Delivery",
        description:
          "Restaurant-focused Shopify theme with menu builder and delivery zone management.",
        price: "189.00",
        categoryId: 4,
        imageUrl:
          "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.6",
        reviewCount: 145,
        downloadCount: 678,
        tags: ["restaurant", "menu", "delivery"],
        isFree: false,
      },
      {
        title: "B2B Wholesale Platform",
        description:
          "Professional B2B Shopify theme with wholesale pricing and bulk order management.",
        price: "249.00",
        categoryId: 4,
        imageUrl:
          "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 123,
        downloadCount: 456,
        tags: ["b2b", "wholesale", "bulk"],
        isFree: false,
      },
      {
        title: "Medical & Healthcare Store",
        description:
          "Healthcare-compliant Shopify theme for medical supplies with prescription management.",
        price: "199.00",
        categoryId: 4,
        imageUrl:
          "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.7",
        reviewCount: 134,
        downloadCount: 567,
        tags: ["medical", "healthcare", "prescription"],
        isFree: false,
      },
      {
        title: "Event Tickets & Booking",
        description:
          "Event-focused Shopify theme with calendar integration and seat selection.",
        price: "179.00",
        categoryId: 4,
        imageUrl:
          "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.6",
        reviewCount: 156,
        downloadCount: 734,
        tags: ["events", "tickets", "calendar"],
        isFree: false,
      },
      {
        title: "Photography Portfolio Store",
        description:
          "Creative Shopify theme for photographers with print sales and licensing options.",
        price: "159.00",
        categoryId: 4,
        imageUrl:
          "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 178,
        downloadCount: 823,
        tags: ["photography", "prints", "licensing"],
        isFree: false,
      },
      {
        title: "Basic Starter Theme",
        description:
          "Simple and clean Shopify starter theme with essential e-commerce features.",
        price: "0.00",
        categoryId: 4,
        imageUrl:
          "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.3",
        reviewCount: 345,
        downloadCount: 2345,
        tags: ["starter", "basic", "clean"],
        isFree: true,
      },

      // Security Tools (Category ID: 5)
      {
        title: "Advanced Penetration Testing Suite",
        description:
          "Comprehensive penetration testing toolkit with network scanning, vulnerability assessment, and exploit frameworks.",
        price: "399.00",
        originalPrice: "599.00",
        categoryId: 5,
        imageUrl:
          "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.9",
        reviewCount: 234,
        downloadCount: 1567,
        tags: ["pentest", "vulnerability", "scanning"],
        isFree: false,
      },
      {
        title: "Web Application Security Scanner",
        description:
          "Automated web application security scanner with OWASP Top 10 detection and reporting.",
        price: "249.00",
        categoryId: 5,
        imageUrl:
          "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 189,
        downloadCount: 923,
        tags: ["webapp", "owasp", "scanner"],
        isFree: false,
      },
      {
        title: "Network Traffic Analyzer",
        description:
          "Deep packet inspection tool for network traffic analysis and threat detection.",
        price: "299.00",
        categoryId: 5,
        imageUrl:
          "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.7",
        reviewCount: 156,
        downloadCount: 834,
        tags: ["network", "packet", "analysis"],
        isFree: false,
      },
      {
        title: "Password Security Auditor",
        description:
          "Advanced password security auditing tool with rainbow tables and GPU acceleration.",
        price: "179.00",
        categoryId: 5,
        imageUrl:
          "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.6",
        reviewCount: 167,
        downloadCount: 678,
        tags: ["password", "audit", "gpu"],
        isFree: false,
      },
      {
        title: "Malware Analysis Platform",
        description:
          "Comprehensive malware analysis platform with sandboxing and behavioral analysis.",
        price: "499.00",
        categoryId: 5,
        imageUrl:
          "https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.9",
        reviewCount: 134,
        downloadCount: 456,
        tags: ["malware", "sandbox", "analysis"],
        isFree: false,
      },
      {
        title: "Social Engineering Toolkit",
        description:
          "Ethical social engineering framework for security awareness training and testing.",
        price: "199.00",
        categoryId: 5,
        imageUrl:
          "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.5",
        reviewCount: 145,
        downloadCount: 567,
        tags: ["social-engineering", "awareness", "training"],
        isFree: false,
      },
      {
        title: "Wireless Security Testing Kit",
        description:
          "Comprehensive wireless security testing toolkit for WiFi and Bluetooth penetration testing.",
        price: "249.00",
        categoryId: 5,
        imageUrl:
          "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.7",
        reviewCount: 178,
        downloadCount: 734,
        tags: ["wireless", "wifi", "bluetooth"],
        isFree: false,
      },
      {
        title: "Database Security Scanner",
        description:
          "Specialized database security scanner for SQL injection and privilege escalation detection.",
        price: "199.00",
        categoryId: 5,
        imageUrl:
          "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.6",
        reviewCount: 134,
        downloadCount: 456,
        tags: ["database", "sql-injection", "scanner"],
        isFree: false,
      },
      {
        title: "Digital Forensics Toolkit",
        description:
          "Professional digital forensics toolkit for incident response and evidence collection.",
        price: "599.00",
        originalPrice: "799.00",
        categoryId: 5,
        imageUrl:
          "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 123,
        downloadCount: 345,
        tags: ["forensics", "incident", "evidence"],
        isFree: false,
      },
      {
        title: "Cryptography Security Analyzer",
        description:
          "Advanced cryptography analyzer for testing encryption implementations and key management.",
        price: "299.00",
        categoryId: 5,
        imageUrl:
          "https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.7",
        reviewCount: 156,
        downloadCount: 567,
        tags: ["crypto", "encryption", "keys"],
        isFree: false,
      },
      {
        title: "API Security Testing Framework",
        description:
          "Specialized API security testing framework with authentication bypass and injection testing.",
        price: "249.00",
        categoryId: 5,
        imageUrl:
          "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 167,
        downloadCount: 678,
        tags: ["api", "authentication", "injection"],
        isFree: false,
      },
      {
        title: "Cloud Security Assessment Tool",
        description:
          "Cloud infrastructure security assessment tool for AWS, Azure, and GCP environments.",
        price: "349.00",
        categoryId: 5,
        imageUrl:
          "https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.6",
        reviewCount: 145,
        downloadCount: 456,
        tags: ["cloud", "aws", "azure"],
        isFree: false,
      },
      {
        title: "Mobile App Security Scanner",
        description:
          "Comprehensive mobile application security scanner for iOS and Android apps.",
        price: "199.00",
        categoryId: 5,
        imageUrl:
          "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.7",
        reviewCount: 178,
        downloadCount: 734,
        tags: ["mobile", "ios", "android"],
        isFree: false,
      },
      {
        title: "Phishing Simulation Platform",
        description:
          "Phishing simulation platform for security awareness training and employee testing.",
        price: "299.00",
        categoryId: 5,
        imageUrl:
          "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.5",
        reviewCount: 134,
        downloadCount: 567,
        tags: ["phishing", "simulation", "training"],
        isFree: false,
      },
      {
        title: "Container Security Scanner",
        description:
          "Docker and Kubernetes security scanner for container vulnerability assessment.",
        price: "249.00",
        categoryId: 5,
        imageUrl:
          "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 156,
        downloadCount: 678,
        tags: ["container", "docker", "kubernetes"],
        isFree: false,
      },
      {
        title: "OSINT Intelligence Gathering",
        description:
          "Open Source Intelligence gathering toolkit for reconnaissance and information collection.",
        price: "179.00",
        categoryId: 5,
        imageUrl:
          "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.6",
        reviewCount: 167,
        downloadCount: 789,
        tags: ["osint", "reconnaissance", "intelligence"],
        isFree: false,
      },
      {
        title: "Compliance Audit Framework",
        description:
          "Automated compliance audit framework for GDPR, HIPAA, and PCI DSS requirements.",
        price: "399.00",
        categoryId: 5,
        imageUrl:
          "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.7",
        reviewCount: 123,
        downloadCount: 456,
        tags: ["compliance", "gdpr", "hipaa"],
        isFree: false,
      },
      {
        title: "Vulnerability Management System",
        description:
          "Enterprise vulnerability management system with asset discovery and patch management.",
        price: "499.00",
        categoryId: 5,
        imageUrl:
          "https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 145,
        downloadCount: 567,
        tags: ["vulnerability", "patch", "management"],
        isFree: false,
      },
      {
        title: "Security Incident Response Tool",
        description:
          "Comprehensive incident response toolkit for security breach investigation and containment.",
        price: "349.00",
        categoryId: 5,
        imageUrl:
          "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.9",
        reviewCount: 178,
        downloadCount: 678,
        tags: ["incident", "response", "investigation"],
        isFree: false,
      },
      {
        title: "Basic Security Scanner",
        description:
          "Open-source basic security scanner for common vulnerabilities and misconfigurations.",
        price: "15.00",
        categoryId: 5,
        imageUrl:
          "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.4",
        reviewCount: 345,
        downloadCount: 2345,
        tags: ["basic", "scanner", "open-source"],
        isFree: true,
      },
    ];

    productsData.forEach((prod) => {
      const product: Product = {
        id: this.currentProductId++,
        ...prod,
        originalPrice: prod.originalPrice || null,
        downloadUrl: `/downloads/${prod.title.toLowerCase().replace(/\s+/g, "-")}.zip`,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.products.set(product.id, product);
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async getUserById(id: number): Promise<User | undefined> { // Added here
    return this.getUser(id);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
  const id = this.currentUserId++;
  const hashedPassword = await bcrypt.hash(insertUser.password, 10);
  const user: User = {
    ...insertUser,
    firstName: insertUser.firstName || null,
    lastName: insertUser.lastName || null,
    password: hashedPassword, // Store hashed password
    id,
    createdAt: new Date(),
  };
  this.users.set(id, user);
  return user;
}

async removeProduct(id: number): Promise<void> {
  this.products.delete(id); // Removes the product by ID from the Map
}

async loginUser(identifier: string, password: string): Promise<User | undefined> {
  const user = (await this.getUserByUsername(identifier)) || (await this.getUserByEmail(identifier));
  if (!user) return undefined;
  const isPasswordValid = await bcrypt.compare(password, user.password);
  return isPasswordValid ? user : undefined;
}

  // Categories
  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const category: Category = {
      ...insertCategory,
      description: insertCategory.description ||'',
      id,
    };
    this.categories.set(id, category);
    return category;
  }

  // Products
  async getAllProducts(): Promise<ProductWithCategory[]> {
    const products = Array.from(this.products.values());
    return products.map((product) => ({
      ...product,
      category: this.categories.get(product.categoryId)!,
    }));
  }

  async getProductById(id: number): Promise<ProductWithCategory | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    return {
      ...product,
      category: this.categories.get(product.categoryId)!,
    };
  }


  async updateOrder(order: Order): Promise<void> {
  const existingOrder = this.orders.get(order.id);
  if (existingOrder) {
    this.orders.set(order.id, { ...existingOrder, ...order });
  }
}

  async getProductsByCategory(
    categoryId: number,
  ): Promise<ProductWithCategory[]> {
    const products = Array.from(this.products.values()).filter(
      (p) => p.categoryId === categoryId,
    );
    return products.map((product) => ({
      ...product,
      category: this.categories.get(product.categoryId)!,
    }));
  }

  async searchProducts(query: string): Promise<ProductWithCategory[]> {
  const lowercaseQuery = query.toLowerCase();
  const products = Array.from(this.products.values()).filter(
    product =>
      product.title.toLowerCase().includes(lowercaseQuery) ||
      product.description.toLowerCase().includes(lowercaseQuery) ||
      (product.tags && product.tags.some((tag: string) => tag.toLowerCase().includes(lowercaseQuery)))
  );
  return products.map(product => ({ ...product, category: this.categories.get(product.categoryId)! }));
}

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const product: Product = {
      ...insertProduct,
      originalPrice: insertProduct.originalPrice || null,
      downloadUrl: insertProduct.downloadUrl || '',
      rating: insertProduct.rating || "0",
      reviewCount: insertProduct.reviewCount || 0,
      downloadCount: insertProduct.downloadCount || 0,
      tags: insertProduct.tags || [],
      isFree: insertProduct.isFree || false,
      isActive: insertProduct.isActive || true,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.products.set(id, product);
    return product;
  }

  // Cart
  async getCartItems(userId: number): Promise<CartItemWithProduct[]> {
    const userCartItems = Array.from(this.cartItems.values()).filter(
      (item) => item.userId === userId,
    );
    return userCartItems.map((item) => {
      const product = this.products.get(item.productId)!;
      return {
        ...item,
        product: {
          ...product,
          category: this.categories.get(product.categoryId)!,
        },
      };
    });
  }

  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    const key = `${insertCartItem.userId}-${insertCartItem.productId}`;
    const existing = this.cartItems.get(key);

    if (existing) {
      existing.quantity =
        (existing.quantity || 1) + (insertCartItem.quantity || 1);
      return existing;
    }

    const id = this.currentCartItemId++;
    const cartItem: CartItem = {
      ...insertCartItem,
      quantity: insertCartItem.quantity || 1,
      id,
      createdAt: new Date(),
    };
    this.cartItems.set(key, cartItem);
    return cartItem;
  }

  async removeFromCart(userId: number, productId: number): Promise<void> {
    const key = `${userId}-${productId}`;
    this.cartItems.delete(key);
  }

  async clearCart(userId: number): Promise<void> {
    Array.from(this.cartItems.entries()).forEach(([key, item]) => {
      if (item.userId === userId) {
        this.cartItems.delete(key);
      }
    });
  }

  // Orders
  async getUserOrders(userId: number): Promise<OrderWithItems[]> {
    const userOrders = Array.from(this.orders.values()).filter(
      (order) => order.userId === userId,
    );
    return userOrders.map((order) => ({
      ...order,
      items: (this.orderItems.get(order.id) || []).map((item) => ({
        ...item,
        product: this.products.get(item.productId)!,
      })),
    }));
  }

  async getOrderById(id: number): Promise<OrderWithItems | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    return {
      ...order,
      items: (this.orderItems.get(order.id) || []).map((item) => ({
        ...item,
        product: this.products.get(item.productId)!,
      })),
    };
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.currentOrderId++;
    const order: Order = {
      ...insertOrder,
      status: insertOrder.status || "pending",
      paymentMethod: insertOrder.paymentMethod || null,
      id,
      createdAt: new Date(),
    };
    this.orders.set(id, order);
    this.orderItems.set(id, []);
    return order;
  }

  async addOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const id = this.currentOrderItemId++;
    const orderItem: OrderItem = {
      ...insertOrderItem,
      quantity: insertOrderItem.quantity || 1,
      id,
    };

    const existingItems = this.orderItems.get(orderItem.orderId) || [];
    existingItems.push(orderItem);
    this.orderItems.set(orderItem.orderId, existingItems);

    return orderItem;
  }
  async checkoutCart(userId: number): Promise<Order> {
  const cartItems = await this.getCartItems(userId);
  if (cartItems.length === 0) throw new Error("Cart is empty");

  const order: InsertOrder = {
    userId,
    totalAmount: cartItems.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0).toString(),
    status: "pending",
    paymentMethod: "credit_card", // Default for now
  };
  const newOrder = await this.createOrder(order);

  for (const cartItem of cartItems) {
    await this.addOrderItem({
      orderId: newOrder.id,
      productId: cartItem.productId,
      quantity: cartItem.quantity,
    });
  }
  await this.clearCart(userId); // Clear cart after order
  return newOrder;
}
}

export const storage = new MemStorage();