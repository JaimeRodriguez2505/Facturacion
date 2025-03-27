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
  FormControlLabel,
  Checkbox,
  Chip,
  Fade,
  Zoom,
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
  Business,
  Info,
  ReceiptLong,
} from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { useCompany } from "../../contexts/CompanyContext"
import { useFactura } from "../../contexts/FacturaContext"
import { useTheme } from "../../contexts/ThemeContext"
import MainLayout from "../../components/layout/MainLayout"
import { facturaService } from "../../service/facturaService"

// Importar estilos específicos para esta página
import "../../css/nueva-factura.css"

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

  // Modificar la función handleEmitirFactura para guardar la factura en la BD
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

      // Preparar datos para guardar en la BD
      const facturaParaBD = {
        serie: dataToSend.serie,
        correlativo: dataToSend.correlativo,
        fecha_emision: dataToSend.fechaEmision.split("T")[0],
        tipo_doc_cliente: dataToSend.client.tipoDoc,
        num_doc_cliente: String(dataToSend.client.numDoc), // Convertir a string para asegurar formato correcto
        nombre_cliente: dataToSend.client.rznSocial,
        direccion_cliente: formData.direccionCliente || "", // Usar la dirección del formulario si existe
        subtotal: Number(dataToSend.mtoOperGravadas),
        igv: Number(dataToSend.mtoIGV),
        total: Number(dataToSend.mtoImpVenta),
        estado: response.sunatResponse?.success ? "Pagada" : "Pendiente",
        company_id: Number(selectedCompany?.id),
        // Guardar solo la información necesaria de la respuesta SUNAT
        sunat_response: {
          success: response.sunatResponse?.success || false,
          error: response.sunatResponse?.error || null,
          cdrResponse: response.sunatResponse?.cdrResponse || null,
        },
        detalles: dataToSend.details.map((detalle: any) => ({
          descripcion: detalle.descripcion,
          cantidad: Number(detalle.cantidad),
          precio_unitario: Number(detalle.mtoPrecioUnitario),
          subtotal: Number(detalle.mtoValorVenta + detalle.igv),
        })),
      }

      console.log("Datos preparados para guardar en BD:", facturaParaBD)

      // Guardar la factura en la BD
      try {
        const bdResponse = await facturaService.guardarFacturaEnBD(facturaParaBD)
        console.log("Factura guardada en BD:", bdResponse)

        if (bdResponse.success) {
          // Si se guardó correctamente en la BD, actualizamos el mensaje de éxito
          if (response.sunatResponse?.success) {
            setSuccess("¡Factura generada, enviada a SUNAT y guardada en la base de datos con éxito!")
          } else {
            setSuccess("La factura se guardó en la base de datos, pero hubo un problema al enviarla a SUNAT.")
            if (response.sunatResponse?.error) {
              setError(
                `Error SUNAT: ${response.sunatResponse.error.code || ""} - ${response.sunatResponse.error.message || "Sin detalles"}`,
              )
            }
          }
          // Mostrar la vista previa después de enviar
          setShowPreview(true)
        }
      } catch (bdError: any) {
        console.error("Error al guardar factura en BD:", bdError)

        // Mostrar detalles específicos del error de validación
        let errorMsg = `La factura se procesó con SUNAT pero no se pudo guardar en la base de datos: ${bdError.message}`

        // Si hay errores de validación específicos, mostrarlos
        if (bdError.response?.data?.errors) {
          const validationErrors = bdError.response.data.errors
          console.log("Errores de validación:", validationErrors)

          // Convertir los errores de validación a texto
          const errorDetails = Object.entries(validationErrors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`)
            .join("\n")

          errorMsg += `\nDetalles de validación:\n${errorDetails}`
        }

        setError(errorMsg)

        // Aún así mostramos la vista previa si la respuesta de SUNAT fue exitosa
        if (response.sunatResponse?.success) {
          setShowPreview(true)
        }
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
              ${invoiceData.icbper
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
        <Box className="nueva-factura-container" sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
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

          <Paper elevation={3} className="nueva-factura-main-card" sx={{ p: { xs: 2, md: 4 }, mb: 4 }}>
            <Box className="nueva-factura-header">
              <Receipt className="nueva-factura-header-icon" />
              <Typography variant="h4" className="nueva-factura-title">
                Vista Previa de Factura
              </Typography>
            </Box>

            {success && (
              <Fade in={!!success}>
                <Alert severity="success" sx={{ mb: 3 }} className="alert-animation">
                  {success}
                </Alert>
              </Fade>
            )}

            {error && (
              <Fade in={!!error}>
                <Alert severity="error" sx={{ mb: 3 }} className="alert-animation">
                  {error}
                </Alert>
              </Fade>
            )}

            {/* Información de la empresa */}
            <div className="nueva-factura-preview-section">
              <Typography className="nueva-factura-preview-title">
                <Business className="nueva-factura-preview-title-icon" />
                Datos del Emisor
              </Typography>
              <div className="nueva-factura-preview-grid">
                <div>
                  <Typography className="nueva-factura-preview-label">RUC:</Typography>
                  <Typography className="nueva-factura-preview-value">{invoiceData.company.ruc}</Typography>
                </div>
                <div>
                  <Typography className="nueva-factura-preview-label">Razón Social:</Typography>
                  <Typography className="nueva-factura-preview-value">{invoiceData.company.razonSocial}</Typography>
                </div>
                <div>
                  <Typography className="nueva-factura-preview-label">Dirección:</Typography>
                  <Typography className="nueva-factura-preview-value">
                    {invoiceData.company.address.direccion}
                  </Typography>
                </div>
              </div>
            </div>

            {/* Información del documento */}
            <div className="nueva-factura-preview-section">
              <Typography className="nueva-factura-preview-title">
                <ReceiptLong className="nueva-factura-preview-title-icon" />
                Datos del Documento
              </Typography>
              <div className="nueva-factura-preview-grid">
                <div>
                  <Typography className="nueva-factura-preview-label">Tipo:</Typography>
                  <Typography className="nueva-factura-preview-value">FACTURA ELECTRÓNICA</Typography>
                </div>
                <div>
                  <Typography className="nueva-factura-preview-label">Serie-Correlativo:</Typography>
                  <Typography className="nueva-factura-preview-value">
                    {invoiceData.serie}-{invoiceData.correlativo}
                  </Typography>
                </div>
                <div>
                  <Typography className="nueva-factura-preview-label">Fecha de Emisión:</Typography>
                  <Typography className="nueva-factura-preview-value">
                    {invoiceData.fechaEmision.split("T")[0]}
                  </Typography>
                </div>
              </div>
            </div>

            {/* Información del cliente */}
            <div className="nueva-factura-preview-section">
              <Typography className="nueva-factura-preview-title">
                <Person className="nueva-factura-preview-title-icon" />
                Datos del Cliente
              </Typography>
              <div className="nueva-factura-preview-grid">
                <div>
                  <Typography className="nueva-factura-preview-label">
                    {invoiceData.client.tipoDoc === "6"
                      ? "RUC"
                      : invoiceData.client.tipoDoc === "1"
                        ? "DNI"
                        : "Doc. Identidad"}
                    :
                  </Typography>
                  <Typography className="nueva-factura-preview-value">{invoiceData.client.numDoc}</Typography>
                </div>
                <div>
                  <Typography className="nueva-factura-preview-label">Nombre/Razón Social:</Typography>
                  <Typography className="nueva-factura-preview-value">{invoiceData.client.rznSocial}</Typography>
                </div>
              </div>
            </div>

            {/* Detalles de la factura */}
            <div className="nueva-factura-preview-section">
              <Typography className="nueva-factura-preview-title">
                <Description className="nueva-factura-preview-title-icon" />
                Detalles de la Factura
              </Typography>
              <TableContainer component={Paper} variant="outlined" className="nueva-factura-table-container">
                <Table className="nueva-factura-table">
                  <TableHead className="nueva-factura-table-head">
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
                      <TableRow key={index} className="nueva-factura-table-row">
                        <TableCell className="nueva-factura-table-cell">{detalle.descripcion}</TableCell>
                        <TableCell className="nueva-factura-table-cell" align="right">
                          {detalle.cantidad}
                        </TableCell>
                        <TableCell className="nueva-factura-table-cell" align="right">
                          S/ {detalle.mtoPrecioUnitario.toFixed(2)}
                        </TableCell>
                        <TableCell className="nueva-factura-table-cell" align="right">
                          S/ {detalle.mtoValorVenta.toFixed(2)}
                        </TableCell>
                        <TableCell className="nueva-factura-table-cell" align="right">
                          S/ {detalle.igv.toFixed(2)}
                        </TableCell>
                        {invoiceType === "icbper" && (
                          <TableCell className="nueva-factura-table-cell" align="right">
                            {detalle.icbper ? `S/ ${detalle.icbper.toFixed(2)}` : "N/A"}
                          </TableCell>
                        )}
                        <TableCell className="nueva-factura-table-cell" align="right">
                          S/ {(detalle.mtoValorVenta + detalle.igv + (detalle.icbper || 0)).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Totales */}
              <div className="nueva-factura-totals-container">
                <div className="nueva-factura-total-row">
                  <Typography className="nueva-factura-total-label">Operaciones Gravadas:</Typography>
                  <Typography className="nueva-factura-total-value">
                    S/ {invoiceData.mtoOperGravadas.toFixed(2)}
                  </Typography>
                </div>
                <div className="nueva-factura-total-row">
                  <Typography className="nueva-factura-total-label">IGV (18%):</Typography>
                  <Typography className="nueva-factura-total-value">S/ {invoiceData.mtoIGV.toFixed(2)}</Typography>
                </div>
                {invoiceData.icbper > 0 && (
                  <div className="nueva-factura-total-row">
                    <Typography className="nueva-factura-total-label">ICBPER:</Typography>
                    <Typography className="nueva-factura-total-value">S/ {invoiceData.icbper.toFixed(2)}</Typography>
                  </div>
                )}
                <div className="nueva-factura-grand-total">
                  <Typography className="nueva-factura-total-label">Importe Total:</Typography>
                  <Typography className="nueva-factura-total-value">S/ {invoiceData.mtoImpVenta.toFixed(2)}</Typography>
                </div>
                <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic" }}>
                  {invoiceData.legends[0].value}
                </Typography>
              </div>
            </div>

            {xmlResponse && (
              <div className="nueva-factura-xml-container">
                <Typography className="nueva-factura-preview-title">
                  <Info className="nueva-factura-preview-title-icon" />
                  Representación de la Factura
                </Typography>

                <div className="nueva-factura-xml-buttons">
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setShowInvoiceRepresentation(!showInvoiceRepresentation)}
                    className="nueva-factura-xml-button"
                    size="large"
                  >
                    {showInvoiceRepresentation ? "Ocultar factura emitida" : "Visualizar factura emitida"}
                  </Button>

                  {showInvoiceRepresentation && (
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<Print />}
                      onClick={handlePrintInvoice}
                      className="nueva-factura-xml-button"
                      size="large"
                    >
                      Imprimir Factura
                    </Button>
                  )}
                </div>

                {showInvoiceRepresentation && (
                  <div className="nueva-factura-representation">
                    {/* Cabecera de la factura */}
                    <div className="nueva-factura-representation-header">
                      {/* Logo y datos de la empresa */}
                      <div className="nueva-factura-representation-company">
                        <Typography className="nueva-factura-representation-company-name">
                          {invoiceData.company.razonSocial}
                        </Typography>
                        <Typography className="nueva-factura-representation-company-info">
                          RUC: {invoiceData.company.ruc}
                        </Typography>
                        <Typography className="nueva-factura-representation-company-info">
                          Dirección: {invoiceData.company.address.direccion}
                        </Typography>
                      </div>

                      {/* Datos del documento */}
                      <div className="nueva-factura-representation-document">
                        <Typography className="nueva-factura-representation-document-title">
                          FACTURA ELECTRÓNICA
                        </Typography>
                        <Typography className="nueva-factura-representation-document-number">
                          {invoiceData.serie}-{invoiceData.correlativo}
                        </Typography>
                        <Typography className="nueva-factura-representation-document-date">
                          Fecha: {invoiceData.fechaEmision.split("T")[0]}
                        </Typography>
                      </div>
                    </div>

                    {/* Datos del cliente */}
                    <div className="nueva-factura-representation-client">
                      <Typography className="nueva-factura-representation-client-title">Datos del Cliente</Typography>
                      <div className="nueva-factura-representation-client-grid">
                        <div>
                          <span className="nueva-factura-representation-client-label">RUC:</span>
                          <span className="nueva-factura-representation-client-value">{invoiceData.client.numDoc}</span>
                        </div>
                        <div>
                          <span className="nueva-factura-representation-client-label">Nombre/Razón Social:</span>
                          <span className="nueva-factura-representation-client-value">
                            {invoiceData.client.rznSocial}
                          </span>
                        </div>
                        <div>
                          <span className="nueva-factura-representation-client-label">Fecha Emisión:</span>
                          <span className="nueva-factura-representation-client-value">
                            {invoiceData.fechaEmision.split("T")[0]}
                          </span>
                        </div>
                        <div>
                          <span className="nueva-factura-representation-client-label">Moneda:</span>
                          <span className="nueva-factura-representation-client-value">{invoiceData.tipoMoneda}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tabla de detalles */}
                    <table className="nueva-factura-representation-details">
                      <thead>
                        <tr>
                          <th style={{ width: "10%" }}>Cantidad</th>
                          <th style={{ width: "50%" }}>Descripción</th>
                          <th style={{ width: "20%", textAlign: "right" }}>Valor Unitario</th>
                          <th style={{ width: "20%", textAlign: "right" }}>Valor Venta</th>
                        </tr>
                      </thead>

                      <tbody>
                        {invoiceData.details.map((detalle: any, index: number) => (
                          <tr key={index}>
                            <td>
                              {detalle.cantidad} {detalle.unidad}
                            </td>
                            <td>{detalle.descripcion}</td>
                            <td align="right">S/ {detalle.mtoValorUnitario.toFixed(2)}</td>
                            <td align="right">S/ {detalle.mtoValorVenta.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Totales y resumen */}
                    <div className="nueva-factura-representation-totals">
                      <div className="nueva-factura-representation-words">
                        <strong>SON:</strong> {invoiceData.legends[0].value.replace("SON: ", "")}
                      </div>

                      <div className="nueva-factura-representation-amounts">
                        <div className="nueva-factura-representation-amount-row">
                          <span className="nueva-factura-representation-amount-label">Op. Gravadas:</span>
                          <span className="nueva-factura-representation-amount-value">
                            S/ {invoiceData.mtoOperGravadas.toFixed(2)}
                          </span>
                        </div>

                        <div className="nueva-factura-representation-amount-row">
                          <span className="nueva-factura-representation-amount-label">I.G.V.:</span>
                          <span className="nueva-factura-representation-amount-value">
                            S/ {invoiceData.mtoIGV.toFixed(2)}
                          </span>
                        </div>

                        {invoiceData.icbper > 0 && (
                          <div className="nueva-factura-representation-amount-row">
                            <span className="nueva-factura-representation-amount-label">ICBPER:</span>
                            <span className="nueva-factura-representation-amount-value">
                              S/ {invoiceData.icbper.toFixed(2)}
                            </span>
                          </div>
                        )}

                        <div className="nueva-factura-representation-total-row">
                          <span className="nueva-factura-representation-total-label">TOTAL:</span>
                          <span className="nueva-factura-representation-total-value">
                            S/ {invoiceData.mtoImpVenta.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="nueva-factura-representation-footer">
                      <Typography>Representación impresa de la Factura Electrónica</Typography>
                      <Typography>Consulte su documento en: www.sunat.gob.pe</Typography>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Botones de acción */}
            <div className="nueva-factura-preview-actions">
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={handleBackToInvoice}
                className="nueva-factura-back-button"
              >
                Volver a la Factura
              </Button>
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<PictureAsPdf />}
                  onClick={handleGenerarPDF}
                  disabled={loading || loading2}
                  sx={{ mr: 2 }}
                  className="nueva-factura-preview-button"
                >
                  Descargar PDF
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleNewInvoice}
                  className="nueva-factura-preview-button"
                >
                  Nueva Factura
                </Button>
              </Box>
            </div>
          </Paper>
        </Box>
      </MainLayout>
    )
  }

  // Si no se ha seleccionado un tipo de factura, mostrar la pantalla de selección
  if (!invoiceType) {
    return (
      <MainLayout>
        <Box className="nueva-factura-container" sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
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

          <Paper elevation={3} className="nueva-factura-main-card" sx={{ p: { xs: 2, md: 4 }, mb: 4 }}>
            <Box className="nueva-factura-header">
              <Receipt className="nueva-factura-header-icon" />
              <Typography variant="h4" className="nueva-factura-title">
                Nueva Factura
              </Typography>
            </Box>

            <Typography variant="body1" color="text.secondary" paragraph>
              Seleccione el tipo de factura que desea generar:
            </Typography>

            <div className="nueva-factura-type-container">
              <Zoom in={true} style={{ transitionDelay: "100ms" }}>
                <Card className="nueva-factura-type-card" onClick={() => handleSelectInvoiceType("regular")}>
                  <div className="nueva-factura-type-content">
                    <Description className="nueva-factura-type-icon" />
                    <Typography className="nueva-factura-type-title">Factura Regular</Typography>
                    <Typography className="nueva-factura-type-description">
                      Factura estándar para productos y servicios sin impuesto a bolsas plásticas.
                    </Typography>
                  </div>
                </Card>
              </Zoom>

              <Zoom in={true} style={{ transitionDelay: "300ms" }}>
                <Card className="nueva-factura-type-card" onClick={() => handleSelectInvoiceType("icbper")}>
                  <div className="nueva-factura-type-content">
                    <ShoppingBag className="nueva-factura-type-icon icbper" />
                    <Typography className="nueva-factura-type-title">Factura con ICBPER</Typography>
                    <Typography className="nueva-factura-type-description">
                      Factura que incluye productos con impuesto al consumo de bolsas plásticas (ICBPER).
                    </Typography>
                  </div>
                </Card>
              </Zoom>
            </div>

            <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-start" }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={() => navigate(-1)}
                className="nueva-factura-back-button"
              >
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
      <Box className="nueva-factura-container" sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
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
          <Paper variant="outlined" className="nueva-factura-company-info" sx={{ p: 2, mb: 2 }}>
            <Typography className="nueva-factura-company-title">Empresa Emisora:</Typography>
            <div className="nueva-factura-company-detail">
              <Typography className="nueva-factura-company-label">RUC:</Typography>
              <Typography className="nueva-factura-company-value">{selectedCompany.ruc}</Typography>
            </div>
            <div className="nueva-factura-company-detail">
              <Typography className="nueva-factura-company-label">Razón Social:</Typography>
              <Typography className="nueva-factura-company-value">{selectedCompany.razon_social}</Typography>
            </div>
            <div className="nueva-factura-company-detail">
              <Typography className="nueva-factura-company-label">Dirección:</Typography>
              <Typography className="nueva-factura-company-value">{selectedCompany.direccion}</Typography>
            </div>
          </Paper>
        )}

        <Paper elevation={3} className="nueva-factura-main-card" sx={{ p: { xs: 2, md: 4 }, mb: 4 }}>
          <Box className="nueva-factura-header">
            <Receipt className="nueva-factura-header-icon" />
            <Typography variant="h4" className="nueva-factura-title">
              {invoiceType === "regular" ? "Nueva Factura" : "Nueva Factura con ICBPER"}
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
                  <Typography variant="h6" className="nueva-factura-section-title">
                    <Info className="nueva-factura-section-title-icon" />
                    Información de la Factura
                  </Typography>
                  <Divider className="nueva-factura-divider" />
                </Grid>

                {/* Serie / Correlativo / Fecha */}
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Serie"
                    name="serie"
                    value={formData.serie}
                    onChange={handleInputChange}
                    className="nueva-factura-form-field"
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
                    className="nueva-factura-form-field"
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
                    className="nueva-factura-form-field"
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
                  <Typography variant="h6" className="nueva-factura-section-title">
                    <Person className="nueva-factura-section-title-icon" />
                    Datos del Cliente
                  </Typography>
                  <Divider className="nueva-factura-divider" />
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth className="nueva-factura-form-field">
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
                    className="nueva-factura-form-field"
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
                    className="nueva-factura-form-field"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Dirección"
                    name="direccionCliente"
                    value={formData.direccionCliente}
                    onChange={handleInputChange}
                    className="nueva-factura-form-field"
                  />
                </Grid>

                {/* Detalles */}
                <Grid item xs={12}>
                  <Typography variant="h6" className="nueva-factura-section-title">
                    <Description className="nueva-factura-section-title-icon" />
                    Detalles de la Factura
                  </Typography>
                  <Divider className="nueva-factura-divider" />
                </Grid>

                {/* Configuración ICBPER si es factura con ICBPER */}
                {invoiceType === "icbper" && (
                  <Grid item xs={12}>
                    <div className="nueva-factura-icbper-config">
                      <Typography className="nueva-factura-icbper-title">
                        Configuración ICBPER (Impuesto al Consumo de Bolsas Plásticas)
                      </Typography>
                      <div className="nueva-factura-icbper-grid">
                        <TextField
                          fullWidth
                          label="Factor ICBPER (S/ por bolsa)"
                          type="number"
                          value={factorIcbper}
                          onChange={(e) => setFactorIcbper(Number(e.target.value))}
                          inputProps={{ min: 0.01, step: 0.01 }}
                          helperText="Valor actual según SUNAT: S/ 0.20 por bolsa (2023)"
                          className="nueva-factura-form-field"
                        />
                        <Typography className="nueva-factura-icbper-help">
                          El ICBPER se aplicará a los productos que marques como "Bolsa plástica" al agregarlos.
                        </Typography>
                      </div>
                    </div>
                  </Grid>
                )}

                {/* Agregar Detalle */}
                <Grid item xs={12}>
                  <div className="nueva-factura-detalle-container">
                    <Typography className="nueva-factura-detalle-title">Agregar Nuevo Detalle</Typography>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={invoiceType === "icbper" ? 3 : 5}>
                        <TextField
                          fullWidth
                          label="Descripción"
                          name="descripcion"
                          value={nuevoDetalle.descripcion}
                          onChange={handleDetalleChange}
                          className="nueva-factura-form-field"
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
                          className="nueva-factura-form-field"
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
                          className="nueva-factura-form-field"
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
                          className="nueva-factura-submit-button"
                        >
                          Agregar
                        </Button>
                      </Grid>
                    </Grid>
                  </div>
                </Grid>

                {/* Lista de detalles */}
                <Grid item xs={12}>
                  <TableContainer component={Paper} variant="outlined" className="nueva-factura-table-container">
                    <Table className="nueva-factura-table">
                      <TableHead className="nueva-factura-table-head">
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
                            <TableCell
                              colSpan={invoiceType === "icbper" ? 6 : 5}
                              align="center"
                              className="nueva-factura-empty-row"
                            >
                              No hay detalles agregados
                            </TableCell>
                          </TableRow>
                        ) : (
                          detalles.map((detalle) => (
                            <TableRow key={detalle.id} className="nueva-factura-table-row">
                              <TableCell className="nueva-factura-table-cell">{detalle.descripcion}</TableCell>
                              <TableCell className="nueva-factura-table-cell" align="right">
                                {detalle.cantidad}
                              </TableCell>
                              <TableCell className="nueva-factura-table-cell" align="right">
                                {detalle.precioUnitario.toFixed(2)}
                              </TableCell>
                              <TableCell className="nueva-factura-table-cell" align="right">
                                {detalle.subtotal.toFixed(2)}
                              </TableCell>
                              {invoiceType === "icbper" && (
                                <TableCell className="nueva-factura-table-cell" align="center">
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
                              <TableCell className="nueva-factura-table-cell" align="center">
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
                  <div className="nueva-factura-totals-container">
                    <div className="nueva-factura-total-row">
                      <Typography className="nueva-factura-total-label">Subtotal:</Typography>
                      <Typography className="nueva-factura-total-value">S/ {subtotal.toFixed(2)}</Typography>
                    </div>
                    <div className="nueva-factura-total-row">
                      <Typography className="nueva-factura-total-label">IGV (18%):</Typography>
                      <Typography className="nueva-factura-total-value">S/ {igv.toFixed(2)}</Typography>
                    </div>
                    {invoiceType === "icbper" && icbperTotal > 0 && (
                      <div className="nueva-factura-total-row">
                        <Typography className="nueva-factura-total-label">ICBPER:</Typography>
                        <Typography className="nueva-factura-total-value">S/ {icbperTotal.toFixed(2)}</Typography>
                      </div>
                    )}
                    <div className="nueva-factura-grand-total">
                      <Typography className="nueva-factura-total-label">Total:</Typography>
                      <Typography className="nueva-factura-total-value">S/ {total.toFixed(2)}</Typography>
                    </div>
                  </div>
                </Grid>

                {/* Botones finales */}
                <Grid item xs={12}>
                  <div className="nueva-factura-actions">
                    <Button
                      variant="outlined"
                      startIcon={<ArrowBack />}
                      onClick={() => setInvoiceType(null)}
                      className="nueva-factura-back-button"
                    >
                      Cambiar tipo de factura
                    </Button>

                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<Save />}
                      disabled={loading || loading2 || detalles.length === 0}
                      className="nueva-factura-submit-button"
                      size="large"
                      color="primary"
                      sx={{ fontWeight: "bold", px: 4, py: 1 }}
                    >
                      {loading || loading2 ? <CircularProgress size={24} /> : "Emitir Factura"}
                    </Button>
                  </div>
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

