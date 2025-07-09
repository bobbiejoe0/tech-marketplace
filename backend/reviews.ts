import { Review } from './types/schema';

const MAIN_EMAIL = 'info@hatchtool.shop';

// Expanded pool of names for uniqueness
const firstNames = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Sophia', 'Jackson', 'Isabella', 'Lucas', 'Mia',
  'Elijah', 'Charlotte', 'Amelia', 'Harper', 'Ethan', 'Aria', 'James', 'Evelyn', 'Benjamin', 'Luna',
  'Alexander', 'Chloe', 'Daniel', 'Sofia', 'Henry', 'Avery', 'Ella', 'Michael', 'Scarlett', 'Mason'
];
const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Walker'
];

// Track used name combinations
const usedNames = new Set<string>();

// Generate unique name
function generateUniqueName(): { firstName: string; lastName: string } {
  let firstName: string, lastName: string, fullName: string;
  do {
    firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    fullName = `${firstName} ${lastName}`;
  } while (usedNames.has(fullName));
  usedNames.add(fullName);
  return { firstName, lastName };
}

// In-memory review storage
const reviews: Review[] = [];

function generateMockReviews(productCount: number): void {
  reviews.length = 0; // Clear existing reviews
  usedNames.clear(); // Reset used names
  for (let productId = 1; productId <= productCount; productId++) {
    const reviewCount = Math.floor(Math.random() * 3) + 1; // 1-3 reviews per product
    for (let i = 0; i < reviewCount; i++) {
      const { firstName, lastName } = generateUniqueName();
      reviews.push({
        id: reviews.length + 1,
        productId,
        userId: Math.floor(Math.random() * 1000) + 1,
        username: `${firstName} ${lastName}`,
        text: `This is a great product! I love using it for my ${['daily tasks', 'projects', 'hobbies'][Math.floor(Math.random() * 3)]}.`,
        rating: Math.floor(Math.random() * 3) + 3, // 3-5 stars
        createdAt: new Date().toISOString(),
      });
    }
  }
}

// Initialize reviews for at least 10 products
generateMockReviews(10);

export function getReviewsByProductId(productId: number): { reviews: Review[]; contactEmail: string } {
  return {
    reviews: reviews.filter((review) => review.productId === productId),
    contactEmail: MAIN_EMAIL,
  };
}