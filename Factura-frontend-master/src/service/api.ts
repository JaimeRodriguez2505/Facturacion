import axios from "axios"

// Crear una instancia de axios con la URL base
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api", // Cambiado a 127.0.0.1 en lugar de localhost
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true, // Importante para las cookies y la autenticación
})

// Interceptor para agregar el token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log("Adding auth token to request:", config.url)
    } else {
      console.log("No auth token available for request:", config.url)
    }

    // For form data requests, we need to remove the Content-Type header
    // to let the browser set it with the correct boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"]
    }

    // Log the full request URL for debugging
    console.log(`Full request URL: ${config.baseURL}${config.url}`, config.method, config.data)

    return config
  },
  (error) => {
    console.error("Request interceptor error:", error)
    return Promise.reject(error)
  },
)

// Interceptor para manejar errores de respuesta y mostrar más información
api.interceptors.response.use(
  (response) => {
    console.log(`API response success [${response.config.method}] ${response.config.url}:`, response.status)
    return response
  },
  (error) => {
    console.error("API response error:", error)

    // If error is due to network issues
    if (!error.response) {
      console.error("Network error or CORS issue:", error.message)
    } else {
      console.error("Error response data:", error.response.data)
    }

    // If the error is 401 (unauthorized), redirect to login
    if (error.response && error.response.status === 401) {
      console.log("Unauthorized access (401), clearing auth and redirecting")
      localStorage.removeItem("token")
      localStorage.removeItem("user")

      // Only redirect if not already on login page
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login"
      }
    }

    return Promise.reject(error)
  },
)

export default api

