#!/usr/bin/env python3

import os
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
import subprocess
from socketserver import ThreadingMixIn
import argparse
import mimetypes


parser = argparse.ArgumentParser(description='Simple Threaded HTTP server to run linux-dash.')
parser.add_argument('--port', metavar='PORT', type=int, nargs='?', default=80,
                    help='Port to run the server on.')

modulesSubPath = '/server/linux_json_api.sh'
appRootPath = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    pass

class MainHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            data = b''
            contentType = 'text/html'
            if self.path.startswith("/server/"):
                module = self.path.split('=')[1]
                output = subprocess.Popen(
                    appRootPath + modulesSubPath + " " + module,
                    shell=True,
                    stdout=subprocess.PIPE)
                data = output.communicate()[0]
            else:
                if self.path == '/':
                    self.path = 'index.html'
                safePath = self.path.split('?', 1)[0].lstrip('/')
                filePath = os.path.join(appRootPath, safePath)
                f = open(filePath, 'rb')
                data = f.read()
                contentType = mimetypes.guess_type(filePath)[0] or 'application/octet-stream'
                f.close()
            self.send_response(200)
            self.send_header('Content-type', contentType)
            self.end_headers()
            self.wfile.write(data)

        except IOError:
            self.send_error(404, 'File Not Found: %s' % self.path)

if __name__ == '__main__':
    args = parser.parse_args()
    server = ThreadedHTTPServer(('0.0.0.0', args.port), MainHandler)
    print('Starting server on 0.0.0.0:{}, use <Ctrl-C> to stop'.format(args.port))
    server.serve_forever()
