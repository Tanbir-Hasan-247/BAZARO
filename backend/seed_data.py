import os
import sys
import django
from decimal import Decimal

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Dokanly.settings')
django.setup()

from django.contrib.auth import get_user_model
from product.models import Category, Product, ProductImage, Review
from order.models import Coupon

User = get_user_model()

def seed():
    print("=== Seeding BAZARO Database ===")

    # 1. Create Superusers (both admin@bazaro.com and admin@dokanly.com)
    for admin_email in ["admin@bazaro.com", "admin@dokanly.com"]:
        admin_pass = "admin123456"
        admin_user, created = User.objects.get_or_create(
            email=admin_email,
            defaults={
                "first_name": "Admin",
                "last_name": "Bazaro",
                "is_staff": True,
                "is_superuser": True,
                "address": "BAZARO HQ, Dhaka",
                "phone_number": "+8801700000001",
            }
        )
        if created:
            admin_user.set_password(admin_pass)
            admin_user.save()
            print(f"[+] Created superuser: {admin_email} (password: {admin_pass})")
        else:
            print(f"[*] Superuser {admin_email} already exists")

    # 2. Create Demo Customers (both user@bazaro.com and user@dokanly.com)
    for demo_email in ["user@bazaro.com", "user@dokanly.com"]:
        demo_pass = "user123456"
        demo_user, created = User.objects.get_or_create(
            email=demo_email,
            defaults={
                "first_name": "Tanbir",
                "last_name": "Hasan",
                "address": "Dhaka, Bangladesh",
                "phone_number": "+8801700000002",
            }
        )
        if created:
            demo_user.set_password(demo_pass)
            demo_user.save()
            print(f"[+] Created customer user: {demo_email} (password: {demo_pass})")
        else:
            print(f"[*] Customer user {demo_email} already exists")

    # 3. Categories
    categories_data = [
        {"id": 1, "name": "Electronics", "description": "Smart gadgets, audio & mobile accessories"},
        {"id": 2, "name": "Fashion", "description": "Trending apparel, jackets, shoes & bags"},
        {"id": 3, "name": "Home Appliances", "description": "Modern kitchenware, coffee makers & smart living"},
        {"id": 4, "name": "Books & Stationery", "description": "Bestselling books, journals & office supplies"},
        {"id": 5, "name": "Watches & Horology", "description": "Swiss chronographs, automatic tourbillons & collector timepieces"},
        {"id": 6, "name": "Oud & Fragrances", "description": "Royal Arabian oud, French extrait de parfum & signature scents"},
        {"id": 7, "name": "Luxury Bags & Accessories", "description": "Quilted leather handbags, mulberry silk scarves & fine belts"},
        {"id": 8, "name": "Pro Studio & Gaming", "description": "Mirrorless 4K cameras, 5K workstations & next-gen consoles"},
    ]

    cat_objs = {}
    for cdata in categories_data:
        cat, _ = Category.objects.update_or_create(
            id=cdata["id"],
            defaults={"name": cdata["name"], "description": cdata["description"]}
        )
        cat_objs[cat.id] = cat
        print(f"[+] Category: {cat.name}")

    # 4. Products & Images
    products_data = [
        # Electronics
        {
            "id": 1,
            "name": "Next-Gen ANC Headphones",
            "description": "Active noise cancellation with 40-hour ultra battery life and deep bass audio.",
            "price": Decimal("89.99"),
            "stock": 45,
            "category_id": 1,
            "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=85&auto=format&fit=crop"
        },
        {
            "id": 2,
            "name": "Minimalist Smart Watch Series 8",
            "description": "Fitness tracker with AMOLED always-on display, heart-rate monitor, and GPS tracking.",
            "price": Decimal("129.50"),
            "stock": 28,
            "category_id": 1,
            "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=85&auto=format&fit=crop"
        },
        {
            "id": 3,
            "name": "Ultra-Slim Pro Laptop 15",
            "description": "Lightweight aluminum body with 16GB RAM, 512GB NVMe SSD, and vivid Retina-grade screen.",
            "price": Decimal("899.00"),
            "stock": 15,
            "category_id": 1,
            "image": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=85&auto=format&fit=crop"
        },
        {
            "id": 4,
            "name": "Portable Bluetooth Speaker",
            "description": "360-degree immersive surround sound with IPX7 waterproof rating and 24h playtime.",
            "price": Decimal("49.99"),
            "stock": 50,
            "category_id": 1,
            "image": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=85&auto=format&fit=crop"
        },
        {
            "id": 5,
            "name": "RGB Mechanical Gaming Keyboard",
            "description": "Hot-swappable linear mechanical switches with customizable RGB per-key backlighting.",
            "price": Decimal("74.99"),
            "stock": 35,
            "category_id": 1,
            "image": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=85&auto=format&fit=crop"
        },
        # Fashion
        {
            "id": 6,
            "name": "Classic Denim Designer Jacket",
            "description": "Premium washed cotton denim jacket with reinforced seams and modern slim fit styling.",
            "price": Decimal("54.00"),
            "stock": 60,
            "category_id": 2,
            "image": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=85&auto=format&fit=crop"
        },
        {
            "id": 7,
            "name": "Urban Commuter Canvas Backpack",
            "description": "Water-resistant canvas laptop backpack with USB charging pass-through and anti-theft zipper.",
            "price": Decimal("42.99"),
            "stock": 35,
            "category_id": 2,
            "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=85&auto=format&fit=crop"
        },
        {
            "id": 8,
            "name": "Breathable Athletic Running Shoes",
            "description": "Lightweight responsive cushioning with breathable mesh upper for runners and athletes.",
            "price": Decimal("64.50"),
            "stock": 40,
            "category_id": 2,
            "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=85&auto=format&fit=crop"
        },
        {
            "id": 9,
            "name": "Polarized Classic Sunglasses",
            "description": "UV400 protection with lightweight metal frame and glare-reduction polarized lenses.",
            "price": Decimal("29.90"),
            "stock": 70,
            "category_id": 2,
            "image": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=85&auto=format&fit=crop"
        },
        # Home Appliances
        {
            "id": 10,
            "name": "Automatic Drip Coffee Maker",
            "description": "Stainless steel programmable drip coffee maker with brew-strength selector and thermal carafe.",
            "price": Decimal("68.00"),
            "stock": 25,
            "category_id": 3,
            "image": "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=85&auto=format&fit=crop"
        },
        {
            "id": 11,
            "name": "Digital Touchscreen Air Fryer 5.5L",
            "description": "Rapid hot air circulation technology for healthy oil-free crispy cooking with 8 presets.",
            "price": Decimal("95.50"),
            "stock": 22,
            "category_id": 3,
            "image": "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&q=85&auto=format&fit=crop"
        },
        {
            "id": 12,
            "name": "Smart Robotic Vacuum Cleaner",
            "description": "Automated floor mapping with obstacle sensors, strong suction, and app-controlled scheduling.",
            "price": Decimal("185.00"),
            "stock": 18,
            "category_id": 3,
            "image": "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&q=85&auto=format&fit=crop"
        },
        # Books & Stationery
        {
            "id": 13,
            "name": "Atomic Habits Hardcover Edition",
            "description": "Proven framework for improving every day by bestselling author James Clear.",
            "price": Decimal("18.99"),
            "stock": 80,
            "category_id": 4,
            "image": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=85&auto=format&fit=crop"
        },
        {
            "id": 14,
            "name": "The Psychology of Money",
            "description": "Timeless lessons on wealth, greed, and happiness by Morgan Housel.",
            "price": Decimal("16.50"),
            "stock": 65,
            "category_id": 4,
            "image": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=85&auto=format&fit=crop"
        },
        {
            "id": 15,
            "name": "Deep Work - Cal Newport",
            "description": "Rules for focused success in a distracted world by Cal Newport.",
            "price": Decimal("17.20"),
            "stock": 45,
            "category_id": 4,
            "image": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=85&auto=format&fit=crop"
        },
        {
            "id": 16,
            "name": "Sovereign Tourbillon Gold & Obsidian Watch",
            "description": "Hand-finished mechanical skeleton tourbillon timepiece featuring an 18k champagne-gold bezel, sapphire crystal, and obsidian alligator strap.",
            "price": Decimal("1290.00"),
            "stock": 12,
            "category_id": 5,
            "image": "/products/sovereign-watch.jpg"
        },
        {
            "id": 17,
            "name": "Schaffhausen Heritage Silver Chronograph",
            "description": "Precision Swiss-style automatic dress chronograph with sunray silver-white dial, dual sub-registers, and stitched cognac leather strap.",
            "price": Decimal("849.00"),
            "stock": 16,
            "category_id": 5,
            "image": "/products/heritage-chronograph.jpg"
        },
        {
            "id": 18,
            "name": "Oud Royale Extrait de Parfum 50ml",
            "description": "Aged Cambodian agarwood, smoked saffron, and royal ambergris housed in a faceted amber crystal flacon with sculpted gold cap (50ml / 1.7 fl. oz.).",
            "price": Decimal("185.00"),
            "stock": 24,
            "category_id": 6,
            "image": "/products/oud-royale-perfume.jpg"
        },
        {
            "id": 19,
            "name": "Coco Noir Eau de Parfum Intense 100ml",
            "description": "Luminous Oriental-woody composition blending Calabrian bergamot, May rose, and Indonesian patchouli in a jet-black lacquered glass flacon.",
            "price": Decimal("168.00"),
            "stock": 20,
            "category_id": 6,
            "image": "/products/coco-noir-parfum.jpg"
        },
        {
            "id": 20,
            "name": "Chanel N°5 Classic Eau de Parfum 100ml",
            "description": "Iconic floral aldehyde bouquet pairing Grasse jasmine, neroli, and sandalwood warmth inside a timeless faceted crystal flacon.",
            "price": Decimal("175.00"),
            "stock": 18,
            "category_id": 6,
            "image": "/products/chanel-n5-parfum.jpg"
        },
        {
            "id": 21,
            "name": "Matelasse Obsidian Leather Camera Crossbody",
            "description": "Chevron-quilted full-grain black calfskin crossbody bag accented with brushed antique-gold monogram hardware and chain strap.",
            "price": Decimal("495.00"),
            "stock": 10,
            "category_id": 7,
            "image": "/products/noir-quilted-crossbody.jpg"
        },
        {
            "id": 22,
            "name": "Crimson Structured Top-Handle Calfskin Satchel",
            "description": "Hand-stitched coral-crimson structured silhouette crafted from supple Italian calfskin with palladium push-lock clasp and shoulder strap.",
            "price": Decimal("425.00"),
            "stock": 14,
            "category_id": 7,
            "image": "/products/crimson-leather-satchel.jpg"
        },
        {
            "id": 23,
            "name": "Champagne Heritage Paisley Mulberry Silk Scarf",
            "description": "100% hand-rolled 16-momme mulberry silk carre woven with champagne-gold paisley motifs on warm ivory twill.",
            "price": Decimal("145.00"),
            "stock": 28,
            "category_id": 7,
            "image": "/products/champagne-silk-scarf.jpg"
        },
        {
            "id": 24,
            "name": "Cognac Artisan Full-Grain Leather Belt",
            "description": "Vegetable-tanned cognac leather dress belt finished with hand-burnished edges and a solid brushed gunmetal roller buckle.",
            "price": Decimal("68.00"),
            "stock": 42,
            "category_id": 7,
            "image": "/products/cognac-artisan-belt.jpg"
        },
        {
            "id": 25,
            "name": "Sony Alpha Mirrorless 4K Studio Camera Kit",
            "description": "Full-frame mirrorless flagship body paired with fast prime cinema lenses for commercial photography and 4K HDR production.",
            "price": Decimal("1899.00"),
            "stock": 8,
            "category_id": 8,
            "image": "/products/sony-alpha-camera-kit.jpg"
        },
        {
            "id": 26,
            "name": "PlayStation 5 Disc Edition Atelier Bundle",
            "description": "Ultra-high-speed custom NVMe SSD console supporting ray-traced 4K 120Hz fidelity, 3D Tempest audio, and DualSense haptic immersion.",
            "price": Decimal("549.00"),
            "stock": 15,
            "category_id": 8,
            "image": "/products/ps5-horizon-console.jpg"
        },
        {
            "id": 27,
            "name": "Retina 5K Anodized Studio Desktop Display",
            "description": "27-inch calibrated 5K P3 glass workstation in anodized aluminum unibody with wireless aluminum keyboard and Multi-Touch trackpad.",
            "price": Decimal("1599.00"),
            "stock": 9,
            "category_id": 8,
            "image": "/products/studio-5k-workstation.jpg"
        },
        {
            "id": 28,
            "name": "Apex Titanium 5G Edge Flagship Smartphone",
            "description": "6.7-inch 120Hz curved AMOLED edge-to-edge display with pro-grade periscope optics, stereo acoustics, and 5000mAh all-day battery.",
            "price": Decimal("949.00"),
            "stock": 18,
            "category_id": 1,
            "image": "/products/obsidian-flagship-5g.jpg"
        },
        {
            "id": 29,
            "name": "Ochre Hamilton Canvas Heritage Low Sneakers",
            "description": "Heavyweight duck-canvas and wool-lined streetwear sneakers in warm caramel ochre with tonal Air-cushioned heritage sole.",
            "price": Decimal("165.00"),
            "stock": 22,
            "category_id": 2,
            "image": "/products/carhartt-canvas-sneakers.jpg"
        },
        {
            "id": 30,
            "name": "Single-Origin Royal Espresso Blend & Ceramic Cup Set",
            "description": "Small-batch dark caramel roast Arabica coffee paired with heavy-walled stoneware espresso cups engineered for dense golden crema.",
            "price": Decimal("48.50"),
            "stock": 60,
            "category_id": 3,
            "image": "/products/artisan-espresso-roast.jpg"
        },
    ]

    variant_presets = {
        1: (["Obsidian Black", "Champagne Gold", "Titanium Silver"], ["One Size"]),
        2: (["Obsidian Slate", "Warm Sand"], ["41mm", "45mm"]),
        6: (["Obsidian Noir", "Cognac Brown", "Royal Olive"], ["S", "M", "L", "XL"]),
        16: (["18K Gold / Onyx", "Rose Gold / Espresso"], ["40mm", "42mm"]),
        18: (["Crystal Amber Flacon", "Reserve Black Edition"], ["50ml", "100ml"]),
        21: (["Noir Quilted Calfskin", "Burgundy Atelier"], ["Mini", "Classic Medium"]),
        23: (["Champagne Ivory", "Imperial Gold"], ["90 × 90 cm"]),
        25: (["Obsidian Body Only", "24-70mm GM II Kit"], ["Standard Vault"]),
        29: (["Caramel Ochre", "Matte Espresso"], ["EU 40", "EU 41", "EU 42", "EU 43"]),
    }

    gallery_presets = {
        16: ["/products/sovereign-watch.jpg", "/products/heritage-chronograph.jpg"],
        18: ["/products/oud-royale-perfume.jpg", "/products/coco-noir-parfum.jpg"],
        21: ["/products/noir-quilted-crossbody.jpg", "/products/crimson-leather-satchel.jpg"],
        29: ["/products/carhartt-canvas-sneakers.jpg"],
    }

    for pdata in products_data:
        colors, sizes = variant_presets.get(pdata["id"], (["Atelier Edition"], ["Standard"]))
        prod, _ = Product.objects.update_or_create(
            id=pdata["id"],
            defaults={
                "name": pdata["name"],
                "description": pdata["description"],
                "price": pdata["price"],
                "stock": pdata["stock"],
                "category_id": pdata["category_id"],
                "available_colors": colors,
                "available_sizes": sizes,
            }
        )
        ProductImage.objects.filter(product=prod).delete()
        gallery_urls = gallery_presets.get(pdata["id"], [pdata["image"]])
        for img_url in gallery_urls:
            ProductImage.objects.create(product=prod, image=img_url)
        print(f"[+] Product #{prod.id}: {prod.name} (${prod.price})")

    # 5. Reviews
    reviews_data = [
        {"product_id": 1, "user": demo_user, "ratings": 5, "comment": "Outstanding noise cancellation and crisp sound!"},
        {"product_id": 1, "user": admin_user, "ratings": 4, "comment": "Great battery life, comfortable for long work hours."},
        {"product_id": 2, "user": demo_user, "ratings": 5, "comment": "Battery lasts all week. Screen is gorgeous!"},
        {"product_id": 6, "user": demo_user, "ratings": 5, "comment": "Fit is perfect and material feels very premium."},
        {"product_id": 11, "user": demo_user, "ratings": 5, "comment": "Game changer in the kitchen! Cooks fries in 12 mins."},
        {"product_id": 13, "user": demo_user, "ratings": 5, "comment": "One of the best self-improvement books ever written."},
        {"product_id": 16, "user": demo_user, "ratings": 5, "comment": "The skeleton movement and gold bevel look extraordinary on the wrist."},
        {"product_id": 18, "user": demo_user, "ratings": 5, "comment": "Rich smoky oud projection that easily lasts over 14 hours."},
        {"product_id": 18, "user": admin_user, "ratings": 5, "comment": "Signature royal scent — heirloom presentation bottle too."},
        {"product_id": 21, "user": demo_user, "ratings": 5, "comment": "Supple quilted calfskin and antique brass chain feel truly bespoke."},
        {"product_id": 23, "user": demo_user, "ratings": 5, "comment": "Silk weight and rolled borders feel effortless against tailoring."},
        {"product_id": 25, "user": demo_user, "ratings": 5, "comment": "Autofocus lock and lens sharpness elevate our studio shoots immediately."},
    ]

    Review.objects.all().delete()
    for rdata in reviews_data:
        Review.objects.create(
            product_id=rdata["product_id"],
            user=rdata["user"],
            ratings=rdata["ratings"],
            comment=rdata["comment"]
        )
    print(f"[+] Created {len(reviews_data)} sample reviews")

    # 6. Promo Coupons
    coupons_data = [
        {"code": "BAZARO20", "discount_percent": 20, "is_active": True},
        {"code": "DOKANLY20", "discount_percent": 20, "is_active": True},
    ]
    for cdata in coupons_data:
        Coupon.objects.update_or_create(
            code=cdata["code"],
            defaults={
                "discount_percent": cdata["discount_percent"],
                "is_active": cdata["is_active"],
            },
        )
        print(f"[+] Coupon active: {cdata['code']} ({cdata['discount_percent']}% OFF)")

    print("\n=== Seeding Finished Successfully! ===")
    print(f"Total Categories: {Category.objects.count()}")
    print(f"Total Products:   {Product.objects.count()}")
    print(f"Total Reviews:    {Review.objects.count()}")
    print(f"Total Coupons:    {Coupon.objects.count()}")
    print(f"Total Users:      {User.objects.count()}")

if __name__ == '__main__':
    seed()
