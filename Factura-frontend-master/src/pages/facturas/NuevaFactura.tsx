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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
  Chip,
} from "@mui/material"
import {
  Receipt,
  Add,
  Delete,
  Save,
  ArrowBack,
  Person,
  CalendarToday,
  AttachMoney,
  DarkMode,
  LightMode,
  PictureAsPdf,
  ShoppingBag,
  Description,
  Print,
} from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { useCompany } from "../../contexts/CompanyContext"
import { useFactura } from "../../contexts/FacturaContext"
import { useTheme } from "../../contexts/ThemeContext"
import MainLayout from "../../components/layout/MainLayout"

// Solo para manejar la estructura de detalles en el Front
interface DetalleFactura {
  id: number
  descripcion: string
  cantidad: number
  precioUnitario: number
  subtotal: number
  icbper?: boolean
  factorIcbper?: number
}

// Tipos de factura
type InvoiceType = "regular" | "icbper"

const NuevaFactura: React.FC = () => {
  const navigate = useNavigate()
  const { selectedCompany } = useCompany()
  const { createFactura, generarPDF, loading, error: facturaError } = useFactura()
  const { darkMode, toggleDarkMode } = useTheme()

  const [loading2, setLoading2] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Añadir un nuevo estado para controlar la vista previa
  const [showPreview, setShowPreview] = useState(false)

  // Estado para controlar el tipo de factura seleccionado
  const [invoiceType, setInvoiceType] = useState<InvoiceType | null>(null)
  const [factorIcbper, setFactorIcbper] = useState<number>(0.2) // Valor por defecto para 2023

  // Aquí guardaremos la data completa para /invoices/pdf
  const [invoiceData, setInvoiceData] = useState<any>(null)

  // Añadir un nuevo estado para almacenar el XML devuelto por el backend
  const [xmlResponse, setXmlResponse] = useState<string | null>(null)

  // Añadir un nuevo estado para controlar la visualización de la representación de la factura
  const [showInvoiceRepresentation, setShowInvoiceRepresentation] = useState(false)

  // Form principal
  const [formData, setFormData] = useState({
    serie: "F001",
    correlativo: "000001",
    fechaEmision: new Date().toISOString().split("T")[0],
    tipoDocCliente: "6",
    numDocCliente: "",
    nombreCliente: "",
    direccionCliente: "",
  })

  // Detalles
  const [detalles, setDetalles] = useState<DetalleFactura[]>([])
  const [nuevoDetalle, setNuevoDetalle] = useState({
    descripcion: "",
    cantidad: 1,
    precioUnitario: 0,
    icbper: false,
  })

  // Totales
  const [subtotal, setSubtotal] = useState(0)
  const [igv, setIgv] = useState(0)
  const [icbperTotal, setIcbperTotal] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    let newSubtotal = 0
    let newIgv = 0
    let newIcbperTotal = 0

    detalles.forEach((item) => {
      newSubtotal += item.subtotal
      newIgv += item.subtotal * 0.18

      // Calcular ICBPER si el item lo tiene marcado
      if (item.icbper) {
        newIcbperTotal += item.cantidad * factorIcbper
      }
    })

    const newTotal = newSubtotal + newIgv + newIcbperTotal

    setSubtotal(newSubtotal)
    setIgv(newIgv)
    setIcbperTotal(newIcbperTotal)
    setTotal(newTotal)
  }, [detalles, factorIcbper])

  useEffect(() => {
    if (!selectedCompany) {
      setError("Debe seleccionar una empresa para generar facturas")
    } else {
      setError(null)
    }
  }, [selectedCompany])

  useEffect(() => {
    if (facturaError) {
      setError(facturaError)
    }
  }, [facturaError])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | any) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDetalleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target

    if (type === "checkbox") {
      setNuevoDetalle((prev) => ({
        ...prev,
        [name]: checked,
      }))
    } else {
      setNuevoDetalle((prev) => ({
        ...prev,
        [name]: name === "descripcion" ? value : Number(value),
      }))
    }
  }

  // Agregar item a la lista de detalles
  const agregarDetalle = () => {
    if (!nuevoDetalle.descripcion || nuevoDetalle.cantidad <= 0 || nuevoDetalle.precioUnitario <= 0) {
      setError("Todos los campos del detalle son obligatorios y deben ser > 0")
      return
    }
    const sub = nuevoDetalle.cantidad * nuevoDetalle.precioUnitario
    const newId = detalles.length > 0 ? Math.max(...detalles.map((d) => d.id)) + 1 : 1

    setDetalles([
      ...detalles,
      {
        id: newId,
        descripcion: nuevoDetalle.descripcion,
        cantidad: nuevoDetalle.cantidad,
        precioUnitario: nuevoDetalle.precioUnitario,
        subtotal: sub,
        icbper: nuevoDetalle.icbper,
        factorIcbper: nuevoDetalle.icbper ? factorIcbper : undefined,
      },
    ])

    setNuevoDetalle({
      descripcion: "",
      cantidad: 1,
      precioUnitario: 0,
      icbper: false,
    })

    setError(null)
  }

  // Eliminar un detalle
  const eliminarDetalle = (id: number) => {
    setDetalles((prev) => prev.filter((d) => d.id !== id))
  }

  // Construye el payload que /invoices/send y /invoices/pdf requieren
  const buildInvoiceData = () => {
    if (!selectedCompany) return null

    // Base común para ambos tipos de factura
    const baseData = {
      ublVersion: "2.1",
      tipoDoc: "01",
      tipoOperacion: "0101",
      serie: formData.serie,
      correlativo: formData.correlativo,
      fechaEmision: `${formData.fechaEmision}T00:00:00-05:00`,
      formaPago: {
        moneda: "PEN",
        tipo: "Contado",
      },
      tipoMoneda: "PEN",

      // La empresa
      company: {
        ruc: selectedCompany.ruc,
        razonSocial: selectedCompany.razon_social,
        nombreComercial: selectedCompany.razon_social,
        address: {
          ubigueo: "150101",
          departamento: "LIMA",
          provincia: "LIMA",
          distrito: "LIMA",
          urbanizacion: "-",
          direccion: selectedCompany.direccion,
          codLocal: "0000",
        },
      },

      // El cliente
      client: {
        tipoDoc: formData.tipoDocCliente,
        numDoc: Number(formData.numDocCliente),
        rznSocial: formData.nombreCliente,
      },
    }

    // Calcular totales para los campos requeridos por SUNAT
    const mtoOperGravadas = subtotal
    const mtoIGV = igv
    const totalImpuestos = igv + icbperTotal
    const icbper = icbperTotal > 0 ? icbperTotal : undefined

    // Arreglo de detalles según el tipo de factura
    const details = detalles.map((d) => {
      const mtoValorUnitario = d.precioUnitario / 1.18
      const mtoValorVenta = mtoValorUnitario * d.cantidad
      const calcIgv = mtoValorVenta * 0.18

      const detalle: any = {
        tipAfeIgv: 10,
        codProducto: "P001",
        unidad: "NIU",
        descripcion: d.descripcion,
        cantidad: d.cantidad,
        mtoValorUnitario: mtoValorUnitario,
        mtoValorVenta: mtoValorVenta,
        mtoBaseIgv: mtoValorVenta,
        porcentajeIgv: 18,
        igv: calcIgv,
        totalImpuestos: calcIgv,
        mtoPrecioUnitario: d.precioUnitario,
      }

      // Si el item tiene ICBPER, agregar los campos correspondientes
      if (d.icbper) {
        detalle.factorIcbper = factorIcbper
        detalle.icbper = d.cantidad * factorIcbper
        detalle.totalImpuestos = calcIgv + detalle.icbper
      }

      return detalle
    })

    // Construir el objeto completo con los totales calculados
    return {
      ...baseData,
      mtoOperGravadas,
      mtoOperExoneradas: 0,
      mtoOperInafectas: 0,
      mtoOperExportacion: 0,
      mtoOperGratuitas: 0,
      mtoIGV,
      mtoIGVGratuitas: 0,
      icbper,
      totalImpuestos,
      valorVenta: subtotal,
      subTotal: subtotal + igv,
      redondeo: 0,
      mtoImpVenta: total,
      details,
      legends: [
        {
          code: "1000",
          value: `SON: ${convertirNumeroALetras(total)} SOLES`,
        },
      ],
    }
  }

  // Función para convertir números a letras (simulada)
  const convertirNumeroALetras = (numero: number): string => {
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

    if (numero < 10) return unidades[Math.floor(numero)]
    if (numero < 100) return `${decenas[Math.floor(numero / 10)]} Y ${unidades[Math.floor(numero % 10)]}`

    return `${Math.floor(numero)} CON ${Math.floor((numero % 1) * 100)}/100`
  }

  // Modificar la función handleEmitirFactura para guardar el XML
  const handleEmitirFactura = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.numDocCliente || !formData.nombreCliente) {
      setError("Los datos del cliente son obligatorios")
      return
    }
    if (detalles.length === 0) {
      setError("Debe agregar al menos un detalle a la factura")
      return
    }

    try {
      setLoading2(true)

      const dataToSend = buildInvoiceData()
      if (!dataToSend) {
        setError("No se encontró la empresa seleccionada")
        return
      }

      console.log("Enviando datos de factura:", dataToSend)
      const response = await createFactura(dataToSend)
      console.log("Factura Enviada a SUNAT:", response)

      // Guardamos data para PDF
      setInvoiceData(dataToSend)

      // Guardamos el XML devuelto por el backend
      if (response.xml) {
        setXmlResponse(response.xml)
      }

      if (response.sunatResponse?.success) {
        setSuccess("¡Factura generada y enviada a SUNAT con éxito!")
        // Mostrar la vista previa después de enviar exitosamente
        setShowPreview(true)
      } else {
        throw new Error("No se obtuvo confirmación exitosa de SUNAT en la respuesta")
      }
    } catch (err: any) {
      console.error("Error al generar la factura:", err)
      setError(err.message || "Error al generar la factura")
    } finally {
      setLoading2(false)
    }
  }

  // Añadir una función para volver a la creación de facturas
  const handleBackToInvoice = () => {
    setShowPreview(false)
  }

  // Añadir una función para crear una nueva factura
  const handleNewInvoice = () => {
    setShowPreview(false)
    setInvoiceData(null)
    setXmlResponse(null)
    setSuccess(null)
    setDetalles([])
    setFormData({
      serie: "F001",
      correlativo: "000001",
      fechaEmision: new Date().toISOString().split("T")[0],
      tipoDocCliente: "6",
      numDocCliente: "",
      nombreCliente: "",
      direccionCliente: "",
    })
    setInvoiceType(null)
  }

  // Genera PDF
  const handleGenerarPDF = async () => {
    if (!invoiceData) {
      setError("Primero genera la data de la factura.")
      return
    }
    try {
      setLoading2(true)
      setError(null)

      // Enviamos la ESTRUCTURA COMPLETA que tu backend necesita
      const pdfBlob = await generarPDF(invoiceData)

      // Descargar en navegador:
      const pdfUrl = URL.createObjectURL(pdfBlob)
      const link = document.createElement("a")
      link.href = pdfUrl
      link.download = `Factura-${invoiceData.serie}-${invoiceData.correlativo}.pdf`
      link.click()
      URL.revokeObjectURL(pdfUrl)

      setSuccess("PDF generado correctamente")
    } catch (err: any) {
      setError(err.message || "Error al generar PDF")
    } finally {
      setLoading2(false)
    }
  }

  // Función para imprimir la factura
  const handlePrintInvoice = () => {
    if (!invoiceData) {
      setError("No hay datos de factura para imprimir")
      return
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
        <title>Factura ${invoiceData.serie}-${invoiceData.correlativo}</title>
        <style>${printStyles}</style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div class="company-info">
              <div class="company-name">${invoiceData.company.razonSocial}</div>
              <div>RUC: ${invoiceData.company.ruc}</div>
              <div>Dirección: ${invoiceData.company.address.direccion}</div>
            </div>
            <div class="invoice-title">
              <h1>FACTURA ELECTRÓNICA</h1>
              <div class="invoice-number">${invoiceData.serie}-${invoiceData.correlativo}</div>
              <div>Fecha: ${invoiceData.fechaEmision.split("T")[0]}</div>
            </div>
          </div>

          <div class="client-info">
            <h2>Datos del Cliente</h2>
            <div class="client-details">
              <div><strong>RUC:</strong> ${invoiceData.client.numDoc}</div>
              <div><strong>Nombre/Razón Social:</strong> ${invoiceData.client.rznSocial}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Cantidad</th>
                <th>Descripción</th>
                <th class="text-right">Valor Unitario</th>
                <th class="text-right">Valor Venta</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceData.details
                .map(
                  (detalle: any) => `
                <tr>
                  <td>${detalle.cantidad} ${detalle.unidad}</td>
                  <td>${detalle.descripcion}</td>
                  <td class="text-right">S/ ${detalle.mtoValorUnitario.toFixed(2)}</td>
                  <td class="text-right">S/ ${detalle.mtoValorVenta.toFixed(2)}</td>
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
                <td class="text-right">S/ ${invoiceData.mtoOperGravadas.toFixed(2)}</td>
              </tr>
              <tr>
                <td>I.G.V. (18%):</td>
                <td class="text-right">S/ ${invoiceData.mtoIGV.toFixed(2)}</td>
              </tr>
              ${
                invoiceData.icbper
                  ? `<tr>
                      <td>ICBPER:</td>
                      <td class="text-right">S/ ${invoiceData.icbper.toFixed(2)}</td>
                    </tr>`
                  : ""
              }
              <tr class="total-row">
                <td>TOTAL A PAGAR:</td>
                <td class="text-right">S/ ${invoiceData.mtoImpVenta.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="amount-in-words">
            ${invoiceData.legends[0].value}
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

    // Cerrar el documento y activar la impresión
    printWindow.document.close()
    printWindow.focus()

    // Pequeño retraso para asegurar que los estilos se carguen correctamente
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  // Seleccionar tipo de factura
  const handleSelectInvoiceType = (type: InvoiceType) => {
    setInvoiceType(type)
    // Limpiar detalles al cambiar el tipo de factura
    setDetalles([])
  }

  // IMPORTANTE: Primero verificamos si estamos en modo vista previa
  if (showPreview && invoiceData) {
    return (
      <MainLayout>
        <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
          {/* DarkMode */}
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
              <Typography variant="h4">Vista Previa de Factura</Typography>
            </Box>

            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {success}
              </Alert>
            )}

            {/* Información de la empresa */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Datos del Emisor
                  </Typography>
                  <Typography variant="body1">
                    <strong>RUC:</strong> {invoiceData.company.ruc}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Razón Social:</strong> {invoiceData.company.razonSocial}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Dirección:</strong> {invoiceData.company.address.direccion}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Datos del Documento
                  </Typography>
                  <Typography variant="body1">
                    <strong>Tipo:</strong> FACTURA ELECTRÓNICA
                  </Typography>
                  <Typography variant="body1">
                    <strong>Serie-Correlativo:</strong> {invoiceData.serie}-{invoiceData.correlativo}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Fecha de Emisión:</strong> {invoiceData.fechaEmision.split("T")[0]}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Información del cliente */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Datos del Cliente
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1">
                    <strong>
                      {invoiceData.client.tipoDoc === "6"
                        ? "RUC"
                        : invoiceData.client.tipoDoc === "1"
                          ? "DNI"
                          : "Doc. Identidad"}
                      :
                    </strong>{" "}
                    {invoiceData.client.numDoc}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1">
                    <strong>Nombre/Razón Social:</strong> {invoiceData.client.rznSocial}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Detalles de la factura */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Detalles de la Factura
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Descripción</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      <TableCell align="right">Precio Unitario</TableCell>
                      <TableCell align="right">Valor Venta</TableCell>
                      <TableCell align="right">IGV</TableCell>
                      {invoiceType === "icbper" && <TableCell align="right">ICBPER</TableCell>}
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoiceData.details.map((detalle: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{detalle.descripcion}</TableCell>
                        <TableCell align="right">{detalle.cantidad}</TableCell>
                        <TableCell align="right">S/ {detalle.mtoPrecioUnitario.toFixed(2)}</TableCell>
                        <TableCell align="right">S/ {detalle.mtoValorVenta.toFixed(2)}</TableCell>
                        <TableCell align="right">S/ {detalle.igv.toFixed(2)}</TableCell>
                        {invoiceType === "icbper" && (
                          <TableCell align="right">
                            {detalle.icbper ? `S/ ${detalle.icbper.toFixed(2)}` : "N/A"}
                          </TableCell>
                        )}
                        <TableCell align="right">
                          S/ {(detalle.mtoValorVenta + detalle.igv + (detalle.icbper || 0)).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Totales */}
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <Typography variant="subtitle1">
                  <strong>Operaciones Gravadas:</strong> S/ {invoiceData.mtoOperGravadas.toFixed(2)}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>IGV (18%):</strong> S/ {invoiceData.mtoIGV.toFixed(2)}
                </Typography>
                {invoiceData.icbper > 0 && (
                  <Typography variant="subtitle1" color="secondary">
                    <strong>ICBPER:</strong> S/ {invoiceData.icbper.toFixed(2)}
                  </Typography>
                )}
                <Typography variant="h6" sx={{ fontWeight: "bold", mt: 1 }}>
                  <strong>Importe Total:</strong> S/ {invoiceData.mtoImpVenta.toFixed(2)}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic" }}>
                  {invoiceData.legends[0].value}
                </Typography>
              </Box>
            </Paper>

            {xmlResponse && (
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Representación de la Factura
                </Typography>

                <Box sx={{ mt: 2, mb: 2, display: "flex", gap: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setShowInvoiceRepresentation(!showInvoiceRepresentation)}
                  >
                    {showInvoiceRepresentation ? "Ocultar factura emitida" : "Visualizar factura emitida"}
                  </Button>

                  {showInvoiceRepresentation && (
                    <Button variant="contained" color="secondary" startIcon={<Print />} onClick={handlePrintInvoice}>
                      Imprimir Factura
                    </Button>
                  )}

                  <Button
                    onClick={() => {
                      const xmlWindow = window.open("", "_blank")
                      xmlWindow?.document.write(`
                        <html>
                          <head>
                            <title>XML Factura</title>
                            <style>
                              body { font-family: monospace; white-space: pre; padding: 20px; }
                            </style>
                          </head>
                          <body>${xmlResponse.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</body>
                        </html>
                      `)
                      xmlWindow?.document.close()
                    }}
                    variant="outlined"
                    size="small"
                  >
                    Ver XML Original
                  </Button>
                </Box>

                {showInvoiceRepresentation && (
                  <Box sx={{ mt: 3 }}>
                    <Paper
                      variant="outlined"
                      sx={{
                        overflow: "hidden",
                        maxWidth: "800px",
                        margin: "0 auto",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                      }}
                    >
                      {/* Cabecera de la factura */}
                      <Box sx={{ display: "flex", flexDirection: "row", p: 0 }}>
                        {/* Logo y datos de la empresa */}
                        <Box
                          sx={{
                            flex: 1,
                            p: 3,
                            borderRight: "1px solid",
                            borderColor: "divider",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "flex-start",
                          }}
                        >
                          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                            {invoiceData.company.razonSocial}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            RUC: {invoiceData.company.ruc}
                          </Typography>
                          <Typography variant="body2">Dirección: {invoiceData.company.address.direccion}</Typography>
                        </Box>

                        {/* Datos del documento */}
                        <Box
                          sx={{
                            width: "40%",
                            p: 3,
                            textAlign: "right",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            bgcolor: "primary.light",
                            color: "primary.contrastText",
                          }}
                        >
                          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                            FACTURA ELECTRÓNICA
                          </Typography>
                          <Typography variant="h5" sx={{ my: 1, fontWeight: "bold" }}>
                            {invoiceData.serie}-{invoiceData.correlativo}
                          </Typography>
                          <Typography variant="body2">Fecha: {invoiceData.fechaEmision.split("T")[0]}</Typography>
                        </Box>
                      </Box>

                      {/* Datos del cliente */}
                      <Box
                        sx={{
                          p: 2,
                          borderTop: "1px solid",
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          bgcolor: "grey.50",
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                          Datos del Cliente
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              <strong>RUC:</strong> {invoiceData.client.numDoc}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Nombre/Razón Social:</strong> {invoiceData.client.rznSocial}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              <strong>Fecha Emisión:</strong> {invoiceData.fechaEmision.split("T")[0]}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Moneda:</strong> {invoiceData.tipoMoneda}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>

                      {/* Tabla de detalles */}
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: "grey.100" }}>
                              <TableCell width="10%">Cantidad</TableCell>
                              <TableCell width="50%">Descripción</TableCell>
                              <TableCell width="20%" align="right">
                                Valor Unitario
                              </TableCell>
                              <TableCell width="20%" align="right">
                                Valor Venta
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {invoiceData.details.map((detalle: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell>
                                  {detalle.cantidad} {detalle.unidad}
                                </TableCell>
                                <TableCell>{detalle.descripcion}</TableCell>
                                <TableCell align="right">S/ {detalle.mtoValorUnitario.toFixed(2)}</TableCell>
                                <TableCell align="right">S/ {detalle.mtoValorVenta.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      {/* Totales y resumen */}
                      <Grid container>
                        <Grid
                          item
                          xs={6}
                          sx={{
                            p: 3,
                            borderRight: "1px solid",
                            borderTop: "1px solid",
                            borderColor: "divider",
                            bgcolor: "grey.50",
                          }}
                        >
                          <Typography variant="body2" sx={{ mb: 1, fontStyle: "italic" }}>
                            <strong>SON:</strong> {invoiceData.legends[0].value.replace("SON: ", "")}
                          </Typography>

                          <Box sx={{ mt: 4 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Representación impresa de la Factura Electrónica</strong>
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              Consulte su documento en: www.sunat.gob.pe
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid item xs={6} sx={{ p: 3, borderTop: "1px solid", borderColor: "divider" }}>
                          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                width: "100%",
                                maxWidth: 250,
                                mb: 1,
                              }}
                            >
                              <Typography variant="body2">
                                <strong>Op. Gravadas:</strong>
                              </Typography>
                              <Typography variant="body2">S/ {invoiceData.mtoOperGravadas.toFixed(2)}</Typography>
                            </Box>

                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                width: "100%",
                                maxWidth: 250,
                                mb: 1,
                              }}
                            >
                              <Typography variant="body2">
                                <strong>I.G.V.:</strong>
                              </Typography>
                              <Typography variant="body2">S/ {invoiceData.mtoIGV.toFixed(2)}</Typography>
                            </Box>

                            {invoiceData.icbper > 0 && (
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  width: "100%",
                                  maxWidth: 250,
                                  mb: 1,
                                }}
                              >
                                <Typography variant="body2">
                                  <strong>ICBPER:</strong>
                                </Typography>
                                <Typography variant="body2">S/ {invoiceData.icbper.toFixed(2)}</Typography>
                              </Box>
                            )}

                            <Divider sx={{ width: "100%", maxWidth: 250, my: 1 }} />

                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                width: "100%",
                                maxWidth: 250,
                                bgcolor: "primary.light",
                                color: "primary.contrastText",
                                p: 1,
                                borderRadius: 1,
                              }}
                            >
                              <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                TOTAL:
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                S/ {invoiceData.mtoImpVenta.toFixed(2)}
                              </Typography>
                            </Box>

                            {/* QR Code placeholder */}
                            <Box
                              sx={{
                                mt: 2,
                                width: 100,
                                height: 100,
                                border: "1px solid",
                                borderColor: "divider",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Typography variant="caption">QR Code</Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Box>
                )}
              </Paper>
            )}

            {/* Botones de acción */}
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
              <Button variant="outlined" startIcon={<ArrowBack />} onClick={handleBackToInvoice}>
                Volver a la Factura
              </Button>
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<PictureAsPdf />}
                  onClick={handleGenerarPDF}
                  disabled={loading || loading2}
                  sx={{ mr: 2 }}
                >
                  Descargar PDF
                </Button>
                <Button variant="contained" startIcon={<Add />} onClick={handleNewInvoice}>
                  Nueva Factura
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      </MainLayout>
    )
  }

  // Si no se ha seleccionado un tipo de factura, mostrar la pantalla de selección
  if (!invoiceType) {
    return (
      <MainLayout>
        <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
          {/* DarkMode */}
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
              <Typography variant="h4">Nueva Factura</Typography>
            </Box>

            <Typography variant="body1" color="text.secondary" paragraph>
              Seleccione el tipo de factura que desea generar:
            </Typography>

            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    height: "100%",
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      boxShadow: 6,
                    },
                  }}
                  onClick={() => handleSelectInvoiceType("regular")}
                >
                  <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", p: 4 }}>
                    <Description sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
                    <Typography variant="h5" gutterBottom>
                      Factura Regular
                    </Typography>
                    <Typography variant="body1" align="center">
                      Factura estándar para productos y servicios sin impuesto a bolsas plásticas.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    height: "100%",
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      boxShadow: 6,
                    },
                  }}
                  onClick={() => handleSelectInvoiceType("icbper")}
                >
                  <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", p: 4 }}>
                    <ShoppingBag sx={{ fontSize: 60, color: "secondary.main", mb: 2 }} />
                    <Typography variant="h5" gutterBottom>
                      Factura con ICBPER
                    </Typography>
                    <Typography variant="body1" align="center">
                      Factura que incluye productos con impuesto al consumo de bolsas plásticas (ICBPER).
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-start" }}>
              <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
                Volver
              </Button>
            </Box>
          </Paper>
        </Box>
      </MainLayout>
    )
  }

  // Formulario de factura (caso por defecto)
  return (
    <MainLayout>
      <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
        {/* DarkMode */}
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

        {selectedCompany && (
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1">Empresa Emisora:</Typography>
            <Typography variant="body1">
              <strong>RUC:</strong> {selectedCompany.ruc}
            </Typography>
            <Typography variant="body1">
              <strong>Razón Social:</strong> {selectedCompany.razon_social}
            </Typography>
            <Typography variant="body1">
              <strong>Dirección:</strong> {selectedCompany.direccion}
            </Typography>
          </Paper>
        )}

        <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <Receipt sx={{ fontSize: 40, color: "primary.main", mr: 2 }} />
            <Typography variant="h4">
              {invoiceType === "regular" ? "Nueva Factura" : "Nueva Factura con ICBPER"}
            </Typography>
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

          {!selectedCompany ? (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Debe seleccionar una empresa para generar facturas.
              <Button color="inherit" onClick={() => navigate("/companies")}>
                Seleccionar Empresa
              </Button>
            </Alert>
          ) : (
            <form onSubmit={handleEmitirFactura}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Información de la Factura
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                {/* Serie / Correlativo / Fecha */}
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Serie"
                    name="serie"
                    value={formData.serie}
                    onChange={handleInputChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Receipt fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Correlativo"
                    name="correlativo"
                    value={formData.correlativo}
                    onChange={handleInputChange}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Fecha de Emisión"
                    name="fechaEmision"
                    type="date"
                    value={formData.fechaEmision}
                    onChange={handleInputChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarToday fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Datos del Cliente */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Datos del Cliente
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel id="tipo-doc-cliente-label">Tipo de Documento</InputLabel>
                    <Select
                      labelId="tipo-doc-cliente-label"
                      name="tipoDocCliente"
                      value={formData.tipoDocCliente}
                      onChange={handleInputChange}
                      label="Tipo de Documento"
                    >
                      <MenuItem value="1">DNI</MenuItem>
                      <MenuItem value="6">RUC</MenuItem>
                      <MenuItem value="4">Carnet Extranjería</MenuItem>
                      <MenuItem value="7">Pasaporte</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    label="Número de Documento"
                    name="numDocCliente"
                    value={formData.numDocCliente}
                    onChange={handleInputChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nombre o Razón Social"
                    name="nombreCliente"
                    value={formData.nombreCliente}
                    onChange={handleInputChange}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Dirección"
                    name="direccionCliente"
                    value={formData.direccionCliente}
                    onChange={handleInputChange}
                  />
                </Grid>

                {/* Detalles */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Detalles de la Factura
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                {/* Configuración ICBPER si es factura con ICBPER */}
                {invoiceType === "icbper" && (
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: "info.light", color: "info.contrastText" }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Configuración ICBPER (Impuesto al Consumo de Bolsas Plásticas)
                      </Typography>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Factor ICBPER (S/ por bolsa)"
                            type="number"
                            value={factorIcbper}
                            onChange={(e) => setFactorIcbper(Number(e.target.value))}
                            inputProps={{ min: 0.01, step: 0.01 }}
                            helperText="Valor actual según SUNAT: S/ 0.20 por bolsa (2023)"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2">
                            El ICBPER se aplicará a los productos que marques como "Bolsa plástica" al agregarlos.
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                )}

                {/* Agregar Detalle */}
                <Grid item xs={12}>
                  <Box
                    sx={{
                      mb: 3,
                      p: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="subtitle1" gutterBottom>
                      Agregar Nuevo Detalle
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={invoiceType === "icbper" ? 3 : 5}>
                        <TextField
                          fullWidth
                          label="Descripción"
                          name="descripcion"
                          value={nuevoDetalle.descripcion}
                          onChange={handleDetalleChange}
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <TextField
                          fullWidth
                          label="Cantidad"
                          name="cantidad"
                          type="number"
                          value={nuevoDetalle.cantidad}
                          onChange={handleDetalleChange}
                          inputProps={{ min: 1 }}
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <TextField
                          fullWidth
                          label="Precio Unitario"
                          name="precioUnitario"
                          type="number"
                          value={nuevoDetalle.precioUnitario}
                          onChange={handleDetalleChange}
                          inputProps={{ min: 0, step: 0.01 }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <AttachMoney fontSize="small" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>

                      {/* Checkbox para ICBPER si es factura con ICBPER */}
                      {invoiceType === "icbper" && (
                        <Grid item xs={12} md={3}>
                          <FormControlLabel
                            control={
                              <Tooltip title="Marcar si este producto es una bolsa plástica sujeta a ICBPER">
                                <Checkbox
                                  checked={nuevoDetalle.icbper}
                                  onChange={handleDetalleChange}
                                  name="icbper"
                                  color="secondary"
                                />
                              </Tooltip>
                            }
                            label="Bolsa plástica (ICBPER)"
                          />
                        </Grid>
                      )}

                      <Grid item xs={12} md={2}>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<Add />}
                          onClick={agregarDetalle}
                          fullWidth
                        >
                          Agregar
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                {/* Lista de detalles */}
                <Grid item xs={12}>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Descripción</TableCell>
                          <TableCell align="right">Cantidad</TableCell>
                          <TableCell align="right">Precio Unitario</TableCell>
                          <TableCell align="right">Subtotal</TableCell>
                          {invoiceType === "icbper" && <TableCell align="center">ICBPER</TableCell>}
                          <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detalles.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={invoiceType === "icbper" ? 6 : 5} align="center">
                              No hay detalles agregados
                            </TableCell>
                          </TableRow>
                        ) : (
                          detalles.map((detalle) => (
                            <TableRow key={detalle.id}>
                              <TableCell>{detalle.descripcion}</TableCell>
                              <TableCell align="right">{detalle.cantidad}</TableCell>
                              <TableCell align="right">{detalle.precioUnitario.toFixed(2)}</TableCell>
                              <TableCell align="right">{detalle.subtotal.toFixed(2)}</TableCell>
                              {invoiceType === "icbper" && (
                                <TableCell align="center">
                                  {detalle.icbper ? (
                                    <Tooltip title={`S/ ${factorIcbper} por unidad`}>
                                      <Chip
                                        label={`S/ ${(detalle.cantidad * factorIcbper).toFixed(2)}`}
                                        color="secondary"
                                        size="small"
                                      />
                                    </Tooltip>
                                  ) : (
                                    "No aplica"
                                  )}
                                </TableCell>
                              )}
                              <TableCell align="center">
                                <IconButton color="error" size="small" onClick={() => eliminarDetalle(detalle.id)}>
                                  <Delete />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* Totales */}
                <Grid item xs={12}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      mt: 2,
                    }}
                  >
                    <Typography variant="subtitle1">Subtotal: S/ {subtotal.toFixed(2)}</Typography>
                    <Typography variant="subtitle1">IGV (18%): S/ {igv.toFixed(2)}</Typography>
                    {invoiceType === "icbper" && icbperTotal > 0 && (
                      <Typography variant="subtitle1" color="secondary">
                        ICBPER: S/ {icbperTotal.toFixed(2)}
                      </Typography>
                    )}
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      Total: S/ {total.toFixed(2)}
                    </Typography>
                  </Box>
                </Grid>

                {/* Botones finales */}
                <Grid item xs={12} sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
                  <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => setInvoiceType(null)}>
                    Cambiar tipo de factura
                  </Button>

                  <Box>
                    {/* Botón para Emitir Factura (para /invoices/send) */}
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<Save />}
                      disabled={loading || loading2 || detalles.length === 0}
                    >
                      {loading || loading2 ? <CircularProgress size={24} /> : "Emitir Factura"}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          )}
        </Paper>
      </Box>
    </MainLayout>
  )
}

export default NuevaFactura

