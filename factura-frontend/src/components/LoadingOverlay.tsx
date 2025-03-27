import type React from "react"
import { Box, CircularProgress, Typography } from "@mui/material"

interface LoadingOverlayProps {
  message?: string
  fullScreen?: boolean
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = "Cargando...", fullScreen = true }) => {
  return (
    <Box
      sx={{
        position: fullScreen ? "fixed" : "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: fullScreen ? "100vh" : "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        zIndex: 9999,
      }}
    >
      <CircularProgress size={60} />
      {message && (
        <Typography variant="body1" sx={{ mt: 2, fontWeight: "medium" }}>
          {message}
        </Typography>
      )}
    </Box>
  )
}

export default LoadingOverlay

