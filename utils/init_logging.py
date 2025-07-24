# init_logging.py
import os
import logging.config


def setup_logging():
    root_dir = os.path.dirname(os.path.dirname(__file__))
    log_dir = os.path.join(root_dir, 'logs')
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    logging.config.fileConfig('config/logging_config.ini', encoding='utf-8')
