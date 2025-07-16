"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase" // Corrected import path
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Loader2, Utensils, CalendarDays, BookOpen } from "lucide-react"
import { auth } from "@/lib/firebase"

interface SharedRecipe {
  id: string
  recipe_type: "food_detection" | "ingredient_detection"
  detected_foods?: string // JSON string of string[]
  instructions?: string // HTML string
  resources?: string // HTML string
  suggestion?: string // for ingredient detection
  ingredients?: string // JSON string of string[]
  created_at: string
}

export function HistoryPage() {
  const [history, setHistory] = useState<SharedRecipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const user = auth.currentUser
        if (!user) throw new Error("Not logged in")
        const { data, error } = await supabase
          .from("detection_history")
          .select("*")
          .eq("firebase_uid", user.uid)
          .order("created_at", { ascending: false })
          .limit(20)
        if (error) throw error
        setHistory(data || [])
      } catch (err: any) {
        setError("Failed to load history. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchHistory()
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-red-500" />
        <span className="mt-4 text-lg text-gray-600">Loading history...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600 min-h-[400px] flex items-center justify-center">
        <p className="text-lg font-medium">{error}</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[600px] w-full rounded-lg border border-gray-200 p-4 shadow-inner bg-gray-50">
      {history.length === 0 ? (
        <div className="flex h-full items-center justify-center text-gray-500 text-lg">
          <p>No detection history found. Start detecting food or ingredients!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {history.map((item) => (
            <Card key={item.id} className="overflow-hidden shadow-md transition-all hover:shadow-lg border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 bg-gradient-to-r from-red-50 to-orange-50">
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
                  {item.recipe_type === "food_detection" ? (
                    <Utensils className="mr-2 h-5 w-5 text-red-600" />
                  ) : (
                    <BookOpen className="mr-2 h-5 w-5 text-orange-600" />
                  )}
                  {item.recipe_type === "food_detection" ? "Food Detection Result" : "Ingredient Detection Result"}
                </CardTitle>
                <Badge variant="secondary" className="bg-white text-gray-600 border border-gray-200 shadow-sm">
                  <CalendarDays className="mr-1 h-3 w-3" />
                  {new Date(item.created_at).toLocaleDateString()}
                </Badge>
              </CardHeader>
              <CardContent className="p-4 pt-3 space-y-2">
                {item.recipe_type === "food_detection" && item.detected_foods && (
                  <p className="text-sm text-gray-700">
                    <strong>Detected Foods:</strong>{" "}
                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                      {JSON.parse(item.detected_foods).join(", ")}
                    </Badge>
                  </p>
                )}
                {item.recipe_type === "ingredient_detection" && item.ingredients && (
                  <p className="text-sm text-gray-700">
                    <strong>Ingredients:</strong>{" "}
                    <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">
                      {JSON.parse(item.ingredients).join(", ")}
                    </Badge>
                  </p>
                )}
                {item.suggestion && (
                  <p className="text-sm text-gray-700">
                    <strong>Recipe Suggestion:</strong>{" "}
                    <span className="font-medium text-red-600">{item.suggestion}</span>
                  </p>
                )}
                {item.instructions && (
                  <div className="mt-2 text-sm text-gray-700 max-h-24 overflow-hidden relative">
                    <strong className="block mb-1">Instructions:</strong>
                    <div
                      dangerouslySetInnerHTML={{ __html: item.instructions }}
                      className="prose prose-sm max-w-none text-gray-600"
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent" />
                    <span className="text-xs text-gray-500 italic absolute bottom-0 right-0 bg-white pr-1">
                      {" "}
                      (truncated)
                    </span>
                  </div>
                )}
                {/* You can add a button here to view full details or resources if needed */}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </ScrollArea>
  )
}

export default HistoryPage
