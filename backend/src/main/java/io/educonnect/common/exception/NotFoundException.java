package io.educonnect.common.exception;

public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }

    public static NotFoundException of(String entity, Object id) {
        return new NotFoundException(entity + " with id " + id + " was not found");
    }
}
