import { Product } from './types/schema';

// Define Review type
export interface Review {
  id: number;
  reviewerName: string;
  reviewerEmail: string;
  reviewText: string;
  rating: number;
  createdAt: Date;
}

export class ReviewPool {
  private reviews: Review[];
  private currentReviewId: number;
  private reviewTemplates: { text: string; rating: number; categoryIds: number[] }[];

  constructor() {
    this.reviews = [];
    this.currentReviewId = 1;
    this.reviewTemplates = [
      // App Development (categoryId: 1)
      { text: "This app template saved me weeks of coding! Perfect for Naija startups.", rating: 5, categoryIds: [1] },
      { text: "Clean code and easy to customize. Used it for my mobile app project!", rating: 4, categoryIds: [1] },
      { text: "Great components, but I had to tweak the auth flow a bit.", rating: 4, categoryIds: [1] },
      { text: "The UI is sleek and modern. My clients in Lagos loved it!", rating: 5, categoryIds: [1] },
      { text: "Solid template, but documentation could be more detailed.", rating: 3, categoryIds: [1] },
      // Trading Bots (categoryId: 2)
      { text: "This bot made me consistent profits on Binance. Amazing!", rating: 5, categoryIds: [2] },
      { text: "Setup was tricky, but the support team was quick to help.", rating: 4, categoryIds: [2] },
      { text: "Customizable strategies. Perfect for crypto trading in Nigeria.", rating: 5, categoryIds: [2] },
      { text: "Good bot, but needs better error handling for API issues.", rating: 3, categoryIds: [2] },
      { text: "Automated my trades perfectly. Worth every naira!", rating: 5, categoryIds: [2] },
      // Website Tools (categoryId: 3)
      { text: "This tool made my website deployment a breeze. Highly recommend!", rating: 5, categoryIds: [3] },
      { text: "Great for building fast websites for Naija businesses.", rating: 4, categoryIds: [3] },
      { text: "Easy to use, but I needed more advanced features.", rating: 3, categoryIds: [3] },
      { text: "The drag-and-drop builder is a game-changer for web devs!", rating: 5, categoryIds: [3] },
      { text: "Solid tool, but integration with some CMS was tricky.", rating: 4, categoryIds: [3] },
      // Shopify Themes (categoryId: 4)
      { text: "Transformed my Shopify store! Looks professional and clean.", rating: 5, categoryIds: [4] },
      { text: "Responsive theme, but customization took some learning.", rating: 4, categoryIds: [4] },
      { text: "Perfect for my e-commerce store in Abuja. Sales are up!", rating: 5, categoryIds: [4] },
      { text: "Great design, but I wish it had more color options.", rating: 4, categoryIds: [4] },
      { text: "The theme boosted my store’s conversion rate. Love it!", rating: 5, categoryIds: [4] },
      // Security Tools (categoryId: 5)
      { text: "Powerful toolkit for ethical hacking. Used it for a client project.", rating: 5, categoryIds: [5] },
      { text: "Comprehensive tools, but requires some expertise to use.", rating: 4, categoryIds: [5] },
      { text: "Helped me secure my client’s network. Top-notch!", rating: 5, categoryIds: [5] },
      { text: "Great for pen testing, but the UI could be friendlier.", rating: 3, categoryIds: [5] },
      { text: "Essential for cybersecurity pros in Nigeria!", rating: 5, categoryIds: [5] },
      // Generic reviews (applicable to all categories)
      { text: "Amazing product! Exceeded my expectations.", rating: 5, categoryIds: [1, 2, 3, 4, 5] },
      { text: "Good value for money. Will buy again!", rating: 4, categoryIds: [1, 2, 3, 4, 5] },
      { text: "Really helpful for my project. Support was great!", rating: 5, categoryIds: [1, 2, 3, 4, 5] },
      { text: "Solid tool, but could use more documentation.", rating: 3, categoryIds: [1, 2, 3, 4, 5] },
      { text: "Perfect for my needs. Fast delivery!", rating: 5, categoryIds: [1, 2, 3, 4, 5] },
      { text: "Very useful, but setup took longer than expected.", rating: 4, categoryIds: [1, 2, 3, 4, 5] },
      { text: "Game-changer for my business. Highly recommend!", rating: 5, categoryIds: [1, 2, 3, 4, 5] },
      { text: "Good product, but I needed more customization options.", rating: 4, categoryIds: [1, 2, 3, 4, 5] },
      { text: "Support team was quick to resolve my issues.", rating: 5, categoryIds: [1, 2, 3, 4, 5] },
      { text: "Great for beginners and pros alike!", rating: 4, categoryIds: [1, 2, 3, 4, 5] },
      { text: "Really boosted my productivity. Love it!", rating: 5, categoryIds: [1, 2, 3, 4, 5] },
      { text: "Decent tool, but could improve on speed.", rating: 3, categoryIds: [1, 2, 3, 4, 5] },
      { text: "Perfect for my startup in Lagos!", rating: 5, categoryIds: [1, 2, 3, 4, 5] },
      { text: "Easy to use and great customer support.", rating: 5, categoryIds: [1, 2, 3, 4, 5] },
      { text: "Good, but I encountered a few bugs.", rating: 3, categoryIds: [1, 2, 3, 4, 5] },
      { text: "Transformed how I work. Highly recommended!", rating: 5, categoryIds: [1, 2, 3, 4, 5] },
      { text: "Solid product, but the learning curve was steep.", rating: 4, categoryIds: [1, 2, 3, 4, 5] },
      { text: "Amazing tool for Naija developers!", rating: 5, categoryIds: [1, 2, 3, 4, 5] },
      { text: "Great features, but I needed more tutorials.", rating: 4, categoryIds: [1, 2, 3, 4, 5] },
      { text: "Super reliable and worth the price!", rating: 5, categoryIds: [1, 2, 3, 4, 5] },
      { text: "Good tool, but customer support could be faster.", rating: 3, categoryIds: [1, 2, 3, 4, 5] },
      { text: "Helped me scale my business. Fantastic!", rating: 5, categoryIds: [1, 2, 3, 4, 5] },
      { text: "Very intuitive and easy to integrate.", rating: 4, categoryIds: [1, 2, 3, 4, 5] },
      { text: "Perfect for my e-commerce project!", rating: 5, categoryIds: [1, 2, 3, 4, 5] },
      { text: "Great, but I had to tweak it for my needs.", rating: 4, categoryIds: [1, 2, 3, 4, 5] },
    ];
    this.seedReviews();
  }

  private seedReviews() {
    const reviewerNames = [
      "Chinedu Okeke", "Aisha Mohammed", "Tolu Adeyemi", "Tunde Adebayo", "Ngozi Eze",
      "Emeka Nwosu", "Fatima Bello", "Segun Olatunji", "Chioma Igwe", "Bola Afolabi",
      "Kemi Salami", "David Okonkwo", "Amaka Nnaji", "Ifeanyi Chukwu", "Zainab Yusuf",
      "Obinna Eze", "Funke Akindele", "Sola Ogunleye", "Nkechi Obi", "Yemi Alade",
      "Chukwuma Okoro", "Hassan Umar", "Esther Okafor", "Gbenga Adewale", "Uche Nnamdi",
      "Rukayat Ibrahim", "Tobi Bakare", "Chisom Eke", "Musa Danjuma", "Adaobi Okoye",
      "Femi Adebayo", "Halima Sani", "Ikenna Ogu", "Joyce Kalu", "Abdul Bello",
      "Chiamaka Ude", "Oluwaseun Ade", "Zara Muhammed", "Kelechi Ibe", "Temitope Ojo",
      "Blessing Okoro", "Ibrahim Musa", "Clara Ekeh", "Samson Dike", "Mercy Aigbe",
      "Omar Faruk", "Nnenna Okoli", "Tayo Odumosu", "Aminu Lawal", "Ezinne Akudo"
    ];

    this.reviewTemplates.forEach((template, index) => {
      const reviewer = reviewerNames[index % reviewerNames.length];
      const email = `${reviewer.toLowerCase().replace(/\s+/g, ".")}@toolhatch.shop`;
      this.reviews.push({
        id: this.currentReviewId++,
        reviewerName: reviewer,
        reviewerEmail: email,
        reviewText: template.text,
        rating: template.rating,
        createdAt: new Date(),
      });
    });
  }

  // Get 2-3 random reviews for a product, prioritizing category-specific reviews
  public getReviewsForProduct(product: Product): Review[] {
    const categorySpecific = this.reviews.filter(review => {
      const template = this.reviewTemplates.find(t => t.text === review.reviewText);
      return template?.categoryIds.includes(product.categoryId);
    });
    const generic = this.reviews.filter(review => {
      const template = this.reviewTemplates.find(t => t.text === review.reviewText);
      return template?.categoryIds.includes(1) && template?.categoryIds.length > 1;
    });

    // Combine and shuffle reviews
    const allReviews = [...categorySpecific, ...generic];
    const shuffled = allReviews.sort(() => Math.random() - 0.5);
    const count = Math.floor(Math.random() * 2) + 2; // Randomly pick 2 or 3
    return shuffled.slice(0, count);
  }
}

// Export a singleton instance
export const reviewPool = new ReviewPool();