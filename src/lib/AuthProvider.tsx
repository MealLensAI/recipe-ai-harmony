import React, { ReactNode } from "react"
import { AuthContext, useProvideAuth } from "./utils"

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useProvideAuth()
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
} 