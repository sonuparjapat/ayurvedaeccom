import { useState } from "react";

const useDebounce=(value?:any,delay = 400) =>{
  const [searchvalue,setSearchValue]=useState<any>("")
  setTimeout(() => {
 setSearchValue(value)
  }, delay);
  return searchvalue
}
export default useDebounce