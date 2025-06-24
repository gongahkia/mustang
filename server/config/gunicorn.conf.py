import multiprocessing
import gevent.monkey
gevent.monkey.patch_all()

bind = '0.0.0.0:5000'
backlog = 2048

workers = multiprocessing.cpu_count() * 2 + 1
worker_class = 'gevent'
worker_connections = 1000
timeout = 30
keepalive = 2

limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

accesslog = '-'
errorlog = '-'
loglevel = 'warning'

preload_app = True
max_requests = 1000
max_requests_jitter = 50