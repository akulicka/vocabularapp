import { useState } from "react";
import Chip from "@mui/material/Chip"

function WordChip({word, ...chipProps}){
    const [alt, setAlt] = useState(false)
    return <Chip {...chipProps} label={alt ? word.arabic : word.english} onClick={() => setAlt(!alt)} />
}

export default WordChip