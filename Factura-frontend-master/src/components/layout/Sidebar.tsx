"use client"

import type React from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
  Collapse,
} from "@mui/material"
import {
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  Logout as LogoutIcon,
  Business as BusinessIcon,
  ExpandLess,
  ExpandMore,
  Add as AddIcon,
  NoteAdd as NoteAddIcon,
  ReceiptLong as ReceiptLongIcon,
} from "@mui/icons-material"
import { useAuth } from "../../contexts/AuthContext"
import { useCompany } from "../../contexts/CompanyContext"
import { useState } from "react"

const drawerWidth = 240

interface SidebarProps {
  open: boolean
  toggleDrawer: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ open, toggleDrawer }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  const { selectedCompany } = useCompany()

  const [facturaOpen, setFacturaOpen] = useState(false)
  const [empresasOpen, setEmpresasOpen] = useState(false)

  const handleFacturaClick = () => {
    setFacturaOpen(!facturaOpen)
  }

  const handleEmpresasClick = () => {
    setEmpresasOpen(!empresasOpen)
  }

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }


  const drawer = (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 2,
          backgroundColor: "primary.main",
          color: "white",
        }}
      >
        <Typography variant="h6" noWrap component="div">
          Facturador
        </Typography>
        {isMobile && (
          <IconButton onClick={toggleDrawer} sx={{ color: "white" }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>
      <Divider />

      {/* Información de la empresa seleccionada */}
      {selectedCompany && (
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {selectedCompany.razon_social}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            RUC: {selectedCompany.ruc}
          </Typography>
        </Box>
      )}

      <Divider />

      <List>
        {/* Dashboard */}
        <ListItem disablePadding>
          <ListItemButton
            selected={location.pathname === "/dashboard"}
            onClick={() => {
              navigate("/dashboard")
              if (isMobile) toggleDrawer()
            }}
            sx={{
              "&.Mui-selected": {
                backgroundColor: "primary.light",
                color: "primary.main",
                "& .MuiListItemIcon-root": {
                  color: "primary.main",
                },
              },
              "&:hover": {
                backgroundColor: "primary.light",
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: location.pathname === "/dashboard" ? "primary.main" : "inherit",
              }}
            >
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>

        {/* Empresas */}

        {/* Empresas */}
        <ListItem disablePadding>
          <ListItemButton onClick={handleEmpresasClick}>
            <ListItemIcon>
              <BusinessIcon />
            </ListItemIcon>
            <ListItemText primary="Empresas" />
            {empresasOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={empresasOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            
            <ListItemButton
              sx={{ pl: 4 }}
              selected={location.pathname === "/companies/new"}
              onClick={() => {
                navigate("/companies/new")
                if (isMobile) toggleDrawer()
              }}
            >
              <ListItemIcon>
                <AddIcon />
              </ListItemIcon>
              <ListItemText primary="Nueva Empresa" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Facturas - Solo visible si hay una empresa seleccionada */}
        {selectedCompany && (
          <>
            <ListItem disablePadding>
              <ListItemButton onClick={handleFacturaClick}>
                <ListItemIcon>
                  <ReceiptIcon />
                </ListItemIcon>
                <ListItemText primary="Facturación" />
                {facturaOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={facturaOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                
                <ListItemButton
                  sx={{ pl: 4 }}
                  selected={location.pathname === "/facturas/nueva"}
                  onClick={() => {
                    navigate("/facturas/nueva")
                    if (isMobile) toggleDrawer()
                  }}
                >
                  <ListItemIcon>
                    <NoteAddIcon />
                  </ListItemIcon>
                  <ListItemText primary="Nueva Factura" />
                </ListItemButton>
              </List>
            </Collapse>
          </>
        )}

        
        
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Cerrar Sesión" />
          </ListItemButton>
        </ListItem>
      </List>
    </>
  )

  return (
    <>
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={open}
          onClose={toggleDrawer}
          ModalProps={{
            keepMounted: true, // Mejor rendimiento en dispositivos móviles
          }}
          sx={{
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
            },
          }}
        >
          {drawer}
        </Drawer>
      ) : (
        <Drawer
          variant="persistent"
          open={open}
          sx={{
            width: open ? drawerWidth : 0,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              transition: theme.transitions.create(["width", "margin"], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
        >
          {drawer}
        </Drawer>
      )}
    </>
  )
}

export default Sidebar

