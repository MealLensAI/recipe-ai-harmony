"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Mail, Calendar, Edit3, Save, X, Camera, Shield, Star, AlertTriangle, Plus, Minus } from "lucide-react"
import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import { auth } from "@/lib/firebase"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

interface Profile {
  id: string
  firebase_uid: string
  email: string
  first_name: string | null
  last_name: string | null
  has_health_condition: boolean
  health_conditions: string[]
  allergies: string[]
  created_at: string
  updated_at: string
}

export default function ProfilePage() {
  const { toast } = useToast()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [hasHealthCondition, setHasHealthCondition] = useState(false)
  const [healthConditions, setHealthConditions] = useState<string[]>([])
  const [allergies, setAllergies] = useState<string[]>([])
  const [newHealthCondition, setNewHealthCondition] = useState("")
  const [newAllergy, setNewAllergy] = useState("")

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      const user = auth.currentUser
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view your profile.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      setEmail(user.email || "")

      try {
        const response = await fetch(`http://localhost:5000/api/profile`, {
          headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
            'Content-Type': 'application/json'
          }
        })
        const data = await response.json()

        if (response.ok && data.status === 'success' && data.profile) {
          setProfile(data.profile)
          setFirstName(data.profile.first_name || "")
          setLastName(data.profile.last_name || "")
          setHasHealthCondition(data.profile.has_health_condition || false)
          setHealthConditions(data.profile.health_conditions || [])
          setAllergies(data.profile.allergies || [])
        } else if (response.status === 404) {
          // Profile not found, create empty profile
          setProfile({
            id: user.uid,
            firebase_uid: user.uid,
            email: user.email || "",
            first_name: "",
            last_name: "",
            has_health_condition: false,
            health_conditions: [],
            allergies: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          setFirstName("")
          setLastName("")
          setHasHealthCondition(false)
          setHealthConditions([])
          setAllergies([])
        } else {
          throw new Error(data.message || "Failed to fetch profile")
        }
      } catch (error: any) {
        console.error("Error fetching profile:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to load profile.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [toast])

  const handleSave = async () => {
    setLoading(true)
    const user = auth.currentUser
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save your profile.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      const response = await fetch("http://localhost:5000/api/profile", {
        method: "PUT",
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email: user.email,
          has_health_condition: hasHealthCondition,
          health_conditions: healthConditions,
          allergies: allergies,
        }),
      })
      const data = await response.json()

      if (response.ok && data.status === 'success') {
        setProfile(data.profile)
        setIsEditing(false)
        toast({
          title: "Success",
          description: "Profile updated successfully!",
        })
      } else {
        throw new Error(data.message || "Failed to update profile")
      }
    } catch (error: any) {
      console.error("Error saving profile:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save profile.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getInitials = () => {
    const first = firstName.charAt(0).toUpperCase()
    const last = lastName.charAt(0).toUpperCase()
    return first + last
  }

  const getMemberSince = () => {
    if (!profile?.created_at) return "Recently"
    const date = new Date(profile.created_at)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    })
  }

  const addHealthCondition = () => {
    if (newHealthCondition.trim() && !healthConditions.includes(newHealthCondition.trim())) {
      setHealthConditions([...healthConditions, newHealthCondition.trim()])
      setNewHealthCondition("")
    }
  }

  const removeHealthCondition = (condition: string) => {
    setHealthConditions(healthConditions.filter(c => c !== condition))
  }

  const addAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()])
      setNewAllergy("")
    }
  }

  const removeAllergy = (allergy: string) => {
    setAllergies(allergies.filter(a => a !== allergy))
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-red-50 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full animate-pulse"></div>
            <Loader2 className="absolute inset-0 m-auto h-8 w-8 animate-spin text-white" />
          </div>
          <span className="text-xl font-medium text-gray-600">Loading your profile...</span>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-red-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
          <Button
            asChild
            variant="ghost"
              className="text-gray-600 hover:text-gray-800 hover:bg-white/50 transition-all duration-200"
          >
            <Link to="/">
                <ArrowLeft className="h-5 w-5 mr-2" /> Back
            </Link>
          </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                Profile
              </h1>
              <p className="text-gray-600">Manage your account and preferences</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold">Personal Information</CardTitle>
                  {!isEditing && (
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="ghost"
                      className="text-white hover:bg-white/20 transition-all duration-200"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
        </CardHeader>
              <CardContent className="p-6 space-y-6">
          {isEditing ? (
            <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                        <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700 mb-2 block">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                          className="border-gray-300 focus:border-red-400 focus:ring-red-400 transition-all duration-200"
                          placeholder="Enter your first name"
                />
              </div>
              <div>
                        <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                          className="border-gray-300 focus:border-red-400 focus:ring-red-400 transition-all duration-200"
                          placeholder="Enter your last name"
                />
                      </div>
              </div>
              <div>
                      <Label htmlFor="email" className="text-sm font-semibold text-gray-700 mb-2 block">
                        Email Address
                </Label>
                <Input
                  id="email"
                  value={email}
                  disabled
                        className="bg-gray-50 border-gray-300 cursor-not-allowed"
                />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed here</p>
              </div>

              {/* Health Information Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <Label className="text-lg font-semibold text-gray-800">Health Information</Label>
                </div>
                
                {/* Health Conditions Toggle */}
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">I have medical conditions</Label>
                    <p className="text-xs text-gray-500">This helps us provide personalized meal recommendations</p>
                  </div>
                  <Switch
                    checked={hasHealthCondition}
                    onCheckedChange={setHasHealthCondition}
                    className="data-[state=checked]:bg-orange-500"
                  />
                </div>

                {/* Health Conditions List */}
                {hasHealthCondition && (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">Medical Conditions</Label>
                    <div className="space-y-2">
                      {healthConditions.map((condition, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg">
                          <span className="text-sm text-gray-700">{condition}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeHealthCondition(condition)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex space-x-2">
                        <Input
                          value={newHealthCondition}
                          onChange={(e) => setNewHealthCondition(e.target.value)}
                          placeholder="Add medical condition (e.g., diabetes, hypertension)"
                          className="flex-1 border-gray-300 focus:border-orange-400 focus:ring-orange-400"
                          onKeyPress={(e) => e.key === 'Enter' && addHealthCondition()}
                        />
                        <Button
                          type="button"
                          onClick={addHealthCondition}
                          disabled={!newHealthCondition.trim()}
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Allergies Section */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Food Allergies</Label>
                  <div className="space-y-2">
                    {allergies.map((allergy, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg">
                        <span className="text-sm text-gray-700">{allergy}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAllergy(allergy)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex space-x-2">
                      <Input
                        value={newAllergy}
                        onChange={(e) => setNewAllergy(e.target.value)}
                        placeholder="Add food allergy (e.g., peanuts, shellfish)"
                        className="flex-1 border-gray-300 focus:border-orange-400 focus:ring-orange-400"
                        onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                      />
                      <Button
                        type="button"
                        onClick={addAllergy}
                        disabled={!newAllergy.trim()}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
                    <div className="flex space-x-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={loading}
                        className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold transition-all duration-200"
                >
                  {loading ? (
                    <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" /> Save Changes
                          </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                        className="flex-1 border-gray-300 hover:bg-gray-50 transition-all duration-200"
                >
                        <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
                  <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <User className="h-6 w-6 text-red-600" />
                </div>
                        <div>
                          <p className="text-sm text-gray-500">Full Name</p>
                          <p className="font-semibold text-gray-900">
                            {profile?.first_name && profile?.last_name 
                              ? `${profile.first_name} ${profile.last_name}`
                              : "Not set"
                            }
                  </p>
                </div>
              </div>
                      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Mail className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-semibold text-gray-900">{profile?.email || email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Member Since</p>
                        <p className="font-semibold text-gray-900">{getMemberSince()}</p>
                      </div>
                    </div>

                    {/* Health Information Display */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <h3 className="text-lg font-semibold text-gray-800">Health Information</h3>
                      </div>
                      
                      {/* Health Conditions */}
                      <div className="flex items-center space-x-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <AlertTriangle className="h-6 w-6 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">Medical Conditions</p>
                          {profile?.has_health_condition ? (
                            <div className="space-y-1">
                              {profile.health_conditions && profile.health_conditions.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {profile.health_conditions.map((condition, index) => (
                                    <Badge key={index} variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">
                                      {condition}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <p className="font-semibold text-gray-900">None specified</p>
                              )}
                            </div>
                          ) : (
                            <p className="font-semibold text-gray-900">No medical conditions</p>
                          )}
                        </div>
                      </div>

                      {/* Allergies */}
                      <div className="flex items-center space-x-4 p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">Food Allergies</p>
                          {profile?.allergies && profile.allergies.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {profile.allergies.map((allergy, index) => (
                                <Badge key={index} variant="outline" className="bg-red-100 text-red-700 border-red-200">
                                  {allergy}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="font-semibold text-gray-900">No allergies specified</p>
                          )}
                        </div>
                      </div>
                    </div>
            </div>
          )}
        </CardContent>
      </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Avatar Card */}
            <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="relative mx-auto mb-4">
                  <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {getInitials()}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0 border-2 border-white bg-white shadow-md hover:bg-gray-50"
                  >
                    <Camera className="h-3 w-3" />
                  </Button>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {profile?.first_name && profile?.last_name 
                    ? `${profile.first_name} ${profile.last_name}`
                    : "User"
                  }
                </h3>
                <p className="text-gray-600 text-sm mb-4">{profile?.email || email}</p>
                <Badge variant="secondary" className="bg-gradient-to-r from-red-100 to-orange-100 text-red-700 border-red-200">
                  <Star className="h-3 w-3 mr-1" />
                  Premium Member
                </Badge>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 p-4">
                <CardTitle className="text-lg font-semibold text-gray-800">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Meal Plans</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    12 Created
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Detections</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    47 Total
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">AI Sessions</span>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    23 Used
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 p-4">
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-green-600" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Two-Factor Auth</span>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    Disabled
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Last Login</span>
                  <span className="text-sm font-medium text-gray-900">2 hours ago</span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2 border-gray-300 hover:bg-gray-50">
                  Change Password
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
