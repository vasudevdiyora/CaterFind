package org.caterfind.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.UNAUTHORIZED)
public class InvalidTokenException extends RuntimeException {
    public InvalidTokenException() { super(); }
    public InvalidTokenException(String message) { super(message); }
    public InvalidTokenException(String message, Throwable cause) { super(message, cause); }
}
