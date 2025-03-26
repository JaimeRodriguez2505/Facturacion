import api from "./api"

export interface Company {
    id?: number
    razon_social: string
    ruc: string
    direccion: string
    logo_path?: string
    sol_user: string
    sol_pass: string
    cert_path?: string
    client_id?: string
    client_secret?: string
    production?: boolean
    user_id?: number
}

export const companyService = {
    // Obtener todas las empresas del usuario
    getCompanies: async (): Promise<Company[]> => {
        try {
            const response = await api.get("/companies")
            console.log("Respuesta de obtener empresas:", response.data)
            return response.data.company || []
        } catch (error) {
            console.error("Error al obtener empresas:", error)
            throw error
        }
    },

    // Obtener una empresa específica
    getCompany: async (ruc: string) => {
        try {
            const response = await api.get(`/companies/${ruc}`)
            console.log("Respuesta de obtener empresa:", response.data)
            return response.data
        } catch (error) {
            console.error("Error al obtener empresa:", error)
            throw error
        }
    },

    // Crear una nueva empresa
    createCompany: async (companyData: FormData): Promise<Company> => {
        try {
            // Asegurarse de que production se envía como "1" o "0"
            if (companyData.has("production")) {
                const productionValue = companyData.get("production")
                companyData.delete("production")
                if (productionValue === "true" || productionValue === "1") {
                    companyData.append("production", "1")
                } else {
                    companyData.append("production", "0")
                }
            }
            const response = await api.post("/companies", companyData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })
            console.log("Respuesta de crear empresa:", response.data)
            return response.data.company
        } catch (error) {
            console.error("Error al crear empresa:", error)
            throw error
        }
    },

    // Actualizar una empresa existente (usando PUT)
    updateCompany: async (ruc: string, companyData: FormData): Promise<Company> => {
        // Conversión de production a "1" o "0"
        if (companyData.has("production")) {
            const productionValue = companyData.get("production")
            companyData.delete("production")
            if (productionValue === "true" || productionValue === "1") {
                companyData.append("production", "1")
            } else {
                companyData.append("production", "0")
            }
        }
        const response = await api.put(`/companies/${ruc}`, companyData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        })
        console.log("Respuesta de actualizar empresa:", response.data)
        return response.data.company
    },
    

    // Eliminar una empresa
    deleteCompany: async (ruc: string): Promise<void> => {
        try {
            const response = await api.delete(`/companies/${ruc}`)
            console.log("Respuesta de eliminar empresa:", response.data)
        } catch (error) {
            console.error(`Error al eliminar empresa con RUC ${ruc}:`, error)
            throw error
        }
    },
}
