from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass


if __name__ == "__main__":
    web_dir = Path(__file__).resolve().parent
    handler = lambda *args, **kwargs: QuietHandler(*args, directory=str(web_dir), **kwargs)
    server = ThreadingHTTPServer(("127.0.0.1", 8000), handler)
    server.serve_forever()
