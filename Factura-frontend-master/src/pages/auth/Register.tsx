"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate, Link as RouterLink } from "react-router-dom"
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
  PersonAddAlt,
  Email,
  LockOutlined,
  ArrowForward,
  ErrorOutline,
  DarkMode,
  LightMode,
} from "@mui/icons-material"
import { useFormik } from "formik"
import * as Yup from "yup"
import { useAuth } from "../../contexts/AuthContext"

const Register: React.FC = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("El nombre es obligatorio").min(3, "El nombre debe tener al menos 3 caracteres"),
      email: Yup.string().email("Correo electrónico inválido").required("El correo electrónico es obligatorio"),
      password: Yup.string()
        .required("La contraseña es obligatoria")
        .min(8, "La contraseña debe tener al menos 8 caracteres"),
      password_confirmation: Yup.string()
        .oneOf([Yup.ref("password")], "Las contraseñas no coinciden")
        .required("La confirmación de contraseña es obligatoria"),
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true)
        setError(null)
        await register(values.name, values.email, values.password, values.password_confirmation)
        navigate("/dashboard")
      } catch (err: any) {
        setError(err.response?.data?.message || "Error al registrarse")
      } finally {
        setLoading(false)
      }
    },
  })

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword)
  }

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword)
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

      {/* Left side - Registration form */}
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
              backgroundColor: darkMode ? "#7b1fa2" : "#9c27b0",
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
            <PersonAddAlt sx={{ color: "white", fontSize: 35 }} />
          </Box>

          <Typography component="h1" variant="h3" fontWeight="bold" gutterBottom>
            Crear Cuenta
          </Typography>

          <Typography variant="h6" color={darkMode ? "grey.400" : "text.secondary"} align="center" sx={{ mb: 5 }}>
            Completa el formulario para registrarte en el sistema
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
              id="name"
              label="Nombre Completo"
              name="name"
              autoComplete="name"
              autoFocus
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonAddAlt color={darkMode ? "secondary" : "action"} />
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

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Correo Electrónico"
              name="email"
              autoComplete="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color={darkMode ? "secondary" : "action"} />
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

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="new-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined color={darkMode ? "secondary" : "action"} />
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

            <TextField
              margin="normal"
              required
              fullWidth
              name="password_confirmation"
              label="Confirmar Contraseña"
              type={showConfirmPassword ? "text" : "password"}
              id="password_confirmation"
              autoComplete="new-password"
              value={formik.values.password_confirmation}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password_confirmation && Boolean(formik.errors.password_confirmation)}
              helperText={formik.touched.password_confirmation && formik.errors.password_confirmation}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined color={darkMode ? "secondary" : "action"} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowConfirmPassword}
                      edge="end"
                      sx={{ color: darkMode ? "grey.400" : theme.palette.text.secondary }}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
                mb: 3,
              }}
            />

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
                backgroundColor: darkMode ? "#7b1fa2" : "#9c27b0",
              }}
              endIcon={loading ? undefined : <ArrowForward />}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Crear Cuenta"}
            </Button>

            <Box sx={{ textAlign: "center", mt: 3 }}>
              <Typography variant="body1" color={darkMode ? "grey.400" : "text.secondary"} fontWeight="medium">
                ¿Ya tienes una cuenta?{" "}
                <Link
                  component={RouterLink}
                  to="/login"
                  sx={{
                    fontWeight: "bold",
                    color: darkMode ? "#ce93d8" : "#9c27b0",
                    textDecoration: "none",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  Inicia sesión aquí
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Right side - Information */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: 4,
          background: darkMode
            ? "linear-gradient(135deg, #4a148c 0%, #7b1fa2 100%)"
            : "linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)",
          color: "white",
          height: "100%",
        }}
      >
        <Box sx={{ maxWidth: "500px", textAlign: { xs: "center", md: "left" } }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
            <PersonAddAlt sx={{ fontSize: 40, mr: 2 }} />
            <Typography variant="h3" fontWeight="bold">
              FactuSystem
            </Typography>
          </Box>

          <Typography variant="h4" gutterBottom fontWeight="bold">
            Únete a Nosotros
          </Typography>

          <Typography variant="body1" sx={{ mb: 5, fontSize: "1.1rem" }}>
            Crea una cuenta y comienza a gestionar tus facturas de manera eficiente y profesional.
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
                Registro rápido y seguro
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
                Acceso a todas las funcionalidades
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
                Soporte técnico personalizado
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default Register

