import React,{Component} from 'react';
import '../stylesheet/styles.css';

class Init extends Component {
	constructor(props) {
		super(props);
		this.props.socket.on('receiveGamePin', function(pin) {
			this.props.OnHandleGetPin(pin);
		}.bind(this));
	}
	
	state = {
		server_PIN: "Enter PIN here",
		create_server: false,
		join_server: false,
	}

	handle_create_server = () =>  {
		this.props.socket.emit('checkGamePin');
		this.props.OnHandle_create_server(true);
	}
	handle_join_server = () => {
		this.props.OnHandle_join_server(true);
	}
	
	render(){
		return (
			<div className = "Init">
				<p>
					<button type = "primary" className = "button" onClick = {this.handle_create_server}> Create New Server </button>
					<p> or </p>
					<button className = "button" onClick = {this.handle_join_server}>Join Existing Server</button>
				</p>
			</div>
		);
	}
}

export default Init;
