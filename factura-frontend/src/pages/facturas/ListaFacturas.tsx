"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material"
import {
  Receipt,
  PictureAsPdf,
  Delete,
  Edit,
  Visibility,
  Search,
  FilterList,
  Refresh,
  ArrowBack,
  DarkMode,
  LightMode,
} from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { useCompany } from "../../contexts/CompanyContext"
import { facturaService } from "../../service/facturaService"
import { useTheme } from "../../contexts/ThemeContext"
import MainLayout from "../../components/layout/MainLayout"

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

  // Cargar facturas al montar el componente
  useEffect(() => {
    fetchFacturas()
  }, [selectedCompany])

  const fetchFacturas = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await facturaService.getFacturas()
      if (response.success) {
        setFacturas(response.facturas || [])
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
    fetchFacturas().finally(() => {
      setRefreshing(false)
    })
  }

  // Modificar el método handleGenerarPDF para mostrar un mensaje de error más detallado
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

          setSuccess("PDF generado correctamente")
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

        // Mostrar un mensaje de error más descriptivo
        let errorMessage = err.message || "Error al generar PDF"

        // Agregar sugerencia para solucionar el problema
        if (errorMessage.includes("500") || errorMessage.includes("interno del servidor")) {
          errorMessage +=
            "\n\nSugerencia: Verifique que en el backend, el método generatePdfReport() en SunatService.php esté devolviendo el PDF en lugar de solo guardarlo en el almacenamiento."
        }

        setError(errorMessage)
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

  // Obtener el color del chip según el estado
  const getChipColor = (estado: string) => {
    switch (estado) {
      case "Pagada":
        return "success"
      case "Pendiente":
        return "warning"
      case "Vencida":
        return "error"
      case "Anulada":
        return "default"
      default:
        return "default"
    }
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
            <Receipt sx={{ fontSize: 40, color: "primary.main", mr: 2 }} />
            <Typography variant="h4">Facturas Emitidas</Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          {/* Filtros y búsqueda */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
            <TextField
              label="Buscar"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flexGrow: 1, minWidth: "200px" }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size="small" sx={{ minWidth: "150px" }}>
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

            <Button variant="outlined" startIcon={<Refresh />} onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? "Actualizando..." : "Actualizar"}
            </Button>

            <Button variant="contained" startIcon={<Receipt />} onClick={() => navigate("/facturas/nueva")}>
              Nueva Factura
            </Button>
          </Box>

          {/* Tabla de facturas */}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredFacturas.length === 0 ? (
            <Alert severity="info">
              No se encontraron facturas. {searchTerm || filterEstado !== "Todos" ? "Intenta con otros filtros." : ""}
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Serie-Correlativo</TableCell>
                    <TableCell>Fecha Emisión</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredFacturas.map((factura) => (
                    <TableRow key={factura.id}>
                      <TableCell>
                        {factura.serie}-{factura.correlativo}
                      </TableCell>
                      <TableCell>{new Date(factura.fecha_emision).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {factura.nombre_cliente}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {factura.tipo_doc_cliente === "6" ? "RUC: " : "Doc: "}
                          {factura.num_doc_cliente}
                        </Typography>
                      </TableCell>
                      <TableCell>S/ {Number.parseFloat(factura.total).toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip label={factura.estado} color={getChipColor(factura.estado)} size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                          <Tooltip title="Ver detalles">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => navigate(`/facturas/${factura.id}`)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Generar PDF">
                            <IconButton
                              size="small"
                              color="secondary"
                              onClick={() => handleGenerarPDF(factura.id)}
                              disabled={factura.estado === "Anulada" || pdfLoading === factura.id}
                            >
                              {pdfLoading === factura.id ? (
                                <CircularProgress size={20} color="secondary" />
                              ) : (
                                <PictureAsPdf fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>

                          {factura.estado !== "Anulada" && (
                            <Tooltip title="Anular factura">
                              <IconButton size="small" color="error" onClick={() => handleAnularFactura(factura.id)}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {factura.estado === "Pendiente" && (
                            <Tooltip title="Marcar como pagada">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleCambiarEstado(factura.id, "Pagada")}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Botón para volver */}
          <Box sx={{ mt: 3 }}>
            <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate("/dashboard")}>
              Volver al Dashboard
            </Button>
          </Box>
        </Paper>

        {/* Diálogo de confirmación para anular factura */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
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

