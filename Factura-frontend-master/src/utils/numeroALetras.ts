/**
 * Converts a number to its text representation in Spanish
 * @param numero The number to convert
 * @returns The number in words
 */
export function numeroALetras(numero: number): string {
    const unidades = ["", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"]
    const decenas = ["", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"]
    const especiales = [
      "DIEZ",
      "ONCE",
      "DOCE",
      "TRECE",
      "CATORCE",
      "QUINCE",
      "DIECISEIS",
      "DIECISIETE",
      "DIECIOCHO",
      "DIECINUEVE",
    ]
    const centenas = [
      "",
      "CIENTO",
      "DOSCIENTOS",
      "TRESCIENTOS",
      "CUATROCIENTOS",
      "QUINIENTOS",
      "SEISCIENTOS",
      "SETECIENTOS",
      "OCHOCIENTOS",
      "NOVECIENTOS",
    ]
  
    // Format the number to have 2 decimal places
    const parteEntera = Math.floor(numero)
    const parteDecimal = Math.round((numero - parteEntera) * 100)
  
    // Convert the integer part
    let resultado = ""
  
    if (parteEntera === 0) {
      resultado = "CERO"
    } else if (parteEntera === 1) {
      resultado = "UNO"
    } else {
      // Process thousands
      if (parteEntera >= 1000) {
        if (Math.floor(parteEntera / 1000) === 1) {
          resultado += "MIL "
        } else {
          resultado += numeroALetrasInterno(Math.floor(parteEntera / 1000)) + " MIL "
        }
      }
  
      // Process hundreds and tens
      resultado += numeroALetrasInterno(parteEntera % 1000)
    }
  
    // Add currency and decimal part
    resultado = `SON: ${resultado} CON ${parteDecimal.toString().padStart(2, "0")}/100 SOLES`
  
    return resultado
  
    // Helper function to convert numbers less than 1000
    function numeroALetrasInterno(n: number): string {
      if (n === 0) return ""
      if (n === 100) return "CIEN"
  
      let result = ""
  
      // Process hundreds
      if (n >= 100) {
        result += centenas[Math.floor(n / 100)] + " "
        n %= 100
      }
  
      // Process tens and units
      if (n > 0) {
        if (n < 10) {
          result += unidades[n]
        } else if (n < 20) {
          result += especiales[n - 10]
        } else {
          const unidad = n % 10
          const decena = Math.floor(n / 10)
  
          if (unidad === 0) {
            result += decenas[decena]
          } else {
            result += decenas[decena] + " Y " + unidades[unidad]
          }
        }
      }
  
      return result.trim()
    }
  }
  
  