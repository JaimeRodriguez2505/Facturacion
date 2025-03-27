"use client"

import type React from "react"
import { createContext, useState, useEffect, useContext } from "react"
import { authService } from "../service/authService"

interface User {
  id: number
  email: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, password_confirmation: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Separamos la función useAuth del componente AuthProvider
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true)
        console.log("Inicializando contexto de autenticación")

        const token = localStorage.getItem("token")
        const storedUser = localStorage.getItem("user")

        console.log("Token almacenado existe:", !!token)
        console.log("Usuario almacenado existe:", !!storedUser)

        if (storedUser && token) {
          const parsedUser = JSON.parse(storedUser)
          console.log("Usuario almacenado:", parsedUser)
          setUser(parsedUser)

          // Verificar que el token sigue siendo válido obteniendo el usuario actual
          // pero solo si no tenemos datos completos del usuario
          if (!parsedUser.id || !parsedUser.email) {
            try {
              const userData = await authService.getCurrentUser()
              console.log("Datos del usuario actual desde API:", userData)

              // Solo actualizar si tenemos datos válidos
              if (userData && userData.id) {
                const completeUser = {
                  id: userData.id || parsedUser.id,
                  email: userData.email || parsedUser.email,
                }

                console.log("Usuario actualizado con datos de API:", completeUser)
                setUser(completeUser)
                localStorage.setItem("user", JSON.stringify(completeUser))
              }
            } catch (error) {
              console.error("Error al obtener el usuario actual:", error)
              // No eliminamos los datos almacenados si hay un error, seguimos usando lo que tenemos
            }
          }
        } else {
          // No hay credenciales almacenadas
          setUser(null)
        }
      } catch (error) {
        console.error("Error de inicialización de autenticación:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      console.log("Intentando iniciar sesión con:", email)

      const response = await authService.login({ email, password })
      console.log("Respuesta completa de inicio de sesión:", response)

      // Asegurarse de que tenemos un token antes de continuar
      if (!response.token) {
        throw new Error("No se recibió token del servidor")
      }

      // Guardar el token
      localStorage.setItem("token", response.token)

      try {
        // Intentar obtener datos completos del usuario
        const userData = await authService.getCurrentUser()
        console.log("Datos del usuario obtenidos después del login:", userData)

        // Crear un objeto de usuario simplificado
        const completeUser = {
          id: userData.id || response.user?.id || 1,
          email: userData.email || response.user?.email || email,
        }

        console.log("Usuario final después de login:", completeUser)
        setUser(completeUser)
        localStorage.setItem("user", JSON.stringify(completeUser))
      } catch (userError) {
        console.error("Error al obtener datos completos del usuario:", userError)

        // Si no podemos obtener datos de la API, usar los datos de la respuesta de login
        const basicUser = {
          id: response.user?.id || 1,
          email: response.user?.email || email,
        }

        console.log("Usuario básico (sin datos de API):", basicUser)
        setUser(basicUser)
        localStorage.setItem("user", JSON.stringify(basicUser))
      }

      console.log("Inicio de sesión exitoso, usuario establecido")
    } catch (error: any) {
      console.error("Error de inicio de sesión:", error)
      setError(error.response?.data?.message || "Error al iniciar sesión")
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string, password_confirmation: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await authService.register({ name, email, password, password_confirmation })
      console.log("Respuesta completa de registro:", response)

      localStorage.setItem("token", response.token)

      // Asegurarse de que tenemos un objeto de usuario básico
      const completeUser = {
        id: response.user?.id || 1,
        email: response.user?.email || email,
      }

      console.log("Usuario creado en registro:", completeUser)
      setUser(completeUser)
      localStorage.setItem("user", JSON.stringify(completeUser))
    } catch (error: any) {
      setError(error.response?.data?.message || "Error al registrarse")
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      await authService.logout()
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      setUser(null)
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      // Aún así, eliminamos los datos locales
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>{children}</AuthContext.Provider>
  )
}

