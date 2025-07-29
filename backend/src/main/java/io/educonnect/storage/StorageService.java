package io.educonnect.storage;

import io.educonnect.common.exception.BadRequestException;
import io.educonnect.common.exception.NotFoundException;
import io.educonnect.config.AppProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Stores uploaded files on the local filesystem (a Docker volume in production) under random names,
 * so user-supplied file names never reach the disk.
 */
@Slf4j
@Service
public class StorageService {

    private static final Pattern SAFE_EXTENSION = Pattern.compile("^[a-z0-9]{1,10}$");
    // SVG is deliberately excluded: it can embed scripts that would run on our origin.
    private static final Set<String> IMAGE_TYPES = Set.of("image/png", "image/jpeg", "image/gif", "image/webp");

    private final Path root;

    public StorageService(AppProperties properties) {
        this.root = Path.of(properties.storage().location()).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException ex) {
            throw new UncheckedIOException("Could not create storage directory " + root, ex);
        }
        log.info("File storage directory: {}", root);
    }

    public String store(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("The uploaded file is empty");
        }
        String storedName = UUID.randomUUID() + extensionOf(file.getOriginalFilename());
        try (InputStream input = file.getInputStream()) {
            Files.copy(input, resolve(storedName), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new UncheckedIOException("Could not store file", ex);
        }
        return storedName;
    }

    public String storeImage(MultipartFile file) {
        if (file.getContentType() == null || !IMAGE_TYPES.contains(file.getContentType())) {
            throw new BadRequestException("Only PNG, JPEG, GIF or WebP images are accepted");
        }
        return store(file);
    }

    public Resource load(String storedName) {
        Path path = resolve(storedName);
        if (!Files.isRegularFile(path)) {
            throw new NotFoundException("File " + storedName + " was not found");
        }
        return new FileSystemResource(path);
    }

    public void delete(String storedName) {
        if (!StringUtils.hasText(storedName)) {
            return;
        }
        try {
            Files.deleteIfExists(resolve(storedName));
        } catch (IOException ex) {
            log.warn("Could not delete stored file {}", storedName, ex);
        }
    }

    private Path resolve(String storedName) {
        Path path = root.resolve(storedName).normalize();
        if (!path.getParent().equals(root)) {
            throw new BadRequestException("Invalid file name");
        }
        return path;
    }

    private static String extensionOf(String originalName) {
        String extension = StringUtils.getFilenameExtension(originalName);
        if (extension == null) {
            return "";
        }
        extension = extension.toLowerCase(Locale.ROOT);
        return SAFE_EXTENSION.matcher(extension).matches() ? "." + extension : "";
    }
}
