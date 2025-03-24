import {Routes as RouterRoutes, Route} from "react-router";
import Box from "@mui/material/Box";

import Login from '../Pages/Login'
import Register from "../Pages/Register";
import Lists from '../Pages/Lists'

import { Verify, VerifyPrompt } from "../Pages/VerifyEmail";

/*TODO - Lazy loading, api progress indicator */

function Routes ({user})  {
    return (
        <Box width='80%' alignItems={"center"} height="100vh" flexGrow={1} alignSelf='center'>
            {user ?
                <RouterRoutes>
                    <Route path ="/" element={<Lists/>}/>{/* TODO */}
                    <Route path ="/:listId" element={() => <>list</> }/>
                </RouterRoutes>:
                <RouterRoutes>
                    <Route path ="/" element={<Login/>}/>
                    <Route path ="/register" element={<Register/>} />
                    <Route path ="/:userId/verify" element={<VerifyPrompt/>} />
                    <Route path ="/:userId/verify/:tokenId" element={<Verify/>} />
                </RouterRoutes>
            }
        </Box>
    )
}

export default Routes