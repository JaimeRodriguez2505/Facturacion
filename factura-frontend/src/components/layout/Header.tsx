"use client"

import React from "react"
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Badge,
  Menu,
  MenuItem,
  Tooltip,
  useTheme,
  Button,
} from "@mui/material"
import { 
  Menu as MenuIcon, 
  Notifications as NotificationsIcon, 
  AccountCircle,
  Business as BusinessIcon,
  Add as AddIcon
} from "@mui/icons-material"
import { useAuth } from "../../contexts/AuthContext"
import { useCompany } from "../../contexts/CompanyContext"
import { useNavigate } from "react-router-dom"

interface HeaderProps {
  open: boolean
  toggleDrawer: () => void
}

const Header: React.FC<HeaderProps> = ({ toggleDrawer }) => {
  const theme = useTheme()
  const { logout } = useAuth()
  const { companies, selectedCompany, selectCompany } = useCompany()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const [companyMenuAnchorEl, setCompanyMenuAnchorEl] = React.useState<null | HTMLElement>(null)

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleCompanyMenu = (event: React.MouseEvent<HTMLElement>) => {
    setCompanyMenuAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleCompanyMenuClose = () => {
    setCompanyMenuAnchorEl(null)
  }

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  const handleCompanySelect = (company: any) => {
    selectCompany(company)
    handleCompanyMenuClose()
  }

  const handleAddCompany = () => {
    handleCompanyMenuClose()
    navigate("/companies/new")
  }

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        transition: theme.transitions.create(["width", "margin"], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      }}
    >
      <Toolbar>
        <IconButton color="inherit" aria-label="open drawer" onClick={toggleDrawer} edge="start" sx={{ mr: 2 }}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Sistema de Facturación
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center" }}>
          {/* Selector de empresa */}
          <Box sx={{ mr: 2 }}>
            <Button
              color="inherit"
              onClick={handleCompanyMenu}
              startIcon={<BusinessIcon />}
              endIcon={<MenuIcon />}
              sx={{ 
                textTransform: 'none',
                backgroundColor: 'rgba(255,255,255,0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)',
                },
                px: 2,
                borderRadius: 2
              }}
            >
              {selectedCompany ? selectedCompany.razon_social : "Seleccionar Empresa"}
            </Button>
            <Menu
              anchorEl={companyMenuAnchorEl}
              open={Boolean(companyMenuAnchorEl)}
              onClose={handleCompanyMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              {companies.length > 0 ? (
                companies.map((company) => (
                  <MenuItem 
                    key={company.ruc} 
                    onClick={() => handleCompanySelect(company)}
                    selected={selectedCompany?.ruc === company.ruc}
                  >
                    <BusinessIcon sx={{ mr: 1, fontSize: 20 }} />
                    {company.razon_social}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No hay empresas registradas</MenuItem>
              )}
              <MenuItem onClick={handleAddCompany}>
                <AddIcon sx={{ mr: 1, fontSize: 20 }} />
                Agregar nueva empresa
              </MenuItem>
            </Menu>
          </Box>

          <Tooltip title="Notificaciones">
            <IconButton color="inherit" size="large">
              <Badge badgeContent={4} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Box sx={{ ml: 2 }}>
            <Tooltip title="Mi cuenta">
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <AccountCircle />
              </IconButton>
            </Tooltip>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem
                onClick={() => {
                  handleClose()
                  navigate("/perfil")
                }}
              >
                Mi Perfil
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleClose()
                  navigate("/companies")
                }}
              >
                Mis Empresas
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleClose()
                  navigate("/configuracion")
                }}
              >
                Configuración
              </MenuItem>
              <MenuItem onClick={handleLogout}>Cerrar Sesión</MenuItem>
            </Menu>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header
