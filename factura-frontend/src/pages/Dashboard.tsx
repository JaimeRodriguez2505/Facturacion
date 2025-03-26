"use client"

import React from "react"

import { useState, useEffect } from "react"
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  Button,
  Alert,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Menu,
  MenuItem,
  useTheme,
} from "@mui/material"
import {
  Receipt,
  People,
  Inventory,
  AttachMoney,
  Business,
  Add,
  DarkMode,
  LightMode,
  TrendingUp,
  TrendingDown,
  MoreVert,
  CalendarToday,
  CheckCircle,
  Warning,
  Error,
  ArrowForward,
  Refresh,
  Dashboard as DashboardIcon,
  BarChart,
  PieChart,
  Timeline,
} from "@mui/icons-material"
import MainLayout from "../components/layout/MainLayout"
import { useCompany } from "../contexts/CompanyContext"
import { useTheme as useAppTheme } from "../contexts/ThemeContext"
import { useNavigate } from "react-router-dom"
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { facturaService } from "../service/facturaService"

// Mock data for charts
const monthlyInvoiceData = [
  { name: "Ene", value: 12 },
  { name: "Feb", value: 19 },
  { name: "Mar", value: 15 },
  { name: "Abr", value: 25 },
  { name: "May", value: 32 },
  { name: "Jun", value: 28 },
  { name: "Jul", value: 35 },
  { name: "Ago", value: 40 },
  { name: "Sep", value: 43 },
  { name: "Oct", value: 38 },
  { name: "Nov", value: 45 },
  { name: "Dic", value: 50 },
]

const revenueData = [
  { name: "Ene", value: 4000 },
  { name: "Feb", value: 5000 },
  { name: "Mar", value: 4500 },
  { name: "Abr", value: 6000 },
  { name: "May", value: 7500 },
  { name: "Jun", value: 7000 },
  { name: "Jul", value: 8500 },
  { name: "Ago", value: 9000 },
  { name: "Sep", value: 9500 },
  { name: "Oct", value: 8800 },
  { name: "Nov", value: 10500 },
  { name: "Dic", value: 12000 },
]

const invoiceStatusData = [
  { name: "Pagadas", value: 65, color: "#4caf50" },
  { name: "Pendientes", value: 25, color: "#ff9800" },
  { name: "Vencidas", value: 10, color: "#f44336" },
]

const COLORS = ["#4caf50", "#ff9800", "#f44336"]

// Mock data for recent invoices
const recentInvoicesMock = [
  { id: "F001-00123", client: "Empresa ABC S.A.C.", date: "2023-12-15", amount: 1250.0, status: "Pagada" },
  { id: "F001-00122", client: "Comercial XYZ E.I.R.L.", date: "2023-12-14", amount: 850.5, status: "Pendiente" },
  { id: "F001-00121", client: "Distribuidora 123 S.A.", date: "2023-12-12", amount: 3200.75, status: "Pagada" },
  { id: "F001-00120", client: "Servicios Generales Lima", date: "2023-12-10", amount: 560.0, status: "Vencida" },
  { id: "F001-00119", client: "Importaciones del Sur", date: "2023-12-08", amount: 1890.3, status: "Pagada" },
]

// Mock data for top clients
const topClients = [
  { name: "Empresa ABC S.A.C.", invoices: 32, amount: 45600.0 },
  { name: "Comercial XYZ E.I.R.L.", invoices: 28, amount: 38500.5 },
  { name: "Distribuidora 123 S.A.", invoices: 25, amount: 32000.75 },
  { name: "Servicios Generales Lima", invoices: 20, amount: 28600.0 },
]

const Dashboard: React.FC = () => {
  const { companies, selectedCompany } = useCompany()
  const { darkMode, toggleDarkMode } = useAppTheme()
  const navigate = useNavigate()
  const theme = useTheme()
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState("month")
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [recentInvoices, setRecentInvoices] = useState<any[]>([])

  // Handle menu open/close
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  // Handle time range change
  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range)
    handleMenuClose()
  }

  // Simulate data refresh
  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
    }, 1500)
  }

  // Fix the navigation to the new invoice page
  const handleCreateInvoice = () => {
    if (selectedCompany) {
      navigate("/facturas/nueva")
    } else {
      navigate("/companies")
    }
  }

  useEffect(() => {

    // Cargar facturas recientes
    const fetchRecentInvoices = async () => {
      try {
        const response = await facturaService.getFacturas()
        if (response.success && response.facturas) {
          // Ordenar por fecha de emisión (más recientes primero) y tomar las primeras 5
          const recentOnes = [...response.facturas]
            .sort((a, b) => new Date(b.fecha_emision).getTime() - new Date(a.fecha_emision).getTime())
            .slice(0, 5)
          setRecentInvoices(recentOnes)
        }
      } catch (error) {
        console.error("Error al cargar facturas recientes:", error)
      }
    }

    if (selectedCompany) {
      fetchRecentInvoices()
    }
  }, [selectedCompany])

  // Si no hay empresas, mostrar un mensaje para crear una
  if (companies.length === 0) {
    return (
      <MainLayout>
        <Box sx={{ flexGrow: 1, p: 3 }}>
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

          <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
            <Business sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Bienvenido al Sistema de Facturación
            </Typography>
            <Typography variant="body1" paragraph>
              Para comenzar a generar facturas, primero debes registrar una empresa.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<Add />}
              onClick={() => navigate("/companies/new")}
              sx={{ mt: 2 }}
            >
              Registrar Empresa
            </Button>
          </Paper>
        </Box>
      </MainLayout>
    )
  }

  // Si hay empresas pero no hay una seleccionada
  if (!selectedCompany) {
    return (
      <MainLayout>
        <Box sx={{ flexGrow: 1, p: 3 }}>
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

          <Alert severity="info" sx={{ mb: 3 }}>
            Selecciona una empresa para comenzar a trabajar
          </Alert>
          <Grid container spacing={3}>
            {companies.map((company) => (
              <Grid item xs={12} md={4} key={company.ruc}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      boxShadow: 6,
                    },
                  }}
                  onClick={() => navigate(`/companies/${company.ruc}`)}
                >
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Business sx={{ fontSize: 40, color: "primary.main", mr: 2 }} />
                    <Typography variant="h5" component="div">
                      {company.razon_social}
                    </Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    RUC: {company.ruc}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {company.direccion}
                  </Typography>
                  <Box sx={{ mt: "auto", pt: 2 }}>
                    <Button variant="contained" fullWidth>
                      Seleccionar
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </MainLayout>
    )
  }

  // Dashboard normal con empresa seleccionada
  return (
    <MainLayout>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <DashboardIcon sx={{ fontSize: 32, color: "primary.main", mr: 1.5 }} />
            <Typography variant="h4" fontWeight="medium">
              Dashboard
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={refreshing}
              size="small"
            >
              {refreshing ? "Actualizando..." : "Actualizar"}
            </Button>
            <Button variant="outlined" endIcon={<MoreVert />} onClick={handleMenuClick} size="small">
              {timeRange === "day"
                ? "Hoy"
                : timeRange === "week"
                  ? "Esta semana"
                  : timeRange === "month"
                    ? "Este mes"
                    : "Este año"}
            </Button>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
              <MenuItem onClick={() => handleTimeRangeChange("day")}>Hoy</MenuItem>
              <MenuItem onClick={() => handleTimeRangeChange("week")}>Esta semana</MenuItem>
              <MenuItem onClick={() => handleTimeRangeChange("month")}>Este mes</MenuItem>
              <MenuItem onClick={() => handleTimeRangeChange("year")}>Este año</MenuItem>
            </Menu>
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
        </Box>

        {refreshing && <LinearProgress sx={{ mb: 3 }} />}

        {/* Información de la empresa */}
        <Paper elevation={3} sx={{ p: 3, mb: 4, mt: 1, borderRadius: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: "primary.main",
                mr: 2,
              }}
            >
              <Business sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h5" component="div" fontWeight="bold">
                {selectedCompany.razon_social}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                RUC: {selectedCompany.ruc} • {selectedCompany.direccion}
              </Typography>
            </Box>
            <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
              <Button variant="outlined" color="primary" onClick={() => navigate(`/companies/${selectedCompany.ruc}`)}>
                Ver Detalles
              </Button>
              <Button variant="contained" color="primary" onClick={handleCreateInvoice} startIcon={<Add />}>
                Nueva Factura
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Tarjetas de resumen */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={2}
              sx={{
                borderRadius: 2,
                height: "100%",
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: 6,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <Typography variant="h6" fontWeight="medium">
                    Ventas Totales
                  </Typography>
                  <Avatar sx={{ bgcolor: "primary.light", width: 40, height: 40 }}>
                    <AttachMoney />
                  </Avatar>
                </Box>
                <Typography variant="h4" component="div" fontWeight="bold" sx={{ mb: 1 }}>
                  S/. 12,450.00
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <TrendingUp sx={{ color: "success.main", mr: 0.5, fontSize: 20 }} />
                  <Typography variant="body2" color="success.main" fontWeight="medium">
                    +15%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                    vs. mes anterior
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={2}
              sx={{
                borderRadius: 2,
                height: "100%",
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: 6,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <Typography variant="h6" fontWeight="medium">
                    Facturas
                  </Typography>
                  <Avatar sx={{ bgcolor: "success.light", width: 40, height: 40 }}>
                    <Receipt />
                  </Avatar>
                </Box>
                <Typography variant="h4" component="div" fontWeight="bold" sx={{ mb: 1 }}>
                  45
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <TrendingUp sx={{ color: "success.main", mr: 0.5, fontSize: 20 }} />
                  <Typography variant="body2" color="success.main" fontWeight="medium">
                    +8%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                    vs. mes anterior
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={2}
              sx={{
                borderRadius: 2,
                height: "100%",
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: 6,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <Typography variant="h6" fontWeight="medium">
                    Clientes
                  </Typography>
                  <Avatar sx={{ bgcolor: "warning.light", width: 40, height: 40 }}>
                    <People />
                  </Avatar>
                </Box>
                <Typography variant="h4" component="div" fontWeight="bold" sx={{ mb: 1 }}>
                  28
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <TrendingUp sx={{ color: "success.main", mr: 0.5, fontSize: 20 }} />
                  <Typography variant="body2" color="success.main" fontWeight="medium">
                    +3%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                    vs. mes anterior
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={2}
              sx={{
                borderRadius: 2,
                height: "100%",
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: 6,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <Typography variant="h6" fontWeight="medium">
                    Productos
                  </Typography>
                  <Avatar sx={{ bgcolor: "info.light", width: 40, height: 40 }}>
                    <Inventory />
                  </Avatar>
                </Box>
                <Typography variant="h4" component="div" fontWeight="bold" sx={{ mb: 1 }}>
                  124
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <TrendingDown sx={{ color: "error.main", mr: 0.5, fontSize: 20 }} />
                  <Typography variant="body2" color="error.main" fontWeight="medium">
                    -2%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                    vs. mes anterior
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Gráficos y estadísticas */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <Card elevation={2} sx={{ borderRadius: 2, height: "100%" }}>
              <CardHeader
                title="Facturas Emitidas"
                subheader={`Evolución de facturas emitidas (${timeRange === "day" ? "Hoy" : timeRange === "week" ? "Esta semana" : timeRange === "month" ? "Este mes" : "Este año"})`}
                action={
                  <IconButton>
                    <BarChart />
                  </IconButton>
                }
              />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={monthlyInvoiceData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="value" fill={theme.palette.primary.main} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={2} sx={{ borderRadius: 2, height: "100%" }}>
              <CardHeader
                title="Estado de Facturas"
                subheader="Distribución por estado"
                action={
                  <IconButton>
                    <PieChart />
                  </IconButton>
                }
              />
              <CardContent>
                <Box sx={{ height: 300, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <ResponsiveContainer width="100%" height="80%">
                    <RechartsPieChart>
                      <Pie
                        data={invoiceStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {invoiceStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 2 }}>
                    {invoiceStatusData.map((entry, index) => (
                      <Box key={index} sx={{ display: "flex", alignItems: "center" }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: COLORS[index], mr: 1 }} />
                        <Typography variant="body2">{entry.name}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Ingresos y Facturas Recientes */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <Card elevation={2} sx={{ borderRadius: 2 }}>
              <CardHeader
                title="Ingresos"
                subheader={`Evolución de ingresos (${timeRange === "day" ? "Hoy" : timeRange === "week" ? "Esta semana" : timeRange === "month" ? "Este mes" : "Este año"})`}
                action={
                  <IconButton>
                    <Timeline />
                  </IconButton>
                }
              />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={revenueData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip formatter={(value) => [`S/ ${value}`, "Ingresos"]} />
                      <Line type="monotone" dataKey="value" stroke={theme.palette.primary.main} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={2} sx={{ borderRadius: 2, height: "100%" }}>
              <CardHeader
                title="Facturas Recientes"
                action={
                  <Button endIcon={<ArrowForward />} size="small" onClick={() => navigate("/facturas")}>
                    Ver todas
                  </Button>
                }
              />
              <CardContent sx={{ pt: 0 }}>
                <List sx={{ width: "100%" }}>
                  {recentInvoices.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                      No hay facturas recientes
                    </Typography>
                  ) : (
                    recentInvoices.map((invoice, index) => (
                      <React.Fragment key={invoice.id}>
                        <ListItem
                          alignItems="flex-start"
                          secondaryAction={
                            <Chip
                              label={invoice.estado}
                              size="small"
                              color={
                                invoice.estado === "Pagada"
                                  ? "success"
                                  : invoice.estado === "Pendiente"
                                    ? "warning"
                                    : "error"
                              }
                            />
                          }
                          sx={{ px: 0 }}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            {invoice.estado === "Pagada" ? (
                              <CheckCircle color="success" />
                            ) : invoice.estado === "Pendiente" ? (
                              <Warning color="warning" />
                            ) : (
                              <Error color="error" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body2" fontWeight="medium">
                                {invoice.serie}-{invoice.correlativo} - {invoice.nombre_cliente}
                              </Typography>
                            }
                            secondary={
                              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                  <CalendarToday sx={{ fontSize: 14, mr: 0.5 }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(invoice.fecha_emision).toLocaleDateString()}
                                  </Typography>
                                </Box>
                                <Typography variant="body2" fontWeight="medium">
                                  S/ {Number(invoice.total).toFixed(2)}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < recentInvoices.length - 1 && <Divider variant="inset" component="li" />}
                      </React.Fragment>
                    ))
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Clientes principales y Acciones rápidas */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ borderRadius: 2 }}>
              <CardHeader
                title="Clientes Principales"
                action={
                  <Button endIcon={<ArrowForward />} size="small" onClick={() => navigate("/clientes")}>
                    Ver todos
                  </Button>
                }
              />
              <CardContent sx={{ pt: 0 }}>
                <List sx={{ width: "100%" }}>
                  {topClients.map((client, index) => (
                    <React.Fragment key={client.name}>
                      <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.light", fontSize: "0.875rem" }}>
                            {client.name.charAt(0)}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight="medium">
                              {client.name}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                {client.invoices} facturas
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                S/ {client.amount.toFixed(2)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < topClients.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ borderRadius: 2 }}>
              <CardHeader title="Acciones Rápidas" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Receipt />}
                      onClick={() => navigate("/facturas/nueva")}
                      sx={{ py: 1.5, justifyContent: "flex-start" }}
                    >
                      Nueva Factura
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<People />}
                      onClick={() => navigate("/clientes/nuevo")}
                      sx={{ py: 1.5, justifyContent: "flex-start" }}
                    >
                      Nuevo Cliente
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Inventory />}
                      onClick={() => navigate("/productos/nuevo")}
                      sx={{ py: 1.5, justifyContent: "flex-start" }}
                    >
                      Nuevo Producto
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Business />}
                      onClick={() => navigate("/companies/new")}
                      sx={{ py: 1.5, justifyContent: "flex-start" }}
                    >
                      Nueva Empresa
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </MainLayout>
  )
}

export default Dashboard

