import React, { Component } from "react";
import { createRoot } from "react-dom/client";
import RoomJoinPage from "./RoomJoinPage";
import CreateRoomPage from "./CreateRoomPage";
import RoomWrapper from "./Room";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Button, Grid, Typography, Box, FormControl, FormHelperText, FormControlLabel } from "@mui/material"
import { Link, useNavigate } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles"

const darkTheme = createTheme({
    palette: {
        mode: "dark",
    },
});

export default class HomePage extends Component {
    constructor(props) {
        super(props);
        this.state={
            roomCode: null, 
            roomCheck: false
        };
        this.renderHomePage = this.renderHomePage.bind(this);
    }

    async componentDidMount(){
        fetch('/api/user-in-room')
            .then(response=>response.json())
            .then(data=>{
                this.setState({
                    roomCode: data.code,
                    roomCheck: true,
                });
            });
    }

    renderHomePage() {
        return (
            <ThemeProvider theme={darkTheme}>
                <Grid container spacing={3} sx={{ width: "100%" }} display="flex" justifyContent="center" alignItems="center">
                    <Box sx={{ paddingX: "20px", paddingY: "40px", background: "#1d1b28", borderRadius: "8px" }}>
                        <Typography variant="h3" sx={{ fontFamily: "Inter", fontWeight: "700", fontStyle: "italic", textAlign: "center" }}>Supp!</Typography>
                        <Grid item xs={12} align="center" sx={{ marginTop: "15px", width: "100%", textAlign: "center" }}>
                            <Button item color="primary" sx={{ margin: "5px", width: "50%" }} variant="contained" to="/join" component={Link}>
                                Join Room
                            </Button>
                            <Button item color="warning" sx={{ margin: "5px" }} variant="contained" to="/create" component={Link}>
                                Create Room
                            </Button>
                        </Grid>
                    </Box>
                </Grid>
            </ThemeProvider>
        );
    }

    render() {
        return (<Router>
            <Routes>
                <Route path="/" element={
                    !this.state.roomCheck ? null : this.state.roomCode ? (<Navigate to={`/room/${this.state.roomCode}`} replace />) : (this.renderHomePage())
                 } /> {/* we call this.renderHomePage() and not this.renderHomePage as the function is not waiting for an event to occur to be called, it gets called immediately. */}
                <Route path="/join" element={<RoomJoinPage />} />
                <Route path="/create" element={<CreateRoomPage />} />
                <Route path="/room/:roomCode" element={<RoomWrapper />} />
            </Routes>
        </Router>)
    }
}