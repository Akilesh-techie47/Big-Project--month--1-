from flask import jsonify
from typing import Any, Optional


def success_response(data: Any = None, message: str = "Success", status_code: int = 200):
    response = {"success": True, "message": message}
    if data is not None:
        response["data"] = data
    return jsonify(response), status_code


def error_response(
    message: str = "An error occurred",
    error_code: str = "ERROR",
    status_code: int = 400,
    details: Any = None,
):
    response = {"success": False, "message": message, "error_code": error_code}
    if details is not None:
        response["details"] = details
    return jsonify(response), status_code


def validation_error_response(errors: dict, message: str = "Validation failed"):
    return error_response(message, "VALIDATION_ERROR", 422, errors)


def not_found_response(resource: str = "Resource"):
    return error_response(f"{resource} not found", "NOT_FOUND", 404)


def internal_error_response(message: str = "Internal server error"):
    return error_response(message, "INTERNAL_ERROR", 500)