package org.caterfind.controller;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Map;

import org.caterfind.exception.InvalidTokenException;
import org.caterfind.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleAll(Exception ex) {
        logger.error("Unhandled exception: {}", ex.getMessage(), ex);
        StringWriter sw = new StringWriter();
        ex.printStackTrace(new PrintWriter(sw));
        String stackTrace = sw.toString();

        Map<String, Object> body = Map.of(
            "success", false,
            "error", ex.getMessage() == null ? "(no message)" : ex.getMessage(),
            "trace", stackTrace
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
        logger.info("Resource not found: {}", ex.getMessage());
        Map<String, Object> body = Map.of(
            "success", false,
            "error", ex.getMessage() == null ? "Not Found" : ex.getMessage()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(IllegalArgumentException ex) {
        logger.info("Bad request: {}", ex.getMessage());
        Map<String, Object> body = Map.of(
            "success", false,
            "error", ex.getMessage() == null ? "Bad Request" : ex.getMessage()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(InvalidTokenException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidToken(InvalidTokenException ex) {
        logger.info("Invalid token: {}", ex.getMessage());
        Map<String, Object> body = Map.of(
            "success", false,
            "error", ex.getMessage() == null ? "Invalid token" : ex.getMessage()
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }
}
