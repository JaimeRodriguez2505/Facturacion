import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import { AuthProvider } from "./contexts/AuthContext"
import { CompanyProvider } from "./contexts/CompanyContext"
import { FacturaProvider } from "./contexts/FacturaContext"
import { ThemeProvider } from "./contexts/ThemeContext"
import ProtectedRoute from "./components/ProtectedRoute"

// Páginas de autenticación
import Login from "./pages/auth/Login"
import Register from "./pages/auth/Register"

// Páginas protegidas
import Dashboard from "./pages/Dashboard"
import CompanyDetail from "./pages/company/CompanyDetail"
import CompanyRegistration from "./pages/company/CompanyRegistration"
import NuevaFactura from "./pages/facturas/NuevaFactura"

// Tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
      light: "#42a5f5",
      dark: "#1565c0",
    },
    secondary: {
      main: "#9c27b0",
      light: "#ba68c8",
      dark: "#7b1fa2",
    },
    background: {
      default: "#f5f5f5",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
})

function App() {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <ThemeProvider>
        <AuthProvider>
          <CompanyProvider>
            <FacturaProvider>
              <Router>
                <Routes>
                  {/* Rutas públicas */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Rutas protegidas */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/facturas"
                    element={
                      <ProtectedRoute>
                        #
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/facturas/nueva"
                    element={
                      <ProtectedRoute>
                        <NuevaFactura />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/companies"
                    element={
                      <ProtectedRoute>
                        #
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/companies/new"
                    element={
                      <ProtectedRoute>
                        <CompanyRegistration />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/companies/:ruc"
                    element={
                      <ProtectedRoute>
                        <CompanyDetail />
                      </ProtectedRoute>
                    }
                  />

                  {/* Redirecciones */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Router>
            </FacturaProvider>
          </CompanyProvider>
        </AuthProvider>
      </ThemeProvider>
    </MuiThemeProvider>
  )
}

export default App

