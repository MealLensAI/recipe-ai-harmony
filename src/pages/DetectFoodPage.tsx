"use client"
import { useEffect, useState, useRef } from "react"
import { useNavigate, Navigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, ArrowLeft, Loader2, Utensils, Clock, Users, Bookmark, ArrowRight, Share2 } from "lucide-react" // Added Share2 icon
import "@/styles/detect-food.css"
// Removed: import { supabase } from "@/lib/supabase" // This import was removed in your provided file
import { useAuth } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast" // Import useToast for feedback
import LoadingSpinner from "@/components/LoadingSpinner"

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
  const [isLoadingResources, setIsLoadingResources] = useState(false)
  const { toast } = useToast() // Initialize useToast
  const { token, isAuthenticated, loading } = useAuth()
  const [hasAutoSaved, setHasAutoSaved] = useState(false)

  if (loading) {
    return <LoadingSpinner />
  }
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl shadow-lg mx-auto">
            <Utensils className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Authentication Required</h2>
            <p className="text-gray-600">
              Please log in to use the food detection feature and save your detections to history.
            </p>
            <Button 
              onClick={() => navigate('/login')}
              className="w-full py-3 text-lg font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg hover:from-red-600 hover:to-orange-600 transition-all duration-300"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async () => {
    if (!selectedImage) return
    
    setIsLoading(true)
    setInstructions("")
    setDetectedFoods([])
    setResources(null)
    setHasAutoSaved(false) // Reset auto-save state for new detection
    const formData = new FormData()
    formData.append("image", selectedImage)
    
    try {
      const response = await fetch("https://ai-utu2.onrender.com/food_detect", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      console.log("[DetectFood] /food_detect response:", data)
      
      if (data.error) {
        toast({
          title: "Error",
          description: data.error || "Failed to detect food.",
          variant: "destructive",
        })
        return
      }
      
      setInstructions(data.instructions || "")
      setDetectedFoods(data.food_detected || [])
      console.log("[DetectFood] Detected foods:", data.food_detected)
      
      // Move to step 2 immediately after detection
      setCurrentStep(2)
      
      // Fetch resources automatically when instructions are displayed
      if (data.food_detected && data.food_detected.length > 0) {
        setIsLoadingResources(true)
        try {
          console.log("[DetectFood] Fetching resources for:", data.food_detected)
          const resResponse = await fetch("https://ai-utu2.onrender.com/food_detect_resources", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ food_detected: data.food_detected }),
          })
          
          console.log("[DetectFood] Resources response status:", resResponse.status)
          
          if (!resResponse.ok) {
            console.error("[DetectFood] Resources response not ok:", resResponse.status, resResponse.statusText)
            toast({
              title: "Resources Error",
              description: "Failed to fetch cooking resources, but food detection completed.",
              variant: "destructive",
            })
            setResources(null)
          } else {
            const resData = await resResponse.json()
            console.log("[DetectFood] Resources data received:", resData)
            setResources(resData)
          }
        } catch (resourceError) {
          console.error("[DetectFood] Error fetching resources:", resourceError)
          toast({
            title: "Resources Error",
            description: "Failed to fetch cooking resources, but food detection completed.",
            variant: "destructive",
          })
          setResources(null)
        } finally {
          setIsLoadingResources(false)
        }
      } else {
        console.warn("[DetectFood] No detected foods, skipping resources fetch.")
      }
    } catch (error) {
      console.error("[DetectFood] Error detecting food:", error)
      toast({
        title: "Error",
        description: "Failed to detect food. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleShareDetection = async () => {
    if (!token || !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to share your detection.",
        variant: "destructive",
      })
      return
    }
    if (!detectedFoods.length || !instructions || !resources) {
      toast({
        title: "Incomplete Detection",
        description: "Please complete detection and ensure resources are loaded before sharing.",
        variant: "destructive",
      })
      return
    }
    setIsLoading(true)
    try {
      const payload = {
        recipe_type: "food_detection",
        suggestion: detectedFoods.join(", "), // Use detected foods as suggestion
        instructions: instructions,
        ingredients: JSON.stringify(detectedFoods), // Stringify the array
        detected_foods: JSON.stringify(detectedFoods), // Stringify the array
        analysis_id: "", // Empty for food detection
        youtube: resources?.YoutubeSearch?.[0]?.link || "",
        google: resources?.GoogleSearch?.[0]?.link || "",
        resources: JSON.stringify(resources) // Stringify the entire resources object
      }
      
      console.log("Sharing detection with payload:", payload)
      console.log("Token being used:", token ? `${token.substring(0, 20)}...` : "No token")
      
      const response = await fetch("/api/food_detection/detection_history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(payload),
      })
      
      console.log("Share response status:", response.status)
      
      if (response.ok) {
        const responseData = await response.json()
        console.log("Share response data:", responseData)
        toast({
          title: "Detection Shared!",
          description: "Your food detection has been successfully saved to history.",
        })
      } else {
        const errorData = await response.json()
        console.error("Share failed with error:", errorData)
        toast({
          title: "Share Failed",
          description: errorData.message || "Could not save detection to history.",
          variant: "destructive",
        })
      }
    } catch (e: any) {
      console.error("Error sharing detection:", e)
      toast({
        title: "Error",
        description: e.message || "An unexpected error occurred while sharing.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-save detection history when all data is ready
  useEffect(() => {
    console.log("[DetectFood] Auto-save useEffect triggered", {
      hasAutoSaved,
      instructions,
      detectedFoods,
      resources,
      token,
      isAuthenticated
    })
    if (
      !hasAutoSaved &&
      instructions &&
      detectedFoods.length > 0 &&
      resources &&
      token &&
      isAuthenticated
    ) {
      console.log("[DetectFood] Triggering autoSaveDetectionHistory...")
      autoSaveDetectionHistory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instructions, detectedFoods, resources, token, isAuthenticated])

  const autoSaveDetectionHistory = async () => {
    setHasAutoSaved(true)
    try {
      const payload = {
        recipe_type: "food_detection",
        suggestion: detectedFoods.join(", "),
        instructions: instructions,
        ingredients: JSON.stringify(detectedFoods),
        detected_foods: JSON.stringify(detectedFoods),
        analysis_id: "",
        youtube: resources?.YoutubeSearch?.[0]?.link || "",
        google: resources?.GoogleSearch?.[0]?.link || "",
        resources: JSON.stringify(resources)
      }
      console.log("[DetectFood] [AutoSave] Uploading detection with payload:", payload)
      const response = await fetch("/api/food_detection/detection_history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(payload),
      })
      console.log("[DetectFood] [AutoSave] POST response status:", response.status)
      if (response.ok) {
        const responseData = await response.json()
        console.log("[DetectFood] [AutoSave] Detection auto-saved:", responseData)
        toast({
          title: "Detection Saved!",
          description: "Your food detection has been automatically saved to history.",
        })
      } else {
        const errorData = await response.json()
        console.error("[DetectFood] [AutoSave] Auto-save failed:", errorData)
        toast({
          title: "Auto-save Failed",
          description: errorData.message || "Could not auto-save detection to history.",
          variant: "destructive",
        })
        setHasAutoSaved(false) // allow retry if needed
      }
    } catch (e: any) {
      console.error("[DetectFood] [AutoSave] Error auto-saving detection:", e)
      toast({
        title: "Auto-save Error",
        description: e.message || "An unexpected error occurred while auto-saving.",
        variant: "destructive",
      })
      setHasAutoSaved(false)
    }
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
                  {/* Changed <p> to <div> to fix DOM nesting warning */}
                  <div className="text-gray-700">
                    <strong>Food Items:</strong>{" "}
                    <Badge variant="secondary" className="bg-red-100 text-red-700">
                      {detectedFoods.join(", ")}
                    </Badge>
                  </div>
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
            {isLoadingResources && (
              <Card className="shadow-lg border-none">
                <CardContent className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-3 text-red-500" />
                  <span className="text-gray-600">Fetching cooking resources...</span>
                </CardContent>
              </Card>
            )}
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setCurrentStep(1)} disabled={isLoading}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(3)} 
                disabled={isLoading || isLoadingResources || !resources}
              >
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
                        // Added null/undefined check for item.link
                        const videoId = item.link?.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/)
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
              <Button
                className="py-3 text-lg font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg hover:from-red-600 hover:to-orange-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleShareDetection}
                disabled={isLoading || (!detectedFoods.length || !instructions || !resources) || hasAutoSaved}
              >
                <Share2 className="mr-2 h-5 w-5" /> Share Detection
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default DetectFoodPage