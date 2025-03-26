"use client"

import type React from "react"
import { useState } from "react"
import { Box, CssBaseline, Toolbar, useTheme, useMediaQuery } from "@mui/material"
import Header from "./Header"
import Sidebar from "./Sidebar"

interface MainLayoutProps {
  children: React.ReactNode
}

const drawerWidth = 240

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const [open, setOpen] = useState(!isMobile)

  const toggleDrawer = () => {
    setOpen(!open)
  }

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <CssBaseline />
      <Header open={open} toggleDrawer={toggleDrawer} />
      <Sidebar open={open} toggleDrawer={toggleDrawer} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${open ? drawerWidth : 0}px)` },
          ml: { md: open ? `${drawerWidth}px` : 0 },
          transition: theme.transitions.create(["margin", "width"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar /> {/* Espacio para que el contenido no quede debajo del AppBar */}
        {children}
      </Box>
    </Box>
  )
}

export default MainLayout

