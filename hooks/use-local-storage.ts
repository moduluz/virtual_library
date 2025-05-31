import { useState, useEffect } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Initialize state with stored value or provided initial value
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  useEffect(() => {
    // Get value from localStorage
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key)
        // Parse stored json or use initialValue if none
        if (item) {
          setStoredValue(JSON.parse(item))
        }
      }
    } catch (error) {
      console.log(error)
      return initialValue
    }
  }, [key, initialValue])

  // Function to update state and localStorage
  const setValue = (value: T) => {
    try {
      // Save state
      setStoredValue(value)
      // Save to localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value))
      }
    } catch (error) {
      console.log(error)
    }
  }

  return [storedValue, setValue]
} 