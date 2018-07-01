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
		var successful;
		this.props.socket.emit('connectToRoom', this.state.pinNo);
		this.props.socket.on('AuthSuccess', () => {
			alert('Successful');
		});
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
