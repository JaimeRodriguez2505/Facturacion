"use client"

import React, { useState, useEffect } from "react"
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
  Tabs,
  Tab,
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
  Receipt,
  People,
  Inventory,
  DarkMode,
  LightMode,
} from "@mui/icons-material"
import { useNavigate, useParams } from "react-router-dom"
import { useCompany } from "../../contexts/CompanyContext"
import MainLayout from "../../components/layout/MainLayout"
import { companyService } from "../../service/companyService"

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`company-tabpanel-${index}`}
      aria-labelledby={`company-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const CompanyDetail: React.FC = () => {
  const { ruc } = useParams<{ ruc: string }>()
  const navigate = useNavigate()
  const { updateCompany, loading, error } = useCompany()
  const [, setCompany] = useState<any>(null)
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
  const [loadingCompany, setLoadingCompany] = useState(true)
  const [tabValue, setTabValue] = useState(0)
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true")

  // Efecto para aplicar el modo oscuro
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

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      if (!ruc) return

      try {
        setLoadingCompany(true)
        console.log(`Obteniendo detalles de la empresa con RUC: ${ruc}`)
        const response = await companyService.getCompany(ruc)
        console.log("Datos de empresa obtenidos:", response)

        if (!response || !response.company) {
          setSubmitError("No se encontraron datos de la empresa")
          return
        }

        const company = response.company
        setCompany(company)

        const productionValue =
          typeof company.production === "string"
            ? company.production === "true" || company.production === "1"
            : Boolean(company.production)

        setFormData({
          razon_social: company.razon_social || "",
          ruc: company.ruc || "",
          direccion: company.direccion || "",
          sol_user: company.sol_user || "",
          sol_pass: company.sol_pass || "",
          production: productionValue,
          client_id: company.client_id || "",
          client_secret: company.client_secret || "",
        })
      } catch (error: any) {
        console.error("Error al obtener detalles de la empresa:", error)
        setSubmitError(error.message || "No se pudo cargar la información de la empresa")
      } finally {
        setLoadingCompany(false)
      }
    }

    fetchCompanyDetails()
  }, [ruc])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
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
    if (!formData.direccion.trim()) {
      errors.direccion = "La dirección es obligatoria"
    }
    if (!formData.sol_user.trim()) {
      errors.sol_user = "El usuario SOL es obligatorio"
    }
    if (!formData.sol_pass.trim()) {
      errors.sol_pass = "La clave SOL es obligatoria"
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const translateError = (errorMessage: string): string => {
    const errorTranslations: Record<string, string> = {
      "The production field must be true or false": "El campo de producción debe ser verdadero o falso",
    }
    return errorTranslations[errorMessage] || errorMessage
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    if (!validateForm() || !ruc) {
      return
    }
    try {
      const formDataObj = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== "ruc") {
          formDataObj.append(key, value.toString())
        }
      })
      if (logoFile) {
        formDataObj.append("logo", logoFile)
      }
      if (certFile) {
        formDataObj.append("cert", certFile)
      }
      // Usamos updateCompany, que ahora envía un PUT a la ruta /companies/{ruc}
      await updateCompany(ruc, formDataObj)
      navigate("/companies")
    } catch (error: any) {
      console.error("Error al actualizar empresa:", error)
      let errorMessage = error.response?.data?.message || "Error al actualizar la empresa"
      if (errorMessage.includes("The production field must be true or false")) {
        errorMessage = "El campo de producción debe ser verdadero o falso"
      }
      setSubmitError(errorMessage)
    }
  }

  if (loadingCompany) {
    return (
      <MainLayout>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "70vh" }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
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

        <Paper elevation={3} sx={{ mb: 4 }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="company tabs">
              <Tab label="Información de Empresa" />
              <Tab label="Facturas" />
              <Tab label="Clientes" />
              <Tab label="Productos" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <Business sx={{ fontSize: 40, color: "primary.main", mr: 2 }} />
              <Typography variant="h4">Detalles de Empresa</Typography>
            </Box>

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
                    label="RUC"
                    name="ruc"
                    value={formData.ruc}
                    disabled
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
                    {logoFile ? "Cambiar Logo" : "Actualizar Logo"}
                    <input type="file" hidden accept="image/*" onChange={handleLogoChange} />
                  </Button>
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
                  <Button variant="outlined" component="label" startIcon={<Upload />} fullWidth sx={{ height: "56px" }}>
                    {certFile ? "Cambiar Certificado Digital" : "Actualizar Certificado Digital (.pem)"}
                    <input type="file" hidden accept=".pem,.txt" onChange={handleCertChange} />
                  </Button>
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
                  <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate("/companies")}>
                    Volver
                  </Button>
                  <Button type="submit" variant="contained" startIcon={<Save />} disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : "Guardar Cambios"}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <Receipt sx={{ fontSize: 40, color: "primary.main", mr: 2 }} />
              <Typography variant="h4">Facturas</Typography>
            </Box>
            <Alert severity="info">Aquí se mostrarán las facturas emitidas por esta empresa.</Alert>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <People sx={{ fontSize: 40, color: "primary.main", mr: 2 }} />
              <Typography variant="h4">Clientes</Typography>
            </Box>
            <Alert severity="info">Aquí se mostrarán los clientes registrados para esta empresa.</Alert>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <Inventory sx={{ fontSize: 40, color: "primary.main", mr: 2 }} />
              <Typography variant="h4">Productos</Typography>
            </Box>
            <Alert severity="info">Aquí se mostrarán los productos registrados para esta empresa.</Alert>
          </TabPanel>
        </Paper>
      </Box>
    </MainLayout>
  )
}

export default CompanyDetail
