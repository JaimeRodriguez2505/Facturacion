"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Zoom,
  Fade,
} from "@mui/material"
import {
  Receipt,
  PictureAsPdf,
  Delete,
  Search,
  FilterList,
  Refresh,
  ArrowBack,
  DarkMode,
  LightMode,
  CheckCircle,
  Warning,
  Error,
  Block,
  Add,
  ReceiptLong,
} from "@mui/icons-material"
import { useCompany } from "../../contexts/CompanyContext"
import { facturaService } from "../../service/facturaService"
import { useTheme } from "../../contexts/ThemeContext"
import MainLayout from "../../components/layout/MainLayout"
import LoadingOverlay from "../../components/LoadingOverlay"

// Importar estilos específicos para esta página
import "../../css/ListaFacturas.css"

const ListaFacturas: React.FC = () => {
  const navigate = useNavigate()
  const { selectedCompany } = useCompany()
  const { darkMode, toggleDarkMode } = useTheme()
  const [facturas, setFacturas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [facturaToDelete, setFacturaToDelete] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterEstado, setFilterEstado] = useState("Todos")
  const [refreshing, setRefreshing] = useState(false)
  const [pdfLoading, setPdfLoading] = useState<string | null>(null)
  const [hasLoadedFacturas, setHasLoadedFacturas] = useState(false)
  const [animateRefresh, setAnimateRefresh] = useState(false)

  // Cargar facturas al montar el componente
  useEffect(() => {
    if (!hasLoadedFacturas) {
      fetchFacturas()
    }
  }, [selectedCompany, hasLoadedFacturas])

  // Efecto para limpiar mensajes después de un tiempo
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }

    if (error) {
      const timer = setTimeout(() => {
        setError(null)
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  const fetchFacturas = async () => {
    if (loading && hasLoadedFacturas) return

    try {
      setLoading(true)
      setError(null)
      const response = await facturaService.getFacturas()
      if (response.success) {
        setFacturas(response.facturas || [])
        setHasLoadedFacturas(true)
      } else {
        setError("Error al cargar las facturas")
      }
    } catch (err: any) {
      console.error("Error al obtener facturas:", err)
      setError(err.message || "Error al cargar las facturas")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    setAnimateRefresh(true)
    setHasLoadedFacturas(false)
    fetchFacturas().finally(() => {
      setRefreshing(false)
      setTimeout(() => setAnimateRefresh(false), 500)
    })
  }

  const handleGenerarPDF = async (id: string) => {
    try {
      setPdfLoading(id)
      setError(null)

      console.log(`Generando PDF para factura ID: ${id}`)

      try {
        const pdfBlob = await facturaService.generarPDFdeFacturaExistente(id)

        // Verificar el tipo de contenido del blob
        console.log("Tipo de blob recibido:", pdfBlob.type)

        if (pdfBlob.type === "application/pdf") {
          // Descargar en navegador
          const pdfUrl = URL.createObjectURL(pdfBlob)
          const link = document.createElement("a")
          link.href = pdfUrl
          link.download = `Factura-${id}.pdf`
          link.click()
          URL.revokeObjectURL(pdfUrl)

          setSuccess("PDF generado y descargado correctamente")
        } else {
          // Si no es un PDF, mostrar un error
          setError("El servidor no devolvió un PDF válido. Contacte al administrador.")

          // Intentar leer el contenido del blob para mostrar más detalles
          const reader = new FileReader()
          reader.onload = () => {
            try {
              const result = reader.result as string
              console.error("Contenido de la respuesta no-PDF:", result)
              if (result.includes("{")) {
                try {
                  const jsonResponse = JSON.parse(result)
                  setError(`Error del servidor: ${jsonResponse.message || "Error desconocido"}`)
                } catch (e) {
                  // Si no se puede parsear como JSON, mostrar los primeros 100 caracteres
                  setError(`Error del servidor: ${result.substring(0, 100)}...`)
                }
              }
            } catch (e) {
              console.error("Error al leer la respuesta:", e)
            }
          }
          reader.readAsText(pdfBlob)
        }
      } catch (err: any) {
        console.error("Error al generar PDF:", err)
        setError(err.message || "Error al generar PDF")
      }
    } finally {
      setPdfLoading(null)
    }
  }

  const handleAnularFactura = (id: string) => {
    setFacturaToDelete(id)
    setOpenDialog(true)
  }

  const confirmAnularFactura = async () => {
    if (!facturaToDelete) return

    try {
      setLoading(true)
      setError(null)
      const response = await facturaService.anularFactura(facturaToDelete)
      if (response.success) {
        setSuccess("Factura anulada correctamente")
        // Actualizar la lista de facturas
        fetchFacturas()
      } else {
        setError("Error al anular la factura")
      }
    } catch (err: any) {
      console.error("Error al anular factura:", err)
      setError(err.message || "Error al anular la factura")
    } finally {
      setLoading(false)
      setOpenDialog(false)
      setFacturaToDelete(null)
    }
  }

  const handleCambiarEstado = async (id: string, nuevoEstado: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await facturaService.actualizarEstadoFactura(id, nuevoEstado)
      if (response.success) {
        setSuccess(`Estado de factura actualizado a ${nuevoEstado}`)
        // Actualizar la lista de facturas
        fetchFacturas()
      } else {
        setError("Error al actualizar el estado de la factura")
      }
    } catch (err: any) {
      console.error("Error al actualizar estado:", err)
      setError(err.message || "Error al actualizar el estado de la factura")
    } finally {
      setLoading(false)
    }
  }

  // Filtrar facturas según búsqueda y estado
  const filteredFacturas = facturas.filter((factura) => {
    const matchesSearch =
      factura.serie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factura.correlativo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factura.nombre_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factura.num_doc_cliente?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesEstado = filterEstado === "Todos" || factura.estado === filterEstado

    return matchesSearch && matchesEstado
  })

  // Obtener el icono según el estado
  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case "Pagada":
        return <CheckCircle className="facturas-chip-icon" />
      case "Pendiente":
        return <Warning className="facturas-chip-icon" />
      case "Vencida":
        return <Error className="facturas-chip-icon" />
      case "Anulada":
        return <Block className="facturas-chip-icon" />
      default:
        return null
    }
  }

  // Función para navegar a la factura al hacer clic en la fila
  const handleRowClick = (id: string) => {
    navigate(`/facturas/${id}`)
  }

  return (
    <MainLayout>
      {loading && !refreshing && <LoadingOverlay message="Cargando facturas..." />}

      <Box className="facturas-container" sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
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

        <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, mb: 4, borderRadius: 2 }}>
          <Box className="facturas-header">
            <Receipt className="facturas-header-icon" />
            <Typography variant="h4" className="facturas-title">
              Facturas Emitidas
            </Typography>
          </Box>

          {error && (
            <Fade in={!!error}>
              <Alert severity="error" sx={{ mb: 3 }} className="alert-animation">
                {error}
              </Alert>
            </Fade>
          )}

          {success && (
            <Fade in={!!success}>
              <Alert severity="success" sx={{ mb: 3 }} className="alert-animation">
                {success}
              </Alert>
            </Fade>
          )}

          {/* Filtros y búsqueda */}
          <Box className="facturas-filters">
            <TextField
              label="Buscar"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="facturas-search"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size="small" className="facturas-filter-select">
              <InputLabel id="filter-estado-label">Estado</InputLabel>
              <Select
                labelId="filter-estado-label"
                value={filterEstado}
                label="Estado"
                onChange={(e) => setFilterEstado(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <FilterList />
                  </InputAdornment>
                }
              >
                <MenuItem value="Todos">Todos</MenuItem>
                <MenuItem value="Pagada">Pagada</MenuItem>
                <MenuItem value="Pendiente">Pendiente</MenuItem>
                <MenuItem value="Vencida">Vencida</MenuItem>
                <MenuItem value="Anulada">Anulada</MenuItem>
              </Select>
            </FormControl>

            <Button variant="outlined" className="btn-actualizar" onClick={handleRefresh} disabled={refreshing}>
              <Refresh className={`refresh-icon ${animateRefresh ? "animate-spin" : ""}`} sx={{ mr: 1 }} />
              {refreshing ? "Actualizando..." : "Actualizar"}
            </Button>

            <Button
              variant="contained"
              className="btn-nueva-factura"
              onClick={() => navigate("/facturas/nueva")}
              startIcon={<Add />}
            >
              Nueva Factura
            </Button>
          </Box>

          {/* Tabla de facturas */}
          {refreshing ? (
            <Box className="facturas-loading">
              <CircularProgress />
            </Box>
          ) : filteredFacturas.length === 0 && !loading ? (
            <Box className="facturas-empty">
              <ReceiptLong className="facturas-empty-icon" />
              <Typography variant="h6" gutterBottom>
                No se encontraron facturas
              </Typography>
              <Typography variant="body1">
                {searchTerm || filterEstado !== "Todos"
                  ? "Intenta con otros filtros o crea una nueva factura."
                  : "Comienza creando tu primera factura."}
              </Typography>
            </Box>
          ) : (
            <div className="facturas-table-container">
              <table className="facturas-table">
                <thead className="facturas-table-head">
                  <tr>
                    <th>Serie-Correlativo</th>
                    <th>Fecha Emisión</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFacturas.map((factura) => (
                    <tr
                      key={factura.id}
                      className="facturas-table-row"
                      onClick={() => handleRowClick(factura.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <td className="facturas-table-cell">
                        {factura.serie}-{factura.correlativo}
                      </td>
                      <td className="facturas-table-cell">{new Date(factura.fecha_emision).toLocaleDateString()}</td>
                      <td className="facturas-table-cell">
                        <div className="facturas-cliente-info">
                          <span className="facturas-cliente-nombre">{factura.nombre_cliente}</span>
                          <span className="facturas-cliente-doc">
                            {factura.tipo_doc_cliente === "6" ? "RUC: " : "Doc: "}
                            {factura.num_doc_cliente}
                          </span>
                        </div>
                      </td>
                      <td className="facturas-table-cell facturas-monto">
                        S/ {Number.parseFloat(factura.total).toFixed(2)}
                      </td>
                      <td className="facturas-table-cell">
                        <div className={`facturas-chip ${factura.estado.toLowerCase()}`}>
                          {getStatusIcon(factura.estado)}
                          {factura.estado}
                        </div>
                      </td>
                      <td className="facturas-table-cell" onClick={(e) => e.stopPropagation()}>
                        <div className="facturas-actions">
                          <Tooltip title="Generar PDF">
                            <button
                              className="facturas-action-button pdf"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleGenerarPDF(factura.id)
                              }}
                              disabled={factura.estado === "Anulada" || pdfLoading === factura.id}
                            >
                              {pdfLoading === factura.id ? (
                                <CircularProgress size={16} />
                              ) : (
                                <PictureAsPdf fontSize="small" />
                              )}
                            </button>
                          </Tooltip>

                          {factura.estado !== "Anulada" && (
                            <Tooltip title="Anular factura">
                              <button
                                className="facturas-action-button delete"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAnularFactura(factura.id)
                                }}
                              >
                                <Delete fontSize="small" />
                              </button>
                            </Tooltip>
                          )}

                          {factura.estado === "Pendiente" && (
                            <Tooltip title="Marcar como pagada">
                              <button
                                className="facturas-action-button paid"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCambiarEstado(factura.id, "Pagada")
                                }}
                              >
                                <CheckCircle fontSize="small" />
                              </button>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Botón para volver */}
          <Box sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate("/dashboard")}
              className="facturas-back-button"
            >
              Volver al Dashboard
            </Button>
          </Box>
        </Paper>

        {/* Diálogo de confirmación para anular factura */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          TransitionComponent={Zoom}
          className="dialog-animation"
        >
          <DialogTitle>Confirmar anulación</DialogTitle>
          <DialogContent>
            <DialogContentText>
              ¿Está seguro de que desea anular esta factura? Esta acción no se puede deshacer.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button onClick={confirmAnularFactura} color="error" autoFocus>
              Anular
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  )
}

export default ListaFacturas

