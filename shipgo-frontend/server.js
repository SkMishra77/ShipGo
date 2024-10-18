const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const WebSocket = require('ws');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = createServer((req, res) => {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins (change to specific origin in production)
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        // Preflight request handling
        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        const parsedUrl = parse(req.url, true);

        // Check for SSE endpoint
        if (parsedUrl.pathname === '/sse') {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const sendLocationUpdate = () => {
                const lat = (Math.random() * (37.6 - 8.4) + 8.4).toFixed(6);
                const lng = (Math.random() * (97.25 - 68.7) + 68.7).toFixed(6);

                const data = JSON.stringify({
                    action: "location_update",
                    lat: parseFloat(lat),
                    lng: parseFloat(lng),
                });

                res.write(`data: ${data}\n\n`); // Send the data to the client
            };

            const intervalId = setInterval(sendLocationUpdate, 10000);

            req.on('close', () => {
                clearInterval(intervalId);
                console.log('SSE client disconnected');
            });

            res.write(`data: SSE connection established\n\n`);
            return; // End response handling for SSE
        }

        // Handle other requests
        handle(req, res, parsedUrl);
    });

    // WebSocket setup
    const wss = new WebSocket.Server({ server });

    // Booking data to send
    const bookingData = {
        "BookingId": 7252683657830506496,
        "UserId": "U100",
        "DriverId": "D103",
        "origin": [
            26.4499,
            80.3319
        ],
        "destination": [
            40.748817,
            -73.985428
        ],
        "action": "booking-accept"
    };

    wss.on('connection', (ws, req) => {
        const query = parse(req.url, true).query;
        const driverId = query.driverId;

        console.log('New client connected', driverId);

        // If driverId exists, send booking data every 5 seconds
        if (driverId) {
            const intervalId = setInterval(() => {
                ws.send(JSON.stringify(bookingData));
            }, 5000); // Send every 5 seconds

            // Cleanup when the connection is closed
            ws.on('close', () => {
                clearInterval(intervalId);
                console.log('Client disconnected');
            });
        }

        // Handle incoming messages
        ws.on('message', (message) => {
            console.log(`Received message: ${message}`);

            // Parse the incoming message
            let parsedMessage;
            try {
                parsedMessage = JSON.parse(message);
            } catch (e) {
                console.error('Error parsing message:', e);
                return; // If there's an error, exit early
            }

            // Check for action: "booking"
            if (parsedMessage.action === 'booking') {
                // Send the booking data in response
                ws.send(JSON.stringify(bookingData));
            }
        });
    });

    server.listen(4000, (err) => {
        if (err) throw err;
        console.log('> Ready on http://localhost:4000');
    });
});
