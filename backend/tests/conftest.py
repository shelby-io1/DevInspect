"""pytest configuration for backend tests."""
import os
import sys

# Ensure the backend directory is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
