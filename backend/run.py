import eventlet
eventlet.monkey_patch()
import logging

# Configure logging to show INFO and DEBUG logs in terminal
logging.basicConfig(
    level=logging.INFO,  # Change to logging.DEBUG for even more detail
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[
        logging.StreamHandler(),  # prints to terminal
        # logging.FileHandler("sentinel.log")  # uncomment to also write to a file
    ]
)

from app import create_app, socketio
from app.routes.socketIO import AlertsNamespace, start_bulk_sender, set_app

app = create_app()
set_app(app)
socketio.on_namespace(AlertsNamespace("/api/alerts/stream"))
start_bulk_sender()

if __name__ == "__main__":
    socketio.run(
        app,
        host="0.0.0.0",
        port=5000,
        debug=True,
        use_reloader=False
    )
