import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhoneNumber(value: string) {
  if (!value) return ""
  value = value.replace(/\D/g, "")
  value = value.slice(0, 11)
  if (value.length > 10) {
    value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3")
  } else if (value.length > 5) {
    value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3")
  } else if (value.length > 2) {
    value = value.replace(/^(\d{2})(\d*)/, "($1) $2")
  } else {
    value = value.replace(/^(\d*)/, "($1")
  }
  return value
}

export function formatCPF(value: string) {
  if (!value) return ""
  value = value.replace(/\D/g, "")
  value = value.slice(0, 11)
  if (value.length > 9) {
    value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2}).*/, "$1.$2.$3-$4")
  } else if (value.length > 6) {
    value = value.replace(/^(\d{3})(\d{3})(\d{0,3}).*/, "$1.$2.$3")
  } else if (value.length > 3) {
    value = value.replace(/^(\d{3})(\d{0,3}).*/, "$1.$2")
  }
  return value
}

export function validateCPF(cpf: string): boolean {
  if (!cpf) return false
  cpf = cpf.replace(/\D/g, "")
  
  if (cpf.length !== 11) return false
  
  if (/^(\d)\1+$/.test(cpf)) return false
  
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i]) * (10 - i)
  }
  let digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== parseInt(cpf[9])) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i]) * (11 - i)
  }
  digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== parseInt(cpf[10])) return false
  
  return true
}
