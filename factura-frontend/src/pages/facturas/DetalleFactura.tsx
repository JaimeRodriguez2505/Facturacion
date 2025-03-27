"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
  Person,
  Description,
  CloudDone,
} from "@mui/icons-material"
import { useNavigate, useParams } from "react-router-dom"
import { facturaService } from "../../service/facturaService"
import { useTheme } from "../../contexts/ThemeContext"
import MainLayout from "../../components/layout/MainLayout"

// Importar estilos específicos para esta página
import "../../css/detalle-factura.css"

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
    if (!id) {
      setError("ID de factura no válido");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      console.log(`Generando PDF para factura ID: ${id}`);

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
      setLoading(false);
    }
  }

  const handlePrintInvoice = () => {
    if (!factura) {
      setError("No hay datos de factura para imprimir");
      return;
    }

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
              ${factura.detalles
                .map(
                  (detalle: any) => `
                <tr>
                  <td>${detalle.cantidad}</td>
                  <td>${detalle.descripcion}</td>
                  <td class="text-right">S/ ${Number.parseFloat(detalle.precio_unitario).toFixed(2)}</td>
                  <td class="text-right">S/ ${Number.parseFloat(detalle.subtotal).toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>

          <div class="totals">
            <table class="totals-table">
              <tr>
                <td>Op. Gravadas:</td>
                <td class="text-right">S/ ${Number.parseFloat(factura.subtotal).toFixed(2)}</td>
              </tr>
              <tr>
                <td>I.G.V. (18%):</td>
                <td class="text-right">S/ ${Number.parseFloat(factura.igv).toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td>TOTAL A PAGAR:</td>
                <td class="text-right">S/ ${Number.parseFloat(factura.total).toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="amount-in-words">
            SON: ${convertirNumeroALetras(Number.parseFloat(factura.total))}
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
      if (parteEntera < 100)
        return `${decenas[Math.floor(parteEntera / 10)]} Y ${unidades[parteEntera % 10]} CON ${parteDecimal}/100 SOLES`

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
  const getChipColor = (estado: string | undefined) => {
    if (!estado) return "default";
    
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
  const getStatusIcon = (estado: string | undefined) => {
    if (!estado) return null;
    
    switch (estado) {
      case "Pagada":
        return <CheckCircle className="detalle-factura-chip-icon" />
      case "Pendiente":
        return <Warning className="detalle-factura-chip-icon" />
      case "Vencida":
        return <Error className="detalle-factura-chip-icon" />
      case "Anulada":
        return <Error className="detalle-factura-chip-icon" />
      default:
        return null
    }
  }

  return (
    <MainLayout>
      <Box className="detalle-factura-container" sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
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
          <Box className="detalle-factura-header">
            <Receipt className="detalle-factura-header-icon" />
            <Typography variant="h4" className="detalle-factura-title">
              Detalle de Factura
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" className="detalle-factura-error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" className="detalle-factura-success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          {loading ? (
            <Box className="detalle-factura-loading">
              <CircularProgress size={60} />
            </Box>
          ) : !factura ? (
            <Alert severity="error">No se encontró la factura solicitada.</Alert>
          ) : (
            <>
              {/* Información de la factura */}
              {factura && (
                <div className="detalle-factura-section">
                  <Box sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                          <Typography variant="h6" className="detalle-factura-section-title">
                            <Receipt className="detalle-factura-section-title-icon" />
                            Información de la Factura
                          </Typography>
                          <div className={`detalle-factura-chip ${factura.estado.toLowerCase()}`}>
                            {getStatusIcon(factura.estado)}
                            {factura.estado}
                          </div>
                        </Box>
                        <div className="detalle-factura-info-grid">
                          <div className="detalle-factura-info-item">
                            <Typography className="detalle-factura-info-label">Serie-Correlativo:</Typography>
                            <Typography className="detalle-factura-info-value">
                              {factura.serie}-{factura.correlativo}
                            </Typography>
                          </div>
                          <div className="detalle-factura-info-item">
                            <Typography className="detalle-factura-info-label">Fecha de Emisión:</Typography>
                            <Typography className="detalle-factura-info-value">
                              {new Date(factura.fecha_emision).toLocaleDateString()}
                            </Typography>
                          </div>
                        </div>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="h6" className="detalle-factura-section-title">
                          <Person className="detalle-factura-section-title-icon" />
                          Datos del Cliente
                        </Typography>
                        <div className="detalle-factura-info-grid">
                          <div className="detalle-factura-info-item">
                            <Typography className="detalle-factura-info-label">
                              {factura.tipo_doc_cliente === "6"
                                ? "RUC"
                                : factura.tipo_doc_cliente === "1"
                                  ? "DNI"
                                  : "Doc. Identidad"}:
                            </Typography>
                            <Typography className="detalle-factura-info-value">{factura.num_doc_cliente}</Typography>
                          </div>
                          <div className="detalle-factura-info-item">
                            <Typography className="detalle-factura-info-label">Nombre/Razón Social:</Typography>
                            <Typography className="detalle-factura-info-value">{factura.nombre_cliente}</Typography>
                          </div>
                          {factura.direccion_cliente && (
                            <div className="detalle-factura-info-item">
                              <Typography className="detalle-factura-info-label">Dirección:</Typography>
                              <Typography className="detalle-factura-info-value">{factura.direccion_cliente}</Typography>
                            </div>
                          )}
                        </div>
                      </Grid>
                    </Grid>
                  </Box>
                </div>
              )}

              {/* Detalles de la factura */}
              {factura && factura.detalles && (
                <div className="detalle-factura-section">
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h6" className="detalle-factura-section-title">
                      <Description className="detalle-factura-section-title-icon" />
                      Detalles de la Factura
                    </Typography>
                    
                    <TableContainer className="detalle-factura-table-container">
                      <Table className="detalle-factura-table">
                        <TableHead className="detalle-factura-table-head">
                          <TableRow>
                            <TableCell>Descripción</TableCell>
                            <TableCell align="right">Cantidad</TableCell>
                            <TableCell align="right">Precio Unitario</TableCell>
                            <TableCell align="right">Subtotal</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {factura.detalles.map((detalle: any, index: number) => (
                            <TableRow key={index} className="detalle-factura-table-row">
                              <TableCell className="detalle-factura-table-cell">{detalle.descripcion}</TableCell>
                              <TableCell className="detalle-factura-table-cell" align="right">{detalle.cantidad}</TableCell>
                              <TableCell className="detalle-factura-table-cell" align="right">
                                S/ {Number.parseFloat(detalle.precio_unitario).toFixed(2)}
                              </TableCell>
                              <TableCell className="detalle-factura-table-cell" align="right">
                                S/ {Number.parseFloat(detalle.subtotal).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    {/* Totales */}
                    <div className="detalle-factura-totals-container">
                      <div className="detalle-factura-total-row">
                        <Typography className="detalle-factura-total-label">Subtotal:</Typography>
                        <Typography className="detalle-factura-total-value">
                          S/ {Number.parseFloat(factura.subtotal).toFixed(2)}
                        </Typography>
                      </div>
                      <div className="detalle-factura-total-row">
                        <Typography className="detalle-factura-total-label">IGV (18%):</Typography>
                        <Typography className="detalle-factura-total-value">
                          S/ {Number.parseFloat(factura.igv).toFixed(2)}
                        </Typography>
                      </div>
                      <div className="detalle-factura-grand-total">
                        <Typography className="detalle-factura-total-label">Total:</Typography>
                        <Typography className="detalle-factura-total-value">
                          S/ {Number.parseFloat(factura.total).toFixed(2)}
                        </Typography>
                      </div>
                    </div>
                  </Box>
                </div>
              )}

              {/* Respuesta de SUNAT */}
              {factura && factura.sunat_response && (
                <div className="detalle-factura-sunat-response">
                  <Typography variant="h6" className="detalle-factura-sunat-title">
                    <CloudDone className="detalle-factura-section-title-icon" />
                    Respuesta de SUNAT
                  </Typography>
                  
                  <Chip
                    label={factura.sunat_response.success ? "Aceptada por SUNAT" : "Rechazada por SUNAT"}
                    color={factura.sunat_response.success ? "success" : "error"}
                    className="detalle-factura-sunat-chip"
                  />
                  
                  {factura.sunat_response.error && (
                    <Alert severity="error" className="detalle-factura-sunat-error">
                      <Typography variant="subtitle2" className="detalle-factura-sunat-detail-item">
                        <span className="detalle-factura-sunat-detail-label">Código de error:</span> {factura.sunat_response.error.code}
                      </Typography>
                      <Typography variant="body2" className="detalle-factura-sunat-detail-item">
                        <span className="detalle-factura-sunat-detail-label">Mensaje:</span> {factura.sunat_response.error.message}
                      </Typography>
                    </Alert>
                  )}
                  
                  {factura.sunat_response.cdrResponse && (
                    <div className="detalle-factura-sunat-details">
                      <Typography variant="subtitle2" className="detalle-factura-sunat-detail-item">
                        <span className="detalle-factura-sunat-detail-label">Código CDR:</span> {factura.sunat_response.cdrResponse.code}
                      </Typography>
                      <Typography variant="body2" className="detalle-factura-sunat-detail-item">
                        <span className="detalle-factura-sunat-detail-label">Descripción:</span> {factura.sunat_response.cdrResponse.description}
                      </Typography>
                      
                      {factura.sunat_response.cdrResponse.notes &&
                        factura.sunat_response.cdrResponse.notes.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="subtitle2" className="detalle-factura-sunat-detail-label">
                              Notas:
                            </Typography>
                            <ul className="detalle-factura-sunat-notes">
                              {factura.sunat_response.cdrResponse.notes.map((note: string, index: number) => (
                                <li key={index} className="detalle-factura-sunat-note">{note}</li>
                              ))}
                            </ul>
                          </Box>
                        )}
                    </div>
                  )}
                </div>
              )}

              {/* Botones de acción */}
              {factura && (
                <div className="detalle-factura-actions">
                  <Button 
                    variant="outlined" 
                    startIcon={<ArrowBack />} 
                    onClick={() => navigate("/facturas")}
                    className="detalle-factura-back-button"
                  >
                    Volver a la lista
                  </Button>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Print />}
                      onClick={handlePrintInvoice}
                      disabled={factura.estado === "Anulada"}
                      className="detalle-factura-action-button"
                    >
                      Imprimir
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<PictureAsPdf />}
                      onClick={handleGenerarPDF}
                      disabled={factura.estado === "Anulada"}
                      className="detalle-factura-action-button"
                    >
                      Generar PDF
                    </Button>
                  </Box>
                </div>
              )}
            </>
          )}
        </Paper>
      </Box>
    </MainLayout>
  )
}

export default DetalleFactura
