import React, { Component, useEffect } from "react";
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
        this.state = {
            roomCode: null,
            roomCheck: false
        };
        this.renderHomePage = this.renderHomePage.bind(this);
    }

    async componentDidMount() {
        fetch('/api/user-in-room')
            .then(response => response.json())
            .then(data => {
                this.setState({
                    roomCode: data.code,
                    roomCheck: true,
                });
            });
    }

    leaveRoomHome = () => {
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        }

        return fetch('/api/leave-room', requestOptions)
            .then(response => {
                response.json();
                alert("Left the previously joined room.");
            });
    }

    renderHomePage() {
        return (
            <ThemeProvider theme={darkTheme}>
                <Grid container spacing={3} sx={{ width: "100%" }} display="flex" justifyContent="center" alignItems="center">
                    <Box sx={{ paddingX: "20px", paddingY: "40px", background: "#1d1b28", borderRadius: "8px" }}>
                        <Typography variant="h3" sx={{ fontFamily: "Inter", fontWeight: "700", fontStyle: "italic", textAlign: "center" }}>Supp!</Typography>
                        <Grid item xs={12} align="center" sx={{ marginTop: "15px", width: "100%", textAlign: "center" }}>
                            <Button item color="primary" sx={{ margin: "5px", width: "60%" }} variant="contained" to="/join" component={Link}>
                                Join Room
                            </Button><br />
                            <Button item color="secondary" sx={{ margin: "5px" }} variant="contained" to="/create" component={Link}>
                                Create Room
                            </Button><br />
                            <Button item color="success" sx={{ margin: "5px" }} variant="contained" target="_blank" to="https://www.linkedin.com/posts/ishaangupta3112_the-soundcloud-api-doesnt-really-get-along-activity-7425654671706464256-HO7u?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEouVh4BZpYNhujx7Rsg9qV5EYk1EZIGm14" component={Link}>
                                Demo Link
                            </Button>
                            <Typography sx={{fontSize: "11px", marginTop: "10px", opacity: "0.5"}}>Note: You would need to sign in with<br /> SoundCloud in order to create a room.</Typography>
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
                    <Home roomCode={this.state.roomCode} roomCheck={this.state.roomCheck}
                        renderHomePage={this.renderHomePage}
                        leaveRoomHome={this.leaveRoomHome} />
                } /> {/* we call this.renderHomePage() and not this.renderHomePage as the function is not waiting for an event to occur to be called, it gets called immediately. */}
                <Route path="/join" element={<RoomJoinPage />} />
                <Route path="/create" element={<CreateRoomPage />} />
                <Route path="/room/:roomCode" element={<RoomWrapper />} />
            </Routes>
        </Router>)
    }
}

function Home({ renderHomePage, leaveRoomHome, roomCode, roomCheck }) {
    const navigate = useNavigate();

    useEffect(() => {
        if (roomCheck && roomCode) {
            leaveRoomHome().then(() => {
                navigate("/");
            });
        }
    }, [roomCode, leaveRoomHome, navigate]);


    return renderHomePage();
}
