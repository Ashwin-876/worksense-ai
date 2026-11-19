import os
import csv
import time
from datetime import datetime

def setup_logger(log_file):
    log_dir = os.path.dirname(log_file)
    if log_dir:
        os.makedirs(log_dir, exist_ok=True)
    file_exists = os.path.exists(log_file) and os.path.getsize(log_file) > 0
    if not file_exists:
        with open(log_file, mode='a', newline='') as file:
            writer = csv.writer(file)
            writer.writerow(['Date', 'Start Time', 'End Time', 'Duration (seconds)', 'Status'])

def log_session(log_file, start_timestamp, end_timestamp, duration, status):
    log_dir = os.path.dirname(log_file)
    if log_dir:
        os.makedirs(log_dir, exist_ok=True)
    with open(log_file, mode='a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([
            datetime.fromtimestamp(start_timestamp).date(), 
            datetime.fromtimestamp(start_timestamp).strftime('%H:%M:%S'),
            datetime.fromtimestamp(end_timestamp).strftime('%H:%M:%S'),
            round(duration), 
            status
        ])
