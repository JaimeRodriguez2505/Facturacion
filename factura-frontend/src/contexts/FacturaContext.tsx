"use client"

import type React from "react"
import { createContext, useState, useContext, useMemo, useCallback } from "react"
import { facturaService, type FacturaResponse } from "../service/facturaService"

// Definimos las funciones que tu backend realmente soporta
interface FacturaContextType {
  loading: boolean
  error: string | null
  createFactura: (facturaData: any) => Promise<FacturaResponse>
  generarPDF: (id: string) => Promise<Blob>
  enviarSunat: (id: string) => Promise<any>
}

const FacturaContext = createContext<FacturaContextType | undefined>(undefined)

export function useFactura() {
  const context = useContext(FacturaContext)
  if (context === undefined) {
    throw new Error("useFactura debe ser usado dentro de un FacturaProvider")
  }
  return context
}

export const FacturaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Crea y emite una factura (POST /invoices/send)
  const createFactura = useCallback(async (facturaData: any): Promise<FacturaResponse> => {
    try {
      setLoading(true)
      setError(null)

      const response = await facturaService.createFactura(facturaData)
      return response
    } catch (err: any) {
      console.error("Error al crear factura:", err)
      // Si el backend devuelve un mensaje de error, lo capturamos
      setError(err.response?.data?.message || "Error al crear factura")
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Genera PDF de una factura (POST /invoices/pdf)
  const generarPDF = useCallback(async (id: string): Promise<Blob> => {
    try {
      setLoading(true)
      setError(null)

      return await facturaService.generarPDF(id)
    } catch (err: any) {
      console.error(`Error al generar PDF de factura con ID ${id}:`, err)
      setError(err.response?.data?.message || "Error al generar PDF de factura")
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Envía la factura a SUNAT (POST /invoices/xml)
  const enviarSunat = useCallback(async (id: string): Promise<any> => {
    try {
      setLoading(true)
      setError(null)

      return await facturaService.enviarSunat(id)
    } catch (err: any) {
      console.error(`Error al enviar factura con ID ${id} a SUNAT:`, err)
      setError(err.response?.data?.message || "Error al enviar factura a SUNAT")
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Memorizar el valor del contexto para evitar renderizados innecesarios
  const contextValue = useMemo(
    () => ({
      loading,
      error,
      createFactura,
      generarPDF,
      enviarSunat,
    }),
    [loading, error, createFactura, generarPDF, enviarSunat],
  )

  return <FacturaContext.Provider value={contextValue}>{children}</FacturaContext.Provider>
}

