namespace Service;

public class InvalidInputException(string message) : Exception(message);
public class ForbiddenException(string message = "Forbidden") : Exception(message);
public class NotFoundException(string message = "Not found") : Exception(message);
public class ConflictException(string message) : Exception(message);