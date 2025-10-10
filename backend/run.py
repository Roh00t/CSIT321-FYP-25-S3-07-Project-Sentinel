import eventlet
eventlet.monkey_patch()
from app import create_app, socketio
from app.routes.socketIO import AlertsNamespace, start_bulk_sender

app = create_app()
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
