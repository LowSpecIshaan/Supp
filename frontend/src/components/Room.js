import React, { Component } from "react";
import { useParams } from "react-router-dom";

function RoomWrapper(props) {
    const params = useParams();
    return <Room {...props} params={params} />;
}

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
    }

    getRoomInfo(){
        fetch("/api/room-info?code="+this.roomCode)
            .then(response=>response.json())
            .then(data=>{
                this.setState({
                    votesToSkip: data.votes_to_skip,
                    guestCanPause: data.guest_can_pause,
                    isHost: data.is_host,
                });
            });
    }

    render(){
        return (
            <div>
                <h1>{this.roomCode}</h1>
                <p>Votes: {this.state.votesToSkip}</p>
                <p>Guest Can Pause: {this.state.guestCanPause.toString()}</p>
                <p>Host?: {this.state.isHost.toString()}</p>
            </div>
        )
    }
};

export default RoomWrapper;