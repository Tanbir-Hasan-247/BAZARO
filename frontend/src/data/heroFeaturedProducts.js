/* Central fallback catalog synchronized with BAZARO seeded products */
import defaultProductImg from "../assets/default-product.png";

export const FALLBACK_FEATURED_PRODUCTS = [
  {
    id: 1,
    name: "Next-Gen ANC Headphones",
    description:
      "Active noise cancellation with 40-hour ultra battery life and deep bass audio.",
    price: 89.99,
    stock: 45,
    categoryName: "Electronics",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=85&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Minimalist Smart Watch Series 8",
    description:
      "Fitness tracker with AMOLED always-on display, heart-rate monitor, and GPS tracking.",
    price: 129.5,
    stock: 28,
    categoryName: "Electronics",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=85&auto=format&fit=crop",
  },
  {
    id: 6,
    name: "Classic Denim Designer Jacket",
    description:
      "Premium washed cotton denim jacket with reinforced seams and modern slim fit styling.",
    price: 54.0,
    stock: 60,
    categoryName: "Fashion",
    image:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=85&auto=format&fit=crop",
  },
  {
    id: 8,
    name: "Breathable Athletic Running Shoes",
    description:
      "Lightweight responsive cushioning with breathable mesh upper for runners and athletes.",
    price: 64.5,
    stock: 40,
    categoryName: "Fashion",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=85&auto=format&fit=crop",
  },
  {
    id: 10,
    name: "Automatic Drip Coffee Maker",
    description:
      "Stainless steel programmable drip coffee maker with brew-strength selector and thermal carafe.",
    price: 68.0,
    stock: 25,
    categoryName: "Home Appliances",
    image:
      "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=85&auto=format&fit=crop",
  },
  {
    id: 12,
    name: "Smart Robotic Vacuum Cleaner",
    description:
      "Automated floor mapping with obstacle sensors, strong suction, and app-controlled scheduling.",
    price: 185.0,
    stock: 18,
    categoryName: "Home Appliances",
    image:
      "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&q=85&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "Ultra-Slim Pro Laptop 15",
    description:
      "Lightweight aluminum body with 16GB RAM, 512GB NVMe SSD, and vivid Retina-grade screen.",
    price: 899.0,
    stock: 15,
    categoryName: "Electronics",
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=85&auto=format&fit=crop",
  },
  {
    id: 13,
    name: "Atomic Habits Hardcover Edition",
    description:
      "Proven framework for improving every day by bestselling author James Clear.",
    price: 18.99,
    stock: 80,
    categoryName: "Books & Stationery",
    image:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=85&auto=format&fit=crop",
  },
];

export function normalizeHeroProduct(product, categoryMap = {}) {
  const dbImage = product.images?.[0]?.image || product.image;
  const categoryName =
    typeof product.category === "object"
      ? product.category?.name
      : product.categoryName || categoryMap[product.category] || "Royal Curated";

  return {
    ...product,
    price: parseFloat(product.price) || 0,
    image: dbImage || defaultProductImg,
    categoryName,
  };
}
