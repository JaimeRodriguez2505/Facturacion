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
    success: boolean
    error?: any
  }
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
  // Mandamos EXACTAMENTE la misma data (company, client, details, etc.)
  const response = await api.post("/invoices/pdf", payload, {
    responseType: "blob",
  })
  return response.data
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
  
}
