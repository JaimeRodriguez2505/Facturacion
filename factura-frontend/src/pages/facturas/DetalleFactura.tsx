"use client"

import React, { useState, useEffect } from "react"
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material"
import {
  Receipt,
  PictureAsPdf,
  ArrowBack,
  DarkMode,
  LightMode,
  CheckCircle,
  Warning,
  Error,
  Print,
} from "@mui/icons-material"
import { useNavigate, useParams } from "react-router-dom"
import { facturaService } from "../../service/facturaService"
import { useTheme } from "../../contexts/ThemeContext"
import MainLayout from "../../components/layout/MainLayout"

const DetalleFactura: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { darkMode, toggleDarkMode } = useTheme()
  const [factura, setFactura] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchFactura(id)
    }
  }, [id])

  const fetchFactura = async (facturaId: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await facturaService.getFactura(facturaId)
      if (response.success) {
        setFactura(response.factura)
      } else {
        setError("Error al cargar los detalles de la factura")
      }
    } catch (err: any) {
      console.error("Error al obtener factura:", err)
      setError(err.message || "Error al cargar los detalles de la factura")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerarPDF = async () => {
    if (!id) return
    
    try {
      setLoading(true)
      setError(null)
      const pdfBlob = await facturaService.generarPDFdeFacturaExistente(id)
      
      // Descargar en navegador
      const pdfUrl = URL.createObjectURL(pdfBlob)
      const link = document.createElement("a")
      link.href = pdfUrl
      link.download = `Factura-${factura.serie}-${factura.correlativo}.pdf`
      link.click()
      URL.revokeObjectURL(pdfUrl)
      
      setSuccess("PDF generado correctamente")
    } catch (err: any) {
      console.error("Error al generar PDF:", err)
      setError(err.message || "Error al generar PDF")
    } finally {
      setLoading(false)
    }
  }

  const handlePrintInvoice = () => {
    if (!factura) return
    
    // Crear una nueva ventana para la impresión
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      setError("El navegador bloqueó la ventana emergente. Por favor, permita ventanas emergentes para este sitio.")
      return
    }

    // Estilos CSS para la impresión
    const printStyles = `
      @page {
        size: A4;
        margin: 10mm;
      }
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        color: #000;
        font-size: 12px;
      }
      .invoice-container {
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
        padding: 10px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
      }
      .company-info {
        flex: 1;
      }
      .company-name {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 5px;
      }
      .invoice-title {
        flex: 1;
        text-align: right;
      }
      .invoice-title h1 {
        font-size: 16px;
        font-weight: bold;
        margin: 0;
        color: #000;
      }
      .invoice-number {
        font-size: 14px;
        margin-top: 5px;
      }
      .client-info {
        border: 1px solid #ddd;
        padding: 10px;
        margin-bottom: 20px;
        background-color: #f9f9f9;
      }
      .client-info h2 {
        font-size: 14px;
        margin: 0 0 10px 0;
        padding-bottom: 5px;
        border-bottom: 1px solid #ddd;
      }
      .client-details {
        display: flex;
        flex-wrap: wrap;
      }
      .client-details div {
        flex: 1;
        min-width: 200px;
        margin-bottom: 5px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }
      th {
        background-color: #f2f2f2;
        font-weight: bold;
      }
      .text-right {
        text-align: right;
      }
      .totals {
        width: 100%;
        display: flex;
        justify-content: flex-end;
      }
      .totals-table {
        width: 300px;
        margin-left: auto;
        border-collapse: collapse;
      }
      .totals-table td {
        padding: 5px;
        border: none;
      }
      .totals-table .total-row {
        font-weight: bold;
        font-size: 14px;
        border-top: 1px solid #ddd;
      }
      .amount-in-words {
        font-style: italic;
        margin: 10px 0;
      }
      .footer {
        margin-top: 30px;
        text-align: center;
        font-size: 10px;
        color: #666;
        border-top: 1px solid #ddd;
        padding-top: 10px;
      }
      .qr-code {
        width: 100px;
        height: 100px;
        border: 1px solid #ddd;
        margin-left: auto;
        margin-top: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `

    // Construir el HTML para la impresión
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Factura ${factura.serie}-${factura.correlativo}</title>
        <style>${printStyles}</style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div class="company-info">
              <div class="company-name">${factura.company?.razon_social || "Empresa"}</div>
              <div>RUC: ${factura.company?.ruc || ""}</div>
              <div>Dirección: ${factura.company?.direccion || ""}</div>
            </div>
            <div class="invoice-title">
              <h1>FACTURA ELECTRÓNICA</h1>
              <div class="invoice-number">${factura.serie}-${factura.correlativo}</div>
              <div>Fecha: ${new Date(factura.fecha_emision).toLocaleDateString()}</div>
            </div>
          </div>

          <div class="client-info">
            <h2>Datos del Cliente</h2>
            <div class="client-details">
              <div><strong>RUC/DNI:</strong> ${factura.num_doc_cliente}</div>
              <div><strong>Nombre/Razón Social:</strong> ${factura.nombre_cliente}</div>
              <div><strong>Dirección:</strong> ${factura.direccion_cliente || ""}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Cantidad</th>
                <th>Descripción</th>
                <th class="text-right">Precio Unitario</th>
                <th class="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${factura.detalles.map((detalle: any) => `
                <tr>
                  <td>${detalle.cantidad}</td>
                  <td>${detalle.descripcion}</td>
                  <td class="text-right">S/ ${parseFloat(detalle.precio_unitario).toFixed(2)}</td>
                  <td class="text-right">S/ ${parseFloat(detalle.subtotal).toFixed(2)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div class="totals">
            <table class="totals-table">
              <tr>
                <td>Op. Gravadas:</td>
                <td class="text-right">S/ ${parseFloat(factura.subtotal).toFixed(2)}</td>
              </tr>
              <tr>
                <td>I.G.V. (18%):</td>
                <td class="text-right">S/ ${parseFloat(factura.igv).toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td>TOTAL A PAGAR:</td>
                <td class="text-right">S/ ${parseFloat(factura.total).toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="amount-in-words">
            SON: ${convertirNumeroALetras(parseFloat(factura.total))}
          </div>

          <div class="qr-code">
            QR Code
          </div>

          <div class="footer">
            <p>Representación impresa de la Factura Electrónica</p>
            <p>Consulte su documento en: www.sunat.gob.pe</p>
          </div>
        </div>
      </body>
      </html>
    `)

    // Función para convertir números a letras (simulada)
    function convertirNumeroALetras(numero: number): string {
      // Esta es una implementación simple, en producción deberías usar una biblioteca
      const unidades = ["", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"]
      const decenas = [
        "",
        "DIEZ",
        "VEINTE",
        "TREINTA",
        "CUARENTA",
        "CINCUENTA",
        "SESENTA",
        "SETENTA",
        "OCHENTA",
        "NOVENTA",
      ]

      const parteEntera = Math.floor(numero)
      const parteDecimal = Math.round((numero - parteEntera) * 100)

      if (parteEntera < 10) return `${unidades[parteEntera]} CON ${parteDecimal}/100 SOLES`
      if (parteEntera < 100) return `${decenas[Math.floor(parteEntera / 10)]} Y ${unidades[parteEntera % 10]} CON ${parteDecimal}/100 SOLES`

      return `${Math.floor(parteEntera)} CON ${parteDecimal}/100 SOLES`
    }

    // Cerrar el documento y activar la impresión
    printWindow.document.close()
    printWindow.focus()

    // Pequeño retraso para asegurar que los estilos se carguen correctamente
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

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

  // Obtener el icono según el estado
  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case "Pagada":
        return <CheckCircle color="success" />;
      case "Pendiente":
        return <Warning color="warning" />;
      case "Vencida":
        return <Error color="error" />;
      case "Anulada":
        return <Error />;
      default:
        return undefined; // Cambia null por undefined
    }
  }
  
  // En tu componente Chip:
  <Chip
    label={factura.estado}
    color={getChipColor(factura.estado)}
    size="small"
    icon={getStatusIcon(factura.estado)} // Ahora será undefined en lugar de null
    sx={{ ml: 2 }}
  />

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
            <Typography variant="h4">Detalle de Factura</Typography>
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

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : !factura ? (
            <Alert severity="error">No se encontró la factura solicitada.</Alert>
          ) : (
            <>
              {/* Información de la factura */}
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Información de la Factura
                      </Typography>
                      <Chip
                        label={factura.estado}
                        color={getChipColor(factura.estado)}
                        size="small"
                        icon={getStatusIcon(factura.estado)}
                        sx={{ ml: 2 }}
                      />
                    </Box>
                    <Typography variant="body1">
                      <strong>Serie-Correlativo:</strong> {factura.serie}-{factura.correlativo}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Fecha de Emisión:</strong> {new Date(factura.fecha_emision).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Datos del Cliente
                    </Typography>
                    <Typography variant="body1">
                      <strong>
                        {factura.tipo_doc_cliente === "6"
                          ? "RUC"
                          : factura.tipo_doc_cliente === "1"
                            ? "DNI"
                            : "Doc. Identidad"}
                        :
                      </strong>{" "}
                      {factura.num_doc_cliente}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Nombre/Razón Social:</strong> {factura.nombre_cliente}
                    </Typography>
                    {factura.direccion_cliente && (
                      <Typography variant="body1">
                        <strong>Dirección:</strong> {factura.direccion_cliente}
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </Paper>

              {/* Detalles de la factura */}
              <Typography variant="h6" gutterBottom>
                Detalles de la Factura
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Descripción</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      <TableCell align="right">Precio Unitario</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {factura.detalles.map((detalle: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{detalle.descripcion}</TableCell>
                        <TableCell align="right">{detalle.cantidad}</TableCell>
                        <TableCell align="right">S/ {parseFloat(detalle.precio_unitario).toFixed(2)}</TableCell>
                        <TableCell align="right">S/ {parseFloat(detalle.subtotal).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Totales */}
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", mb: 3 }}>
                <Typography variant="subtitle1">
                  <strong>Subtotal:</strong> S/ {parseFloat(factura.subtotal).toFixed(2)}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>IGV (18%):</strong> S/ {parseFloat(factura.igv).toFixed(2)}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  <strong>Total:</strong> S/ {parseFloat(factura.total).toFixed(2)}
                </Typography>
              </Box>

              {/* Respuesta de SUNAT */}
              {factura.sunat_response && (
                <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Respuesta de SUNAT
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={factura.sunat_response.success ? "Aceptada por SUNAT" : "Rechazada por SUNAT"}
                      color={factura.sunat_response.success ? "success" : "error"}
                      sx={{ mb: 1 }}
                    />
                  </Box>
                  {factura.sunat_response.error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">
                        <strong>Código de error:</strong> {factura.sunat_response.error.code}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Mensaje:</strong> {factura.sunat_response.error.message}
                      </Typography>
                    </Alert>
                  )}
                  {factura.sunat_response.cdrResponse && (
                    <Box>
                      <Typography variant="subtitle2">
                        <strong>Código CDR:</strong> {factura.sunat_response.cdrResponse.code}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Descripción:</strong> {factura.sunat_response.cdrResponse.description}
                      </Typography>
                      {factura.sunat_response.cdrResponse.notes && factura.sunat_response.cdrResponse.notes.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="subtitle2">
                            <strong>Notas:</strong>
                          </Typography>
                          <ul>
                            {factura.sunat_response.cdrResponse.notes.map((note: string, index: number) => (
                              <li key={index}>{note}</li>
                            ))}
                          </ul>
                        </Box>
                      )}
                    </Box>
                  )}
                </Paper>
              )}

              {/* Botones de acción */}
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
                <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate("/facturas")}>
                  Volver a la lista
                </Button>
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<Print />}
                    onClick={handlePrintInvoice}
                    sx={{ mr: 2 }}
                    disabled={factura.estado === "Anulada"}
                  >
                    Imprimir
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<PictureAsPdf />}
                    onClick={handleGenerarPDF}
                    disabled={factura.estado === "Anulada"}
                  >
                    Generar PDF
                  </Button>
                </Box>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </MainLayout>
  )
}

export default DetalleFactura
