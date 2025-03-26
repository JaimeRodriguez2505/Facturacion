import api from "./api"

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData {
  name: string
  email: string
  password: string
  password_confirmation: string
}

interface AuthResponse {
  token: string
  user: {
    id: number
    name: string
    email: string
  }
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    console.log("Intentando iniciar sesión con credenciales:", credentials)
    try {
      // Hacer la petición de inicio de sesión
      const response = await api.post("/login", credentials)
      console.log("Respuesta completa de la API de inicio de sesión:", response)
      console.log("Datos de respuesta de login:", response.data)

      // La API podría devolver los datos en un formato diferente al esperado
      // Vamos a manejar diferentes formatos de respuesta posibles
      let token, user

      if (response.data.token) {
        token = response.data.token
      } else if (response.data.access_token) {
        token = response.data.access_token
      } else if (typeof response.data === "string") {
        // A veces la API podría devolver solo el token como string
        token = response.data
      } else {
        throw new Error("No se encontró token en la respuesta")
      }

      // Extraer información del usuario
      if (response.data.user) {
        user = response.data.user
        console.log("Usuario encontrado en respuesta.user:", user)
      } else if (response.data.data) {
        user = response.data.data
        console.log("Usuario encontrado en respuesta.data:", user)
      } else {
        // Si no se proporciona datos de usuario, crearemos un objeto de usuario mínimo
        user = {
          id: 1, // Placeholder
          name: "", // Dejamos el nombre vacío para que se llene después
          email: credentials.email,
        }
        console.log("No se encontró usuario en respuesta, usando placeholder:", user)
      }

      // Devolver la respuesta estandarizada
      return { token, user }
    } catch (error: any) {
      console.error("Error de API de inicio de sesión:", error.response?.data || error.message)
      throw error
    }
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    console.log("Intentando registrar usuario:", data)
    try {
      const response = await api.post("/register", data)
      console.log("Respuesta completa de registro:", response)
      console.log("Datos de respuesta de registro:", response.data)

      // Manejar diferentes formatos de respuesta similar al inicio de sesión
      let token, user

      if (response.data.token) {
        token = response.data.token
      } else if (response.data.access_token) {
        token = response.data.access_token
      } else if (typeof response.data === "string") {
        token = response.data
      } else {
        throw new Error("No se encontró token en la respuesta")
      }

      if (response.data.user) {
        user = response.data.user
        console.log("Usuario encontrado en respuesta.user:", user)
      } else if (response.data.data) {
        user = response.data.data
        console.log("Usuario encontrado en respuesta.data:", user)
      } else {
        // Si no hay datos de usuario, usamos los proporcionados en el registro
        user = {
          id: 1,
          name: data.name, // Usar el nombre proporcionado en el registro
          email: data.email,
        }
        console.log("No se encontró usuario en respuesta, usando datos de registro:", user)
      }

      return { token, user }
    } catch (error) {
      console.error("Error en registro:", error)
      throw error
    }
  },

  logout: async (): Promise<void> => {
    console.log("Intentando cerrar sesión")
    try {
      await api.post("/logout")
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    } catch (error) {
      console.error("Error en logout:", error)
      // Aún así, eliminamos los datos locales
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    }
  },

  getCurrentUser: async (): Promise<any> => {
    console.log("Obteniendo usuario actual")
    try {
      // Change from "/user" to "/me" to match the backend route
      const response = await api.post("/me")
      console.log("Respuesta completa de usuario actual:", response)
      console.log("Datos de respuesta de usuario actual:", response.data)

      // Manejar diferentes formatos de respuesta
      let userData

      if (response.data.user) {
        userData = response.data.user
        console.log("Usuario encontrado en respuesta.user:", userData)
      } else if (response.data.data) {
        userData = response.data.data
        console.log("Usuario encontrado en respuesta.data:", userData)
      } else {
        userData = response.data
        console.log("Usuario encontrado directamente en respuesta:", userData)
      }

      // Verificar si tenemos un nombre
      if (!userData.name) {
        console.warn("ADVERTENCIA: No se encontró nombre en los datos del usuario:", userData)
      }

      return userData
    } catch (error) {
      console.error("Error al obtener usuario actual:", error)
      throw error
    }
  },

  isAuthenticated: (): boolean => {
    const token = localStorage.getItem("token")
    console.log("Verificando autenticación, token existe:", !!token)
    return !!token
  },
}

