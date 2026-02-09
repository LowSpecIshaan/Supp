import React, { Component, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles"
import { Button, Grid, Typography, Box, FormControl, FormHelperText, FormControlLabel, RadioGroup, Radio, TextField } from "@mui/material"
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
            songLoaded: false,
            playing: false,
            searchQuery: "",
            searchResults: [],
            trackID: 2173060635,
        };
        this.roomCode = props.params.roomCode;
        this.searchRef = React.createRef();

        this.leaveRoom = this.leaveRoom.bind(this);
        this.showSettings = this.showSettings.bind(this);
        this.renderSettings = this.renderSettings.bind(this);
        this.renderSettingsButton = this.renderSettingsButton.bind(this);
    }

    componentWillUnmount() {
        document.removeEventListener("mousedown", this.handleClickOutside);

        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
    }

    componentDidMount() {
        this.getRoomInfo();

        document.addEventListener("mousedown", this.handleClickOutside);

        const script = document.createElement("script");
        script.src = "https://w.soundcloud.com/player/api.js";
        script.async = true;

        script.onload = () => {
            const iframe = document.getElementById("sc-player");

            if (window.SC && iframe) {
                this.widget = window.SC.Widget(iframe);

                this.widget.bind(window.SC.Widget.Events.PLAY, () => {
                    console.log("Play detected");

                    if (!this.state.isHost && !this.state.guestCanPause) {
                        return;
                    }

                    const requestOptions = {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            state: "play",
                            room_code: this.roomCode
                        })
                    };

                    fetch('/api/play-pause-song', requestOptions)
                        .then(response => response.json())
                });

                this.widget.bind(window.SC.Widget.Events.PAUSE, () => {
                    console.log("Pause detected");

                    if (!this.state.isHost && !this.state.guestCanPause) {
                        return;
                    }

                    const requestOptions = {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            state: "pause",
                            room_code: this.roomCode
                        })
                    };

                    fetch('/api/play-pause-song', requestOptions)
                        .then(response => response.json())
                });

                this.pollInterval = setInterval(async () => {
                    let data;

                    try {
                        const res = await fetch(`/api/current-playback?room_code=${this.roomCode}`);
                        if (!res.ok) return;
                        data = await res.json();   // ← REMOVE const
                    } catch (err) {
                        console.error("Polling error:", err);
                        return;
                    }

                    if (!data || !this.widget) return;

                    if (data.track_id && data.track_id !== this.state.trackID) {
                        this.setState({ trackID: data.track_id });

                        this.widget.load(
                            `https://api.soundcloud.com/tracks/${data.track_id}`,
                            { auto_play: data.state === "play" }
                        );

                        return;
                    }

                    this.widget.isPaused(paused => {
                        if (data.state === "play" && paused) this.widget.play();
                        if (data.state === "pause" && !paused) this.widget.pause();
                    });

                }, 2000);
            }
        };

        document.body.appendChild(script);
    }

    handleVotesChange = (e) => {
        this.setState({
            votesToSkip: e.target.value
        });
    }

    handleGuestCanPauseChange = (e) => {
        this.setState({
            guestCanPause: e.target.value === "true" ? true : false,
        });
    }

    handleSubmit = (e) => {
        e.preventDefault();

        const requestOptions = {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                votes_to_skip: this.state.votesToSkip,
                guest_can_pause: this.state.guestCanPause,
                code: this.roomCode
            })
        };
        fetch('/api/update-room-settings', requestOptions)
            .then(response => response.json())
            .then(data => {
                this.setState({
                    votesToSkip: data.votes_to_skip,
                    guestCanPause: data.guest_can_pause,
                });
                this.showSettings(false);
            });
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
                    trackID: data.track_id,
                    songLoaded: !!data.track_id,
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

    renderPlayer() {
        return (
            <Grid item xs={12} mt="10px" display="flex" justifyContent="center">
                <iframe
                    width="100%"
                    height="166"
                    allow="autoplay"
                    id="sc-player"
                    src={`https://w.soundcloud.com/player/?url=https://api.soundcloud.com/tracks/${this.state.trackID}&color=%23ff5500`}
                />
            </Grid>
        )
    }

    searchTracks = async (e) => {
        if (e) e.preventDefault();

        try {
            const res = await fetch(
                `/soundcloud/soundcloud-search?q=${encodeURIComponent(this.state.searchQuery)}`
            );

            const data = await res.json();

            this.setState({
                searchResults: data
            });
        } catch (err) {
            console.error("Search error:", err);
        }
    };

    renderSearch() {
        return (
            <>
                <Grid item xs={12} mt="10px" display="flex" justifyContent="center" component="form" onSubmit={this.searchTracks}>
                    <TextField
                        fullWidth
                        placeholder="Search SoundCloud..."
                        value={this.state.searchQuery}
                        onChange={(e) => this.setState({ searchQuery: e.target.value })}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        sx={{ mt: 1, margin: "3px" }}
                    >
                        Search
                    </Button>
                </Grid>
            </>
        )
    }

    selectTrack = async (trackId) => {
        try {
            await fetch("/api/select-track", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    track_id: trackId,
                    room_code: this.roomCode
                })
            });

            this.setState({
                searchResults: [],
                searchQuery: "",
                songLoaded: true,
                trackID: trackId,
            });

        } catch (err) {
            console.error("Track select failed:", err);
        }
    };

    handleClickOutside = (event) => {
        if (
            this.searchRef.current &&
            !this.searchRef.current.contains(event.target)
        ) {
            this.setState({ searchResults: [] });
        }
    };

    renderSettings() {
        return (
            <ThemeProvider theme={darkTheme}>
                <Grid container spacing={2} sx={{ width: "100%", height: "50vh", flexDirection: "column", marginTop: "25vh" }} display="flex" justifyContent="center" alignItems="center">
                    <Box component="form" onSubmit={this.handleSubmit} sx={{ paddingY: "20px", background: "#1d1b28", borderRadius: "8px" }}>
                        <Grid item xs={12} sx={{ width: "100%", textAlign: "center" }}>
                            <Typography sx={{ fontFamily: "Inter", fontWeight: "700" }} component="h4" variant="h4">Room Settings</Typography>
                        </Grid>
                        <Grid item xs={12} sx={{ width: "100%", textAlign: "center" }}>
                            <FormControl component="fieldset">
                                <FormHelperText sx={{ display: "flex", justifyContent: "center" }}>
                                    <div align="center">Guest Control of Playback State</div>
                                </FormHelperText>
                                <RadioGroup row defaultValue={this.state.guestCanPause.toString()} onChange={this.handleGuestCanPauseChange}>
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
                                    <TextField required={true} type="number" sx={{ marginTop: "20px" }} onChange={this.handleVotesChange} defaultValue={this.state.votesToSkip} slotProps={{ htmlInput: { min: 1, style: { textAlign: "center" } } }} />
                                    <FormHelperText>
                                        <div align="center">Votes Required to Skip the Song</div>
                                    </FormHelperText>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} align="center" sx={{ marginTop: "15px" }}>
                                <Button type="submit" item color="primary" sx={{ margin: "5px", width: "50%" }} variant="contained">
                                    Save Settings
                                </Button>
                                <Button item color="warning" sx={{ margin: "5px" }} variant="contained" onClick={() => this.showSettings(false)}>
                                    Close Settings
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>
            </ThemeProvider>
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
                                <Typography textAlign="center" component="h6" variant="h6" sx={{ fontFamily: "Inter", fontWeight: "700" }}>Guests can Pause: {this.state.guestCanPause.toString()}</Typography>
                                <Typography textAlign="center" component="h6" variant="h6" sx={{ fontFamily: "Inter", fontWeight: "700" }}>Votes to Skip: {this.state.votesToSkip}</Typography>
                            </Grid>
                            <Box sx={{ position: "relative", width: "100%" }} ref={this.searchRef}>
                                {this.state.isHost ? this.renderSearch() : null}
                                {this.state.searchResults.length > 0 && (
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            top: "100%",
                                            left: 0,
                                            width: "95%",
                                            bgcolor: "#f4f4f4",
                                            borderRadius: "8px",
                                            boxShadow: 3,
                                            zIndex: 50,
                                            maxHeight: "300px",
                                            overflowY: "auto",
                                            mt: 1,
                                            p: 1,
                                        }}
                                    >
                                        {this.state.searchResults.map(track => (
                                            <Button key={track.id} onClick={() => this.selectTrack(track.id)} sx={{ width: "100%" }}>
                                                <Box sx={{ mb: 1 }}>
                                                    <Typography sx={{ color: "#1d1b28" }}>{track.title}</Typography>
                                                    <Typography variant="caption" sx={{ color: "#1d1b28" }}>
                                                        {track.artist}
                                                    </Typography>
                                                </Box>
                                            </Button>
                                        ))}
                                    </Box>
                                )}
                            </Box>

                            {this.renderPlayer()}
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