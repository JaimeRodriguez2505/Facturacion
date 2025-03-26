"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Box, Button, Typography, Alert, CircularProgress, Paper } from "@mui/material"
import api from "../service/api"

const TestConnection: React.FC = () => {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState<string>("")

  const testConnection = async () => {
    setStatus("loading")
    setMessage("")

    try {
      // Intentar una petición simple al backend
      const response = await api.get("/ping", { timeout: 5000 })
      setStatus("success")
      setMessage(`Conexión exitosa: ${JSON.stringify(response.data)}`)
    } catch (error: any) {
      setStatus("error")
      if (error.code === "ECONNABORTED") {
        setMessage("Tiempo de espera agotado. El servidor no responde.")
      } else if (error.response) {
        // El servidor respondió con un código de estado diferente de 2xx
        setMessage(
          `Error ${error.response.status}: ${error.response.data?.message || JSON.stringify(error.response.data) || "Error en la respuesta del servidor"}`,
        )
      } else if (error.request) {
        // La petición fue hecha pero no se recibió respuesta
        setMessage("No se recibió respuesta del servidor. Verifica que el backend esté en ejecución.")
      } else {
        // Algo ocurrió al configurar la petición
        setMessage(`Error: ${error.message}`)
      }
    }
  }

  useEffect(() => {
    // Probar la conexión al cargar el componente
    testConnection()
  }, [])

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Prueba de Conexión al Backend
      </Typography>

      <Box sx={{ mt: 2, mb: 2 }}>
        {status === "loading" && (
          <Box display="flex" alignItems="center">
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Typography>Probando conexión...</Typography>
          </Box>
        )}

        {status === "success" && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        {status === "error" && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}
      </Box>

      <Button variant="contained" onClick={testConnection} disabled={status === "loading"}>
        Probar Conexión
      </Button>
    </Paper>
  )
}

export default TestConnection

