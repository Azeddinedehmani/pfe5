import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import SockJS from 'sockjs-client';
import * as Stomp from '@stomp/stompjs';
import { FaBell } from 'react-icons/fa';
import '../styles/notification.css';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const stompClient = useRef(null);
  const dropdownRef = useRef(null);

  // Fetch notifications and setup WebSocket on component mount
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    setupWebSocket();

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      
      // Disconnect WebSocket
      if (stompClient.current && stompClient.current.connected) {
        stompClient.current.disconnect();
      }
    };
  }, [user]);

  // Setup WebSocket connection
  const setupWebSocket = () => {
    const socket = new SockJS('/ws');
    const client = Stomp.over(socket);
    
    client.connect({
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }, () => {
      //