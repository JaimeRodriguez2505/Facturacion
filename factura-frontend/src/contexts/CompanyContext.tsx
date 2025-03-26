"use client";

import React, { createContext, useState, useContext, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { Company, companyService } from "../service/companyService";

interface CompanyContextType {
  companies: Company[];
  selectedCompany: Company | null;
  loading: boolean;
  error: string | null;
  fetchCompanies: () => Promise<void>;
  selectCompany: (company: Company) => void;
  createCompany: (companyData: FormData) => Promise<Company>;
  updateCompany: (ruc: string, companyData: FormData) => Promise<Company>;
  deleteCompany: (ruc: string) => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany debe ser usado dentro de un CompanyProvider");
  }
  return context;
}

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchCompanies = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      console.log("Obteniendo empresas...");
      const fetchedCompanies = await companyService.getCompanies();
      console.log("Empresas obtenidas:", fetchedCompanies);

      if (Array.isArray(fetchedCompanies)) {
        setCompanies(fetchedCompanies);
        // Si no hay empresa seleccionada y se obtuvieron empresas, selecciona la primera
        if (fetchedCompanies.length > 0 && !selectedCompany) {
          setSelectedCompany(fetchedCompanies[0]);
        }
      } else {
        console.error("La respuesta no contiene un array de empresas:", fetchedCompanies);
        setError("Error al obtener empresas: formato de respuesta incorrecto");
      }
    } catch (err: any) {
      console.error("Error al obtener empresas:", err);
      setError(err.message || "Error al obtener empresas");
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [user, selectedCompany]);

  useEffect(() => {
    if (user) {
      fetchCompanies();
    }
  }, [user, fetchCompanies]);

  const selectCompany = (company: Company) => {
    setSelectedCompany(company);
  };

  const createCompany = async (companyData: FormData): Promise<Company> => {
    try {
      setLoading(true);
      setError(null);
      const newCompany = await companyService.createCompany(companyData);
      setCompanies((prevCompanies) => {
        const updated = [...prevCompanies, newCompany];
        if (prevCompanies.length === 0) {
          setSelectedCompany(newCompany);
        }
        return updated;
      });
      return newCompany;
    } catch (err: any) {
      console.error("Error al crear empresa:", err);
      setError(err.response?.data?.message || "Error al crear empresa");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCompany = async (ruc: string, companyData: FormData): Promise<Company> => {
    try {
      setLoading(true);
      setError(null);
      const updatedCompany = await companyService.updateCompany(ruc, companyData);
      setCompanies((prevCompanies) =>
        prevCompanies.map((company) => (company.ruc === ruc ? updatedCompany : company))
      );
      if (selectedCompany && selectedCompany.ruc === ruc) {
        setSelectedCompany(updatedCompany);
      }
      return updatedCompany;
    } catch (err: any) {
      console.error(`Error al actualizar empresa con RUC ${ruc}:`, err);
      setError(err.response?.data?.message || "Error al actualizar empresa");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCompany = async (ruc: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await companyService.deleteCompany(ruc);
      setCompanies((prevCompanies) => {
        const updated = prevCompanies.filter((company) => company.ruc !== ruc);
        if (selectedCompany && selectedCompany.ruc === ruc) {
          setSelectedCompany(updated.length > 0 ? updated[0] : null);
        }
        return updated;
      });
    } catch (err: any) {
      console.error(`Error al eliminar empresa con RUC ${ruc}:`, err);
      setError(err.response?.data?.message || "Error al eliminar empresa");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <CompanyContext.Provider
      value={{
        companies,
        selectedCompany,
        loading,
        error,
        fetchCompanies,
        selectCompany,
        createCompany,
        updateCompany,
        deleteCompany,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};
