import React,{Component} from 'react';
import './homepage.css'

class Init extends Component {
	state = {
		server_PIN: "Enter PIN here",
		create_server: false,
		join_server: false,
	}

	handle_create_server = () =>  {
		this.props.socket.emit('checkGamePin');
		this.props.socket.on('receiveGamePin', function(pin) {
			this.props.OnHandleGetPin(pin);
		}.bind(this));
		this.props.OnHandle_create_server(true);
	}
	handle_join_server = () => {
		this.props.OnHandle_join_server(true);
	}
	
	render(){
		return (
			<div className="Init">
				<button type = "primary" className = "button" onClick = {this.handle_create_server}> Create New Server </button>
				<br/>
				<p className = "para"> or </p>
				{/*}<input type = "text" className = "textfield" value = {this.state.server_PIN} onChange={(e) => {this.setState({server_PIN: e.target.value})}}></input>
				{*/}
				<button className = "button" onClick = {this.handle_join_server}>Join Existing Server</button>
			</div>
		);
	}
}

export default Init;
