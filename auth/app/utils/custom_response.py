def res_func(status, message, status_code):
    return {
        "error": True if status == 0 else False,
        "data": message,
        "status_code": status_code,
    }
