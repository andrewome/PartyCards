import React,{Component} from 'react';
import io from 'socket.io-client'

// Make client connection to server
const socket = io('http://localhost:1520');