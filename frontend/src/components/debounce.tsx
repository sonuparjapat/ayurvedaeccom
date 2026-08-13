import { useState, useEffect } from "react";

const useDebounce = (value?: any, delay = 400) => {
  const [searchvalue, setSearchValue] = useState<any>("")
  useEffect(() => {
    const timer = setTimeout(() => setSearchValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return searchvalue
}
export default useDebounce
