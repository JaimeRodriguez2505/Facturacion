"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate, Link as RouterLink, useLocation } from "react-router-dom"
import {
  Box,
  Typography,
  TextField,
  Button,
  Link,
  InputAdornment,
  IconButton,
  CircularProgress,
  useTheme,
  Tooltip,
} from "@mui/material"
import {
  Visibility,
  VisibilityOff,
  LockOutlined,
  Email,
  Receipt,
  ArrowForward,
  ErrorOutline,
  DarkMode,
  LightMode,
} from "@mui/icons-material"
import { useFormik } from "formik"
import * as Yup from "yup"
import { useAuth } from "../../contexts/AuthContext"

const Login: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, user } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const theme = useTheme()
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true")

  // Effect to apply dark mode to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark")
    } else {
      document.body.classList.remove("dark")
    }
    localStorage.setItem("darkMode", darkMode.toString())
  }, [darkMode])

  // Check if user is already logged in
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || "/dashboard"
      navigate(from, { replace: true })
    }
  }, [user, navigate, location])

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Correo electrónico inválido").required("El correo electrónico es obligatorio"),
      password: Yup.string().required("La contraseña es obligatoria"),
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true)
        setError(null)
        console.log("Login form submitted with:", values.email)

        await login(values.email, values.password)
        console.log("Login successful, navigating to dashboard")

        // Navigate after successful login
        navigate("/dashboard", { replace: true })
      } catch (err: any) {
        console.error("Login form error:", err)
        let errorMessage = "Error al iniciar sesión"

        if (err.response?.data?.message) {
          errorMessage = err.response.data.message
        } else if (err.response?.data?.error) {
          errorMessage = err.response.data.error
        } else if (err.message) {
          errorMessage = err.message
        }

        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    },
  })

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword)
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        margin: 0,
        padding: 0,
        display: "flex",
        position: "relative",
        backgroundColor: darkMode ? "#121212" : "#f5f5f5",
        overflowX: "hidden",
      }}
    >
      {/* Toggle for light/dark mode */}
      <Box
        sx={{
          position: "absolute",
          top: 20,
          right: 20,
          zIndex: 10,
        }}
      >
        <Tooltip title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>
          <IconButton
            onClick={toggleDarkMode}
            sx={{
              color: darkMode ? "white" : "black",
              backgroundColor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
              "&:hover": {
                backgroundColor: darkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
              },
            }}
          >
            {darkMode ? <LightMode /> : <DarkMode />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Left side - Information */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: 4,
          background: darkMode
            ? "linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)"
            : "linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)",
          color: "white",
          height: "100%",
        }}
      >
        <Box sx={{ maxWidth: "500px", textAlign: { xs: "center", md: "left" } }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
            <Receipt sx={{ fontSize: 40, mr: 2 }} />
            <Typography variant="h3" fontWeight="bold">
              FactuSystem
            </Typography>
          </Box>

          <Typography variant="h4" gutterBottom fontWeight="bold">
            Sistema de Facturación
          </Typography>

          <Typography variant="body1" sx={{ mb: 5, fontSize: "1.1rem" }}>
            Gestiona tus facturas, boletas y documentos electrónicos de manera eficiente y segura.
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mr: 3,
                }}
              >
                <Typography variant="h6" fontWeight="bold">
                  1
                </Typography>
              </Box>
              <Typography variant="body1" fontSize="1.1rem">
                Crea facturas y boletas en segundos
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mr: 3,
                }}
              >
                <Typography variant="h6" fontWeight="bold">
                  2
                </Typography>
              </Box>
              <Typography variant="body1" fontSize="1.1rem">
                Gestiona clientes y productos
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mr: 3,
                }}
              >
                <Typography variant="h6" fontWeight="bold">
                  3
                </Typography>
              </Box>
              <Typography variant="body1" fontSize="1.1rem">
                Visualiza reportes y estadísticas
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Right side - Login form */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: 4,
          backgroundColor: darkMode ? "#1e1e1e" : "white",
          color: darkMode ? "white" : "inherit",
          height: "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            maxWidth: "450px",
            width: "100%",
          }}
        >
          <Box
            sx={{
              backgroundColor: darkMode ? "#3949ab" : theme.palette.primary.main,
              borderRadius: "50%",
              width: 70,
              height: 70,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              mb: 3,
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
          >
            <LockOutlined sx={{ color: "white", fontSize: 35 }} />
          </Box>

          <Typography component="h1" variant="h3" fontWeight="bold" gutterBottom>
            Bienvenido
          </Typography>

          <Typography variant="h6" color={darkMode ? "grey.400" : "text.secondary"} align="center" sx={{ mb: 5 }}>
            Ingresa tus credenciales para acceder al sistema
          </Typography>

          {error && (
            <Box
              sx={{
                width: "100%",
                mb: 4,
                p: 2,
                borderRadius: 2,
                backgroundColor: darkMode ? "rgba(211, 47, 47, 0.2)" : "rgba(211, 47, 47, 0.1)",
                border: "1px solid",
                borderColor: darkMode ? "rgba(211, 47, 47, 0.5)" : "rgba(211, 47, 47, 0.3)",
                color: darkMode ? "#f44336" : "error.main",
                display: "flex",
                alignItems: "center",
              }}
            >
              <ErrorOutline sx={{ mr: 1 }} />
              <Typography variant="body1">{error}</Typography>
            </Box>
          )}

          <Box
            component="form"
            onSubmit={formik.handleSubmit}
            noValidate
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Correo Electrónico"
              name="email"
              autoComplete="email"
              autoFocus
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color={darkMode ? "primary" : "action"} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  backgroundColor: darkMode ? "rgba(255,255,255,0.05)" : "transparent",
                  "& .MuiInputBase-input": {
                    color: darkMode ? "white" : undefined,
                  },
                },
                "& .MuiInputLabel-root": {
                  color: darkMode ? "grey.400" : undefined,
                },
                mb: 3,
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined color={darkMode ? "primary" : "action"} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                      sx={{ color: darkMode ? "grey.400" : theme.palette.text.secondary }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  backgroundColor: darkMode ? "rgba(255,255,255,0.05)" : "transparent",
                  "& .MuiInputBase-input": {
                    color: darkMode ? "white" : undefined,
                  },
                },
                "& .MuiInputLabel-root": {
                  color: darkMode ? "grey.400" : undefined,
                },
                mb: 2,
              }}
            />

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1, mb: 3 }}>
              <Link
                component={RouterLink}
                to="/recuperar-password"
                variant="body1"
                sx={{
                  color: darkMode ? "#90caf9" : theme.palette.primary.main,
                  textDecoration: "none",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontSize: "1.1rem",
                fontWeight: "bold",
                backgroundColor: darkMode ? "#3949ab" : undefined,
              }}
              endIcon={loading ? undefined : <ArrowForward />}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Iniciar Sesión"}
            </Button>

            <Box sx={{ textAlign: "center", mt: 3 }}>
              <Typography variant="body1" color={darkMode ? "grey.400" : "text.secondary"}>
                ¿No tienes una cuenta?{" "}
                <Link
                  component={RouterLink}
                  to="/register"
                  sx={{
                    fontWeight: "bold",
                    color: darkMode ? "#90caf9" : theme.palette.primary.main,
                    textDecoration: "none",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  Regístrate aquí
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default Login
