import React, { Component } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles"
import { Button, Grid, Typography, Box, FormControl, FormHelperText, FormControlLabel } from "@mui/material"

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
            isHost: false
        };
        this.roomCode = props.params.roomCode;
        this.getRoomInfo();

        this.leaveRoom = this.leaveRoom.bind(this);
    }

    getRoomInfo() {
        fetch("/api/room-info?code=" + this.roomCode)
            .then(response => {
                if(response.status === 404){
                    this.props.navigate("/");
                    return null;
                }
                return response.json();
            })
            .then(data => {
                if(!data) return;

                this.setState({
                    votesToSkip: data.votes_to_skip,
                    guestCanPause: data.guest_can_pause,
                    isHost: data.is_host,
                });
            });
    }

    leaveRoom(){
        const requestOptions = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
        }

        fetch('/api/leave-room', requestOptions)
            .then(response=>{
                this.props.navigate("/");
            });
    }

    render() {
        return (
            <ThemeProvider theme={darkTheme}>
                <Grid container spacing={1} display="flex" sx={{ width: "100%", flexDirection: "column" }} justifyContent="center" alignItems="center">
                    <Box sx={{ paddingX: "20px", paddingY: "40px", background: "#1d1b28", borderRadius: "8px" }}>
                        <Grid item xs={12} alignItems="center">
                            <Typography textAlign="center" component="h4" variant="h4" sx={{ fontFamily: "Inter", fontWeight: "700" }}>{this.roomCode}</Typography>
                        </Grid>
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
};

export default RoomWrapper;