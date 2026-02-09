import React, { Component } from "react";
import { createRoot } from "react-dom/client";
import { TextField, Button, Grid, Typography, Box, FormControl, FormHelperText, FormControlLabel } from "@mui/material"
import { ThemeProvider, createTheme } from "@mui/material/styles"
import { Link, useNavigate } from "react-router-dom";

const darkTheme = createTheme({
    palette: {
        mode: "dark",
    },
});

class RoomJoinPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            roomCode: "",
            error: ""
        };
        this.handleCodeChange = this.handleCodeChange.bind(this);
        this.handleJoinRoom = this.handleJoinRoom.bind(this);
    }

    handleCodeChange(e) {
        this.setState({
            roomCode: e.target.value
        });
    }

    handleJoinRoom(e) {
        e.preventDefault();

        const requestOptions = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                code: this.state.roomCode
            })
        };
        fetch('/api/join-room', requestOptions)
            .then(response => {
                if (response.ok) {
                    this.props.navigate("/room/" + this.state.roomCode.toUpperCase());
                } else {
                    this.setState({
                        error: "Room Not Found."
                    });
                }
            });
    }

    render() {
        return (
            <ThemeProvider theme={darkTheme}>
                <Grid container spacing={2} sx={{ width: "100%", height: "50vh", flexDirection: "column", marginTop: "25vh" }} display="flex" justifyContent="center" alignItems="center">
                    <Box component="form" onSubmit={this.handleJoinRoom} sx={{ paddingY: "20px", background: "#1d1b28", borderRadius: "8px" }}>
                        <Grid item xs={12} sx={{ width: "100%", textAlign: "center" }}>
                            <Typography sx={{ fontFamily: "Inter", fontWeight: "700" }} component="h4" variant="h4">Join a Room</Typography>
                        </Grid>
                        <Grid item xs={12} sx={{ width: "100%", textAlign: "center" }}>
                            <Grid item xs={12} align="center">
                                <FormControl>
                                    <TextField placeholder="Enter Room Code" required={true} onChange={this.handleCodeChange} type="text" sx={{
                                        marginTop: "20px", "& input:-webkit-autofill": {
                                            WebkitBoxShadow: "0 0 0 100px transparent inset",
                                            WebkitTextFillColor: "white",
                                            transition: "background-color 9999s ease-in-out 0s",
                                        },
                                    }} slotProps={{ htmlInput: { style: { textAlign: "center" } } }} />
                                    <FormHelperText sx={{ color: "#ff5d39" }}>
                                        <div align="center">{this.state.error}</div>
                                    </FormHelperText>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} align="center" sx={{ marginTop: "15px" }}>
                                <Button type="submit" item color="primary" sx={{ margin: "5px", width: "40%" }} variant="contained">
                                    Join Room
                                </Button>
                                <Button item color="secondary" sx={{ margin: "5px" }} variant="contained" to="/create" component={Link}>
                                    Create New Room
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>
            </ThemeProvider>
        );
    }
}

export default function JoinRoomPageWrapper(props) {
    const navigate = useNavigate();
    return <RoomJoinPage {...props} navigate={navigate} />;
}