import api from "./api"

// Si quieres tipar tu factura y detalles, aquí están los tipos opcionales
export interface DetalleFactura {
  id?: number
  descripcion: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  factura_id?: number
}

export interface Factura {
  id?: number
  serie: string
  correlativo: string
  fecha_emision: string
  tipo_doc_cliente: string
  num_doc_cliente: string
  nombre_cliente: string
  direccion_cliente?: string
  subtotal: number
  igv: number
  total: number
  estado: "Pendiente" | "Pagada" | "Vencida" | "Anulada"
  company_id?: number
  detalles: DetalleFactura[]
}

// Ajusta la estructura de acuerdo a lo que devuelva tu backend
export interface FacturaResponse {
  xml: string
  hash: string
  sunatResponse: {
    cdrResponse: null
    success: boolean
    error?: any
  }
  data?: any // Datos completos de la factura enviada
  factura?: Factura
}

// Aquí solo definimos los métodos que coinciden con tus rutas actuales
export const facturaService = {
  // Crea y emite una factura (POST /invoices/send)
  createFactura: async (facturaData: any): Promise<FacturaResponse> => {
    try {
      console.log("Enviando datos de factura al servidor:", facturaData)
      const response = await api.post("/invoices/send", facturaData)
      console.log("Respuesta de crear factura:", response.data)

      // Devolvemos el objeto que incluye xml, hash, sunatResponse, etc.
      return response.data
    } catch (error) {
      console.error("Error al crear factura:", error)
      throw error
    }
  },

  // facturaService.ts
  generarPDF: async (payload: any): Promise<Blob> => {
    try {
      console.log("Enviando solicitud para generar PDF:", payload)

      // Intentar obtener el PDF con responseType: 'blob'
      const response = await api.post("/invoices/pdf", payload, {
        responseType: "blob",
        headers: {
          Accept: "application/pdf, text/html, application/json",
        },
      })

      console.log("Respuesta de generación de PDF:", response)

      // Verificar el tipo de contenido de la respuesta
      const contentType = response.headers["content-type"]
      console.log("Tipo de contenido recibido:", contentType)

      // Si es un PDF, devolver el blob directamente
      if (contentType && contentType.includes("application/pdf")) {
        return response.data
      }

      // Si es HTML, convertirlo a PDF usando html2canvas y jsPDF
      if (contentType && contentType.includes("text/html")) {
        // Crear un elemento temporal para mostrar el HTML
        const tempDiv = document.createElement("div")
        tempDiv.style.position = "absolute"
        tempDiv.style.left = "-9999px"
        tempDiv.innerHTML = response.data
        document.body.appendChild(tempDiv)

        // Aquí deberíamos usar html2canvas y jsPDF para convertir a PDF
        // Pero como no tenemos esas dependencias, vamos a crear un PDF simple
        const pdfBlob = new Blob(["Error: El servidor devolvió HTML en lugar de PDF"], { type: "application/pdf" })

        // Limpiar
        document.body.removeChild(tempDiv)

        return pdfBlob
      }

      // Si es otro tipo (como JSON con un error), lanzar una excepción
      if (response.data instanceof Blob) {
        // Convertir el Blob a texto para ver el mensaje de error
        const text = await response.data.text()
        try {
          const errorData = JSON.parse(text)
          throw new Error(errorData.message || "Error al generar PDF")
        } catch (e) {
          throw new Error("Error al generar PDF: " + text)
        }
      }

      throw new Error("Formato de respuesta no reconocido")
    } catch (error: any) {
      console.error("Error al generar PDF:", error)

      // Si el error tiene una respuesta con datos, intentar extraer el mensaje
      if (error.response && error.response.data) {
        if (error.response.data instanceof Blob) {
          try {
            const text = await error.response.data.text()
            const errorData = JSON.parse(text)
            throw new Error(errorData.message || "Error al generar PDF")
          } catch (e) {
            // Si no se puede parsear como JSON, usar el mensaje original
          }
        }
      }

      throw error
    }
  },

  // Enviar la factura a SUNAT (POST /invoices/xml)
  enviarSunat: async (id: string): Promise<any> => {
    try {
      // El backend espera un objeto { id } en el body
      const response = await api.post("/invoices/xml", { id })
      console.log("Respuesta de enviar factura a SUNAT:", response.data)
      return response.data
    } catch (error) {
      console.error(`Error al enviar factura con ID ${id} a SUNAT:`, error)
      throw error
    }
  },

  // Nuevos métodos para trabajar con facturas en la BD

  // Guardar factura en la base de datos
  guardarFacturaEnBD: async (facturaData: any): Promise<any> => {
    try {
      console.log("Guardando factura en la base de datos:", facturaData)

      // Asegurarse de que los campos numéricos sean números
      const formattedData = {
        ...facturaData,
        // Convertir explícitamente a números los campos que deben ser numéricos
        num_doc_cliente: String(facturaData.num_doc_cliente), // Asegurarse que sea string
        subtotal: Number(facturaData.subtotal),
        igv: Number(facturaData.igv),
        total: Number(facturaData.total),
        company_id: Number(facturaData.company_id),
        // Asegurarse que los detalles tengan el formato correcto
        detalles: facturaData.detalles.map((detalle: any) => ({
          descripcion: detalle.descripcion,
          cantidad: Number(detalle.cantidad),
          precio_unitario: Number(detalle.precio_unitario),
          subtotal: Number(detalle.subtotal),
        })),
      }

      console.log("Datos formateados para enviar:", formattedData)
      const response = await api.post("/facturas", formattedData)
      console.log("Respuesta de guardar factura en BD:", response.data)
      return response.data
    } catch (error) {
      console.error("Error al guardar factura en BD:", error)
      throw error
    }
  },

  // Obtener todas las facturas
  getFacturas: async (): Promise<any> => {
    try {
      const response = await api.get("/facturas")
      console.log("Facturas obtenidas:", response.data)
      return response.data
    } catch (error) {
      console.error("Error al obtener facturas:", error)
      throw error
    }
  },

  // Obtener una factura específica
  getFactura: async (id: string): Promise<any> => {
    try {
      const response = await api.get(`/facturas/${id}`)
      console.log("Factura obtenida:", response.data)
      return response.data
    } catch (error) {
      console.error(`Error al obtener factura con ID ${id}:`, error)
      throw error
    }
  },

  // Generar PDF de una factura existente
  generarPDFdeFacturaExistente: async (id: string): Promise<Blob> => {
    try {
      console.log(`Solicitando PDF para factura ID: ${id}`)

      try {
        // Primero intentamos con responseType: 'blob'
        const response = await api.get(`/facturas/${id}/pdf`, {
          responseType: "blob",
          headers: {
            Accept: "application/pdf, text/html, application/json",
          },
        })

        console.log("Respuesta de generación de PDF:", response)

        // Verificar el tipo de contenido de la respuesta
        const contentType = response.headers["content-type"]
        console.log("Tipo de contenido recibido:", contentType)

        // Si es un PDF, devolver el blob directamente
        if (contentType && contentType.includes("application/pdf")) {
          return response.data
        }

        // Si es HTML, extraer el mensaje de error
        if (contentType && contentType.includes("text/html")) {
          console.error("El servidor devolvió HTML en lugar de PDF")

          // Convertir el blob HTML a texto para ver el contenido
          const htmlText = await response.data.text()
          console.log("Contenido HTML recibido:", htmlText.substring(0, 500) + "...")

          // Crear un mensaje de error más descriptivo
          throw new Error("El servidor devolvió HTML en lugar de PDF. Posible error en el backend.")
        }

        // Si es otro tipo, intentar extraer información
        const text = await response.data.text()
        console.log("Contenido de la respuesta:", text.substring(0, 500) + "...")

        try {
          const errorData = JSON.parse(text)
          throw new Error(errorData.message || "Error al generar PDF")
        } catch (e) {
          throw new Error("Error al generar PDF: Formato de respuesta no reconocido")
        }
      } catch (error: any) {
        // Si hay un error en la primera solicitud, intentar con responseType: 'json'
        if (error.response && error.response.status === 500) {
          console.log("Reintentando solicitud como JSON para obtener mensaje de error...")

          try {
            const jsonResponse = await api.get(`/facturas/${id}/pdf`, {
              responseType: "json",
            })

            console.log("Respuesta JSON:", jsonResponse.data)
            throw new Error(`Error del servidor: ${jsonResponse.data.message || "Error desconocido"}`)
          } catch (jsonError: any) {
            console.error("Error al obtener respuesta JSON:", jsonError)
            // Si también falla, lanzar el error original
            throw error
          }
        } else {
          throw error
        }
      }
    } catch (error: any) {
      console.error(`Error al generar PDF de factura con ID ${id}:`, error)

      // Mensaje de error más descriptivo para el usuario
      let errorMessage = "Error al generar PDF. "

      if (error.response) {
        if (error.response.status === 500) {
          errorMessage += "Error interno del servidor (500). "
          errorMessage += "El backend podría estar teniendo problemas para generar el PDF. "
          errorMessage +=
            "Verifique que el método generatePdfReport() en SunatService.php devuelva el PDF en lugar de guardarlo."
        } else {
          errorMessage += `Código de error: ${error.response.status}. `
        }
      }

      if (error.message) {
        errorMessage += error.message
      }

      throw new Error(errorMessage)
    }
  },

  // Actualizar estado de una factura
  actualizarEstadoFactura: async (id: string, estado: string): Promise<any> => {
    try {
      const response = await api.put(`/facturas/${id}/estado`, { estado })
      console.log("Estado de factura actualizado:", response.data)
      return response.data
    } catch (error) {
      console.error(`Error al actualizar estado de factura con ID ${id}:`, error)
      throw error
    }
  },

  // Anular una factura
  anularFactura: async (id: string): Promise<any> => {
    try {
      const response = await api.delete(`/facturas/${id}`)
      console.log("Factura anulada:", response.data)
      return response.data
    } catch (error) {
      console.error(`Error al anular factura con ID ${id}:`, error)
      throw error
    }
  },
}

