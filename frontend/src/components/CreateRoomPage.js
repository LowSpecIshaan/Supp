import React, { Component } from "react";
import { createRoot } from "react-dom/client";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import FormHelperText from "@mui/material/FormHelperText";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Box from '@mui/material/Box';
import { Link, useNavigate } from "react-router-dom";

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const darkTheme = createTheme({
    palette: {
        mode: "dark",
    },
});

class CreateRoomPage extends Component {
    defaultVotes = 2;

    constructor(props) {
        super(props);
        this.state = {
            guestCanPause: true,
            votesToSkip: this.defaultVotes,
        };

        this.handleRoomButtonPressed = this.handleRoomButtonPressed.bind(this);
        this.handleVotesChange = this.handleVotesChange.bind(this);
        this.handleGuestCanPauseChange = this.handleGuestCanPauseChange.bind(this);
    }

    handleVotesChange(e) {
        this.setState({
            votesToSkip: e.target.value,
        });
    }

    handleGuestCanPauseChange(e) {
        this.setState({
            guestCanPause: e.target.value === 'true' ? true : false
        })
    }

    handleRoomButtonPressed(e){
        e.preventDefault();

        const requestOptions = {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                votes_to_skip: this.state.votesToSkip,
                guest_can_pause: this.state.guestCanPause
            })
        };
        fetch('/api/create-room', requestOptions)
            .then(response=>response.json())
            .then(data=>this.props.navigate("/room/"+data.code));
    }

    render() {
        return (
            <ThemeProvider theme={darkTheme}>
                <Grid container spacing={2} sx={{ width: "100%", height: "50vh", flexDirection: "column", marginTop: "25vh" }} display="flex" justifyContent="center" alignItems="center">
                    <Box component="form" onSubmit={this.handleRoomButtonPressed} sx={{ paddingY: "20px", background: "#1d1b28", borderRadius: "8px" }}>
                        <Grid item xs={12} sx={{ width: "100%", textAlign: "center" }}>
                            <Typography sx={{fontFamily: "Inter", fontWeight: "700"}} component="h4" variant="h4">Create a Room</Typography>
                        </Grid>
                        <Grid item xs={12} sx={{ width: "100%", textAlign: "center" }}>
                            <FormControl component="fieldset">
                                <FormHelperText sx={{ display: "flex", justifyContent: "center" }}>
                                    <div align="center">Guest Control of Playback State</div>
                                </FormHelperText>
                                <RadioGroup row defaultValue='true' onChange={this.handleGuestCanPauseChange}>
                                    <FormControlLabel
                                        value='true'
                                        control={<Radio color="primary" />}
                                        label="Play/Pause"
                                        labelPlacement="bottom" />
                                    <FormControlLabel
                                        value='false'
                                        control={<Radio color="warning" />}
                                        label="No Control"
                                        labelPlacement="bottom" />
                                </RadioGroup>
                            </FormControl>
                            <Grid item xs={12} align="center">
                                <FormControl>
                                    <TextField required={true} type="number" sx={{ marginTop: "20px" }} onChange={this.handleVotesChange} default={this.defaultVotes} slotProps={{ htmlInput: { min: 1, style: { textAlign: "center" } } }} />
                                    <FormHelperText>
                                        <div align="center">Votes Required to Skip the Song</div>
                                    </FormHelperText>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} align="center" sx={{ marginTop: "15px" }}>
                                <Button type="submit" item color="primary" sx={{ margin: "5px", width: "50%" }} variant="contained">
                                    Create Room
                                </Button>
                                <Button item color="warning" sx={{ margin: "5px" }} variant="contained" to="/join" component={Link}>
                                    Join Room Instead
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>
            </ThemeProvider>);
    }
}

function CreateRoomPageWrapper(props) {
    const navigate = useNavigate();
    return <CreateRoomPage {...props} navigate={navigate} />;
}

export default CreateRoomPageWrapper;