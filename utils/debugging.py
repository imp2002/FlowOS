import traceback


def log_error(e,msg):
    print(msg,str(e))
    traceback.print_exc()