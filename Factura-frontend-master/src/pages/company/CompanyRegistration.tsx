"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Divider,
  InputAdornment,
  IconButton,
  Tooltip,
} from "@mui/material"
import {
  Business,
  Numbers,
  LocationOn,
  Image,
  Key,
  Lock,
  Upload,
  Save,
  ArrowBack,
  DarkMode,
  LightMode,
} from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { useCompany } from "../../contexts/CompanyContext"
import MainLayout from "../../components/layout/MainLayout"

const CompanyRegistration: React.FC = () => {
  const navigate = useNavigate()
  const { createCompany, loading, error } = useCompany()
  const [formData, setFormData] = useState({
    razon_social: "",
    ruc: "",
    direccion: "",
    sol_user: "",
    sol_pass: "",
    production: false,
    client_id: "",
    client_secret: "",
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [certFile, setCertFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target

    // Asegurarse de que production sea siempre un booleano
    if (name === "production") {
      setFormData({
        ...formData,
        [name]: checked,
      })
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      })
    }

    // Limpiar error del campo
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      })
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoFile(file)

      // Crear preview
      const reader = new FileReader()
      reader.onload = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCertChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCertFile(e.target.files[0])
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.razon_social.trim()) {
      errors.razon_social = "La razón social es obligatoria"
    }

    if (!formData.ruc.trim()) {
      errors.ruc = "El RUC es obligatorio"
    } else if (!/^(10|20)\d{9}$/.test(formData.ruc)) {
      errors.ruc = "El RUC debe comenzar con 10 o 20 y tener 11 dígitos"
    }

    if (!formData.direccion.trim()) {
      errors.direccion = "La dirección es obligatoria"
    }

    if (!formData.sol_user.trim()) {
      errors.sol_user = "El usuario SOL es obligatorio"
    }

    if (!formData.sol_pass.trim()) {
      errors.sol_pass = "La clave SOL es obligatoria"
    }

    if (!certFile) {
      errors.cert = "El certificado digital es obligatorio"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!validateForm()) {
      return
    }

    try {
      const formDataObj = new FormData()

      // Agregar campos de texto
      Object.entries(formData).forEach(([key, value]) => {
        // Convertir el valor booleano a string para enviar al backend
        formDataObj.append(key, value.toString())
      })

      // Agregar archivos
      if (logoFile) {
        formDataObj.append("logo", logoFile)
      }

      if (certFile) {
        formDataObj.append("cert", certFile)
      }

      await createCompany(formDataObj)
      navigate("/dashboard")
    } catch (error: any) {
      console.error("Error al registrar empresa:", error)

      // Traducir mensajes de error comunes
      let errorMessage = error.response?.data?.message || "Error al registrar la empresa"

      if (errorMessage.includes("The production field must be true or false")) {
        errorMessage = "El campo de producción debe ser verdadero o falso"
      }

      setSubmitError(errorMessage)
    }
  }

  // Función para traducir mensajes de error
  const translateError = (errorMessage: string): string => {
    const errorTranslations: Record<string, string> = {
      "The production field must be true or false": "El campo de producción debe ser verdadero o falso",
      // Añadir más traducciones según sea necesario
    }

    return errorTranslations[errorMessage] || errorMessage
  }

  return (
    <MainLayout>
      <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
        {/* Botón para alternar modo oscuro */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
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

        <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <Business sx={{ fontSize: 40, color: "primary.main", mr: 2 }} />
            <Typography variant="h4">Registro de Empresa</Typography>
          </Box>

          <Typography variant="body1" color="text.secondary" paragraph>
            Complete el formulario para registrar su empresa en el sistema de facturación electrónica. Los campos
            marcados con * son obligatorios.
          </Typography>

          {submitError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {translateError(submitError)}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {translateError(error)}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Información General
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Razón Social *"
                  name="razon_social"
                  value={formData.razon_social}
                  onChange={handleInputChange}
                  error={!!formErrors.razon_social}
                  helperText={formErrors.razon_social}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Business />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="RUC *"
                  name="ruc"
                  value={formData.ruc}
                  onChange={handleInputChange}
                  error={!!formErrors.ruc}
                  helperText={formErrors.ruc || "Debe comenzar con 10 o 20 y tener 11 dígitos"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Numbers />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Dirección *"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  error={!!formErrors.direccion}
                  helperText={formErrors.direccion}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Logo de la Empresa
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Button variant="outlined" component="label" startIcon={<Image />} fullWidth sx={{ height: "56px" }}>
                  {logoFile ? "Cambiar Logo" : "Subir Logo"}
                  <input type="file" hidden accept="image/*" onChange={handleLogoChange} />
                </Button>
                {formErrors.logo && (
                  <Typography color="error" variant="caption">
                    {formErrors.logo}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                {logoPreview && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100px",
                      border: "1px dashed",
                      borderColor: "divider",
                      borderRadius: 1,
                      p: 1,
                    }}
                  >
                    <img
                      src={logoPreview || "/placeholder.svg"}
                      alt="Logo Preview"
                      style={{ maxHeight: "100%", maxWidth: "100%" }}
                    />
                  </Box>
                )}
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Credenciales SUNAT
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Usuario SOL *"
                  name="sol_user"
                  value={formData.sol_user}
                  onChange={handleInputChange}
                  error={!!formErrors.sol_user}
                  helperText={formErrors.sol_user}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Key />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Clave SOL *"
                  name="sol_pass"
                  type="password"
                  value={formData.sol_pass}
                  onChange={handleInputChange}
                  error={!!formErrors.sol_pass}
                  helperText={formErrors.sol_pass}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<Upload />}
                  fullWidth
                  sx={{ height: "56px" }}
                  color={formErrors.cert ? "error" : "primary"}
                >
                  {certFile ? "Cambiar Certificado Digital" : "Subir Certificado Digital (.pem) *"}
                  <input type="file" hidden accept=".pem,.txt" onChange={handleCertChange} />
                </Button>
                {formErrors.cert && (
                  <Typography color="error" variant="caption">
                    {formErrors.cert}
                  </Typography>
                )}
                {certFile && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Archivo seleccionado: {certFile.name}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={<Switch checked={formData.production} onChange={handleInputChange} name="production" />}
                  label="Modo Producción"
                />
                <Typography variant="caption" display="block">
                  Activa esta opción solo si ya estás listo para emitir comprobantes reales.
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  API (Opcional)
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Client ID"
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Key />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Client Secret"
                  name="client_secret"
                  type="password"
                  value={formData.client_secret}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
                <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="contained" startIcon={<Save />} disabled={loading}>
                  {loading ? <CircularProgress size={24} /> : "Registrar Empresa"}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </MainLayout>
  )
}

export default CompanyRegistration

