"use client"
import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, ArrowLeft, Loader2, Utensils, Clock, Users, Bookmark, ArrowRight } from "lucide-react"
import "@/styles/detect-food.css"
import { supabase } from "@/lib/supabase"
import { auth } from "@/lib/firebase"

interface DetectedFood {
  name: string
  confidence: number
  nutrition?: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

interface Recipe {
  name: string
  description: string
  cookTime: string
  servings: number
  difficulty: string
  ingredients: string[]
  instructions: string[]
  image?: string
}

const DetectFoodPage = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentStep, setCurrentStep] = useState(1) // New state for multi-step form
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [instructions, setInstructions] = useState<string>("")
  const [detectedFoods, setDetectedFoods] = useState<string[]>([])
  const [resources, setResources] = useState<any>(null)
  const [showFeedback, setShowFeedback] = useState(false)

  const handleSubmit = async () => {
    if (!selectedImage) return
    setIsLoading(true)
    setInstructions("")
    setDetectedFoods([])
    setResources(null)
    const formData = new FormData()
    formData.append("image", selectedImage)
    const response = await fetch("https://ai-utu2.onrender.com/food_detect", {
      method: "POST",
      body: formData,
    })
    const data = await response.json()
    setIsLoading(false)
    if (data.error) return // handle error
    setInstructions(data.instructions || "")
    setDetectedFoods(data.food_detected || [])

    // Store detection in Supabase
    try {
      await supabase.from("detection_history").insert([
        {
          firebase_uid: auth.currentUser?.uid || null,
          detection_type: "food_detection",
          input_data: "image",
          detected_foods: JSON.stringify(data.food_detected || []),
          recipe_instructions: data.instructions || null,
          analysis_id: null,
          youtube_link: null,
          google_link: null,
          resources_link: null,
          created_at: new Date().toISOString(),
        },
      ])
    } catch (e) {
      /* ignore for now */
    }

    // Fetch resources
    const resResponse = await fetch("https://ai-utu2.onrender.com/food_detect_resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ food_detected: data.food_detected || [] }),
    })
    const resData = await resResponse.json()
    setResources(resData)
    setCurrentStep(2) // Move to step 2 after detection and resource fetching
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:p-10 space-y-6">
        {/* Step 1: Image Upload */}
        {currentStep === 1 && (
          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-800">Upload Food Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl transition-all hover:border-red-400 hover:bg-red-50">
                <label htmlFor="fileInput" className="cursor-pointer text-red-500 font-semibold flex items-center">
                  <Upload className="h-5 w-5 mr-2" /> Choose or Drag an Image
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="fileInput"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    setSelectedImage(file || null)
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = () => setImagePreview(reader.result as string)
                      reader.readAsDataURL(file)
                    } else {
                      setImagePreview(null)
                    }
                  }}
                />
                {imagePreview && (
                  <div className="mt-4 w-full flex justify-center">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Image Preview"
                      className="max-w-full h-48 object-cover rounded-lg shadow-md"
                    />
                  </div>
                )}
              </div>

              <Button
                className="w-full py-3 text-lg font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg hover:from-red-600 hover:to-orange-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSubmit}
                disabled={isLoading || !selectedImage}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Detecting...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Detected Food & Instructions */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {(detectedFoods.length > 0 || instructions) && (
              <Card className="shadow-lg border-none">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
                    <Utensils className="h-5 w-5 mr-2 text-red-500" /> Detected Food
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    <strong>Food Items:</strong>{" "}
                    <Badge variant="secondary" className="bg-red-100 text-red-700">
                      {detectedFoods.join(", ")}
                    </Badge>
                  </p>
                  {instructions && (
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <Clock className="h-5 w-5 mr-2 text-red-500" /> Cooking Instructions
                      </h3>
                      <div
                        className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: instructions }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setCurrentStep(1)} disabled={isLoading}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <Button variant="outline" onClick={() => setCurrentStep(3)} disabled={isLoading || !resources}>
                Next <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Resources */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {resources && (
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="shadow-lg border-none">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
                      <Users className="h-5 w-5 mr-2 text-red-500" /> Youtube Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {resources.YoutubeSearch && resources.YoutubeSearch.length > 0 ? (
                      resources.YoutubeSearch.map((item: any, idx: number) => {
                        const videoId = item.link.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/)
                        return videoId ? (
                          <div key={idx} className="relative w-full aspect-video rounded-lg overflow-hidden shadow-md">
                            <iframe
                              src={`https://www.youtube.com/embed/${videoId[1]}`}
                              title={item.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="absolute top-0 left-0 w-full h-full border-0"
                            />
                          </div>
                        ) : (
                          <a
                            key={idx}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors duration-200 shadow-sm"
                          >
                            <h3 className="text-base font-semibold text-red-600 hover:underline">{item.title}</h3>
                          </a>
                        )
                      })
                    ) : (
                      <p className="text-gray-500">No video tutorials available.</p>
                    )}
                  </CardContent>
                </Card>
                <Card className="shadow-lg border-none">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
                      <Bookmark className="h-5 w-5 mr-2 text-red-500" /> Google Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {resources.GoogleSearch && resources.GoogleSearch.length > 0 ? (
                      resources.GoogleSearch.map((item: any, idx: number) => (
                        <a
                          key={idx}
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors duration-200 shadow-sm"
                        >
                          <h3 className="text-base font-semibold text-red-600 hover:underline">{item.title}</h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                        </a>
                      ))
                    ) : (
                      <p className="text-gray-500">No articles available.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setCurrentStep(2)} disabled={isLoading}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              {/* No "Next" button here, as this is the final step */}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default DetectFoodPage