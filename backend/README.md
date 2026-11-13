<div align="center">

# 🛒 BAZARO — Backend API

### A RESTful E-Commerce API Backend (Apnar Desher Bazaar)

JWT authentication · Product catalog · Reviews · Wishlist · Cart · Orders · Cloudinary · Neon PostgreSQL

<br>

![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-6.1-092E20?style=for-the-badge&logo=django&logoColor=white)
![DRF](https://img.shields.io/badge/DRF-3.18-A30000?style=for-the-badge&logo=django&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Neon_PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

</div>

---

## 🌐 Live Links

* **Repository:** [https://github.com/Tanbir-Hasan-247/BAZARO](https://github.com/Tanbir-Hasan-247/BAZARO)
* **Live API:** [https://apibazaro-alpha.vercel.app/api/v1/](https://apibazaro-alpha.vercel.app/api/v1/)
* **Swagger Docs:** [https://apibazaro-alpha.vercel.app/swagger/](https://apibazaro-alpha.vercel.app/swagger/)
* **Web Storefront:** [https://bazaro-lime.vercel.app/](https://bazaro-lime.vercel.app/)

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [🧰 Tech Stack](#-tech-stack)
- [🗂️ Project Structure](#️-project-structure)
- [🧬 Data Model](#-data-model)
- [🚀 Getting Started](#-getting-started)
- [📡 API Reference](#-api-reference)
- [🔄 Typical User Flow](#-typical-user-flow)
- [👨‍💻 Author](#-author)

---

## ✨ Features

| | Feature | Details |
|---|---|---|
| 🔐 | **Custom User Model** | Email-based login (no username), plus address & phone number |
| 🪪 | **JWT Authentication** | Registration, login, password reset & token refresh via Djoser + SimpleJWT |
| 📦 | **Products & Categories** | Full CRUD, color/size variants, public reads, admin writes, per-category count |
| ☁️ | **Cloudinary Media** | Cloud image hosting via `django-cloudinary-storage` & `CloudinaryField` |
| 🔎 | **Search, Filter & Sort** | Search by name/description/category, filter by category & price range, order by price |
| ⭐ | **Reviews & Wishlist** | Nested 1–5 star product reviews and private per-user wishlist toggle |
| 🧺 | **Shopping Cart** | One cart per user, duplicate products merge quantities automatically |
| 🧾 | **Orders, Coupons & Tracking** | Coupon validation, stock deduction, payment gateways (Simulator / SSLCommerz / Stripe) & order tracking |
| 🛡️ | **Role-based Access** | Users see only their own orders; staff manage catalog, orders & storefront settings |

**Order statuses:** `Not Paid` · `Ready To Ship` · `Shipped` · `Delivered` · `Canceled`

---

## 🧰 Tech Stack

| Layer | Tools |
|---|---|
| **Framework** | Django 6.1, Django REST Framework 3.18 |
| **Authentication** | Djoser, djangorestframework-simplejwt |
| **Database** | Neon PostgreSQL (`DATABASE_URL`), SQLite (local/test fallback) |
| **Media & Static** | Cloudinary (`django-cloudinary-storage`), WhiteNoise, Vercel Python |
| **Filtering & Docs** | django-filter, drf-nested-routers, drf-yasg (Swagger / ReDoc) |
| **Config** | python-decouple |

---

## 🗂️ Project Structure

```text
BAZARO/backend/
├── Dokanly/       # Project settings, root URLs & Vercel WSGI entrypoint
├── api/           # Central API router, shared permissions, footer/campaign/newsletter APIs
├── product/       # Category, Product, ProductImage, Review, Wishlist
├── order/         # Cart, CartItem, Coupon, Order, OrderItem, Payment gateways & emails
├── users/         # Custom User model, manager, Djoser serializers
├── seed_data.py   # Demo users, categories, products, reviews & coupons seeder
├── requirements.txt
├── vercel.json
└── manage.py
```

---

## 🧬 Data Model

```mermaid
erDiagram
    USER ||--o| CART : owns
    USER ||--o{ ORDER : places
    USER ||--o{ REVIEW : writes
    CATEGORY ||--o{ PRODUCT : contains
    PRODUCT ||--o{ REVIEW : receives
    PRODUCT ||--o{ CARTITEM : "added as"
    PRODUCT ||--o{ ORDERITEM : "ordered as"
    CART ||--o{ CARTITEM : holds
    ORDER ||--o{ ORDERITEM : includes

    USER {
        string email UK
        string first_name
        string last_name
        text address
        string phone_number
    }
    CATEGORY {
        string name
        text description
    }
    PRODUCT {
        string name
        text description
        decimal price
        int stock
    }
    REVIEW {
        int ratings
        text comment
    }
    CART {
        uuid id PK
    }
    CARTITEM {
        int quantity
    }
    ORDER {
        uuid id PK
        string status
        decimal total_price
    }
    ORDERITEM {
        int quantity
        decimal price
        decimal total_price
    }
```

---

## 🚀 Getting Started

### 1️⃣ Clone the repository

```bash
git clone https://github.com/Tanbir-Hasan-247/BAZARO.git
cd BAZARO/backend
```

### 2️⃣ Create a virtual environment & install dependencies

```bash
python -m venv venv
source venv/bin/activate        # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
```

> 💡 Requires **Python 3.12+** (`Django 6.1`).

### 3️⃣ Configure environment variables

Copy `.env.example` to `.env` inside `backend/` (next to `manage.py`):

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

### 4️⃣ Apply migrations & seed data

```bash
python manage.py migrate
python seed_data.py
```

### 5️⃣ Run the server

```bash
python manage.py runserver 0.0.0.0:8000
```

| | Local URL | Live Production URL |
|---|---|---|
| 🌐 API | `http://127.0.0.1:8000/api/v1/` | `https://apibazaro-alpha.vercel.app/api/v1/` |
| 📘 Swagger | `http://127.0.0.1:8000/swagger/` | `https://apibazaro-alpha.vercel.app/swagger/` |
| 🛠️ Admin | `http://127.0.0.1:8000/admin/` | `https://apibazaro-alpha.vercel.app/admin/` |

---

## 📡 API Reference

**Base URL:** `/api/v1/`

Protected endpoints expect this header:

```text
Authorization: JWT <access_token>
```

### 🔐 Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/users/` | Register a new user |
| `POST` | `/auth/jwt/create/` | Login with email + password → access & refresh tokens |
| `POST` | `/auth/jwt/refresh/` | Refresh the access token |
| `GET` `PATCH` | `/auth/users/me/` | Current user profile |
| `POST` | `/auth/users/reset_password/` | Request password reset |

### 📦 Products & Categories

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/products/` | 🌍 Public | List products (paginated) |
| `POST` | `/products/` | 👑 Admin | Create a product |
| `GET` `PUT` `PATCH` `DELETE` | `/products/{id}/` | 🌍 read · 👑 write | Product detail |
| `GET` `POST` | `/products/{id}/images/` | 🌍 read · 👑 write | Product gallery images (Cloudinary) |
| `GET` `POST` | `/categories/` | 🌍 read · 👑 write | List / create categories |
| `GET` `PUT` `PATCH` `DELETE` | `/categories/{id}/` | 🌍 read · 👑 write | Category detail |

<details>
<summary><b>🔎 Query parameters for <code>/products/</code></b></summary>

<br>

| Param | Example | Description |
|---|---|---|
| `search` | `?search=laptop` | Search in name, description and category name |
| `category_id` | `?category_id=1` | Filter by category |
| `price__gt` / `price__lt` | `?price__gt=100&price__lt=500` | Filter by price range |
| `ordering` | `?ordering=-price` | Sort by price (prefix `-` for descending) |
| `page` / `page_size` | `?page=1&page_size=50` | Pagination |

</details>

### ⭐ Reviews & Wishlist

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/products/{product_id}/reviews/` | 🌍 Public | List reviews of a product |
| `POST` | `/products/{product_id}/reviews/` | 🔑 Authenticated | Add a review |
| `PUT` `PATCH` `DELETE` | `/products/{product_id}/reviews/{id}/` | ✍️ Author or staff | Edit / delete a review |
| `GET` `POST` | `/wishlist/` | 🔑 Authenticated | List / toggle saved wishlist products |

### 🧺 Cart

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/carts/` | Create or get cart for the logged-in user |
| `GET` | `/carts/{cart_id}/` | View the cart with items and total price |
| `DELETE` | `/carts/{cart_id}/` | Delete the cart |
| `GET` | `/carts/{cart_id}/items/` | List cart items |
| `POST` | `/carts/{cart_id}/items/` | Add an item → `{"product_id": 1, "quantity": 2}` |
| `PATCH` | `/carts/{cart_id}/items/{id}/` | Update quantity |
| `DELETE` | `/carts/{cart_id}/items/{id}/` | Remove an item |

### 🧾 Orders

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/orders/` | Place an order → `{"cart_id": "<uuid>"}` |
| `GET` | `/orders/` | List your orders (staff see all) |
| `GET` | `/orders/{id}/` | Order detail with line items |
| `POST` | `/orders/{id}/confirm_payment/` | Confirm order settlement |
| `GET` | `/track-order/` | Public order tracking lookup (`?order_id=...`) |

---

## 🔄 Typical User Flow

```mermaid
flowchart LR
    A[📝 Register] --> B[🔑 Login<br/>get JWT]
    B --> C[🔎 Browse &<br/>search products]
    C --> D[🧺 Create cart]
    D --> E[➕ Add items]
    E --> F[🧾 Place order]
    F --> G[⭐ Review products]
```

<details>
<summary><b>💻 Try it with cURL</b></summary>

<br>

```bash
# Replace https://apibazaro-alpha.vercel.app with http://127.0.0.1:8000 for local dev

# 1. Register
curl -X POST https://apibazaro-alpha.vercel.app/api/v1/auth/users/ \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"StrongPass123","first_name":"Tanbir","last_name":"Hasan"}'

# 2. Login
curl -X POST https://apibazaro-alpha.vercel.app/api/v1/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"StrongPass123"}'

# 3. Create a cart
curl -X POST https://apibazaro-alpha.vercel.app/api/v1/carts/ \
  -H "Authorization: JWT <access_token>"

# 4. Add an item to the cart
curl -X POST https://apibazaro-alpha.vercel.app/api/v1/carts/<cart_id>/items/ \
  -H "Authorization: JWT <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"product_id":1,"quantity":2}'

# 5. Place the order
curl -X POST https://apibazaro-alpha.vercel.app/api/v1/orders/ \
  -H "Authorization: JWT <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"cart_id":"<cart_id>"}'
```

</details>

---

## 👨‍💻 Author & Maintainer

<div align="center">

**Tanbir Hasan**

[![GitHub](https://img.shields.io/badge/GitHub-Tanbir--Hasan--247-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Tanbir-Hasan-247)

⭐ If you find this project useful, consider giving the repository a star!

</div>
