import React, { Component } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles"
import { Button, Grid, Typography, Box, FormControl, FormHelperText, FormControlLabel } from "@mui/material"
import CreateRoomPageWrapper from "./CreateRoomPage";

function RoomWrapper(props) {
    const params = useParams();
    const navigate = useNavigate();
    return <Room {...props} params={params} navigate={navigate} />;
}

const darkTheme = createTheme({
    palette: {
        mode: "dark",
    },
});

class Room extends Component {
    constructor(props) {
        super(props);
        this.state = {
            votesToSkip: 2,
            guestCanPause: true,
            isHost: false,
            settings: false,
        };
        this.roomCode = props.params.roomCode;

        this.leaveRoom = this.leaveRoom.bind(this);
        this.showSettings = this.showSettings.bind(this);
        this.renderSettings = this.renderSettings.bind(this);
        this.renderSettingsButton = this.renderSettingsButton.bind(this);
    }

    componentDidMount(){
        this.getRoomInfo();
    }

    getRoomInfo() {
        fetch("/api/room-info?code=" + this.roomCode)
            .then(response => {
                if (response.status === 404) {
                    this.props.navigate("/");
                    return null;
                }
                return response.json();
            })
            .then(data => {
                if (!data) return;

                this.setState({
                    votesToSkip: data.votes_to_skip,
                    guestCanPause: data.guest_can_pause,
                    isHost: data.is_host,
                });
            });
    }

    leaveRoom() {
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        }

        fetch('/api/leave-room', requestOptions)
            .then(response => {
                this.props.navigate("/");
            });
    }

    showSettings(value) {
        this.setState({
            settings: value,
        });
    }

    renderSettingsButton() {
        return (
            <Grid item xs={12} marginTop="10px" display="flex" justifyContent="center" >
                <Button item color="secondary" variant="contained" onClick={() => this.showSettings(true)}>
                    Settings
                </Button>
            </Grid>
        )
    }

    renderSettings() {
        return (
            <Grid container spacing={1} sx={{width: "100%"}}>
                <Grid item xs={12} sx={{width: "100%"}} display="flex" justifyContent="center" alignItems="center">
                    <CreateRoomPageWrapper update={true} votesToSkip={this.state.votesToSkip} guestCanPause={this.state.guestCanPause} roomCode={this.roomCode} updateCallback={() => { }} />
                </Grid>
                <Grid item xs={12}>
                    <Button item color="warning" sx={{ margin: "5px" }} variant="contained" onClick={() => this.showSettings(false)}>
                        Close Settings
                    </Button>
                </Grid>
            </Grid>
        );
    }

    render() {
        if (this.state.settings) {
            return (<ThemeProvider theme={darkTheme}>{this.renderSettings()}</ThemeProvider>);
        } else {
            return (
                <ThemeProvider theme={darkTheme}>
                    <Grid container spacing={1} display="flex" sx={{ width: "100%", flexDirection: "column" }} justifyContent="center" alignItems="center">
                        <Box sx={{ paddingX: "20px", paddingY: "40px", background: "#1d1b28", borderRadius: "8px" }}>
                            <Grid item xs={12} alignItems="center">
                                <Typography textAlign="center" component="h4" variant="h4" sx={{ fontFamily: "Inter", fontWeight: "700" }}>{this.roomCode}</Typography>
                            </Grid>
                            {this.state.isHost ? this.renderSettingsButton() : null}
                            <Grid item xs={12} marginTop="10px" display="flex" justifyContent="center">
                                <Button item color="warning" sx={{ margin: "5px" }} variant="contained" onClick={this.leaveRoom}>
                                    Leave Room
                                </Button>
                            </Grid>
                        </Box>
                    </Grid>
                </ThemeProvider>
            )
        }
    }
};

export default RoomWrapper;