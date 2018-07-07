import React,{Component} from 'react'
import './homepage.css'

class JoinServer extends Component{
	state = {
		pinNo: "",
	};

	stateChange = (event) => {
		this.setState({pinNo: event.target.value});
	};

	//buggy due to callback functions
	joinServer = () => {
		var successful,GameType;
		this.props.socket.emit('connectToRoom', this.state.pinNo);
		this.props.socket.on('AuthSuccess', function(data) {
			//console.log('Success in joining server ' + this.state.pinNo)
			this.props.OnHandle_GameType(data.gametype);
			this.props.OnHandle_server_created(true);
			this.props.OnHandle_create_server(true);
		}.bind(this));

		this.props.socket.on('AuthFail', (reason) => {
			alert('Failed to connect. Reason: ' + reason);
			window.location.reload(true);
		});
	}

	render() {
		return (
			<div className>
				<p>Enter the server PIN:</p>
				<input type = "text" onChange = {this.stateChange}/>
				<button className = "button" onClick = {this.joinServer}> Submit </button>
			</div>
		);
	}
}

export default JoinServer;
