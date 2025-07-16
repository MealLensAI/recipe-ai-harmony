# MealLens Backend

This backend provides session management and AI-powered food detection and recipe generation.

## API Endpoints

### Session Management
- `POST /api/session` — Create a session (requires `{ "user_id": "..." }` in JSON body)
- `GET /api/session` — Retrieve current session info

### Food Detection
- `POST /food_detect` — Detect food from image or ingredients list
  - Input: FormData with `image` file or `ingredient_list` text
  - Output: `{ food_detected: string[], instructions: string }`

- `POST /food_detect_resources` — Get cooking resources for detected foods
  - Input: `{ food_detected: string[] }`
  - Output: `{ YoutubeSearch: ResourceItem[][], GoogleSearch: ResourceItem[][] }`

### Meal Planning
- `POST /smart_plan` — Generate meal plan from ingredients
  - Input: FormData with `image_or_ingredient_list` type and corresponding data
  - Output: `{ meal_plan: MealPlan[] }`

- `POST /meal_plan` — Save meal plan history
  - Input: `{ date: string, mealPlan: MealPlan[], inputType: string, ingredients: string }`

- `GET /meal_plan` — Get meal plan history
  - Output: `{ meal_plan: HistoryItem[] }`

## Data Structures

### MealPlan
```typescript
{
  day: string
  breakfast: string
  lunch: string
  dinner: string
  snack: string
}
```

### ResourceItem
```typescript
{
  title: string
  link: string
  description?: string
}
```

### HistoryItem
```typescript
{
  date: string
  mealPlan: MealPlan[]
  inputType: "image" | "ingredient_list"
  ingredients: string
}
```

## Storage

All data is stored in the following locations:
- Sessions: `backend/sessions/` (filesystem-based)
- Uploaded images: `backend/uploads/`
- Meal plans: In-memory (for demo purposes)

## Running Locally
```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python app.py
```

## Requirements
- Python 3.8+
- Flask
- flask-session
- Additional requirements in requirements.txt

## Development Notes
- Food detection and recipe generation are currently using mock data
- Session management uses filesystem storage for simplicity
- Future updates will include database integration for persistent storage
