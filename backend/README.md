# 🥗 MealLens Backend 🍽️

> **Your AI-powered kitchen assistant!**  
> Like a smart chef's helper, MealLens takes your ingredients or food photos and whips up meal plans, detects foods, and manages your sessions—so you can focus on enjoying your meals!  
> _Think of it as your digital sous-chef, always ready to help!_

---

## 🚀 Features at a Glance

- 🧑‍🍳 **AI Food Detection**: Snap a pic or list ingredients, get food names and recipes!
- 📅 **Smart Meal Planning**: Personalized meal plans from your pantry or fridge.
- 🗂️ **Session Management**: Keeps your cooking journey organized.
- 🔐 **Flexible Authentication**: Supports both Firebase and Supabase logins.
- 📝 **Feedback & History**: Save, review, and improve your meal plans.
- 💳 **Payment System**: Ready-to-use Paystack integration with subscription plans (disabled by default).

---

## 🛠️ Quick Start Guide

### 1️⃣ Clone & Enter the Project

```bash
git clone <your-repo-url>
cd backend
```

### 2️⃣ 🐍 Set Up Your Python Environment

```bash
python -m venv venv
source venv/bin/activate
```

### 3️⃣ 📦 Install All Dependencies

```bash
pip install -r requirements.txt
```

### 4️⃣ 🔑 Environment Setup

- Copy your Firebase and Supabase credentials into the project root.
- Create a `.env` file with:
  ```
  SUPABASE_URL=your_supabase_url
  SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
  FIREBASE_SERVICE_ACCOUNT_JSON=meallensai-40f6f-firebase-adminsdk-fbsvc-0f6274190b.json
  ```

### 5️⃣ 🏁 Run the Server

```bash
python app.py
```
> The server will start on `http://localhost:5000` by default.

---

## 📚 API Overview

### 🥘 Food Detection

- `POST /api/food_detection/food_detect`  
  _Detect foods from an image or ingredient list._

- `POST /api/food_detection/food_detect_resources`  
  _Get YouTube/Google resources for detected foods._

### 📅 Meal Planning

- `POST /api/meal_plan/smart_plan`  
  _Generate a meal plan from your ingredients or image._

- `POST /api/meal_plan/meal_plan`  
  _Save your meal plan history._

- `GET /api/meal_plan/meal_plan`  
  _Retrieve your meal plan history._

### 🔐 Authentication

- `POST /api/login`  
  _Login with Firebase or Supabase._

- `POST /api/register`  
  _Register a new user (Supabase, with optional Firebase linking)._

- `GET /api/test_auth`  
  _Test your authentication token._

> _See [`docs/api_auth.md`](docs/api_auth.md) for full authentication details!_

### 💳 Payment System (Optional)

The payment system is included but disabled by default. To enable it:

1. Add Paystack credentials to your `.env`:
   ```
   PAYSTACK_SECRET_KEY=sk_test_...
   PAYSTACK_PUBLIC_KEY=pk_test_...
   ```

2. Run the subscription database migration:
   ```bash
   python scripts/apply_migrations.py
   ```

3. Payment endpoints will be available at `/api/payment/*`

> _See [`docs/payment_api.md`](docs/payment_api.md) for complete payment documentation!_

---

## 🗃️ Data Structures

- **MealPlan**
  ```json
  { "day": "Monday", "breakfast": "...", "lunch": "...", "dinner": "...", "snack": "..." }
  ```
- **ResourceItem**
  ```json
  { "title": "...", "link": "...", "description": "..." }
  ```
- **HistoryItem**
  ```json
  { "date": "...", "mealPlan": [...], "inputType": "image|ingredient_list", "ingredients": "..." }
  ```

---

## 🏗️ Project Structure

```
backend/
  ├── app.py                # Main Flask app
  ├── routes/               # API route blueprints
  ├── services/             # Auth, Supabase & Payment services
  ├── utils/                # Utility functions
  ├── scripts/              # DB setup & migration scripts
  ├── docs/                 # API documentation
  └── requirements.txt      # Python dependencies
```

---

## 🧩 Requirements

- Python 3.8+
- Flask, flask-cors, werkzeug, supabase, firebase-admin, marshmallow, requests

---

## 🧑‍💻 Developer Notes

- Food detection and recipes use mock data (for now).
- Sessions are stored on the filesystem.
- Database integration coming soon!
- For DB setup, see scripts in `/scripts`.
- **Payment system is ready but disabled by default** - add Paystack credentials to enable.

---

## 💳 Enabling Payment Features

The payment system is fully implemented and ready to use:

### **Subscription Plans Available:**
- **Free**: ₦0/month (5 detections, 3 meal plans, 10 recipes)
- **Basic**: ₦1,000/month (50 detections, 20 meal plans, 100 recipes)
- **Premium**: ₦2,500/month (200 detections, 100 meal plans, 500 recipes)
- **Enterprise**: ₦5,000/month (Unlimited + API access)

### **To Enable Payments:**
1. Get Paystack API keys from [Paystack Dashboard](https://dashboard.paystack.com)
2. Add to `.env`:
   ```
   PAYSTACK_SECRET_KEY=sk_test_...
   PAYSTACK_PUBLIC_KEY=pk_test_...
   ```
3. Run database migration: `python scripts/apply_migrations.py`
4. Restart the server

### **Features Included:**
✅ Usage tracking and limits  
✅ Paystack payment processing  
✅ Subscription management  
✅ Webhook handling  
✅ Automatic limit enforcement  

---

## 🆘 Troubleshooting

- **Missing credentials?**  
  Double-check your `.env` and credential files.
- **Dependency errors?**  
  Run `pip install -r requirements.txt` again.
- **Port in use?**  
  Change the port in `app.py` or stop the other process.
- **Payment not working?**  
  Check that Paystack credentials are set in `.env`.

---

## 🌈 Enjoy Cooking Smarter!  
> _MealLens: Your AI sous-chef, always ready to help!_ 🍳🤖
