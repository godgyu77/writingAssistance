import { useEffect, useState } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // 타이머 설정
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // 클린업: 이전 타이머 제거
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
