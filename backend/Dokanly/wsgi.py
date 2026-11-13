"""
WSGI config for Dokanly project.

It exposes the WSGI callable as a module-level variable named ``application``
(and ``app`` for legacy serverless runners).
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Dokanly.settings')

application = get_wsgi_application()
app = application
