"use client"

import type React from "react"
import { createContext, useState, useContext, useCallback, useEffect, useMemo } from "react"
import { useAuth } from "./AuthContext"
import { type Company, companyService } from "../service/companyService"

interface CompanyContextType {
  companies: Company[]
  selectedCompany: Company | null
  loading: boolean
  error: string | null
  fetchCompanies: () => Promise<void>
  selectCompany: (company: Company) => void
  createCompany: (companyData: FormData) => Promise<Company>
  updateCompany: (ruc: string, companyData: FormData) => Promise<Company>
  deleteCompany: (ruc: string) => Promise<void>
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function useCompany() {
  const context = useContext(CompanyContext)
  if (context === undefined) {
    throw new Error("useCompany debe ser usado dentro de un CompanyProvider")
  }
  return context
}

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const { user } = useAuth()

  const fetchCompanies = useCallback(async () => {
    // Si ya estamos cargando o ya hemos inicializado, no hacer nada
    if (loading || isInitialized) return

    if (!user) return

    try {
      setLoading(true)
      setError(null)
      console.log("Obteniendo empresas...")
      const fetchedCompanies = await companyService.getCompanies()
      console.log("Empresas obtenidas:", fetchedCompanies)

      if (Array.isArray(fetchedCompanies)) {
        setCompanies(fetchedCompanies)
        // Si no hay empresa seleccionada y se obtuvieron empresas, selecciona la primera
        if (fetchedCompanies.length > 0 && !selectedCompany) {
          setSelectedCompany(fetchedCompanies[0])
        }
        // Marcar como inicializado para evitar más llamadas
        setIsInitialized(true)
      } else {
        console.error("La respuesta no contiene un array de empresas:", fetchedCompanies)
        setError("Error al obtener empresas: formato de respuesta incorrecto")
        // Aún así, marcar como inicializado para evitar bucles
        setIsInitialized(true)
      }
    } catch (err: any) {
      console.error("Error al obtener empresas:", err)
      setError(err.message || "Error al obtener empresas")
      setCompanies([])
      // Marcar como inicializado incluso en caso de error
      setIsInitialized(true)
    } finally {
      setLoading(false)
    }
  }, [user, selectedCompany, loading, isInitialized])

  // Efecto para cargar empresas solo cuando el usuario cambia
  useEffect(() => {
    if (user && !isInitialized) {
      fetchCompanies()
    }
  }, [user, fetchCompanies, isInitialized])

  // Función para forzar una recarga (para el botón de actualizar)
  const forceRefresh = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      const fetchedCompanies = await companyService.getCompanies()

      if (Array.isArray(fetchedCompanies)) {
        setCompanies(fetchedCompanies)
        // Actualizar la empresa seleccionada si ya no existe
        if (selectedCompany && !fetchedCompanies.find((c) => c.ruc === selectedCompany.ruc)) {
          setSelectedCompany(fetchedCompanies.length > 0 ? fetchedCompanies[0] : null)
        }
      } else {
        setError("Error al obtener empresas: formato de respuesta incorrecto")
      }
    } catch (err: any) {
      setError(err.message || "Error al obtener empresas")
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }, [user, selectedCompany])

  // Memorizar el valor del contexto para evitar renderizados innecesarios
  const contextValue = useMemo(
    () => ({
      companies,
      selectedCompany,
      loading,
      error,
      fetchCompanies: forceRefresh, // Usar forceRefresh para el método público
      selectCompany: (company: Company) => {
        setSelectedCompany(company)
      },
      createCompany: async (companyData: FormData): Promise<Company> => {
        try {
          setLoading(true)
          setError(null)
          const newCompany = await companyService.createCompany(companyData)
          setCompanies((prevCompanies) => {
            const updated = [...prevCompanies, newCompany]
            if (prevCompanies.length === 0) {
              setSelectedCompany(newCompany)
            }
            return updated
          })
          return newCompany
        } catch (err: any) {
          console.error("Error al crear empresa:", err)
          setError(err.response?.data?.message || "Error al crear empresa")
          throw err
        } finally {
          setLoading(false)
        }
      },
      updateCompany: async (ruc: string, companyData: FormData): Promise<Company> => {
        try {
          setLoading(true)
          setError(null)
          const updatedCompany = await companyService.updateCompany(ruc, companyData)
          setCompanies((prevCompanies) =>
            prevCompanies.map((company) => (company.ruc === ruc ? updatedCompany : company)),
          )
          if (selectedCompany && selectedCompany.ruc === ruc) {
            setSelectedCompany(updatedCompany)
          }
          return updatedCompany
        } catch (err: any) {
          console.error(`Error al actualizar empresa con RUC ${ruc}:`, err)
          setError(err.response?.data?.message || "Error al actualizar empresa")
          throw err
        } finally {
          setLoading(false)
        }
      },
      deleteCompany: async (ruc: string): Promise<void> => {
        try {
          setLoading(true)
          setError(null)
          await companyService.deleteCompany(ruc)
          setCompanies((prevCompanies) => {
            const updated = prevCompanies.filter((company) => company.ruc !== ruc)
            if (selectedCompany && selectedCompany.ruc === ruc) {
              setSelectedCompany(updated.length > 0 ? updated[0] : null)
            }
            return updated
          })
        } catch (err: any) {
          console.error(`Error al eliminar empresa con RUC ${ruc}:`, err)
          setError(err.response?.data?.message || "Error al eliminar empresa")
          throw err
        } finally {
          setLoading(false)
        }
      },
    }),
    [companies, selectedCompany, loading, error, forceRefresh],
  )

  return <CompanyContext.Provider value={contextValue}>{children}</CompanyContext.Provider>
}

